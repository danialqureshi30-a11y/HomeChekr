const { getComparableHomes } = require("../comparables/get-comparable-homes");
const {
  buildConditionAdjustments,
  buildSummary,
  calculateAdjustedComparable,
  getConfidenceScore,
  getPricingStatus,
  getSimilarityScore,
  getWeightedFairValue
} = require("./valuation");
const { normalizeSubjectInput } = require("./normalize-input");

async function analyzeHomeRequest(rawInput) {
  const subject = normalizeSubjectInput(rawInput);
  const comparableResponse = await getComparableHomes(subject);

  const scoredComparables = comparableResponse.comparables
    .map((comp) => {
      const adjustedPrice = calculateAdjustedComparable(comp, subject);
      const similarityScore = getSimilarityScore(comp, subject);

      return {
        ...comp,
        adjustedPrice,
        similarityScore
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);

  const topComparables = scoredComparables.slice(0, 6);
  const adjustments = buildConditionAdjustments(subject);
  const weightedValue = getWeightedFairValue(topComparables);
  const fairValue = topComparables.length ? Math.max(weightedValue, 0) : 0;
  const effectivePrice = subject.price + (subject.repairsCost || 0);
  const delta = topComparables.length ? effectivePrice - fairValue : effectivePrice;
  const deltaPct = topComparables.length && fairValue > 0 ? delta / fairValue : null;
  const status = getPricingStatus(deltaPct);
  const confidence = getConfidenceScore(topComparables, subject, comparableResponse.providers);

  return {
    subject,
    fairValue,
    effectivePrice,
    delta,
    deltaPct,
    status,
    confidence,
    adjustments,
    comparables: topComparables,
    providers: comparableResponse.providers,
    summary: buildSummary(status, delta, deltaPct, fairValue, subject, topComparables),
    methodology:
      "HomeChekr weighs nearby comparable listings by similarity, then adjusts for bedroom count, bathroom count, and home square footage, while comparing the effective purchase price including repairs against market value."
  };
}

module.exports = {
  analyzeHomeRequest
};
