## MODIFIED Requirements

### Requirement: Student records movement application UX separation
The system SHALL separate student application viewing (Status Change Application tab) from approval operations (future Status Change Approval menu).

#### Scenario: Application tab detail is non-approving
- **WHEN** user navigates to Status Change Application and opens Details for any movement type
- **THEN** only application form fields are shown; approval is not performed in this context

#### Scenario: Workflow log still available on list
- **WHEN** user views any movement application list in the application tab
- **THEN** Workflow Log action remains available for all statuses
