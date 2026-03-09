"""
Install Argos Translate language packs for offline translation.

Example:
  python install_offline_language_packs.py --langs hi,bn,ta,te,mr,gu,kn,ml,or,pa,ur
"""
from __future__ import annotations

import argparse
from typing import List

import argostranslate.package
import argostranslate.translate


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Install offline translation packs (Argos).")
    parser.add_argument(
        "--langs",
        type=str,
        default="hi,bn,ta,te,mr,gu,kn,ml,or,pa,ur",
        help="Comma-separated target language codes to install from English (e.g. hi,bn,ta).",
    )
    return parser.parse_args()


def pick_best_package(from_code: str, to_code: str, packages: List[argostranslate.package.Package]):
    candidates = [p for p in packages if p.from_code == from_code and p.to_code == to_code]
    if not candidates:
        return None
    # Prefer newer package version where available.
    candidates.sort(key=lambda p: str(p.package_version), reverse=True)
    return candidates[0]


def has_installed_translation(from_code: str, to_code: str) -> bool:
    try:
        langs = argostranslate.translate.get_installed_languages()
        from_lang = next((l for l in langs if l.code == from_code), None)
        to_lang = next((l for l in langs if l.code == to_code), None)
        if not from_lang or not to_lang:
            return False
        from_lang.get_translation(to_lang)
        return True
    except Exception:
        return False


def main() -> None:
    args = parse_args()
    target_codes = [x.strip() for x in args.langs.split(",") if x.strip()]

    print("[info] Updating Argos package index...")
    argostranslate.package.update_package_index()
    available_packages = argostranslate.package.get_available_packages()

    installed = 0
    skipped = 0
    for code in target_codes:
        if has_installed_translation("en", code):
            print(f"[skip] en->{code} already installed.")
            skipped += 1
            continue

        pkg = pick_best_package("en", code, available_packages)
        if not pkg:
            print(f"[skip] No en->{code} package available in Argos index.")
            skipped += 1
            continue
        print(f"[info] Installing en->{code} ({pkg.package_version}) ...")
        download_path = pkg.download()
        argostranslate.package.install_from_path(download_path)
        installed += 1
        print(f"[ok] Installed en->{code}")

    print(f"[done] Installed={installed}, skipped={skipped}")
    print("[note] After installation, translation works offline for installed languages.")


if __name__ == "__main__":
    main()
