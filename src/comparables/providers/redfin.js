const { buildSyntheticComparables, getSeededComparables } = require("../helpers");

async function getComparables(input, seededPool) {
  const comparables = seededPool.length
    ? getSeededComparables(input, "Redfin", seededPool)
    : buildSyntheticComparables(input, "Redfin");

  return {
    provider: "Redfin",
    status: seededPool.length ? "seeded" : "synthetic",
    comparables
  };
}

module.exports = {
  getComparables
};
