#!/usr/bin/env python3
"""
Trim excessive transparent padding from PNG icons while preserving 1:1 output.

Behavior:
1) Detect non-transparent content by alpha threshold.
2) Crop to the content bounding box.
3) Re-pad onto a square canvas (no stretching, no deformation).

Examples:
  python3 scripts/fix_png_transparent_padding.py --input ./icons --output ./icons_fixed
  python3 scripts/fix_png_transparent_padding.py --input ./icon.png --in-place
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Iterable

try:
    from PIL import Image
except Exception:
    print("Pillow is required. Install with: pip3 install pillow", file=sys.stderr)
    raise


def iter_png_files(path: Path) -> Iterable[Path]:
    if path.is_file():
        if path.suffix.lower() == ".png":
            yield path
        return
    for p in path.rglob("*.png"):
        if p.is_file():
            yield p


def trim_and_square(
    src: Path,
    dst: Path,
    alpha_threshold: int,
    pad_ratio: float,
    min_size: int,
) -> tuple[int, int]:
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    alpha = img.getchannel("A")

    # bbox for pixels with alpha > threshold
    mask = alpha.point(lambda a: 255 if a > alpha_threshold else 0, mode="L")
    bbox = mask.getbbox()
    if bbox is None:
        # Fully transparent, keep original as square if needed
        side = max(w, h, min_size)
        out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        out.save(dst, "PNG")
        return (w, h)

    cropped = img.crop(bbox)
    cw, ch = cropped.size

    # Keep 1:1 canvas, no stretch. Add controlled padding.
    content_side = max(cw, ch)
    base_side = max(int(round(content_side * (1.0 + max(0.0, pad_ratio)))), min_size)
    side = max(base_side, content_side)

    out = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    x = (side - cw) // 2
    y = (side - ch) // 2
    out.alpha_composite(cropped, (x, y))

    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, "PNG")
    return (w, h)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Trim transparent PNG padding and output square icons without distortion."
    )
    p.add_argument("--input", required=True, help="Input PNG file or directory")
    p.add_argument(
        "--output",
        help="Output file/dir. Required unless --in-place is set.",
    )
    p.add_argument(
        "--in-place",
        action="store_true",
        help="Overwrite source files in place.",
    )
    p.add_argument(
        "--alpha-threshold",
        type=int,
        default=8,
        help="Alpha threshold (0-255) for content detection. Default: 8",
    )
    p.add_argument(
        "--pad-ratio",
        type=float,
        default=0.06,
        help="Extra square padding ratio around content. Default: 0.06",
    )
    p.add_argument(
        "--min-size",
        type=int,
        default=1,
        help="Minimum output side length. Default: 1",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()
    src_path = Path(args.input).expanduser().resolve()
    if not src_path.exists():
        print(f"Input not found: {src_path}", file=sys.stderr)
        return 1

    if not args.in_place and not args.output:
        print("Either --output or --in-place is required.", file=sys.stderr)
        return 1

    out_path = Path(args.output).expanduser().resolve() if args.output else None

    files = list(iter_png_files(src_path))
    if not files:
        print("No PNG files found.")
        return 0

    processed = 0
    for src in files:
        if args.in_place:
            dst = src
        else:
            assert out_path is not None
            if src_path.is_file():
                dst = out_path
            else:
                dst = out_path / src.relative_to(src_path)

        before = src.stat().st_size if src.exists() else 0
        old_size = trim_and_square(
            src=src,
            dst=dst,
            alpha_threshold=max(0, min(255, args.alpha_threshold)),
            pad_ratio=max(0.0, args.pad_ratio),
            min_size=max(1, args.min_size),
        )
        after = dst.stat().st_size if dst.exists() else 0
        processed += 1
        print(
            f"[OK] {src} -> {dst} | {old_size[0]}x{old_size[1]} | {before}B -> {after}B"
        )

    print(f"Done. Processed {processed} PNG file(s).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

