# Local compression and cloud assistance

Native/service release 0.6.3 adds **AI Settings → Local memory compression → TurboQuant K8/V4 (experimental)**. Choose **Save settings**. Standard cache remains the default. This changes attention-cache storage, not model weights, model identity or the 2,048-token context ceiling. No extra Python installation or model download is required.

The model already uses 4-bit affine weights. The new cache uses 8-bit keys and 4-bit values, Hadamard rotation, Lloyd–Max codebooks and 64-element scaling groups. This is the community TurboQuant-MLX rotation/codebook implementation, **not a claim of implementing Google's complete QJL correction or reproducing its benchmark results**. Attention still uses transient reconstructed FP16 tensors. Persistent cache savings do not guarantee a lower total peak or faster inference.

The vendored cache-only subset is pinned to [manjunathshiva/turboquant-mlx commit a6945a0](https://github.com/manjunathshiva/turboquant-mlx/tree/a6945a0481b77bf14d0913a2e5bc44813e9deaeb). Apache-2.0 license, retained MIT license, NOTICE, per-file hashes and provenance are included under `local/vendor/turboquant_mlx`. The adapter checks source hashes before import. Onboard replaces the upstream N-by-boundaries scalar comparison with MLX binary search, tested to preserve bin assignments including exact boundaries and NaNs. This avoids the large temporary comparison array for 8-bit keys. No upstream server, model conversion, automatic downloads or fused attention patch is enabled. [Google's research description](https://research.google/blog/turboquant-redefining-ai-efficiency-with-extreme-compression/) explains the underlying compression work.

## Sharing the work

Onboard gathers approved content locally. The configured cloud provider can analyze it and propose the next step; the endpoint executes supported, reviewed tools. Tool results return for another planning step. A recoverable failure in the optional local extraction tool is returned to the planner instead of terminating the whole task. Integrity and cleanup failures still stop processing.

Outlook and Teams can now hand bounded retrieved evidence to the configured provider after a clean local resource abort, including a memory-pressure stop. This needs **Enable cloud processing of public input**, **Allow cloud analysis of permitted add-in content**, a configured provider, and the request's cloud permission. Purview checks, organization restrictions, account identity, cancellation, daily request budget and source-reference validation apply. The result discloses that local model analysis did not complete. At most five retrieved sources are eligible and the provider input limit applies. Omissions remain visible; this is not exhaustive mailbox analysis.

Word document workflows already support cloud processing when permitted. The hybrid planner already supports reviewed file/source retrieval and file creation. This release does not add arbitrary remote storage, hidden uploads or remote RAM. Ordinary GenAI APIs accept requests; they cannot hold live MLX tensors as shared local memory. Provider-side retention and government authorization depend on the approved service contract. GenAI.mil compatibility and customer authorization are still unverified.

## Other memory controls

Existing stable swap no longer prevents a request by itself. The product policy revision still stops for new swap growth/activity, warning/critical/unknown pressure, insufficient reserve, thermal limits, process limits and lifecycle failures. Historical calibration files are unchanged.

Relevant-passage selection reduces model context while preserving exact source spans and disclosing omissions. ZIP/Zstandard are suitable for stored files or transfers, but are not a substitute for inference memory because data normally needs decompression for computation. Larger workloads should use authorized cloud processing rather than silently increasing context or disabling guards.

## Validation

`tools/benchmark_cache.py` compares the real retained Qwen3 model on explicit public control inputs, offline, one mode at a time, under the normal supervisor. It does not change saved settings or contact an AI endpoint. `evidence/turboquant-model-comparison.json` on the development checkout holds the measured results. Small numerical tests and a few successful prompts are not comprehensive model-quality qualification, a government approval, or customer Office acceptance.

### Measured on the development Mac, September 28, 2026

Three public control prompts were run once per mode with the real retained Qwen3 model and existing stable swap. All six runs generated answers and confirmed cleanup. These are individual measurements, not statistical averages.

| Case / cache | Persistent KV MiB | Peak MLX MiB | Last sampled process footprint MiB | Generation seconds |
|---|---:|---:|---:|---:|
| summary / standard | 28.0 | 1078.9 | 1285.4 | 0.348 |
| summary / turboquant-k8v4 | 10.9 | 975.7 | 1312.0 | 0.385 |
| extraction / standard | 28.0 | 1097.8 | 1284.5 | 0.242 |
| extraction / turboquant-k8v4 | 10.9 | 981.4 | 1309.4 | 0.325 |
| medium-summary / standard | 84.0 | 1213.4 | 1343.1 | 1.112 |
| medium-summary / turboquant-k8v4 | 32.8 | 1095.9 | 2020.9 | 2.056 |

The compressed persistent KV buffers were 60.9% smaller. For the medium control (585 prompt tokens), peak MLX allocation fell about 9.7%, but generation took about 1.85x as long and the last sampled process footprint was substantially higher. This adapter is therefore **not established as a whole-process memory-pressure remedy** and remains opt-in. MLX allocation and process footprint measure different things; neither is whole-system free RAM.

Short summary and extraction outputs matched standard mode exactly. The medium summary preserved the Tuesday negation but omitted the Monday qualifier; outputs were not identical and still require review. No claims of full quality equivalence, longer context, sustained stability or government suitability are made. Cloud handoff controls were tested with isolated transport fixtures; no customer content was sent to an external AI for these checks.
