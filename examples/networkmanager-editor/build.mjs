import { build } from "esbuild";
import { resolve } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import * as sass from "sass";

const pfCss = resolve("node_modules/@patternfly/patternfly/patternfly.css");

await Promise.all([
    build({ entryPoints: ["src/app.js"], outfile: "dist/networkmanager-editor.js", bundle: true, format: "iife", sourcemap: false, nodePaths: ["node_modules", "../../../node_modules", "../../../pkg/lib"] }),
    (async () => { const local = sass.compile("src/networkmanager.scss", { style: "expanded" }).css; await writeFile("dist/networkmanager-editor.css", `${await readFile(pfCss, "utf8")}\n${local}`); })(),
]);
