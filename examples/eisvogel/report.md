---
title: "Sample Consulting Report"
author: "Company Alfa"
date: "2025-09-07"
titlepage: true
# Optional if not passed via UI upload:
# logo: images/logo.png
# Example additional options (see Eisvogel README):
# colorlinks: true
# header-left: "Sample Report"
# header-right: "Your Company"
# footer-center: "Confidential"
---

# Executive Summary

This sample demonstrates Eisvogel’s consulting-grade PDF styling using Pandoc + XeLaTeX.

## Key Points
- Professional title page via `titlepage: true`.
- Headers and footers configurable via YAML.
- Tables and code listings styled for readability.

## Data Table

| Metric        | Value |
|---------------|------:|
| Revenue (Q1)  | 1.23M |
| Revenue (Q2)  | 1.45M |
| YoY Growth    |  18%  |

## Code Sample

```python
def kpi(delta, base=100):
    return base * (1 + delta)

print(kpi(0.18))  # -> 118.0
```

## Notes

This is a footnote reference.[^1]

[^1]: Example footnote rendered with Eisvogel’s styling.

