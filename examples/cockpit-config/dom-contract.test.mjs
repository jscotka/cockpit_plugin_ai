import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { assetRevisionMatches, canSave, missingRequiredIds, modifyAndRefresh } from "./save-flow.js";

const html = await readFile(new URL("./cockpit-config.html", import.meta.url), "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));

function literalLookups(source) {
    return [...source.matchAll(/\$\("([^"]+)"\)/g)].map(match => match[1]);
}

test("every literal DOM lookup has a matching HTML element", async () => {
    for (const file of ["cockpit-config.js", "cockpit-config.bundle.js"]) {
        const lookups = literalLookups(await readFile(new URL(`./${file}`, import.meta.url), "utf8"));
        assert.ok(lookups.length, `${file} contains no literal DOM lookups`);
        for (const id of new Set(lookups))
            assert.ok(ids.has(id), `${file} looks up missing HTML id '${id}'`);
    }
});

test("the startup contract includes the revision marker and disabled Save", () => {
    assert.match(html, /data-cockpit-config-revision="cockpit-config-v3"/);
    assert.match(html, /id="save"[^>]*disabled/);
});

test("the standalone main keeps the page content in one full-width flow", () => {
    assert.match(html, /<div class="cockpit-config-root"[^>]*>\s*<main tabindex="-1">/);
    assert.doesNotMatch(html, /<main[^>]*class=/);
    assert.match(html, /<h1[^>]*id="title"[\s\S]*?<p[^>]*id="global-status"/);
    assert.match(html, /<div class="pf-v6-c-tabs"[\s\S]*?<section class="pf-v6-c-tab-content"/);
    assert.match(html, /<div class="config-actions"[\s\S]*?id="save"/);
});

test("Save remains blocked after load failure and before DOM readiness", () => {
    assert.equal(canSave({ domReady: false, loaded: true, file: {} }), false);
    assert.equal(canSave({ domReady: true, loaded: false, file: {} }), false);
    assert.equal(canSave({ domReady: true, loaded: true, file: {} }), true);
});

test("a missing state element is detected by the startup contract", () => {
    assert.deepEqual(missingRequiredIds(new Set(["global-status", "editable-grid"]), ["global-status", "editable-grid", "editable-state"]), ["editable-state"]);
});

test("a successful modify followed by render failure is reported as saved", async () => {
    const result = await modifyAndRefresh({ modify: async () => {} }, () => {}, async () => { throw new Error("missing state"); });
    assert.equal(result.saved, true);
    assert.match(result.refreshError.message, /missing state/);
});

test("a modify failure remains a write failure", async () => {
    const result = await modifyAndRefresh({ modify: async () => { throw new Error("permission denied"); } }, () => {}, async () => {});
    assert.equal(result.saved, false);
    assert.match(result.error.message, /permission denied/);
});

test("mixed HTML and bundle revisions are rejected", () => {
    assert.equal(assetRevisionMatches("cockpit-config-v3", "cockpit-config-v3"), true);
    assert.equal(assetRevisionMatches("cockpit-config-v2", "cockpit-config-v3"), false);
    assert.equal(assetRevisionMatches(undefined, "cockpit-config-v3"), false);
});

test("boolean controls use an inline accessible check structure", async () => {
    for (const file of ["cockpit-config.js", "cockpit-config.bundle.js"]) {
        const source = await readFile(new URL(`./${file}`, import.meta.url), "utf8");
        assert.match(source, /pf-v6-c-check/);
        assert.match(source, /pf-v6-c-check__input/);
        assert.match(source, /pf-v6-c-check__label/);
        assert.match(source, /setAttribute\("aria-describedby", help\.id\)/);
        assert.match(source, /check\.append\(input, label\).*field\.append\(check, help\)/s);
        assert.match(source, /field\.append\(label, help, input\)/);
    }
});

test("save is guarded when loading did not produce a file handle", async () => {
    const source = await readFile(new URL("./cockpit-config.js", import.meta.url), "utf8");
    assert.match(source, /if \(!canSave\(state\)\) \{ status\(/);
    assert.match(source, /state\.file = null; status\(_\("Loading/);
});
