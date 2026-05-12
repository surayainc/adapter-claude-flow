/**
 * Adapter entry point: suraya.connect()
 *
 * Wraps a BrainClient with Claude-Flow-friendly helpers — retrieve,
 * emit, and per-step/per-run observation shortcuts. Same surface as
 * the claude-swarm and anthropic-agent-teams adapters.
 *
 * v1.4 scaffold: the actual Claude Flow hook integration depends on
 * the upstream SDK shape, which is not pinned. Consumers can already
 * build against this signature; real wiring lands in v1.5.
 */
import { BrainClient } from "@surayaorg/brain-sdk";
import type {
  SurayaConnectOptions,
  SurayaBrainProxy,
  FlowRun,
  FlowStep,
  AgentInvocation,
} from "./types.js";
import type { RetrieveResult } from "@surayaorg/brain-sdk";

function connect(options: SurayaConnectOptions): SurayaBrainProxy {
  const client = new BrainClient({
    baseUrl: options.baseUrl ?? "https://brain.suraya.ai",
    projectSlug: options.projectSlug,
    ...(options.hmacSecret ? { hmacSecret: options.hmacSecret } : {}),
    ...(options.bootstrapToken ? { bootstrapToken: options.bootstrapToken } : {}),
  });

  function formatAsContext(results: RetrieveResult[]): string {
    if (results.length === 0) return "Brain context: no observations matched.";
    return [
      `Brain context (top ${results.length} observations):`,
      ...results.map(
        (r, i) =>
          `  ${i + 1}. [${r.type}] ${r.representative_summary} (sim ${r.similarity.toFixed(2)})`
      ),
    ].join("\n");
  }

  return {
    client,

    async retrieve(q, topK = 5): Promise<RetrieveResult[]> {
      const res = await client.retrieve({ q, topK });
      return res.results;
    },

    async retrieveForAgent(agent: AgentInvocation, topK = 5): Promise<RetrieveResult[]> {
      const q = agent.lastUserMessage?.trim();
      if (!q) return [];
      const res = await client.retrieve({ q, topK });
      return res.results;
    },

    async emit(observation): Promise<void> {
      await client.emitObservation(observation);
    },

    async emitFromStep(step: FlowStep, projectSlug?: string): Promise<void> {
      const summary =
        step.stop_reason === "tool_use"
          ? `Flow step ${step.step_id} dispatched tool call`
          : step.stop_reason === "end_turn"
            ? `Flow step ${step.step_id} completed`
            : `Flow step ${step.step_id} stopped (${step.stop_reason ?? "unknown"})`;
      await client.emitObservation({
        type: "decision",
        representative_summary: summary.slice(0, 300),
        criticality: "low",
        actor_handle: `flow:${step.agent_id ?? step.step_id}`,
        ...(projectSlug ? { project_slug: projectSlug } : {}),
        tags: ["claude-flow", `flow:run:${step.run_id}`],
        payload: {
          stop_reason: step.stop_reason,
          content_preview: step.content?.slice(0, 200),
        },
      });
    },

    async emitFromRun(run: FlowRun, projectSlug?: string): Promise<void> {
      const summary = `Claude Flow run ${run.run_id} (flow ${run.flow_id}) ${
        run.stop_reason ? `stopped: ${run.stop_reason}` : "started"
      }`;
      await client.emitObservation({
        type: "decision",
        representative_summary: summary.slice(0, 300),
        criticality: "low",
        actor_handle: `flow:run:${run.run_id}`,
        ...(projectSlug ? { project_slug: projectSlug } : {}),
        tags: ["claude-flow", `flow:${run.flow_id}`],
        payload: {
          stop_reason: run.stop_reason,
          started_at: run.started_at,
          user_message_preview: run.user_message?.slice(0, 200),
        },
      });
    },

    formatAsContext,
  };
}

export const suraya = { connect };
