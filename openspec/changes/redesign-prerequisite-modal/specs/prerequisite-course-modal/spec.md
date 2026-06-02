## ADDED Requirements

### Requirement: Prerequisite course selection modal layout
The system SHALL display a wide **Add** modal when the user clicks **Choose** on Pre-requisite / co-requisite in the course wizard, matching the prototype layout with search area, data table, pagination, and Discard / Confirm footer.

#### Scenario: Modal opens with title Add
- **WHEN** user clicks Choose on Pre-requisite / co-requisite
- **THEN** the system opens a modal titled **Add** with width approximately 1000px
- **AND** previously selected course codes remain checked

#### Scenario: Exclude current course
- **WHEN** the wizard is editing or creating a course with code `X`
- **THEN** course `X` does not appear in the selectable list

### Requirement: Prerequisite course search filters
The system SHALL provide search filters for Course Name, Course Code, and Offering, with Search and Reset actions.

#### Scenario: Search applies filters
- **WHEN** user enters filter values and clicks Search
- **THEN** the table shows only courses matching all non-empty filters (case-insensitive partial match for text fields)
- **AND** pagination resets to page 1

#### Scenario: Reset clears filters
- **WHEN** user clicks Reset
- **THEN** all search fields are cleared
- **AND** the table shows the full available course list

#### Scenario: Offering filter
- **WHEN** user selects an Offering unit and clicks Search
- **THEN** only courses with that offering code are shown

### Requirement: Prerequisite course selection table
The system SHALL display a paginated table with columns: checkbox, No., Course code, Course Name, Offering, Credit Value, and Course Classification.

#### Scenario: Table columns and data
- **WHEN** the modal lists courses
- **THEN** each row shows serial number, course code, course name, offering label (via department lookup), credit value, and translated course classification

#### Scenario: Multi-select courses
- **WHEN** user checks one or more rows and clicks Confirm
- **THEN** the wizard Pre-requisite field is updated with selected course codes joined by comma and space
- **AND** the modal closes

#### Scenario: Discard without saving
- **WHEN** user clicks Discard or the close control
- **THEN** the modal closes without updating the wizard field

#### Scenario: Header select all on current page
- **WHEN** user checks the header checkbox on a page
- **THEN** all courses on the current page are selected
- **AND** selections on other pages remain unchanged

#### Scenario: Cross-page selection preserved
- **WHEN** user selects courses on page 1, navigates to page 2, and selects more courses
- **THEN** all selected course codes are retained until Confirm or Discard

### Requirement: Prerequisite modal pagination
The system SHALL paginate filtered results using the shared TablePagination component.

#### Scenario: Default pagination
- **WHEN** more than 10 courses match the filter
- **THEN** the system shows 10 records per page by default with total record count

#### Scenario: Change page size
- **WHEN** user changes records per page
- **THEN** the table refreshes with the new page size and returns to page 1

### Requirement: Prerequisite modal reuse in wizards
The system SHALL use the same prerequisite selection modal in Course Information and Course Application wizards without changing parent component integration.

#### Scenario: Course Information wizard
- **WHEN** user selects prerequisites from Course Information create or edit wizard
- **THEN** the modal receives the courses list and returns comma-separated codes on Confirm

#### Scenario: Course Application wizard
- **WHEN** user selects prerequisites from Course Application apply wizard
- **THEN** the same modal behavior applies using the applications-derived course list
