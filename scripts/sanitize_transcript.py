import re, pathlib, sys

BASE = pathlib.Path("/Users/moromoro/Desktop/MarkPdfPublisher")
tx_dir = BASE / "docs" / "CODEX_TRANSCRIPTS"
files = sorted(tx_dir.glob("*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
if not files:
    print("No transcript files found in", tx_dir); sys.exit(0)

path = files[0]  # usa il transcript più recente
txt = path.read_text(encoding="utf-8")

hdr = re.compile(r'^## (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+\-]\d{2}:\d{2}) — (user|codex)$', re.M)
parts, matches = [], list(hdr.finditer(txt))

# Se non ci sono blocchi strutturati, non riscrivere il file: evita di perdere contenuto
if not matches:
    print("No structured blocks found; leaving file unchanged.")
    sys.exit(0)

for i, h in enumerate(matches):
    start = h.end()
    end = matches[i+1].start() if i+1 < len(matches) else len(txt)
    ts, role = h.group(1), h.group(2)
    body = txt[start:end]

    if role == "user":
        out_lines = []
        for ln in body.splitlines():
            # Rimuovi solo rumore chiaramente identificabile dai blocchi IDE/patch,
            # ma conserva headings, liste e tabelle dell'utente.
            if re.match(r'^\s*(Active file|Open tabs|Active selection of the file):', ln, re.I):
                continue
            if ln.strip() in {"@@", "*** End Patch", "*** Begin Patch"}:
                continue
            out_lines.append(ln)
        # comprimi righe vuote multiple mantenendo il contenuto
        body = re.sub(r'\n{3,}', '\n\n', "\n".join(out_lines)).strip() + "\n"

    parts.append((ts, role, body))

# ricostruzione ordinata user→codex per timestamp
from collections import defaultdict
by_ts = defaultdict(dict)
for ts, role, body in parts:
    by_ts[ts][role] = body

# mantieni la prima riga titolo già presente nel file, se esiste
lines = txt.splitlines()
title = lines[0] if lines and lines[0].startswith("# ") else f"# Codex Full Transcript — {path.stem}"
out = [title, ""]
for ts in sorted(by_ts):
    if "user" in by_ts[ts]:
        out += [f"## {ts} — user", by_ts[ts]["user"].rstrip(), ""]
    if "codex" in by_ts[ts]:
        out += [f"## {ts} — codex", by_ts[ts]["codex"].rstrip(), ""]

path.write_text("\n".join(out).rstrip()+"\n", encoding="utf-8")
print("Sanitized:", path.name)
