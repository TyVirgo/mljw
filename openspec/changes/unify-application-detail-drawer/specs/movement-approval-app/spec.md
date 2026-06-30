## MODIFIED Requirements

### Requirement: View behavior depends on tab context
The system SHALL open Details in the unified right-side drawer with read-only application content for Submitted and History tabs, and with read-only application content plus a Review action in the drawer footer for the Pending tab.

#### Scenario: Details from Submitted
- **WHEN** user clicks Details on a Submitted row
- **THEN** the system opens the drawer with timeline and read-only application details without a Review action in the footer

#### Scenario: Details from Pending
- **WHEN** user clicks Details on a Pending row
- **THEN** the system opens the drawer with timeline and read-only application sections
- **AND** the drawer footer provides Review to open the approval decision modal

#### Scenario: Details from History with recall
- **WHEN** user clicks Details on a History row where recall is permitted for the current role
- **THEN** the drawer footer provides Close and Recall

#### Scenario: No full-page review navigation
- **WHEN** user opens Details from the movement approval list
- **THEN** the list page remains visible
- **AND** the system does not navigate to a full-page MovementApprovalReviewView

### Requirement: Approval log accessible from unified Details action
The system SHALL provide approval history through the timeline section of the Details drawer instead of a separate Approval Log list action.

#### Scenario: Approval history in drawer
- **WHEN** user opens Details on any movement approval row
- **THEN** the drawer timeline shows stage, actor, action, and timestamp history
- **AND** a separate Approval Log row action is not shown
