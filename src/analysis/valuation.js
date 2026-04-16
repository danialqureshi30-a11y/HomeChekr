function calculateAdjustedComparable(comp, subject) {
  const bedroomAdj = (subject.bedrooms - comp.bedrooms) * 12000;
  const bathroomAdj = (subject.bathrooms - comp.bathrooms) * 8500;
  const squareFootAdj = ((subject.squareFootage - comp.squareFootage) / 100) * 9000;

  return comp.price + bedroomAdj + bathroomAdj + squareFootAdj;
}

function getSimilarityScore(comp, subject) {
  const bedroomGap = Math.abs(subject.bedrooms - comp.bedrooms) * 14;
  const bathroomGap = Math.abs(subject.bathrooms - comp.bathrooms) * 10;
  const squareFootGap = Math.min(Math.abs(subject.squareFootage - comp.squareFootage) / 75, 28);
  const distancePenalty = typeof comp.distanceMiles === "number" ? comp.distanceMiles * 7 : 5;
  const freshnessPenalty = Math.min(comp.daysOnMarket / 2, 10);

  return Math.max(
    100 - bedroomGap - bathroomGap - squareFootGap - distancePenalty - freshnessPenalty,
    20
  );
}

function getWeightedFairValue(comparables) {
  const totalWeight = comparables.reduce((sum, comp) => sum + comp.similarityScore, 0);

  if (!totalWeight) {
    return 0;
  }

  const weightedSum = comparables.reduce((sum, comp) => sum + comp.adjustedPrice * comp.similarityScore, 0);
  return weightedSum / totalWeight;
}

function buildConditionAdjustments(subject) {
  return [
    {
      label: "Repair budget added to effective purchase price",
      description: "HomeChekr compares the asking price plus estimated repairs against nearby comparable homes.",
      amount: subject.repairsCost || 0
    }
  ];
}

function getPricingStatus(deltaPct) {
  if (deltaPct === null) {
    return { key: "insufficient-data", title: "Not enough comparables", pillClass: "warning" };
  }

  if (deltaPct > 0.07) {
    return { key: "overpriced", title: "Overpriced", pillClass: "negative" };
  }

  if (deltaPct < -0.05) {
    return { key: "underpriced", title: "Underpriced", pillClass: "positive" };
  }

  return { key: "accurate", title: "Accurately priced", pillClass: "warning" };
}

function getConfidenceScore(comparables, subject, providers) {
  if (!comparables.length) {
    return 0;
  }

  const avgSimilarity = comparables.reduce((sum, comp) => sum + comp.similarityScore, 0) / comparables.length;
  const providerCoverage = providers.filter((provider) => provider.comparablesReturned > 0).length * 4;
  const repairPenalty = subject.repairsCost > 0 ? 2 : 0;

  return Math.max(Math.min(Math.round(avgSimilarity + providerCoverage - repairPenalty), 95), 45);
}

function buildSummary(status, delta, deltaPct, fairValue, subject, comps) {
  if (status.key === "insufficient-data") {
    return `HomeChekr could not find enough comparable homes for ${subject.city} ${subject.zip} with the available live listing data. Try again later or broaden the property profile to gather more market evidence.`;
  }

  const deltaText = formatCurrency(Math.abs(delta));
  const percentageText = `${Math.abs(deltaPct * 100).toFixed(1)}%`;
  const distanceValues = comps.map((comp) => comp.distanceMiles).filter((value) => typeof value === "number");
  const avgDistance = distanceValues.length
    ? (distanceValues.reduce((sum, value) => sum + value, 0) / distanceValues.length).toFixed(1)
    : "N/A";
  const priceText = formatCurrency(subject.price);
  const effectivePriceText = formatCurrency(subject.price + (subject.repairsCost || 0));
  const fairValueText = formatCurrency(fairValue);

  if (status.key === "overpriced") {
    return `The subject home looks above its adjusted market range. Based on ${comps.length} comparable homes${avgDistance === "N/A" ? "" : ` averaging ${avgDistance} miles away`}, HomeChekr estimates a fair value near ${fairValueText}. After adding the estimated repairs, the effective purchase price is ${effectivePriceText}, which is about ${deltaText} (${percentageText}) too high.`;
  }

  if (status.key === "underpriced") {
    return `The subject home appears attractively priced relative to nearby comparable homes. After adjusting for layout and home size, HomeChekr estimates a fair value near ${fairValueText}. Even after adding the estimated repairs, the effective purchase price is ${effectivePriceText}, which is roughly ${deltaText} (${percentageText}) below market.`;
  }

  return `The subject home lands inside a reasonable pricing band for the area. Across ${comps.length} nearby comparables, the adjusted market value came in near ${fairValueText}, and the effective purchase price of ${effectivePriceText} sits within a normal negotiation range.`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

module.exports = {
  buildConditionAdjustments,
  buildSummary,
  calculateAdjustedComparable,
  getConfidenceScore,
  getPricingStatus,
  getSimilarityScore,
  getWeightedFairValue
};
