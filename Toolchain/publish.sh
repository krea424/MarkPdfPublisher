#!/usr/bin/env bash
set -euo pipefail

# ============================================
# BrightLedger – MD_First_PDF_Publish v0.3.1
# Generatore PDF (Pandoc + XeLaTeX)
# Architettura: default.tex (macro) + header_footer.tex + cover.tex
# - Nessun metadata_bridge.tex
# - TOC configurabile via flag (--toc/--no-toc, --toc-depth N)
# - Il logo è passato come variabile Pandoc (--variable logo=...) ed è opzionale
# ============================================

die() { echo "❌ $*" >&2; exit 1; }

# ----- Dipendenze minime -----
command -v pandoc >/dev/null 2>&1 || die "Pandoc non trovato. Installa Pandoc e riprova."
command -v xelatex >/dev/null 2>&1 || die "XeLaTeX non trovato. Installa MacTeX/TeXLive e riprova."

# ----- Localizzazione script/toolchain -----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"   # Tools/MD_First_PDF_Publish
# Prova a individuare la root del repo; fallback: due livelli sopra Tool root
REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${REPO_ROOT:-}" ]]; then
  REPO_ROOT="$(cd "$TOOL_ROOT/../.." && pwd)"
fi

# Logo di default (opzionale, ricercato tra asset locali). Se non trovato, nessun logo.
LOGO_DEFAULT=""
for cand in \
  "$SCRIPT_DIR/attached_assets/logo.pdf" \
  "$SCRIPT_DIR/attached_assets/logo.png" \
  "$SCRIPT_DIR/attached_assets/logo.jpg" \
  "$SCRIPT_DIR/attached_assets/logo.jpeg" \
  "$SCRIPT_DIR/attached_assets/logo.svg"; do
  if [[ -f "$cand" ]]; then LOGO_DEFAULT="$cand"; break; fi
done
LOGO="${LOGO_DEFAULT:-}"

# Template type default
TEMPLATE_TYPE="consulting" # Default to consulting style

# TOC flags (default: attivo con profondità 3)
ENABLE_TOC=1
TOC_DEPTH=3

# Parsing argomenti opzionali
# NOTA: L'input .md è il primo argomento posizionale, gli altri sono flag.
# Si assume che lo script venga chiamato come: ./publish.sh file.md --logo /path/logo.png --template classic

TEMP_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --logo)
      LOGO="$2"
      shift 2
      ;;
    --template)
      TEMPLATE_TYPE="$2"
      shift 2
      ;;
    --toc)
      ENABLE_TOC=1
      shift 1
      ;;
    --no-toc)
      ENABLE_TOC=0
      shift 1
      ;;
    --toc-depth)
      TOC_DEPTH="$2"
      shift 2
      ;;
    *)
      TEMP_ARGS+=("$1")
      shift
      ;;
  esac
done

# Ripristina gli argomenti posizionali (dovrebbe rimanere solo INPUT_MD)
set -- "${TEMP_ARGS[@]}"
INPUT_MD="${1:-}"

# ----- Argomenti -----
[[ -z "$INPUT_MD" ]] && die "Errore: specifica un file .md come input. Uso: $0 path/al/file.md"
[[ -f "$INPUT_MD" ]] || die "Errore: file Markdown non trovato: $INPUT_MD"

# ----- Path template & asset -----
###### Template selection and layout ######
# Validate template type
if [[ "$TEMPLATE_TYPE" != "classic" && "$TEMPLATE_TYPE" != "consulting" && "$TEMPLATE_TYPE" != "eisvogel" ]]; then
  echo "⚠️  Template type '$TEMPLATE_TYPE' non valido, uso 'consulting' come default"
  TEMPLATE_TYPE="consulting"
fi

# Set template directory and files based on type
TEMPLATE_DIR="$SCRIPT_DIR/Templates/$TEMPLATE_TYPE"
export TEXINPUTS="${TEMPLATE_DIR}:${TEXINPUTS:-}"

if [[ "$TEMPLATE_TYPE" == "eisvogel" ]]; then
  # Eisvogel uses a single template file and handles titlepage/header/footer internally
  # Support both upstream filename variants: eisvogel.tex or eisvogel.latex
  if [[ -f "$TEMPLATE_DIR/eisvogel.tex" ]]; then
    DEFAULT_TEX="$TEMPLATE_DIR/eisvogel.tex"
  elif [[ -f "$TEMPLATE_DIR/eisvogel.latex" ]]; then
    DEFAULT_TEX="$TEMPLATE_DIR/eisvogel.latex"
  else
    die "Template Eisvogel non trovato: atteso 'eisvogel.tex' o 'eisvogel.latex' in $TEMPLATE_DIR"
  fi
  HEADER_FOOTER_TEX=""
  COVER_TEX=""
else
  DEFAULT_TEX="$TEMPLATE_DIR/default.tex"
  HEADER_FOOTER_TEX="$TEMPLATE_DIR/header_footer.tex"
  COVER_TEX="$TEMPLATE_DIR/cover.tex"
fi

echo "📋 Using template style: $TEMPLATE_TYPE"

# Preflight check: required files vary by template type
if [[ "$TEMPLATE_TYPE" == "eisvogel" ]]; then
  [[ -f "$DEFAULT_TEX" ]] || die "Template Eisvogel non trovato: $DEFAULT_TEX"
  # Resolve data for Eisvogel partials. We support either an upstream
  # 'templates/' folder OR the 'template-multi-file/' layout from the ZIP.
  # We will prepare a local data-dir in the working directory and copy partials there.
  CAND_FILE="$(find "$TEMPLATE_DIR" -maxdepth 3 -type f -name 'eisvogel-added.latex' 2>/dev/null | head -n 1 || true)"
  if [[ -z "$CAND_FILE" ]]; then
    echo "❌ Mancano i file aggiuntivi di Eisvogel (eisvogel-added.latex non trovato)" >&2
    echo "   Assicurati di aver scaricato anche i file parziali (templates o template-multi-file)." >&2
    die "Eisvogel templates mancanti"
  fi
  EIS_PARTIALS_DIR="$(cd "$(dirname "$CAND_FILE")" && pwd)"
  # Prepare local data-dir under current working dir (publish.sh is run with cwd=temp_dir)
  EISVOGEL_DATA_DIR="$PWD/eisvogel-data"
  mkdir -p "$EISVOGEL_DATA_DIR/templates"
  # Copy all partials (.latex) into data-dir/templates
  cp -f "$EIS_PARTIALS_DIR"/*.latex "$EISVOGEL_DATA_DIR/templates/" 2>/dev/null || true
  # Sanity check
  [[ -f "$EISVOGEL_DATA_DIR/templates/eisvogel-added.latex" ]] || die "Setup parziali Eisvogel fallito: file mancanti in $EISVOGEL_DATA_DIR/templates"

  # Style tweak: place title page logo above the centered title instead of below-left.
  # We patch the copied 'eisvogel-title-page.latex' in the temp data-dir so upstream files remain untouched.
  if [[ -f "$EISVOGEL_DATA_DIR/templates/eisvogel-title-page.latex" ]]; then
    awk '
      BEGIN { inserted=0; skip=0 }
      /\\makebox\[0pt\]\[l\]\{\\colorRule/ && inserted==0 {
        print $0;
        print "$if(titlepage-logo)$";
        print "\\begin{center}";
        print "\\includegraphics[width=$if(logo-width)$$logo-width$$else$35mm$endif$]{$titlepage-logo$}";
        print "\\end{center}";
        print "\\vspace{1em}";
        print "$endif$";
        inserted=1;
        next
      }
      /^\$if\(titlepage-logo\)\$/ { skip=1; next }
      skip==1 && /^\$endif\$/ { skip=0; next }
      skip==1 { next }
      { print $0 }
    ' "$EISVOGEL_DATA_DIR/templates/eisvogel-title-page.latex" > "$EISVOGEL_DATA_DIR/templates/.eisvogel-title-page.patched" && \
    mv "$EISVOGEL_DATA_DIR/templates/.eisvogel-title-page.patched" "$EISVOGEL_DATA_DIR/templates/eisvogel-title-page.latex" || true
  fi
else
  [[ -f "$DEFAULT_TEX" ]] || die "Template default.tex non trovato: $DEFAULT_TEX"
  [[ -f "$HEADER_FOOTER_TEX" ]] || die "Template header_footer.tex non trovato: $HEADER_FOOTER_TEX"
  [[ -f "$COVER_TEX" ]] || die "Template cover.tex non trovato: $COVER_TEX"
fi

# Verifica logo (usa quello passato o fallback al default se esiste)
if [[ ! -f "$LOGO" ]]; then
  echo "⚠️  Logo specificato non trovato: $LOGO"
  if [[ -f "$LOGO_DEFAULT" ]]; then
    LOGO="$LOGO_DEFAULT"
    echo "ℹ️  Usando logo di default: $LOGO"
  else
    echo "⚠️  Nessun logo disponibile, continuo senza logo"
    LOGO=""
  fi
fi

# Se il logo è un SVG, prova una conversione automatica in PDF/PNG per compatibilità con XeLaTeX
if [[ -n "${LOGO:-}" && -f "$LOGO" ]]; then
  ext="${LOGO##*.}"; ext="${ext,,}"
  if [[ "$ext" == "svg" ]]; then
    echo "ℹ️  Rilevato logo SVG: tenterò la conversione per LaTeX"
    base_noext="${LOGO%.*}"
    if command -v rsvg-convert >/dev/null 2>&1; then
      out_pdf="${base_noext}.pdf"
      rsvg-convert -f pdf -o "$out_pdf" "$LOGO" && LOGO="$out_pdf" && echo "✅ Convertito SVG→PDF con rsvg-convert: $LOGO" || true
    fi
    if [[ "${LOGO##*.}" == "svg" ]] && command -v inkscape >/dev/null 2>&1; then
      out_pdf="${base_noext}.pdf"
      inkscape "$LOGO" --export-type=pdf --export-filename="$out_pdf" && LOGO="$out_pdf" && echo "✅ Convertito SVG→PDF con Inkscape: $LOGO" || true
    fi
    if [[ "${LOGO##*.}" == "svg" ]] && command -v magick >/dev/null 2>&1; then
      out_png="${base_noext}.png"
      magick -density 300 "$LOGO" -background none -flatten "$out_png" && LOGO="$out_png" && echo "✅ Convertito SVG→PNG con ImageMagick: $LOGO" || true
    elif [[ "${LOGO##*.}" == "svg" ]] && command -v convert >/dev/null 2>&1; then
      out_png="${base_noext}.png"
      convert -density 300 "$LOGO" -background none -flatten "$out_png" && LOGO="$out_png" && echo "✅ Convertito SVG→PNG con ImageMagick: $LOGO" || true
    fi
    if [[ "${LOGO##*.}" == "svg" ]]; then
      echo "❌ Immagine SVG non supportata senza strumenti di conversione (rsvg-convert/inkscape/ImageMagick)." >&2
      echo "   Suggerimenti: 'brew install librsvg' oppure 'brew install --cask inkscape' oppure 'brew install imagemagick'." >&2
      echo "   In alternativa carica un logo PDF/PNG/JPG. Procedo senza logo." >&2
      LOGO=""
    fi
  fi
fi

# === A) Preflight file chiave ===
# Template files are validated above per template type; here ensure input exists.
[ -f "$INPUT_MD" ] || die "Manca file richiesto: $INPUT_MD"

# Rende disponibili i template anche a XeLaTeX
export TEXINPUTS="${TEMPLATE_DIR}:$TEXINPUTS"

# Dove Pandoc deve cercare le risorse (immagini, ecc.)
DOC_DIR="$(cd "$(dirname "$INPUT_MD")" && pwd)"
RESOURCE_PATH="${DOC_DIR}:${REPO_ROOT:-$DOC_DIR}"

# ----- Output (accanto al sorgente .md) -----
OUTPUT_PDF="${INPUT_MD%.md}.pdf"

# ----- DRY RUN -----
if [[ "${2:-}" == "--dry-run" ]]; then
  cat <<INFO
🔎 DRY RUN
REPO_ROOT     = $REPO_ROOT
TOOL_ROOT     = $TOOL_ROOT
TEMPLATE_DIR  = $TEMPLATE_DIR
DEFAULT_TEX   = $DEFAULT_TEX
HEADER_FOOTER = $HEADER_FOOTER_TEX
COVER_TEX     = $COVER_TEX
LOGO          = $LOGO
INPUT_MD      = $INPUT_MD
OUTPUT_PDF    = $OUTPUT_PDF
INFO
  exit 0
fi

# ----- Font check (soft) -----
if command -v fc-list >/dev/null 2>&1; then
  if fc-list | grep -qi "TeX Gyre Termes"; then
    echo "✅ Font TeX Gyre rilevati (Termes/Heros)"
  else
    echo "⚠️  Font TeX Gyre non rilevati: il template usa TeX Gyre Termes/Heros."
    echo "   Se la compilazione fallisce, installa:"
    echo "   brew install --cask font-tex-gyre-termes font-tex-gyre-heros"
  fi
else
  echo "ℹ️  'fc-list' non disponibile: salto il controllo font."
fi

# ----- Log esecuzione -----
echo "🚀 Generazione PDF da: $INPUT_MD"
echo "📌 Template: $DEFAULT_TEX"
echo "📌 Include header: $HEADER_FOOTER_TEX"
echo "📌 Include cover : $COVER_TEX"
echo "📌 Logo: ${LOGO:-<none>}"
echo "📌 TOC: $([[ "$ENABLE_TOC" -eq 1 ]] && echo enabled || echo disabled) (depth=$TOC_DEPTH)"

# ----- Comando Pandoc -----
PANDOC_ARGS=(
  "$INPUT_MD"
  --from markdown
  --pdf-engine=xelatex
  --template "$DEFAULT_TEX"
  --resource-path "$RESOURCE_PATH"
  -o "$OUTPUT_PDF"
)

# Include header/cover only for classic/consulting templates
if [[ "$TEMPLATE_TYPE" != "eisvogel" ]]; then
  PANDOC_ARGS+=(--include-in-header "$HEADER_FOOTER_TEX" --include-before-body "$COVER_TEX")
fi

# Eisvogel: prefer LaTeX 'listings' for code blocks to avoid missing Highlighting macros
if [[ "$TEMPLATE_TYPE" == "eisvogel" ]]; then
  # Point Pandoc data-dir to the folder that contains a 'templates/' subdir
  PANDOC_ARGS+=(--data-dir "$EISVOGEL_DATA_DIR")
  PANDOC_ARGS+=(--listings)
fi

# Abilita TOC se richiesto
if [[ "$ENABLE_TOC" -eq 1 ]]; then
  PANDOC_ARGS+=(--toc --toc-depth "$TOC_DEPTH")
fi

# Aggiungi logo solo se il file esiste
if [[ -n "$LOGO" && -f "$LOGO" ]]; then
  if [[ "$TEMPLATE_TYPE" == "eisvogel" ]]; then
    # Eisvogel expects 'titlepage-logo' on the title page.
    # Pass a basename so LaTeX resolves it relative to the working dir (temp_dir).
    LOGO_BASENAME="$(basename "$LOGO")"
    PANDOC_ARGS+=(-V "titlepage-logo=$LOGO_BASENAME")
    # Also pass generic 'logo' for compatibility with other template logic
    PANDOC_ARGS+=(-V "logo=$LOGO_BASENAME")
  else
    PANDOC_ARGS+=(--variable logo="$LOGO")
  fi
fi

pandoc "${PANDOC_ARGS[@]}" || die "Errore durante la generazione del PDF"

# ----- Esito -----
[[ -f "$OUTPUT_PDF" ]] && echo "✅ PDF generato con successo: $OUTPUT_PDF"
