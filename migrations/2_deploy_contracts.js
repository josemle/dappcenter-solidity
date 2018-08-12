var DAO = artifacts.require("./DAO.sol");

module.exports = function(deployer) {
  deployer.deploy(DAO);
};
