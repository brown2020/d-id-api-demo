// paymentActions.ts
"use server";

import { adminDb } from "@/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import {
  creditsForPaymentAmountCents,
  isCreditPackAmount,
} from "@/libs/payment-credits";
import Stripe from "stripe";

import { getCurrentUser } from "./auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export type FulfillPaymentResult = {
  id: string;
  amount: number;
  created: number;
  status: string;
  alreadyFulfilled: boolean;
  creditsAdded: number;
  creditsTotal: number;
};

export async function createPaymentIntent(amount: number) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const product = process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME;

  try {
    if (!isCreditPackAmount(amount)) {
      throw new Error("Invalid payment amount");
    }
    if (!product) throw new Error("Stripe product name is not defined");

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        product,
        userId: user.uid,
      },
      description: `Payment for product ${process.env.NEXT_PUBLIC_STRIPE_PRODUCT_NAME}`,
    });

    return paymentIntent.client_secret;
  } catch {
    throw new Error("Failed to create payment intent");
  }
}

/**
 * Verifies a succeeded Stripe payment and grants credits exactly once via Admin SDK.
 */
export async function fulfillPayment(
  paymentIntentId: string
): Promise<FulfillPaymentResult> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!paymentIntentId.trim()) {
    throw new Error("Payment intent ID is required");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    throw new Error("Payment was not successful");
  }

  if (paymentIntent.metadata?.userId !== user.uid) {
    throw new Error("Payment does not belong to the signed-in user");
  }

  const uid = user.uid;
  const paymentDocRef = adminDb.doc(`users/${uid}/payments/${paymentIntentId}`);
  const profileRef = adminDb.doc(`users/${uid}/profile/userData`);
  const creditsToAdd = creditsForPaymentAmountCents(paymentIntent.amount);

  const fulfillment = await adminDb.runTransaction(async (transaction) => {
    const existingPayment = await transaction.get(paymentDocRef);

    if (existingPayment.exists) {
      const paymentData = existingPayment.data() ?? {};
      const profileSnap = await transaction.get(profileRef);
      const creditsTotal = Number(profileSnap.data()?.credits ?? 1000);

      return {
        alreadyFulfilled: true,
        creditsAdded: Number(paymentData.creditsGranted ?? creditsToAdd),
        creditsTotal,
      };
    }

    const profileSnap = await transaction.get(profileRef);
    const currentCredits = profileSnap.exists
      ? Number(profileSnap.data()?.credits ?? 1000)
      : 1000;
    const creditsTotal = currentCredits + creditsToAdd;

    transaction.set(
      paymentDocRef,
      {
        id: paymentIntentId,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        creditsGranted: creditsToAdd,
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    transaction.set(
      profileRef,
      {
        credits: creditsTotal,
      },
      { merge: true }
    );

    return {
      alreadyFulfilled: false,
      creditsAdded: creditsToAdd,
      creditsTotal,
    };
  });

  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    created: paymentIntent.created,
    status: paymentIntent.status,
    alreadyFulfilled: fulfillment.alreadyFulfilled,
    creditsAdded: fulfillment.creditsAdded,
    creditsTotal: fulfillment.creditsTotal,
  };
}
