const DAO = artifacts.require("./DAO.sol");
const helpers = require('./Helpers/helpers');
const BigNumber = require('bignumber.js');
const Web3 = require('web3');

// TODO test for events

contract('DAO', function(accounts) 
{
  const my_web3 = new Web3(web3.currentProvider);
  let instance;
  let contract;
  
  async function setupSingleOwner()
  {
    instance = await DAO.deployed();
    contract = new my_web3.eth.Contract(instance.abi, instance.address);
  }
  
  it("has one member by default, the deployer, with 1,000,000 weight", async () =>
  {
    await setupSingleOwner();
    const member = await instance.members.call(0);
    assert.equal(member[0], accounts[0]);
    assert.equal(member[1], 1000000);
    assert.isTrue(await helpers.doesThrow(instance.members.call(1)));
  });

  it("should give the only member all the money when it divides evenly", async () =>
  {
    await setupSingleOwner();
    const amount = BigNumber(1000000);
    await instance.send(amount.toString());     
    const delta = await helpers.getBalanceChange(instance.withdrawl(), accounts[0]);
    assert.equal(delta.toString(), amount.toString());
  });

  it("should give me nothing if only dust remains", async () =>
  {
    await setupSingleOwner();
    const amount = BigNumber(1);
    await instance.send(amount.toString());     
    const delta = await helpers.getBalanceChange(instance.withdrawl(), accounts[0]);
    assert.isTrue(delta.toString() == "0");
    const contractBalance = await web3.eth.getBalance(instance.address);
    assert.equal(contractBalance.toString(), amount.toString());
  });

  it("can add a member", async () =>
  {
    await setupSingleOwner();
    const trasactionBytes = contract.methods.addMember(accounts[1], 12121).encodeABI();
    const proposal = await instance.addProposal(instance.address, trasactionBytes, 0);
    await instance.executeProposal(proposal.logs[0].args.proposalId);

    assert.equal((await instance.members.call(0))[0], accounts[0]);
    assert.equal((await instance.members.call(1))[0], accounts[1]);
    assert.isTrue(await helpers.doesThrow(instance.members.call(2)));
  });
});
