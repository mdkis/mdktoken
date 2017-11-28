import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'
import EVMRevert from './helpers/EVMRevert'

const BigNumber = web3.BigNumber
const expect = require('chai').expect
const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should()

const MDKToken = artifacts.require("./MDKToken.sol")
const MDKPreICO = artifacts.require("./MDKPreICO.sol")

const teamFund = '0x4E5bD325991F7c93d6b3039ef2ee6AC43684deE5'

contract('Crowdsale: ', function ([mainWallet, investorWallet, secondInvestorWallet, thirdInvestorWallet]) {
  let startTime
  let endTime
  let afterWhitelistTime
  let afterEndTime

  let token
  let preico
  let usedTokensSupply = new BigNumber(0)

  let rate = 22500
  let tokenPriceInCents = 12
  let tokensPerETH = ether(1).dividedBy(rate)

  let decimalsNumber = Math.pow(10, 18)

  // https://stackoverflow.com/questions/26107027/
  function makeSuite(name, tests) {
    describe(name, async function () {
      beforeEach(async function () {
        //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
        await advanceBlock()
        const initialTime = latestTime()
        const diff = 0

        await increaseTimeTo(initialTime + diff)

        startTime = latestTime() + duration.days(1)
        endTime = startTime + duration.days(30)
        afterEndTime = endTime + duration.seconds(1)

        token = await MDKToken.new(teamFund)
        preico = await MDKPreICO.new(startTime, endTime, rate, token.address, teamFund)

        await preico.setBonusesForAmounts([
          50000,
          10000,
          1000
        ], [
          100,
          60,
          30
        ])
        await preico.setBonusesForTimes([ // Seconds
          duration.days(1),
          duration.days(7),
        ], [ // 10x percents
          100,
          50,
        ])

        await token.startPreICO(preico.address)
      })
      tests()
    })
  }

  makeSuite('Crowdsale', async () => {
    it('should be owner of token contract', async () => {
      await token.owner.call().should.eventually.equal(preico.address)
    })
  
    it('should mint', async () => {
      await increaseTimeTo(startTime + duration.hours(2))
      await invest(investorWallet, ether(1))
      await validateBalance(investorWallet, calculateReward(ether(1), duration.hours(2)))
    })
  
    it('bonuses test', async () => {
      await increaseTimeTo(startTime + duration.hours(6))
      await invest(secondInvestorWallet, ether(5))
      await validateBalance(secondInvestorWallet, calculateReward(ether(5), duration.hours(6)))
  
      await increaseTimeTo(startTime + duration.hours(72))
      await invest(thirdInvestorWallet, ether(67))
      await validateBalance(thirdInvestorWallet, calculateReward(ether(67), duration.hours(72)))
    })
  
    it('can buy with bitcoin', async () => {
      await increaseTimeTo(startTime + duration.hours(73))
      await preico.buyForBitcoin(thirdInvestorWallet, 1000)
      await validateBalance(thirdInvestorWallet, 1000)
    })
  })

  async function validateBalance (wallet, amount) {
    let balance = await getBalance(wallet)
    balance.should.be.bignumber.equal(amount)
  
    return balance
  }

  async function getBalance (wallet) {
    return token.balanceOf.call(wallet)
  }

  async function invest (from, amount) {
    return preico.sendTransaction({from: from, value: amount})
  }

  function calculateReward (amount, timeDiff) {
    let base = amount.dividedBy(tokensPerETH)
    let result = base

    let cents = amount.times(rate).times(tokenPriceInCents).div(1000).div(ether(1))

    if (cents.greaterThanOrEqualTo(1000)) {
      if (cents.greaterThanOrEqualTo(10000)) {
        if (cents.greaterThanOrEqualTo(50000)) {
          result = result.plus(base.times(100).dividedBy(1000)) // Contribution > 150 ether, 10% bonus
        } else {
          result = result.plus(base.times(60).dividedBy(1000)) // Contribution > 30 ether, 6% bonus
        }
      } else {
        result = result.plus(base.times(30).dividedBy(1000)) // Contribution > 3 ether, 3% bonus
      }
    }
    if (timeDiff < duration.days(1)) {
      result = result.plus(base.times(100).dividedBy(1000))
    } else if (timeDiff < duration.days(7)) {
      result = result.plus(base.times(50).dividedBy(1000))
    }

    return result.times(decimalsNumber)
  }
})
