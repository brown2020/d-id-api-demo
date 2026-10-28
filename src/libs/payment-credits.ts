/** Catalog price for the 10,000-credit pack, in USD cents. */
export const CREDIT_PACK_AMOUNT_CENTS = 9999;

/** Demo credit grant formula preserved from the payment success flow. */
export function creditsForPaymentAmountCents(amountCents: number): number {
  return amountCents + 1;
}

export function isCreditPackAmount(amountCents: number): boolean {
  return Number.isInteger(amountCents) && amountCents === CREDIT_PACK_AMOUNT_CENTS;
}
