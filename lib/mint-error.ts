export function toMintUserMessage(error: any): string {
  const raw = String(
    error?.shortMessage ||
    error?.message ||
    error?.cause?.message ||
    ''
  ).toLowerCase();

  if (!raw) return 'Mint failed. Please try again.';

  if (raw.includes('user rejected') || raw.includes('user denied') || raw.includes('rejected the request')) {
    return 'You cancelled the wallet confirmation.';
  }
  if (raw.includes('insufficient funds')) {
    return 'Insufficient gas balance in wallet for transaction.';
  }
  if (raw.includes('transfer amount exceeds balance') || raw.includes('erc20: transfer amount exceeds balance')) {
    return 'Insufficient FF token balance.';
  }
  if (raw.includes('insufficient allowance') || raw.includes('transfer amount exceeds allowance')) {
    return 'Token allowance is not enough. Please approve again.';
  }
  if (raw.includes('invalid request parameters') || raw.includes('invalid api response format')) {
    return 'Request format mismatch. Please refresh and retry.';
  }
  if (raw.includes('tx not found on chain') || raw.includes('tx is still pending')) {
    return 'Transaction submitted. Chain confirmation is still pending.';
  }
  if (raw.includes('rpc') || raw.includes('network') || raw.includes('timeout') || raw.includes('fetch')) {
    return 'Network or RPC issue. Please retry in a moment.';
  }
  if (raw.includes('mint payment is required')) {
    return 'Mint payment is required before image generation.';
  }

  return error?.shortMessage || error?.message || 'Mint failed. Please try again.';
}
