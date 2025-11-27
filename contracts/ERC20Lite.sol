// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ERC-20 Full — extended ERC20 with owner-only mint, burn, allowance, cap
contract ERC20Lite {
    // Metadata
    string public name;
    string public symbol;
    uint8 public decimals = 18;

    // Totals and balances
    uint256 public totalSupply;
    uint256 public immutable cap; // max supply
    mapping(address => uint256) public balanceOf;

    // Allowances: owner => spender => amount
    mapping(address => mapping(address => uint256)) public allowance;

    // Owner
    address public owner;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(string memory _name, string memory _symbol, uint256 _cap) {
        require(_cap > 0, "Cap must be > 0");
        name = _name;
        symbol = _symbol;
        cap = _cap;
        owner = msg.sender;
    }

    /// @notice Mint tokens (onlyOwner)
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "ERC20: mint to zero address");
        require(totalSupply + amount <= cap, "ERC20: cap exceeded");

        totalSupply += amount;
        balanceOf[to] += amount;

        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);
    }

    /// @notice Burn your tokens
    function burn(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "ERC20: insufficient balance");

        balanceOf[msg.sender] -= amount;
        totalSupply -= amount;

        emit Burn(msg.sender, amount);
        emit Transfer(msg.sender, address(0), amount);
    }

    /// @notice Standard ERC-20 transfer
    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    /// @notice Approve spender
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /// @notice Transfer using allowance
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        require(allowed >= amount, "ERC20: allowance exceeded");

        allowance[from][msg.sender] = allowed - amount;
        _transfer(from, to, amount);

        return true;
    }

    /// @dev Internal transfer logic
    function _transfer(address from, address to, uint256 amount) internal {
        require(to != address(0), "ERC20: transfer to zero address");
        require(balanceOf[from] >= amount, "ERC20: insufficient balance");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
    }
}
