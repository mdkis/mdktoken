import ether from './helpers/ether'
import {advanceBlock} from './helpers/advanceToBlock'
import {increaseTimeTo, duration} from './helpers/increaseTime'
import latestTime from './helpers/latestTime'
import EVMThrow from './helpers/EVMThrow'

const BigNumber = web3.BigNumber
const expect = require('chai').expect
const should = require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(web3.BigNumber))
  .should()

const MDKToken = artifacts.require("./MDKToken.sol")
const MDKPreICO = artifacts.require("./MDKPreICO.sol")

contract('Crowdsale: ', function ([mainWallet, investorWallet, secondInvestorWallet, thirdInvestorWallet]) {
  let startTime
  let endTime
  let afterWhitelistTime
  let afterEndTime

  let token
  let preico
  let usedTokensSupply = new BigNumber(0)

  let rate = 22500
  let tokensPerETH = ether(1).dividedBy(rate)

  let decimals = 8
  let decimalsNumber = Math.pow(10, 8)

  before(async function () {
    //Advance to the next block to correctly read time in the solidity "now" function interpreted by testrpc
    await advanceBlock()
    const initialTime = latestTime()
    const diff = 0

    await increaseTimeTo(initialTime + diff)

    startTime = latestTime() + duration.days(1)
    endTime = startTime + duration.days(30)
    afterEndTime = endTime + duration.seconds(1)

    token = await MDKToken.new()
    preico = await MDKPreICO.new(startTime, endTime, rate, token.address)

    await token.startPreICO(preico.address)
  })

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
    await invest(thirdInvestorWallet, ether(51))
    await validateBalance(thirdInvestorWallet, calculateReward(ether(51), duration.hours(72)))
  })

  async function validateBalance (wallet, amount) {
    let balance = await getBalance(wallet);
    balance.should.be.bignumber.equal(amount);
  
    return balance;
  }
  
  async function getBalance (wallet) {
    return token.balanceOf(wallet);
  };
  
  async function invest (from, amount) {
    return preico.sendTransaction({from: from, value: amount})
  }
  
  function calculateReward (amount, timeDiff) {
    let base = amount.dividedBy(tokensPerETH);
    let result = base;
  
    if (amount.greaterThanOrEqualTo(ether(3))) {
      if (amount.greaterThanOrEqualTo(ether(30))) {
        if (amount.greaterThanOrEqualTo(ether(150))) {
          result = result.plus(base.times(100).dividedBy(1000)); // Contribution > 150 ether, 10% bonus
        } else {
          result = result.plus(base.times(60).dividedBy(1000)); // Contribution > 30 ether, 6% bonus
        }
      } else {
        result = result.plus(base.times(30).dividedBy(1000)); // Contribution > 3 ether, 3% bonus
      }
    }
    if (timeDiff < duration.days(1)) {
      result = result.plus(base.times(100).dividedBy(1000));
    } else if (timeDiff < duration.days(7)) {
      result = result.plus(base.times(50).dividedBy(1000));
    }

    return result.times(decimalsNumber)
  }
})
