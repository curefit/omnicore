#!/usr/bin/env python3
"""Replace [#hex] utilities with oc-* theme tokens (see app/globals.css)."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# 6-char hex (lowercase keys) -> tailwind token suffix (after oc-)
HEX_TO_TOKEN = {
    "080b11": "oc-sunken",
    "0a0a0a": "oc-inset",
    "0a0d14": "oc-base",
    "0d1117": "oc-deep",
    "0f1623": "oc-row-alt",
    "111111": "oc-void",
    "111827": "oc-card",
    "141c2e": "oc-row",
    "1a1a1a": "oc-void-alt",
    "1a2030": "oc-divide",
    "1a2235": "oc-hover",
    "1e3a4a": "oc-item-active",
    "1f2937": "oc-border",
    "2d3748": "oc-icon-dim",
    "374151": "oc-muted",
    "4a5568": "oc-icon-muted",
    "4b5563": "oc-placeholder",
    "6b7280": "oc-fg-dim",
    "9ca3af": "oc-fg-muted",
    "d1d5db": "oc-fg-hint",
    "e5e7eb": "oc-fg-soft",
    "f9fafb": "oc-fg",
}

# Match Tailwind arbitrary color: prefix-[#RRGGBB] or prefix-[#RRGGBB]/opacity
PATTERN = re.compile(r"([\w:[\]-]+)-\[#([0-9a-fA-F]{6})\]((?:/[\d.]+)?)")


def transform(text: str) -> str:
    def repl(m: re.Match[str]) -> str:
        prefix, hx, opacity = m.group(1), m.group(2).lower(), m.group(3) or ""
        tok = HEX_TO_TOKEN.get(hx)
        if not tok:
            return m.group(0)
        return f"{prefix}-{tok}{opacity}"

    return PATTERN.sub(repl, text)


def main() -> None:
    globs = ["app/**/*.tsx", "components/**/*.tsx", "lib/**/*.ts"]
    paths: list[Path] = []
    for g in globs:
        paths.extend(ROOT.glob(g))
    changed = 0
    for path in sorted(set(paths)):
        if "node_modules" in path.parts:
            continue
        text = path.read_text(encoding="utf-8")
        new = transform(text)
        if new != text:
            path.write_text(new, encoding="utf-8")
            changed += 1
            print(path.relative_to(ROOT))
    print(f"Updated {changed} files")


if __name__ == "__main__":
    main()
