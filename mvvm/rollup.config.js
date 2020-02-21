
import babel from "rollup-plugin-babel";

export default {
    input: "./src/index.js",
    output: {
        file: "./dest/index.js",
        format: "iife",
        sourcemap: true
    },
    plugins: [
        babel()
    ]
}