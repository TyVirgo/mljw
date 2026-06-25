## ADDED Requirements

### Requirement: Academic session search as dropdown on movement list pages (§11)
The system SHALL render the Academic Session search field on Status Change Approval, Status Change Maintenance, and Status Change Inquiry list pages as a dropdown populated with distinct application session values from the merged queue for that page, plus an All option.

#### Scenario: Dropdown options from application session field
- **WHEN** user opens the search area on approval, maintenance, or inquiry
- **THEN** the Academic Session control is a select dropdown
- **AND** options are distinct non-empty `applicationSession` values from records in that page's merged queue, sorted ascending
- **AND** the first option allows clearing the filter (All)

#### Scenario: Exact match filter
- **WHEN** user selects an academic session value and clicks Search
- **THEN** the list shows only rows whose application session equals the selected value exactly

#### Scenario: Chinese label unchanged
- **WHEN** user views the maintenance search area in Chinese UI
- **THEN** the academic session field label still displays 学年学期
