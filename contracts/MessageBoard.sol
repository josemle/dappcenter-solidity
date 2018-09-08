pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol"; // For Truffle
//import "github.com/OpenZeppelin/zeppelin-solidity/contracts/math/SafeMath.sol"; // For Remix

contract MessageBoard
{
    using SafeMath for uint;
    
    struct Message
    {
        uint messageId; 
        string message;
        address author;
        uint totalTips;
    }

    event NewMessage(uint messageId, string message, address author);
    event TipSent(uint messageId, uint amount, address from);

    address public ownerAddress;
    uint public costToPost;
    // tip / inverseShareOfTips = fee (higher is cheaper; 0 for none)
    uint public inverseShareOfTips; 

    Message[] public messages;

    constructor(address _ownerAddress, uint _costToPost, uint _inverseShareOfTips) public
    {
        require(_ownerAddress != 0);
        
        ownerAddress = _ownerAddress;
        costToPost = _costToPost;
        inverseShareOfTips = _inverseShareOfTips;
    }

    function getMessageCount() public view returns (uint count)
    {
        count = messages.length;
    }
    
    function postMessage(string _message) payable public 
    {
        require(msg.value >= costToPost);
        ownerAddress.transfer(msg.value);
       
        uint messageId = messages.length;
        Message memory message = Message(messageId, _message, tx.origin, 0);
        messages.push(message);
        
        emit NewMessage(message.messageId, message.message, message.author);
    }
    
    function tipMessage(uint _messageId) payable public
    {
        uint valueToSend;
        if(inverseShareOfTips > 0)
        {
            uint fee = msg.value.div(inverseShareOfTips);
            ownerAddress.transfer(fee);
            valueToSend = msg.value.sub(fee);
        }
        else
        {
            valueToSend = msg.value;
        }
        Message storage message = messages[_messageId];
        message.totalTips = message.totalTips.add(msg.value);
        message.author.transfer(valueToSend);
        
        emit TipSent(_messageId, msg.value, tx.origin);
    }
}