## ADDED Requirements

### Requirement: Student Profile list page with search
The system SHALL provide a Student Profile Management list page with search filters aligned to the prototype.

#### Scenario: Search fields displayed
- **WHEN** user views the Student Profile page
- **THEN** the search bar shows Student ID, Name, and Student Type filters with Search and Reset buttons

#### Scenario: Search by student ID
- **WHEN** user enters a Student ID and clicks Search
- **THEN** the table shows only rows whose Student ID contains the entered text (case-insensitive)

#### Scenario: Search by name
- **WHEN** user enters a Name and clicks Search
- **THEN** the table shows only rows whose Student Name or Chinese Name contains the entered text (case-insensitive)

#### Scenario: Filter by student type
- **WHEN** user selects a Student Type other than "All Categories" and clicks Search
- **THEN** the table shows only rows matching that student type

#### Scenario: Reset search
- **WHEN** user clicks Reset
- **THEN** all search fields clear and the table shows the full mock dataset

### Requirement: Student Profile list toolbar actions
The system SHALL provide toolbar actions for Create, Import, and Export on the Student Profile page.

#### Scenario: Create button visible
- **WHEN** user views the Student Profile page
- **THEN** a primary Create button is displayed in the toolbar

#### Scenario: Import placeholder
- **WHEN** user clicks Import
- **THEN** the system shows a placeholder notice that import is not yet connected

#### Scenario: Export with data
- **WHEN** user clicks Export and confirms export in the export modal
- **THEN** the system downloads an Excel file containing the selected export scope and columns

### Requirement: Student Profile data table columns
The system SHALL display a paginated table with columns matching the prototype.

#### Scenario: Table columns
- **WHEN** the Student Profile list is displayed
- **THEN** columns include No., Student ID, Student Name, Chinese Name, Student Type, Gender, Programme Code, Programme, Intake, Student Status, and Actions

#### Scenario: Row actions
- **WHEN** user views a table row
- **THEN** the Actions column provides Details and Edit links

#### Scenario: Pagination
- **WHEN** the filtered result count exceeds the page size
- **THEN** the system shows pagination controls and displays the correct page slice

### Requirement: Student Profile row detail view
The system SHALL allow users to view student record details from the list.

#### Scenario: Open details
- **WHEN** user clicks Details on a row
- **THEN** the system displays a read-only detail view showing that row's student information

### Requirement: Student Profile mock data
The system SHALL use local mock data for the Student Profile list without backend API calls.

#### Scenario: Initial data load
- **WHEN** user opens the Student Profile page
- **THEN** the table displays at least six mock student records including varied student types and Active status examples

### Requirement: Student Profile page styling matches Basic Data list pages
The system SHALL use the same list page layout and styling conventions as Basic Data modules such as Lecturer Information.

#### Scenario: Page card layout
- **WHEN** user views the Student Profile page
- **THEN** content is wrapped in a page card with search bar, toolbar, data table, and pagination consistent with Basic Data list pages
