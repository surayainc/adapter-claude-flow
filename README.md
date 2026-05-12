# @surayaorg/adapter-claude-flow

Adapter for [Claude Flow](https://github.com/ruvnet/claude-flow) — the community-built orchestration framework on top of Claude Code. MIT-licensed.

G4 (v1.3 §6.4, scaffolded in v1.4 per audit-fix-pass Decision F). Same pattern as `@surayaorg/adapter-claude-swarm` and `@surayaorg/adapter-anthropic-agent-teams`; the wire surface differs because Claude Flow hooks at the run/step layer rather than the agent-turn layer.

> **Scaffold status.** This is a v1.4 minimum-viable scaffold (~200 LOC). The Claude Flow upstream SDK is not yet pinned, so the `FlowRun` / `FlowStep` / `AgentInvocation` types in `src/types.ts` are duck-typed placeholders that reflect the expected concepts from Claude Flow's public docs. Real type alignment + lifecycle-hook wiring land in v1.5 once there is user demand and the upstream SDK stabilizes.
>
> **Sandbox note.** Repo home is `surayainc/adapter-claude-flow`. Publish to npm as `@surayaorg/adapter-claude-flow` once the npm org work (OQ-15) lands.

## Quick start

```typescript
import { suraya } from "@surayaorg/adapter-claude-flow";

const brain = suraya.connect({
  projectSlug: "my-project",
  hmacSecret: process.env.SURAYA_BRAIN_WEBHOOK_SECRET_MY_PROJECT,
});

// Inside a Claude Flow run/step lifecycle:
flow.beforeStep = async (step, agent) => {
  const memories = await brain.retrieveForAgent(agent);
  agent.systemPrompt = (agent.systemPrompt ?? "") + "\n\n" + brain.formatAsContext(memories);
};

flow.afterStep = async (step) => {
  await brain.emitFromStep(step, "my-project");
};

flow.afterRun = async (run) => {
  await brain.emitFromRun(run, "my-project");
};
```

## API

Same shape as the sister adapters (retrieve / emit / formatAsContext), plus flow-specific helpers:

- `suraya.connect(options)` — returns a `SurayaBrainProxy`
- `retrieve(q, topK?)` — generic top-k retrieval
- `retrieveForAgent(agent, topK?)` — uses the agent's last user message as the query
- `emit(observation)` — direct emission via the brain SDK
- `emitFromStep(step, projectSlug?)` — auto-derives a `decision` observation from a flow step's stop_reason + content
- `emitFromRun(run, projectSlug?)` — auto-derives a `decision` observation from a flow run's start / stop
- `formatAsContext(results)` — formats retrieve results into a system-prompt-friendly string

## Install

```bash
npm install @surayaorg/adapter-claude-flow @surayaorg/brain-sdk
```

`@surayaorg/brain-sdk` is a peer dependency.

## Build / test locally

```bash
npm install
npm run typecheck   # tsc --noEmit
npm run build       # tsc → dist/
npm test            # vitest run (smoke test only)
```

## Status (2026-05-12)

- [x] Scaffold (package.json + tsconfig + LICENSE + README)
- [x] `src/index.ts` / `src/connect.ts` / `src/types.ts` (duck-typed)
- [x] Compile-clean smoke test
- [ ] Real Claude Flow SDK integration (v1.5 — gated on user demand + upstream SDK stability)
- [ ] CI / branch protection / conformance (Tier-0 follow-up; see `surayainc/suraya` thread tracking)
- [ ] npm publish (gated on OQ-15 npm org + automation token)

## License

MIT — see [LICENSE](./LICENSE).
