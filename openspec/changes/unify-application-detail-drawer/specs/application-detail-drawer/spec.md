## ADDED Requirements

### Requirement: Application detail opens in a right-side drawer
The system SHALL open application details from list row actions in a drawer panel that slides in from the right edge of the viewport, keeping the underlying list page visible.

#### Scenario: Drawer opens from list
- **WHEN** user clicks the unified Details action on a list row
- **THEN** the system opens a right-side drawer overlay
- **AND** the list page remains mounted and visible behind the overlay

#### Scenario: Drawer closes
- **WHEN** user clicks Close in the drawer footer or the header close control
- **OR** user clicks the overlay backdrop
- **THEN** the drawer closes and returns focus to the list

### Requirement: Drawer layout separates fixed chrome from scrollable content
The drawer SHALL use a fixed header, a fixed footer, and a single scrollable content region between them.

#### Scenario: Scroll behavior
- **WHEN** drawer content exceeds viewport height
- **THEN** only the middle content region scrolls vertically
- **AND** the header and footer remain visible and fixed

### Requirement: Drawer content orders approval timeline above application details
The scrollable content region SHALL display the approval/workflow timeline in the upper section and read-only application detail fields in the lower section, separated by a visual divider.

#### Scenario: Timeline above details
- **WHEN** user opens Details for any in-scope application
- **THEN** the approval timeline appears above the application detail fields within the same scroll area

### Requirement: Approval timeline uses vertical step visualization
The system SHALL render approval and workflow history as a vertical timeline with stage label, actor name, status badge, and timestamp per node, aligned to the product reference (Submitted / Pending / Approved style badges).

#### Scenario: Completed node
- **WHEN** an approval log entry exists for a workflow stage with action Submitted or Approved
- **THEN** the timeline node shows a completed indicator and the corresponding status badge

#### Scenario: Current pending node
- **WHEN** the application is In Progress and a workflow stage matches the current approval stage without a terminal action
- **THEN** the timeline node shows a pending indicator and a Pending status badge

#### Scenario: Future nodes
- **WHEN** the workflow defines stages not yet reached
- **THEN** the timeline shows upcoming nodes without completion timestamps

#### Scenario: Empty log on draft
- **WHEN** an application has no approval log entries and status is Draft or Temporary saved
- **THEN** the timeline section shows an empty state or applicant-only node as applicable

### Requirement: Unified Details action replaces separate view and log actions
On every in-scope list page that previously exposed separate detail/view and approval/workflow log actions, the system SHALL expose a single Details action that opens the combined drawer.

#### Scenario: No separate log action
- **WHEN** user views the Actions column on an in-scope list row
- **THEN** separate Approval Log or Workflow Log link actions are not shown
- **AND** a single Details action opens both timeline and detail content

#### Scenario: Other row actions unchanged
- **WHEN** a list row previously exposed Edit, Delete, Cancel, Submit, Withdraw, or Export actions
- **THEN** those actions remain in the list Actions column and are not moved into the drawer footer

### Requirement: Drawer footer exposes context-specific primary actions
The drawer footer SHALL provide Close for all contexts and additional primary actions based on page mode.

#### Scenario: Read-only query context
- **WHEN** user opens Details from movement query or maintenance list
- **THEN** the drawer footer shows Close only

#### Scenario: Movement approval pending context
- **WHEN** user opens Details from the movement approval Pending tab
- **THEN** the drawer footer shows Close and Review
- **AND** Review opens the existing approval decision modal

#### Scenario: Movement approval history recall
- **WHEN** user opens Details from the movement approval History tab and recall is allowed for the current role
- **THEN** the drawer footer shows Close and Recall

#### Scenario: Student application list
- **WHEN** student opens Details from deferment, programme transfer, resumption, or withdrawal list
- **THEN** the drawer footer shows Close only
- **AND** Edit, Delete, and Cancel remain on the list row

### Requirement: Sensitive field masking in query drawer
The system SHALL apply the same sensitive-field masking rules in the drawer detail section as previously applied in movement query read-only review.

#### Scenario: Masked passport in query drawer
- **WHEN** user opens Details from movement query
- **THEN** passport or IC fields in the detail section are masked consistent with the prior review view behavior
