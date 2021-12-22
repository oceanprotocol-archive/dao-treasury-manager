require("dotenv").config();
const proposals = require("../grants.json");
const ethers = require("ethers");

const OCEAN_TOKEN_ADDRESS = process.env.OCEAN_TOKEN_ADDRESS;
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
const verifierPK =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = new ethers.Wallet(verifierPK, provider);
const treasuryContract = new ethers.Contract(
  TREASURY_ADDRESS,
  require("../abi/OceanDaoTreasury.json").abi,
  wallet
);

async function main() {
  for (const proposal of proposals) {
    let { v, r, s } = ethers.utils.splitSignature(proposal.signedMessage);
    const hash = await treasuryContract.claimGrant(
      proposal.roundNumber,
      proposal.recipient,
      proposal.projectName,
      proposal.timeStamp,
      proposal.amount,
      OCEAN_TOKEN_ADDRESS,
      v,
      r,
      s
    );
    await hash.wait();
    console.log(hash.hash);
  }
}

main();
