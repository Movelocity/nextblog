
## Structure
```shell
  cli/
  ├── package.json
  └── src/
      ├── index.js   — commands + formatters
      ├── config.js  — ~/.config/nextblog-cli/data.json read/write
      └── api.js     — typed fetch wrappers for every endpoint
```

## Quick-start:
```shell
  cd cli && pnpm install
  node src/index.js config set-server http://localhost:8666
  node src/index.js login
  # then use:
  node src/index.js posts list --published
  node src/index.js posts search "my query"
  node src/index.js notes list
  node src/index.js notes search "keyword"
  node src/index.js assets list
  node src/index.js assets download <fileId> -o output.jpg
  node src/index.js assets upload ./photo.png

  Commands at a glance:

  ┌────────────────┬──────────────────────────────────────────────────────────────────────┐
  │     Group      │                               Commands                               │
  ├────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ config         │ set-server, set-token, show                                          │
  ├────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ login / whoami │ interactive auth, JWT stored in config                               │
  ├────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ posts          │ list (filters: --tag, --category, --published), get <id>, search <q> │
  ├────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ notes          │ list, get <id>, search <q>                                           │
  ├────────────────┼──────────────────────────────────────────────────────────────────────┤
  │ assets         │ list, download <id> [-o path], upload <file>                         │
  └────────────────┴──────────────────────────────────────────────────────────────────────┘

  All paginated with --page / --limit. Uses native Node 18 fetch — no heavy HTTP dep needed.

✻ Sautéed for 3m 9s
```


❯ how to install the cli app as global command?

```shell
⏺ From the cli/ directory:

  pnpm link --global

  This registers nextblog as a global command using the bin entry in package.json. After that you can run nextblog from anywhere.

  To verify:
  which nextblog
  nextblog --help

  To uninstall later:
  pnpm unlink --global nextblog

  or:
  npm uninstall -g nextblog
```