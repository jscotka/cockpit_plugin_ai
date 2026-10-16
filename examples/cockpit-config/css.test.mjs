import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("generated CSS contains the standalone PatternFly v6 page components", async () => {
    const css = await readFile(new URL("./cockpit-config.css", import.meta.url), "utf8");
    for (const selector of [".pf-v6-c-page", ".pf-v6-c-card", ".pf-v6-c-button", ".pf-v6-c-tabs", ".pf-v6-c-form-control", ".pf-v6-c-form-control:focus-visible", ".pf-v6-c-form-control:disabled", "[aria-invalid=\"true\"]", ".config-field-error", ".pf-v6-theme-dark"])
        assert.match(css, new RegExp(selector.replaceAll(".", "\\.")), `${selector} is missing from generated CSS`);
    assert.match(css, /@media \(max-width: 600px\)/, "responsive CSS is missing");
    assert.doesNotMatch(css, /pf-v5-/i, "generated CSS must not mix PatternFly v5 selectors");
    assert.match(await readFile(new URL("./cockpit-config.html", import.meta.url), "utf8"), /pf-v6-c-/g);
    assert.doesNotMatch(await readFile(new URL("./cockpit-config.html", import.meta.url), "utf8"), /pf-v5-/);
});
