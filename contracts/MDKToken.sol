pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/token/PausableToken.sol';
import 'zeppelin-solidity/contracts/token/TokenTimelock.sol';
import 'zeppelin-solidity/contracts/token/ERC20Basic.sol';
import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import './TokenVesting.sol';

contract MDKToken is MintableToken, PausableToken {
  string public constant name = "MDKToken";
  string public constant symbol = "MDK";
  uint8 public constant decimals = 8;

  uint256 public constant INITIAL_SUPPLY = 1000000000 * (10 ** uint256(decimals));

  TokenTimelock public reserveTokens;
  TokenVesting public teamTokens;

  address public PreICO = address(0);
  address public ICO = address(0);

  modifier icoOnly {
    require(msg.sender == ICO || msg.sender == PreICO);
    _;
  }

  function MDKToken() public {
    lockTeamTokens();
    lockReserveTokens();

    balances[msg.sender] = 250000000 * (10 ** uint256(decimals));
    pause();
  }

  function lockTeamTokens() private {
    teamTokens = new TokenVesting(msg.sender, now, 90 days, 1095 days, false);
    balances[teamTokens] = 200000000 * (10 ** uint256(decimals));
  }

  function lockReserveTokens() private {
    reserveTokens = new TokenTimelock(ERC20Basic(this), msg.sender, uint64(now + 1 years));
    balances[reserveTokens] = 50000000 * (10 ** uint256(decimals));
  }

  function startICO(address _icoAddress) onlyOwner {
    require(ICO == address(0));
    require(_icoAddress != address(0));

    ICO = _icoAddress;
    transferOwnership(_icoAddress);
  }

  function startPreICO(address _icoAddress) onlyOwner {
    require(PreICO == address(0));
    require(_icoAddress != address(0));

    PreICO = _icoAddress;
    transferOwnership(_icoAddress);
  }

}
