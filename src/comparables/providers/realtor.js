const { buildSyntheticComparables, getSeededComparables } = require("../helpers");

async function getComparables(input, seededPool) {
  const comparables = seededPool.length
    ? getSeededComparables(input, "Realtor.com", seededPool)
    : buildSyntheticComparables(input, "Realtor.com");

  return {
    provider: "Realtor.com",
    status: seededPool.length ? "seeded" : "synthetic",
    comparables
  };
}

module.exports = {
  getComparables
};
