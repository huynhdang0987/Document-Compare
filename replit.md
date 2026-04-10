# Workspace

## Overview

pnpm workspace monorepo using TypeScript. DocDiff - a document comparison web app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## App: DocDiff (`artifacts/doc-compare`)

Frontend-only document comparison tool. Key libraries:
- **pdfjs-dist** — PDF text extraction
- **mammoth** — Word (.docx) text extraction
- **diff** — Text diffing engine

Features:
- Upload & compare PDF, Word (.docx), and Text (.txt) files
- Word-level or line-level diff comparison
- Unified view and side-by-side view modes
- Statistics: similarity %, word count, character count, added/removed
- Export comparison report as HTML
- Drag & drop file upload
- Swap documents

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
