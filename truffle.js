require('babel-register');
require('babel-polyfill');
const Provider = require('./helpers/Provider');
const ProviderRinkeby = Provider.createRinkebyNetwork("key");
const ProviderMainnet = Provider.createMainNetwork("key");

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      gasLimit: 10000000,
      network_id: "*" // Match any network id
    },
    coverage: {
      host: "localhost",
      port: 9555,
      network_id: "*" // Match any network id
    },
    infuraRinkeby: ProviderRinkeby.getNetwork(),
    infuraMainnet: ProviderMainnet.getNetwork()
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
