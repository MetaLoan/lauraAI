import hre from "hardhat";

// 要转入的地址（可通过环境变量 TARGET_ADDRESS 覆盖）
const TARGET_ADDRESS = process.env.TARGET_ADDRESS || "0xf344a94d7919b663b9c04d3cc02bdcbf065c5171";

// 云端 Fly RPC 或本地首次部署的 LRA 地址（可通过 LRA_TOKEN_ADDRESS 覆盖）
const LRA_TOKEN_ADDRESS = process.env.LRA_TOKEN_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const target = TARGET_ADDRESS;

  console.log("Funding address:", target);
  console.log("From (deployer):", deployer.address);

  // 1. 转原生币 (ETH/BNB) 用于 gas
  const nativeAmount = hre.ethers.parseEther("10"); // 10 ETH
  const tx1 = await deployer.sendTransaction({
    to: target,
    value: nativeAmount,
  });
  await tx1.wait();
  console.log("Sent 10 native (ETH/BNB) for gas. Tx:", tx1.hash);

  // 2. 转 LRA 测试代币
  const token = await hre.ethers.getContractAt("LauraAIToken", LRA_TOKEN_ADDRESS);
  const lraAmount = hre.ethers.parseUnits("100000", 18); // 100,000 LRA
  const tx2 = await token.transfer(target, lraAmount);
  await tx2.wait();
  console.log("Sent 100,000 LRA. Tx:", tx2.hash);

  const balance = await token.balanceOf(target);
  console.log("\nDone. Target LRA balance:", hre.ethers.formatUnits(balance, 18), "LRA");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
