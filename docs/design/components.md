# Component rules

- Validation summary: visible before quiz creation, with actionable question numbers.
- Paired import: fills the existing authoring fields and suggested set name; it never saves or starts automatically.
- Saved quiz row: quiz identity first; load and delete actions second.
- Data tools: backup and restore remain inside quiz management.
- All new controls need a mobile wrapping behavior and bilingual labels.
- Focus Card reuses the same question cards, answers, navigator, filters, and grading state as list mode; it must never maintain a separate answer model.
