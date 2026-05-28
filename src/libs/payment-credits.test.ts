import { describe, expect, it } from "vitest";

import { creditsForPaymentAmountCents } from "@/libs/payment-credits";

describe("creditsForPaymentAmountCents", () => {
  it("matches the legacy demo formula (amount cents + 1)", () => {
    expect(creditsForPaymentAmountCents(9999)).toBe(10000);
    expect(creditsForPaymentAmountCents(100)).toBe(101);
  });
});
