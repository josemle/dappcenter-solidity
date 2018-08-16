const DAO = artifacts.require("./DAO.sol");
const BasicContract = artifacts.require("./tests/BasicContract.sol");
const ExampleERC20 = artifacts.require("./tests/ExampleERC20.sol");
const testHelpers = require('./Helpers/testHelpers');
const web3Helpers = require('./Helpers/web3Helpers');
const BigNumber = require('bignumber.js');
const abiDecoder = require('abi-decoder'); // NodeJS

const TWO_WEEKS = 2 * 7 * 24 * 60 * 60;
const ONE_ETHER = new BigNumber(web3Helpers.toWei('1', 'ether'));
const TWO_ETHER = new BigNumber(web3Helpers.toWei('2', 'ether'));

contract('DAO', function(accounts) 
{
  let instance;
  let contract;
  
  async function setupOwners(count)
  {
    instance = await DAO.new();
    assert.isTrue(await testHelpers.isLength(instance.members, 1));

    contract = web3Helpers.getContract(instance.abi, instance.address);
    abiDecoder.addABI(instance.abi);

    for(let i = 1; i < count; i++)
    {
      const transactionBytes = contract.methods.addMember(accounts[i], 1000000).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;

      for(let j = 1; j < i; j++)
      {
        await instance.voteOnProposal(proposalId, true, {from: accounts[j]});
      }

      await instance.executeProposal(proposalId);
    }
  } 
  
  describe("One Member", () =>
  {
    beforeEach(async () =>
    {
      await setupOwners(1);
    });

    it("has one member by default, the deployer", async () =>
    {
      assert.isTrue(await testHelpers.isLength(instance.members, 1));
      assert.equal((await instance.members.call(0))[0], accounts[0]);
    });
    
    describe("Sends the only member everything when..", () =>
    {
      itSendsOneMemberEverythingWhen = async(amount) =>
      {
        amount = new BigNumber(amount);
        await instance.send(amount.toString());     
        const delta = new BigNumber(await web3Helpers.getBalanceChangeAfterGas(() => instance.withdrawl(), accounts[0]));
        if(amount.lte(ONE_ETHER))
        {
          amount = new BigNumber(0);
        }
        else
        {
          amount = amount.minus(ONE_ETHER);
        }
        assert.equal(delta.toString(), amount.toString());
        return amount;
      }

      it("sends the one member everything when 1000000", async () =>
      {
        await itSendsOneMemberEverythingWhen(web3Helpers.toWei("2", "ether")); 
      });
      
      it("sends the one member everything when -1", async ()  =>
      {
        await itSendsOneMemberEverythingWhen(web3Helpers.toWei("2", "ether").minus(1)); 
      });
      
      it("sends the one member everything when +1", async () =>
      {
        await itSendsOneMemberEverythingWhen(web3Helpers.toWei("2", "ether").plus(1)); 
      });
      
      it("sends the one member everything when 1", async () =>
      {
        await itSendsOneMemberEverythingWhen(web3Helpers.toWei("1", "ether").plus(1)); 
      });
      
      it("sends the one member nothing when less than reserve", async () =>
      {
        assert.equal(await itSendsOneMemberEverythingWhen(web3Helpers.toWei("1", "ether")), "0"); 
      });
    });
  });

  describe("Team Management", () =>
  {
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
      
      const transactionBytes = contract.methods.addMember(accounts[2], 1000000).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
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

    it("can remove a member after voting", async () =>
    {
      await setupOwners(3);
      const transactionBytes = contract.methods.removeMember(accounts[1]).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      await instance.voteOnProposal(proposalId, false, {from: accounts[1]}); // Don't kick me!
      await instance.voteOnProposal(proposalId, true, {from: accounts[2]}); // Kick him!
      // Test
      assert.isFalse(await testHelpers.doesThrow(instance.executeProposal(proposalId)));

      // exit criteria
      assert.isTrue(await testHelpers.isLength(instance.members, 2));
      assert.equal((await instance.members.call(0))[0], accounts[0]);
      assert.equal((await instance.members.call(1))[0], accounts[2]);
    });

    it("can swap a member's lost key with a new address", async () =>
    {
      await setupOwners(3);
      const transactionBytes = contract.methods.swapMember(accounts[1], accounts[6]).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      await instance.voteOnProposal(proposalId, true, {from: accounts[1]});
      assert.isFalse(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      
      assert.equal((await instance.members.call(0))[0], accounts[0]);
      assert.equal((await instance.members.call(1))[0], accounts[6]);
      assert.equal((await instance.members.call(2))[0], accounts[2]);
    }); 

    it("can change member weights with a vote", async () =>
    {
      await setupOwners(3);
      const transactionBytes = contract.methods.setMemberWeights([accounts[0], accounts[2]], [1, 42]).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      await instance.voteOnProposal(proposalId, true, {from: accounts[1]});
      assert.isFalse(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      
      assert.equal((await instance.members.call(0))[1], 1);
      assert.equal((await instance.members.call(1))[1], 1000000);
      assert.equal((await instance.members.call(2))[1], 42);
    });

    it("can change the time interval till minority can execute", async () =>
    {
      await setupOwners(3);
      let transactionBytes = contract.methods.setTimeTillMinorityCanExecute(TWO_WEEKS * .5).encodeABI();
      let proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      let proposalId = proposal.logs[0].args.proposalId;
      await instance.voteOnProposal(proposalId, true, {from: accounts[1]});
      assert.isFalse(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      
      // Change should be complete, let's test to confirm the wait time changed
      transactionBytes = contract.methods.addMember(accounts[6], 1000000).encodeABI();
      proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      proposalId = proposal.logs[0].args.proposalId;
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      await web3Helpers.increaseTime(TWO_WEEKS * .5 + 1);
      assert.isFalse(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
    });
    
    it("can change the time interval till expired", async () =>
    {
      await setupOwners(1);
      let transactionBytes = contract.methods.setTimeTillExpired(TWO_WEEKS + 1).encodeABI();
      let proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      let proposalId = proposal.logs[0].args.proposalId;
      await instance.executeProposal(proposalId);
      transactionBytes = contract.methods.addMember(accounts[6], 1000000).encodeABI();
      proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      proposalId = proposal.logs[0].args.proposalId;
      await web3Helpers.increaseTime(TWO_WEEKS + 2);
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
    });
    
    it("can not execute once expired", async () =>
    {
      await setupOwners(1);
      let transactionBytes = contract.methods.setTimeTillExpired(TWO_WEEKS + 1).encodeABI();
      let proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      let proposalId = proposal.logs[0].args.proposalId;
      await web3Helpers.increaseTime(TWO_WEEKS * 3);
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
    });

    it("can change the minimum reserve and then cash out", async () =>
    {
      await setupOwners(1);
      await instance.send(TWO_ETHER.toString());     
      const transactionBytes = contract.methods.setMinimumReserve(0).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;
      await instance.executeProposal(proposalId);
      const delta = new BigNumber(await web3Helpers.getBalanceChangeAfterGas(() => instance.withdrawl(), accounts[0]));
      assert(delta.toString() == TWO_ETHER.toString())
    });
  });

  describe("Voting", () =>
  {
    it("can execute once majority approved", async () =>
    {
      await setupOwners(2);
      const transactionBytes = contract.methods.addMember(accounts[2], 1000000).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      await instance.voteOnProposal(proposalId, true, {from: accounts[1]});
      assert.isFalse(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
    });

    it("can execute an 50% or less approved proposal only after 2 weeks", async () =>
    {
      await setupOwners(2);
      const transactionBytes = contract.methods.addMember(accounts[2], 1000000).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      await web3Helpers.increaseTime(TWO_WEEKS + 1);
      assert.isFalse(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
    });
    
    it("cannot execute if majority decline, even after 2 weeks", async () =>
    {
      await setupOwners(3);
      const transactionBytes = contract.methods.addMember(accounts[3], 1000000).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      await instance.voteOnProposal(proposalId, false, {from: accounts[1]});
      await instance.voteOnProposal(proposalId, false, {from: accounts[2]});
      await web3Helpers.increaseTime(TWO_WEEKS + 1);
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
    });
  });

  describe("Team Withdrawls", () =>
  {
    it("distributes by weight 60/30/10", async() =>
    {
      await setupOwners(3);
      const transactionBytes = contract.methods.setMemberWeights(
        [accounts[0], accounts[1], accounts[2]],
        [6000, 3000, 1000]).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;
      await instance.voteOnProposal(proposalId, true, {from: accounts[1]});
      await instance.executeProposal(proposalId);
      await instance.send(TWO_ETHER.toString());
      const balanceBefore2 = await web3Helpers.getBalance(accounts[1]);
      const balanceBefore3 = await web3Helpers.getBalance(accounts[2]);
      const delta1 = await web3Helpers.getBalanceChangeAfterGas(() => instance.withdrawl(), accounts[0]);
      const balanceAfter2 = await web3Helpers.getBalance(accounts[1]);
      const balanceAfter3 = await web3Helpers.getBalance(accounts[2]);
      const delta2 = balanceAfter2.minus(balanceBefore2);
      const delta3 = balanceAfter3.minus(balanceBefore3);
      assert.equal(delta1.toString(), ONE_ETHER.times(60).dividedToIntegerBy(100).toString());
      assert.equal(delta2.toString(), ONE_ETHER.times(30).dividedToIntegerBy(100).toString());
      assert.equal(delta3.toString(), ONE_ETHER.times(10).dividedToIntegerBy(100).toString());
    });

    it("can transfer reserved funds with a vote", async() =>
    {
      await setupOwners(3);
      await instance.send(ONE_ETHER.toString());
      const transactionBytes = contract.methods.send(accounts[6], ONE_ETHER.toString()).encodeABI();
      const proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId;
      await instance.voteOnProposal(proposalId, true, {from: accounts[1]});
      const balanceBefore = await web3Helpers.getBalance(accounts[6]);
      await instance.executeProposal(proposalId);
      const balanceAfter = await web3Helpers.getBalance(accounts[6]);
      const delta = balanceAfter.minus(balanceBefore);
      assert.equal(delta.toString(), ONE_ETHER.toString());
    });

    it("can understand what we are voting on", async() =>
    {
      await setupOwners(1);
      await instance.send(ONE_ETHER.toString());
      const transactionBytes = contract.methods.send(accounts[6], ONE_ETHER.toString()).encodeABI();
      const method = abiDecoder.decodeMethod(transactionBytes);
      assert.equal(method.name, "send");
      assert.equal(method.params[0].value, accounts[6].toString());
      assert.equal(method.params[0].type, "address");
      assert.equal(method.params[1].value, ONE_ETHER.toString());
    });
  });

  describe("External Contract Calls", () =>
  {
    let basicInstance;
    let basicContract;

    beforeEach(async () =>
    {
      await setupOwners(1);
      basicInstance = await BasicContract.new();
      basicContract = web3Helpers.getContract(basicInstance.abi, basicInstance.address);
    });

    it("function() payable", async () =>
    {
      const transactionBytes = contract.methods.send(basicInstance.address, ONE_ETHER).encodeABI();
      const proposal = await instance.addProposal(basicInstance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId; 
      const execution = await instance.executeProposal(proposalId);
      assert.isTrue(testHelpers.logContainsDataNumber(execution, 12345));
    });

    it("test()", async () =>
    {
      const transactionBytes = basicContract.methods.test().encodeABI();
      const proposal = await instance.addProposal(basicInstance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId; 
      const execution = await instance.executeProposal(proposalId);
      assert.isTrue(testHelpers.logContainsDataNumber(execution, 23456));
    });

    it("testPayable()", async () =>
    {
      await instance.send(TWO_ETHER.toString());
      const transactionBytes = basicContract.methods.testPayable().encodeABI();
      const proposal = await instance.addProposal(basicInstance.address, transactionBytes, ONE_ETHER.toString());
      const proposalId = proposal.logs[0].args.proposalId; 
      const execution = await instance.executeProposal(proposalId);
      assert.isTrue(testHelpers.logContainsDataNumber(execution, 34567));
    });

    it("test42()", async () =>
    {
      const transactionBytes = basicContract.methods.test42(42).encodeABI();
      const proposal = await instance.addProposal(basicInstance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId; 
      const execution = await instance.executeProposal(proposalId);
      assert.isTrue(testHelpers.logContainsDataNumber(execution, 45678));
    });

    it("test42Payable()", async () =>
    {
      await instance.send(TWO_ETHER.toString());
      const transactionBytes = basicContract.methods.test42Payable(42).encodeABI();
      const proposal = await instance.addProposal(basicInstance.address, transactionBytes, ONE_ETHER.toString());
      const proposalId = proposal.logs[0].args.proposalId; 
      const execution = await instance.executeProposal(proposalId);
      assert.isTrue(testHelpers.logContainsDataNumber(execution, 56789));
    });
    
    it("cannot execute the same proposal twice", async() =>
    {
      const transactionBytes = basicContract.methods.test().encodeABI();
      const proposal = await instance.addProposal(basicInstance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId; 
      assert.isFalse(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
      assert.isTrue(await testHelpers.doesThrow(instance.executeProposal(proposalId)));
    });
  });

  describe("ERC20", async() =>
  {
    const startingBalance = new BigNumber(10000);
    let exampleERC20Instance;
    let exampleERC20Contract;

    beforeEach(async() =>
    {
      exampleERC20Instance = await ExampleERC20.new();
      exampleERC20Contract = web3Helpers.getContract(exampleERC20Instance.abi, exampleERC20Instance.address);
    }); 
    
    it("vote to spend an ERC20", async() =>
    {
      await setupOwners(1);
      assert.equal((await exampleERC20Instance.balanceOf(accounts[0])).toString(), startingBalance.toString());
      await exampleERC20Instance.transfer(instance.address, startingBalance.toString());
      assert.equal((await exampleERC20Instance.balanceOf(accounts[0])).toString(), "0");
      assert.equal((await exampleERC20Instance.balanceOf(instance.address)).toString(), startingBalance.toString());
      const transactionBytes = exampleERC20Contract.methods.transfer(accounts[6], startingBalance).encodeABI();
      const proposal = await instance.addProposal(exampleERC20Instance.address, transactionBytes, 0);
      const proposalId = proposal.logs[0].args.proposalId; 
      assert.equal((await exampleERC20Instance.balanceOf(instance.address)).toString(), startingBalance.toString());
      await instance.executeProposal(proposalId);
      assert.equal((await exampleERC20Instance.balanceOf(accounts[6])).toString(), startingBalance.toString());
    });

    it("distributes by weight 60/30/10", async() =>
    {
      await setupOwners(3);
      await exampleERC20Instance.transfer(instance.address, startingBalance.toString());

      let transactionBytes = contract.methods.setMemberWeights(
        [accounts[0], accounts[1], accounts[2]],
        [6000, 3000, 1000]).encodeABI();
      let proposal = await instance.addProposal(instance.address, transactionBytes, 0);
      let proposalId = proposal.logs[0].args.proposalId;
      await instance.voteOnProposal(proposalId, true, {from: accounts[1]});
      await instance.executeProposal(proposalId);
      
      await instance.withdrawlERC20(exampleERC20Instance.address);

      assert.equal((await exampleERC20Instance.balanceOf(accounts[2])).toString(), startingBalance.times(10).dividedToIntegerBy(100).toString());
      assert.equal((await exampleERC20Instance.balanceOf(accounts[1])).toString(), startingBalance.times(30).dividedToIntegerBy(100).toString());
      assert.equal((await exampleERC20Instance.balanceOf(accounts[0])).toString(), startingBalance.times(60).dividedToIntegerBy(100).toString());
    });
  });
});
