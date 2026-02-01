// Generic git utility for waw (cross-platform, explicit, safe-by-default)

const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execSync } = require("node:child_process");

const rmOpts = { recursive: true, force: true };

// ---------- helpers ----------
const exec = (dir, cmd, opts = {}) => {
	const silent = !!opts.silent;
	return execSync(cmd, {
		cwd: dir,
		stdio: silent ? "ignore" : "inherit",
	});
};

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const exists = (p) => fs.existsSync(p);

const hasGit = () => {
	try {
		execSync("git --version", { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
};

// ---------- low-level ----------
const hasRepo = (dir) => exists(path.join(dir, ".git"));

const remove = (dir) => {
	const g = path.join(dir, ".git");
	if (exists(g)) fs.rmSync(g, rmOpts);
};

const init = (dir, opts = {}) => {
	if (!exists(dir)) ensureDir(dir);
	if (!hasRepo(dir)) exec(dir, "git init", opts);
};

const setOrigin = (dir, repo, opts = {}) => {
	try {
		exec(dir, "git remote remove origin", { silent: true });
	} catch {}
	exec(dir, `git remote add origin ${repo}`, opts);
};

const fetch = (dir, opts = {}) => exec(dir, "git fetch --all --prune", opts);

const checkout = (dir, branch, force = false, opts = {}) => {
	if (force) {
		exec(dir, `git checkout -B ${branch} origin/${branch}`, opts);
		exec(dir, `git reset --hard origin/${branch}`, opts);
	} else {
		exec(dir, `git checkout ${branch}`, opts);
	}
};

const commit = (dir, message, opts = {}) => {
	exec(dir, "git add -A", opts);
	try {
		// keep commit quiet by default unless explicitly not silent
		exec(dir, `git commit -m ${JSON.stringify(message)}`, { silent: true });
	} catch {
		// nothing to commit is OK
	}
};

const push = (dir, branch, opts = {}) => exec(dir, `git push origin ${branch}`, opts);

const pull = (dir, branch, opts = {}) => exec(dir, `git pull origin ${branch}`, opts);

// ---------- high-level workflows ----------

/**
 * FORCE sync (destructive)
 * rm -rf *, fetch repo, hard reset to origin/branch
 */
const forceSync = (dir, { repo, branch = "master", silent = false } = {}) => {
	if (!repo) throw new Error("repo is required for forceSync");

	const opts = { silent };

	if (exists(dir)) {
		for (const n of fs.readdirSync(dir)) {
			if (n === ".git") continue;
			fs.rmSync(path.join(dir, n), rmOpts);
		}
	} else {
		ensureDir(dir);
	}

	init(dir, opts);
	setOrigin(dir, repo, opts);
	fetch(dir, opts);
	checkout(dir, branch, true, opts);
};

/**
 * Attach git history WITHOUT touching working tree
 * Uses temp folder and moves .git
 */
const attach = (dir, { repo, branch = "master", silent = false } = {}) => {
	if (!repo) throw new Error("repo is required for attach");
	if (!exists(dir)) throw new Error("target directory does not exist");

	if (hasRepo(dir)) return; // already attached

	const opts = { silent };

	const tempRoot = path.join(os.homedir(), ".waw", "git-temp");
	const temp = path.join(tempRoot, `${path.basename(dir)}-${Date.now()}`);

	ensureDir(tempRoot);
	ensureDir(temp);

	// build git history in temp
	exec(temp, "git init", opts);
	exec(temp, `git remote add origin ${repo}`, opts);
	exec(temp, "git fetch --all", opts);
	exec(temp, `git checkout -B ${branch} origin/${branch}`, opts);

	// move .git only
	const from = path.join(temp, ".git");
	const to = path.join(dir, ".git");

	if (exists(to)) fs.rmSync(to, rmOpts);
	fs.renameSync(from, to);

	fs.rmSync(temp, rmOpts);
};

/**
 * Publish current folder as-is
 * attach -> commit -> push -> remove .git
 */
const publish = (dir, { repo, branch = "master", message, silent = false } = {}) => {
	if (!message) throw new Error("commit message is required for publish");

	const opts = { silent };

	attach(dir, { repo, branch, silent });
	commit(dir, message, opts);
	push(dir, branch, opts);
	remove(dir);
};

// ---------- hygiene ----------
const gitignore = `node_modules
package-lock.json
`;

const YEAR = new Date().getFullYear();
const LICENSE = `The MIT License (MIT)

Copyright (c) YEAR

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
`;

const ensureHygiene = function (moduleRoot) {
	const name = path.basename(moduleRoot);

	const gi = path.join(moduleRoot, ".gitignore");
	if (!fs.existsSync(gi)) fs.writeFileSync(gi, gitignore, "utf8");

	const readme = path.join(moduleRoot, "README.md");
	if (!fs.existsSync(readme)) {
		fs.writeFileSync(readme, `# waw module ${name}`, "utf8");
	}

	const lic = path.join(moduleRoot, "LICENSE");
	if (!fs.existsSync(lic)) {
		fs.writeFileSync(lic, LICENSE.replace("YEAR", YEAR), "utf8");
	} else {
		const content = fs.readFileSync(lic, "utf8");
		if (content.startsWith("The MIT License (MIT)") && !content.includes(String(YEAR))) {
			fs.writeFileSync(lic, LICENSE.replace("YEAR", YEAR), "utf8");
		}
	}
};

// ---------- exports ----------
module.exports = {
	// checks
	hasGit,
	hasRepo,

	// low-level
	init,
	setOrigin,
	fetch,
	checkout,
	commit,
	push,
	pull,
	remove,

	// workflows
	forceSync,
	attach,
	publish,

	ensureHygiene,
};
