pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

contract TestErc20 is ERC20Detailed, ERC20Mintable
{
  constructor() public
    ERC20Detailed("Test ERC20", "T20", 18)
  {}
}
