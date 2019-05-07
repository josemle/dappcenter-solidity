const Trc20Extension = artifacts.require("Trc20Extension");
const TestTrc20 = artifacts.require("TestTrc20");
const sleep = require("sleep");

contract("Trc20Extension", accounts => {
  let contract;
  const tokens = [];

  before(async () => {
    contract = await Trc20Extension.deployed();
    for (let iToken = 0; iToken < 1; iToken++) {
      const token = await TestTrc20.deployed();
      sleep.sleep(3);
      tokens.push(token.address);
      await token.mint(accounts[0], 5 + iToken);
    }
  });

  it("can read balances", async () => {
    const balances = (await contract.balanceOfAll(accounts[0], tokens))
      .balances;
    for (let iToken = 0; iToken < 1; iToken++) {
      assert.equal(balances[iToken].toString(), 5 + iToken);
    }
  });
});
