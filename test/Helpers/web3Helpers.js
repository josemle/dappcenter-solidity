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
  },

  // https://medium.com/coinmonks/using-truffle-framework-in-an-advanced-way-7e32c11c97a9
  // Sends increateTime instruction, mines block and returns a Promise.
  increaseTime (addSeconds) 
  {
    return new Promise((resolve, reject) =>
    {
      my_web3.currentProvider.sendAsync({
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [addSeconds],
        id: new Date().getSeconds()
      }, function(err, result) 
      {
        resolve(result);

        if(err)
        {
          my_web3.currentProvider.sendAsync({
            jsonrpc: "2.0",
            method: "evm_mine",
            id: addSeconds
          }, function(err, result) 
          {
            if(err)
            {
              return reject(err);
            }
            resolve(result);
          });
        }
      });
    });
  }

    // return my_web3.currentProvider.sendAsync({
    //   jsonrpc: '2.0',
    //   method: 'evm_increaseTime',
    //   params: [addSeconds],
    //   id: new Date().getSeconds()
    // }
    // , (err) => 
    // {
    //   if(!err) 
    //   {
    //     return my_web3.currentProvider.send({
    //       jsonrpc: '2.0',
    //       method: 'evm_mine',
    //       params: [],
    //       id: new Date().getSeconds()
    //     });
    //   }
    // }
}