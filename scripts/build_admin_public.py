"""Build and verify the exact Admin-only static artifact from source."""

from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "admin-public"
FILES = (
    "admin/index.html",
    "assets/css/admin.css",
    "assets/js/admin.js",
    "assets/favicon.svg",
    "assets/brand-symbol.svg",
)


def main() -> None:
    if OUTPUT.is_symlink() or OUTPUT.resolve() != ROOT / "admin-public":
        raise RuntimeError("Refusing to replace a linked admin-public directory")
    if OUTPUT.exists() and not OUTPUT.is_dir():
        raise RuntimeError("admin-public must be a directory")
    for name in FILES:
        source = ROOT / name
        if source.is_symlink() or source.resolve() != source:
            raise RuntimeError(f"Refusing linked source: {source}")
        if not source.is_file():
            raise FileNotFoundError(source)
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    for name in FILES:
        destination = OUTPUT / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / name, destination)
    actual = {p.relative_to(OUTPUT).as_posix() for p in OUTPUT.rglob("*") if p.is_file()}
    if actual != set(FILES):
        raise RuntimeError("Admin artifact does not match its exact allowlist")
    for name in FILES:
        if (OUTPUT / name).read_bytes() != (ROOT / name).read_bytes():
            raise RuntimeError(f"Admin artifact differs from source: {name}")
    print(f"Built and verified admin-public/ ({len(FILES)} required files; no extra assets).")


if __name__ == "__main__":
    main()
