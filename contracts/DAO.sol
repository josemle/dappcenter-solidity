/*
	DAO: Holds funds to be redistributed to the team, manage the team, 
	and allow members to vote on arbitrary calls.

	Concerns:
	- Inactive members: after 2 weeks minority approval is sufficient, use that to kick 'em.
	- Lost keys: Use swap member to replace the old address with a new.
	- Malicious members: Vote them down and then kick 'em, it's important to keep an eye on new proposals.
	- Stolen keys: Vote them down and then kick 'em or do the lost key swap.

	Risks: 
	- 2 member teams are not safe (unless one has more weight).  
		One member denies the other and the smart contract cannot know which is malicious.

	TODO 
	- Test for multi-member withdrawl scenarios (including uneven weighting)
	- Test a transfer with approval (spending the reserve).
	- Experiment with gas cost for external vs internal calls (should be never forward to an external)
	- Test for events
	- Test for overflow and/or add SafeMath
	- Test modifiers
	- Test overflowing the weight by adding a member with too much, then confirm we can change weights or something.
	- Test arbitrary calls (means deploying another contract to test with)
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
	uint minimumReserve;

	event AddProposal(uint proposalId);
	event VoteOnProposal(uint proposalId, bool inFavorOf);
	event ExecuteProposal(uint proposalId);

	event Withdrawl(address member, uint amount);

	event AddMember(address memberAddress, uint weight);
	event RemoveMember(address memberAddress);

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
		minimumReserve = 1 ether;
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
		if(proposal.addressToVote[msg.sender] == Vote.NoVote)
		{ // You can vote again, changing your previous submission.  But that will not reset the clock.
			proposal.lastActionDate = now;
		}
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
		_withdrawl();
		_addMember(_address, _weight);
	}

	function _addMember(address _address, uint _weight) internal
	{
		emit log("Adding Member");
		require(addressToMemberIdPlusOne[_address] == 0);

		uint id = members.length;
		addressToMemberIdPlusOne[_address] = id + 1;
		members.push(Member(_address, _weight));
		emit AddMember(_address, _weight);
	}

	function removeMember(address _address) onlyApprovedProposals public
	{
		uint id = addressToMemberIdPlusOne[_address];
		require(id > 0);
		id--;
		addressToMemberIdPlusOne[_address] = 0;
		members[id] = members[members.length - 1];
		members.length--;
		emit RemoveMember(_address);
	}

	function swapMember(address _originalAddress, address _newAddress) onlyApprovedProposals public 
	{
		uint id = addressToMemberIdPlusOne[_originalAddress];
		require(id > 0);
		id--;
		members[id].memberAddress = _newAddress;
	}

	function setMemberWeights(address[] _addresses, uint[] _weights) onlyApprovedProposals public
	{
		require(_addresses.length == _weights.length);

		uint totalWeight;
		for(uint i = 0; i < _addresses.length; i++)
		{
			uint memberId = addressToMemberIdPlusOne[_addresses[i]];
			require(memberId > 0);
			memberId--;
			require(totalWeight < totalWeight + _weights[i]); // Prevents overflowing weight.
			totalWeight += _weights[i];
			members[memberId].weight = _weights[i];
		}
	}

	function setTimeTillMinorityCanExecute(uint _timeTillMinorityCanExecute) onlyApprovedProposals public
	{
		require(_timeTillMinorityCanExecute > 0);
		timeTillMinorityCanExecute = _timeTillMinorityCanExecute;
	}

	function changeMinimumReserve(uint _minimumReserve) onlyApprovedProposals public
	{
		minimumReserve = _minimumReserve;
	}

	function withdrawl() onlyMembers public
	{
		_withdrawl();
	}

	function _withdrawl() internal
	{
		uint i;

		uint balance = address(this).balance;
		if(balance > minimumReserve)
		{
			balance -= minimumReserve;

			uint totalWeight = 0;
			for(i = 0; i < members.length; i++)
			{
				totalWeight += members[i].weight;
			}

			for(i = 0; i < members.length; i++)
			{
				Member memory member =  members[i];
				uint share = (balance * member.weight) / totalWeight;
				member.memberAddress.transfer(share); 

				emit Withdrawl(member.memberAddress, share);
			}
		}
	}
}
