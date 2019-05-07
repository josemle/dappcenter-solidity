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
      await token.approve(
        accounts[9],
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      );
    }
  });

  it("can read balances", async () => {
    const balances = (await contract.balanceAndAllowanceOfAll(
      accounts[0],
      accounts[9],
      tokens
    )).balanceAndAllowancePerToken;
    for (let iToken = 0; iToken < 1; iToken++) {
      assert.equal(balances[iToken * 2].toString(), 5 + iToken);
      assert.equal(
        balances[iToken * 2 + 1].toString(),
        "115792089237316195423570985008687907853269984665640564039457584007913129639935"
      );
    }
  });
});
