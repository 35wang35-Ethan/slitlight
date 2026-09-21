"""Build the same static artifact as pages.yml, without changing site sources."""

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public"

# Keep this allowlist in sync with pages.yml's Prepare public frontend step.
FILES = (
    "index.html", "privacy.html", "terms.html", "admin.html", "favicon.ico",
    "robots.txt", "sitemap.xml", "google03850f274d84bd8f.html",
    "admin/index.html", "admin/login.html",
    "assets/favicon.svg", "assets/brand-symbol.svg",
    "takes/index.html", "case-sprint/index.html", "video-audit/index.html",
)
DIRECTORIES = (
    "assets/css", "assets/js", "assets/data", "assets/vendor", "assets/brand",
)
IMAGE_STEMS = (
    "about", "slow-take-hero", "perspective-choice", "perspective-second-look",
    "perspective-frame", "selected-choice", "selected-frame",
)
IMAGE_SUFFIXES = (".jpg", "-768.jpg", ".webp", "-768.webp")


def main() -> None:
    # Resolve and check the exact deletion target before removing old output.
    if OUTPUT.is_symlink() or OUTPUT.resolve() != ROOT / "public":
        raise RuntimeError("Refusing to replace a linked public directory")
    if OUTPUT.exists() and not OUTPUT.is_dir():
        raise RuntimeError("public must be a directory")

    files = {ROOT / name for name in FILES}
    files.update(
        ROOT / "assets/images" / f"{stem}{suffix}"
        for stem in IMAGE_STEMS for suffix in IMAGE_SUFFIXES
    )
    directories = {ROOT / name for name in DIRECTORIES}
    for directory in sorted(directories):
        if not directory.is_dir():
            raise FileNotFoundError(directory)
        for entry in sorted(directory.rglob("*")):
            if entry.is_dir():
                directories.add(entry)
            else:
                files.add(entry)
    for source in sorted(files | directories):
        if source.is_symlink() or source.resolve() != source:
            raise RuntimeError(f"Refusing linked source: {source}")
        if source in files and not source.is_file():
            raise FileNotFoundError(source)

    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    for directory in sorted(directories):
        (OUTPUT / directory.relative_to(ROOT)).mkdir(parents=True, exist_ok=True)
    for source in sorted(files):
        destination = OUTPUT / source.relative_to(ROOT)
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    print(f"Built public/ ({len(files)} files) from the existing website source.")


if __name__ == "__main__":
    main()
