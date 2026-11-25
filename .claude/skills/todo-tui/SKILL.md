---
name: todo-tui
description: Use the Todo TUI CLI to inspect and manage repository-scoped tasks for the user, including agent-created tasks and task notifications.
---

# Todo TUI

Use this skill when the user asks to remember, track, list, complete, or remove a task in Todo TUI, or asks what tasks exist for a repository.

## Find and invoke the CLI

Prefer the `todo-tui` executable if it is on `PATH`. Otherwise, from this repository run:

```sh
bun run src/index.tsx task <action> ...
```

If this repository is not the Todo TUI checkout, locate the user's Todo TUI checkout and run `bun run <checkout>/src/index.tsx task ...`. Do not silently replace it with a different task store.

## Repository scope

- The default scope is the Git repository containing the current working directory. Outside Git, the current directory is used.
- Always respect the user's intended repository. When it is not the current repo, pass `--repo /absolute/path/to/repository`.
- Todos are isolated per repository. Do not assume another repository's tasks are visible in the current repo's list.
- Use `task list` to inspect tasks. It prints JSON including each task's `id`, `title`, `description`, and `done` state.

## Commands

```sh
todo-tui task list [--repo PATH]
todo-tui task add "Title" [--description "Details"] [--repo PATH]
todo-tui task done TASK_ID [--repo PATH]
todo-tui task delete TASK_ID [--repo PATH]
```

When invoking via Bun, put `bun run src/index.tsx` (or the checkout's absolute entrypoint path) before `task`.

- Ask the user before deleting a task unless they explicitly requested deletion.
- To complete or delete, first obtain the exact task ID from `task list`; do not guess IDs or select by title when titles may be ambiguous.
- Include meaningful context in `--description` when creating a task on behalf of an agent, such as the requested outcome or relevant file/issue reference. Do not put secrets in task descriptions.
- After creating a task, report the task title and repository. The CLI attempts to send a native OS notification on task creation and completion; do not claim delivery is guaranteed because OS notification services/settings may suppress it.
- For updates not supported by the CLI (such as editing an existing title or description), explain that limitation rather than modifying the backing JSON directly.
