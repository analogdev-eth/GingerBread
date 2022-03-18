require('dotenv/config.js');
const Avalanche = require('avalanche').Avalanche;
const Web3 = require('web3');
const axios = require('axios');
const arbitrageABI = require('./artifacts/contracts/Arbitrage.sol/Arbitrage.json')['abi'];
const arbitrageAddress = '0xce144F329F42C7028B0335d7625515bDC7b25608';
const pangolin = require('./contractABIs/pangolin');
const traderjoe = require('./contractABIs/traderjoe');
const { abi } = require('@pangolindex/exchange-contracts/artifacts/contracts/pangolin-core/interfaces/IPangolinPair.sol/IPangolinPair.json');


/*
- This bot runs on the AVALANCHE C-CHAIN
- To configure it to run on another network, change the environment variables to point to a node running on another network
- This bot only works when one of the tokens compared is the native coin of the network - in this case WAVAX is the native coin of the AVALANCHE C-CHAIN
*/
class TraderBot {

  // native coin to the AVALANCHE C-CHAIN
  nativeCoin = {
    symbol: 'WAVAX',
    address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
  }

  /**
   * 
   * @param {String} mode - 'testnet' or 'mainnet'
   * @param {Object} inputToken - should have properties 'address' and 'symbol'
   * @param {Object} outputToken - should have properties 'address' and 'symmbol'
   */
  constructor(mode, inputToken, outputToken) {
    if (mode === 'testnet') {
      this.web3Instance = new Web3(process.env.TESTNET_NODE);
    }
    else if (mode === 'mainnet') {
      this.web3Instance = new Web3(process.env.MAINNET_NODE);
    }
    else {
      throw new Error('Mode must be one of "testnet" or "mainnet"');
    }
    this.inputTokenAddress = inputToken['address'];
    this.inputTokenSymbol = inputToken['symbol'];
    this.outputTokenAddress = outputToken['address'];
    this.outputTokenSymbol = outputToken['symbol'];
  }

  getPangolinRate = async () => {
    try {
      const pangolinFactoryAddress = pangolin['ADDRESS'];
      const pangolinFactoryABI = pangolin['ABI'];
      const PangolinFactoryContract = new this.web3Instance.eth.Contract(pangolinFactoryABI, pangolinFactoryAddress);
      const pairAddress = await PangolinFactoryContract.methods.getPair(this.inputTokenAddress, this.outputTokenAddress).call();
      const ExchangeContract = await new this.web3Instance.eth.Contract(abi, pairAddress);
      const reserves = await ExchangeContract.methods.getReserves().call();
      const rate = Number(reserves['reserve1']) / Number(reserves['reserve0']);
      
      return rate;
    }
    catch (err) {
      console.log(new Error(err.message));
      return 0;
    }
  }

  getTraderjoeRate = async () => {
    try {
      // values in AVAX
      const baseUrl = 'https://api.traderjoexyz.com/priceavax/';
      const inputToken = await axios.get(baseUrl + this.inputTokenAddress);
      const outputToken = await axios.get(baseUrl + this.outputTokenAddress);
      const rate = Number(inputToken.data) / Number(outputToken.data);
      return rate;
    }
    catch (err) {
      console.log(new Error(err.message));
      return 0;
    }
  }

  compareDexes = async () => {
    // get the rate from trader joe
    // get the rate from pangolin
  }

}


const aave = {
  symbol: 'AAVE.e',
  address: '0x63a72806098Bd3D9520cC43356dD78afe5D386D9'
}
const ape = {
  symbol: 'APE',
  address: '0xd039C9079ca7F2a87D632A9C0d7cEa0137bAcFB5'
}
const wavax = {
  symbol: 'WAVAX',
  address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'
}

const tradeBot = new TraderBot('mainnet', aave, wavax);
// tradeBot.getTraderjoeRate()
// .then((value) => {
//   console.table([{
//     'Input Token': tradeBot.inputTokenSymbol,
//     'Output Token': tradeBot.outputTokenSymbol,
//     'Output Amount': 1,
//     'Trader Joe': value
//   }]);
// });
tradeBot.getPangolinRate()
.then((value) => {
  console.log({ 'Reserves': value });
});


// addresses of the coins present in the pair we want to check
// const otherCoinAddress = '0x63a72806098Bd3D9520cC43356dD78afe5D386D9'; // AAVE - mainnet
// const nativeCoinAddress = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'; // WAVAX - mainnet (The native currency of the avalanche C-chain)

// web3 instances for the fuji testnet and avalanche mainnet on HTTPS and web socket
// const web3HttpsTestnet = new Web3(process.env.MORALIS_FUJI_NODE);
// const web3WebSocketTestnet = new Web3(process.env.MORALIS_FUJI_WEB_SOCKET_NODE);
// const web3HttpsMainnet = new Web3(process.env.MORALIS_MAINNET_NODE);
// const web3WebSocketMainnet = new Web3(process.env.MORALIS_MAINNET_WEB_SOCKET_NODE);


// const getPangolinPairReserves = async (_web3Instance, _factoryContract, _otherCoinAddress) => {
//   try {
//     const pairAddress = await _factoryContract.methods.getPair(_otherCoinAddress, nativeCoinAddress).call();
//     const ExchangeContract = await new _web3Instance.eth.Contract(abi, pairAddress);
//     const reserves = await ExchangeContract.methods.getReserves().call();
//     console.log(reserves);
//     // console.log(pairAddress);
//     // return reserves;
//   }
//   catch (error) {
//     console.log(new Error(error.message));
//     return 0;
//   }
// }

const getTraderjoePairReserves = async (_web3Instance, _factoryContract, _otherCoinAddress) => {
  try {
    const pairAddress = await _factoryContract.methods.getPair(_otherCoinAddress, nativeCoinAddress).call();
    
  }
  catch (error) {
    console.log(new Error(error.message));
    return 0;
  }
}


// const ArbitrageContract = new web3HttpsTestnet.eth.Contract(arbitrageABI, arbitrageAddress);
// we now have the contract to call the flash loan 👆 - Note: it's on fuji testnet


// TODO
// 1. listen to mined blocks on the avalanche blockchain
let lastBlock = 0;
const checkLatestBlock = async () => {
  try {
    const latestBlock = await web3HttpsMainnet.eth.getBlockNumber();
    if (latestBlock > lastBlock) {
      // check for the arbitrage opportunity here ->
      lastBlock = latestBlock;
      console.log(lastBlock);
    }

    setTimeout(() => checkLatestBlock(), 1 * 1000);
  }
  catch (err) {
    console.log(new Error(err.message));
  }
};
// checkLatestBlock();


// // 2. get given crypto pair rate from pangolin

// getPangolinPairReserves(web3HttpsMainnet, PangolinFactoryContract, otherCoinAddress);


// // 3. get given crypto pair rate from trader joe
// const traderjoeFactoryAddress = traderjoe['ADDRESS'];
// const traderjoeFactoryABI = traderjoe['ABI'];
// const TraderjoeFactoryContract = new web3HttpsMainnet.eth.Contract(traderjoeFactoryABI, traderjoeFactoryAddress);
// // getTraderjoePairReserves(web3HttpsMainnet, TraderjoeFactoryContract, otherCoinAddress);


// // 4. find significant difference between prices
// // 5. execute the flashloan contract