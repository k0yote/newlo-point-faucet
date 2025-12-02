// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenFaucet
 * @dev ERC20トークンのFaucetコントラクト
 * - 運営がclaimForを呼び出して指定アドレスにトークンを送付
 * - アドレスごとのクールダウン機能
 * - 1回の付与量: 500トークン（設定可能）
 */
contract TokenFaucet is Ownable, ReentrancyGuard {
    IERC20 public token;

    uint256 public claimAmount;        // 1回の付与量（decimals込み）
    uint256 public cooldownTime;       // クールダウン時間（秒）

    // アドレスごとの最終claim時刻
    mapping(address => uint256) public lastClaimTime;

    // 運営者マッピング
    mapping(address => bool) public operators;

    // イベント
    event TokensClaimed(address indexed recipient, uint256 amount, uint256 timestamp);
    event ClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event CooldownTimeUpdated(uint256 oldTime, uint256 newTime);
    event OperatorUpdated(address indexed operator, bool status);
    event TokensWithdrawn(address indexed to, uint256 amount);

    // エラー
    error CooldownNotExpired(uint256 remainingTime);
    error InsufficientBalance();
    error NotOperator();
    error InvalidAddress();
    error InvalidAmount();

    modifier onlyOperator() {
        if (!operators[msg.sender] && msg.sender != owner()) {
            revert NotOperator();
        }
        _;
    }

    /**
     * @dev コンストラクタ
     * @param _token ERC20トークンアドレス
     * @param _claimAmount 1回の付与量（decimals込み）
     * @param _cooldownTime クールダウン時間（秒）
     */
    constructor(
        address _token,
        uint256 _claimAmount,
        uint256 _cooldownTime
    ) Ownable(msg.sender) {
        if (_token == address(0)) revert InvalidAddress();

        token = IERC20(_token);
        claimAmount = _claimAmount;
        cooldownTime = _cooldownTime;

        // デプロイヤーをオペレーターに設定
        operators[msg.sender] = true;
    }

    /**
     * @dev 指定アドレスにトークンを付与（運営者のみ）
     * @param recipient 受取アドレス
     */
    function claimFor(address recipient) external onlyOperator nonReentrant {
        if (recipient == address(0)) revert InvalidAddress();

        // クールダウンチェック
        uint256 lastClaim = lastClaimTime[recipient];
        if (lastClaim != 0 && block.timestamp < lastClaim + cooldownTime) {
            revert CooldownNotExpired(lastClaim + cooldownTime - block.timestamp);
        }

        // 残高チェック
        if (token.balanceOf(address(this)) < claimAmount) {
            revert InsufficientBalance();
        }

        // 最終claim時刻を更新
        lastClaimTime[recipient] = block.timestamp;

        // トークン送付
        require(token.transfer(recipient, claimAmount), "Transfer failed");

        emit TokensClaimed(recipient, claimAmount, block.timestamp);
    }

    /**
     * @dev クールダウン残り時間を取得
     * @param account 確認するアドレス
     * @return remainingTime 残り時間（秒）、0ならclaim可能
     */
    function getRemainingCooldown(address account) external view returns (uint256 remainingTime) {
        uint256 lastClaim = lastClaimTime[account];
        if (lastClaim == 0) return 0;

        uint256 nextClaimTime = lastClaim + cooldownTime;
        if (block.timestamp >= nextClaimTime) return 0;

        return nextClaimTime - block.timestamp;
    }

    /**
     * @dev claim可能かチェック
     * @param account 確認するアドレス
     * @return result claim可能ならtrue
     */
    function canClaim(address account) external view returns (bool result) {
        uint256 lastClaim = lastClaimTime[account];
        if (lastClaim == 0) return true;
        return block.timestamp >= lastClaim + cooldownTime;
    }

    /**
     * @dev 付与量を更新（オーナーのみ）
     * @param _claimAmount 新しい付与量
     */
    function setClaimAmount(uint256 _claimAmount) external onlyOwner {
        if (_claimAmount == 0) revert InvalidAmount();
        emit ClaimAmountUpdated(claimAmount, _claimAmount);
        claimAmount = _claimAmount;
    }

    /**
     * @dev クールダウン時間を更新（オーナーのみ）
     * @param _cooldownTime 新しいクールダウン時間（秒）
     */
    function setCooldownTime(uint256 _cooldownTime) external onlyOwner {
        emit CooldownTimeUpdated(cooldownTime, _cooldownTime);
        cooldownTime = _cooldownTime;
    }

    /**
     * @dev オペレーターを設定（オーナーのみ）
     * @param operator オペレーターアドレス
     * @param status 有効/無効
     */
    function setOperator(address operator, bool status) external onlyOwner {
        if (operator == address(0)) revert InvalidAddress();
        operators[operator] = status;
        emit OperatorUpdated(operator, status);
    }

    /**
     * @dev コントラクト内のトークンを引き出し（オーナーのみ）
     * @param to 送付先
     * @param amount 金額
     */
    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();
        require(token.transfer(to, amount), "Transfer failed");
        emit TokensWithdrawn(to, amount);
    }

    /**
     * @dev コントラクトのトークン残高を取得
     */
    function getBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
