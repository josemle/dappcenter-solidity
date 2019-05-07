pragma solidity 0.4.25;

import "../openzeppelin/token/TRC20/ITRC20.sol";

contract Trc20Extension
{
  function balanceOfAll(
    address user,
    address[] tokens
  ) external view
    returns (uint[] balances)
  {
    uint length = tokens.length;
    balances = new uint[](length);
    for(uint i = 0; i < length; i++)
    {
      balances[i] = ITRC20(tokens[i]).balanceOf(user);
    }
  }
}