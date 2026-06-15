## MODIFIED Requirements

### Requirement: Student records sidebar includes developed movement approval entry
The system SHALL treat Status Change Approval as a developed page alongside Student Basic Information and Status Change Application.

#### Scenario: Developed pages set
- **WHEN** the student records app loads
- **THEN** `studentRecordsDevelopedPages` includes `sr-movement-approval`

#### Scenario: Breadcrumb for approval page
- **WHEN** user is on Status Change Approval
- **THEN** breadcrumb displays Student Status Change group and Status Change Approval leaf labels
