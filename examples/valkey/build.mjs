import { build } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

await Promise.all([
    build({
        entryPoints: ["valkey.scss"],
        outfile: "valkey.css",
        bundle: true,
        minify: false,
        plugins: [sassPlugin({
            quietDeps: true,
        })],
    }),
    build({
        entryPoints: ["theme.js"],
        outfile: "valkey-theme.js",
        bundle: true,
        minify: false,
        nodePaths: ["node_modules", "../../../pkg/lib"],
    }),
]);
