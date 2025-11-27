const { ethers } = require("hardhat");

async function main() {
  const NAME = "LiteToken";
  const SYMBOL = "LTK";
  const CAP = ethers.parseUnits("1000000", 18); // 1M tokens max supply

  console.log("Deploying ERC20Lite...");

  const ERC20Lite = await ethers.getContractFactory("ERC20Lite");
  const token = await ERC20Lite.deploy(NAME, SYMBOL, CAP);

  await token.waitForDeployment();

  console.log("------------------------------------------------");
  console.log("ERC20Lite deployed at:", await token.getAddress());
  console.log(`Name: ${NAME}, Symbol: ${SYMBOL}, Cap: ${CAP}`);
  console.log("------------------------------------------------");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
