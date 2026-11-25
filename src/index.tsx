#!/usr/bin/env bun
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"
import { App } from "./App.js"
import { currentRepository, loadTodos, saveTodos, sendNotification, type Todo } from "./todos.js"

process.env.OTUI_USE_ALTERNATE_SCREEN = "true"

const args = process.argv.slice(2)
if (args[0] === "--version" || args[0] === "-v" || args[0] === "version") {
  console.log("todo-tui 0.1.0")
  process.exit(0)
}
if (args[0] === "--help" || args[0] === "-h" || args[0] === "help") {
  console.log(`todo-tui — repository-scoped terminal todo list

Usage:
  todo-tui                         Open the TUI
  todo-tui task list [--repo PATH]
  todo-tui task add <title> [--description TEXT] [--repo PATH]
  todo-tui task done <id> [--repo PATH]
  todo-tui task delete <id> [--repo PATH]
  todo-tui --version`)
  process.exit(0)
}
if (args[0] === "task") {
  const action = args[1]
  const repoFlag = args.indexOf("--repo")
  const repository = currentRepository(repoFlag >= 0 ? args[repoFlag + 1] : process.cwd())
  const todos = loadTodos(repository)
  const taskId = args.find((arg, index) => index > 1 && !arg.startsWith("--") && index !== repoFlag + 1)
  if (action === "list") {
    console.log(JSON.stringify({ repository: repository.path, todos }, null, 2))
    process.exit(0)
  }
  if (action === "add") {
    const titleIndex = args.indexOf("--title")
    const descriptionIndex = args.indexOf("--description")
    const title = titleIndex >= 0 ? args[titleIndex + 1] : taskId
    if (!title) {
      console.error("Usage: todo-tui task add <title> [--description <text>] [--repo <path>]")
      process.exit(2)
    }
    const description = descriptionIndex >= 0 ? args[descriptionIndex + 1] || "" : ""
    const todo: Todo = { id: crypto.randomUUID(), title, description, done: false, createdAt: Date.now() }
    saveTodos(repository, [todo, ...todos])
    sendNotification(`Task added · ${repository.name}`, title)
    console.log(todo.id)
    process.exit(0)
  }
  if ((action === "done" || action === "delete") && taskId) {
    const updated = action === "done"
      ? todos.map((todo) => todo.id === taskId ? { ...todo, done: true } : todo)
      : todos.filter((todo) => todo.id !== taskId)
    if (updated.length === todos.length && !todos.some((todo) => todo.id === taskId)) {
      console.error(`No task found with id: ${taskId}`)
      process.exit(1)
    }
    saveTodos(repository, updated)
    if (action === "done") {
      const todo = todos.find((item) => item.id === taskId)!
      sendNotification(`Task completed · ${repository.name}`, todo.title)
    }
    process.exit(0)
  }
  console.error("Usage: todo-tui task <list|add|done|delete> [arguments]")
  process.exit(2)
}

const renderer = await createCliRenderer({ exitOnCtrlC: false, screenMode: "alternate-screen" })
createRoot(renderer).render(<App />)
