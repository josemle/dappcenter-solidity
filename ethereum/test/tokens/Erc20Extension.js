const Erc20Extension = artifacts.require("Erc20Extension");
const TestErc20 = artifacts.require("TestErc20");

contract("Erc20Extension", accounts => {
  let contract;
  const tokens = [];

  before(async () => {
    contract = await Erc20Extension.new();
    for (let iToken = 0; iToken < 20; iToken++) {
      const token = await TestErc20.new();
      tokens.push(token.address);
      await token.mint(accounts[0], 5 + iToken);
      await token.approve(accounts[9], -1);
    }
  });

  it("can read balances", async () => {
    const balances = await contract.balanceAndAllowanceOfAll(
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
