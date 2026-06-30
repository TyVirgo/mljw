## MODIFIED Requirements

### Requirement: Application list provides unified Details action
The system SHALL display a paginated table of course applications with Actions that include a unified Details action opening timeline and read-only detail content in a right-side drawer. Separate Approval Log row actions SHALL NOT be shown.

#### Scenario: Details opens drawer with timeline
- **WHEN** user clicks Details on a course application list row
- **THEN** the system opens the drawer with approval timeline above application details

#### Scenario: No separate approval log action
- **WHEN** user views Actions on a course application row where Approval Log was previously available
- **THEN** only Details is shown for viewing log and detail content together

#### Scenario: Edit remains on list when applicable
- **WHEN** a course application row allows Edit
- **THEN** Edit remains in the list Actions column and is not moved to the drawer footer

### Requirement: Read-only Details and Approval Log combined
The system SHALL provide read-only application details and approval history together through the unified Details drawer.

#### Scenario: Rejected read-only application
- **WHEN** application status is Rejected
- **THEN** the system does not provide an Edit action on the list row
- **AND** Details opens the combined drawer with timeline and read-only detail fields
