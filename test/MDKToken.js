import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'
import EVMRevert from './helpers/EVMRevert'

const BigNumber = web3.BigNumber;
const expect = require('chai').expect;
const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should();

const MDKToken = artifacts.require("./MDKToken.sol")

const teamFund = '0x4E5bD325991F7c93d6b3039ef2ee6AC43684deE5'

contract('MDKToken', function(accounts) {

  let instance

  let startTime
  let midTime
  let endTime

  function makeSuite(name, tests) {
    describe(name, async function () {
      beforeEach(async function () {
        await advanceBlock()
        startTime = latestTime() + duration.weeks(1)
        endTime = startTime + duration.weeks(10)
        midTime = (startTime + endTime) / 2

        instance = await MDKToken.new(teamFund)
        await increaseTimeTo(startTime)
      })
      tests()
    })
  }

  makeSuite('MDKToken', async () => {
    it("Team reserve should have 200M Tokens", async () => {
      const teamReserve = await instance.teamTokens.call()

      await instance.balanceOf
        .call(teamReserve)
        .then(v => v.valueOf())
        .should.eventually.equal('2e+26');
    })

    it("Reserve should have 50M Tokens", async () => {
      let instance = await MDKToken.deployed()
      let reserveTokens = await instance.reserveTokens.call()
  
      await instance.balanceOf
        .call(reserveTokens)
        .then(v => v.valueOf())
        .should.eventually.equal('5e+25');
    })

    it("Should be paused", async () => {
      let instance = await MDKToken.deployed()
      await instance.transfer(0x1, 100000000).should.be.rejected
    })
  
    // it("Should be unpausable", async () => {
    //   let instance = await MDKToken.deployed()
    //   await instance.unpause()
    //   await instance.transfer(accounts[0], 100000000)
    // })
  
    it("Should require PreICO address to be uninitialized", async () => {
      await instance.startPreICO(accounts[1])
      await instance.startPreICO(accounts[2]).should.be.rejected
    })
  
    it("Should require PreICO address argument to be not 0", async () => {
      await instance.startPreICO(0).should.be.rejected
    })
  
    it("Should transfer ownership to PreICO and write its address", async () => {
      await instance.startPreICO(accounts[2])
      await instance.owner().should.eventually.equal(accounts[2])
      await instance.PreICO().should.eventually.equal(accounts[2])
    })
  })
});
