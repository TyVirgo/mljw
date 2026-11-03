## ADDED Requirements

### Requirement: Fee estimate sums retake full credits and add graduation excess

Fee estimate for an add/drop/retake application SHALL charge all retake credits and SHALL charge only the graduation-total excess portion of add credits. The payable fee SHALL be the sum of these parts (plus SST when applicable).

#### Scenario: Combined add and retake fee lines

- **WHEN** an application includes both an Add line and a Retake line
- **THEN** the fee estimate lists separate billable lines for the retake (full credits) and for any add graduation excess
- **AND** the total equals the sum of those line amounts

#### Scenario: Retake-only charges full credits

- **WHEN** an application includes Retake and no billable Add excess
- **THEN** the fee estimate billable credits equal the retake course credits

### Requirement: Graduation excess field excludes retake credits

The graduation excess (billing) field on detail and form SHALL show only Add-side graduation-excess billable credits, not retake billable credits.

#### Scenario: Detail graduation excess for combined app

- **WHEN** viewing a combined Add+Retake application detail
- **THEN** the graduation excess field does not equal retake credits alone or the sum of retake plus add when retake is present unless add excess alone matches that number

### Requirement: Detail approval and course payment share the same fee basis

Student detail, approval detail, and course payment unpaid lines SHALL use the same fee estimate itemization (retake full + add graduation excess).

#### Scenario: Course payment mirrors fee estimate items

- **WHEN** an approved application has pending bill and feeEstimate items
- **THEN** course payment creates unpaid lines whose billable credits and amounts align with those feeEstimate items
