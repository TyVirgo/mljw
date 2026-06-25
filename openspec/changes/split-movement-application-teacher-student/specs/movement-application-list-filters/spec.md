## ADDED Requirements

### Requirement: Movement application list advanced search
The system SHALL provide advanced list search on all four movement application tabs for both staff and student portals.

#### Scenario: Staff first-row search fields
- **WHEN** staff user views any movement application tab in teacher mode
- **THEN** the search bar first row includes Student ID or Name, Programme Code, Application Session, and Approval Status filters with Search and Reset actions

#### Scenario: Student first-row search fields
- **WHEN** student user views any movement application tab in student mode
- **THEN** the search bar first row includes Programme Code, Application Session, and Approval Status filters but does not show the Student ID or Name filter

#### Scenario: Collapsible second row for implemented filter
- **WHEN** user views the movement application list search bar
- **THEN** a collapsible second row provides the Implemented filter, defaulting to expanded, with a collapse/expand control consistent with Status Change Inquiry layout

#### Scenario: Programme code matches current programme only
- **WHEN** user filters by Programme Code on any movement tab
- **THEN** the system matches against the derived current programme code for that application, not the new programme code for programme transfer

#### Scenario: Approval status includes Draft
- **WHEN** user selects an Approval Status filter on an application list tab
- **THEN** available statuses include Draft and other workflow statuses for that movement type

#### Scenario: Shared filter logic
- **WHEN** any movement application view applies list search
- **THEN** it uses shared movement application search helpers that reuse application session and programme code extraction consistent with inquiry and maintenance modules

### Requirement: Movement application search action button styling (§23)
The system SHALL render Search and Reset controls in the movement application list search bar using the same solid-primary and outlined-default button styles as the Change Category list page.

#### Scenario: Search and reset match change category buttons
- **WHEN** staff or student user views the search bar on any movement application tab
- **THEN** the Search action appears as a blue primary button with white label text
- **AND** the Reset action appears as a white button with gray border
- **AND** the Collapse/More control remains a text-style action unchanged

#### Scenario: Styling applies in shared search component
- **WHEN** MovementApplicationSearchBar is rendered for teacher or student applicant mode
- **THEN** Search and Reset button styling is applied via shared list-page search styles without duplicating per-view scoped CSS

### Requirement: Programme transfer list without active archived tabs
The system SHALL show programme transfer applications in a single unified list without In Progress versus Archived tab segmentation for both staff and student portals.

#### Scenario: No active archived tab controls
- **WHEN** user views Programme Transfer in either portal
- **THEN** In Progress and Archived tab buttons are not displayed

#### Scenario: Unified list includes terminal statuses
- **WHEN** user views Programme Transfer without applying status filters
- **THEN** the list includes applications in all statuses including terminal statuses such as Rejected, Cancelled, and Expired alongside in-progress records

#### Scenario: Terminal records discoverable by status filter
- **WHEN** staff or student user filters Programme Transfer by a terminal approval status
- **THEN** matching terminal applications appear in the unified list

### Requirement: Student portal hides redundant identity columns
The system SHALL hide Student ID and Name columns from movement application history tables in student mode across all four movement types.

#### Scenario: Student table columns
- **WHEN** student user views application history on Deferment, Resumption, Withdrawal, or Programme Transfer
- **THEN** the table does not render Student ID or Name columns

#### Scenario: Staff table columns unchanged
- **WHEN** staff user views the same movement application history tables
- **THEN** Student ID and Name columns remain visible

#### Scenario: Empty state colspan
- **WHEN** student user sees an empty application history table
- **THEN** the empty row colspan reflects the reduced column count without Student ID and Name

## MODIFIED Requirements

### Requirement: Applicant mode controls list scope
The system SHALL filter movement application lists by applicant mode so student self-service portals show only the current student's applications, then apply advanced search filters on that scoped list.

#### Scenario: Teacher list shows all applications
- **WHEN** user views any movement tab with `applicantMode` set to `teacher`
- **THEN** the list includes applications for all students subject to advanced search and pagination filters

#### Scenario: Student list shows own applications only
- **WHEN** user views any movement tab with `applicantMode` set to `student`
- **THEN** the list includes only applications whose student ID matches the current mock logged-in student before advanced search is applied

#### Scenario: Student advanced search within own records
- **WHEN** student user applies Programme Code, Application Session, Approval Status, or Implemented filters
- **THEN** search operates only within the current student's applications
