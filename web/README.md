# AI Native Learning OS web application

This directory contains the V1 local-first website approved by the technical ADR. It implements Today, Task Workspace, Roadmap, Knowledge, Archive, Review, controlled-material access, local draft recovery, and a confirmation-gated Markdown write-back boundary.

## Included boundaries

- `src/`: responsive application shell, business pages, design-token entry, render error boundary, and HTTP data adapter.
- `server/`: loopback-only local service with health and data-source-description endpoints.
- `shared/`: the technology-neutral data-access interface used by both sides.
- `tests/fixtures/`: replaceable test-only adapter metadata. It is not an authoritative or parallel learning dataset.
- `prototypes/`: frozen historical visual reference; it is not production application code.
- `public/data/`: generated output owned by the existing content tooling, not by the application shell.

The application obtains learning data from the generated-index boundary. It does not import Markdown files, hard-code content paths, infer learning status, or write source files directly.

## Routes

| Route                | Purpose in this skeleton                                         |
| -------------------- | ---------------------------------------------------------------- |
| `/today`             | Current authority-projected task and resume context              |
| `/roadmap`           | Six-month → month → week → task authority-projected roadmap      |
| `/knowledge`         | Six layers, three flows, safeguards, and knowledge-node map      |
| `/archive`           | Same-source artifact, evidence, timeline, and archive projection |
| `/review`            | Session close, daily/weekly/monthly review, and resume drafts    |
| `/tasks/:taskId`     | Current-task workspace with local draft and safe-write preview   |
| `/knowledge/:nodeId` | Authority-backed four-question node details and trace links      |
| `/archive/:recordId` | Safe metadata-only artifact/evidence relation detail             |

See [`../docs/development.md`](../docs/development.md) for setup, verification, and boundary rules.
