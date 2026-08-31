from __future__ import annotations

import json
import re
import sys
from collections import Counter
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
        self.ids: list[str] = []
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
            if "hero-image" in (values.get("class") or "").split():
                self.hero_is_eager = values.get("loading") != "lazy" and values.get("fetchpriority") == "high"
        if values.get("id"):
            self.ids.append(values["id"])

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
    duplicate_ids = sorted(value for value, count in Counter(parser.ids).items() if count > 1)
    if duplicate_ids:
        errors.append(f"{relative_path}: duplicate ids: {', '.join(duplicate_ids)}")
    for name in ("description", "viewport", "robots"):
        if name not in parser.meta_names:
            errors.append(f"{relative_path}: missing meta[name={name}]")
    for prop in ("og:title", "og:description", "og:image", "og:url"):
        if prop not in parser.meta_properties:
            errors.append(f"{relative_path}: missing meta[property={prop}]")
    for rel in ("canonical", "icon"):
        if rel not in parser.link_rels:
            errors.append(f"{relative_path}: missing link rel={rel}")

    bootstrap_css = [href for href in parser.stylesheets if urlsplit(href).path.endswith("bootstrap.min.css")]
    bootstrap_js = [src for src in parser.scripts if urlsplit(src).path.endswith("bootstrap.bundle.min.js")]
    if len(bootstrap_css) != 1:
        errors.append(f"{relative_path}: expected one Bootstrap stylesheet, found {len(bootstrap_css)}")
    if len(bootstrap_js) != 1:
        errors.append(f"{relative_path}: expected one Bootstrap bundle, found {len(bootstrap_js)}")

    for image in parser.images:
        src = image.get("src") or ""
        if not image.get("width") or not image.get("height"):
            errors.append(f"{relative_path}: image missing width/height: {src}")
        is_hero = "hero-image" in (image.get("class") or "").split()
        is_header_logo = "brand-logo" in (image.get("class") or "").split()
        if not is_hero and not is_header_logo and not src.endswith(("favicon.svg", "brand-symbol.svg")) and image.get("loading") != "lazy":
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


def validate_selected(root: Path, errors: list[str]) -> None:
    data_path = root / "assets/data/selected.json"
    if not data_path.exists():
        errors.append("missing assets/data/selected.json")
        return
    try:
        items = json.loads(data_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"invalid selected.json: {exc}")
        return

    required = {
        "slug", "category", "title", "description", "cover", "coverAlt",
        "coverWidth", "coverHeight", "selected", "order", "workTitle", "year",
        "director", "creator", "sourceNote", "externalUrl", "instagramUrl",
        "internalSlug"
    }
    categories = {"case", "judgment", "frame"}
    slugs: set[str] = set()
    orders: set[int] = set()
    selected_count = 0
    for index, item in enumerate(items, start=1):
        missing = required - set(item)
        if missing:
            errors.append(f"selected[{index}] missing fields: {', '.join(sorted(missing))}")
        if item.get("category") not in categories:
            errors.append(f"selected[{index}] invalid category: {item.get('category')}")
        slug = item.get("slug")
        if not slug or slug in slugs or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", str(slug)):
            errors.append(f"selected[{index}] slug is invalid or duplicated: {slug}")
        slugs.add(slug)
        order = item.get("order")
        if not isinstance(order, int) or order < 1 or order in orders:
            errors.append(f"selected[{index}] order must be a unique positive integer: {order}")
        orders.add(order)
        if item.get("selected") is True:
            selected_count += 1
        if not str(item.get("coverAlt", "")).strip():
            errors.append(f"selected[{index}] coverAlt must describe the image")
        if not all(isinstance(item.get(field), int) and item[field] > 0 for field in ("coverWidth", "coverHeight")):
            errors.append(f"selected[{index}] coverWidth/coverHeight must be positive integers")
        for obsolete_field in ("date", "publishedAt", "published_at"):
            if obsolete_field in item:
                errors.append(f"selected[{index}] must not use blog field: {obsolete_field}")

        cover = root / str(item.get("cover", ""))
        variants = (
            cover,
            cover.with_suffix(".webp"),
            cover.with_name(f"{cover.stem}-768.jpg"),
            cover.with_name(f"{cover.stem}-768.webp")
        )
        for variant in variants:
            if not variant.exists():
                errors.append(f"selected[{index}] missing cover variant: {variant.relative_to(root)}")

    if selected_count != 3:
        errors.append(f"selected.json: expected exactly 3 selected items, found {selected_count}")


def validate_admin(root: Path, errors: list[str]) -> None:
    required = (
        "admin.html", "admin/index.html", "admin/login.html", "assets/css/admin.css",
        "assets/js/admin.js", "assets/js/supabase.js", "assets/js/site-content.js"
    )
    for relative_path in required:
        if not (root / relative_path).exists():
            errors.append(f"missing admin asset: {relative_path}")
    admin_page = root / "admin/index.html"
    admin_script = root / "assets/js/admin.js"
    if not admin_page.exists() or not admin_script.exists():
        return
    html = admin_page.read_text(encoding="utf-8")
    script = admin_script.read_text(encoding="utf-8")
    data_client = (root / "assets/js/supabase.js").read_text(encoding="utf-8")
    if "Content-Security-Policy" not in html:
        errors.append("admin/index.html: Content Security Policy is required")
    if "https://ptruiafyvqhyeodvkiub.supabase.co" not in html or "https://ptruiafyvqhyeodvkiub.supabase.co" not in data_client:
        errors.append("admin: original Supabase project configuration is missing")
    if "signIn" not in data_client or "type=\"password\"" not in html:
        errors.append("admin: Email/Password authentication is missing")
    if not all(marker in data_client for marker in ("requestPasswordRecovery", "updatePassword", "type') !== 'recovery")):
        errors.append("admin: original account password recovery flow is incomplete")
    if not all(marker in html for marker in ('id="forgot-password-button"', 'id="recovery-update-form"')):
        errors.append("admin: password recovery controls are missing")
    if "service_role" in html + script + data_client:
        errors.append("admin: a Supabase service-role credential appears to be committed")
    if "https://api.github.com" in html + script:
        errors.append("admin: obsolete GitHub-token backend remains")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []
    verification_file = root / "google03850f274d84bd8f.html"
    verification_value = "google-site-verification: google03850f274d84bd8f.html"
    if not verification_file.exists():
        errors.append(f"missing Google Search Console verification file: {verification_file.name}")
    elif verification_file.read_text(encoding="utf-8").strip() != verification_value:
        errors.append(f"invalid Google Search Console verification file: {verification_file.name}")
    pages = ("index.html", "case-sprint/index.html", "takes/index.html", "privacy.html", "terms.html")
    parsed = {page: validate_page(root, page, errors) for page in pages}

    for page, parser in parsed.items():
        config_scripts = [index for index, src in enumerate(parser.scripts) if urlsplit(src).path.endswith("assets/js/config.js")]
        analytics_scripts = [index for index, src in enumerate(parser.scripts) if urlsplit(src).path.endswith("assets/js/analytics.js")]
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
        'id="slow-take"', 'id="problem"', 'id="case-sprint"',
        'id="how-it-works"', 'id="about"', 'id="contact"'
    )
    positions = [homepage.find(section) for section in homepage_sections]
    if any(position < 0 for position in positions) or positions != sorted(positions):
        errors.append("index.html: homepage sections must follow HERO > CASE PROBLEM > CASE SPRINT > HOW IT WORKS > ABOUT > START WITH A CASE")
    if 'href="#journal"' in homepage or "JOURNAL" in homepage:
        errors.append("index.html: JOURNAL must not appear in the primary homepage experience")
    if 'data-take-filter' in homepage or 'href="takes/"' in homepage:
        errors.append("index.html: Selected must not behave like an archive")
    if 'id="selected"' in homepage or '>SELECTED<' in homepage or '>PERSPECTIVES<' in homepage:
        errors.append("index.html: legacy PERSPECTIVES / SELECTED sections remain on the homepage")

    for css_path in root.glob("assets/css/*.css"):
        css = css_path.read_text(encoding="utf-8")
        for reference in re.findall(r"url\([\"']?([^\"')]+)", css):
            if is_local(reference) and not (css_path.parent / urlsplit(reference).path).resolve().exists():
                errors.append(f"{css_path.relative_to(root)}: missing local asset: {reference}")

    validate_selected(root, errors)
    validate_admin(root, errors)

    public_sources = [
        root / "index.html", root / "case-sprint/index.html", root / "takes/index.html", root / "privacy.html",
        root / "terms.html", *root.glob("assets/js/*.js")
    ]
    banned = (
        "HOOOO", "IP 核心", "轉換企劃", "A WAY OF LOOKING",
        "THREE WAYS OF LOOKING", "START A CONVERSATION", "最近在看。",
        "查看全部", "最新文章", "最新發布",
        "35slit.light@gmail.com", "mailto:", "\u738b\u6d69\u5b87", "3 VIDEOS"
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
