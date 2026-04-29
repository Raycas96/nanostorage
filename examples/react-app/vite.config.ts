import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

const repoRoot = path.resolve(
	fileURLToPath(new URL(".", import.meta.url)),
	"../..",
);

export default defineConfig({
	resolve: {
		alias: {
			"@/types": path.join(repoRoot, "src/core/types.ts"),
			"@/core": path.join(repoRoot, "src/core/index.ts"),
			"@raycas96/nanostorage/react": path.join(repoRoot, "src/react/index.ts"),
			"@raycas96/nanostorage/core": path.join(repoRoot, "src/core/index.ts"),
			"@raycas96/nanostorage": path.join(repoRoot, "src/core/index.ts"),
		},
	},
});
