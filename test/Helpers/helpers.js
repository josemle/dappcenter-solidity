module.exports = 
{
  async doesThrow(a)
  {
    try
    {
      await a;
      return false;
    }
    catch(e) {}
    return true;
  },

  async getGasCost(txhash)
  {
    const transaction = await web3.eth.getTransaction(txhash);
    const receipt = await web3.eth.getTransactionReceipt(txhash);
    return receipt.gasUsed * transaction.gasPrice;
  },

  async getBalanceChange(transactionPromise, account)
  {
    const balanceBefore = await web3.eth.getBalance(account);
    const tx = await transactionPromise; 
    const gasCost = await this.getGasCost(tx.tx);
    const balanceAfter = await web3.eth.getBalance(account);
    const delta = balanceAfter.plus(gasCost).minus(balanceBefore);
    return delta;
  },
}