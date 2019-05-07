pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract Erc20Extension
{
  function balanceOfAll(
    address user,
    address[] calldata tokens
  ) external view
    returns (uint[] memory balances)
  {
    uint length = tokens.length;
    balances = new uint[](length);
    for(uint i = 0; i < length; i++)
    {
      balances[i] = IERC20(tokens[i]).balanceOf(user);
    }
  }
}