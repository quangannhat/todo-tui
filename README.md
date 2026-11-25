# todo-tui

A keyboard-first, repository-scoped todo list built with Bun, React, and OpenTUI.

## Run

```sh
bun install
bun run dev
```

## Install a standalone binary

Build and install a self-contained executable into `~/.local/bin`:

```sh
bun install
bun run install:binary
```

The installed binary does not need Bun at runtime. Ensure `~/.local/bin` is on
your `PATH`. To choose another destination, set `TODO_TUI_INSTALL_DIR`. To only
build without installing, run `bun run build:binary`; the executable is written
to `dist/todo-tui`.

Tasks are stored separately for each Git repository under
`~/.local/share/todo-tui/repositories/`. Outside a Git repository, the current
directory is used as the scope. Set `TODO_TUI_DATA_DIR` to change the data
location.

Set `TODO_TUI_REPO_DIRS` to one or more directories (colon-separated on
Linux/macOS, semicolon-separated on Windows) to discover repositories for
browsing. Press `r` in the TUI to cycle through discovered repositories.

## Agent CLI

Install/link the package or run the entrypoint with Bun. Agents can use the
same repository-scoped store:

```sh
todo-tui task list
todo-tui task add "Fix the failing tests" --description "Start with the API suite"
todo-tui task done <task-id>
todo-tui task delete <task-id>
todo-tui task list --repo /path/to/another/repo
```

Adding or completing a task sends a native desktop notification through the
system notification service, so the OS notification settings remain in charge.
