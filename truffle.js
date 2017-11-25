require('babel-register');
require('babel-polyfill');

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
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
