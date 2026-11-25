import { useKeyboard, useTerminalDimensions } from "@opentui/react"
import { useEffect, useMemo, useState } from "react"
import { currentRepository, discoverRepositories, loadTodos, saveTodos, type Repository, type Todo } from "./todos.js"

type Filter = "all" | "active" | "done"

const palette = {
  bg: "#101311",
  panel: "#171c18",
  border: "#303a32",
  text: "#e7eee8",
  muted: "#849087",
  green: "#a6d189",
  yellow: "#e5c890",
  red: "#e78284",
}

export function App() {
  const [selected, setSelected] = useState(0)
  const [filter, setFilter] = useState<Filter>("all")
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState("")
  const [description, setDescription] = useState("")
  const [editingDescription, setEditingDescription] = useState(false)
  const [repositories] = useState<Repository[]>(() => discoverRepositories())
  const [repositoryIndex, setRepositoryIndex] = useState(() => {
    const current = currentRepository()
    return Math.max(0, discoverRepositories().findIndex((repo) => repo.path === current.path))
  })
  const [pendingG, setPendingG] = useState(false)
  const [notice, setNotice] = useState("j/k move   gg/G first/last   ctrl-d/u page   space toggle   a add   d delete   q quit")
  const { width, height } = useTerminalDimensions()
  const repository = repositories[repositoryIndex] ?? discoverRepositories()[0] ?? { path: process.cwd(), name: process.cwd() }
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos(repository))

  useEffect(() => saveTodos(repository, todos), [repository, todos])

  const visible = useMemo(
    () => todos.filter((todo) => filter === "all" || (filter === "active" ? !todo.done : todo.done)),
    [todos, filter],
  )
  const completeCount = todos.filter((todo) => todo.done).length

  useKeyboard((key) => {
    if (adding) {
      if (key.name === "escape") {
        setAdding(false)
        setDraft("")
        setDescription("")
        setEditingDescription(false)
      } else if (key.name === "return" && !editingDescription) {
        if (draft.trim()) setEditingDescription(true)
      } else if (key.name === "return") {
        const title = draft.trim()
        if (title) {
          setTodos((current) => [{ id: crypto.randomUUID(), title, description: description.trim(), done: false, createdAt: Date.now() }, ...current])
          setSelected(0)
          setNotice("Task added")
        }
        setAdding(false)
        setDraft("")
        setDescription("")
        setEditingDescription(false)
      } else if (key.name === "backspace") {
        if (editingDescription) setDescription((value) => value.slice(0, -1))
        else setDraft((value) => value.slice(0, -1))
      } else if (key.sequence && key.sequence.length === 1 && key.sequence >= " ") {
        if (editingDescription) setDescription((value) => value + key.sequence)
        else setDraft((value) => value + key.sequence)
      }
      return
    }

    if (key.name === "q" || (key.ctrl && key.name === "c")) process.exit(0)
    if (pendingG) {
      setPendingG(false)
      if (key.name === "g") setSelected(0)
      return
    }
    if (key.name === "g") {
      setPendingG(true)
      return
    }
    if (key.name === "up" || key.name === "k") setSelected((value) => Math.max(0, value - 1))
    if (key.name === "down" || key.name === "j") setSelected((value) => Math.min(visible.length - 1, value + 1))
    if (key.name === "G") setSelected(Math.max(0, visible.length - 1))
    if (key.ctrl && key.name === "d") setSelected((value) => Math.min(Math.max(0, visible.length - 1), value + 5))
    if (key.ctrl && key.name === "u") setSelected((value) => Math.max(0, value - 5))
    if (key.name === "a") {
      setAdding(true)
      setDescription("")
      setEditingDescription(false)
      setNotice("Enter a title, press enter, then add an optional description")
    }
    if (key.name === "r" && repositories.length > 1) {
      const nextIndex = (repositoryIndex + 1) % repositories.length
      setRepositoryIndex(nextIndex)
      setTodos(loadTodos(repositories[nextIndex]!))
      setSelected(0)
      setNotice(`Switched to ${repositories[nextIndex]!.name}`)
    }
    if (key.name === "tab") setFilter((value) => value === "all" ? "active" : value === "active" ? "done" : "all")
    if (key.name === "space" && visible[selected]) {
      const id = visible[selected].id
      setTodos((current) => current.map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo))
    }
    if (key.name === "d" && visible[selected]) {
      const id = visible[selected].id
      setTodos((current) => current.filter((todo) => todo.id !== id))
      setSelected((value) => Math.max(0, Math.min(value, visible.length - 2)))
      setNotice("Task deleted")
    }
  })

  const innerWidth = Math.max(36, Math.min(width - 6, 88))
  const titleWidth = innerWidth - 11
  const clamp = (value: string, length: number) => value.length > length ? `${value.slice(0, length - 1)}…` : value
  const filters: Filter[] = ["all", "active", "done"]

  return (
    <box width={width} height={height} backgroundColor={palette.bg} flexDirection="column" alignItems="center" justifyContent="center">
      <box width={innerWidth} flexDirection="column" border borderStyle="rounded" borderColor={palette.border} backgroundColor={palette.panel} paddingX={2} paddingY={1}>
        <box flexDirection="row" justifyContent="space-between">
          <text content={`  TODAY, TIDIED.  /  ${repository.name}`} fg={palette.green} />
          <text content={`${completeCount}/${todos.length} complete  `} fg={palette.muted} />
        </box>
        <box marginTop={1} flexDirection="row">
          <text content="  Your day, one thing at a time." fg={palette.text} />
        </box>
        <box marginTop={1} flexDirection="row">
          {filters.map((item) => (
            <text key={item} content={` ${item === filter ? "●" : "○"} ${item.toUpperCase()}  `} fg={item === filter ? palette.green : palette.muted} />
          ))}
          <text content="                         TAB TO SWITCH" fg={palette.muted} />
        </box>
        <box marginTop={1} flexDirection="column">
          {visible.length === 0 ? (
            <box paddingY={1}><text content={filter === "done" ? "  Nothing completed yet." : "  All clear. Add a task to get started."} fg={palette.muted} /></box>
          ) : visible.map((todo, index) => (
            <box key={todo.id} flexDirection="row" backgroundColor={index === selected ? "#222b24" : palette.panel} paddingX={1}>
              <text content={index === selected ? "› " : "  "} fg={palette.green} />
              <text content={todo.done ? "✓ " : "○ "} fg={todo.done ? palette.green : palette.muted} />
              <text content={clamp(todo.title, titleWidth)} fg={todo.done ? palette.muted : palette.text} />
              <text content={todo.done ? "  DONE" : ""} fg={palette.green} />
            </box>
          ))}
          {adding && (
            <box marginTop={1} flexDirection="row" paddingX={1}>
              <text content="+ " fg={palette.green} />
              <text content={editingDescription ? `Description: ${description || "optional"}▏` : `${draft || "What needs doing?"}▏`} fg={draft ? palette.text : palette.muted} />
            </box>
          )}
          {!adding && visible[selected]?.description && (
            <box marginTop={1} paddingX={2}>
              <text content={`↳ ${clamp(visible[selected].description, innerWidth - 10)}`} fg={palette.muted} />
            </box>
          )}
        </box>
        <box marginTop={1} flexDirection="row">
          <text content="  ─────────────────────────────────────────────────────────────────────────" fg={palette.border} />
        </box>
        <box marginTop={1} flexDirection="row">
          <text content={`  ${notice}`} fg={notice.includes("deleted") ? palette.red : palette.muted} />
        </box>
        {repositories.length > 1 && <box flexDirection="row"><text content={`  ${repositories.length} repos · r switch repository`} fg={palette.muted} /></box>}
      </box>
      <box marginTop={1} flexDirection="row">
        <text content="  A SMALL LIST IS A KINDNESS TO YOUR FUTURE SELF  " fg={palette.muted} />
      </box>
    </box>
  )
}
