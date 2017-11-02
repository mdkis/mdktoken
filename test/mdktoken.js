var MDKToken = artifacts.require("./MDKToken.sol")
var MDKICO = artifacts.require("./MDKICO.sol")

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

  it("Should create ICO", async () => {
    let instance = await MDKToken.new()
    let ico = await MDKICO.new()

    let icoCreation = await instance.startICO(ico.address)
    let icoAddress = await instance.ICO.call()
    let icoBalance = await instance.balanceOf.call(icoAddress)

    assert(ico.address, icoAddress, 'Addresses not equal')
    assert(icoBalance, '40000000000000000', 'ICO Balance not equasl 400M')
  })
});
