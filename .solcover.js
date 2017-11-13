require('babel-register');
require('babel-polyfill');

module.exports = {
  testCommand: "truffle test -- --compilers js:babel-core/register",
  copyNodeModules: true
}
