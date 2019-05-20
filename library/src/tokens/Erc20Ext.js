const HardlyWeb3 = require("../hardlyWeb3");

module.exports = class ErcExt {
  constructor(isEth, provider, contractAddress) {
    this.hardlyWeb3 = new HardlyWeb3(isEth, provider);
    const contractJson = require("../../../artifacts/Erc20Ext.json");
    this.contract = this.hardlyWeb3.getContract(
      this.hardlyWeb3.isEth ? contractJson.abi : contractJson.abi,
      contractAddress
    );
  }

  async balanceAndAllowanceOfAll(user, spender, tokens) {
    return this.contract.methods
      .balanceAndAllowanceOfAll(user, spender, tokens)
      .call();
  }
};
