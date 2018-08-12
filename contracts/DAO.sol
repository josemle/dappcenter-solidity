/*
DAO: Holds funds to be redistributed to the team, manage the team, 
and allow members to vote on arbitrary calls.

 x Recieve funds to be redistributed to the team.
 - Distribute funds by percent share in the group.
 - Any team member can propose an arbitrary call.
   - Others may approve or deny.
	 - Once majority approval (based on percent share), execute the call.
 - Withdrawl - either personally or one triggers payout to all
 - Team members may be added or removed.  Percent shares may be changed as well.
   - Approve using the same rules as above.
 -  

Concerns:
 - Inactive member
 - Lost keys
 - Stolen keys
 - Malicious member


TODO 
 - maybe dump balance into storage instead of withdrawl for all (alt: a member is managed by another contract)
 - fixed commitments per timeframe (e.g. monthly server cost), agree on a proposal to send the first x ETH every y blocks 
 to address z.
    - We agree on a minimum balance (e.g. 1 ETH).  When withdrawl, always leave 1 eth behind.
		- Then proposals to widthdrawl for team expenses (.5 eth)
 - Need to be able to drain contract (post vote)


Voting:
 - Consider time/timeout to prevent a brick.

*/

pragma solidity ^0.4.24;

contract DAO 
{
	struct Member
	{
		address member;
		uint256 weight;
	}

	mapping (address => uint) addressToMemberIdPlusOne;
	Member[] public members;
	uint test;

	event log(uint message);
	event log(string message);

	event Withdrawl(address member, uint amount);

	modifier onlyMembers
	{
		require(addressToMemberIdPlusOne[msg.sender] != 0);
		_;
	}

	constructor() public 
	{
		_addMember(msg.sender, 1000000);
	}

	// Accept money from anyone, no logic to save on gas
	function() public payable {}

	// function addMember(address _address, uint _weight) onlyMembers public
	// {
	//     // TODO this is a proposal for voting
	// 	//_addMember();
	// }

	function _addMember(address _address, uint _weight) internal 
	{
		require(addressToMemberIdPlusOne[_address] == 0);

		uint id = members.length;
		addressToMemberIdPlusOne[_address] = id + 1;
		members.push(Member(_address, _weight));
	}

	function withdrawl() onlyMembers public
	{
		test++;
		uint i;

		uint totalWeight = 0;
		for(i = 0; i < members.length; i++)
		{
			totalWeight += members[i].weight;
		}

		uint weiPerWeight = address(this).balance / totalWeight;

		for(i = 0; i < members.length; i++)
		{
			Member memory member =  members[i];
			uint share = weiPerWeight * member.weight;
			member.member.transfer(share); 

			emit Withdrawl(member.member, share);
		}
	}
}
