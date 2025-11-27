const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC20Lite", function () {
  let owner, addr1, addr2, token;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    const ERC20Lite = await ethers.getContractFactory("ERC20Lite");
    token = await ERC20Lite.deploy("LiteToken", "LTK", ethers.parseUnits("1000000", 18));
    await token.waitForDeployment();
  });

  it("should set correct metadata", async () => {
    expect(await token.name()).to.equal("LiteToken");
    expect(await token.symbol()).to.equal("LTK");
  });

  it("only owner can mint", async () => {
    await token.mint(addr1.address, ethers.parseUnits("1000", 18));

    const balance = await token.balanceOf(addr1.address);
    expect(balance).to.equal(ethers.parseUnits("1000", 18));

    await expect(
      token.connect(addr1).mint(addr2.address, 100)
    ).to.be.revertedWith("Not owner");
  });

  it("should transfer tokens", async () => {
    await token.mint(owner.address, ethers.parseUnits("500", 18));

    await token.transfer(addr1.address, ethers.parseUnits("200", 18));

    expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseUnits("200", 18));
  });

  it("should approve and transferFrom", async () => {
    await token.mint(owner.address, ethers.parseUnits("300", 18));

    await token.approve(addr1.address, ethers.parseUnits("100", 18));

    await token.connect(addr1).transferFrom(
      owner.address,
      addr2.address,
      ethers.parseUnits("100", 18)
    );

    expect(await token.balanceOf(addr2.address)).to.equal(ethers.parseUnits("100", 18));
  });

  it("should burn tokens", async () => {
    await token.mint(owner.address, ethers.parseUnits("200", 18));

    await token.burn(ethers.parseUnits("50", 18));

    expect(await token.balanceOf(owner.address)).to.equal(ethers.parseUnits("150", 18));
  });

  it("should enforce cap limit", async () => {
    const cap = await token.cap();

    await token.mint(owner.address, cap);

    await expect(
      token.mint(owner.address, 1)
    ).to.be.revertedWith("ERC20: cap exceeded");
  });
});
