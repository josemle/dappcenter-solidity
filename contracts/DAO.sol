pragma solidity ^0.4.24;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract DAO 
{
	using SafeMath for uint256;
	enum Vote
	{
		NoVote,
		For,
		Against
	}
  struct Member
	{
		address memberAddress;
		uint weight;
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
	event ExecuteProposal(uint proposalId, bool success);
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
		timeTillMinorityCanExecute = 2 weeks;
		minimumReserve = 1 ether;
		_addMember(msg.sender, 1000000);
	}

	// Accept money from anyone, no logic to save on gas
	function() public payable {}
	
	function addProposal(address contractAddress, bytes transactionBytes, uint value) onlyMembers public
	{
		require(contractAddress != 0);
		require(transactionBytes.length != 0);
		uint proposalId = proposalCount++;
		idToProposal[proposalId] = Proposal(contractAddress, transactionBytes, value, now, 0);
		emit AddProposal(proposalId);

		// If you added the proposal, you're assumed to be in favor 
		voteOnProposal(proposalId, true);
	}

	// Anyone can vote, but only members will have their opinion tallied
	function voteOnProposal(uint proposalId, bool inFavorOf) public
	{
		Proposal storage proposal = idToProposal[proposalId];
		require(proposal.executedOn == 0);
		if(proposal.addressToVote[msg.sender] == Vote.NoVote)
		{ // You can vote again, changing your previous submission.  But that will not reset the clock.
			proposal.lastActionDate = now;
		}
		proposal.addressToVote[msg.sender] = inFavorOf ? Vote.For : Vote.Against;
		emit VoteOnProposal(proposalId, inFavorOf);
	}

	function executeProposal(uint proposalId) onlyMembers public 
	{
		Proposal storage proposal = idToProposal[proposalId];
		require(proposal.executedOn == 0);
		require(isProposalApproved(proposalId));
		proposal.executedOn = now;
		bool success = proposal.contractAddress.call.value(proposal.value)(proposal.transactionBytes); 
		emit ExecuteProposal(proposalId, success);
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
			totalWeight = totalWeight.add(member.weight);
			Vote vote = proposal.addressToVote[member.memberAddress];
			if(vote == Vote.For)
			{
				countFor++;
				weightFor = weightFor.add(member.weight);
			}
			else if(vote == Vote.Against)
			{
				countAgainst++;
				weightAgainst = weightAgainst.add(member.weight);
			}
		}

		if(weightAgainst >= weightFor || countAgainst >= countFor)
		{ // No is more powerful than yes
			return false;
		}
		else if(weightFor > totalWeight.div(2) || countFor > members.length / 2)
		{ // Majority == instant approval
			return true;
		}
		else
		{ // Minority can execute if unoppossed for timeTillMinorityCanExecute
			uint timeSinceLastAction = now.sub(proposal.lastActionDate);
			return timeSinceLastAction > timeTillMinorityCanExecute;
		}
	}

	function addMember(address _address, uint _weight) onlyApprovedProposals public
	{
		_withdrawl();
		_addMember(_address, _weight);
	}

	function _addMember(address _address, uint _weight) internal
	{
		require(_address != 0);
		require(_weight > 0);
		require(_weight < 1000000000000000);
		require(addressToMemberIdPlusOne[_address] == 0);

		uint id = members.length;
		addressToMemberIdPlusOne[_address] = id + 1;
		members.push(Member(_address, _weight));
		emit AddMember(_address, _weight);
	}

	function removeMember(address _address) onlyApprovedProposals public
	{
		require(members.length > 1); // You can't remove the last member
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
		require(_newAddress != 0);
		uint id = addressToMemberIdPlusOne[_originalAddress];
		require(id > 0);
		id--;
		members[id].memberAddress = _newAddress;
	}

	function setMemberWeights(address[] _addresses, uint[] _weights) onlyApprovedProposals public
	{
		require(_addresses.length == _weights.length);
		_withdrawl();

		for(uint i = 0; i < _addresses.length; i++)
		{
			uint memberId = addressToMemberIdPlusOne[_addresses[i]];
			require(memberId > 0);
			memberId--;
			require(_weights[i] > 0);
			require(_weights[i] < 1000000000000000);
			members[memberId].weight = _weights[i];
		}
	}

	function setTimeTillMinorityCanExecute(uint _timeTillMinorityCanExecute) onlyApprovedProposals public
	{
		require(_timeTillMinorityCanExecute > 0); // This may prevent a smart contract attack
		timeTillMinorityCanExecute = _timeTillMinorityCanExecute;
	}

	function changeMinimumReserve(uint _minimumReserve) onlyApprovedProposals public
	{
		minimumReserve = _minimumReserve;
	}

	function send(address _to, uint _amount) onlyApprovedProposals public
	{
		_to.transfer(_amount);
	}

	function withdrawl() onlyMembers public
	{
		_withdrawl();
	}

	function _withdrawl() internal
	{
		uint balance = address(this).balance;
		if(balance > minimumReserve)
		{
			balance = balance.sub(minimumReserve);
			uint i;
			uint totalWeight = 0;
			for(i = 0; i < members.length; i++)
			{
				totalWeight = totalWeight.add(members[i].weight);
			}
			for(i = 0; i < members.length; i++)
			{
				Member memory member = members[i];
				uint share = (balance.mul(member.weight)).div(totalWeight);
				member.memberAddress.transfer(share); 
				emit Withdrawl(member.memberAddress, share);
			}
		}
	}
}
