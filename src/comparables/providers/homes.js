const { buildSyntheticComparables, getSeededComparables } = require("../helpers");

async function getComparables(input, seededPool) {
  const comparables = seededPool.length
    ? getSeededComparables(input, "Homes.com", seededPool)
    : buildSyntheticComparables(input, "Homes.com");

  return {
    provider: "Homes.com",
    status: seededPool.length ? "seeded" : "synthetic",
    comparables
  };
}

module.exports = {
  getComparables
};
