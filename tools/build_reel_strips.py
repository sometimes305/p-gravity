from __future__ import annotations

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ORDER = [9, 8, 7, 6, 5, 4, 3, 2, 1]
STRIP_W = 200
STRIP_H = 2400
CELL_H = STRIP_H / len(ORDER)


def paste_symbol(strip: Image.Image, source: Path, index: int) -> None:
    symbol = Image.open(source).convert("RGBA")
    scale = min(STRIP_W / symbol.width, CELL_H / symbol.height)
    size = (round(symbol.width * scale), round(symbol.height * scale))
    symbol = symbol.resize(size, Image.Resampling.LANCZOS)
    x = round((STRIP_W - symbol.width) / 2)
    y = round(index * CELL_H + (CELL_H - symbol.height) / 2)
    strip.alpha_composite(symbol, (x, y))


def build_strip(kind: str, output_name: str) -> None:
    src_dir = ROOT / "assets" / kind
    strip = Image.new("RGBA", (STRIP_W, STRIP_H), (0, 0, 0, 0))
    for index, number in enumerate(ORDER):
        paste_symbol(strip, src_dir / f"{number}.png", index)
    strip.save(ROOT / "assets" / output_name)


def main() -> None:
    build_strip("symbols", "strip_omote.png")
    build_strip("symbols_back", "strip_ura.png")
    print("rebuilt=assets/strip_omote.png")
    print("rebuilt=assets/strip_ura.png")


if __name__ == "__main__":
    main()
