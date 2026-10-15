import { build } from "../../../node_modules/esbuild/lib/main.js";
import { sassPlugin } from "../../../node_modules/esbuild-sass-plugin/lib/index.js";

await build({
    entryPoints: ["valkey.scss"],
    outfile: "valkey.css",
    bundle: true,
    minify: false,
    external: ["*.woff", "*.woff2", "../../assets*"],
    nodePaths: ["../../../pkg/lib"],
    plugins: [sassPlugin({
        loadPaths: ["../../../node_modules", "../../../pkg/lib"],
        quietDeps: true,
    })],
});
