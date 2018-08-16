pragma solidity ^0.4.24;
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Basic.sol";

contract DAO 
{
	using SafeMath for uint;
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
		uint proposedOn;
		uint executedOn;
		mapping (address => Vote) addressToVote;
	}
	
	mapping (address => uint) public addressToMemberIdPlusOne;
	Member[] public members;
	uint public proposalCount;
	mapping (uint => Proposal) public idToProposal; 
	uint public timeTillMinorityCanExecute;
	uint public timeTillExpired;
	uint public minimumReserve;
	
	event AddProposal(address proposalFrom, uint proposalId);
	event VoteOnProposal(address voteFrom, uint proposalId, bool inFavorOf);
	event ExecuteProposal(address requestFrom, uint proposalId, bool success);
	event Withdrawl(address requestFrom, uint totalAmount);
	event WithdrawlERC20(address requestFrom, address tokenAddress, uint totalAmount);
	event AddMember(address memberAddress, uint weight);
	event RemoveMember(address memberAddress);
	event SwapMember(address originalAddress, address newAddress);
	event SetMemberWeight(address memberAddress, uint fromWeight, uint newWeight);
	event SetTimeTillMinorityCanExecute(uint timeTillMinorityCanExecute);
	event SetTimeTillExpired(uint timeTillExpired);
	event SetMinimumReserve(uint minimumReserve);
	
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
		timeTillExpired = 4 weeks;
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
		emit AddProposal(msg.sender, proposalId);

		// If you added the proposal, you're assumed to be in favor 
		voteOnProposal(proposalId, true);
	}

	function voteOnProposal(uint proposalId, bool inFavorOf) public
	{
		require(isProposalOpen(proposalId));
		Proposal storage proposal = idToProposal[proposalId];
		proposal.addressToVote[msg.sender] = inFavorOf ? Vote.For : Vote.Against;
		emit VoteOnProposal(msg.sender, proposalId, inFavorOf);
	}

	function isProposalOpen(uint proposalId) view public returns (bool isOpen)
	{
		Proposal storage proposal = idToProposal[proposalId];
		return proposal.executedOn == 0 
		 	&& proposal.proposedOn + timeTillExpired > now;
	}

	function executeProposal(uint proposalId) onlyMembers public 
	{
		require(isProposalOpen(proposalId));
		require(isProposalApproved(proposalId));
		Proposal storage proposal = idToProposal[proposalId];
		bool success = proposal.contractAddress.call.value(proposal.value)(proposal.transactionBytes); 
		if(success)
		{ // Allow resubmitting a failed call
			proposal.executedOn = now;
		}
		emit ExecuteProposal(msg.sender, proposalId, success);
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

		if(weightAgainst >= totalWeight.add(1).div(2) || countAgainst >= (members.length + 1) / 2)
		{ // Majority no of either weight or count == denied
			return false;
		}
		else if(weightFor >= totalWeight.mul(2).add(2).div(3) || countFor >= (members.length * 2 + 2) / 3)
		{ // Super Majority of either weight or count == approved
			return true;
		}
		else if(weightFor > totalWeight.add(1).div(2) && countFor > (members.length + 1) / 2)
		{	// Majority of both Weight & Count == approved
			return true;
		}
		else if(weightFor >= weightAgainst && countFor >= countAgainst)
		{ // Minority can execute if more are for than against after timeTillMinorityCanExecute has passed
			uint timeSinceProposed = now.sub(proposal.proposedOn);
			return timeSinceProposed > timeTillMinorityCanExecute;
		}
		else
		{
			return false;
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
		emit SwapMember(_originalAddress, _newAddress);
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
			Member storage member = members[memberId];
			emit SetMemberWeight(member.memberAddress, member.weight, _weights[i]);
			member.weight = _weights[i];
		}
	}

	function setTimeTillMinorityCanExecute(uint _timeTillMinorityCanExecute) onlyApprovedProposals public
	{
		require(_timeTillMinorityCanExecute > 0); // This may prevent a smart contract attack
		timeTillMinorityCanExecute = _timeTillMinorityCanExecute;
		emit SetTimeTillMinorityCanExecute(timeTillMinorityCanExecute);
	}

	function setTimeTillExpired(uint _timeTillExpired) onlyApprovedProposals public
	{
		require(_timeTillExpired > timeTillMinorityCanExecute);
		timeTillExpired = _timeTillExpired;
		emit SetTimeTillExpired(timeTillExpired);
	}

	function setMinimumReserve(uint _minimumReserve) onlyApprovedProposals public
	{
		minimumReserve = _minimumReserve;
		emit SetMinimumReserve(minimumReserve);
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
		uint totalAmount;
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
				uint share = balance.mul(member.weight).div(totalWeight);
				if(member.memberAddress.send(share))
				{
					totalAmount += share;
				}
			}
		}

		emit Withdrawl(msg.sender, totalAmount);
	}

	function estimateWithdrawl() onlyMembers view public returns (uint amount)
	{
		uint balance = address(this).balance;
		if(balance <= minimumReserve)
		{
			return 0;
		}

		balance = balance.sub(minimumReserve);
		uint i;
		uint totalWeight = 0;
		for(i = 0; i < members.length; i++)
		{
			totalWeight = totalWeight.add(members[i].weight);
		}
		uint memberId = addressToMemberIdPlusOne[msg.sender];
		require(memberId > 0);
		memberId--;
		Member memory member = members[memberId];
		return balance.mul(member.weight).div(totalWeight);
	}

	function withdrawlERC20(address _tokenAddress) onlyMembers public
	{
		ERC20Basic erc20Basic = ERC20Basic(_tokenAddress);
		uint balance = erc20Basic.balanceOf(address(this));
		uint totalAmount;
		uint i;
		uint totalWeight = 0;
		for(i = 0; i < members.length; i++)
		{
			totalWeight = totalWeight.add(members[i].weight);
		}
		for(i = 0; i < members.length; i++)
		{
			Member memory member = members[i];
			uint share = balance.mul(member.weight).div(totalWeight);
			if(erc20Basic.transfer(member.memberAddress, share))
			{
				totalAmount += share;
			}
		}

		emit WithdrawlERC20(msg.sender, _tokenAddress, totalAmount);
	}
	
	function estimateWithdrawlERC20(address _tokenAddress) onlyMembers view public returns (uint amount)
	{
		ERC20Basic erc20Basic = ERC20Basic(_tokenAddress);
		uint balance = erc20Basic.balanceOf(address(this));
		uint i;
		uint totalWeight = 0;
		for(i = 0; i < members.length; i++)
		{
			totalWeight = totalWeight.add(members[i].weight);
		}
		uint memberId = addressToMemberIdPlusOne[msg.sender];
		require(memberId > 0);
		memberId--;
		Member memory member = members[memberId];
		return balance.mul(member.weight).div(totalWeight);
	}
}
