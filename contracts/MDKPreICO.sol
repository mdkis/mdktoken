pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';
import './MDKToken.sol';
import './TokensCappedCrowdsale.sol';
import './BonusCrowdsale.sol';

contract MDKPreICO is TokensCappedCrowdsale, FinalizableCrowdsale, BonusCrowdsale {
  using SafeMath for uint256;

  event Finalized();
  event TokensPurchased(address who, uint256 tokensAmount, uint256 weiAmount, bool isBTC);

  uint8 public constant decimals = 18;

  uint startDate;
  uint endDate;

  uint256 tokensRaised;

  address tokenAddress;

  bool public isFinalized = false;

  uint256 TOTAL_SUPPLY = 100000000 * 10 ** uint256(decimals);

  function MDKPreICO(
    uint _startDate,
    uint _endDate,
    uint256 _rate,
    address _token
  ) public
    Crowdsale(_startDate, _endDate, _rate, msg.sender)
    TokensCappedCrowdsale(600000000 * 10 ** uint256(decimals))
    BonusCrowdsale(decimals)
  {
    require(_rate > 0);
    require(_token != address(0));

    startDate = _startDate;
    endDate = _endDate;

    tokenAddress = _token;
    token = createTokenContract();
  }

  function buyForBitcoin(address _beneficiary, uint256 _weiAmount) public onlyOwner {
    uint256 bonus = computeBonus(_weiAmount);

    uint256 bonusRate = rate.mul(BONUS_COEFF.add(bonus)).div(BONUS_COEFF);
    mintTokens(_beneficiary, _weiAmount.mul(bonusRate));
  }

  function mintTokens(address beneficiary, uint256 tokens) public onlyOwner {
    require(beneficiary != 0x0);
    require(tokens > 0);
    require(now <= endTime);                               // Crowdsale (without startTime check)
    require(!isFinalized);                                 // FinalizableCrowdsale
    require(token.totalSupply().add(tokens) <= tokensCap); // TokensCappedCrowdsale
    
    token.mint(beneficiary, tokens);
  }

  function createTokenContract() internal returns (MintableToken) {
    return MintableToken(tokenAddress);
  }

  function finalization() internal {
    if (TOTAL_SUPPLY.sub(tokensRaised) > 0) {
      token.mint(owner, TOTAL_SUPPLY.sub(tokensRaised));
    }
    token.transferOwnership(owner);
  }
}
