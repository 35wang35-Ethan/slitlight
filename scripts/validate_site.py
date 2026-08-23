from __future__ import annotations

import json
import re
import sys
from datetime import date
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
        self.stylesheets: list[str] = []
        self.scripts: list[str] = []
        self.images: list[dict[str, str | None]] = []
        self.hero_is_eager = False

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
        elif tag == "link" and values.get("rel"):
            rels = values["rel"].split()
            self.link_rels.update(rels)
            if "stylesheet" in rels and values.get("href"):
                self.stylesheets.append(values["href"])
        elif tag == "script" and values.get("src"):
            self.scripts.append(values["src"])
        elif tag == "img":
            self.images.append(values)
            if "slow-take-hero" in (values.get("src") or ""):
                self.hero_is_eager = values.get("loading") != "lazy" and values.get("fetchpriority") == "high"

        for attr in ("href", "src"):
            if values.get(attr):
                self.refs.add(values[attr])
        for attr in ("srcset", "imagesrcset"):
            if values.get(attr):
                self.refs.update(item.strip().split()[0] for item in values[attr].split(","))


def is_local(reference: str) -> bool:
    parsed = urlsplit(reference)
    return not parsed.scheme and not parsed.netloc and not reference.startswith(("#", "mailto:", "tel:", "data:"))


def validate_page(root: Path, relative_path: str, errors: list[str]) -> SiteParser:
    page_path = root / relative_path
    if not page_path.exists():
        errors.append(f"missing page: {relative_path}")
        return SiteParser()

    parser = SiteParser()
    parser.feed(page_path.read_text(encoding="utf-8"))
    if parser.html_lang != "zh-Hant":
        errors.append(f"{relative_path}: html lang must be zh-Hant")
    if parser.h1_count != 1:
        errors.append(f"{relative_path}: expected one h1, found {parser.h1_count}")
    for name in ("description", "viewport", "robots"):
        if name not in parser.meta_names:
            errors.append(f"{relative_path}: missing meta[name={name}]")
    for prop in ("og:title", "og:description", "og:image", "og:url"):
        if prop not in parser.meta_properties:
            errors.append(f"{relative_path}: missing meta[property={prop}]")
    for rel in ("canonical", "icon"):
        if rel not in parser.link_rels:
            errors.append(f"{relative_path}: missing link rel={rel}")

    bootstrap_css = [href for href in parser.stylesheets if href.endswith("bootstrap.min.css")]
    bootstrap_js = [src for src in parser.scripts if src.endswith("bootstrap.bundle.min.js")]
    if len(bootstrap_css) != 1:
        errors.append(f"{relative_path}: expected one Bootstrap stylesheet, found {len(bootstrap_css)}")
    if len(bootstrap_js) != 1:
        errors.append(f"{relative_path}: expected one Bootstrap bundle, found {len(bootstrap_js)}")

    for image in parser.images:
        src = image.get("src") or ""
        if not image.get("width") or not image.get("height"):
            errors.append(f"{relative_path}: image missing width/height: {src}")
        if "slow-take-hero" not in src and not src.endswith(("favicon.svg", "brand-symbol.svg")) and image.get("loading") != "lazy":
            errors.append(f"{relative_path}: non-critical image must be lazy: {src}")

    for reference in sorted(parser.refs):
        if not is_local(reference):
            continue
        clean = urlsplit(reference).path
        target = (page_path.parent / clean).resolve()
        try:
            target.relative_to(root)
        except ValueError:
            errors.append(f"{relative_path}: local reference escapes site root: {reference}")
            continue
        if clean and not target.exists():
            errors.append(f"{relative_path}: missing local asset: {reference}")
    return parser


def validate_takes(root: Path, errors: list[str]) -> None:
    data_path = root / "assets/data/takes.json"
    if not data_path.exists():
        errors.append("missing assets/data/takes.json")
        return
    try:
        takes = json.loads(data_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"invalid takes.json: {exc}")
        return

    required = {
        "title", "slug", "category", "excerpt", "cover_image", "date",
        "external_url", "film_title", "film_year", "featured", "published"
    }
    categories = {"choice", "second-look", "frame"}
    slugs: set[str] = set()
    for index, take in enumerate(takes, start=1):
        missing = required - set(take)
        if missing:
            errors.append(f"takes[{index}] missing fields: {', '.join(sorted(missing))}")
        if take.get("category") not in categories:
            errors.append(f"takes[{index}] invalid category: {take.get('category')}")
        slug = take.get("slug")
        if not slug or slug in slugs:
            errors.append(f"takes[{index}] slug is empty or duplicated: {slug}")
        slugs.add(slug)
        try:
            date.fromisoformat(take.get("date", ""))
        except ValueError:
            errors.append(f"takes[{index}] date must use YYYY-MM-DD")
        cover = root / str(take.get("cover_image", ""))
        if not cover.exists():
            errors.append(f"takes[{index}] missing cover: {take.get('cover_image')}")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []
    pages = ("index.html", "takes/index.html", "privacy.html", "terms.html")
    parsed = {page: validate_page(root, page, errors) for page in pages}

    for page, parser in parsed.items():
        config_scripts = [index for index, src in enumerate(parser.scripts) if src.endswith("assets/js/config.js")]
        analytics_scripts = [index for index, src in enumerate(parser.scripts) if src.endswith("assets/js/analytics.js")]
        if len(config_scripts) != 1 or len(analytics_scripts) != 1:
            errors.append(f"{page}: expected one config.js and one analytics.js")
        elif config_scripts[0] > analytics_scripts[0]:
            errors.append(f"{page}: config.js must load before analytics.js")

    browser_config = (root / "assets/js/config.js").read_text(encoding="utf-8")
    for tracking_id in ("G-JG1RP94Q9J", "AW-18389054487"):
        if tracking_id not in browser_config:
            errors.append(f"assets/js/config.js: missing tracking ID {tracking_id}")

    if not parsed["index.html"].hero_is_eager:
        errors.append("index.html: hero image must be eager and fetchpriority=high")

    homepage = (root / "index.html").read_text(encoding="utf-8")
    homepage_sections = (
        'id="slow-take"', 'id="perspectives"', 'id="journal"',
        'id="about"', 'id="collaboration"'
    )
    positions = [homepage.find(section) for section in homepage_sections]
    if any(position < 0 for position in positions) or positions != sorted(positions):
        errors.append("index.html: homepage sections must follow SLOW TAKE > PERSPECTIVES > JOURNAL > ABOUT > COLLABORATE")

    for css_path in root.glob("assets/css/*.css"):
        css = css_path.read_text(encoding="utf-8")
        for reference in re.findall(r"url\([\"']?([^\"')]+)", css):
            if is_local(reference) and not (css_path.parent / urlsplit(reference).path).resolve().exists():
                errors.append(f"{css_path.relative_to(root)}: missing local asset: {reference}")

    validate_takes(root, errors)

    public_sources = [
        root / "index.html", root / "takes/index.html", root / "privacy.html",
        root / "terms.html", *root.glob("assets/js/*.js")
    ]
    banned = (
        "HOOOO", "有專業", "IP 核心", "轉換企劃", "A WAY OF LOOKING",
        "THREE WAYS OF LOOKING", "SELECTED TAKES", "START A CONVERSATION",
        "35slit.light@gmail.com", "mailto:"
    )
    for source in public_sources:
        if not source.exists():
            continue
        text = source.read_text(encoding="utf-8")
        for phrase in banned:
            if phrase in text:
                errors.append(f"{source.relative_to(root)}: obsolete public copy remains: {phrase}")

        legacy_bootstrap = re.search(r'(?:data-toggle|data-target)\s*=|class="[^"]*\b(?:ml|mr)-\d', text)
        if legacy_bootstrap:
            errors.append(f"{source.relative_to(root)}: Bootstrap 4 syntax remains: {legacy_bootstrap.group(0)}")

    for obsolete in ("admin.js", "app.js", "style.css", "assets/hero.png", "assets/js/consent.js"):
        if (root / obsolete).exists():
            errors.append(f"obsolete file must not be deployed: {obsolete}")

    if errors:
        print("Site validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1

    refs_checked = sum(len(parser.refs) for parser in parsed.values())
    print(f"Site validation passed ({len(pages)} pages, {refs_checked} references checked).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
