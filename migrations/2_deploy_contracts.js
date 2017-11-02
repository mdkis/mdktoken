var MDKToken = artifacts.require("./MDKToken.sol");

module.exports = function(deployer) {
  deployer.deploy(MDKToken);
};
