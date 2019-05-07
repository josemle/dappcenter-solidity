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
    }
  });

  it("can read balances", async () => {
    const balances = await contract.balanceOfAll(accounts[0], tokens);
    for (let iToken = 0; iToken < 20; iToken++) {
      assert.equal(balances[iToken].toString(), 5 + iToken);
    }
  });
});
