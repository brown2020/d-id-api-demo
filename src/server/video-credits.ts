import { adminDb } from "@/firebase/firebaseAdmin";
import {
  VIDEO_GENERATION_CREDIT_COST,
  balanceAfterVideoDebit,
} from "@/libs/video-credits";

function profileRef(uid: string) {
  return adminDb.doc(`users/${uid}/profile/userData`);
}

function readBalance(value: unknown): number {
  const balance = typeof value === "number" ? value : Number.NaN;
  return Number.isFinite(balance) ? balance : 0;
}

export async function debitVideoGenerationCredits(
  uid: string
): Promise<{ ok: true; balance: number } | { ok: false; balance: number }> {
  const ref = profileRef(uid);

  return adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const balance = readBalance(snap.data()?.credits);
    const next = balanceAfterVideoDebit(balance);
    if (next === null) {
      return { ok: false as const, balance };
    }

    transaction.set(ref, { credits: next }, { merge: true });
    return { ok: true as const, balance: next };
  });
}

export async function refundVideoGenerationCredits(uid: string): Promise<void> {
  const ref = profileRef(uid);

  await adminDb.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const balance = readBalance(snap.data()?.credits);
    transaction.set(
      ref,
      { credits: balance + VIDEO_GENERATION_CREDIT_COST },
      { merge: true }
    );
  });
}
