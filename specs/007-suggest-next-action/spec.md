# Feature Specification: Suggest Next Action

**Feature Branch**: `007-suggest-next-action`
**Created**: 2026-01-03
**Status**: Draft
**Input**: User description: "feature 007 suggest next action"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Suggested Next Action for a Feature (Priority: P1)

A user viewing a feature in the spec-board wants to know what they should do next to move the feature forward. The system analyzes the current state of the feature (spec completeness, plan status, implementation progress) and displays a clear, actionable suggestion for the next step.

**Why this priority**: This is the core value proposition - users need guidance on what to do next without having to manually assess the feature's state. Reduces decision fatigue and keeps work flowing.

**Independent Test**: Can be fully tested by viewing any feature card and verifying that an appropriate next action suggestion appears based on the feature's current state.

**Acceptance Scenarios**:

1. **Given** a feature with only a draft spec, **When** the user views the feature, **Then** the system suggests "Complete specification" or "Run /speckit.clarify" as the next action
2. **Given** a feature with a complete spec but no plan, **When** the user views the feature, **Then** the system suggests "Create implementation plan" or "Run /speckit.plan" as the next action
3. **Given** a feature with a plan but no implementation started, **When** the user views the feature, **Then** the system suggests "Start implementation" as the next action
4. **Given** a feature that is fully implemented, **When** the user views the feature, **Then** the system suggests "Review and close" or "Mark as complete" as the next action

---

### User Story 2 - Understand Why an Action is Suggested (Priority: P2)

A user wants to understand the reasoning behind the suggested next action so they can make an informed decision about whether to follow it or take a different path.

**Why this priority**: Transparency builds trust. Users are more likely to follow suggestions when they understand the logic, and can override when they have context the system doesn't.

**Independent Test**: Can be tested by viewing any suggested action and verifying that a brief explanation accompanies the suggestion.

**Acceptance Scenarios**:

1. **Given** a suggested next action is displayed, **When** the user views the suggestion, **Then** a brief explanation of why this action is recommended is visible
2. **Given** a feature is missing required spec sections, **When** the system suggests completing the spec, **Then** the explanation mentions which sections are incomplete

---

### User Story 3 - Take Action Directly from Suggestion (Priority: P3)

A user wants to act on the suggestion immediately without having to navigate elsewhere or remember command syntax.

**Why this priority**: Reduces friction between seeing a suggestion and acting on it. Improves workflow efficiency.

**Independent Test**: Can be tested by clicking/activating a suggested action and verifying the appropriate action is initiated.

**Acceptance Scenarios**:

1. **Given** a next action suggestion is displayed, **When** the user activates the suggestion, **Then** the corresponding action is initiated (e.g., command is copied, navigation occurs, or action starts)
2. **Given** the suggested action requires a command, **When** the user activates the suggestion, **Then** the command is made easily accessible (copied to clipboard or displayed prominently)

---

### Edge Cases

- What happens when a feature has no clear next action (e.g., blocked by external dependency)?
  - System displays "Blocked" or "Waiting" status with explanation
- What happens when multiple valid next actions exist?
  - System suggests the most impactful action based on workflow progression, with option to see alternatives
- What happens when the feature state cannot be determined (missing files, corrupted data)?
  - System displays "Unable to determine status" with suggestion to verify feature files
- What happens when a feature is in an unexpected state (e.g., has implementation but no spec)?
  - System suggests corrective action (e.g., "Create retroactive specification")

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST analyze feature state based on available artifacts (spec file, plan file, implementation status, checklist completion)
- **FR-002**: System MUST display exactly one primary suggested next action per feature
- **FR-003**: System MUST provide a brief explanation (1-2 sentences) for why the action is suggested
- **FR-004**: System MUST update the suggested action when feature state changes
- **FR-005**: System MUST handle edge cases gracefully (blocked features, unknown states, missing data)
- **FR-006**: System MUST map feature states to appropriate next actions following the spec-board workflow:
  - Draft spec → Complete/clarify specification
  - Complete spec, no plan → Create plan
  - Has plan, not started → Start implementation
  - In progress → Continue implementation
  - Implementation complete → Review and close
  - Blocked → Display blocked status with reason
- **FR-007**: Users MUST be able to see the suggested action without additional clicks or navigation
- **FR-008**: System MUST provide a way for users to act on the suggestion (copy command, navigate, or initiate action)

### Key Entities

- **Feature State**: Represents the current status of a feature (draft, specified, planned, in-progress, complete, blocked)
- **Next Action**: A suggested action with a label, explanation, and optional command or action trigger
- **Workflow Stage**: The defined stages in the spec-board workflow that determine valid transitions

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the next action for any feature within 3 seconds of viewing it
- **SC-002**: Suggested actions are accurate (match the actual feature state) in 95% of cases
- **SC-003**: Users who follow suggested actions complete features 30% faster than those who don't use the feature
- **SC-004**: 80% of users find the suggestions helpful (based on user feedback or usage patterns)
- **SC-005**: System handles all defined edge cases without errors or confusing displays

## Assumptions

- The spec-board follows a linear workflow: Specify → Plan → Implement → Review → Complete
- Feature state can be reliably determined from file presence and content analysis
- Users are familiar with the /speckit commands referenced in suggestions
- The UI has space to display a suggestion (1-2 lines) near each feature card or in the feature detail view
