var MDKToken = artifacts.require("./MDKToken.sol");
var MDKPreICO = artifacts.require("./MDKPreICO.sol");

const teamAddress = '0x4E5bD325991F7c93d6b3039ef2ee6AC43684deE5'

module.exports = function(deployer, network) {
  deployer.deploy(MDKToken, teamAddress)
  .then(() => {
    if (network !== 'rinkeby' && network !== 'main') return
    deployer.deploy(MDKPreICO, (Date.now() / 1000) + 180, //Start 2 minutes after
      (Date.now() / 1000) + (60 * 60 * 24 * 31), //End 1 month after
      22500,
      MDKToken.address,
      teamAddress);
  })
};
