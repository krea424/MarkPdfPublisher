Eisvogel LaTeX Template (vendor)

This directory is reserved for the Eisvogel template file used by Pandoc.

How to add:
- Download the template from the official repository: https://github.com/Wandmalfarbe/pandoc-latex-template
- The upstream file is commonly named `eisvogel.latex` (sometimes distributed as `eisvogel.tex`).
- Place it here as either:
  - `Toolchain/Templates/eisvogel/eisvogel.latex` (recommended), or
  - `Toolchain/Templates/eisvogel/eisvogel.tex`
  The toolchain supports both filenames.

Notes
- License: BSD-3-Clause (see upstream repository). Include attribution when distributing.
- Requirements: Pandoc, XeLaTeX and the LaTeX packages listed in the upstream README.
- Usage: Select the "Eisvogel (LaTeX)" template in the UI, or pass `--template eisvogel` to the toolchain.

Tips
- Options like `titlepage`, headers/footers, brand colors, watermark, etc., are configured via YAML front matter in the Markdown.
- You can also pass `-V` variables via the CLI; the app already forwards `--toc` and `--variable logo=...` when a logo is provided.
