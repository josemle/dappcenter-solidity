const Pixels = artifacts.require("./Pixels.sol");
const testHelpers = require('./Helpers/testHelpers');
const web3Helpers = require('./Helpers/web3Helpers');
const BigNumber = require('bignumber.js');
const abiDecoder = require('abi-decoder'); // NodeJS

contract('Pixels', function(accounts) 
{
  const deployer = accounts[0];
  const owner1 = accounts[1];
  const owner2 = accounts[2];
  function getUser(userId)
  {
    return accounts[userId + 3];
  }
  
  const pricePerPixel = web3Helpers.toWei(1, 'finney'); // Should be 1 trx

  let instance;
  let contract;

  beforeEach(async () =>
  {
    instance = await Pixels.new(owner1, owner2, pricePerPixel.toString());
    contract = web3Helpers.getContract(instance.abi, instance.address);
  });

  afterEach(async() =>
  {
    assert.equal((await web3Helpers.getBalance(instance.address)).toString(), "0");
  });
  
  describe("Basic", () =>
  {
    it("has a price per pixel", async () =>
    {
      assert.equal((await instance.getPixelPrice(2, 5)).toString(), pricePerPixel.toString());
    });

    it("can get a pixel", async() =>
    {
      assert.equal(await instance.getPixel(2, 5), 0);
    });
    
    it("can set a pixel", async () =>
    {
      await instance.setPixel(2, 5, 123, {from: getUser(0), value: pricePerPixel.toString()});
      assert.equal(await instance.getPixel(2, 5), 123);
      assert.equal((await instance.getPixelPrice(2, 5)).toString(), pricePerPixel.times(2).toString());
    });
    
    it("can get price for a set of pixels", async() =>
    {
      assert.equal((await instance.getPixelsPrice([1, 1], [1, 2])).toString(), pricePerPixel.times(2).toString());
    });
    
    it("can set multiple pixels", async() =>
    {
      await instance.setPixels([1, 1], [1, 2], [123, 124], {from: getUser(0), value: pricePerPixel.times(2).toString()});
      assert.equal(
        testHelpers.toCsv(await instance.getPixels([1, 1], [1, 2])),
        testHelpers.toCsv([123, 124]));
      assert.equal((await instance.getPixelsPrice([1, 1], [1, 2])).toString(), pricePerPixel.times(4).toString());
    });

    it("can get a row of pixels", async() =>
    {
      assert.equal(
        testHelpers.toCsv(await instance.getPixelRow(3)), 
        testHelpers.toCsv(new Array(1000).fill(0)));
    });

    // Wouldn't it be cool if...
    // it("can get all the pixels", async() =>
    // {
    //   assert.equal(
    //     testHelpers.toCsv(await instance.getAllPixels()), 
    //     testHelpers.toCsv(new Array(1000).fill(new Array(1000).fill(0))));
    // });
  });

  describe("Multiple Users", () =>
  {
    async function checkForBreakEven(previousBuyerCount)
    {
      const originalBalanceUser0 = new BigNumber(await web3Helpers.getBalance(getUser(0)));
  
      let pixelCount = 1;
      for(let i = 0; i < previousBuyerCount; i++)
      {
        await instance.setPixel(2, 5, 123, {from: getUser(1), value: pricePerPixel.times(pixelCount++).toString()});
      }
  
      let tx = await instance.setPixel(2, 5, 123, {from: getUser(0), value: pricePerPixel.times(pixelCount++).toString()});
      const gasUser0 = new BigNumber(await web3Helpers.getGasCost(tx.tx));
  
      for(let i = 0; i < previousBuyerCount + 1; i++)
      {
        await instance.setPixel(2, 5, 123, {from: getUser(1), value: pricePerPixel.times(pixelCount++).toString()});
      }
  
      const deltaBalanceUser0 = new BigNumber(await web3Helpers.getBalance(getUser(0))).minus(originalBalanceUser0);
      assert.equal(deltaBalanceUser0.plus(gasUser0).toString(), "0");
    }

    it("pays previous owner", async () =>
    {
      const originalBalanceOwner1 = new BigNumber(await web3Helpers.getBalance(owner1));
      const originalBalanceOwner2 = new BigNumber(await web3Helpers.getBalance(owner1));
      const originalBalanceUser0 = new BigNumber(await web3Helpers.getBalance(getUser(0)));
      const originalBalanceUser1 = new BigNumber(await web3Helpers.getBalance(getUser(1)));
      
      let tx = await instance.setPixel(2, 5, 123, {from: getUser(0), value: pricePerPixel.toString()});
      const gasUser0 = new BigNumber(await web3Helpers.getGasCost(tx.tx));
      tx = await instance.setPixel(2, 5, 123, {from: getUser(1), value: pricePerPixel.times(2).toString()});
      const gasUser1 = new BigNumber(await web3Helpers.getGasCost(tx.tx));

      const deltaBalanceOwner1 = new BigNumber(await web3Helpers.getBalance(owner1)).minus(originalBalanceOwner1);
      const deltaBalanceOwner2 = new BigNumber(await web3Helpers.getBalance(owner1)).minus(originalBalanceOwner2);
      const deltaBalanceUser0 = new BigNumber(await web3Helpers.getBalance(getUser(0))).minus(originalBalanceUser0);
      const deltaBalanceUser1 = new BigNumber(await web3Helpers.getBalance(getUser(1))).minus(originalBalanceUser1);

      assert.equal(deltaBalanceOwner1.toString(), pricePerPixel.toString());
      assert.equal(deltaBalanceOwner2.toString(), pricePerPixel.toString());
      assert.equal(deltaBalanceUser0.toString(), gasUser0.times(-1).toString()); // Break even minus gas
      assert.equal(deltaBalanceUser1.toString(), pricePerPixel.times(-2).minus(gasUser1).toString());
    });
    
    it("pays previous 2 owners", async () =>
    {
      const originalBalanceOwner1 = new BigNumber(await web3Helpers.getBalance(owner1));
      const originalBalanceOwner2 = new BigNumber(await web3Helpers.getBalance(owner1));
      const originalBalanceUser0 = new BigNumber(await web3Helpers.getBalance(getUser(0)));
      const originalBalanceUser1 = new BigNumber(await web3Helpers.getBalance(getUser(1)));
      const originalBalanceUser2 = new BigNumber(await web3Helpers.getBalance(getUser(2)));
      
      let tx = await instance.setPixel(2, 5, 123, {from: getUser(0), value: pricePerPixel.toString()});
      const gasUser0 = new BigNumber(await web3Helpers.getGasCost(tx.tx));
      tx = await instance.setPixel(2, 5, 123, {from: getUser(1), value: pricePerPixel.times(2).toString()});
      const gasUser1 = new BigNumber(await web3Helpers.getGasCost(tx.tx));
      tx = await instance.setPixel(2, 5, 123, {from: getUser(2), value: pricePerPixel.times(3).toString()});
      const gasUser2 = new BigNumber(await web3Helpers.getGasCost(tx.tx));

      const deltaBalanceOwner1 = new BigNumber(await web3Helpers.getBalance(owner1)).minus(originalBalanceOwner1);
      const deltaBalanceOwner2 = new BigNumber(await web3Helpers.getBalance(owner1)).minus(originalBalanceOwner2);
      const deltaBalanceUser0 = new BigNumber(await web3Helpers.getBalance(getUser(0))).minus(originalBalanceUser0);
      const deltaBalanceUser1 = new BigNumber(await web3Helpers.getBalance(getUser(1))).minus(originalBalanceUser1);
      const deltaBalanceUser2 = new BigNumber(await web3Helpers.getBalance(getUser(2))).minus(originalBalanceUser2);

      assert.equal(deltaBalanceOwner1.toString(), pricePerPixel.times(1.5).toString());
      assert.equal(deltaBalanceOwner2.toString(), pricePerPixel.times(1.5).toString());
      assert.equal(deltaBalanceUser0.toString(), pricePerPixel.minus(gasUser0).toString()); // Profit
      assert.equal(deltaBalanceUser1.toString(), pricePerPixel.times(-1).minus(gasUser1).toString()); // Loss 
      assert.equal(deltaBalanceUser2.toString(), pricePerPixel.times(-3).minus(gasUser2).toString());
    });
    
    it("pays previous 3 owners", async () =>
    {
      const originalBalanceOwner1 = new BigNumber(await web3Helpers.getBalance(owner1));
      const originalBalanceOwner2 = new BigNumber(await web3Helpers.getBalance(owner1));
      const originalBalanceUser0 = new BigNumber(await web3Helpers.getBalance(getUser(0)));
      const originalBalanceUser1 = new BigNumber(await web3Helpers.getBalance(getUser(1)));
      const originalBalanceUser2 = new BigNumber(await web3Helpers.getBalance(getUser(2)));
      const originalBalanceUser3 = new BigNumber(await web3Helpers.getBalance(getUser(3)));
      
      let tx = await instance.setPixel(2, 5, 123, {from: getUser(0), value: pricePerPixel.toString()});
      const gasUser0 = new BigNumber(await web3Helpers.getGasCost(tx.tx));
      tx = await instance.setPixel(2, 5, 123, {from: getUser(1), value: pricePerPixel.times(2).toString()});
      const gasUser1 = new BigNumber(await web3Helpers.getGasCost(tx.tx));
      tx = await instance.setPixel(2, 5, 123, {from: getUser(2), value: pricePerPixel.times(3).toString()});
      const gasUser2 = new BigNumber(await web3Helpers.getGasCost(tx.tx));
      tx = await instance.setPixel(2, 5, 123, {from: getUser(3), value: pricePerPixel.times(4).toString()});
      const gasUser3 = new BigNumber(await web3Helpers.getGasCost(tx.tx));

      const deltaBalanceOwner1 = new BigNumber(await web3Helpers.getBalance(owner1)).minus(originalBalanceOwner1);
      const deltaBalanceOwner2 = new BigNumber(await web3Helpers.getBalance(owner1)).minus(originalBalanceOwner2);
      const deltaBalanceUser0 = new BigNumber(await web3Helpers.getBalance(getUser(0))).minus(originalBalanceUser0);
      const deltaBalanceUser1 = new BigNumber(await web3Helpers.getBalance(getUser(1))).minus(originalBalanceUser1);
      const deltaBalanceUser2 = new BigNumber(await web3Helpers.getBalance(getUser(2))).minus(originalBalanceUser2);
      const deltaBalanceUser3 = new BigNumber(await web3Helpers.getBalance(getUser(3))).minus(originalBalanceUser3);

      assert.equal(deltaBalanceOwner1.toString(), pricePerPixel.times(2).toString());
      assert.equal(deltaBalanceOwner2.toString(), pricePerPixel.times(2).toString());
      assert.equal(deltaBalanceUser0.toString(), pricePerPixel.times(2).minus(gasUser0).toString()); // Profit
      assert.equal(deltaBalanceUser1.toString(), pricePerPixel.times(0).minus(gasUser1).toString());  // Break even minus gas
      assert.equal(deltaBalanceUser2.toString(), pricePerPixel.times(-2).minus(gasUser2).toString()); // Loss
      assert.equal(deltaBalanceUser3.toString(), pricePerPixel.times(-4).minus(gasUser3).toString());
    });
    
    it("takes 4 buys to break even if 3 bought before me", async () =>
    {
      await checkForBreakEven(3);
    });
    
    it("takes 20 buys to break even if 19 bought before me", async () =>
    {
      await checkForBreakEven(19);
    });
    
    // This passes but takes a long time (3mins)
    it.skip("takes 200 buys to break even if 199 bought before me", async () =>
    {
      await checkForBreakEven(199);
    });
  });

  describe("Price check", () =>
  {
    it("costs x or less gas for the first pixel", async() =>
    {
      let pixelCount = 1;
      let tx;
      tx = await instance.setPixel(2, 5, 123, {from: getUser(1), value: pricePerPixel.times(pixelCount++).toString()});
      const firstGasCost = new BigNumber(await web3Helpers.getGasCost(tx.tx));
      assert.isTrue(firstGasCost.lte(10182400000000000));
    });

    it("costs less than 10x the gas to pay 100x the people", async() =>
    {
      let pixelCount = 1;
      let tx;
      tx = await instance.setPixel(2, 5, 123, {from: getUser(1), value: pricePerPixel.times(pixelCount++).toString()});
      const firstGasCost = new BigNumber(await web3Helpers.getGasCost(tx.tx));
      for(let i = 0; i < 1; i++)
      {
        tx = await instance.setPixel(2, 5, 123, {from: getUser(1), value: pricePerPixel.times(pixelCount++).toString()});
      }

      const finalGasCost = new BigNumber(await web3Helpers.getGasCost(tx.tx));
      console.log(finalGasCost.toString());
      assert.isTrue(finalGasCost.lt(firstGasCost.times(10)));
    });
  });
});
