# Transport decision record

Capture the operation and trust boundary, then compare only viable options:

| Option | Use when | Explicitly check |
| --- | --- | --- |
| DBus | A service exposes a suitable stable interface | Bus/service name, object/interface, authorization, signatures, subscription cleanup, error names |
| `cockpit.spawn([...])` | A local executable is the right interface | Fixed executable and argument array, input validation, exit status, streaming, cancellation, privilege |
| `cockpit.script()` | A script body is genuinely needed and supported by the target API | Input handling, shell semantics, privileges, output/error behavior, cancellation; avoid interpolating user data |
| Low-level channel/bridge | No higher-level API fits and protocol control is necessary | Framing, lifecycle, reconnects, authorization, backpressure, cleanup, protocol errors |

Record the selected option, rejected alternatives, user-visible errors, cancellation/progress model, privilege requirements, local evidence, open questions, and tests. Verify exact API semantics in the current guide and installed Cockpit version.
