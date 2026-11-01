from pathlib import Path
import shutil


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
DIST = ROOT / "dist"


def copy_tree(source: Path, destination: Path) -> None:
    if destination.exists():
        shutil.rmtree(destination)
    shutil.copytree(source, destination)


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    shutil.copy2(SRC / "pages" / "home.html", DIST / "index.html")
    (DIST / "asistencia").mkdir()
    shutil.copy2(SRC / "pages" / "asistencia.html", DIST / "asistencia" / "index.html")
    (DIST / "dashboard").mkdir()
    shutil.copy2(SRC / "pages" / "dashboard.html", DIST / "dashboard" / "index.html")

    for directory in ("css", "js", "assets"):
        copy_tree(SRC / directory, DIST / directory)

    (DIST / ".nojekyll").touch()
    print(f"Built {DIST}")


if __name__ == "__main__":
    main()
