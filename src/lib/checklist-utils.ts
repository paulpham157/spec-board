/**
 * Checklist utilities for toggling checkbox items in markdown files.
 * Server-side only - uses Node.js fs module.
 */

// Regex pattern for matching markdown checkbox lines
// Matches: - [ ] text, - [x] text, - [X] text
// Captures: (1) checkbox state character, (2) rest of line
const CHECKBOX_PATTERN = /^(\s*-\s*\[)([ xX])(\]\s*.*)$/;

/**
 * Checks if a line is a valid markdown checkbox line.
 *
 * @param line - The line to check
 * @returns True if the line contains a valid checkbox pattern
 */
export function isValidCheckboxLine(line: string): boolean {
  return CHECKBOX_PATTERN.test(line);
}

/**
 * Gets the current checked state of a checkbox line.
 *
 * @param line - The line to check
 * @returns True if checked, false if unchecked, null if not a valid checkbox
 */
export function getCheckboxState(line: string): boolean | null {
  const match = line.match(CHECKBOX_PATTERN);
  if (!match) {
    return null;
  }
  // match[2] is the checkbox state character: ' ' for unchecked, 'x' or 'X' for checked
  return match[2].toLowerCase() === 'x';
}

/**
 * Toggles a checkbox line between checked and unchecked states.
 *
 * @param line - The line to toggle
 * @returns The toggled line, or the original line if not a valid checkbox
 */
export function toggleCheckboxLine(line: string): string {
  const match = line.match(CHECKBOX_PATTERN);
  if (!match) {
    return line;
  }

  const [, prefix, state, suffix] = match;
  const newState = state.toLowerCase() === 'x' ? ' ' : 'x';
  return `${prefix}${newState}${suffix}`;
}

/**
 * Toggles a checkbox at a specific line index in file content.
 *
 * @param content - The full file content
 * @param lineIndex - The 0-based line index to toggle
 * @returns Object with success status, new content, and new state
 */
export function toggleCheckboxInContent(
  content: string,
  lineIndex: number
): { success: boolean; content: string; newState: boolean | null; error?: string } {
  const lines = content.split('\n');

  // Validate line index
  if (lineIndex < 0 || lineIndex >= lines.length) {
    return {
      success: false,
      content,
      newState: null,
      error: `Line index ${lineIndex} is out of bounds (0-${lines.length - 1})`,
    };
  }

  const line = lines[lineIndex];

  // Validate it's a checkbox line
  if (!isValidCheckboxLine(line)) {
    return {
      success: false,
      content,
      newState: null,
      error: `Line ${lineIndex} is not a valid checkbox line`,
    };
  }

  // Toggle the line
  lines[lineIndex] = toggleCheckboxLine(line);
  const newState = getCheckboxState(lines[lineIndex]);

  return {
    success: true,
    content: lines.join('\n'),
    newState,
  };
}
