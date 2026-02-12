import hre from "hardhat";

async function main() {
    const deployGasLimit = process.env.DEPLOY_GAS_LIMIT ? BigInt(process.env.DEPLOY_GAS_LIMIT) : 5000000n;
    const deployOverrides = { gasLimit: deployGasLimit };

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

    // 1. Use existing FF token or deploy a new one
    let tokenAddress = process.env.FF_TOKEN_ADDRESS;
    if (tokenAddress && tokenAddress.trim() !== "") {
        tokenAddress = tokenAddress.trim();
        console.log("\n--- Using existing FF token ---");
        console.log("FF token:", tokenAddress);
    } else {
        console.log("\n--- Deploying LauraAIToken ---");
        const LauraAIToken = await hre.ethers.getContractFactory("LauraAIToken");
        const token = await LauraAIToken.deploy(deployOverrides);
        await token.waitForDeployment();
        tokenAddress = await token.getAddress();
        console.log("LauraAIToken deployed to:", tokenAddress);
    }

    // 2. Deploy NFT (Soulmate) with FF payment settings
    console.log("\n--- Deploying LauraAISoulmate ---");
    const LauraAISoulmate = await hre.ethers.getContractFactory("LauraAISoulmate");
    const treasury = process.env.MINT_TREASURY_WALLET || deployer.address;
    const mintPrice = process.env.MINT_PRICE_WEI || hre.ethers.parseUnits("1", 18).toString(); // 1 FF default
    const soulmate = await LauraAISoulmate.deploy(tokenAddress, treasury, mintPrice, deployOverrides);
    await soulmate.waitForDeployment();
    const soulmateAddress = await soulmate.getAddress();
    console.log("LauraAISoulmate deployed to:", soulmateAddress);
    console.log("Soulmate payment token:", tokenAddress);
    console.log("Soulmate treasury:", treasury);
    console.log("Soulmate mintPrice (wei):", mintPrice);

    // 3. Deploy Marketplace
    console.log("\n--- Deploying LauraAIMarketplace ---");
    const LauraAIMarketplace = await hre.ethers.getContractFactory("LauraAIMarketplace");
    const marketplace = await LauraAIMarketplace.deploy(soulmateAddress, deployOverrides);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log("LauraAIMarketplace deployed to:", marketplaceAddress);

    // 4. Deploy Staking
    console.log("\n--- Deploying LauraAIStaking ---");
    const LauraAIStaking = await hre.ethers.getContractFactory("LauraAIStaking");
    const staking = await LauraAIStaking.deploy(tokenAddress, deployOverrides);
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
    if (!process.env.FF_TOKEN_ADDRESS || process.env.FF_TOKEN_ADDRESS.trim() === "") {
        console.log("\n--- Funding Staking Reward Pool ---");
        const token = await hre.ethers.getContractAt("LauraAIToken", tokenAddress);
        const fundAmount = hre.ethers.parseUnits("1000000", 18); // 1M LRA
        await token.approve(stakingAddress, fundAmount);
        const stakingContract = await hre.ethers.getContractAt("LauraAIStaking", stakingAddress);
        await stakingContract.fundRewardPool(fundAmount);
        console.log("Funded staking reward pool with 1,000,000 LRA");
    } else {
        console.log("\n--- Skipping staking fund step (using existing FF token) ---");
    }

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
