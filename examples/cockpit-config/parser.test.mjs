import test from "node:test";
import assert from "node:assert/strict";
import { STATIC_SCHEMA, normalizeBoolean, parseConfig, parseRenderedMan, updateConfig, validateChanges, validateSchema, valuesFor } from "./parser.js";

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

test("validates every schema-defined text and structured option", () => {
    const cases = {
        "WebService.Origins": ["https://example.com https://*.example.com", "not-an-origin"],
        "WebService.ProtocolHeader": ["X-Forwarded-Proto", "Bad Header"],
        "WebService.ForwardedForHeader": ["X-Forwarded-For", "X\nBad"],
        "WebService.LoginTitle": ["A safe title", "bad#comment"],
        "WebService.MaxStartups": ["10:30:60", "60:30:10"],
        "WebService.UrlRoot": ["/cockpit-new", "/cockpit"],
        "WebService.Shell": ["shell/index.html", "/etc/passwd"],
        "WebService.CustomLoginPage": ["/usr/share/cockpit/login", "relative"],
        "Session.Banner": ["/etc/issue", "banner;bad"],
        "Log.Fatal": ["criticals warnings", "debug"],
        "OAuth.URL": ["https://auth.example/authorize", "javascript:alert(1)"],
        "OAuth.ErrorParam": ["error_description", "error param"],
        "OAuth.TokenParam": ["access_token", "access token"]
    };
    for (const [option, [good, bad]] of Object.entries(cases)) {
        assert.deepEqual(validateChanges({ [option]: good }), {}, `${option} accepts its example`);
        assert.ok(validateChanges({ [option]: bad })[option], `${option} rejects invalid input`);
    }
});

test("validates documented origins and reserved URL roots", () => {
    for (const good of ["https://example.com", "http://example.com:9090", "https://*.example.com", "https://\\[::1\\]:9090"]) assert.deepEqual(validateChanges({ "WebService.Origins": good }), {}, good);
    for (const bad of ["https://example.com/path", "https://example.com:9090/path", "https://[::1]:9090", "ftp://example.com", "https://example.com:"]) assert.ok(validateChanges({ "WebService.Origins": bad })["WebService.Origins"], bad);
    for (const good of ["/cockpit-new", "/admin/cockpit", "/cockpit-new/path"]) assert.deepEqual(validateChanges({ "WebService.UrlRoot": good }), {}, good);
    for (const bad of ["/cockpit", "/cockpit/", "/cockpit++", "/cockpit+new/", "/cockpit+proxy"]) assert.ok(validateChanges({ "WebService.UrlRoot": bad })["WebService.UrlRoot"], bad);
});

test("requires a non-zero MaxStartups rate and ordered bounds", () => {
    assert.deepEqual(validateChanges({ "WebService.MaxStartups": "10:1:60" }), {});
    for (const bad of ["10:0:60", "10:101:60", "60:30:10", "4294967296:30:60"]) assert.ok(validateChanges({ "WebService.MaxStartups": bad })["WebService.MaxStartups"], bad);
});

test("does not materialize absent options and preserves CRLF", () => {
    const input = "[Session]\r\nIdleTimeout=15\r\n";
    assert.equal(updateConfig(input, {}, STATIC_SCHEMA), input);
    assert.equal(updateConfig(input, { "Session.IdleTimeout": "20" }), "[Session]\r\nIdleTimeout=20\r\n");
    assert.equal(updateConfig("", { "Session.WarnBeforeConnecting": "yes" }), "[Session]\nWarnBeforeConnecting = true\n");
});

test("empty editable values remove directives instead of writing empty assignments", () => {
    const input = "# keep\n[WebService]\nCustomLoginPage = /tmp/login # note\nOrigins = https://example.com\nUrlRoot = /admin\nOAuth = unknown\n\n[Session]\r\nBanner=/etc/issue\r\n";
    const result = updateConfig(input, {
        "WebService.CustomLoginPage": "",
        "WebService.Origins": "",
        "WebService.UrlRoot": "",
        "Session.Banner": "",
    });
    assert.doesNotMatch(result, /CustomLoginPage\s*[=:]\s*(?:#|$)/m);
    assert.doesNotMatch(result, /Origins\s*[=:]\s*(?:#|$)/m);
    assert.doesNotMatch(result, /UrlRoot\s*[=:]\s*(?:#|$)/m);
    assert.doesNotMatch(result, /Banner\s*[=:]\s*$/m);
    assert.match(result, /# keep/);
    assert.match(result, /# note/);
    assert.match(result, /OAuth = unknown/);
    assert.match(result, /\r\n/);
    assert.equal(updateConfig("[OAuth]\nURL=https://auth.example\n", { "OAuth.URL": "" }), "");
    assert.equal(updateConfig("[OAuth]\n", { "OAuth.URL": "" }), "[OAuth]\n");
    assert.equal(updateConfig("[OAuth]\n# keep this section\nURL=https://auth.example\n", { "OAuth.URL": "" }), "[OAuth]\n# keep this section\n");
    assert.equal(updateConfig("[OAuth]\n", { "OAuth.URL": "" }), "[OAuth]\n");
    assert.equal(updateConfig("", { "OAuth.URL": "" }), "");
});

test("absent booleans retain presence separately from schema defaults", () => {
    const parsed = valuesFor("[Session]\nWarnBeforeConnecting=false\n[WebService]\nLoginTo=false\n", STATIC_SCHEMA);
    assert.equal(parsed.values["Session.WarnBeforeConnecting"], "false");
    assert.equal(parsed.presence["Session.WarnBeforeConnecting"], true);
    assert.equal(valuesFor("", STATIC_SCHEMA).presence["Session.WarnBeforeConnecting"], false);
    assert.equal(STATIC_SCHEMA.find(item => item.key === "WarnBeforeConnecting").default, true);
    assert.equal(STATIC_SCHEMA.find(item => item.key === "LoginTo").default, undefined);
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
    const result = parseRenderedMan(rendered);
    assert.deepEqual(result.extra, ["WebService.NewOption"]);
    assert.equal(result.mismatch, true);
    assert.equal(parseRenderedMan("== WebService\n*Fake*::\n").malformed, true);
});

test("rejects duplicate sections", () => {
    assert.throws(() => updateConfig("[Session]\nIdleTimeout=1\n[Session]\nWarnBeforeConnecting=true\n", { "Session.IdleTimeout": "3" }), /Duplicate managed section/);
});

const valid = (option = {}) => ({ schemaRevision: 1, compatibility: "test", source: "test", sections: [{ name: "Test", options: [{ key: "Value", type: "boolean", editable: true, validation: { kind: "boolean" }, help: "A bounded setting.", examples: ["true"], securityRationale: "Boolean is bounded.", ...option }] }] });

test("rejects unsafe or malformed schema manifests", () => {
    assert.throws(() => validateSchema({ ...valid(), sections: [{ name: "Test", options: [{ ...valid().sections[0].options[0] }, { ...valid().sections[0].options[0] }] }] }), /Duplicate schema option/);
    assert.throws(() => validateSchema({ ...valid(), sections: [{ name: "Test", options: valid().sections[0].options }, { name: "test", options: valid().sections[0].options }] }), /Duplicate schema section/);
    assert.throws(() => validateSchema(valid({ type: "string" })), /Unsupported schema type/);
    assert.throws(() => validateSchema(valid({ type: "integer", min: 10, max: 1 })), /Invalid integer bounds/);
    assert.throws(() => validateSchema(valid({ help: "", examples: [], placeholder: "" })), /Schema help/);
    assert.throws(() => validateSchema(valid({ examples: [], placeholder: "" })), /example or placeholder/);
    assert.throws(() => validateSchema(valid({ type: "text", editable: true, validation: undefined })), /Validation metadata/);
    assert.throws(() => validateSchema(valid({ validation: {} })), /Validation metadata/);
    assert.throws(() => validateSchema(valid({ securityRationale: "" })), /Security rationale/);
    assert.throws(() => validateSchema(valid({ editable: false })), /must be editable/);
     assert.doesNotThrow(() => validateSchema(valid({ category: "legacy-ui-only", categoryOrder: 0 })));
});

test("checked-in options omit UI grouping metadata and preserve schema order", () => {
    assert.ok(STATIC_SCHEMA.every(item => item.category === undefined && item.categoryOrder === undefined));
    assert.deepEqual(STATIC_SCHEMA.filter(item => item.section === "WebService").map(item => item.key), ["Origins", "ProtocolHeader", "ForwardedForHeader", "LoginTitle", "LoginTo", "RequireHost", "AllowMultiHost", "MaxStartups", "MaxConcurrentConnections", "AllowUnencrypted", "UrlRoot", "ClientCertAuthentication", "Shell", "CustomLoginPage"]);
});
