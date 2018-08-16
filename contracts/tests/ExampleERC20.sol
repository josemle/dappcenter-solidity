pragma solidity ^0.4.24;
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";

contract ExampleERC20 is StandardToken, DetailedERC20
{
    constructor() public 
			DetailedERC20("Example ERC20", "EE20", 2)
    {
        totalSupply_ = 10000;
        balances[msg.sender] = 10000;
    }	
}
