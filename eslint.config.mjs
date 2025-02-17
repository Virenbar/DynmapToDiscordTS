// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        rules: {
            "space-in-parens": "warn",
            "quotes": "warn",
            "eol-last": "warn",
            "semi": "warn",
            "no-multiple-empty-lines": [
                "warn",
                {
                    "max": 1
                }
            ],
            "padding-line-between-statements": [
                "warn",
                {
                    "blankLine": "always",
                    "prev": "*",
                    "next": "function"
                }
            ]
        }
    }
);
