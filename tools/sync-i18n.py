#!/usr/bin/env python3
"""Rewrite index.html's translatable text from the `en` block of js/i18n.js.

Why this exists: main.js overwrites every [data-i18n] element on load, so any
fallback text left in the HTML that disagrees with the dictionary is invisible
in a browser and can sit there wrong indefinitely. Rather than keeping the two
in sync by hand, the HTML is generated from the dictionary.

    python3 tools/sync-i18n.py            # report only
    python3 tools/sync-i18n.py --write    # apply

Also audits the two locales against each other and against the markup.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML = os.path.join(ROOT, "index.html")
I18N = os.path.join(ROOT, "js", "i18n.js")

WRITE = "--write" in sys.argv


def load_dicts():
    src = open(I18N, encoding="utf-8").read()
    start = src.index("{", src.index("window.HSF_I18N"))
    end = src.rindex("}")
    blob = src[start:end + 1]
    # i18n.js is a JS object literal, so a handful of keys (en, ar, dir, label,
    # toggleTo) are bare identifiers. Quote them so json can read the file.
    # Continuation lines start with a quote, so this never touches a value.
    blob = re.sub(r'^(\s*)([A-Za-z_]\w*)(\s*):', r'\1"\2"\3:', blob, flags=re.M)
    # Section banners are whole-line /* ... */ comments; JSON has no comments,
    # so drop the lines that are nothing but one. Anything inside a value is
    # left alone because those lines start with a quote.
    blob = re.sub(r'^[ \t]*/\*.*?\*/[ \t]*$', '', blob, flags=re.M | re.S)
    try:
        return json.loads(blob)
    except json.JSONDecodeError as e:
        sys.exit(f"i18n.js is not valid JSON at line {e.lineno}: {e.msg}\n"
                 "Keep it double-quoted with no trailing commas so this tool can read it.")


def esc(text):
    """Escape a dictionary value for use as HTML text content."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def main():
    packs = load_dicts()
    en, ar = packs["en"], packs["ar"]
    html = open(HTML, encoding="utf-8").read()

    used, missing, changed = set(), [], []

    def sub(attr, transform):
        pattern = re.compile(
            r'<(?P<tag>[a-zA-Z][\w-]*)(?P<attrs>[^>]*\b' + attr +
            r'="(?P<key>[^"]+)"[^>]*)>(?P<body>.*?)</\1>', re.S)

        def repl(m):
            key, body = m.group("key"), m.group("body")
            used.add(key)
            if key not in en:
                missing.append(key)
                return m.group(0)
            want = transform(en[key])
            if body == want:
                return m.group(0)
            changed.append((key, body.strip()[:58], want.strip()[:58]))
            return f'<{m.group("tag")}{m.group("attrs")}>{want}</{m.group("tag")}>'

        return pattern.sub(repl, html)

    html = sub("data-i18n", esc)
    html = sub("data-i18n-html", lambda v: v)

    # Attribute bindings carry no fallback worth syncing, but the keys still
    # have to exist.
    for attrs in re.findall(r'data-i18n-attr="([^"]+)"', html):
        for pair in attrs.split(","):
            bits = pair.split(":")
            if len(bits) == 2:
                key = bits[1].strip()
                used.add(key)
                if key not in en:
                    missing.append(key)

    print(f"keys in en: {len(en)}   keys in ar: {len(ar)}   referenced by markup: {len(used)}")

    only_en = sorted(set(en) - set(ar) - {"dir", "label", "toggleTo"})
    only_ar = sorted(set(ar) - set(en) - {"dir", "label", "toggleTo"})
    if only_en:
        print(f"\n!! {len(only_en)} key(s) missing from ar: {', '.join(only_en)}")
    if only_ar:
        print(f"\n!! {len(only_ar)} key(s) missing from en: {', '.join(only_ar)}")

    if missing:
        print(f"\n!! {len(missing)} key(s) used in markup but absent from en: "
              f"{', '.join(sorted(set(missing)))}")

    unused = sorted(k for k in en if k not in used and k not in ("dir", "label", "toggleTo"))
    if unused:
        print(f"\n   {len(unused)} dictionary key(s) not referenced by markup "
              f"(fine for JS-only strings): {', '.join(unused)}")

    if changed:
        print(f"\n{len(changed)} element(s) differ from the dictionary:")
        for key, was, now in changed:
            print(f"   {key}\n     html: {was}\n     dict: {now}")
    else:
        print("\nAll markup text matches the dictionary.")

    if WRITE and changed:
        open(HTML, "w", encoding="utf-8").write(html)
        print(f"\nwrote {len(changed)} fix(es) to index.html")
    elif changed:
        print("\nre-run with --write to apply")

    return 1 if (missing or only_en or only_ar) else 0


if __name__ == "__main__":
    sys.exit(main())
