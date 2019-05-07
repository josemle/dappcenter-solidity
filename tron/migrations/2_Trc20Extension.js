var Trc20Extension = artifacts.require("Trc20Extension");
var TestTrc20 = artifacts.require("TestTrc20");

module.exports = function(deployer) {
  deployer.deploy(Trc20Extension);
  deployer.deploy(TestTrc20);
};
