/** One demo credit is charged for each video submitted to D-ID. */
export const VIDEO_GENERATION_CREDIT_COST = 1;

export function balanceAfterVideoDebit(current: number): number | null {
  if (!Number.isFinite(current) || current < VIDEO_GENERATION_CREDIT_COST) {
    return null;
  }
  return current - VIDEO_GENERATION_CREDIT_COST;
}

export const INSUFFICIENT_CREDITS_MESSAGE =
  "Not enough credits. This video costs 1 credit.";
