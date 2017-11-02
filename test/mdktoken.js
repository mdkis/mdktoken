var util = require('util')

var MDKToken = artifacts.require("./MDKToken.sol")
var MDKPreICO = artifacts.require("./MDKPreICO.sol")

contract('MDKToken', function(accounts) {
  it("Team reserve should have 200M Tokens", async () => {
    let instance = await MDKToken.deployed()
    let teamReserve1 = await instance.teamTokens.call()
    let balance = await instance.balanceOf.call(teamReserve1)
    assert(balance.valueOf(), '20000000000000000', 'Wrong amount')
  })
  it("Reserve should have 50M Tokens", async () => {
    let instance = await MDKToken.deployed()
    let reserveTokens = await instance.reserveTokens.call()
    let balance = await instance.balanceOf.call(reserveTokens)
    assert(balance.valueOf(), '5000000000000000', 'Wrong amount')
  })
  it("Should freeze", async () => {
    let instance = await MDKToken.deployed()

    let transferError = null
    try {
      let transfer = await instance.transfer(0x1, 100000000)
    } catch (e) {
      transferError = e
    }

    assert(transferError != null, 'Transfered successfully while frozen')

    await instance.unfreeze()

    let frozen = await instance.isFrozen.call()
    assert(!frozen, 'Should be unfrozen')

    let transferSecondError = null
    try {
      let transfer = await instance.transfer(accounts[0], 100000000)
    } catch (e) {
      transferSecondError = e
    }

    assert(transferSecondError == null, 'Not Transfered successfully while unfrozen')
  })

  it("Should create PreICO", async () => {
    let instance = await MDKToken.new()
    let ico = await MDKPreICO.new(Date.now() / 1000 + 10000,
      Date.now() / 1000 + 60000,
      22500,
      instance.address)

    let icoCreation = await instance.startICO(ico.address)
    let icoAddress = await instance.ICO.call()
    let icoBalance = await instance.balanceOf.call(icoAddress)

    assert(ico.address, icoAddress, 'Addresses not equal')
    assert(icoBalance, '40000000000000000', 'ICO Balance not equasl 400M')
  })

  it("Should mint correctly and with bonuses", async () => {
    let instance = await MDKToken.new()
    let ico = await MDKPreICO.new(Date.now() / 1000 + 1,
      Date.now() / 1000 + 60000,
      22500,
      instance.address)

    await wait(2000)
    let icoCreation = await instance.startPreICO(ico.address)
    let icoAddress = await instance.PreICO.call()
    let icoBalance = await instance.balanceOf.call(icoAddress)

    assert.equal(ico.address, icoAddress, 'Addresses not equal')
    assert.equal(icoBalance, '10000000000000000', 'ICO Balance not equasl 100M')

    let sent = await ico.sendTransaction({from: accounts[1], value: '1000000000000000000'})
    let userBalance = await instance.balanceOf.call(accounts[1])
    
    assert.equal(userBalance.valueOf(), '2475000000000', 'Balance not equals')

    let sent2 = await ico.sendTransaction({from: accounts[2], value: '3000000000000000000'})
    let userBalance2 = await instance.balanceOf.call(accounts[2])
    assert.equal(userBalance2.valueOf(), '7627500000000', 'Balance not equals')
  })
});

const wait = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
