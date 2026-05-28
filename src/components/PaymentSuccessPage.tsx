"use client";

import { fulfillPayment } from "@/actions/paymentActions";
import useProfileStore from "@/zustand/useProfileStore";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  payment_intent: string;
};

export default function PaymentSuccessPage({ payment_intent }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [created, setCreated] = useState(0);
  const [id, setId] = useState("");
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState("");
  const [creditsAdded, setCreditsAdded] = useState(0);

  const fetchProfile = useProfileStore((state) => state.fetchProfile);

  useEffect(() => {
    if (!payment_intent) {
      setMessage("No payment intent found");
      setLoading(false);
      return;
    }

    const handlePaymentSuccess = async () => {
      try {
        const data = await fulfillPayment(payment_intent);

        setId(data.id);
        setAmount(data.amount);
        setCreated(data.created * 1000);
        setStatus(data.status);
        setCreditsAdded(data.creditsAdded);

        if (data.alreadyFulfilled) {
          setMessage("Payment has already been processed.");
        } else {
          setMessage("Payment successful");
        }

        await fetchProfile();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Error handling payment success"
        );
      } finally {
        setLoading(false);
      }
    };

    void handlePaymentSuccess();
  }, [payment_intent, fetchProfile]);

  return (
    <main className="max-w-6xl flex flex-col gap-2.5 mx-auto p-10 text-black text-center border m-10 rounded-md border-black">
      {loading ? (
        <div role="status" aria-live="polite">
          Validating payment...
        </div>
      ) : id ? (
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold mb-2">Thank you!</h1>
          <h2 className="text-2xl">You successfully purchased credits</h2>
          <div className="bg-white p-2 rounded-md my-5 text-4xl font-bold mx-auto">
            ${amount / 100}
          </div>
          <p className="text-lg">
            {creditsAdded.toLocaleString()} credits added to your profile
          </p>
          <div className="text-sm text-gray-600 mt-4 space-y-1">
            <div>Payment ID: {id}</div>
            <div>Created: {new Date(created).toLocaleString()}</div>
            <div>Status: {status}</div>
          </div>
          {message ? (
            <p className="mt-4 text-sm text-gray-700" role="status">
              {message}
            </p>
          ) : null}
        </div>
      ) : (
        <div role="alert">{message}</div>
      )}

      <Link
        href="/profile"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:opacity-80"
      >
        View Profile
      </Link>
    </main>
  );
}
