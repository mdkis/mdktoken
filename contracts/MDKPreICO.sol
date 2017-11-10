pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';
import './MDKToken.sol';
import './TokensCappedCrowdsale.sol';
import './BonusCrowdsale.sol';

contract MDKPreICO is TokensCappedCrowdsale, FinalizableCrowdsale, BonusCrowdsale {
  using SafeMath for uint256;

  uint8 public constant decimals = 18;
  uint256 constant tokensCap = 600000000 * 10 ** uint256(decimals);

  function MDKPreICO(
    uint _startDate,
    uint _endDate,
    uint256 _rate,
    address _token
  ) public
    Crowdsale(_startDate, _endDate, _rate, msg.sender)
    TokensCappedCrowdsale(tokensCap)
    BonusCrowdsale(decimals)
  {
    require(_rate > 0);
    require(_token != address(0));

    token = MintableToken(_token);
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
    return MintableToken(0x0);
  }

  function finalization() internal {
    /*
    We don't call finishMinting in finalization,
    because after PreICO we will held main round of ICO few months later
    */
    if (token.totalSupply() < tokensCap) {
      token.mint(owner, tokensCap.sub(token.totalSupply()));
    }
    token.transferOwnership(owner);
  }
}
