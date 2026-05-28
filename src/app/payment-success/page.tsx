"use client";

import PaymentSuccessPage from "@/components/PaymentSuccessPage";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const payment_intent = searchParams.get("payment_intent") || "";

  return <PaymentSuccessPage payment_intent={payment_intent} />;
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={<div role="status">Loading payment details...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
