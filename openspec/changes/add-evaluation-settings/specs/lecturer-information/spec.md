## ADDED Requirements

### Requirement: Requires Evaluation driven by Evaluation Settings (lightweight demo)
The system MAY update lecturer `requiresEvaluation` flags using simplified mock logic when Evaluation Settings are saved; full automated rule enforcement is not required in v1.

#### Scenario: Flag updated after settings save
- **WHEN** administrator saves Evaluation Settings
- **THEN** mock lecturer records may be updated for demonstrative cases (new join date with no teaching record; category change pairs)

#### Scenario: Requires Evaluation tag reflects rules
- **WHEN** a lecturer's `requiresEvaluation` is true after mock rule application
- **THEN** the green "Requires Evaluation" tag appears next to the name in the list

#### Scenario: Evaluation filter uses recalculated flags
- **WHEN** user enables the evaluation filter on Lecturer Information after settings were saved
- **THEN** the filtered list reflects lecturers marked in mock data
