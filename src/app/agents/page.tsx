import { Suspense } from "react";
import AgentManager from "@/components/agents/AgentManager";

export default function AgentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
        <AgentManager />
      </Suspense>
    </div>
  );
}
