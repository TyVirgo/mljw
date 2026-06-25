## MODIFIED Requirements

### Requirement: Student Profile list toolbar actions
The system SHALL provide toolbar actions for Create, Delete, Import, and Export on the Student Profile page.

#### Scenario: Create button visible
- **WHEN** user views the Student Profile page
- **THEN** a primary Create button is displayed in the toolbar

#### Scenario: Delete requires selection
- **WHEN** user views the Student Profile page
- **THEN** a Delete button is displayed and is disabled when no rows are selected

#### Scenario: Import opens import modal
- **WHEN** user clicks Import
- **THEN** the system opens a student profile import modal with template download and file upload

#### Scenario: Export with data
- **WHEN** user clicks Export and confirms export in the export modal
- **THEN** the system downloads an Excel file containing the selected export scope and columns

### Requirement: Student Profile data table columns
The system SHALL display a paginated table with columns matching the prototype.

#### Scenario: Table columns
- **WHEN** the Student Profile list is displayed
- **THEN** columns include a selection checkbox, No., Student ID, Student Name, Chinese Name, Student Type, Gender, Programme Code, Programme, Intake, Student Status, and Actions

#### Scenario: Row actions
- **WHEN** user views a table row
- **THEN** the Actions column provides Details, Edit, and Delete links

#### Scenario: Pagination
- **WHEN** the filtered result count exceeds the page size
- **THEN** the system shows pagination controls and displays the correct page slice

#### Scenario: Filter by student type uses prototype categories
- **WHEN** user filters by Student Type
- **THEN** available options include Local, China, and International

### Requirement: Student Profile row detail view
The system SHALL allow users to view complete student record details from the list using the same seven-tab structure as the registration form.

#### Scenario: Open details drawer
- **WHEN** user clicks Details on a row
- **THEN** the system displays a read-only drawer with tabs Basic Info, Enrollment, Contact, Education, Family, Accommodation, and Others showing all stored fields for that student

#### Scenario: Details respects student category fields
- **WHEN** user opens Details for a China or International student
- **THEN** the Basic Info tab shows passport fields and hides Local-only IC fields according to that student's category

### Requirement: Student Profile mock data
The system SHALL use local mock data for the Student Profile list without backend API calls.

#### Scenario: Initial data load
- **WHEN** user opens the Student Profile page
- **THEN** the table displays mock student records including prototype-aligned examples such as XMUM2309001 with Local, China, and International categories and Active status

#### Scenario: China mock uses passport or China identity fields
- **WHEN** user opens Details for mock student XMUM2309002 with category China
- **THEN** Basic Info shows China-appropriate identity fields rather than Local IC No. as the primary identifier

#### Scenario: International mock uses passport fields
- **WHEN** user opens Details for mock student XMUM2309003 with category International
- **THEN** Basic Info shows passport-related fields rather than Local IC No. as the primary identifier

## REMOVED Requirements

### Requirement: Student Profile list toolbar actions
#### Scenario: Import placeholder
**Reason**: Import is implemented with template download and Excel parsing.
**Migration**: Use the Import modal to upload student profile Excel files.

## ADDED Requirements

### Requirement: Student Profile create and edit registration form
The system SHALL provide a New Student Registration drawer for creating and editing student records with seven tabs aligned to the prototype.

#### Scenario: Open create form
- **WHEN** user clicks Create on the Student Profile page
- **THEN** the system opens an empty registration drawer titled for new student registration with Student Category radio options Local, China, and International

#### Scenario: Registration tabs displayed
- **WHEN** the registration drawer is open
- **THEN** the system shows tabs Basic Info, Enrollment, Contact, Education, Family, Accommodation, and Others

#### Scenario: Open edit form
- **WHEN** user clicks Edit on a table row
- **THEN** the system opens the registration drawer pre-filled with that student's data in edit mode

#### Scenario: Save new student
- **WHEN** user completes required fields and clicks Save on a new student
- **THEN** the system validates input, adds the student to the list, closes the drawer, and shows the new row in the table

#### Scenario: Save edited student
- **WHEN** user modifies fields and clicks Save in edit mode
- **THEN** the system validates input, updates the existing record, and reflects changes in the table

#### Scenario: Duplicate student ID rejected
- **WHEN** user saves a student whose Student ID already exists on another record
- **THEN** the system prevents save and shows a validation error

#### Scenario: Cancel closes drawer
- **WHEN** user clicks Cancel in the registration drawer
- **THEN** the drawer closes without saving unsaved changes

#### Scenario: Local basic info fields
- **WHEN** user selects Student Category Local in the registration drawer Basic Info tab
- **THEN** the form displays IC No. and State of Birth and does not display passport-specific or China-only identity fields

#### Scenario: China basic info fields
- **WHEN** user selects Student Category China in the registration drawer Basic Info tab
- **THEN** the form displays Passport No., Passport Expiry, Place of Birth, Candidate No., Political Outlook, and Identity No. (China ID), and does not display IC No. or State of Birth

#### Scenario: International basic info fields
- **WHEN** user selects Student Category International in the registration drawer Basic Info tab
- **THEN** the form displays Passport No., Passport Expiry, and Place of Birth, and does not display IC No., State of Birth, or China-only identity fields

#### Scenario: Category-specific validation on save
- **WHEN** user saves a Local student without IC No.
- **THEN** the system prevents save and shows a validation error on Basic Info

#### Scenario: China or International save without IC No
- **WHEN** user saves a China or International student without IC No. but with required shared fields completed
- **THEN** the system allows save if other required fields are valid

### Requirement: Student Profile delete records
The system SHALL allow users to delete student records individually or in bulk.

#### Scenario: Delete single row
- **WHEN** user clicks Delete on a row and confirms
- **THEN** the system removes that student from the list

#### Scenario: Delete selected rows
- **WHEN** user selects one or more rows, clicks toolbar Delete, and confirms
- **THEN** the system removes all selected students from the list

### Requirement: Student Profile import from Excel
The system SHALL import student records from an Excel template covering list, basic, and enrollment core fields.

#### Scenario: Download import template
- **WHEN** user opens the import modal and clicks download template
- **THEN** the system downloads an Excel file with column headers and a sample row

#### Scenario: Import valid rows
- **WHEN** user uploads a valid Excel file and confirms import
- **THEN** the system adds parsed student records to the list and shows a success summary with the count imported

#### Scenario: Import skips duplicate student IDs
- **WHEN** user uploads a file containing a Student ID that already exists
- **THEN** the system skips those rows and reports them in the import result

#### Scenario: Import validation errors
- **WHEN** user uploads a file with missing required fields on a row
- **THEN** the system skips invalid rows and reports row numbers and reasons

#### Scenario: Import validates IC No for Local rows only
- **WHEN** user uploads a row with Student Category Local and missing IC No.
- **THEN** the system skips that row and reports a validation error

#### Scenario: Import accepts China row without IC No
- **WHEN** user uploads a row with Student Category China, valid passport or China identity fields, and no IC No.
- **THEN** the system may import the row if other required fields are valid

### Requirement: Student Profile extended export
The system SHALL support exporting both list columns and extended profile fields.

#### Scenario: Export list columns
- **WHEN** user exports with only list column fields selected
- **THEN** the downloaded Excel matches the table column set

#### Scenario: Export extended profile fields
- **WHEN** user exports with extended profile fields selected
- **THEN** the downloaded Excel includes flattened fields from the seven registration tabs

### Requirement: Student Profile basic info photo upload
The system SHALL support uploading a student photo in the Basic Info tab during create and edit.

#### Scenario: Upload photo preview
- **WHEN** user selects an image file in the Basic Info tab
- **THEN** the system displays a preview of the selected photo in the form without requiring a backend upload

#### Scenario: Photo shown in details
- **WHEN** user views Details for a student with a stored photo
- **THEN** the Basic Info tab displays the photo preview

### Requirement: Student Profile category-specific education fields
The system SHALL display different Education tab fields based on Student Category.

#### Scenario: Local education shows Chinese language tests
- **WHEN** user views the Education tab for a Local student in create, edit, or details mode
- **THEN** the form displays Chinese Test Result, Chinese Test Date, and Chinese Test Expiry fields

#### Scenario: China education hides Chinese language tests
- **WHEN** user views the Education tab for a China student in create, edit, or details mode
- **THEN** the form does not display Chinese Test Result, Chinese Test Date, or Chinese Test Expiry fields

#### Scenario: International education shows Chinese language tests
- **WHEN** user views the Education tab for an International student in create, edit, or details mode
- **THEN** the form displays Chinese Test Result, Chinese Test Date, and Chinese Test Expiry fields

#### Scenario: Qualification dropdown for all categories
- **WHEN** user views the Education tab for a Local, China, or International student in create or edit mode
- **THEN** Qualification is presented as a dropdown selection

### Requirement: Student Profile category-specific others fields
The system SHALL display different Others tab fields based on Student Category.

#### Scenario: Local others includes tax registration
- **WHEN** user views the Others tab for a Local student
- **THEN** the form displays Tax Registration No along with Registration Date, Sponsor, Remarks, and Status Change Log

#### Scenario: China or International others excludes tax registration
- **WHEN** user views the Others tab for a China or International student
- **THEN** the form displays Registration Date, Sponsor, Remarks, and Status Change Log and does not display Tax Registration No

### Requirement: Student Profile category-specific enrollment fields
The system SHALL display enrollment field control differences for China and International students where specified by the prototype.

#### Scenario: Recruited by dropdown for all categories
- **WHEN** user views the Enrollment tab for a Local, China, or International student in create or edit mode
- **THEN** Recruited By is presented as a dropdown

#### Scenario: Fujian scholarship for Local only
- **WHEN** user views the Enrollment tab for a Local student
- **THEN** Fujian Scholarship Amt is displayed

#### Scenario: Fujian scholarship hidden for China and International
- **WHEN** user views the Enrollment tab for a China or International student
- **THEN** Fujian Scholarship Amt is not displayed

### Requirement: Student Profile enrollment master-data selects
The system SHALL present Programme Code, Programme, Faculty, Intake (YYYY/MM), and Academic Session on the Enrollment tab as dropdown selections sourced from basic-data module datasets. The five fields SHALL be independently selectable without cascading or Programme Intake combination validation in this phase.

#### Scenario: Enrollment fields use basic-data options in create or edit
- **WHEN** user views the Enrollment tab in create or edit mode
- **THEN** Programme Code options come from the programme catalogue codes
- **AND** Programme options come from the programme catalogue names
- **AND** Faculty options come from configured school labels
- **AND** Intake options come from active intake set batches
- **AND** Academic Session options come from semester information academic sessions

#### Scenario: Independent selection without linkage
- **WHEN** user changes Programme Code without changing Programme or Faculty
- **THEN** the system does not auto-update Programme or Faculty
- **AND** the system does not reject saves based on programme and intake combination rules

#### Scenario: List details and edit show the same enrollment values
- **WHEN** user views a student row in the list and opens Details or Edit for that student
- **THEN** Programme Code, Programme, Intake, and related list columns display the same stored enrollment values
- **AND** edit mode dropdowns show the stored values as selected when those values exist in the option lists

#### Scenario: Showcase mock aligns with master-data options
- **WHEN** user opens Edit for mock students XMUM2309001, XMUM2309002, or XMUM2309003
- **THEN** enrollment programme code, programme name, faculty, intake, and academic session values match entries available in the basic-data option lists
- **AND** each corresponding dropdown displays the correct selected option

## MODIFIED Requirements

### Requirement: Student Profile extended export
The system SHALL provide an export dialog matching the Programme Version module: dual-list field shuttle (Available Fields / Selected Fields), move buttons, and Export Setting with Current Page, All Results, and Selected Rows options.

#### Scenario: Export dialog shuttle layout
- **WHEN** user clicks Export on the Student Profile page with data available
- **THEN** the system opens the shared Export modal with Available Fields on the left and Selected Fields on the right, consistent with Programme Version

#### Scenario: Default selected list columns
- **WHEN** the export modal opens
- **THEN** list table columns including No. are pre-selected in Selected Fields
- **AND** extended profile fields appear in Available Fields until moved by the user

#### Scenario: Export scope current page
- **WHEN** user selects Export Current Page and confirms with at least one selected field
- **THEN** the system exports only rows visible on the current list page using the selected columns

#### Scenario: Export scope all results
- **WHEN** user selects Export All Results and confirms
- **THEN** the system exports all rows matching the current search filter using the selected columns

#### Scenario: Export scope selected rows
- **WHEN** user selects Export Selected Rows without any table row checked
- **THEN** the system shows a toast prompting the user to select rows first
- **WHEN** user selects Export Selected Rows with checked rows and confirms
- **THEN** the system exports only the checked rows using the selected columns

#### Scenario: Export list columns
- **WHEN** user exports with only list column fields selected
- **THEN** the downloaded Excel matches the table column set

#### Scenario: Export extended profile fields
- **WHEN** user moves extended profile fields to Selected Fields and confirms export
- **THEN** the downloaded Excel includes flattened fields from the seven registration tabs

## MODIFIED Requirements

### Requirement: Student Profile row detail view
The system SHALL display read-only field labels and values with distinct typography in the details drawer across all seven tabs. Field labels SHALL use a smaller, muted style; field values SHALL use a larger, emphasized style. Empty values displayed as an em dash SHALL use a subdued empty-state style distinct from filled values.

#### Scenario: Label and value visual hierarchy in details
- **WHEN** user opens Details and views any tab
- **THEN** field labels are visually distinct from field values by size, weight, and color
- **AND** edit mode form inputs are unaffected

#### Scenario: Empty value styling in details
- **WHEN** a field has no stored value in details mode
- **THEN** the system displays an em dash with subdued empty-state styling

#### Scenario: Student category row in details header area
- **WHEN** user opens Details
- **THEN** the student category label and value above the tabs follow the same label/value hierarchy

### Requirement: Student Profile mock data
The system SHALL seed showcase student records with representative tab content so that details views are not dominated by empty placeholders.

#### Scenario: Local showcase record richness
- **WHEN** user opens Details for mock student XMUM2309001
- **THEN** Basic Info, Enrollment, Contact, Education, Family, Accommodation, and Others tabs show concrete demo values across most fields
- **AND** a small number of optional fields may remain empty per tab

#### Scenario: China and International showcase records
- **WHEN** user opens Details for XMUM2309002 or XMUM2309003
- **THEN** category-appropriate fields are populated with concrete demo values across multiple tabs
- **AND** empty optional fields may remain for demonstration
