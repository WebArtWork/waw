# waw Framework

**waw** is a minimal Node.js framework focused on **module-based CLI commands and runtime bootstrapping**.
The core itself is intentionally small — it only discovers modules, installs their dependencies, executes CLI commands, and runs the application lifecycle.

Everything else lives in modules.

---

## Philosophy

- **Tiny core** – no business logic, no framework lock-in
- **Modules first** – all features come from modules
- **Explicit over magic** – files define behavior
- **Sync by default** – predictable startup and execution

If a feature is not implemented by a module, it does not exist.

---

## Requirements

- **Node.js ≥ 24**
- npm available in PATH

---

## Installation

```sh
npm install -g waw
```

---

## How waw works

### 1. Module discovery

On startup, waw:

1. Loads **local modules** from the project `server/` directory
2. Loads **global modules** required by the project configuration
3. Installs module dependencies declared in `module.json`
4. Orders modules using `before` / `after` rules

Each module is a folder with a `module.json`.

---

### 2. CLI commands (`cli.js`)

File `cli.js` in any module can provide CLI commands.

Example:

```js
// cli.js
module.exports.love = function (waw) {
	console.log("waw loves you :)");
	process.exit(0);
};
```

Run it:

```sh
waw love
```

Rules:

* Commands are resolved **from the last module to the first**
* Later modules override earlier ones
* File name does **not** matter — only exported keys

---

### 3. Application runtime (`index.js`)

If no CLI command is executed, waw starts the application runtime.

For each module:

* If `index.js` exists
* And it exports a function
* It is called with the `waw` context

Example:

```js
// index.js
module.exports = function (waw) {
	console.log("Module started:", waw.project_root);
};
```

Runtime is restarted automatically using **nodemon** when files change.

---

### 4. Module ordering

Modules may define execution order in `module.json`:

```json
{
	"before": "*"
}
```

```json
{
	"after": "core",
	"before": "*"
}
```

Supported:

* `before`
* `after`
* Arrays or single values
* `"*"` means “all modules except explicitly constrained ones”

This allows clean overrides without touching existing modules.

---

### 5. Dependencies

Modules may declare dependencies in `module.json`:

```json
{
	"dependencies": {
		"express": "^4.19.0"
	}
}
```

* Dependencies are installed **synchronously**
* Installed only if missing or incompatible
* No `package.json` is created inside modules
* `node_modules` are ignored in runtime file scans

When `require('./util.modules')` returns, all dependencies are already installed.

---

## The `waw` context

Every CLI command and runtime module receives a shared `waw` object with basic environment info:

* `argv`
* `project_root`
* `server_root`
* `waw_root`
* `waw_server_root`
* `modules`
* `module`
* `module_root`
* `module_config`

This object is intentionally small and stable.

---

## Project structure (minimal)

```txt
project/
├── config.json
├── server/
│   ├── my-module/
│   │   ├── module.json
│   │   ├── index.js
│   │   └── cli.js
```

---

## What waw is **not**

* Not a backend framework
* Not tied to Express, MongoDB, or any stack
* Not a generator by default
* Not async-heavy
* Not opinionated

Those things belong in modules.

---

## Contributing

Contributions are welcome.

* Improve the core (keep it tiny)
* Improve documentation
* Create modules
* Report bugs

See `CONTRIBUTING.md`.

---

## License

MIT © Web Art Work
