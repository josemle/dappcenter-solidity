/*
	DAO: Holds funds to be redistributed to the team, manage the team, 
	and allow members to vote on arbitrary calls.

 x Recieve funds to be redistributed to the team.
 x Distribute funds by percent share in the group.
 x Any team member can propose an arbitrary call.
   - Others may approve or deny.
	 - Once majority approval (based on percent share), execute the call.
 - Withdrawl - either personally or one triggers payout to all
 - Team members may be added or removed.  Percent shares may be changed as well.
   - Approve using the same rules as above.
 - Voting rules: consider number of people, ownership share, and time.  Voting NO means much more than not voting.
 - Propose a change to timeTillMinorityCanExecute

Concerns:
 - Inactive members
 - Lost keys
 - Stolen keys 
 - Malicious members

TODO 
 x Docker / GitHub testing
 - Test arbitrary calls (means deploying another contract to test with)
 - maybe dump balance into storage instead of withdrawl for all (alt: a member is managed by another contract)
 - fixed commitments per timeframe (e.g. monthly server cost), agree on a proposal to send the first x ETH every y blocks 
 to address z.
    - We agree on a minimum balance (e.g. 1 ETH).  When withdrawl, always leave 1 eth behind.
		- Then proposals to widthdrawl for team expenses (.5 eth)
 - Need to be able to drain contract (post vote)
 - Experiment with gas cost for external vs internal calls (should be never forward to an external)
 - Do we consider a vanity starting with 1 0 byte to save gas?
 - Test for events
  // TODO test describe again
	- Test for a rejected vote

*/

pragma solidity ^0.4.24;

contract DAO 
{
	// TODO remove:
	event log(address message);
	event log(uint message);
	event log(string message);

	////////////////////////////////////////////

  struct Member
	{
		address memberAddress;
		uint256 weight;
	}

	enum Vote
	{
		NoVote,
		For,
		Against
	}

	struct Proposal
	{
		address contractAddress;
		bytes transactionBytes; 
		uint value;
		uint lastActionDate;
		uint executedOn;

		mapping (address => Vote) addressToVote;
	}

	mapping (address => uint) addressToMemberIdPlusOne;
	Member[] public members;
	uint proposalCount;
	mapping (uint => Proposal) public idToProposal; 
	uint timeTillMinorityCanExecute;

	event AddProposal(uint proposalId);
	event VoteOnProposal(uint proposalId, bool inFavorOf);
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
		timeTillMinorityCanExecute = 2 weeks;
	}

	// Accept money from anyone, no logic to save on gas
	function() public payable {}
	
	function addProposal(address contractAddress, bytes transactionBytes, uint value) onlyMembers public
	{
		Proposal memory proposal = Proposal(contractAddress, transactionBytes, value, now, 0);
		uint proposalId = ++proposalCount;
		idToProposal[proposalId] = proposal;
		emit AddProposal(proposalId);

		voteOnProposal(proposalId, true);
	}

	// Anyone can vote, but only members will have their opinion tallied
	function voteOnProposal(uint proposalId, bool inFavorOf) public
	{
		Proposal storage proposal = idToProposal[proposalId];
		Vote vote = inFavorOf ? Vote.For : Vote.Against;
		proposal.addressToVote[msg.sender] = vote;
		emit VoteOnProposal(proposalId, inFavorOf);
	}

	function executeProposal(uint proposalId) public 
	{
		Proposal memory proposal = idToProposal[proposalId];
		// TODO test gas savings making this internal
		require(isProposalApproved(proposalId));

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

	function isProposalApproved(uint proposalId) view public returns (bool canExecute) 
	{
		Proposal storage proposal = idToProposal[proposalId];
		uint weightFor;
		uint weightAgainst;
		uint countFor;
		uint countAgainst;
		uint totalWeight; 
		for(uint i = 0; i < members.length; i++)
		{
			Member memory member = members[i];
			totalWeight += member.weight;
			Vote vote = proposal.addressToVote[member.memberAddress];
			if(vote == Vote.For)
			{
				countFor++;
				weightFor += member.weight;
			}
			else if(vote == Vote.Against)
			{
				countAgainst++;
				weightAgainst += member.weight;
			}
		}

		// No is more powerful than yes
		if(weightAgainst >= weightFor || countAgainst >= countFor)
		{
			return false;
		}

		// Majority == instant approval
		if(weightFor > totalWeight / 2 || countFor > members.length / 2)
		{
			return true;
		}

		// Minority can execute if unoppossed for timeTillMinorityCanExecute
		uint timeSinceLastAction = now - proposal.lastActionDate;
		return timeSinceLastAction > timeTillMinorityCanExecute;
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

		for(i = 0; i < members.length; i++)
		{
			Member memory member =  members[i];
			uint share = (address(this).balance * member.weight) / totalWeight;
			member.memberAddress.transfer(share); 

			emit Withdrawl(member.memberAddress, share);
		}
	}
}
