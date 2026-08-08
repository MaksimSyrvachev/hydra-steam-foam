#!/usr/bin/env python3
"""Inline assets/icons.svg into index.html.

The sprite is inlined rather than referenced so that <use href="#i-name">
resolves even when the page is opened straight from disk (file://), where
external SVG sprite references are blocked by the browser.

Re-runnable: replaces whatever currently sits between the two markers.

    python3 tools/inline-icons.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
SPRITE = ROOT / "assets" / "icons.svg"

START = "<!--SPRITE:START-->"
END = "<!--SPRITE:END-->"

html = HTML.read_text(encoding="utf-8")
sprite = SPRITE.read_text(encoding="utf-8").strip()
block = f"{START}\n{sprite}\n{END}"

if START in html and END in html:
    html = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _: block, html, flags=re.S)
elif "<!--SPRITE-->" in html:
    html = html.replace("<!--SPRITE-->", block)
else:
    sys.exit("No sprite marker found in index.html. Expected <!--SPRITE--> or the START/END pair.")

HTML.write_text(html, encoding="utf-8")
print(f"Inlined {len(re.findall(r'<symbol ', sprite))} icons into {HTML.name}")
