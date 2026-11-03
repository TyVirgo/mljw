## ADDED Requirements

### Requirement: Estimate tip shows inline only for real second applications

When the student has at least one self-submitted add/drop application still pending review, the term credit strip tip area SHALL show the pending-estimate explanation as visible text inside the blue tip box. The tip box and any exclamation decoration MUST NOT render when there is no such self-submitted pending application.

#### Scenario: First visit with only demo seed pending rows

- **WHEN** the current student has Pending/In Review applications that originated from demo seed (not student submit)
- **THEN** the pending-estimate tip text and exclamation decoration are not shown
- **AND** same-primary-type block (red error under application type) is not triggered by those seed rows

#### Scenario: After student submits a real pending application

- **WHEN** the student has submitted an application via the student form that remains Pending or In Review
- **THEN** the blue tip box shows the pending-estimate explanation as visible text (not only as a hover tooltip)
- **AND** selecting the same primary type again shows the same-type pending blocked message and disables form ops / submit

#### Scenario: No second application after cancel

- **WHEN** the student cancels (or otherwise clears) all self-submitted pending applications of that primary type
- **THEN** the estimate tip and exclamation are hidden
- **AND** the student can submit that primary type again
