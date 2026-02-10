# LauraAI 本地链 RPC 节点（Anvil，与 Hardhat 链兼容 31337）
FROM ghcr.io/foundry-rs/foundry:latest

# 监听所有接口，供 Fly 转发
ENV ANVIL_HOST=0.0.0.0
EXPOSE 8545

# 必须监听 0.0.0.0 才能被 Fly 代理转发
ENV ANVIL_IP_ADDR=0.0.0.0
CMD ["anvil", "--host", "0.0.0.0", "--port", "8545"]
