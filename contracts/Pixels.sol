pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
//import "github.com/OpenZeppelin/zeppelin-solidity/contracts/math/SafeMath.sol";

contract Pixels
{
	using SafeMath for uint;
	
    event SetPixel(uint x, uint y, uint24 color);
    
    uint constant WIDTH = 1000;
    uint constant HEIGHT = 1000;
    uint24[WIDTH][HEIGHT] colorPerPixel;
    address ownerAddress1;
    address ownerAddress2;
    uint costPerPixel;
    
    address[][WIDTH][HEIGHT] purchaser;
    // TODO add url per pixel
    
    constructor(address _ownerAddress1, address _ownerAddress2, uint _costPerPixel) public
    {
        ownerAddress1 = _ownerAddress1;
        ownerAddress2 = _ownerAddress2;
        costPerPixel = _costPerPixel;
    }
    
    function getPixelPrice(uint _x, uint _y) public view returns (uint _price)
    {
        return (purchaser[_x][_y].length.add(1)).mul(costPerPixel);
    }
    
    function setPixel(uint _x, uint _y, uint24 _color) public payable
    {
        _setPixel(_x, _y, _color, msg.value);
    }

    function _setPixel(uint _x, uint _y, uint24 _color, uint _value) internal 
    {
        require(_value >= getPixelPrice(_x, _y), "Pay up if you want to paint.");
        
        for(uint i = 0; i < purchaser[_x][_y].length; i++)
        {
            if(address(purchaser[_x][_y][i]).send(costPerPixel))
            {
                _value = _value.sub(costPerPixel);
            }
        }
        uint half = _value.div(2);
        ownerAddress1.transfer(half);
        _value = _value.sub(half);
        ownerAddress2.transfer(_value);
        
        colorPerPixel[_x][_y] = _color;
        purchaser[_x][_y].push(msg.sender);
        
        emit SetPixel(_x, _y, _color);
    }
    
    function getPixelsPrice(uint[] _xs, uint[] _ys) public view returns (uint _price)
    {
        require(_xs.length == _ys.length);
        for(uint i = 0; i < _xs.length; i++)
        {
            _price = _price.add(getPixelPrice(_xs[i], _ys[i]));
        }
    }
    
    function setPixels(uint[] _xs, uint[] _ys, uint24[] _colors) public payable
    {
        require(_xs.length == _ys.length);
        require(_xs.length == _colors.length);
        uint value = msg.value.div(_xs.length);
        for(uint i = 0; i < _xs.length; i++)
        {
            _setPixel(_xs[i], _ys[i], _colors[i], value);
        }
    }
   
    function getPixel(uint _x, uint _y) public view returns (uint24 _color)
    {
        return colorPerPixel[_x][_y];
    }
    
    function getPixelRow(uint _row) public view returns (uint24[WIDTH])
    {
        return colorPerPixel[_row];
    }
     
    function getPixels(uint[] _xs, uint[] _ys) public view returns (uint24[] _pixels)
    {
        require(_xs.length == _ys.length);
        _pixels = new uint24[](_xs.length);
        for(uint i = 0; i < _xs.length; i++)
        {
          _pixels[i] = getPixel(_xs[i], _ys[i]);
        }
    }
    
    function getAllPixels() public view returns (uint24[WIDTH][HEIGHT])
    {
        return colorPerPixel;
    }
}