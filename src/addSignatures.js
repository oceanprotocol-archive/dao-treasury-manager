require("dotenv").config();
const { ecsign, toRpcSig } = require("ethereumjs-util");
const verifierPK = process.env.VERIFIER_PK;
const ethers = require("ethers");

const { getProposals } = require("./utils/airtable_utils");
function sign(grant) {
  function signMessage(message, privateKey) {
    const { v, r, s } = ecsign(
      Buffer.from(message.slice(2), "hex"),
      Buffer.from(privateKey, "hex")
    );
    return toRpcSig(v, r, s);
  }

  const message = ethers.utils.solidityKeccak256(
    ["uint256", "address", "string", "uint256", "uint256", "address"],
    [
      grant.roundNumber,
      grant.recipient,
      grant.proposalId,
      grant.timeStamp,
      grant.amount,
      grant.tokenAddress,
    ]
  );
  const signedMessage = signMessage(message, verifierPK);
  return signedMessage;
}

async function updateProposals(proposals) {
  const grants = [];
  const promises = [];
  proposals.forEach((x, y) => {
    const grant = {};
    grant.roundNumber = parseInt(x.fields["Round"]);
    grant.recipient = x.fields["Wallet Address"].trim();
    grant.proposalId = x.fields["RecordId"];
    grant.timeStamp = parseInt(Date.now() / 1000);
    grant.amount = ethers.utils
      .parseEther(x.fields["OCEAN Granted"].toString())
      .toString();
    grant.tokenAddress = process.env.OCEAN_TOKEN_ADDRESS;
    const signedMessage = sign(grant);
    const { v, r, s } = ethers.utils.splitSignature(signedMessage);
    grant.v = v;
    grant.r = r;
    grant.s = s;
    promises.push(
      x.updateFields({
        "Reward String": Buffer.from(JSON.stringify(grant)).toString("base64"),
      })
    );
    grants.push(grant);
    console.log(grant, signedMessage, grant.roundNumber);
  });
  await Promise.all(promises);
  return grants;
}

async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node generateExcel.js <roundNumber>");
    return;
  }
  const roundNumber = process.argv[2];
  const proposals = await getProposals(roundNumber);
  const grants = await updateProposals(proposals);

  require("fs").writeFileSync(
    `./outputs/round-${roundNumber}-signed-grants.json`,
    JSON.stringify(grants, null, 2)
  );
}

main();
