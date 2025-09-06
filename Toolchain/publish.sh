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
# Validate template type
if [[ "$TEMPLATE_TYPE" != "classic" && "$TEMPLATE_TYPE" != "consulting" ]]; then
  echo "⚠️  Template type '$TEMPLATE_TYPE' non valido, uso 'consulting' come default"
  TEMPLATE_TYPE="consulting"
fi

# Set template directory based on type
TEMPLATE_DIR="$SCRIPT_DIR/Templates/$TEMPLATE_TYPE"
export TEXINPUTS="${TEMPLATE_DIR}:${TEXINPUTS:-}"
DEFAULT_TEX="$TEMPLATE_DIR/default.tex"
HEADER_FOOTER_TEX="$TEMPLATE_DIR/header_footer.tex"
COVER_TEX="$TEMPLATE_DIR/cover.tex"

echo "📋 Using template style: $TEMPLATE_TYPE"

[[ -f "$DEFAULT_TEX" ]] || die "Template default.tex non trovato: $DEFAULT_TEX"
[[ -f "$HEADER_FOOTER_TEX" ]] || die "Template header_footer.tex non trovato: $HEADER_FOOTER_TEX"
[[ -f "$COVER_TEX" ]] || die "Template cover.tex non trovato: $COVER_TEX"

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

# === A) Preflight file chiave ===
for f in "$DEFAULT_TEX" "$HEADER_FOOTER_TEX" "$COVER_TEX" "$INPUT_MD"; do
  [ -f "$f" ] || die "Manca file richiesto: $f"
done

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
  --include-in-header "$HEADER_FOOTER_TEX"
  --include-before-body "$COVER_TEX"
  --resource-path "$RESOURCE_PATH"
  -o "$OUTPUT_PDF"
)

# Abilita TOC se richiesto
if [[ "$ENABLE_TOC" -eq 1 ]]; then
  PANDOC_ARGS+=(--toc --toc-depth "$TOC_DEPTH")
fi

# Aggiungi logo solo se il file esiste
if [[ -n "$LOGO" && -f "$LOGO" ]]; then
  PANDOC_ARGS+=(--variable logo="$LOGO")
fi

pandoc "${PANDOC_ARGS[@]}" || die "Errore durante la generazione del PDF"

# ----- Esito -----
[[ -f "$OUTPUT_PDF" ]] && echo "✅ PDF generato con successo: $OUTPUT_PDF"
