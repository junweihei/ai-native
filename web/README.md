# AI Native Learning OS web skeleton

This directory contains the minimal V1 engineering skeleton approved by the technical ADR. It intentionally implements no learning business page and performs no Markdown write-back.

## Included boundaries

- `src/`: responsive application shell, seven placeholder routes, design-token entry, render error boundary, and HTTP data adapter.
- `server/`: loopback-only local service with health and data-source-description endpoints.
- `shared/`: the technology-neutral data-access interface used by both sides.
- `tests/fixtures/`: replaceable test-only adapter metadata. It is not an authoritative or parallel learning dataset.
- `prototypes/`: frozen historical visual reference; it is not production application code.
- `public/data/`: generated output owned by the existing content tooling, not by the application shell.

The application must obtain learning data from the generated-index boundary when that adapter is implemented. It must not import Markdown files, hard-code content paths, infer learning status, or write source files directly.

## Routes

| Route                | Purpose in this skeleton                   |
| -------------------- | ------------------------------------------ |
| `/today`             | Today primary-entry placeholder            |
| `/roadmap`           | Roadmap primary-entry placeholder          |
| `/knowledge`         | Knowledge Map primary-entry placeholder    |
| `/archive`           | Learning Archive primary-entry placeholder |
| `/review`            | Review primary-entry placeholder           |
| `/tasks/:taskId`     | Task Workspace contextual placeholder      |
| `/knowledge/:nodeId` | Knowledge Node contextual placeholder      |

See [`../docs/development.md`](../docs/development.md) for setup, verification, and boundary rules.
