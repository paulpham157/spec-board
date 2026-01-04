# Data Model: Enhanced Contracts Viewer

**Feature**: 008-contracts
**Date**: 2026-01-03

## Entities

### ContractMetadata

Extracted metadata from the contract markdown header.

| Property | Type | Description |
|----------|------|-------------|
| feature | string \| undefined | Feature name (e.g., "001-kanban-board") |
| date | string \| undefined | Date string (e.g., "2026-01-03") |
| type | string \| undefined | Contract type (e.g., "React Component Interface", "REST API") |
| endpoint | string \| undefined | API endpoint path (e.g., "GET /api/watch") |
| basePath | string \| undefined | Base path for API (e.g., "/api/analysis") |
| location | string \| undefined | Component location (e.g., "src/components/kanban-board.tsx") |

### ContractSection

A section within a contract document.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Anchor ID generated from heading (e.g., "overview", "request") |
| title | string | Section heading text |
| level | number | Heading level (2 for H2, 3 for H3) |

### CodeBlock

A fenced code block within a contract.

| Property | Type | Description |
|----------|------|-------------|
| language | string | Language identifier (e.g., "typescript", "tsx", "json") |
| code | string | Raw code content |
| lineCount | number | Number of lines in the code block |

### ParsedContract

Fully parsed contract with metadata, sections, and code blocks.

| Property | Type | Description |
|----------|------|-------------|
| rawContent | string | Original markdown content |
| metadata | ContractMetadata | Extracted metadata |
| sections | ContractSection[] | List of sections for navigation |
| codeBlocks | CodeBlock[] | List of code blocks for highlighting |
| title | string \| undefined | Contract title from H1 heading |

## Enums

### ContractType

Inferred contract type based on metadata.

| Value | Description |
|-------|-------------|
| api | REST API contract (has endpoint or basePath) |
| component | React component interface (has location or type contains "Component") |
| unknown | Cannot determine type |

## Validation Rules

### ContractMetadata

| Field | Rules |
|-------|-------|
| feature | Optional; if present, should match pattern `\d{3}-[a-z-]+` |
| date | Optional; if present, should be valid date string |
| type | Optional; free-form string |
| endpoint | Optional; if present, should start with HTTP method or `/` |
| basePath | Optional; if present, should start with `/` |

### CodeBlock

| Field | Rules |
|-------|-------|
| language | Required; defaults to "text" if not specified in fence |
| code | Required; may be empty string |
| lineCount | Computed; minimum 0 |

## State Transitions

### Copy Button State

```
idle → copying → copied → idle
```

| State | Condition | Transitions To |
|-------|-----------|----------------|
| idle | Default state | copying (on click) |
| copying | Clipboard API called | copied (on success), idle (on error) |
| copied | Copy successful | idle (after 2s timeout) |

## Storage Schema

This feature does not introduce new persistent storage. All data is derived from:

1. **Filesystem**: Contract markdown files in `specs/*/contracts/` directories
2. **Runtime State**: Parsed contract data, copy button state

### Existing Data Flow

```
Filesystem (contracts/*.md)
    ↓
Parser (src/lib/parser.ts)
    ↓
SpecKitFile[] with type='contract'
    ↓
ContractsViewer component
    ↓
NEW: contract-parser.ts extracts metadata/sections
    ↓
Enhanced UI with syntax highlighting
```

## Type Definitions

```typescript
// Add to src/types/index.ts

export interface ContractMetadata {
  feature?: string;
  date?: string;
  type?: string;
  endpoint?: string;
  basePath?: string;
  location?: string;
}

export interface ContractSection {
  id: string;
  title: string;
  level: number;
}

export interface CodeBlock {
  language: string;
  code: string;
  lineCount: number;
}

export interface ParsedContract {
  rawContent: string;
  metadata: ContractMetadata;
  sections: ContractSection[];
  codeBlocks: CodeBlock[];
  title?: string;
}

export type ContractType = 'api' | 'component' | 'unknown';
```
