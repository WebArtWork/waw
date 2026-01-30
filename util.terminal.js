const readline = require("node:readline/promises");
const { stdin: input, stdout: output } = require("node:process");

const normalizeOptions = (options) => {
	if (!options) return [];

	if (Array.isArray(options)) {
		return options.map((o) => {
			if (typeof o === "string") return { label: o, value: o };
			if (o && typeof o === "object") {
				return {
					label: String(o.label ?? o.value ?? ""),
					value: o.value ?? o.label,
					detail: o.detail,
					disabled: !!o.disabled,
				};
			}
			return { label: String(o), value: o };
		});
	}

	if (typeof options === "object") {
		return Object.keys(options).map((label) => ({
			label,
			value: options[label],
		}));
	}

	return [];
};

module.exports = function terminalUtil(opts = {}) {
	const {
		onCancel = () => process.exit(130),
		sigintMessage = "\nAborted.\n",
		spinnerFrames = ["|", "/", "-", "\\"],
		spinnerInterval = 80,
	} = opts;

	const rl = readline.createInterface({ input, output });

	// -------- spinner --------
	let spinnerTimer = null;
	let spinnerText = "";
	let spinnerI = 0;
	let spinnerActive = false;

	const spinnerStart = (text = "Working...") => {
		if (!output.isTTY) return;
		spinnerStop(); // only one spinner at a time
		spinnerText = String(text);
		spinnerI = 0;
		spinnerActive = true;

		// hide cursor
		try {
			output.write("\x1B[?25l");
		} catch {}

		const render = () => {
			if (!spinnerActive) return;
			const frame = spinnerFrames[spinnerI++ % spinnerFrames.length];
			output.write(`\r${frame} ${spinnerText}`);
		};

		spinnerTimer = setInterval(render, spinnerInterval);
		render();
	};

	const spinnerUpdate = (text) => {
		if (!spinnerActive) return;
		if (text !== undefined) spinnerText = String(text);
		if (!output.isTTY) return;
		const frame = spinnerFrames[spinnerI++ % spinnerFrames.length];
		output.write(`\r${frame} ${spinnerText}`);
	};

	const spinnerStop = (finalText) => {
		if (!spinnerActive) {
			if (finalText) output.write(finalText + "\n");
			return;
		}
		spinnerActive = false;
		if (spinnerTimer) clearInterval(spinnerTimer);
		spinnerTimer = null;

		if (output.isTTY) {
			output.write("\r");
			output.clearLine(0);
			// show cursor
			try {
				output.write("\x1B[?25h");
			} catch {}
		}

		if (finalText) output.write(finalText + "\n");
	};

	// -------- SIGINT --------
	const onSigint = () => {
		try {
			spinnerStop();
		} catch {}
		try {
			output.write(sigintMessage);
		} catch {}
		try {
			rl.close();
		} catch {}
		onCancel();
	};
	process.once("SIGINT", onSigint);

	// -------- prompts --------
	const ask = async (question, askOpts = {}) => {
		const { defaultValue, required = false, validate, transform } = askOpts;

		while (true) {
			const suffix = defaultValue !== undefined ? ` (${defaultValue})` : "";
			const raw = await rl.question(`${question}${suffix} `);
			const answer =
				raw.trim() || (defaultValue !== undefined ? String(defaultValue) : "");

			if (required && !answer) {
				output.write("Please enter a value.\n");
				continue;
			}

			if (typeof validate === "function") {
				const res = await validate(answer);
				if (res !== true) {
					output.write((typeof res === "string" ? res : "Invalid value.") + "\n");
					continue;
				}
			}

			return typeof transform === "function" ? transform(answer) : answer;
		}
	};

	const confirm = async (question, confirmOpts = {}) => {
		const { defaultValue = true } = confirmOpts;
		const hint = defaultValue ? "[Y/n]" : "[y/N]";

		while (true) {
			const v = (
				await ask(`${question} ${hint}`, { defaultValue: "" })
			).toLowerCase();
			if (!v) return !!defaultValue;
			if (["y", "yes", "1", "true"].includes(v)) return true;
			if (["n", "no", "0", "false"].includes(v)) return false;
			output.write("Please answer yes or no.\n");
		}
	};

	const choose = async (title, options, chooseOpts = {}) => {
		const list = normalizeOptions(options);
		const {
			prompt = "Choose number:",
			defaultIndex,
			showNumbers = true,
			allowCancel = false,
			cancelLabel = "Cancel",
		} = chooseOpts;

		if (!list.length) throw new Error("choose(): options list is empty");

		output.write(title + "\n");
		list.forEach((o, i) => {
			const num = showNumbers ? `${i + 1}) ` : "";
			const disabled = o.disabled ? " (disabled)" : "";
			const detail = o.detail ? ` — ${o.detail}` : "";
			output.write(`${num}${o.label}${detail}${disabled}\n`);
		});

		let cancelIndex = null;
		if (allowCancel) {
			cancelIndex = list.length;
			const num = showNumbers ? `${cancelIndex + 1}) ` : "";
			output.write(`${num}${cancelLabel}\n`);
		}

		while (true) {
			const dv =
				defaultIndex !== undefined
					? String(defaultIndex + 1)
					: allowCancel
					? ""
					: undefined;

			const raw = await ask(prompt, { defaultValue: dv });
			const n = Number(raw);

			if (!Number.isFinite(n) || !Number.isInteger(n)) {
				output.write("Please enter a number.\n");
				continue;
			}

			const idx = n - 1;

			if (allowCancel && idx === cancelIndex) return null;

			if (idx < 0 || idx >= list.length) {
				output.write("Out of range.\n");
				continue;
			}

			if (list[idx].disabled) {
				output.write("This option is disabled.\n");
				continue;
			}

			return list[idx].value;
		}
	};

	const close = () => {
		try {
			process.removeListener("SIGINT", onSigint);
		} catch {}
		try {
			spinnerStop();
		} catch {}
		try {
			rl.close();
		} catch {}
	};

	return {
		ask,
		choose,
		confirm,

		// spinner api
		spinnerStart,
		spinnerUpdate,
		spinnerStop,

		close,
		rl,
	};
};
