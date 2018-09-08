pragma solidity ^0.4.24;

contract BasicContract 
{
	event Log(uint);

	constructor() public {}

	function() public payable 
	{
		emit Log(12345);
	}

	function test() public
	{
		emit Log(23456);		
	}

	function testPayable() public payable
	{
		require(msg.value > 0);
		emit Log(34567);		
	}

	function test42(uint count) public
	{
		require(count == 42);
		emit Log(45678);		
	}

	function test42Payable(uint count) public payable
	{
		require(count == 42);
		require(msg.value > 0);
		emit Log(56789);		
	}
}
