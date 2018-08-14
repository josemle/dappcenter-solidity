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
    instance = await DAO.new();
    assert.isTrue(await testHelpers.isLength(instance.members, 1));

    contract = web3Helpers.getContract(instance.abi, instance.address);

    for(let i = 1; i < count; i++)
    {
      const trasactionBytes = contract.methods.addMember(accounts[i], 1000000).encodeABI();
      const proposal = await instance.addProposal(instance.address, trasactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;

      for(let j = 1; j < i; j++)
      {
        await instance.voteOnProposal(proposalId, true, {from: accounts[j]});
      }

      await instance.executeProposal(proposalId);
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
    assert.isTrue(await testHelpers.isLength(instance.members, 2));
    assert.equal((await instance.members.call(0))[0], accounts[0]);
    assert.equal((await instance.members.call(1))[0], accounts[1]);
  });

  it("cannot add two members without a vote", async () =>
  {
    await setupOwners(2);

    const trasactionBytes = contract.methods.addMember(accounts[2], 1000000).encodeABI();
    const proposal = await instance.addProposal(instance.address, trasactionBytes, 0);
    assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposal.logs[0].args.proposalId)));
  });

  it("can add two members after a vote", async () =>
  {
    await setupOwners(3);
    assert.isTrue(await testHelpers.isLength(instance.members, 3));
    assert.equal((await instance.members.call(0))[0], accounts[0]);
    assert.equal((await instance.members.call(1))[0], accounts[1]);
    assert.equal((await instance.members.call(2))[0], accounts[2]);
  });

  it("can support a large team", async () =>
  {
    await setupOwners(accounts.length);
    assert.isTrue(await testHelpers.isLength(instance.members, accounts.length));
  });

  it("can execute an minority approved proposal after 2 weeks", async () =>
  {
    await setupOwners(2);

    const trasactionBytes = contract.methods.addMember(accounts[2], 1000000).encodeABI();
    const proposal = await instance.addProposal(instance.address, trasactionBytes, 0);
    assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposal.logs[0].args.proposalId)));
    await web3Helpers.increaseTime(2 * 7 * 24 * 60 * 60 + 1);
    assert.isFalse(await testHelpers.doesThrow(instance.executeProposal(proposal.logs[0].args.proposalId)));
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
