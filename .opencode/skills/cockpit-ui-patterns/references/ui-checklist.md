# UI decision checklist

For each view or interaction, record:

- User goal, available actions, and confirmation needed for consequential actions.
- Existing component/API in the target dependency set and matching local source example.
- Keyboard navigation, focus entry/return, accessible name/description, and validation association.
- Loading/progress and cancellation, empty/no-data, recoverable error, and success feedback.
- For charts: units, labels, time range, unavailable data, and a non-visual/accessible summary.
- For forms: required/optional fields, defaults, constraints, secrets, save/cancel behavior, and field-level errors.
- For dialogs, tabs, and dependent steps: focus management, discoverability, prerequisites, back/cancel behavior, and state preservation.

Do not treat an old source example as proof of current API availability; inspect the checked-out dependency and official guide.
