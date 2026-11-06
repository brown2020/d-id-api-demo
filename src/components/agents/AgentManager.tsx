"use client";

import { useState, useEffect } from "react";
import useProfileStore from "@/zustand/useProfileStore";
import { createAgent, listUserAgents, createAgentClientKey } from "@/actions/agents";
import { Agent } from "@/types/did";
import { Loader2, MessageSquare, Bot, Copy, Check, ExternalLink } from "lucide-react";

export default function AgentManager() {
  const profile = useProfileStore((state) => state.profile);
  const { did_api_key: didApiKey, did_basic_auth: didBasicAuth } = profile;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [clientKey, setClientKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    const result = await listUserAgents();
    if (result.status && result.agents) {
      setAgents(result.agents);
    }
    setLoading(false);
  };

  const handleCreateAgent = async () => {
    if (!agentName.trim()) return;

    setCreating(true);
    const result = await createAgent(
      agentName,
      "v2_public_Amber@0zSz8kflCN",
      "microsoft",
      "en-US-JennyMultilingualV2Neural",
      didApiKey,
      didBasicAuth
    );

    if (result.status && result.agent) {
      setAgents([result.agent, ...agents]);
      setAgentName("");
      setShowCreateForm(false);
      setSelectedAgent(result.agent);
    }
    setCreating(false);
  };

  const handleGenerateClientKey = async () => {
    if (!selectedAgent) return;

    setGeneratingKey(true);
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const result = await createAgentClientKey(
      [currentOrigin],
      didApiKey,
      didBasicAuth
    );

    if (result.status && result.clientKey) {
      setClientKey(result.clientKey.client_key);
    }
    setGeneratingKey(false);
  };

  const copyToClipboard = async (text: string, type: "key" | "embed") => {
    await navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  const getEmbedCode = () => {
    if (!selectedAgent || !clientKey) return "";

    return `<script
  type="module"
  src="https://agent.d-id.com/v2/index.js"
  data-mode="fabio"
  data-client-key="${clientKey}"
  data-agent-id="${selectedAgent.id}"
  data-name="did-agent"
></script>`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!didApiKey && !didBasicAuth) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Bot className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">D-ID API Key Required</h2>
          <p className="text-gray-600 mb-4">
            Please add your D-ID API key in your Profile to create and manage agents.
          </p>
          <a
            href="/profile"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Profile
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          Realtime Agents
        </h1>
        <p className="text-gray-600">
          Create conversational AI agents with live avatars for real-time interactions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Agents</h2>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              {showCreateForm ? "Cancel" : "Create Agent"}
            </button>
          </div>

          {showCreateForm && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Create New Agent</h3>
              <input
                type="text"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Agent name (e.g., Support Agent, Sales Assistant)"
                className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleCreateAgent}
                disabled={!agentName.trim() || creating}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Bot className="w-5 h-5" />
                    Create Agent
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                Uses default Amber presenter with Microsoft Azure voice
              </p>
            </div>
          )}

          <div className="space-y-4">
            {agents.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No agents yet. Create your first agent to get started.</p>
              </div>
            ) : (
              agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full p-4 border-2 rounded-lg transition-all text-left ${
                    selectedAgent?.id === agent.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{agent.preview_name || "Unnamed Agent"}</h3>
                      <p className="text-sm text-gray-600">ID: {agent.id}</p>
                      {agent.created_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(agent.created_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          {selectedAgent ? (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Agent Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-gray-600">{selectedAgent.preview_name || "Unnamed"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Agent ID:</span>
                    <span className="ml-2 text-gray-600 break-all">{selectedAgent.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Presenter:</span>
                    <span className="ml-2 text-gray-600">{selectedAgent.presenter.presenter_id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Voice:</span>
                    <span className="ml-2 text-gray-600">
                      {selectedAgent.presenter.voice.type} - {selectedAgent.presenter.voice.voice_id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Embed Agent</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Generate a client key to embed this agent on your website
                </p>

                {!clientKey ? (
                  <button
                    onClick={handleGenerateClientKey}
                    disabled={generatingKey}
                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generatingKey ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Client Key"
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Client Key</label>
                        <button
                          onClick={() => copyToClipboard(clientKey, "key")}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {copiedKey ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200 text-xs break-all font-mono">
                        {clientKey}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-700">Embed Code</label>
                        <button
                          onClick={() => copyToClipboard(getEmbedCode(), "embed")}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {copiedEmbed ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <pre className="text-xs overflow-x-auto">
                          <code>{getEmbedCode()}</code>
                        </pre>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Important:</strong> This client key is restricted to your current domain.
                      </p>
                      <p className="text-xs text-blue-700">
                        To use it on other domains, generate a new key with those domains allowlisted in the D-ID console.
                      </p>
                    </div>

                    <a
                      href="https://docs.d-id.com/docs/embed-quickstart"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Embed Documentation
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center h-full flex items-center justify-center">
              <div>
                <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select an agent to view details and embed options</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3">About Realtime Agents</h3>
        <p className="text-sm text-gray-600 mb-3">
          D-ID Realtime Agents enable conversational AI experiences with live video avatars. 
          They combine speech-to-text, LLM responses, text-to-speech, and avatar rendering 
          into a seamless WebRTC stream.
        </p>
        <p className="text-sm text-gray-600">
          Use the embed code to add an interactive agent widget to any website. 
          The agent can have custom knowledge bases, LLM configurations, and voices.
        </p>
      </div>
    </div>
  );
}
