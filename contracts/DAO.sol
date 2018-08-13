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
 - Experiment with gas cost for external vs internal calls (should be never forward to an external)
 - Do we consider a vanity starting with 1 0 byte to save gas?
 - Docker / GitHub testing

Voting:
 - Consider time/timeout to prevent a brick.

*/

pragma solidity ^0.4.24;

contract DAO 
{
  struct Member
	{
		address memberAddress;
		uint256 weight;
	}

	enum Vote
	{
		NoVote,
		VoteFor,
		VoteAgainst
	}

	struct Proposal
	{
		address contractAddress;
		bytes transactionBytes; 
		uint value;
		uint lastActionDate;

		mapping (address => Vote) addressToVote;
	}

	mapping (address => uint) addressToMemberIdPlusOne;
	Member[] public members;
	uint proposalCount;
	mapping (uint => Proposal) public idToProposal; // TODO switch to a mapping?

	event log(address message);
	event log(uint message);
	event log(string message);

	event AddProposal(uint proposalId);
	event ExecuteProposal(uint proposalId);
	event Withdrawl(address member, uint amount);

	modifier onlyMembers
	{
		require(addressToMemberIdPlusOne[msg.sender] != 0);
		_;
	}

	modifier onlyApprovedProposals
	{
		require(msg.sender == address(this));
		_;
	}

	constructor() public 
	{
		_addMember(msg.sender, 1000000);
	}

	// Accept money from anyone, no logic to save on gas
	function() public payable {}
	
	function addProposal(address contractAddress, bytes transactionBytes, uint value) onlyMembers public
	{
		Proposal memory proposal = Proposal(contractAddress, transactionBytes, value, now);
		uint id = ++proposalCount;
		idToProposal[id] = proposal;
		emit AddProposal(id);
	}

	// function addMember(address _address, uint _weight) onlyMembers public
	// {
	// 	uint i;
	// 	bytes4 data = bytes4(keccak256("_addMember(address)"));
	// 	bytes memory info = new bytes(36);
	// 	for(i = 0; i < 4; i++)
	// 	{
	// 		info[i] = data[i];
	// 	}
	// 	assembly { mstore(add(info, 36), _address) }
	// 	//assembly { mstore(add(info, 68), _weight) }
	// 	_address.call(info);
	// }

	function executeProposal(uint proposalId) public 
	{
		Proposal memory proposal = idToProposal[proposalId];
		// TODO confirm votes
		emit log("Execute");
		bool success = proposal.contractAddress.call.value(proposal.value)(proposal.transactionBytes); 
		if(success)
		{
			emit ExecuteProposal(proposalId);
		}
		else
		{
			emit log("fail");
		}
	}

	function addMember(address _address, uint _weight) onlyApprovedProposals public
	{
		_addMember(_address, _weight);
	}

	function _addMember(address _address, uint _weight) internal
	{
		emit log("Adding Member");
		require(addressToMemberIdPlusOne[_address] == 0);

		uint id = members.length;
		addressToMemberIdPlusOne[_address] = id + 1;
		members.push(Member(_address, _weight));
	}

	function withdrawl() onlyMembers public
	{
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
			member.memberAddress.transfer(share); 

			emit Withdrawl(member.memberAddress, share);
		}
	}
}
