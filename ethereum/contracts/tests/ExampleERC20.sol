pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";

contract ExampleERC20 is ERC20Detailed, ERC20Mintable
{
  constructor() public
    ERC20Detailed("Example ERC20", "EE20", 2)
  {}
}
