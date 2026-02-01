# waw Framework

**waw** is a minimal Node.js (≥ 24) platform that loads **modules** and either:

- executes a **CLI command** exposed by modules (`cli.js`), or
- boots the **runtime** by sequentially loading each module’s `index.js`.

The core is intentionally small. It does not implement application frameworks, routing, databases, generators, or business logic — modules do.

---

## Philosophy

- **Tiny core** — only module discovery, dependency install, ordering, CLI dispatch, runtime bootstrap
- **Modules first** — all behavior comes from modules
- **Explicit over magic** — behavior is defined by files (`module.json`, `cli.js`, `index.js`)
- **Sync by default** — dependency installation and module load preparation are deterministic

If a feature is not implemented by a module, it does not exist.

---

## Requirements

- **Node.js ≥ 24**
- `npm` available in `PATH`

---

## Installation

```sh
npm install -g waw
````

---

## Project structure (minimal)

```txt
project/
├── config.json
├── server.json          (optional)
├── server/              (default local modules folder; configurable)
│   ├── my-module/
│   │   ├── module.json
│   │   ├── index.js     (optional runtime entry)
│   │   └── cli.js       (optional CLI commands)
```

---

## How waw works

### 1) Configuration & module discovery

On startup, waw reads config from (merged, later wins):

1. Global `waw/config.json`
2. Global `waw/server.json`
3. Project `./config.json`
4. Project `./server.json`

Then it discovers modules:

* **Local modules**: directories under `/<project>/<config.server>`

  * If `config.server` is not set and a `server/` folder exists, it uses `"server"`.
* **Global modules**: declared in `config.modules` and fetched into the globally installed waw package under `waw/server/<name>`.

Global module fetch behavior:

* `config.modules` is interpreted as a map of `{ <moduleName>: <orgKey> }`.
* Supported `orgKey` values are:

  * `waw` → `https://github.com/WebArtWork/waw-{NAME}.git`
  * `itkp` → `git@github.com:IT-Kamianets/waw-{NAME}.git`
* If a required global module directory is missing, waw performs a **destructive force sync** of that repo into `waw/server/<name>`.

Fallback behavior:

* If no modules are found at all, waw force-syncs and loads a global module named **`core`** from the `waw` org pattern.

Project-type auto modules:

* If the project contains one of these marker files:

  * `angular.json` → loads global module `angular`
  * `react.json` → loads global module `react`
  * `vue.json` → loads global module `vue`
  * `wjst.json` → loads global module `wjst`
* Each is fetched from the `waw` org pattern if missing.

> Note: In this repository, the loader contains only these mechanics. Any application/framework behavior must be implemented by modules.

---

### 2) Module definition (`module.json`)

Each module is a folder containing `module.json`.

Supported fields used by this loader include:

* `dependencies`: an object of npm dependencies to install into the module directory
* `before` / `after`: ordering constraints (string or array; supports `"*"`)
* `priority`: numeric priority used only when ordering constraints form a cycle

The loader normalizes and augments module metadata at load time:

* `m.__root` / `m.rootPath`: absolute path to the module folder
* `m.__name`: directory name (module name)
* `m.__global`: boolean whether module is global
* `m.files`: snapshot list of files under the module directory (excluding `node_modules` and `.git`)

---

### 3) Dependencies

Modules may declare npm dependencies inside `module.json`:

```json
{
  "dependencies": {
    "express": "^4.19.0"
  }
}
```

Behavior:

* Dependencies are installed **synchronously** during module loading.
* Installation is performed into `<moduleRoot>/node_modules`.
* waw installs all declared deps in a single `npm i` call using:

  * `--no-save --no-package-lock --no-audit --no-fund --loglevel=error`
  * `--legacy-peer-deps`
* The loader checks installed versions with a small semver matcher supporting:

  * exact `x.y.z`
  * `^x.y.z`, `~x.y.z`
  * `>=x.y.z`
  * `*` / `latest`

No `package.json` is created inside modules by the loader.

---

### 4) Module ordering (`before` / `after`)

Modules may define ordering rules in `module.json`:

```json
{ "before": "*" }
```

```json
{ "after": "core", "before": "*" }
```

Rules:

* `before` / `after` accept a string or an array
* `"*"` means “all modules except those explicitly constrained in the opposite direction”
* Ordering is a **stable topological sort** based on discovery order
* If constraints produce a cycle, waw falls back to sorting by `priority` (descending)

---

### 5) CLI commands (`cli.js`)

A module may provide CLI commands by including a file named **exactly** `cli.js`.

Example:

```js
// cli.js
module.exports.love = function (waw) {
  console.log("waw loves you :)");
  process.exit(0);
};
```

Run:

```sh
waw love
```

Dispatch rules:

* waw reads the raw command from `process.argv[2]`.
* CLI files are scanned **from the last module to the first** (later modules override earlier ones).
* Only files with base name **`cli.js`** are considered (not `*.cli.js`).
* Matching is attempted in this order:

  1. exact key match with raw command (`ex[cmdRaw]`)
  2. exact key match with lowercased command (`ex[cmd]`)
  3. case-insensitive scan of exported keys
* `cli.js` may export:

  * an object of command functions, and/or
  * a function `(cmdRaw, waw) => boolean|void`

    * If it returns `false`, it is treated as “not handled” and waw continues scanning.
    * Any other return value (or no return) is treated as handled.

When a command is executed, the command receives a context object (see below) and the process is expected to exit if appropriate.

---

### 6) Runtime (`index.js`)

If no CLI command is handled, waw starts the runtime using **nodemon**.

Nodemon runs `util.runtime.js` and watches:

* Project:

  * `<project>/server`
  * `<project>/angular.json`
  * `<project>/react.json`
  * `<project>/vue.json`
  * `<project>/config.json`
* Global waw install:

  * `<waw>/server`
  * `<waw>/config.json`

When runtime starts, waw sequentially loads each module’s `index.js`:

* If `<moduleRoot>/index.js` exists and exports a function, it is called as `await func(waw)`.
* Errors are caught and printed; loading proceeds to the next module.

---

## The `waw` context

Every CLI command and runtime module receives a shared `waw` object containing:

### Core properties

* `argv` — CLI args after `waw` (`process.argv.slice(2)`)
* `projectPath` — current working directory
* `modulesPath` — resolved modules directory in the project (defaults to `<project>/server`)
* `wawPath` — directory of the globally installed `waw` package
* `wawModulesPath` — `<wawPath>/server`
* `configPath` / `configServerPath` — project config file paths
* `wawConfigPath` / `wawConfigServerPath` — global config file paths
* `config` — merged config snapshot (global + project)
* `projectType` — one of: `angular | react | vue | wjst | waw | ""`

### FS helpers

* `exists(...parts)`
* `isFile(...parts)`
* `isDir(...parts)`
* `ensureDir(...parts)`
* `rm(...parts)`
* `readText(path, fallback?)`
* `writeText(path, data)`
* `readJson(path, fallback?)`
* `writeJson(path, obj, pretty = true)`
* `readWrite(fromPath, toPath, replaceMap)`

### Utilities

* `terminal` — interactive CLI helper (ask/confirm/choose + spinner)
* `git` — git workflows utility (init, attach, forceSync, publish, etc.)

### Events

* `emit(event, ...args)`
* `on(event, fn)`
* `once(event, fn)`
* `off(event, fn)`

### Extra fields injected by the loader

When running CLI commands, waw injects these additional fields:

* `modules` — ordered list of loaded modules
* `module` — current module object
* `module_root` — current module root path
* `module_config` — current module config object (`module.json` content + loader metadata)

---

## What waw is not

* Not a backend framework
* Not tied to Express/MongoDB/etc.
* Not a generator by default
* Not async-heavy
* Not opinionated

Those belong in modules.

---

## Contributing

Contributions are welcome:

* Improve the loader (keep it small)
* Improve documentation
* Create modules
* Report bugs

See `CONTRIBUTING.md`.

---

## License

MIT © Web Art Work
