require("dotenv").config();
const ethers = require("ethers");
const xl = require("excel4node");
const {
  getProposalDetails,
  getOceanPriceThatTime,
} = require("./utils/airtable_utils");
const wb = new xl.Workbook();
const ws = wb.addWorksheet("Payments");
ws.cell(1, 1).string("paidDate");
ws.cell(1, 2).string("month");
ws.cell(1, 3).string("From Address");
ws.cell(1, 4).string("To Address");
ws.cell(1, 5).string("Out");
ws.cell(1, 6).string("CURRENCY");
ws.cell(1, 7).string("USD Value");
ws.cell(1, 8).string("Fee");
ws.cell(1, 9).string("CUR");
ws.cell(1, 10).string("USD Fee");
ws.cell(1, 11).string("Fee incl");
ws.cell(1, 12).string("RECIPIENT");
ws.cell(1, 13).string("Email");
ws.cell(1, 14).string("Country");
ws.cell(1, 15).string("Category");
ws.cell(1, 16).string("Consideration Type");
ws.cell(1, 17).string("Description");
ws.cell(1, 18).string("Tx ID Url");

const OCEAN_TOKEN_ADDRESS = process.env.OCEAN_TOKEN_ADDRESS;
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);

const treasuryContract = new ethers.Contract(
  TREASURY_ADDRESS,
  require("../abi/OceanDaoTreasury.json").abi,
  provider
);

async function getEvents(round) {
  const grants = [];

  let events = await treasuryContract.queryFilter(
    treasuryContract.interface.events[
      "GrantClaimed(address,uint256,string,uint256,address,uint256)"
    ],
    0
  );
  events = events.filter(
    (x) => x.event == "GrantClaimed" && x.args.roundNumber.toString() == round
  );
  events.forEach((x) => {
    const grant = {};
    const transactionHash = x.transactionHash;
    x = x.args;
    grant.roundNumber = x.roundNumber.toNumber();
    grant.recipient = x.recipient;
    grant.projectName = x.projectName;
    grant.timestamp = new Date(x.timestamp.toNumber() * 1000);
    grant.amount = ethers.utils.formatEther(x.amount);
    grant.txCaller = x.caller;
    grant.transactionHash = transactionHash;
    grants.push(grant);
  });
  return grants;
}

class Payment {
  constructor({
    paidDate,
    month,
    fromAddress = TREASURY_ADDRESS,
    toAddress,
    out,
    USDValue,
    CUR = "ETH",
    Feeincl = "NO",
    recipient,
    email = "",
    country,
    category = "Grant",
    considerationType = "Ocean DAO",
    projectName,
    projectId,
    roundNumber,
    transaction,
    projectDescription,
  }) {
    this.description = `Ocean DAO Round ${roundNumber} Grant: ${projectDescription}`;
    this.paidDate = paidDate;
    this.month = month;
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.out = out;
    this.USDValue = USDValue;
    this.CUR = CUR;
    this.Feeincl = Feeincl;
    this.recipient = recipient;
    this.email = email;
    this.country = country;
    this.category = category;
    this.considerationType = considerationType;
    this.projectName = projectName;
    this.projectId = projectId;
    this.roundNumber = roundNumber;
    this.transaction = transaction;
    this.considerationType = `${projectName} - OceanDAO`;
  }

  write(ws, row) {
    ws.cell(row, 1).string(
      `${this.paidDate.getDay()} ${this.paidDate.getMonth()} ${this.paidDate.getFullYear()}`
    );
    ws.cell(row, 2).number(this.month);
    ws.cell(row, 3).string(this.fromAddress);
    ws.cell(row, 4).string(this.toAddress);
    ws.cell(row, 5).number(parseFloat(this.out));
    ws.cell(row, 6).string("OCEAN");
    ws.cell(row, 7).number(parseFloat(this.USDValue));
    ws.cell(row, 8).string("0");
    ws.cell(row, 9).string("ETH");
    ws.cell(row, 10).string("0");
    ws.cell(row, 11).string("Fee incl");
    ws.cell(row, 12).string(this.recipient);
    ws.cell(row, 13).string(this.email);
    ws.cell(row, 14).string(this.country);
    ws.cell(row, 15).string(this.category);
    ws.cell(row, 16).string(this.considerationType);
    ws.cell(row, 17).string(this.description);
    ws.cell(row, 18).string(this.transaction);
  }
}

async function main() {
  if (process.argv.length < 3) {
    console.log("Usage: node generateExcel.js <roundNumber>");
    return;
  }
  const roundNumber = process.argv[2];
  const grants = await getEvents(roundNumber);
  const oceanPriceThatTime = await getOceanPriceThatTime(roundNumber);
  console.log(`Found ${grants.length} grants`);
  for (const grant of grants) {
    const index = grants.indexOf(grant) + 2;
    const projectInfo = await getProposalDetails(grant.projectName);
    console.log(`Processing ${projectInfo["Project Name"]}`);
    const payment = new Payment({
      paidDate: grant.timestamp,
      month: grant.timestamp.getMonth(),
      out: grant.amount,
      USDValue: parseFloat(grant.amount) * parseFloat(oceanPriceThatTime),
      toAddress: grant.recipient,
      projectName: projectInfo["Project Name"],
      recipient: projectInfo["Recipient"] ?? projectInfo["Project Name"],
      roundNumber: grant.roundNumber,
      transaction: `https://etherscan.io/tx/${grant.transactionHash}`,
      projectDescription: projectInfo["One Liner"],
      country: projectInfo["Country"] ?? "Missing field",
      email: projectInfo["Account"] ?? "Missing field",
    });

    payment.write(ws, index);
  }

  wb.write(`./outputs/Round-${roundNumber}-grants.xlsx`, (err, stats) => {
    if (err) {
      console.error(err);
    } else {
      console.log(stats); // Prints out an instance of a node.js fs.Stats object
    }
  });
}
main();
