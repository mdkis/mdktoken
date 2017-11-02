pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import './MDKToken.sol';

contract MDKPreICO is Ownable {
  using SafeMath for uint256;

  event Finalized();
  event TokensPurchased(address who, uint256 tokensAmount, uint256 weiAmount, bool isBTC);

  uint startDate;
  uint endDate;

  uint256 rate;
  uint256 tokensPerETH;

  uint256 amountRaised;
  uint256 tokensRaised;

  MDKToken token;

  bool public isFinalized = false;
  bool public allowWithdraw = false;

  uint256 TOTAL_SUPPLY = 100000000 * 10 ** 8;

  mapping(address => uint256) contributed;

  function MDKPreICO(
    uint _startDate,
    uint _endDate,
    uint256 _rate,
    address _token) public
  {
    require(_startDate > now);
    require(_endDate > _startDate);
    require(_rate > 0);
    require(_token != address(0));

    startDate = _startDate;
    endDate = _endDate;

    rate = _rate;
    tokensPerETH = 1 ether / _rate;

    token = MDKToken(_token);
  }

  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }

  function buyForBitcoin(address _beneficiary, uint256 _weiAmount) public onlyOwner {
    require(now > startDate);
    require(now < endDate);

    uint256 reward = calculateReward(_weiAmount);
    require(tokensRaised.add(reward) < TOTAL_SUPPLY);

    tokensRaised = tokensRaised.add(reward);

    token.mint(_beneficiary, reward);
    TokensPurchased(_beneficiary, reward, _weiAmount, true);
  }

  function () public payable {
    require(now > startDate);
    require(now < endDate);

    uint256 reward = calculateReward(msg.value);
    require(tokensRaised.add(reward) < TOTAL_SUPPLY);

    contributed[msg.sender] = contributed[msg.sender].add(msg.value);

    amountRaised = amountRaised.add(msg.value);
    tokensRaised = tokensRaised.add(reward);

    token.mint(msg.sender, reward);
    TokensPurchased(msg.sender, reward, msg.value, false);
  }

  function calculateReward(uint256 value) public returns (uint256) {
    uint256 base = value.div(tokensPerETH);
    uint256 result = base;

    if (value >= 3 ether) {
      if (value >= 30 ether) {
        if (value >= 150 ether) {
          result = result.add(base.mul(100).div(1000)); // Contribution > 150 ether, 10% bonus
        } else {
          result = result.add(base.mul(60).div(1000)); // Contribution > 30 ether, 6% bonus
        }
      } else {
        result = result.add(base.mul(30).div(1000)); // Contribution > 3 ether, 3% bonus
      }
    }
    if (now < startDate + 1 days) {
      result = result.add(base.mul(100).div(1000));
    } else if (now < startDate + 7 days) {
      result = result.add(base.mul(50).div(1000));
    }

    return result * 10 ** 8;
  }

  // should be called after crowdsale ends, to do
  // some extra finalization work
  function finalize() public onlyOwner {
    require(!isFinalized);
    require(now > endDate);

    finalization();
    Finalized();

    isFinalized = true;
  }

  function finalization() internal {
    if (amountRaised > 0) {
      owner.transfer(amountRaised);

      token.mint(owner, TOTAL_SUPPLY - tokensRaised);
    }
  }
}
