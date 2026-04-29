import { readFileSync } from "node:fs";

const quoteFiles = (files) =>
	files.map((file) => `"${file.replace(/"/g, '\\"')}"`).join(" ");

const isDeclarationFile = (file) => file.endsWith(".d.ts");

const packageJson = JSON.parse(
	readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);
const hasUnitTestScript = Boolean(packageJson?.scripts?.["test:unit"]);

const config = {
	"*.{js,jsx,mjs,cjs,ts,tsx}": (files) => {
		const sourceFiles = files.filter((file) => !isDeclarationFile(file));

		if (sourceFiles.length === 0) return [];

		const quoted = quoteFiles(sourceFiles);
		return [`biome check --write ${quoted}`];
	},
	"*.d.ts": (files) => {
		if (files.length === 0) return [];

		return `biome format --write ${quoteFiles(files)}`;
	},
	"*.{json,md,css,scss,yml,yaml}": (files) => {
		if (files.length === 0) return [];

		return `biome format --write ${quoteFiles(files)}`;
	},
	"*": () => (hasUnitTestScript ? "npm run test:unit" : []),
};

export default config;
