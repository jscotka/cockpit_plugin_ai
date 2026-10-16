import test from "node:test";
import assert from "node:assert/strict";
import { STATIC_SCHEMA, normalizeBoolean, parseConfig, parseRenderedMan, updateConfig, validateChanges, valuesFor } from "./parser.js";

test("parses sections and preserves comments/unknown content", () => {
    const config = "; keep\n[Session]\n# keep\nIdleTimeout = 15 # administrator note\nOther = yes\n";
    assert.equal(valuesFor(config, STATIC_SCHEMA).values["Session.IdleTimeout"], "15");
    assert.equal(parseConfig(config).sections[0].keys[1].name, "Other");
    const result = updateConfig(config, { "Session.IdleTimeout": "30" });
    assert.match(result, /; keep/); assert.match(result, /Other = yes/); assert.match(result, /IdleTimeout = 30 # administrator note/);
});

test("rejects duplicate managed keys and sections", () => {
    assert.throws(() => updateConfig("[Session]\nIdleTimeout=1\nIdleTimeout=2\n", { "Session.IdleTimeout": "3" }), /Duplicate managed directive/);
    assert.throws(() => updateConfig("[Session]\nIdleTimeout=1\n[Session]\nWarnBeforeConnecting=true\n", { "Session.IdleTimeout": "3" }), /Duplicate managed section/);
});

test("creates a missing configuration", () => {
    assert.equal(updateConfig(null, { "Session.IdleTimeout": "0" }, STATIC_SCHEMA), "[Session]\nIdleTimeout = 0\n");
});

test("accepts Cockpit boolean spellings and validates integers", () => {
    for (const [input, expected] of [["true", "true"], ["yes", "true"], ["1", "true"], ["FALSE", "false"], ["no", "false"], ["0", "false"]]) assert.equal(normalizeBoolean(input), expected);
    assert.deepEqual(validateChanges({ "WebService.LoginTo": "maybe" }), { "WebService.LoginTo": "Use true, false, yes, no, 1, or 0." });
    assert.match(validateChanges({ "Session.IdleTimeout": "-1" })["Session.IdleTimeout"], /whole number/);
    assert.deepEqual(validateChanges({ "Session.IdleTimeout": "15" }), {});
});

test("does not materialize absent options and preserves CRLF", () => {
    const input = "[Session]\r\nIdleTimeout=15\r\n";
    assert.equal(updateConfig(input, {}, STATIC_SCHEMA), input);
    assert.equal(updateConfig(input, { "Session.IdleTimeout": "20" }), "[Session]\r\nIdleTimeout=20\r\n");
    assert.equal(updateConfig("", { "Session.WarnBeforeConnecting": "yes" }), "[Session]\nWarnBeforeConnecting = true\n");
});

test("keeps every absent editable option absent until it is changed", () => {
    const parsed = valuesFor("", STATIC_SCHEMA);
    for (const item of STATIC_SCHEMA.filter(item => item.editable)) {
        const option = `${item.section}.${item.key}`;
        assert.equal(parsed.values[option], "");
        assert.equal(parsed.presence[option], false);
    }
    assert.equal(updateConfig("", {}, STATIC_SCHEMA), "");
});

test("parses representative rendered man output, not AsciiDoc markers", () => {
    const rendered = "WebService\n    NewOption\n        A rendered description.\n    Origins\n        Existing option.\n";
    assert.deepEqual(parseRenderedMan(rendered).map(item => item.key), ["NewOption"]);
    assert.deepEqual(parseRenderedMan("== WebService\n*Fake*::\n"), []);
});

test("rejects duplicate sections", () => {
    assert.throws(() => updateConfig("[Session]\nIdleTimeout=1\n[Session]\nWarnBeforeConnecting=true\n", { "Session.IdleTimeout": "3" }), /Duplicate managed section/);
});
