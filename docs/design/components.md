# Component rules

- Validation summary: visible before quiz creation, with actionable question numbers.
- Paired import: fills the existing authoring fields and suggested set name; it never saves or starts automatically.
- Saved quiz row: quiz identity first; load and delete actions second.
- Data tools: backup and restore remain inside quiz management.
- All new controls need a mobile wrapping behavior and bilingual labels.
- Focus Card reuses the same question cards, answers, navigator, filters, and grading state as list mode; it must never maintain a separate answer model.
- Flashcard, Mastery, and Focus Sprint reuse the same rendered question cards and original answer map; their queues only control study order.
- Answer elimination is reversible, clears a selected answer when eliminated, and never changes the correct-answer data.
- Fullscreen is an explicit exam action because browsers require a user gesture; leaving fullscreen must not stop or duplicate the timer.
- Session type is one exclusive choice across Test, Practice, Exam, Flashcard, Mastery, and Focus Sprint. List/Focus Card is a secondary display choice shown only for Test, Practice, and Exam.
- Post-grading highlights are optional, scoped by original question and target (`1.q`, `1.b`), validated against exact source text, and rendered only after feedback is revealed. Option highlights may target correct answers only and must follow answer-choice shuffling.
