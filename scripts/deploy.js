require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");
require('hardhat-contract-sizer');
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

//const dotenv = require('dotenv').config()
//npx hardhat run scripts/deploy.js --network rinkeby

async function deployTellorAdapter( _network, _pk, _nodeURL) {

    console.log("deploy tellor adapter")
    await run("compile")


    var net = _network
    const tellorAddress = '0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0'
    const medianAddress = '0xDB021b1B247fe2F1fa57e0A87C748Cc1E321F07F'

    ///////////////Connect to the network
    let privateKey = _pk;
    var provider = new ethers.providers.JsonRpcProvider(_nodeURL) 
    let wallet = new ethers.Wallet(privateKey, provider);


    ////////////////TellorProvider
    console.log("Starting deployment for TellorProvider contract...")
    const tp = await ethers.getContractFactory("contracts/TellorProvider.sol:TellorProvider", wallet)
    const tpwithsigner = await tp.connect(wallet)
    const tellorAdapter = await tpwithsigner.deploy(tellorAddress, medianAddress)
    console.log("TellorProvider contract deployed to: ", tellorAdapter.address)

    await tellorAdapter.deployed()

    if (net == "mainnet"){ 
        console.log("tellorAdapter contract deployed to:", "https://etherscan.io/address/" + tellorAdapter.address);
        console.log("   tellorAdapter transaction hash:", "https://etherscan.io/tx/" + tellorAdapter.deployTransaction.hash);
    } else if (net == "rinkeby") {
        console.log("tellorAdapter contract deployed to:", "https://rinkeby.etherscan.io/address/" + tellorAdapter.address);
        console.log("    tellorAdapter transaction hash:", "https://rinkeby.etherscan.io/tx/" + tellorAdapter.deployTransaction.hash);
    } else {
        console.log("Please add network explorer details")
    }

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tellorAdapter tx confirmation...');
    await tellorAdapter.deployTransaction.wait(3)

    console.log('submitting tellorAdapter contract for verification...');
    await run("verify:verify",
      {
      address: tellorAdapter.address,
      constructorArguments: [tellorAddress, medianAddress]
      },
    )
    console.log("tellorAdapter contract verified")


}


deployTellorAdapter( "rinkeby", process.env.TESTNET_PK, process.env.NODE_URL_RINKEBY)
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});