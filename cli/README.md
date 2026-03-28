# @hollway/nextblog-cli

CLI for nextblog — manage posts, notes, and assets from the terminal.

## Installation

### From npm (recommended)

```sh
npm install -g @hollway/nextblog-cli
# or
pnpm add -g @hollway/nextblog-cli
```

### From source

```sh
pnpm install
pnpm build
npm link
```

`npm link` symlinks the package globally, so after any rebuild (`pnpm build`) the `nblog` command reflects the latest `dist/` without reinstalling.

Verify:

```sh
nblog --help
```

To uninstall:

```sh
npm unlink -g @hollway/nextblog-cli
```

## Quick start

```sh
# 1. Point the CLI at your server
nblog config set-server http://localhost:8666

# 2. Log in (prompts for email / password)
nblog login

# 3. Explore
nblog posts list --published
nblog posts search "my query"
nblog notes list
nblog assets list
nblog assets download <fileId> -o output.jpg
nblog assets upload ./photo.png
```

## Commands

| Group             | Commands                                                               |
|-------------------|------------------------------------------------------------------------|
| `config`          | `set-server <url>`, `set-token <token>`, `show`                        |
| `login` / `whoami`| interactive auth, JWT stored in `~/.config/nextblog-cli/data.json`    |
| `posts`           | `list` (--tag, --category, --published), `get <id>`, `search <query>`  |
| `notes`           | `list`, `get <id>`, `search <query>`  *(auth required)*                |
| `assets`          | `list`, `download <id> [-o path]`, `upload <file>`  *(auth required)*  |

All list/search commands support `--page` / `--limit` pagination. Requires Node.js ≥ 18.

## Development

```sh
pnpm install
pnpm dev          # watch mode — rebuilds on file changes
pnpm typecheck    # type-check without emitting
pnpm build        # production build → dist/
```

## Project structure

```
cli/
├── src/
│   ├── index.ts   — commands + formatters
│   ├── config.ts  — ~/.config/nextblog-cli/data.json read/write
│   └── api.ts     — typed fetch wrappers for every endpoint
├── dist/          — compiled output (generated, not committed)
├── tsconfig.json
└── package.json
```

## Publishing to npm

1. Log in to npm:

   ```sh
   npm login
   ```

2. Bump the version:

   ```sh
   npm version patch   # 1.0.1 → 1.0.2
   npm version minor   # 1.0.1 → 1.1.0
   npm version major   # 1.0.1 → 2.0.0
   ```

3. Publish (`prepublishOnly` runs `pnpm build` automatically):

   ```sh
   npm publish --access public
   # or with pnpm:
   pnpm publish --access public --no-git-checks
   ```

   Only `dist/` is included in the package (see `files` in `package.json`).

4. Verify:

   ```sh
   npm info @hollway/nextblog-cli
   ```

> **Tip:** Run `npm pack` first to preview the tarball contents before publishing.
