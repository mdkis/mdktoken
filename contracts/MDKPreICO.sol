pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/crowdsale/FinalizableCrowdsale.sol';
import './MDKToken.sol';
import '../libs/TokensCappedCrowdsale.sol';
import '../libs/BonusCrowdsale.sol';

contract MDKPreICO is TokensCappedCrowdsale(MDKPreICO.TOKENS_CAP), FinalizableCrowdsale, BonusCrowdsale(MDKPreICO.decimals) {

  uint8 public constant decimals = 18;
  uint256 constant TOKENS_CAP = 600000000 * (10 ** uint256(decimals));

  /**
  * @dev Contructor
  * @param _startTime startTime of crowdsale
  * @param _endTime endTime of crowdsale
  * @param _rate MDK / ETH rate
  * @param _token Address of MDKToken contract
  */
  function MDKPreICO(
    uint _startTime,
    uint _endTime,
    uint256 _rate,
    address _token
  ) public
    Crowdsale(_startTime, _endTime, _rate, msg.sender)
  {
    require(_token != address(0));
    token = MintableToken(_token);
  }

  /**
  * @dev Gives user tokens for contribution in bitcoins
  * @param _beneficiary User who'll receive tokens
  * @param tokens Amount of tokens
  */
  function buyForBitcoin(address _beneficiary, uint256 tokens) public onlyOwner {
    mintTokens(_beneficiary, tokens);
  }

  function mintTokens(address beneficiary, uint256 tokens) public onlyOwner {
    require(beneficiary != 0);
    require(tokens > 0);
    require(now <= endTime);                               // Crowdsale (without startTime check)
    require(!isFinalized);                                 // FinalizableCrowdsale
    require(token.totalSupply().add(tokens) <= TOKENS_CAP); // TokensCappedCrowdsale

    token.mint(beneficiary, tokens);
  }

  /**
  * @dev Override super createTokenContract, so it'll not deploy MintableToken
  */
  function createTokenContract() internal returns (MintableToken) {
    return MintableToken(0);
  }

  /**
  * @dev Give not bought tokens to owner, also give back ownership of MDKToken contract
  */
  function finalization() internal {
    /*
    We don't call finishMinting in finalization,
    because after PreICO we will held main round of ICO few months later
    */
    if (token.totalSupply() < TOKENS_CAP) {
      token.mint(owner, TOKENS_CAP.sub(token.totalSupply()));
    }
    token.transferOwnership(owner);
  }
}
