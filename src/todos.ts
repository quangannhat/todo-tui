import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import { readdirSync, statSync } from "node:fs"
import { basename, join, resolve } from "node:path"

export type Todo = {
  id: string
  title: string
  description: string
  done: boolean
  createdAt: number
}

export type Repository = { path: string; name: string }

const dataRoot = () => {
  const directory = process.env.TODO_TUI_DATA_DIR || join(process.env.XDG_DATA_HOME || join(process.env.HOME || ".", ".local", "share"), "todo-tui")
  mkdirSync(directory, { recursive: true })
  return directory
}

export function currentRepository(cwd = process.cwd()): Repository {
  try {
    const path = execFileSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
    return { path, name: basename(path) }
  } catch {
    return { path: resolve(cwd), name: basename(resolve(cwd)) || cwd }
  }
}

export function discoverRepositories(): Repository[] {
  const repos = new Map<string, Repository>()
  const add = (path: string) => {
    try {
      const repo = currentRepository(path)
      repos.set(repo.path, repo)
    } catch {}
  }
  add(process.cwd())
  const configured = (process.env.TODO_TUI_REPO_DIRS || "").split(process.platform === "win32" ? ";" : ":").filter(Boolean)
  for (const base of configured) {
    const walk = (path: string, depth: number) => {
      try {
        if (statSync(join(path, ".git")).isDirectory() || statSync(join(path, ".git")).isFile()) {
          add(path)
          return
        }
      } catch {}
      if (depth === 0) return
      try {
        for (const entry of readdirSync(path, { withFileTypes: true })) {
          if (entry.isDirectory() && !entry.name.startsWith(".")) walk(join(path, entry.name), depth - 1)
        }
      } catch {}
    }
    walk(resolve(base), 4)
  }
  return [...repos.values()].sort((a, b) => a.name.localeCompare(b.name))
}

const dataPath = (repository: Repository) => {
  const hash = createHash("sha256").update(repository.path).digest("hex").slice(0, 16)
  const directory = join(dataRoot(), "repositories", hash)
  mkdirSync(directory, { recursive: true })
  return join(directory, "todos.json")
}

export function loadTodos(repository: Repository): Todo[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(dataPath(repository), "utf8"))
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is Todo =>
      item !== null && typeof item === "object" &&
      typeof item.id === "string" && typeof item.title === "string" &&
      typeof item.done === "boolean" && typeof item.createdAt === "number",
    ).map((item) => ({ ...item, description: typeof item.description === "string" ? item.description : "" }))
  } catch {
    return []
  }
}

export function saveTodos(repository: Repository, todos: Todo[]): void {
  try {
    writeFileSync(dataPath(repository), `${JSON.stringify(todos, null, 2)}\n`, "utf8")
  } catch (error) {
    console.error("Could not save tasks:", error)
  }
}

export function sendNotification(title: string, message: string): void {
  const platform = process.platform
  if (platform === "darwin") {
    spawnSync("osascript", ["-e", `display notification ${JSON.stringify(message)} with title ${JSON.stringify(title)}`], { stdio: "ignore" })
  } else if (platform === "linux") {
    spawnSync("notify-send", [title, message], { stdio: "ignore" })
  } else if (platform === "win32") {
    const script = `[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null; $t=[Windows.UI.Notifications.ToastTemplateType]::ToastText02; $x=[Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent($t); $n=$x.GetElementsByTagName('text'); $n.Item(0).AppendChild($x.CreateTextNode(${JSON.stringify(title)})) > $null; $n.Item(1).AppendChild($x.CreateTextNode(${JSON.stringify(message)})) > $null; [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('Todo TUI').Show([Windows.UI.Notifications.ToastNotification]::new($x))`
    spawnSync("powershell", ["-NoProfile", "-Command", script], { stdio: "ignore" })
  }
}
