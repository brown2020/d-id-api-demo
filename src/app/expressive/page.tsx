import { Suspense } from "react";
import ExpressiveGenerator from "@/components/expressive/ExpressiveGenerator";

export default function ExpressivePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
        <ExpressiveGenerator />
      </Suspense>
    </div>
  );
}
