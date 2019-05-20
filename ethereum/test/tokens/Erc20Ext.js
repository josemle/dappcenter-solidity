const Erc20Ext = artifacts.require("Erc20Ext");
const TestErc20 = artifacts.require("TestErc20");
const deploy = require("../../../library/src/deploy");
const Library = require("../../../library/src/tokens/Erc20Ext");

contract("Erc20Ext", accounts => {
  let library;
  let contract;
  const tokens = [];

  before(async () => {
    await deploy.deploy(true, accounts[0], [web3.currentProvider]);
    contract = await Erc20Ext.new();
    library = new Library(true, web3.currentProvider, contract.address);
    for (let iToken = 0; iToken < 20; iToken++) {
      const token = await TestErc20.new();
      tokens.push(token.address);
      await token.mint(accounts[0], 5 + iToken);
      await token.approve(accounts[9], -1);
    }
  });

  it("can read balances", async () => {
    const balances = await library.balanceAndAllowanceOfAll(
      accounts[0],
      accounts[9],
      tokens
    );
    for (let iToken = 0; iToken < 20; iToken++) {
      assert.equal(balances[iToken * 2].toString(), 5 + iToken);
      assert.equal(
        balances[iToken * 2 + 1].toString(),
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      );
    }
  });
});
