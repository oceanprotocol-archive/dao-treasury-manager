require("dotenv").config();

const base = require("airtable").base(process.env.AIRTABLE_BASEID);

const getProposals = async (round) => {
  const roundParameters = await getRoundsSelectQuery(
    `AND({Proposal State} = "Granted", {Reward String} = "", {Round} = ${round})`
  );
  return roundParameters;
};

async function getOceanPriceThatTime(round) {
  const param = await getFundingRoundsSelectQuery(`{Name} = "Round ${round}"`);
  return param[0].fields["OCEAN Price"];
}

async function getProposalDetails(proposalId) {
  const roundParameters = await getRoundsSelectQuery(
    `And({RecordId} = "${proposalId}")`
  );
  const projectName = roundParameters[0].fields["Project Name"];

  const users = await getUsersSelectQuery(`{Team Name} = "${projectName}"`);
  if (users != [] && users[0]) {
    return { ...roundParameters[0].fields, ...users[0].fields };
  }
  return { ...roundParameters[0].fields };
}

const getUsersSelectQuery = async (selectQuery) => {
  try {
    return await base("Users")
      .select({
        view: "All Teams",
        filterByFormula: selectQuery,
      })
      .firstPage();
  } catch (err) {
    console.error(err);
  }
};

const getFundingRoundsSelectQuery = async (selectQuery) => {
  try {
    return await base("Funding Rounds")
      .select({
        view: "Rounds",
        filterByFormula: selectQuery,
      })
      .firstPage();
  } catch (err) {
    console.error(err);
  }
};

const getRoundsSelectQuery = async (selectQuery) => {
  try {
    return await base("Proposals")
      .select({
        view: "All Proposals",
        filterByFormula: selectQuery,
      })
      .firstPage();
  } catch (err) {
    console.error(err);
  }
};

module.exports = {
  getProposals,
  getProposalDetails,
  getOceanPriceThatTime,
};
