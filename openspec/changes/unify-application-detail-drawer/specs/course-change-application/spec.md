## MODIFIED Requirements

### Requirement: Change application list actions use unified Details
The system SHALL expose a unified Details action on course change application and review list rows that opens approval timeline and read-only detail content in a right-side drawer. Separate Approval Log actions SHALL NOT be shown.

#### Scenario: Change application Details drawer
- **WHEN** user clicks Details on a course change application list row
- **THEN** the drawer shows timeline above change application detail content

#### Scenario: Change review list Details drawer
- **WHEN** approver clicks Details on course change review list row
- **THEN** the drawer shows timeline and read-only details
- **AND** approval actions remain in the drawer footer when applicable to the review context

#### Scenario: Edit remains on list
- **WHEN** a change application row allows Edit
- **THEN** Edit remains in the list Actions column

#### Scenario: Rejected read-only row
- **WHEN** change application status is Rejected
- **THEN** only Details is available for viewing combined log and detail content
