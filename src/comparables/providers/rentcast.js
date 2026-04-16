const { URL } = require("url");

const RENTCAST_BASE_URL = "https://api.rentcast.io/v1";

async function getComparables(input) {
  const apiKey = process.env.RENTCAST_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing RENTCAST_API_KEY. Create a RentCast API key and set it in your environment before running HomeChekr."
    );
  }

  const strategies = buildSearchStrategies(input);
  let comparables = [];

  for (const strategy of strategies) {
    const listingResults = await fetchListings(strategy, apiKey);
    comparables = listingResults
      .map((listing) => normalizeListing(listing, input))
      .filter(Boolean)
      .filter((listing) => isComparableEnough(listing, input));

    if (comparables.length >= 3) {
      break;
    }
  }

  return {
    provider: "RentCast",
    status: "live",
    comparables
  };
}

function normalizeListing(listing, input) {
  const price = firstNumber(listing.price, listing.listPrice, listing.lastSalePrice, listing.formattedPrice);
  const bedrooms = firstNumber(listing.bedrooms);
  const bathrooms = firstNumber(listing.bathrooms);
  const lotSize = firstNumber(listing.lotSize, listing.lotSizeSquareFeet, listing.lotSquareFootage);
  const squareFootage = firstNumber(listing.squareFootage, listing.livingArea, listing.area);
  const daysOnMarket =
    firstNumber(listing.daysOnMarket, listing.daysOld, listing.dom) || deriveDaysOnMarket(listing);

  if (!price || !bedrooms || !bathrooms) {
    return null;
  }

  const address = buildAddress(listing, input);
  const distanceMiles = estimateDistanceMiles(listing);
  const listingUrl = firstString(listing.url, listing.listingUrl, listing.detailUrl, listing.propertyUrl);

  return {
    source: "RentCast",
    address,
    price,
    bedrooms,
    bathrooms,
    propertyType: firstString(listing.propertyType),
    lotSize,
    squareFootage,
    distanceMiles,
    daysOnMarket,
    listingUrl
  };
}

function buildSearchStrategies(input) {
  return [
    {
      zipCode: input.zip,
      status: "Active",
      bedrooms: buildRange(input.bedrooms, 0.5, 1),
      bathrooms: buildRange(input.bathrooms, 0.4, 1),
      squareFootage: buildRange(input.squareFootage, 0.2, 400),
      price: buildRange(input.price + (input.repairsCost || 0), 0.22, 90000),
      daysOld: "1:365",
      limit: "25"
    },
    {
      zipCode: input.zip,
      status: "Active",
      bedrooms: buildRange(input.bedrooms, 0.75, 2),
      bathrooms: buildRange(input.bathrooms, 0.5, 1),
      squareFootage: buildRange(input.squareFootage, 0.3, 600),
      price: buildRange(input.price + (input.repairsCost || 0), 0.4, 150000),
      daysOld: "1:365",
      limit: "35"
    },
    {
      zipCode: input.zip,
      status: "Active",
      bedrooms: buildRange(input.bedrooms, 1, 2),
      bathrooms: buildRange(input.bathrooms, 0.75, 1.5),
      squareFootage: buildRange(input.squareFootage, 0.45, 900),
      daysOld: "1:540",
      limit: "50"
    },
    {
      zipCode: input.zip,
      status: "Active",
      daysOld: "1:540",
      limit: "50"
    }
  ];
}

async function fetchListings(strategy, apiKey) {
  const url = new URL(`${RENTCAST_BASE_URL}/listings/sale`);

  Object.entries(strategy).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const errorText = await safeReadText(response);
    throw new Error(`RentCast request failed with ${response.status}: ${errorText || "No details returned"}`);
  }

  const payload = await response.json();
  return Array.isArray(payload) ? payload : Array.isArray(payload.value) ? payload.value : [];
}

function isComparableEnough(listing, input) {
  if (!listing.squareFootage || !listing.price) {
    return false;
  }

  const bedroomGap = Math.abs((listing.bedrooms || 0) - input.bedrooms);
  const bathroomGap = Math.abs((listing.bathrooms || 0) - input.bathrooms);
  const squareFootGapPct = Math.abs(listing.squareFootage - input.squareFootage) / Math.max(input.squareFootage, 1);
  const effectivePrice = input.price + (input.repairsCost || 0);
  const priceGapPct = Math.abs(listing.price - effectivePrice) / Math.max(effectivePrice, 1);

  return bedroomGap <= 2 && bathroomGap <= 2 && squareFootGapPct <= 0.65 && priceGapPct <= 0.8;
}

function buildAddress(listing, input) {
  return (
    firstString(
      listing.formattedAddress,
      listing.addressLine1,
      listing.address,
      listing.streetAddress
    ) ||
    `${input.city}, ${input.zip}`
  );
}

function estimateDistanceMiles(listing) {
  return firstNumber(listing.distance, listing.distanceMiles);
}

function buildRange(centerValue, percentPadding, minPadding) {
  const padding = Math.max(Math.round(centerValue * percentPadding), minPadding);
  const min = Math.max(Math.round(centerValue - padding), 0);
  const max = Math.round(centerValue + padding);
  return `${min}:${max}`;
}

function firstNumber(...values) {
  for (const value of values) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

async function safeReadText(response) {
  try {
    return await response.text();
  } catch (error) {
    return "";
  }
}

function deriveDaysOnMarket(listing) {
  const listedDate = firstString(listing.listedDate, listing.createdDate);

  if (!listedDate) {
    return 0;
  }

  const listedTimestamp = Date.parse(listedDate);

  if (Number.isNaN(listedTimestamp)) {
    return 0;
  }

  const elapsedMs = Date.now() - listedTimestamp;
  return Math.max(Math.round(elapsedMs / 86400000), 0);
}

module.exports = {
  getComparables
};
