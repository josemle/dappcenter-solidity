pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

contract Erc20Ext
{
  function balanceAndAllowanceOfAll(
    address user,
    address spender,
    address[] calldata tokens
  ) external view
    returns (uint[] memory balanceAndAllowancePerToken)
  {
    uint length = tokens.length;
    balanceAndAllowancePerToken = new uint[](length * 2);
    for(uint i = 0; i < length; i++)
    {
      IERC20 token = IERC20(tokens[i]);
      balanceAndAllowancePerToken[i * 2] = token.balanceOf(user);
      balanceAndAllowancePerToken[i * 2 + 1] = token.allowance(user, spender);
    }
  }
}