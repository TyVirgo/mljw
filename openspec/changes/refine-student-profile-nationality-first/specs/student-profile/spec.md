## ADDED Requirements

### Requirement: Student Profile nationality-first form layout
The system SHALL organize the registration and detail drawers into two labeled sections: **Nationality Information** (国籍信息) and **Information Entry** (信息填写).

#### Scenario: Create form shows nationality section first
- **WHEN** user opens the new student registration drawer
- **THEN** the drawer displays step **1** **Nationality Information** as the only visible form section until a nationality is selected

#### Scenario: Step numbers on form sections
- **WHEN** user views the registration or detail drawer
- **THEN** the **Nationality Information** section heading displays a prominent step number **1** and the **Information Entry** section heading displays a prominent step number **2**

#### Scenario: Information Entry hidden before nationality on create
- **WHEN** user opens the create registration drawer and has not selected a nationality
- **THEN** the entire **Information Entry** section including its heading, tabs, and fields is not displayed

#### Scenario: Information Entry appears after nationality selected
- **WHEN** user selects a nationality on create
- **THEN** the **Information Entry** section becomes visible with seven tabs and category-appropriate editable fields

#### Scenario: Tabs show fields after nationality selected
- **WHEN** user selects a nationality on create
- **THEN** the Information Entry tabs display category-appropriate fields according to the derived Student Category

#### Scenario: Nationality searchable dropdown
- **WHEN** user interacts with the Nationality field in create or edit mode
- **THEN** the system provides a searchable dropdown of global nationality values with Malaysia and China listed first, followed by all other nationalities in alphabetical order

#### Scenario: Student category derived from nationality
- **WHEN** user selects a nationality
- **THEN** the system automatically sets Student Category using the rules Malaysia → Local, China → China, any other nationality → International, and displays the category as read-only in the Nationality Information section

#### Scenario: No manual student category selection
- **WHEN** user views the registration drawer in create or edit mode
- **THEN** the system does not display Student Category radio buttons or any other manual category selector

#### Scenario: Nationality required on save
- **WHEN** user clicks Save without selecting a nationality
- **THEN** the system prevents save, keeps the Save button enabled, and shows a validation error prompting the user to select nationality on the Nationality field in step 1

#### Scenario: Nationality switch before save updates category fields
- **WHEN** user changes nationality in create or edit mode before saving and the derived Student Category changes
- **THEN** the system prompts for confirmation, clears category-incompatible fields, and updates visible fields to match the new category

#### Scenario: Nationality switch within same category before save
- **WHEN** user changes nationality before saving but the derived Student Category remains the same
- **THEN** the system updates the nationality value without confirmation and without clearing category-specific fields

#### Scenario: Nationality not duplicated in Basic Info tab
- **WHEN** user views the Basic Info tab in create or edit mode
- **THEN** the Nationality input is not shown inside Basic Info because it appears only in the Nationality Information section

#### Scenario: Edit nationality change confirmation
- **WHEN** user changes nationality such that the derived Student Category changes
- **THEN** the system prompts for confirmation before applying the change and clearing category-incompatible fields

#### Scenario: Detail drawer matches layout
- **WHEN** user opens Details for a student record
- **THEN** the read-only drawer uses step numbers **1** and **2** with the same Nationality Information and Information Entry section structure, showing nationality and derived category as read-only values

### Requirement: Student Profile nationality to category mapping
The system SHALL derive Student Category from nationality using a single shared mapping function used by the student profile form and movement modules.

#### Scenario: Malaysia maps to Local
- **WHEN** nationality is Malaysia
- **THEN** Student Category is Local

#### Scenario: China maps to China
- **WHEN** nationality is China
- **THEN** Student Category is China

#### Scenario: Other nationalities map to International
- **WHEN** nationality is any value other than Malaysia or China
- **THEN** Student Category is International

## MODIFIED Requirements

### Requirement: Student Profile create and edit registration form
The system SHALL provide a New Student Registration drawer for creating and editing student records with a Nationality Information section, an Information Entry section with seven tabs, and category-appropriate fields derived from the selected nationality.

#### Scenario: Open create form
- **WHEN** user clicks Create on the Student Profile page
- **THEN** the system opens an empty registration drawer titled for new student registration with a Nationality Information section containing an empty searchable nationality dropdown and no derived Student Category until nationality is selected

#### Scenario: Registration tabs displayed
- **WHEN** the registration drawer is open and a nationality has been selected
- **THEN** the system shows step **2** **Information Entry** with tabs Basic Info, Enrollment, Contact, Education, Family, Accommodation, and Others

#### Scenario: Open edit form
- **WHEN** user clicks Edit on a table row
- **THEN** the system opens the registration drawer pre-filled with that student's nationality, derived Student Category, and all other data in edit mode

#### Scenario: Save new student
- **WHEN** user completes required fields including nationality and clicks Save on a new student
- **THEN** the system validates input, adds the student to the list with the derived Student Category, closes the drawer, and shows the new row in the table

#### Scenario: Save edited student
- **WHEN** user modifies fields and clicks Save in edit mode
- **THEN** the system validates input, updates the existing record including nationality and derived Student Category, and reflects changes in the table

#### Scenario: Duplicate student ID rejected
- **WHEN** user saves a student whose Student ID already exists on another record
- **THEN** the system prevents save and shows a validation error

#### Scenario: Cancel closes drawer
- **WHEN** user clicks Cancel in the registration drawer
- **THEN** the drawer closes without saving unsaved changes

#### Scenario: Local basic info fields
- **WHEN** user selects nationality Malaysia so that Student Category is Local
- **THEN** the Basic Info tab displays IC No. and State of Birth and does not display passport-specific or China-only identity fields

#### Scenario: China basic info fields
- **WHEN** user selects nationality China so that Student Category is China
- **THEN** the Basic Info tab displays Passport No., Passport Expiry, Place of Birth, Candidate No., Political Outlook, and Identity No. (China ID), and does not display IC No. or State of Birth

#### Scenario: International basic info fields
- **WHEN** user selects a nationality other than Malaysia or China so that Student Category is International
- **THEN** the Basic Info tab displays Passport No., Passport Expiry, and Place of Birth, and does not display IC No., State of Birth, or China-only identity fields

#### Scenario: Category-specific validation on save
- **WHEN** user saves a Local student without IC No.
- **THEN** the system prevents save and shows a validation error on Basic Info

#### Scenario: China or International save without IC No
- **WHEN** user saves a China or International student without IC No. but with required shared fields completed
- **THEN** the system allows save if other required fields are valid

## REMOVED Requirements

### Requirement: Student Profile create form manual category selection
**Reason**: Student Category is now derived from nationality; manual radio selection is replaced by automatic mapping.
**Migration**: Users select nationality first; the system sets Local, China, or International automatically.
