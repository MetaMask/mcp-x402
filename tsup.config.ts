import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: false,
  clean: true,
  outDir: "build",
  sourcemap: true,
  minify: false,
  target: "node20",
  external: [],
  async onSuccess() {
    const { copyFile } = await import("fs/promises");
    await copyFile("package.json", "build/package.json");
  },
});
