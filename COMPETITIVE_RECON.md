# Evolution Rig — Comparative Recon / Applied Transfer

Date: 2026-11-09. Mode: bounded research across documented mechanisms, not dependency acquisition or imitation of unrelated branded experiences.

## Verdict: ADAPT + VALIDATE

Evolution Rig already used the strongest structural pattern: language models **propose**, independent code **evaluates**. The meaningful gaps were not missing futuristic graphics; they were a fragile score surface, redundant recomputation, finite lineage/history, and no direct receipt of what changed between parent and child.

| Analogue / source | Mechanism and evidence | Transfer decision | Actual action |
|---|---|---|---|
| **AlphaEvolve**, Google DeepMind (May 2025) — https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/ | Generates candidates but uses automated evaluators to verify algorithmic results, then evolves the promising candidates. Evidence: first-party description. | **Validate** the separation of generator and scorer, but **do not claim** our text rubric is a real-world executable ground truth. | Retained independent code jury. Added anti-repetition negative control and explicit interpretive limits. |
| **EvoPrompt**, ICLR 2024 / Microsoft repository — https://proceedings.iclr.cc/paper_files/paper/2024/hash/9156b0f6dfa9bbd18c79cc459ef5d61c-Abstract-Conference.html and https://github.com/microsoft/EvoPrompt | Mutation/crossover of natural-language prompts, with separately evaluated survivor selection. Evidence: peer-reviewed paper abstract and repository design. | **Adapt** operator transparency; **experiment**, not automatically replace, selection logic. | Retained 1-/2-parent lineage, explicit selection, archive rather than deleting genealogy; added parent/child delta receipt. More complex selection algorithms deferred pending actual idea-quality evidence. |
| **Promptfoo** assertions — https://www.promptfoo.dev/docs/configuration/test-cases/ | Fixed test cases/assertions, including checks independent of an LLM's self-evaluation. Evidence: maintained documentation. | **Adopt** small property tests without installing the library (zero-dependency constraint). | Added padding-negative control, duplicate suppression checks and new regression fixtures using Node's built-in runner. |
| **Ollama structured outputs** — https://github.com/ollama/ollama/blob/main/docs/capabilities/structured-outputs.mdx | Native JSON-schema format parameter for local chat responses. Evidence: first-party documentation. | **Adopt** for the Ollama connector only; other gateway JSON-schema support varies. | Sends a count-bounded idea JSON schema to Ollama while retaining local parser validation. Mocked request contract tested; live Ollama acceptance not verified here. |
| **LangGraph checkpoints** — https://github.com/langchain-ai/docs/blob/main/src/oss/langgraph/checkpointers.mdx | Human intervention and replay/time-travel depend on persisted checkpoints. Evidence: first-party documentation. | **Adapt** the durability principle, **avoid** framework dependency. | Removed silent per-idea receipt truncation, preserved archive lineage and source/export history. Actual OS-level background scheduling still out of scope. |

## Counterevidence and non-adoptions

- AlphaEvolve's strong results depend on **objective, executable evaluators**. Evolution Rig's score is only a deterministic text-quality heuristic. This is a fundamental domain mismatch: a 15/15 idea may still be wrong, impractical or already invented.
- EvoPrompt operates on prompts with benchmark datasets; its breeding algorithms do not prove that adopting roulette or differential evolution will improve human project ideas. No algorithm change without a representative outcome dataset.
- Promptfoo, LangGraph and other frameworks would add runtime/installation weight without solving the highest-priority local-first problems. The underlying properties were implemented using built-in JavaScript and Node tests.
- Native Ollama schema support is provider-specific; automatic retries against an API could waste tokens. One request per explicit action remains the default, with visible failures rather than silent token-consuming retries.

## Missing opportunity that survived scrutiny

A lineage graph normally says **who begat whom**. It did not say **what changed or whether the child became stronger**. Evolution Lens was added as a small, inspectable score/field/lexical delta panel. This is more useful than a decorative new graph renderer. It is explicit about being word-level evidence, not semantic originality.

## Future experiment (not implemented)

**Empirical jury calibration**: collect 30–50 genuine ideas with blinded expert/user labels, including obvious near-duplicates, infeasible fantasies, practical-but-unoriginal proposals, concise strong concepts and verbosity attacks. Compare the structural rubric to real outcomes. Replace weight choices only if paired evidence proves a gain without crowding gold. Stop if disagreement cannot be explained consistently. This is the only defensible path from an inspectable score to a trusted ranking.

## External evidence status

The cited sources establish design mechanisms and documented capabilities. They do not establish compatibility of Evolution Rig with live vendor endpoints, comparative performance on user hardware, or verified real-world idea quality. Our added safeguards and performance numbers are independently tested in the local project, not borrowed benchmarks.
