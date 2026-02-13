// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SoulFaceStaking
 * @dev Staking contract for LRA tokens
 * Features: stake, unstake with 7-day lock, multiplier calculation for Chat-to-Earn
 */
contract SoulFaceStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // LRA Token contract
    IERC20 public immutable lraToken;

    // Lock period: 7 days
    uint256 public constant LOCK_PERIOD = 7 days;

    // Multiplier calculation: base 1.0x (100) + stakedAmount / MULTIPLIER_DIVISOR
    // E.g., 5000 staked = 1.0 + 5000/5000 = 2.0x multiplier
    uint256 public constant MULTIPLIER_BASE = 100; // 1.0x in basis points (100 = 1.0)
    uint256 public constant MULTIPLIER_DIVISOR = 5000; // Amount needed for +1.0x
    uint256 public constant MULTIPLIER_PRECISION = 100; // Precision factor

    // Annual reward rate: 12.5% (1250 basis points)
    uint256 public rewardRateBps = 1250;
    uint256 public constant BPS_DENOMINATOR = 10000;

    // Staking info per user
    struct StakeInfo {
        uint256 amount;
        uint256 stakedAt;
        uint256 lastRewardClaim;
        uint256 pendingRewards;
    }

    // user => StakeInfo
    mapping(address => StakeInfo) public stakes;

    // Total staked in contract
    uint256 public totalStaked;

    // Reward pool (owner deposits rewards here)
    uint256 public rewardPool;

    // Events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardPoolFunded(uint256 amount);
    event RewardRateUpdated(uint256 newRate);

    constructor(address _lraToken) Ownable(msg.sender) {
        require(_lraToken != address(0), "Invalid token address");
        lraToken = IERC20(_lraToken);
    }

    /**
     * @dev Stake LRA tokens
     * @param amount Amount of LRA to stake
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be greater than zero");

        // Update pending rewards before changing stake
        _updatePendingRewards(msg.sender);

        // Transfer tokens to this contract
        lraToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update stake info
        StakeInfo storage info = stakes[msg.sender];
        info.amount += amount;
        info.stakedAt = block.timestamp;
        info.lastRewardClaim = block.timestamp;

        totalStaked += amount;

        emit Staked(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Unstake LRA tokens (after lock period)
     * @param amount Amount of LRA to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage info = stakes[msg.sender];
        require(info.amount >= amount, "Insufficient staked balance");
        require(
            block.timestamp >= info.stakedAt + LOCK_PERIOD,
            "Tokens are still locked"
        );

        // Update pending rewards before changing stake
        _updatePendingRewards(msg.sender);

        // Update stake info
        info.amount -= amount;
        totalStaked -= amount;

        // Transfer tokens back to user
        lraToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount, block.timestamp);
    }

    /**
     * @dev Claim accumulated staking rewards
     */
    function claimRewards() external nonReentrant {
        _updatePendingRewards(msg.sender);

        StakeInfo storage info = stakes[msg.sender];
        uint256 rewards = info.pendingRewards;
        require(rewards > 0, "No rewards to claim");
        require(rewardPool >= rewards, "Insufficient reward pool");

        info.pendingRewards = 0;
        info.lastRewardClaim = block.timestamp;
        rewardPool -= rewards;

        lraToken.safeTransfer(msg.sender, rewards);

        emit RewardsClaimed(msg.sender, rewards);
    }

    /**
     * @dev Get stake info for a user
     * @param user User address
     * @return amount Staked amount
     * @return stakedAt Timestamp when staked
     * @return unlockTime When tokens can be unstaked
     * @return multiplier Chat-to-Earn multiplier (100 = 1.0x)
     * @return pendingRewards Accumulated rewards
     */
    function getStakeInfo(
        address user
    )
        external
        view
        returns (
            uint256 amount,
            uint256 stakedAt,
            uint256 unlockTime,
            uint256 multiplier,
            uint256 pendingRewards
        )
    {
        StakeInfo storage info = stakes[user];
        amount = info.amount;
        stakedAt = info.stakedAt;
        unlockTime = info.stakedAt + LOCK_PERIOD;
        multiplier = _calculateMultiplier(info.amount);
        pendingRewards = info.pendingRewards + _calculateRewards(user);
    }

    /**
     * @dev Get the Chat-to-Earn multiplier for a user
     * @param user User address
     * @return Multiplier value (100 = 1.0x, 150 = 1.5x, 200 = 2.0x, etc.)
     */
    function getMultiplier(address user) external view returns (uint256) {
        return _calculateMultiplier(stakes[user].amount);
    }

    /**
     * @dev Check if user's stake is unlocked
     * @param user User address
     * @return Whether the stake is unlocked
     */
    function isUnlocked(address user) external view returns (bool) {
        StakeInfo storage info = stakes[user];
        if (info.amount == 0) return true;
        return block.timestamp >= info.stakedAt + LOCK_PERIOD;
    }

    /**
     * @dev Get time remaining until unlock
     * @param user User address
     * @return Seconds remaining (0 if unlocked)
     */
    function getTimeUntilUnlock(address user) external view returns (uint256) {
        StakeInfo storage info = stakes[user];
        if (info.amount == 0) return 0;

        uint256 unlockTime = info.stakedAt + LOCK_PERIOD;
        if (block.timestamp >= unlockTime) return 0;
        return unlockTime - block.timestamp;
    }

    /**
     * @dev Fund the reward pool (owner only)
     * @param amount Amount of LRA to add to reward pool
     */
    function fundRewardPool(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than zero");
        lraToken.safeTransferFrom(msg.sender, address(this), amount);
        rewardPool += amount;
        emit RewardPoolFunded(amount);
    }

    /**
     * @dev Update reward rate (owner only)
     * @param newRateBps New annual reward rate in basis points
     */
    function setRewardRate(uint256 newRateBps) external onlyOwner {
        require(newRateBps <= 5000, "Rate too high"); // Max 50% APY
        rewardRateBps = newRateBps;
        emit RewardRateUpdated(newRateBps);
    }

    /**
     * @dev Internal: Calculate multiplier based on staked amount
     * Formula: 100 (base 1.0x) + (amount / MULTIPLIER_DIVISOR) * 100
     * E.g., 5000 staked = 100 + 100 = 200 (2.0x)
     */
    function _calculateMultiplier(
        uint256 amount
    ) internal pure returns (uint256) {
        if (amount == 0) return MULTIPLIER_BASE;
        uint256 bonus = (amount * MULTIPLIER_PRECISION) / MULTIPLIER_DIVISOR;
        return MULTIPLIER_BASE + bonus;
    }

    /**
     * @dev Internal: Calculate pending rewards for a user
     */
    function _calculateRewards(address user) internal view returns (uint256) {
        StakeInfo storage info = stakes[user];
        if (info.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - info.lastRewardClaim;
        // Annual rate applied proportionally
        // rewards = (amount * rate * timeElapsed) / (365 days * BPS_DENOMINATOR)
        uint256 rewards = (info.amount * rewardRateBps * timeElapsed) /
            (365 days * BPS_DENOMINATOR);
        return rewards;
    }

    /**
     * @dev Internal: Update pending rewards before stake changes
     */
    function _updatePendingRewards(address user) internal {
        StakeInfo storage info = stakes[user];
        if (info.amount > 0) {
            info.pendingRewards += _calculateRewards(user);
        }
        info.lastRewardClaim = block.timestamp;
    }
}
