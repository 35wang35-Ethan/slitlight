from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.h1_count = 0
        self.html_lang = ""
        self.refs: set[str] = set()
        self.meta_names: set[str] = set()
        self.meta_properties: set[str] = set()
        self.link_rels: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "html":
            self.html_lang = values.get("lang") or ""
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "meta":
            if values.get("name"):
                self.meta_names.add(values["name"])
            if values.get("property"):
                self.meta_properties.add(values["property"])
        elif tag == "link":
            if values.get("rel"):
                self.link_rels.update(values["rel"].split())

        for attr in ("href", "src"):
            if values.get(attr):
                self.refs.add(values[attr])
        for attr in ("srcset", "imagesrcset"):
            if values.get(attr):
                self.refs.update(item.strip().split()[0] for item in values[attr].split(","))


def is_local(reference: str) -> bool:
    parsed = urlsplit(reference)
    return not parsed.scheme and not parsed.netloc and not reference.startswith(("#", "mailto:", "tel:", "data:"))


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    index_path = root / "index.html"
    if not index_path.exists():
        raise SystemExit("Missing index.html")

    for required_page in ("privacy.html", "terms.html"):
        if not (root / required_page).exists():
            raise SystemExit(f"Missing {required_page}")

    html = index_path.read_text(encoding="utf-8")
    parser = SiteParser()
    parser.feed(html)

    errors: list[str] = []
    if parser.html_lang != "zh-Hant":
        errors.append("html lang must be zh-Hant")
    if parser.h1_count != 1:
        errors.append(f"expected one h1, found {parser.h1_count}")
    for name in ("description", "viewport", "robots"):
        if name not in parser.meta_names:
            errors.append(f"missing meta[name={name}]")
    for prop in ("og:title", "og:description", "og:image", "og:url"):
        if prop not in parser.meta_properties:
            errors.append(f"missing meta[property={prop}]")
    for rel in ("canonical", "icon"):
        if rel not in parser.link_rels:
            errors.append(f"missing link rel={rel}")

    for css_path in root.glob("assets/css/*.css"):
        css = css_path.read_text(encoding="utf-8")
        for match in re.findall(r"url\([\"']?([^\"')]+)", css):
            parser.refs.add(str((css_path.parent / match).relative_to(root)).replace("\\", "/"))

    for reference in sorted(parser.refs):
        if not is_local(reference):
            continue
        clean = urlsplit(reference).path.lstrip("/")
        if clean and not (root / clean).exists():
            errors.append(f"missing local asset: {reference}")

    for obsolete in ("admin.js", "app.js", "style.css", "assets/hero.png"):
        if (root / obsolete).exists():
            errors.append(f"obsolete file must not be deployed: {obsolete}")

    if errors:
        print("Site validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    print(f"Site validation passed ({len(parser.refs)} references checked).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
