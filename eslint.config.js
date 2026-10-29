// @ts-check
import js from "@eslint/js";
import { createNodeResolver, importX } from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Workspace packages may only be imported through their public `exports`. */
const noDeepPackageImports = {
  group: ["@talentstroom/*/src/*", "@talentstroom/*/src"],
  message: "Import workspace packages via their public entry point, not their source files.",
};

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.turbo/**",
      "**/.wrangler/**",
      "**/.astro/**",
      "**/worker-configuration.d.ts",
      "docs/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  importX.flatConfigs.typescript,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { "import-x": importX },
    settings: { "import-x/resolver-next": [createNodeResolver()] },
    rules: {
      "import-x/no-cycle": "error",
      "import-x/no-self-import": "error",
      "import-x/no-relative-packages": "error",
      "no-restricted-imports": ["error", { patterns: [noDeepPackageImports] }],
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    // Shared packages must never depend on applications.
    files: ["packages/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            noDeepPackageImports,
            {
              group: ["@talentstroom/api", "@talentstroom/web", "@talentstroom/site", "**/apps/**"],
              message: "Packages must not import from apps.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ["*.js", "**/*.config.{js,mjs}"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.cjs"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { sourceType: "commonjs", globals: globals.node },
  },
);
