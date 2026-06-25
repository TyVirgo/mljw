## ADDED Requirements

### Requirement: Student select modal for staff forms
The system SHALL provide a reusable student selection modal for staff movement application forms with search and pagination over the student profile mock dataset.

#### Scenario: Open modal from form
- **WHEN** staff user clicks Select on Section I Student ID in any movement create form
- **THEN** a modal opens listing students with Student ID, Name, Programme, and Faculty columns

#### Scenario: Programme and faculty columns from enrollment
- **WHEN** the student select modal displays a student row
- **THEN** the Programme column shows `enrollment.programme` and the Faculty column shows `enrollment.faculty`, or `—` when empty

#### Scenario: Search by student id or name
- **WHEN** staff user enters a keyword in the modal search field
- **THEN** the list filters students whose student ID, English name, or Chinese name contains the keyword (case-insensitive)

#### Scenario: Paginated results
- **WHEN** the filtered student list exceeds the page size
- **THEN** the modal shows pagination controls and displays one page at a time

#### Scenario: Confirm selection
- **WHEN** staff user selects a row and confirms
- **THEN** the modal closes and the form Section I fields are populated from the selected student profile snapshot

#### Scenario: Cancel without change
- **WHEN** staff user closes or cancels the modal without confirming
- **THEN** the form retains its previous student selection state

#### Scenario: Confirm disabled without selection
- **WHEN** no student row is selected in the modal
- **THEN** the confirm action is disabled

## REMOVED Requirements

### Requirement: Inline student filter select on movement forms
**Reason**: Replaced by StudentSelectModal for scalability when student count is large.
**Migration**: Remove the paired keyword input and native `<select>` from Section I in all four movement form modals; use read-only display plus Select button opening StudentSelectModal.

#### Scenario: No native select for student pick
- **WHEN** staff user creates a movement application
- **THEN** Section I does not render a native HTML select listing all students inline
