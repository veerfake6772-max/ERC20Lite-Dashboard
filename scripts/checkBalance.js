import { ethers } from 'ethers'


const contract = await ethers.getContractAt("ERC20Lite", "0x5FbDB2315678afecb367f032d93F642f64180aa3");
const raw = await contract.balanceOf("0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199");
ethers.formatUnits(raw, await contract.decimals());