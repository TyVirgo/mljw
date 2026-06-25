## MODIFIED Requirements

### Requirement: Unified approval table shows common columns only
The system SHALL display a single paginated table for all four movement types. Common columns on all tabs SHALL be: Status, Approval Stage, Student ID, Student Name, Application Session, Effective Session, Movement Category, and Application Date. The Implemented column SHALL appear only on the History tab and SHALL display Y or N. Movement Reason SHALL NOT appear as a table column.

#### Scenario: Movement category column
- **WHEN** a row represents programme transfer, deferment, resumption, or withdrawal
- **THEN** the Movement Category column displays the localized movement type label

#### Scenario: Type-specific fields not in table
- **WHEN** user views the approval list
- **THEN** type-specific application fields (including movement reason) are not shown as table columns and are available only through View

### Requirement: Approval list uses three role-aware tabsThe system SHALL provide three tabs classifying applications from the current approver role perspective: Submitted, Pending, and History. The approver role SHALL be determined by the system default (v1: `Pending Review`) and SHALL NOT be exposed as a page-level selector on the approval list.

#### Scenario: Submitted tab
- **WHEN** user selects the Submitted tab
- **THEN** the list shows In Progress applications whose current workflow stage is not the current role's active stage and on which the current role has not yet acted in the current submission cycle

#### Scenario: Pending tab
- **WHEN** user selects the Pending tab
- **THEN** the list shows In Progress applications whose current approval stage matches the current role's active stage

#### Scenario: History tab
- **WHEN** user selects the History tab
- **THEN** the list shows applications the current role has already acted on in the current cycle, applications cancelled by the student, or terminal outcomes where the role participated

#### Scenario: No role selector on list page
- **WHEN** user views the movement approval list page
- **THEN** the system does not display a Current approver role dropdown or equivalent role-switching control

### Requirement: Approval search area uses responsive field layout
The system SHALL display five search fields—Academic Session, Programme Code, Status, Student ID, and Student Name—in a single responsive search area without a More/Collapse expand control. The Movement Reason search field SHALL NOT be shown.

#### Scenario: All search fields visible
- **WHEN** user opens the movement approval list page
- **THEN** all five search fields are visible without requiring the user to expand additional filters

#### Scenario: Programme code search next to academic session
- **WHEN** user views the approval search area
- **THEN** the Programme Code input appears immediately after the Academic Session input

#### Scenario: No movement reason search
- **WHEN** user views the approval search area
- **THEN** the system does not display a Movement Reason search input

#### Scenario: Filter by programme code
- **WHEN** user enters a programme code keyword and clicks Search
- **THEN** the list shows only rows whose resolved programme code matches the keyword (substring match)

#### Scenario: Adaptive field wrapping
- **WHEN** the viewport width changes
- **THEN** search fields reflow using a responsive grid or flex-wrap layout so labels and inputs remain readable without horizontal overflow

#### Scenario: Search actions alignment
- **WHEN** search fields are displayed
- **THEN** Search and Reset actions appear aligned to the right of the search field area on wide viewports and remain accessible when fields wrap on narrow viewports

### Requirement: Approval tabs ordered with pending count badge only
The system SHALL display approval tabs in order Pending, Submitted, then History. Only the Pending tab SHALL show a numeric count badge.

#### Scenario: Tab order
- **WHEN** user views the movement approval list page
- **THEN** tabs appear as Pending, Submitted, History from left to right

#### Scenario: Pending count badge only
- **WHEN** user views the tab bar
- **THEN** only the Pending tab displays a count badge; Submitted and History tabs do not display numeric badges

#### Scenario: Status badge visible
- **WHEN** user views the Status column on any tab
- **THEN** status labels use the same localized application status text as movement application lists (excluding Draft) with visible status badge styling

#### Scenario: Application date formatting
- **WHEN** a row represents programme transfer, deferment, resumption, or withdrawal
- **THEN** Application Date uses the same list date formatter as that movement type application list page

#### Scenario: Implemented column on History only
- **WHEN** user selects Pending or Submitted tab
- **THEN** the Implemented column is not shown

#### Scenario: Implemented Y/N on History
- **WHEN** user selects History tab
- **THEN** the Implemented column displays Y when the record implementation status is Implemented and N for all other values including Approved records pending implementation

### Requirement: Pending View opens approval via footer and modal
The system SHALL open Pending-tab View as read-only application details without an inline approval form below the detail content. When the user is viewing a Pending application, the detail footer SHALL display Approve and Close actions in that order (Approve immediately before Close). Clicking Approve SHALL open the same MovementApprovalModal used for batch review from the list (Action, Comments, confirm flow). Submitted and History View SHALL show Close only in the detail footer (History may retain separate Recall controls outside the detail footer as implemented today).

#### Scenario: View from Submitted
- **WHEN** user clicks View on a Submitted row
- **THEN** the system opens read-only application details without an Approve button in the detail footer

#### Scenario: View from Pending without inline approval
- **WHEN** user clicks View on a Pending row
- **THEN** the system opens read-only application details and does not render an inline approval section below the detail panel

#### Scenario: Approve from detail footer
- **WHEN** user clicks Approve in the detail footer on a Pending application
- **THEN** the system opens MovementApprovalModal with the current approval stage and single-application target count

#### Scenario: Modal matches list batch review
- **WHEN** user submits a decision from MovementApprovalModal opened from detail footer
- **THEN** the modal content and confirmation flow match opening Review from the Pending list with one row selected

#### Scenario: After detail approval submit
- **WHEN** user confirms an approval decision from detail footer modal
- **THEN** the system applies the decision via the movement approval engine and returns the user to the approval list

## REMOVED Requirements
### Requirement: Inline approval section on Pending View
**Reason**: Product design moves approval controls from an inline section below the detail panel to footer-triggered MovementApprovalModal, aligned with course approval patterns.
**Migration**: Remove `approval-section` from MovementApprovalReviewView; wire footer Approve to existing MovementApprovalModal.

### Requirement: Movement Reason in approval search and table
**Reason**: Product removed Movement Reason from the approval list workspace; reason details remain available in View.
**Migration**: Remove search field and table column; remove from CSV export headers.

### Requirement: Implemented column on Pending and Submitted tabs
**Reason**: Implementation applies only after approval workflow completes; pending and submitted items are not yet eligible for implementation display.
**Migration**: Show Implemented column only when History tab is active.

### Requirement: Mock approver role selector on approval page
**Reason**: Product design no longer includes an in-page role dropdown; approver context is implicit via system default until authentication is implemented.
**Migration**: Remove UI binding; retain `DEFAULT_APPROVER_ROLE` for engine calls.
