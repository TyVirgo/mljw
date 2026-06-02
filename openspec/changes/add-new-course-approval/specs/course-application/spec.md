## MODIFIED Requirements

### Requirement: Submit applications for review
The system SHALL allow submitting selected Temporary saved applications for approval and SHALL make them visible to the New Course Approval queue.

#### Scenario: Submit from list
- **WHEN** user selects one or more Temporary saved applications and clicks Submit
- **THEN** each selected application changes to status In Progress with approval stage HoD/HoP Review and an entry is appended to approval log
- **AND** each submitted application becomes visible on the New Course Approval list page

#### Scenario: Rejected applications cannot be resubmitted
- **WHEN** an application has status Rejected
- **THEN** the system does not offer Edit or Submit actions for that application
- **AND** Details and Approval Log remain available as read-only actions

#### Scenario: Update Required return to draft
- **WHEN** an approver selects Update Required on the New Course Approval page for an application
- **THEN** the application status becomes Temporary saved in Course Application
- **AND** the applicant MAY edit and Submit again

### Requirement: View details and approval log
The system SHALL provide read-only Details and an Approval Log for each application.

#### Scenario: Approval log
- **WHEN** user clicks Approval Log on a list row
- **THEN** the system displays a chronological list of approval events for that application
- **AND** events include approver actions from the New Course Approval module
