import { build } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

await Promise.all([
    build({ entryPoints: ["cockpit-config.scss"], outfile: "cockpit-config.css", bundle: true,
        loader: { ".svg": "dataurl", ".woff2": "dataurl" }, plugins: [sassPlugin({ quietDeps: true, loadPaths: ["../valkey/node_modules"] })] }),
    build({ entryPoints: ["theme.js"], outfile: "cockpit-config-theme.js", bundle: true,
        nodePaths: ["node_modules", "../valkey/node_modules", "../../../node_modules"] }),
    build({ entryPoints: ["cockpit-config.js"], outfile: "cockpit-config.bundle.js", bundle: true,
        nodePaths: ["node_modules", "../valkey/node_modules", "../../../node_modules"], format: "iife", sourcemap: false }),
]);
