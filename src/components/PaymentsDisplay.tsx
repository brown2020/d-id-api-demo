"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { usePaymentsStore } from "@/zustand/usePaymentsStore";
import { useEffect, useMemo } from "react";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function PaymentsDisplay() {
  const uid = useAuthStore((state) => state.uid);
  const { payments, paymentsLoading, paymentsError, fetchPayments } =
    usePaymentsStore();

  useEffect(() => {
    if (uid) {
      fetchPayments();
    }
  }, [uid, fetchPayments]);

  const rows = useMemo(
    () =>
      payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount / 100,
        status: payment.status,
        createdLabel: payment.createdAt
          ? dateFormatter.format(payment.createdAt.toDate())
          : "N/A",
      })),
    [payments]
  );

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto gap-4 mt-5">
      <div className="text-3xl font-bold">Payments</div>

      {paymentsLoading && <div>Loading payments...</div>}
      {paymentsError && <div>Error: {paymentsError}</div>}
      {!paymentsLoading && !paymentsError && (
        <div className="flex flex-col gap-2">
          {rows.map((payment) => (
            <div
              key={payment.id}
              className="border p-4 rounded-md bg-white shadow-md"
            >
              <div>ID: {payment.id}</div>
              <div>Amount: ${payment.amount}</div>
              <div>Created At: {payment.createdLabel}</div>
              <div>Status: {payment.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
