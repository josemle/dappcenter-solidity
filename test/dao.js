const DAO = artifacts.require("./DAO.sol");
const testHelpers = require('./Helpers/testHelpers');
const web3Helpers = require('./Helpers/web3Helpers');
const BigNumber = require('bignumber.js');

contract('DAO', function(accounts) 
{
  let instance;
  let contract;
  
  async function setupOwners(count)
  {
    instance = await DAO.deployed();
    contract = web3Helpers.getContract(instance.abi, instance.address);

    for(let i = 1; i < count; i++)
    {
      const trasactionBytes = contract.methods.addMember(accounts[i], 1000000).encodeABI();
      const proposal = await instance.addProposal(instance.address, trasactionBytes, 0);
      await instance.executeProposal(proposal.logs[0].args.proposalId);
    }
  } 
  
  it("has one member by default, the deployer", async () =>
  {
    await setupOwners(1);
    assert.isTrue(await testHelpers.isLength(instance.members, 1));
    assert.equal((await instance.members.call(0))[0], accounts[0]);
  });

  itSendsOneMemberEverythingWhen = async(amount) =>
  {
    await setupOwners(1);
    await instance.send(amount.toString());     
    const delta = await web3Helpers.getBalanceChange(() => instance.withdrawl(), accounts[0]);
    assert.equal(delta.toString(), amount.toString());
  }
  
  it("sends the one member everything when 1000000", async function() 
  {
    await itSendsOneMemberEverythingWhen(BigNumber(1000000)); 
  });
  
  it("sends the one member everything when -1", async function() 
  {
    await itSendsOneMemberEverythingWhen(BigNumber(1000000 - 1)); 
  });
  
  it("sends the one member everything when +1", async function() 
  {
    await itSendsOneMemberEverythingWhen(BigNumber(1000000 + 1)); 
  });
  
  it("sends the one member everything when 1", async function() 
  {
    await itSendsOneMemberEverythingWhen(BigNumber(1)); 
  });

  it("can add a member", async () =>
  {
    await setupOwners(2);

    assert.equal((await instance.members.call(0))[0], accounts[0]);
    assert.equal((await instance.members.call(1))[0], accounts[1]);
    assert.isTrue(await testHelpers.doesThrow(instance.members.call(2)));
  });











  
  
  // it("should give me nothing if only dust remains", async () =>
  // {
  //   await setupOwners(1);
  //   const amount = BigNumber(1);
  //   await instance.send(amount.toString());     
  //   const delta = await getBalanceChange(async () => await instance.withdrawl(), accounts[0]);
  //   assert.equal(delta.toString(), "0");
  //   const contractBalance = await web3Helpers.getBalance(instance.address);
  //   assert.equal(contractBalance, amount.toString());
  // });
});
