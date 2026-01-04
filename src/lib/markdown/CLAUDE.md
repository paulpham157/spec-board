# Markdown Directory

## Purpose
AST-based markdown parsing utilities for structured document extraction.

## Overview
This directory provides a cleaner, more maintainable approach to parsing structured markdown files using the unified/remark ecosystem. It includes specialized parsers for different spec-kit document types (plan, research, quickstart, data-model) and shared AST utilities for common extraction patterns.

## Key Files

| File | Purpose |
|------|---------|
| `index.ts` | Main exports - re-exports all parsers and utilities |
| `ast-utils.ts` | Core AST utilities for section, list, table, code block extraction |
| `plan-parser.ts` | Parser for plan.md files (metadata, tech context, quality gates) |
| `research-parser.ts` | Parser for research.md files (technology decisions, alternatives) |
| `quickstart-parser.ts` | Parser for quickstart.md files (setup steps, verification, key files) |
| `data-model-parser.ts` | Parser for data-model.md files (entities, enums, validation rules) |

## Test Files

| File | Tests |
|------|-------|
| `ast-utils.test.ts` | 21 tests for core AST utilities |
| `plan-parser.test.ts` | 19 tests for plan parsing |
| `research-parser.test.ts` | 14 tests for research parsing |
| `quickstart-parser.test.ts` | 22 tests for quickstart parsing |
| `data-model-parser.test.ts` | 29 tests for data model parsing |

## Patterns & Conventions

- **AST-based parsing**: Uses remark to parse markdown into AST, then extracts structured data
- **Section-based extraction**: Documents are parsed by finding H2/H3 sections and extracting content
- **Type-safe returns**: All parsers return strongly-typed `Parsed*` interfaces from `@/types`
- **Graceful fallbacks**: Missing sections return empty arrays/objects, not errors
- **Test-driven**: Each parser has comprehensive test coverage

## Core AST Utilities (ast-utils.ts)

| Function | Purpose |
|----------|---------|
| `parseMarkdown(content)` | Parse markdown string to AST Root node |
| `extractSections(root)` | Extract all H2 sections with their content |
| `findSection(root, title)` | Find a specific section by title (case-insensitive) |
| `findSections(root, titles)` | Find sections matching any of the given titles |
| `getSubsections(section)` | Get H3 subsections within a section |
| `extractCodeBlocks(section)` | Extract code blocks from a section |
| `extractAllCodeBlocks(root)` | Extract all code blocks from document |
| `extractListItems(section)` | Extract list items with checkbox state |
| `extractSimpleList(section)` | Extract simple string list items |
| `extractTables(section)` | Extract tables as array of row objects |
| `extractText(node)` | Convert AST node to plain text |
| `extractIntroText(section)` | Get intro paragraph before first heading |
| `extractMetadata(root)` | Extract key-value metadata from document start |
| `extractMetadataValue(root, key)` | Extract single metadata value |

## Dependencies

- **Internal**: `@/types` for parsed document interfaces
- **External**: `unified`, `remark-parse`, `remark-gfm`, `mdast-util-to-string`, `unist-util-visit`

## Common Tasks

- **Add new parser**: Create `{type}-parser.ts`, export from `index.ts`, add tests
- **Add extraction utility**: Add to `ast-utils.ts`, export from `index.ts`
- **Parse new section type**: Use `findSection()` + appropriate extraction utility

## Important Notes

- All parsers are server-side only (used by API routes)
- The `parseMarkdown()` function enables GFM (GitHub Flavored Markdown) for tables
- Section titles are matched case-insensitively
- Code blocks preserve language metadata for syntax highlighting
- Tables are returned as arrays of objects with header keys
