var Erc20Ext = artifacts.require("Erc20Ext");
var TestTrc20 = artifacts.require("TestTrc20");

module.exports = function(deployer) {
  deployer.deploy(Erc20Ext);
  deployer.deploy(TestTrc20);
};
