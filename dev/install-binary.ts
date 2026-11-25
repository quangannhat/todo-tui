import { chmod, copyFile, mkdir } from "node:fs/promises"
import { homedir } from "node:os"
import { join } from "node:path"
import { platform } from "node:process"
import { $ } from "bun"

const root = process.cwd()
await $`bun run ${join(root, "dev/build-binary.ts")}`

const executable = `todo-tui${platform === "win32" ? ".exe" : ""}`
const source = join(root, "dist", executable)
const binDirectory = process.env.TODO_TUI_INSTALL_DIR || join(homedir(), ".local", "bin")
const destination = join(binDirectory, executable)

await mkdir(binDirectory, { recursive: true })
await copyFile(source, destination)
if (platform !== "win32") await chmod(destination, 0o755)
console.log(`Installed ${destination}`)
