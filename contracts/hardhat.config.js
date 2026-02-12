import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

const walletAccounts = process.env.PRIVATE_KEY
    ? [process.env.PRIVATE_KEY]
    : (process.env.MNEMONIC ? { mnemonic: process.env.MNEMONIC } : []);

/** @type import('hardhat/config').HardhatUserConfig */
export default {
    solidity: "0.8.27",
    networks: {
        // Fly.io 上的 Anvil RPC（与 Hardhat/Anvil 默认测试账户一致，无需 PRIVATE_KEY）
        fly: {
            url: process.env.FLY_RPC_URL || "https://lauraai-rpc.fly.dev",
            chainId: 31337,
            accounts: process.env.PRIVATE_KEY
                ? [process.env.PRIVATE_KEY]
                : (process.env.MNEMONIC ? { mnemonic: process.env.MNEMONIC } : { mnemonic: "test test test test test test test test test test test junk" }),
            gasPrice: 10_000_000_000, // 10 gwei，避免 base fee 导致 deploy 失败
        },
        bsctest: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            accounts: walletAccounts,
        },
        bsc: {
            url: "https://bsc-dataseed.binance.org/",
            chainId: 56,
            accounts: walletAccounts,
        },
        ethmainnet: {
            url: process.env.ETH_MAINNET_RPC_URL || "",
            chainId: 1,
            accounts: walletAccounts,
        },
    },
    etherscan: {
        apiKey: process.env.BSCSCAN_API_KEY,
    },
};
