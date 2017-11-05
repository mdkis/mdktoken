pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import './MDKToken.sol';

contract MDKICO is Ownable {
  using SafeMath for uint256;

  event Finalized();
  event TokensPurchased(address who, uint256 tokensAmount, uint256 weiAmount, bool isBTC);

  uint8 public constant decimals = 8;

  uint startDate;
  uint endDate;

  uint256 tokensPerETH;

  uint256 amountRaised;
  uint256 tokensRaised;

  MDKToken token;

  bool public isFinalized = false;

  uint256 TOTAL_SUPPLY = 400000000 * 10 ** uint256(decimals);

  function MDKICO(
    uint _startDate,
    uint _endDate,
    uint256 _rate,
    address _token
  ) public {
    require(_startDate > now);
    require(_endDate > _startDate);
    require(_rate > 0);
    require(_token != address(0));

    startDate = _startDate;
    endDate = _endDate;

    tokensPerETH = 1 ether / _rate;

    token = MDKToken(_token);
  }

  function buyForBitcoin(address _beneficiary, uint256 _weiAmount) public onlyOwner {
    buyTokens(_beneficiary, _weiAmount, true);
  }

  function () public payable {
    buyTokens(msg.sender, msg.value, false);
    amountRaised = amountRaised.add(msg.value);
  }

  function buyTokens(address _beneficiary, uint256 _weiAmount, bool _isBtc) {
    require(now > startDate);
    require(now < endDate);

    uint256 reward = calculateReward(_weiAmount);
    require(tokensRaised.add(reward) < TOTAL_SUPPLY);

    tokensRaised = tokensRaised.add(reward);

    token.mint(_beneficiary, reward);
    TokensPurchased(_beneficiary, reward, _weiAmount, _isBtc);
  }

  function calculateReward(uint256 value) public returns (uint256) {
    uint256 base = value.div(tokensPerETH);
    uint256 bonus = 0;

    if (value >= 3 ether) {
      if (value >= 30 ether) {
        if (value >= 150 ether) {
          bonus += 100; // Contribution > 150 ether, 10% bonus
        } else {
          bonus += 60; // Contribution > 30 ether, 6% bonus
        }
      } else {
        bonus += 30; // Contribution > 3 ether, 3% bonus
      }
    }
    if (now < startDate + 1 days) {
      bonus += 100;
    } else if (now < startDate + 7 days) {
      bonus += 50;
    }

    return base.add(base.mul(bonus).div(1000)).mul(10 ** uint256(decimals));
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
    }

    if (TOTAL_SUPPLY - tokensRaised > 0) {
      token.mint(owner, TOTAL_SUPPLY - tokensRaised);
    }
    token.transferOwnership(owner);
  }
}
