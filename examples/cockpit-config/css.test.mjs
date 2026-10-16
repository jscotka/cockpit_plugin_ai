import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("generated CSS contains the standalone PatternFly v6 components without shell Page layout", async () => {
    const css = await readFile(new URL("./cockpit-config.css", import.meta.url), "utf8");
    for (const selector of [".pf-v6-c-title", ".pf-v6-c-card", ".pf-v6-c-button", ".pf-v6-c-form", ".pf-v6-c-form__group", ".pf-v6-c-form__label-text", ".pf-v6-c-form-control", ".pf-v6-c-helper-text", ".pf-v6-c-check", ".pf-v6-c-alert", ".pf-v6-theme-dark"])
        assert.match(css, new RegExp(selector.replaceAll(".", "\\.")), `${selector} is missing from generated CSS`);
    assert.doesNotMatch(css, /(?:^|[,{\s])\.pf-v6-c-page(?:\s*[{,:]|$)/i, "standalone CSS must not include the PatternFly Page root selector");
    assert.doesNotMatch(css, /\.pf-v6-c-page__sidebar|18\.125rem\s+1fr/i, "standalone CSS must not include the Page sidebar grid");
    assert.match(css, /:focus-visible|:focus-within/, "focus CSS is missing");
    assert.match(css, /:disabled|disabled/, "disabled CSS is missing");
    assert.match(css, /--pf-t--global--/, "PatternFly semantic theme tokens are missing");
    assert.match(css, /@media \(max-width: 600px\)/, "responsive CSS is missing");
    assert.match(css, /\.cockpit-config-root\s*\{[^}]*width:\s*100%/s, "standalone root is not full width");
    assert.match(css, /\.cockpit-config-root > main,[\s\S]*?\.cockpit-config-root \.config-panel\s*\{\s*width:\s*100%/s, "main and configuration panel are not full width");
    assert.match(css, /\.config-grid\s*\{[\s\S]*?align-items:\s*start/s, "configuration cards should align to the start");
    assert.doesNotMatch(css, /pf-v5-/i, "generated CSS must not mix PatternFly v5 selectors");
    const html = await readFile(new URL("./cockpit-config.html", import.meta.url), "utf8");
    assert.match(html, /<main(?:\s[^>]*)?>/);
    assert.doesNotMatch(html, /<main[^>]*class="[^"]*pf-v6-c-page/);
    assert.doesNotMatch(html, /pf-v5-/);
    assert.doesNotMatch(html, /readonly|tab-list|tab-editable|pf-v6-c-tabs|pf-v6-c-tab-content/i);
});

test("generated bundle contains the checked-in manifest revision and comparison-only man handling", async () => {
    const bundle = await readFile(new URL("./cockpit-config.bundle.js", import.meta.url), "utf8");
    assert.match(bundle, /schemaRevision:\s*4/);
    assert.match(bundle, /manifest remains authoritative/);
    assert.doesNotMatch(bundle, /type:\s*"text",\s*editable:\s*false,\s*help:\s*"Read-only: cockpit\.conf/);
});

test("HTML and generated bundle carry the same runtime asset revision", async () => {
    const bundle = await readFile(new URL("./cockpit-config.bundle.js", import.meta.url), "utf8");
    const html = await readFile(new URL("./cockpit-config.html", import.meta.url), "utf8");
    const packageJson = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));
    assert.equal(packageJson.cockpitConfigRevision, "cockpit-config-v5");
    assert.match(html, /data-cockpit-config-revision="cockpit-config-v5"/);
    assert.match(bundle, /ASSET_REVISION\s*=\s*["']cockpit-config-v5["']/);
    assert.match(bundle, /assetRevisionMatches/);
    for (const file of ["cockpit-config.css", "cockpit-config-theme.js", "cockpit-config.bundle.js"])
        assert.match(await readFile(new URL(`./${file}`, import.meta.url), "utf8"), /cockpit-config asset revision: cockpit-config-v5/);
});
