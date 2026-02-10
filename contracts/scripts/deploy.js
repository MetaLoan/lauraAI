import hre from "hardhat";

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // 1. Deploy LRA Token
    console.log("\n--- Deploying LauraAIToken ---");
    const LauraAIToken = await hre.ethers.getContractFactory("LauraAIToken");
    const token = await LauraAIToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("LauraAIToken deployed to:", tokenAddress);

    // 2. Deploy NFT (Soulmate)
    console.log("\n--- Deploying LauraAISoulmate ---");
    const LauraAISoulmate = await hre.ethers.getContractFactory("LauraAISoulmate");
    const soulmate = await LauraAISoulmate.deploy();
    await soulmate.waitForDeployment();
    const soulmateAddress = await soulmate.getAddress();
    console.log("LauraAISoulmate deployed to:", soulmateAddress);

    // 3. Deploy Marketplace
    console.log("\n--- Deploying LauraAIMarketplace ---");
    const LauraAIMarketplace = await hre.ethers.getContractFactory("LauraAIMarketplace");
    const marketplace = await LauraAIMarketplace.deploy(soulmateAddress);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log("LauraAIMarketplace deployed to:", marketplaceAddress);

    // 4. Deploy Staking
    console.log("\n--- Deploying LauraAIStaking ---");
    const LauraAIStaking = await hre.ethers.getContractFactory("LauraAIStaking");
    const staking = await LauraAIStaking.deploy(tokenAddress);
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("LauraAIStaking deployed to:", stakingAddress);

    // Summary
    console.log("\n========================================");
    console.log("Deployment Complete!");
    console.log("========================================");
    console.log("LauraAIToken:      ", tokenAddress);
    console.log("LauraAISoulmate:   ", soulmateAddress);
    console.log("LauraAIMarketplace:", marketplaceAddress);
    console.log("LauraAIStaking:    ", stakingAddress);
    console.log("========================================");

    // Optional: Fund the staking reward pool with some initial tokens
    console.log("\n--- Funding Staking Reward Pool ---");
    const fundAmount = hre.ethers.parseUnits("1000000", 18); // 1M LRA
    await token.approve(stakingAddress, fundAmount);
    const stakingContract = await hre.ethers.getContractAt("LauraAIStaking", stakingAddress);
    await stakingContract.fundRewardPool(fundAmount);
    console.log("Funded staking reward pool with 1,000,000 LRA");

    // Return addresses for programmatic access
    return {
        token: tokenAddress,
        soulmate: soulmateAddress,
        marketplace: marketplaceAddress,
        staking: stakingAddress,
    };
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
