#!/usr/bin/env python3
"""
gen_3d_icons_v2.py - 使用 Gemini 在一个会话中批量生成 3D claymorphism 风格图标，并用 remove.bg 去底。

- 在一个 chat 会话中连续生成多张图，风格保持一致。
- 参考图：从 public/icons/3d 选取若干张代表图（首轮发送给模型）
- 主提示词：固定 claymorphism 风格（见 MAIN_PROMPT）
- 具体提示词：根据要画的内容传入（可传多个，批量生成）
- 环境变量：GEMINI_API_KEY（.env / backend/.env），REMOVE_BG_API_KEY（你稍后配置）
- 依赖：pip install google-genai pillow python-dotenv requests

用法:
  python gen_3d_icons_v2.py "a wallet icon"
  python gen_3d_icons_v2.py "wallet" "chat bubble" "star"   # 同一会话批量，风格一致
  python gen_3d_icons_v2.py "star" -o my_star.png --no-removebg
"""

import os
import sys
import argparse
from pathlib import Path
from typing import Optional

# 尝试从项目根或 backend 目录加载 .env
def load_dotenv():
    try:
        from dotenv import load_dotenv as _load
        root = Path(__file__).resolve().parent
        _load(root / ".env") or _load(root / "backend" / ".env")
    except ImportError:
        pass

load_dotenv()

# 项目路径
PROJECT_ROOT = Path(__file__).resolve().parent
REF_ICONS_DIR = PROJECT_ROOT / "public" / "icons" / "3d"
OUTPUT_DIR = PROJECT_ROOT / "public" / "icons" / "3d" / "generated"  # 可改

# 代表参考图（从 3d 里选几张风格一致的）
REF_ICON_NAMES = [
    "dashboard.png",
    "star.png",
    "soulmate.png",
    "sparkles.png",
    "heart_pulse.png",
]

MAIN_PROMPT = (
    "3D icon, claymorphism style, cute and chubby shape, inflated, smooth rounded edges, "
    "soft gradient colors, glossy plastic material, soft studio lighting, ambient occlusion, "
    "minimal design, C4D, Blender, Octane render, high fidelity, 4k. "
    "Background: pure flat white only (#FFFFFF), no gradients, no shadows on background, no other elements."
)


def get_ref_images(max_count=3):
    """从 REF_ICONS_DIR 取最多 max_count 张参考图路径，确保存在."""
    refs = []
    for name in REF_ICON_NAMES:
        if len(refs) >= max_count:
            break
        p = REF_ICONS_DIR / name
        if p.exists():
            refs.append(p)
    return refs


def _extract_image_from_response(response) -> Optional[bytes]:
    """从 Gemini 返回中解析出图片字节。兼容 response.parts 或 response.candidates[0].content.parts"""
    parts = getattr(response, "parts", None)
    if parts is None and getattr(response, "candidates", None) and len(response.candidates) > 0:
        parts = getattr(response.candidates[0].content, "parts", None)
    if not parts:
        return None
    for part in parts:
        inline = getattr(part, "inline_data", None)
        if inline and getattr(inline, "data", None):
            return inline.data
    return None


def generate_icons_in_session(
    gemini_client,
    ref_image_paths: list,
    subjects: list[str],
    output_dir: Path,
    use_removebg: bool,
    removebg_api_key: str,
) -> list[Path]:
    """
    在一个 chat 会话中批量生成多张图，保证风格一致。
    首轮：发送参考图 + 风格说明；后续每轮：发送「下一个 subject」，拿到一张图并保存。
    返回成功保存的最终文件路径列表。
    """
    from PIL import Image
    from google.genai import types

    config = types.GenerateContentConfig(
        response_modalities=["TEXT", "IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="1:1"),
    )

    # 创建同一会话（同一 chat）
    chat = gemini_client.chats.create(
        model="gemini-2.5-flash-image",
        config=config,
    )

    # 首轮：参考图 + 风格主提示，让模型记住风格
    style_message = (
        f"{MAIN_PROMPT}\n\n"
        "Use the reference images above as style guide. "
        "We will generate a series of icons in this exact style. "
        "Each icon: 1:1 aspect ratio, no text, must have pure white background. Reply with OK when you understand the style."
    )
    contents = []
    for p in ref_image_paths:
        contents.append(Image.open(p))
    contents.append(style_message)

    try:
        first = chat.send_message(contents)
    except Exception as e:
        print(f"[Gemini] First message (style) error: {e}", file=sys.stderr)
        return []

    # 后续每轮：生成一个 subject 的图
    saved = []
    output_dir.mkdir(parents=True, exist_ok=True)

    for i, subject in enumerate(subjects):
        prompt = f"Generate the next icon in the same style. Subject: {subject}. No text. Single icon, 1:1 square. Pure white background only (#FFFFFF), flat white, no gradients or shadows on background."
        try:
            response = chat.send_message(
                prompt,
                config=config,
            )
        except Exception as e:
            print(f"[Gemini] Subject '{subject}' error: {e}", file=sys.stderr)
            continue

        raw_bytes = _extract_image_from_response(response)
        if not raw_bytes:
            print(f"[Gemini] No image for subject: {subject}", file=sys.stderr)
            continue

        slug = "".join(c if c.isalnum() or c in " -" else "_" for c in subject.strip())[:40].strip().replace(" ", "_") or f"icon_{i}"
        step1_path = output_dir / f"{slug}_with_bg.png"
        final_path = output_dir / f"{slug}.png"

        with open(step1_path, "wb") as f:
            f.write(raw_bytes)
        print(f"[OK] Generated: {step1_path}")

        if use_removebg and removebg_api_key:
            if remove_bg(step1_path, final_path, removebg_api_key):
                step1_path.unlink(missing_ok=True)
                saved.append(final_path)
            else:
                saved.append(step1_path)
        else:
            if step1_path != final_path:
                step1_path.rename(final_path)
            saved.append(final_path)

    return saved


def remove_bg(input_path: Path, output_path: Path, api_key: str) -> bool:
    """
    调用 remove.bg API 去背，输出 PNG（保留透明）.
    API 文档: https://www.remove.bg/api
    """
    if not api_key or api_key.strip() == "":
        print("[remove.bg] REMOVE_BG_API_KEY not set, skip background removal.", file=sys.stderr)
        return False

    import requests

    url = "https://api.remove.bg/v1.0/removebg"
    with open(input_path, "rb") as f:
        data = f.read()
    files = {"image_file": (input_path.name, data, "image/png")}
    headers = {"X-Api-Key": api_key}

    try:
        r = requests.post(url, files=files, headers=headers, timeout=60)
        r.raise_for_status()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(r.content)
        print(f"[OK] Background removed: {output_path}")
        return True
    except Exception as e:
        print(f"[remove.bg] Error: {e}", file=sys.stderr)
        return False


def main():
    parser = argparse.ArgumentParser(description="Generate 3D claymorphism icons in one session (consistent style) with Gemini + remove.bg")
    parser.add_argument(
        "subjects",
        nargs="*",
        default=["a cute star icon"],
        help="What to draw, one or more. e.g. 'wallet' 'chat bubble' 'star'. Same session = same style.",
    )
    parser.add_argument(
        "-o", "--output",
        default=None,
        help="Output filename for single subject only (under OUTPUT_DIR). Ignored when multiple subjects.",
    )
    parser.add_argument(
        "--no-removebg",
        action="store_true",
        help="Skip remove.bg step (only run Gemini)",
    )
    parser.add_argument(
        "--refs",
        type=int,
        default=3,
        help="Max number of reference images for first message (default 3)",
    )
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY not set. Set it in .env or backend/.env", file=sys.stderr)
        sys.exit(1)

    try:
        from google import genai
    except ImportError:
        print("Error: install google-genai: pip install google-genai", file=sys.stderr)
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    ref_paths = get_ref_images(max_count=args.refs)
    if not ref_paths:
        print("Error: No reference images found under", REF_ICONS_DIR, file=sys.stderr)
        sys.exit(1)
    print("Using reference images:", [p.name for p in ref_paths])
    print("Batch in one session:", args.subjects)

    rb_key = os.environ.get("REMOVE_BG_API_KEY", "").strip() if not args.no_removebg else ""
    if not args.no_removebg and not rb_key:
        print("[remove.bg] REMOVE_BG_API_KEY not set, will save with background.", file=sys.stderr)

    saved = generate_icons_in_session(
        client,
        ref_paths,
        args.subjects,
        OUTPUT_DIR,
        use_removebg=not args.no_removebg,
        removebg_api_key=rb_key,
    )

    if not saved:
        sys.exit(2)

    # 单 subject 且指定 -o 时，把第一个结果重命名为 -o
    if len(args.subjects) == 1 and args.output:
        target = OUTPUT_DIR / args.output
        if saved[0] != target and saved[0].exists():
            saved[0].rename(target)
            saved[0] = target

    print("Done. Outputs:", saved)


if __name__ == "__main__":
    main()
