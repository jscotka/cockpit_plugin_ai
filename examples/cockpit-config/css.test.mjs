import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("generated CSS contains the standalone PatternFly v6 page components", async () => {
    const css = await readFile(new URL("./cockpit-config.css", import.meta.url), "utf8");
    for (const selector of [".pf-v6-c-page", ".pf-v6-c-title", ".pf-v6-c-card", ".pf-v6-c-button", ".pf-v6-c-tabs", ".pf-v6-c-form", ".pf-v6-c-form-control", ".pf-v6-c-helper-text", ".pf-v6-c-check", ".pf-v6-c-alert", ".pf-v6-theme-dark"])
        assert.match(css, new RegExp(selector.replaceAll(".", "\\.")), `${selector} is missing from generated CSS`);
    assert.match(css, /:focus-visible|:focus-within/, "focus CSS is missing");
    assert.match(css, /:disabled|disabled/, "disabled CSS is missing");
    assert.match(css, /--pf-t--global--/, "PatternFly semantic theme tokens are missing");
    assert.match(css, /@media \(max-width: 600px\)/, "responsive CSS is missing");
    assert.doesNotMatch(css, /pf-v5-/i, "generated CSS must not mix PatternFly v5 selectors");
    assert.match(await readFile(new URL("./cockpit-config.html", import.meta.url), "utf8"), /pf-v6-c-/g);
    assert.doesNotMatch(await readFile(new URL("./cockpit-config.html", import.meta.url), "utf8"), /pf-v5-/);
});

test("generated bundle contains the checked-in manifest revision and comparison-only man handling", async () => {
    const bundle = await readFile(new URL("./cockpit-config.bundle.js", import.meta.url), "utf8");
    assert.match(bundle, /schemaRevision:\s*2/);
    assert.match(bundle, /manifest remains authoritative/);
    assert.doesNotMatch(bundle, /type:\s*"text",\s*editable:\s*false,\s*help:\s*"Read-only: cockpit\.conf/);
});

test("HTML and generated bundle carry the same runtime asset revision", async () => {
    const bundle = await readFile(new URL("./cockpit-config.bundle.js", import.meta.url), "utf8");
    const html = await readFile(new URL("./cockpit-config.html", import.meta.url), "utf8");
    const packageJson = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));
    assert.equal(packageJson.cockpitConfigRevision, "cockpit-config-v3");
    assert.match(html, /data-cockpit-config-revision="cockpit-config-v3"/);
    assert.match(bundle, /ASSET_REVISION\s*=\s*["']cockpit-config-v3["']/);
    assert.match(bundle, /assetRevisionMatches/);
    for (const file of ["cockpit-config.css", "cockpit-config-theme.js", "cockpit-config.bundle.js"])
        assert.match(await readFile(new URL(`./${file}`, import.meta.url), "utf8"), /cockpit-config asset revision: cockpit-config-v3/);
});
