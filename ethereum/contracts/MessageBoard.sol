pragma solidity 0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// DO NOT USE.  Not complete
contract MessageBoard
{
  using SafeMath for uint;

  struct Message
  {
    uint messageId;
    string message;
    address payable author;
    uint totalTips;
  }

  event NewMessage(uint messageId, string message, address author);
  event TipSent(uint messageId, uint amount, address from);

  address payable public ownerAddress;
  uint public costToPost;
  // tip / inverseShareOfTips = fee (higher is cheaper; 0 for none)
  uint public inverseShareOfTips;
  uint public messageCount;

  Message[] public messages;

  constructor() public
  {
    ownerAddress = msg.sender;
    costToPost = 42;
    inverseShareOfTips = 500;
  }

  function getMessageCount() public view returns (uint)
  {
    //count = messages.length; wtf tron
    return messageCount;
  }

  function postMessage(string memory _message) payable public
  {
    require(msg.value >= costToPost);
    ownerAddress.transfer(msg.value);

    uint messageId = messageCount++;
    Message memory message = Message(messageId, _message, msg.sender, 0);
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

    emit TipSent(_messageId, msg.value, msg.sender);
  }
}