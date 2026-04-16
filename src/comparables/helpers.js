function slugify(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function titleCase(value) {
  return String(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildSyntheticComparables(input, source) {
  const basePrice = input.price || 350000;
  const citySeed = input.city.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) + Number(input.zip);
  const synthetic = [];

  for (let index = 0; index < 2; index += 1) {
    const variance = ((citySeed + index * 37 + source.length) % 11) - 5;
    const priceShift = variance * 8500;
    const lotShift = variance * 180;

    synthetic.push({
      source,
      address: `${1200 + index * 57} ${titleCase(input.city)} Market Ave`,
      price: Math.max(basePrice + priceShift, 100000),
      bedrooms: Math.max(input.bedrooms + ((index % 3) - 1), 1),
      bathrooms: Math.max(input.bathrooms + ((index % 2) * 0.5 - 0.5), 1),
      floors: Math.max(input.floors + (index % 2 === 0 ? 0 : 1) - (index % 4 === 0 ? 1 : 0), 1),
      lotSize: Math.max(input.lotSize + lotShift, 1200),
      distanceMiles: Number((0.5 + index * 0.45 + source.length * 0.03).toFixed(1)),
      daysOnMarket: 6 + index * 4 + source.length,
      listingUrl: buildSearchUrl(source, input)
    });
  }

  return synthetic;
}

function buildSearchUrl(source, input) {
  const location = encodeURIComponent(`${input.city}, ${input.zip}`);
  const beds = encodeURIComponent(input.bedrooms);
  const baths = encodeURIComponent(input.bathrooms);

  switch (source) {
    case "Zillow":
      return `https://www.zillow.com/homes/${location}_rb/?beds=${beds}&baths=${baths}`;
    case "Redfin":
      return `https://www.redfin.com/city/0/${encodeURIComponent(input.city)}/filter/min-beds=${beds},min-baths=${baths},include=sold-3mo`;
    case "Homes.com":
      return `https://www.homes.com/property/${location}/?beds=${beds}&baths=${baths}`;
    case "Realtor.com":
      return `https://www.realtor.com/realestateandhomes-search/${encodeURIComponent(input.city)}_${input.zip}/beds-${beds}/baths-${baths}`;
    default:
      return "";
  }
}

function getSeededComparables(input, source, seededPool) {
  return seededPool.filter((listing) => listing.source === source).map((listing) => ({
    ...listing,
    listingUrl: buildSearchUrl(source, input)
  }));
}

module.exports = {
  buildSearchUrl,
  buildSyntheticComparables,
  getSeededComparables,
  slugify
};
