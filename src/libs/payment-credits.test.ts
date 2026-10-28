import { describe, expect, it } from "vitest";

import {
  creditsForPaymentAmountCents,
  isCreditPackAmount,
} from "@/libs/payment-credits";

describe("creditsForPaymentAmountCents", () => {
  it("matches the legacy demo formula (amount cents + 1)", () => {
    expect(creditsForPaymentAmountCents(9999)).toBe(10000);
    expect(creditsForPaymentAmountCents(100)).toBe(101);
  });
});

describe("isCreditPackAmount", () => {
  it("accepts only the catalog pack price", () => {
    expect(isCreditPackAmount(9999)).toBe(true);
    expect(isCreditPackAmount(50)).toBe(false);
    expect(isCreditPackAmount(99.99)).toBe(false);
  });
});
