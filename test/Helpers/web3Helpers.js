const BigNumber = require('bignumber.js');
const Web3 = require('web3');

const my_web3 = new Web3(web3.currentProvider);

module.exports = 
{
  async getGasCost(txhash)
  {
    const transaction = await my_web3.eth.getTransaction(txhash);
    const receipt = await my_web3.eth.getTransactionReceipt(txhash);
    return receipt.gasUsed * transaction.gasPrice;
  },

  getContract(abi, address)
  {
    return new my_web3.eth.Contract(abi, address);
  },

  async getBalance(address)
  {
    return new BigNumber(await my_web3.eth.getBalance(address));
  },

  async getBalanceChange(txCallbackFunction, account)
  {
    const balanceBefore = await this.getBalance(account);
    const tx = await txCallbackFunction(); 
    const gasCost = await this.getGasCost(tx.tx);
    const balanceAfter = await this.getBalance(account);
    const delta = balanceAfter.plus(gasCost).minus(balanceBefore);
    return delta;
  }
}