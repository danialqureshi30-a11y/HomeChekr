const rentcast = require("./providers/rentcast");

async function getComparableHomes(input) {
  const providerResults = await Promise.all([rentcast.getComparables(input)]);

  return {
    comparables: providerResults.flatMap((provider) => provider.comparables),
    providers: providerResults.map((provider) => ({
      name: provider.provider,
      status: provider.status,
      comparablesReturned: provider.comparables.length
    }))
  };
}

module.exports = {
  getComparableHomes
};
