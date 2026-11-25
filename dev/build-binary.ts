import { mkdir } from "node:fs/promises"
import { join } from "node:path"
import { arch, platform } from "node:process"

const targets: Record<string, string> = {
  "linux-x64": "bun-linux-x64",
  "linux-arm64": "bun-linux-arm64",
  "darwin-x64": "bun-darwin-x64",
  "darwin-arm64": "bun-darwin-arm64",
  "win32-x64": "bun-windows-x64",
  "win32-arm64": "bun-windows-arm64",
}

const target = targets[`${platform}-${arch}`]
if (!target) throw new Error(`Unsupported binary target: ${platform}-${arch}`)

const opentuiPlatforms = [
  "darwin-x64",
  "darwin-arm64",
  "linux-x64",
  "linux-arm64",
  "linux-x64-musl",
  "linux-arm64-musl",
  "win32-x64",
  "win32-arm64",
]
const hostPackage = `@opentui/core-${platform === "win32" ? "win32" : platform}-${arch}`
const externals = opentuiPlatforms
  .map((name) => `@opentui/core-${name}`)
  .filter((name) => name !== hostPackage)
  .flatMap((name) => [`--external=${name}`])

const root = process.cwd()
const outputDirectory = join(root, "dist")
const output = join(outputDirectory, `todo-tui${platform === "win32" ? ".exe" : ""}`)
await mkdir(outputDirectory, { recursive: true })

const result = Bun.spawnSync({
  cmd: ["bun", "build", "--compile", "--bytecode", "--format=esm", ...externals, `--target=${target}`, `--outfile=${output}`, "src/index.tsx"],
  cwd: root,
  stdout: "inherit",
  stderr: "inherit",
})
if (result.exitCode !== 0) process.exit(result.exitCode ?? 1)

console.log(`Built ${output}`)
