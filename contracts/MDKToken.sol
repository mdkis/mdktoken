pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/token/PausableToken.sol';
import 'zeppelin-solidity/contracts/token/TokenTimelock.sol';
import 'zeppelin-solidity/contracts/token/MintableToken.sol';
import 'zeppelin-solidity/contracts/token/TokenVesting.sol';

contract MDKToken is MintableToken, PausableToken {
  string public constant name = "MDKToken";
  string public constant symbol = "MDK";
  uint8 public constant decimals = 18;

  uint256 public constant INITIAL_SUPPLY = 1000000000 * (10 ** uint256(decimals));

  TokenTimelock public reserveTokens;
  TokenVesting public teamTokens;

  address public PreICO = address(0);
  address public ICO = address(0);

  /**
  * @dev Constructor
  * Initializing token contract, locking team and reserve funds, sending renumeration fund to owner
  */
  function MDKToken() public {
    lockTeamTokens();
    lockReserveTokens();

    mint(owner, 250000000 * (10 ** uint256(decimals)));
    pause();
  }

  /**
  * @dev Lock team tokens for 3 years with vesting contract. Team can receive first portion of tokens 3 months after contract created, after that they can get portion of tokens proportional to time left until full unlock
  */
  function lockTeamTokens() private {
    teamTokens = new TokenVesting(owner, now, 90 days, 1095 days, false);
    mint(teamTokens, 200000000 * (10 ** uint256(decimals)));
  }

  /**
  * @dev Lock reserve tokens for 1 year
  */
  function lockReserveTokens() private {
    reserveTokens = new TokenTimelock(this, owner, uint64(now + 1 years));
    mint(reserveTokens, 50000000 * (10 ** uint256(decimals)));
  }

  /**
  * @dev Starts ICO, making ICO contract owner, so it can mint
  */
  function startICO(address _icoAddress) onlyOwner {
    require(ICO == address(0));
    require(PreICO != address(0));
    require(_icoAddress != address(0));

    ICO = _icoAddress;
    transferOwnership(_icoAddress);
  }

  /**
  * @dev Starts PreICO, making PreICO contract owner, so it can mint
  */
  function startPreICO(address _icoAddress) onlyOwner {
    require(PreICO == address(0));
    require(_icoAddress != address(0));

    PreICO = _icoAddress;
    transferOwnership(_icoAddress);
  }

}
