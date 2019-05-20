pragma solidity 0.4.25;

import "../openzeppelin/token/TRC20/ITRC20.sol";

/**
 * Migrated from the ethereum package
 */
contract Erc20Ext
{
  function balanceAndAllowanceOfAll(
    address user,
    address spender,
    address[] tokens
  ) external view
    returns (uint[] balanceAndAllowancePerToken)
  {
    uint length = tokens.length;
    balanceAndAllowancePerToken = new uint[](length * 2);
    for(uint i = 0; i < length; i++)
    {
      ITRC20 token = ITRC20(tokens[i]);
      balanceAndAllowancePerToken[i * 2] = token.balanceOf(user);
      balanceAndAllowancePerToken[i * 2 + 1] = token.allowance(user, spender);
    }
  }
}