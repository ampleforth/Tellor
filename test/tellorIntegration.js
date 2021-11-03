const { assert } = require("console");

// TODO(naguib): Add gas usage checks
const MedianOracle = artifacts.require("MedianOracle");
const TellorProvider = artifacts.require("TellorProvider");
const TellorOracle = artifacts.require("MockTellor");

const BlockchainCaller = require("../util/blockchain_caller.js");
const chain = new BlockchainCaller(web3);

let oracle, deployer, A, B, C, D, r;

async function setupContractsAndAccounts(accounts) {
  deployer = accounts[0];
  A = accounts[1];
  B = accounts[2];
  C = accounts[3];
  D = accounts[4];
  oracle = await MedianOracle.new(60, 10, 1);
}

const getLatestTimestampForId = async (tellorOracle, requestId) => {
  let count = await tellorOracle.getNewValueCountbyRequestId(requestId);
  let time = await tellorOracle.getTimestampbyRequestIDandIndex(
    requestId,
    count.toString()
  );
  return time.toNumber();
};

contract("MedianOracle:pushReport", async function (accounts) {
  let tellorOracle;
  let tellorProvider;
  let value = "1000000000000000000";
  let tellorId = 10;

  beforeEach(async function () {
    await setupContractsAndAccounts(accounts);
    //Deploy MockTellor
    tellorOracle = await TellorOracle.new([], []);
    tellorProvider = await TellorProvider.new(
      tellorOracle.address,
      oracle.address
    );
    await oracle.addProvider(tellorProvider.address, { from: deployer });

    //Push Values to TellorOracle
    await tellorOracle.submitValue(tellorId, value);
  });

  it("Should be able to Push Tellor Report", async () => {
    await tellorProvider.pushTellor();

    let report = await oracle.providerReports(tellorProvider.address, 1);

    expect(report["payload"].toString()).to.eq(value);
  });

  it("Should be able to handle two values Push Tellor Report", async () => {
    await tellorProvider.pushTellor();
    await tellorOracle.submitValue(tellorId, value);
    await chain.waitForSomeTime(11);
    await tellorProvider.pushTellor();
    let report1 = await oracle.providerReports(tellorProvider.address, 1);
    let report2 = await oracle.providerReports(tellorProvider.address, 0);

    expect(report1["payload"].toString()).to.eq(value);
    expect(report2["payload"].toString()).to.eq(value);
  });

  it("Nothing happens when valid report is purged", async () => {
    await tellorProvider.verifyTellorReports();
    await tellorProvider.pushTellor();
    let report = await oracle.providerReports(tellorProvider.address, 1);
    expect(report["payload"].toString()).to.eq(value);
  });

  it("Purge disputed values", async () => {
    let time = await getLatestTimestampForId(tellorOracle, tellorId);
    await tellorOracle.disputeValue(tellorId, time);
    await tellorProvider.verifyTellorReports();
    let report = await oracle.providerReports(tellorProvider.address, 1);
    expect(report["payload"].toString()).to.eq("0");
  });
});
