## ADDED Requirements

### Requirement: New course approval list page
The system SHALL provide an approver-facing list page at menu **New Course Approval** that displays submitted course applications excluding Temporary saved drafts.

#### Scenario: Default list load
- **WHEN** user navigates to New Course Approval
- **THEN** the system displays a paginated table with columns: No., Status, Approval Stage, Course Code, Course Name, Offering, Course Classification, Credit, Applicant, Application Date and Time, and Actions
- **AND** Temporary saved applications SHALL NOT appear in the list

#### Scenario: Status badge styling
- **WHEN** a record is displayed in the approval list
- **THEN** status badges use solid background with white text (consistent with Course Application list styling)

#### Scenario: Sticky actions column
- **WHEN** the table content overflows horizontally
- **THEN** the Actions column remains sticky on the right while scrolling

### Requirement: Search and filter approval queue
The system SHALL support searching the approval queue by Course Code, Course Name, Offering, and Course Classification.

#### Scenario: Basic search layout
- **WHEN** user views the search area
- **THEN** Course Code, Course Name, and Offering appear on the first row with Search and Reset buttons aligned to the right on the same row
- **AND** Course Classification appears on the second row
- **AND** filter labels are right-aligned so colons align vertically

#### Scenario: Search filters results
- **WHEN** user enters filter criteria and clicks Search
- **THEN** the list shows only matching submitted applications and resets to page 1

#### Scenario: Reset filters
- **WHEN** user clicks Reset
- **THEN** all search fields are cleared and the full approval queue is restored

### Requirement: Approval toolbar actions
The system SHALL provide toolbar actions **Approval** and **Export** on the approval list page.

#### Scenario: Approval requires selection
- **WHEN** user clicks Approval with no eligible row selected
- **THEN** the system does not open the approval dialog (button disabled or no-op with notice)

#### Scenario: Approval opens modal for selected row
- **WHEN** user selects one approvable In Progress application and clicks Approval
- **THEN** the system opens the Approval modal for that application

#### Scenario: Batch approval
- **WHEN** user selects two or more approvable In Progress applications at the same approval stage and clicks Approval
- **THEN** the system opens the Approval modal once
- **AND** upon Confirm, the same Action and Comments are applied to each selected application

#### Scenario: Batch approval requires same stage
- **WHEN** user selects applications at different approval stages
- **THEN** the Approval toolbar action is disabled or shows a notice that selections must share the same approval stage

#### Scenario: Export approval list
- **WHEN** user clicks Export and confirms field selection
- **THEN** the system downloads an Excel file of filtered approval queue data

### Requirement: Row actions for approvers
The system SHALL provide Details and Approval Log actions per row; approvers SHALL NOT have Edit or Delete row actions.

#### Scenario: View application details
- **WHEN** user clicks Details on a row
- **THEN** the system opens a read-only three-step application view showing General Information, CLO, and SLT data

#### Scenario: View approval log
- **WHEN** user clicks Approval Log on a row
- **THEN** the system displays the chronological approval history for that application

### Requirement: Approval modal
The system SHALL provide an Approval modal matching the prototype for recording an approver decision.

#### Scenario: Modal header and context
- **WHEN** the Approval modal opens
- **THEN** the title is "Approval" (or localized "审核")
- **AND** instructional text includes the current approval stage (e.g., Current HoD/HoP Review)

#### Scenario: Action selection
- **WHEN** user views the Action field
- **THEN** the system provides exactly three radio options: Approved, Rejected, and Update Required
- **AND** localized labels include 通过 / 拒绝 / 驳回

#### Scenario: Comments field
- **WHEN** user views the Comments field
- **THEN** the system provides a textarea with a 100-character limit and a live counter (e.g., 0/100)
- **AND** a Common Comments control is available to insert text from a preset list of 3–5 static templates

#### Scenario: Common comments preset
- **WHEN** user clicks Common Comments and selects a preset template
- **THEN** the preset text is inserted into the Comments textarea (respecting the 100-character limit)

#### Scenario: Cancel closes modal
- **WHEN** user clicks Cancel
- **THEN** the modal closes without changing application data

#### Scenario: Confirm requires action
- **WHEN** user clicks Confirm without selecting an Action
- **THEN** the system prevents submission and prompts the user to select an approval result

### Requirement: Approval decision — Approved
The system SHALL advance the workflow when an approver selects Approved.

#### Scenario: Approve at HoD/HoP Review
- **WHEN** approver confirms Approved for an application at HoD/HoP Review
- **THEN** status remains In Progress, approvalStage becomes Senate Review
- **AND** an entry is appended to approvalLog with actor, action Approved, date/time, and comments

#### Scenario: Final approve at Senate Review
- **WHEN** approver confirms Approved for an application at Senate Review
- **THEN** status becomes Approved and approvalStage becomes Approved
- **AND** the application data is archived to Course Information as a formal course record (if Course Code is not already present)
- **AND** an approvalLog entry is appended

### Requirement: Approval decision — Rejected
The system SHALL record terminal rejection when an approver selects Rejected.

#### Scenario: Reject application
- **WHEN** approver confirms Rejected
- **THEN** status becomes Rejected
- **AND** an approvalLog entry is appended with comments
- **AND** the application remains visible in the approval list as read-only (Details and Approval Log only)

### Requirement: Approval decision — Update Required
The system SHALL return the application to the applicant when an approver selects Update Required.

#### Scenario: Return to draft
- **WHEN** approver confirms Update Required
- **THEN** status becomes Temporary saved and approvalStage becomes --
- **AND** an approvalLog entry is appended
- **AND** the application is removed from the New Course Approval queue
- **AND** the applicant can edit and re-submit from Course Application

### Requirement: Data source synchronization
The system SHALL synchronize the approval queue with Course Application submitted records.

#### Scenario: Submitted application appears in approval queue
- **WHEN** an applicant submits a Temporary saved application from Course Application
- **THEN** the application appears in New Course Approval with status In Progress

#### Scenario: Returned draft disappears from approval queue
- **WHEN** an approver returns an application via Update Required
- **THEN** the application no longer appears in New Course Approval until re-submitted

### Requirement: App registration
The system SHALL register New Course Approval as a developed page accessible from the Course Info submenu.

#### Scenario: Menu access
- **WHEN** user clicks New Course Approval in the sidebar
- **THEN** the Course Approval view loads instead of Under Construction
