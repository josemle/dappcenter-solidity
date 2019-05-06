// const messageBoard = artifacts.require("./MessageBoard.sol");
// const testHelpers = require("./Helpers/testHelpers");
// const web3Helpers = require("./Helpers/web3Helpers");
// const BigNumber = require("bignumber.js");
// const abiDecoder = require("abi-decoder"); // NodeJS

// TODO restore tests
contract.skip("messageBoard", function(accounts) {
  // const deployer = accounts[0];
  // const owner = accounts[1];
  // function getUser(userId) {
  //   userId = userId % (accounts.length - 2);
  //   return accounts[userId + 2];
  // }
  // let instance;
  // let contract;
  // describe("Free", () => {
  //   beforeEach(async () => {
  //     instance = await messageBoard.new(owner, 0, 0);
  //     contract = web3Helpers.getContract(instance.abi, instance.address);
  //   });
  //   it("can post", async () => {
  //     const message = "my first message";
  //     let result = await instance.postMessage(message);
  //     let log = web3Helpers.parseLogs(
  //       instance.abi,
  //       "NewMessage",
  //       result.receipt.logs[0]
  //     );
  //     assert.equal(log.message, message);
  //   });
  //   it("can spam the message board", async () => {
  //     for (let i = 0; i < 999; i++) {
  //       const message = "my first message " + i;
  //       let result = await instance.postMessage(message);
  //       let log = web3Helpers.parseLogs(
  //         instance.abi,
  //         "NewMessage",
  //         result.receipt.logs[0]
  //       );
  //       assert.equal(log.message, message);
  //     }
  //   });
  //   it("can tip", async () => {
  //     const tipAmount = 42;
  //     let result = await instance.postMessage("first message", {
  //       from: getUser(0)
  //     });
  //     let log = web3Helpers.parseLogs(
  //       instance.abi,
  //       "NewMessage",
  //       result.receipt.logs[0]
  //     );
  //     const balanceBefore = new BigNumber(
  //       await web3Helpers.getBalance(getUser(0))
  //     );
  //     await instance.tipMessage(log.messageId, {
  //       from: getUser(1),
  //       value: tipAmount
  //     });
  //     const balanceAfter = new BigNumber(
  //       await web3Helpers.getBalance(getUser(0))
  //     );
  //     assert.equal(
  //       balanceAfter.toString(),
  //       balanceBefore.plus(tipAmount).toString()
  //     );
  //   });
  // });
  // describe("Cost to post", () => {
  //   const costToPost = 69;
  //   beforeEach(async () => {
  //     instance = await messageBoard.new(owner, costToPost, 0);
  //     contract = web3Helpers.getContract(instance.abi, instance.address);
  //   });
  //   it("can post", async () => {
  //     const message = "my first message";
  //     const balanceBefore = new BigNumber(await web3Helpers.getBalance(owner));
  //     await instance.postMessage(message, {
  //       value: costToPost,
  //       from: getUser(0)
  //     });
  //     const balanceAfter = new BigNumber(await web3Helpers.getBalance(owner));
  //     assert.equal(
  //       balanceAfter.toString(),
  //       balanceBefore.plus(costToPost).toString()
  //     );
  //   });
  //   it("can't post without paying", async () => {
  //     const message = "my first message";
  //     try {
  //       await instance.postMessage(message, { from: getUser(0) });
  //     } catch (e) {
  //       return;
  //     }
  //     assert.fail();
  //   });
  // });
  // describe("Share of tips", () => {
  //   const inverseShareOfTips = 500; // == .2%
  //   beforeEach(async () => {
  //     instance = await messageBoard.new(owner, 0, inverseShareOfTips);
  //     contract = web3Helpers.getContract(instance.abi, instance.address);
  //     await instance.postMessage("My message", { from: getUser(0) });
  //   });
  //   it("distributes tips", async () => {
  //     const ownerBalanceBefore = new BigNumber(
  //       await web3Helpers.getBalance(owner)
  //     );
  //     const authorBalanceBefore = new BigNumber(
  //       await web3Helpers.getBalance(getUser(0))
  //     );
  //     const tip = 42000;
  //     const ownerFee = Math.floor(tip / inverseShareOfTips);
  //     assert.equal(ownerFee, 84);
  //     const authorTip = tip - ownerFee;
  //     assert.equal(authorTip, 41916);
  //     const ownerBalanceAfter = new BigNumber(
  //       await web3Helpers.getBalance(owner)
  //     );
  //     const authorBalanceAfter = new BigNumber(
  //       await web3Helpers.getBalance(getUser(0))
  //     );
  //     assert(
  //       ownerBalanceAfter.toString(),
  //       ownerBalanceBefore.plus(ownerFee).toString()
  //     );
  //     assert(
  //       authorBalanceAfter.toString(),
  //       authorBalanceBefore.plus(authorTip).toString()
  //     );
  //   });
  //   it("rounds in favor of the author (to 0)", async () => {
  //     const ownerBalanceBefore = new BigNumber(
  //       await web3Helpers.getBalance(owner)
  //     );
  //     const authorBalanceBefore = new BigNumber(
  //       await web3Helpers.getBalance(getUser(0))
  //     );
  //     const tip = 499;
  //     const ownerFee = Math.floor(tip / inverseShareOfTips);
  //     assert.equal(ownerFee, 0);
  //     const authorTip = tip - ownerFee;
  //     assert.equal(authorTip, 499);
  //     const ownerBalanceAfter = new BigNumber(
  //       await web3Helpers.getBalance(owner)
  //     );
  //     const authorBalanceAfter = new BigNumber(
  //       await web3Helpers.getBalance(getUser(0))
  //     );
  //     assert(
  //       ownerBalanceAfter.toString(),
  //       ownerBalanceBefore.plus(ownerFee).toString()
  //     );
  //     assert(
  //       authorBalanceAfter.toString(),
  //       authorBalanceBefore.plus(authorTip).toString()
  //     );
  //   });
  //   it("rounds in favor of the author (to >0)", async () => {
  //     const ownerBalanceBefore = new BigNumber(
  //       await web3Helpers.getBalance(owner)
  //     );
  //     const authorBalanceBefore = new BigNumber(
  //       await web3Helpers.getBalance(getUser(0))
  //     );
  //     const tip = 999;
  //     const ownerFee = Math.floor(tip / inverseShareOfTips);
  //     assert.equal(ownerFee, 1);
  //     const authorTip = tip - ownerFee;
  //     assert.equal(authorTip, 998);
  //     const ownerBalanceAfter = new BigNumber(
  //       await web3Helpers.getBalance(owner)
  //     );
  //     const authorBalanceAfter = new BigNumber(
  //       await web3Helpers.getBalance(getUser(0))
  //     );
  //     assert(
  //       ownerBalanceAfter.toString(),
  //       ownerBalanceBefore.plus(ownerFee).toString()
  //     );
  //     assert(
  //       authorBalanceAfter.toString(),
  //       authorBalanceBefore.plus(authorTip).toString()
  //     );
  //   });
  // });
  // describe("tips", () => {
  //   beforeEach(async () => {
  //     instance = await messageBoard.new(owner, 0, 0);
  //     contract = web3Helpers.getContract(instance.abi, instance.address);
  //   });
  //   it("should update totalTips", async () => {
  //     let result = await instance.postMessage("My message", {
  //       from: getUser(0)
  //     });
  //     const messageId = web3Helpers
  //       .parseLogs(instance.abi, "NewMessage", result.receipt.logs[0])
  //       .messageId.toString();
  //     await instance.tipMessage(messageId, { value: "42", from: getUser(2) });
  //     assert.equal((await instance.messages(messageId))[3], "42");
  //     await instance.tipMessage(messageId, { value: "42", from: getUser(2) });
  //     assert.equal((await instance.messages(messageId))[3], "84");
  //   });
  //   it("can spam tips", async () => {
  //     for (let i = 0; i < 999; i++) {
  //       const message = "my message " + i;
  //       let result = await instance.postMessage(message, { from: getUser(i) });
  //       const messageId = web3Helpers
  //         .parseLogs(instance.abi, "NewMessage", result.receipt.logs[0])
  //         .messageId.toString();
  //       await instance.tipMessage(messageId, {
  //         value: i.toString(),
  //         from: getUser(i + 1)
  //       });
  //     }
  //     await instance.tipMessage(99, { value: "999999999", from: getUser(1) });
  //   });
  // });
});
