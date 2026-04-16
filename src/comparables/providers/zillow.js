const { buildSyntheticComparables, getSeededComparables } = require("../helpers");

async function getComparables(input, seededPool) {
  const comparables = seededPool.length
    ? getSeededComparables(input, "Zillow", seededPool)
    : buildSyntheticComparables(input, "Zillow");

  return {
    provider: "Zillow",
    status: seededPool.length ? "seeded" : "synthetic",
    comparables
  };
}

module.exports = {
  getComparables
};
