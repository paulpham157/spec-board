# Component Interface Contract: Enhanced Contracts Viewer

**Feature**: 008-contracts
**Date**: 2026-01-03
**Type**: React Component Interface

## Overview

Enhanced contracts viewer component that displays spec-kit API and component interface contracts with syntax highlighting, metadata extraction, section navigation, and copy-to-clipboard functionality.

## Component: ContractsViewer

**Location**: `src/components/contracts-viewer.tsx`
**Export**: Named export `ContractsViewer`

### Props Interface

```typescript
interface ContractsViewerProps {
  /**
   * Array of contract files to display.
   * Each file contains the path and raw markdown content.
   */
  contracts: SpecKitFile[];

  /**
   * Optional CSS class name for the container.
   */
  className?: string;
}
```

### Usage Example

```tsx
import { ContractsViewer } from '@/components/contracts-viewer';
import type { SpecKitFile } from '@/types';

function FeatureContracts({ contracts }: { contracts: SpecKitFile[] }) {
  return (
    <ContractsViewer
      contracts={contracts}
      className="mt-4"
    />
  );
}
```

## Internal Components

### ContractFile

Renders a single contract file with expand/collapse, metadata header, and syntax-highlighted content.

```typescript
interface ContractFileProps {
  file: SpecKitFile;
  defaultExpanded?: boolean;
}
```

**Behavior**:
- Displays file name with contract type badge
- Expand/collapse toggle with chevron icon
- When expanded: shows metadata header, section navigation, and highlighted content
- Preserves existing expand/collapse animation

### ContractMetadataHeader

Displays extracted metadata in a structured format.

```typescript
interface ContractMetadataHeaderProps {
  metadata: ContractMetadata;
  contractType: ContractType;
}
```

**Behavior**:
- Shows feature name, date, type as badges/labels
- Shows endpoint or component location prominently
- Gracefully handles missing optional fields

### ContractSectionNav

Mini table of contents for navigating contract sections.

```typescript
interface ContractSectionNavProps {
  sections: ContractSection[];
  onSectionClick: (sectionId: string) => void;
}
```

**Behavior**:
- Renders clickable section links
- Hidden when fewer than 3 sections
- Scrolls to section on click

### CodeBlock

Syntax-highlighted code block with copy functionality.

```typescript
interface CodeBlockProps {
  code: string;
  language: string;
  className?: string;
}
```

**Behavior**:
- Renders code with prism-react-renderer syntax highlighting
- Shows copy button on hover
- Displays "Copied!" confirmation for 2 seconds after copy
- Adapts theme based on light/dark mode

## Utility Functions

### parseContractMetadata

**Location**: `src/lib/markdown/contract-parser.ts`

```typescript
function parseContractMetadata(content: string): ContractMetadata
```

**Input**: Raw markdown content
**Output**: ContractMetadata object with extracted fields

**Extraction Pattern**:
- `**Feature**: value` → metadata.feature
- `**Date**: value` → metadata.date
- `**Type**: value` → metadata.type
- `**Endpoint**: value` → metadata.endpoint
- `**Base Path**: value` → metadata.basePath
- `**Location**: value` → metadata.location

### parseContractSections

**Location**: `src/lib/markdown/contract-parser.ts`

```typescript
function parseContractSections(content: string): ContractSection[]
```

**Input**: Raw markdown content
**Output**: Array of sections with id, title, and level

**Logic**:
1. Find all H2 (`##`) and H3 (`###`) headings
2. Generate slug ID from heading text
3. Return ordered array of sections

### inferContractType

**Location**: `src/lib/markdown/contract-parser.ts`

```typescript
function inferContractType(metadata: ContractMetadata): ContractType
```

**Input**: ContractMetadata object
**Output**: 'api' | 'component' | 'unknown'

**Logic**:
1. If endpoint or basePath present → 'api'
2. If location present or type contains "Component" → 'component'
3. Otherwise → 'unknown'

### copyToClipboard

**Location**: `src/lib/utils.ts`

```typescript
async function copyToClipboard(text: string): Promise<boolean>
```

**Input**: Text to copy
**Output**: Success boolean

**Logic**:
1. Try `navigator.clipboard.writeText()`
2. Fallback to textarea + execCommand for older browsers
3. Return success/failure

## Accessibility Contract

The component MUST provide:

1. **Copy Button**: `aria-label="Copy code to clipboard"` or `aria-label="Copied to clipboard"` based on state
2. **Copy Confirmation**: `aria-live="polite"` region for "Copied!" announcement
3. **Section Navigation**: Proper heading hierarchy maintained
4. **Keyboard Navigation**: Copy button focusable, activatable via Enter/Space
5. **Expand/Collapse**: `aria-expanded` attribute on toggle button

## Styling Contract

The component uses:
- Tailwind CSS classes
- CSS variables for theming: `--foreground`, `--border`, `--card`, `--secondary`, `--muted-foreground`
- prism-react-renderer themes: `themes.vsLight` (light mode), `themes.vsDark` (dark mode)
- `cn()` utility for conditional class merging
- Lucide React icons: `FileCode`, `ChevronDown`, `ChevronRight`, `Copy`, `Check`

## Theme Integration

```typescript
// Theme detection pattern
const isDarkMode = document.documentElement.classList.contains('dark');
const theme = isDarkMode ? themes.vsDark : themes.vsLight;
```

Or via React context if available:
```typescript
const { theme } = useTheme();
const prismTheme = theme === 'dark' ? themes.vsDark : themes.vsLight;
```
