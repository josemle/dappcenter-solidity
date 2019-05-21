const HardlyWeb3 = require("../hardlyWeb3");

module.exports = class ErcExt {
  constructor(isEth, provider, contractAddress) {
    this.hardlyWeb3 = new HardlyWeb3(isEth, provider);
    const contractJson = require("../../../artifacts/Erc20Ext.json");
    this.contract = this.hardlyWeb3.getContract(
      contractJson.abi,
      contractAddress
    );
  }

  async balanceAndAllowanceOfAll(user, spender, tokens) {
    const result = await this.contract.methods
      .balanceAndAllowanceOfAll(user, spender, tokens)
      .call();
    return this.hardlyWeb3.isEth ? result : result.balanceAndAllowancePerToken;
  }
};
