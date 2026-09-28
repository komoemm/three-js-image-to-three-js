#!/usr/bin/env python3
"""
Simple pipeline runner for img2threejs.
Automates Stage 1 (Intake), Stage 2 (Assessment & Spec), and Stage 3 (Factory Code Generation).

Usage:
    python scripts/reconstruct.py --image <path/to/reference.png> --name "ModelName"
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    os.environ["PYTHONUTF8"] = "1"
    os.environ["PYTHONIOENCODING"] = "utf-8"

REPO_ROOT = Path(__file__).resolve().parent.parent
FORGE_DIR = REPO_ROOT / "forge"


def run_command(cmd: list[str], desc: str) -> None:
    print(f"\n[img2threejs] >>> {desc}...")
    print(f"Command: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=REPO_ROOT, text=True, capture_output=True)
    if result.stdout:
        print(result.stdout.strip())
    if result.returncode != 0:
        if result.stderr:
            print(f"[ERROR] {result.stderr.strip()}", file=sys.stderr)
        print(f"[img2threejs] FAILED at step: {desc} (Exit code {result.returncode})", file=sys.stderr)
        sys.exit(result.returncode)


def main():
    parser = argparse.ArgumentParser(description="Run img2threejs automated reconstruction pipeline.")
    parser.add_argument("--image", required=True, help="Path to reference image (PNG, JPG, WebP)")
    parser.add_argument("--name", default="ReconstructedObject", help="Descriptive name of the object")
    parser.add_argument("--out-dir", default="output", help="Directory for output specs and assessment")
    parser.add_argument("--allow-nonstrict", action="store_true", help="Allow nonstrict generation for quick draft testing")
    args = parser.parse_args()

    image_path = Path(args.image).resolve()
    if not image_path.exists():
        print(f"Error: Reference image not found at {image_path}", file=sys.stderr)
        sys.exit(1)

    out_dir = Path(args.out_dir).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)

    slug = "".join(c if c.isalnum() else "_" for c in args.name.lower()).strip("_")
    assessment_file = out_dir / f"{slug}_assessment.json"
    spec_file = out_dir / f"{slug}_spec.json"
    ts_factory_file = REPO_ROOT / "viewer" / "src" / "models" / f"{slug}Model.ts"

    print("=" * 60)
    print(f"  img2threejs Automated Reconstruction: {args.name}")
    print(f"  Reference: {image_path}")
    print("=" * 60)

    # Stage 1: Probe Image
    run_command(
        [sys.executable, str(FORGE_DIR / "stage1_intake" / "probe_image.py"), str(image_path)],
        "Stage 1: Probing image metadata and technical suitability"
    )

    # Stage 2: Assessment
    run_command(
        [
            sys.executable,
            str(FORGE_DIR / "stage2_spec" / "new_pre_spec_assessment.py"),
            args.name,
            "--image", str(image_path),
            "--out", str(assessment_file),
        ],
        "Stage 2a: Authoring pre-spec assessment"
    )

    # Stage 2: Sculpt Spec
    run_command(
        [
            sys.executable,
            str(FORGE_DIR / "stage2_spec" / "new_sculpt_spec.py"),
            args.name,
            "--image", str(image_path),
            "--assessment", str(assessment_file),
            "--out", str(spec_file),
        ],
        "Stage 2b: Authoring ObjectSculptSpec"
    )

    # Stage 2: Validation
    validate_cmd = [
        sys.executable,
        str(FORGE_DIR / "stage2_spec" / "validate_sculpt_spec.py"),
        str(spec_file),
    ]
    if not args.allow_nonstrict:
        validate_cmd.append("--strict-quality")
    run_command(validate_cmd, "Stage 2c: Validating ObjectSculptSpec")

    # Stage 3: Factory Generation
    codegen_cmd = [
        sys.executable,
        str(FORGE_DIR / "stage3_build" / "generate_threejs_factory.py"),
        str(spec_file),
        "--out", str(ts_factory_file),
    ]
    if args.allow_nonstrict:
        codegen_cmd.append("--allow-nonstrict")

    run_command(codegen_cmd, f"Stage 3: Generating Three.js factory -> {ts_factory_file.name}")

    print("\n" + "=" * 60)
    print("  [SUCCESS] Procedural Three.js Model Generated!")
    print(f"  Factory code:  {ts_factory_file}")
    print(f"  Sculpt spec:   {spec_file}")
    print(f"  Assessment:    {assessment_file}")
    print("=" * 60)
    print("\nTo view and test your 3D model:")
    print("  1. Launch the workbench: cd viewer && npm run dev")
    print("  2. Open http://localhost:5173/ in your browser")
    print("=" * 60)


if __name__ == "__main__":
    main()
