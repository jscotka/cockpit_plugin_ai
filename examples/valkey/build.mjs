import { build } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";

await build({
    entryPoints: ["valkey.scss"],
    outfile: "valkey.css",
    bundle: true,
    minify: false,
    external: ["*.woff", "*.woff2", "*.svg", "../../assets*"],
    nodePaths: ["node_modules", "../../../pkg/lib"],
    plugins: [sassPlugin({
        loadPaths: ["node_modules", "../../../pkg/lib"],
        quietDeps: true,
    })],
});
