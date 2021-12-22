# Guide

## Installation

- `git clone https://github.com/oceanprotocol/dao-treasury-manager.git`
- `cd dao-treasury-manager`
- `npm install`

## Setting up the env variables

`cp .env.example .env`

- `VERIFIER_PK`: The private key of the verifier.
- `AIRTABLE_API_KEY` Airtable API key.
- `AIRTABLE_BASEID` The base ID of the Airtable database.
- `TREASURY_ADDRESS` The address of the treasury contract.
- `OCEAN_TOKEN_ADDRESS` The address of the Ocean token contract.
- `PROVIDER_URL` The JSON RPC provider URL.

## Generating signatures

`node src/addSignatures.js roundNumber`

Example: `node src/addSignatures.js 12`

This script will generate signatures for each proposal in the round which doesn't have a signature yet and has a `Granted` status.
Signatures are generated based on the recipient address, round number, record id, amount of Ocean tokens granted and the current timestamp in seconds.

Removing a signature and running this script again would cause the signature to be regenerated. This must be **avoided**.

The script will automatically fill in the `Signed Hash` field for each proposal. This field is the base64 encoding of a JSON string.

Example:

- Base64 encoded

```
eyJyb3VuZE51bWJlciI6MTIsInJlY2lwaWVudCI6IjB4NTFiRDlmNUIyNTYyYWM2MjJlYjUwREZkMEYwRDYwNDU1OEM3ODE5ZiIsInByb2plY3ROYW1lIjoicmVjV1Fqb1VwYWNuaW9tOUEiLCJ0aW1lU3RhbXAiOjE2NDAxNzI4NTYsImFtb3VudCI6IjEwMjMxLjAiLCJzaWduZWRNZXNzYWdlIjoiMHg2ZDdhNmUxYjRjYjc0NzZhMjBmNTkwMjIzOGQzZjlmMGViZmEwODJmNzQ2MzQxZTJkODdjMTY1ZWQ0OGFkNjgwN2VkZWZjMjRkN2M5M2Q3YjEyYWNmNzRhNzViY2JlYmRmMDM1NGYxNTZkM2Q4ODEwM2E0OWQ0MTU3NDBjMDdhZjFiIn0=
```

- JSON string:

```json
{
  "roundNumber": 12,
  "recipient": "0x51bD9f5B2562ac622eb50DFd0F0D604558C7819f",
  "proposalId": "recWQjoUpacniom9A",
  "timeStamp": 1640172856,
  "amount": "10231.0",
  "signedMessage": "0x6d7a6e1b4cb7476a20f5902238d3f9f0ebfa082f746341e2d87c165ed48ad6807edefc24d7c93d7b12acf74a75bcbebdf0354f156d3d88103a49d415740c07af1b"
}
```

The base64 encoding will be used to claim the grant from the contract on the front end. Recipient will paste the base64 encoding and click the button. Then the recipient will send a transaction to the contract. The contract will verify the signature and grant the grant.

Example UI:

![UI](https://i.ibb.co/PttyJGG/Screenshot-from-2021-12-22-14-43-19.png)

## Generating the Excel sheet

`node src/generateExcel.js roundNumber`
Example: `node src/generateExcel.js 12`

This script will fetch the events for the specified round number from the contract and generate an Excel sheet named `Round-${roundNumber}-grants.xlsx` in the `outputs` directory.
