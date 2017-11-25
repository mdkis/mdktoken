var MDKToken = artifacts.require("./MDKToken.sol");
var MDKPreICO = artifacts.require("./MDKPreICO.sol");

module.exports = function(deployer, network) {
  deployer.deploy(MDKToken)
  .then(() => {
    if (network !== 'rinkeby' && network !== 'main') return
    deployer.deploy(MDKPreICO, (Date.now() / 1000) + 120, //Start 2 minutes after
      (Date.now() / 1000) + (60 * 60 * 24 * 31), //End 1 month after
      22500,
      MDKToken.address);
  })
};
