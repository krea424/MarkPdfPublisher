---
title: "Project Charter: MarkPdfPublisher"
author: "Moro Moromoro"
owner: "PM"
project_name: "MarkPdfPublisher"
project_code: "MDP-TC"
artifact_type: "CHARTER"
version: "v1_0_0"
identifier: "MDP-TC_CHARTER_MarkPdfPublisher_v1_0_0_20250908"
location: "Governance/PROJECT_CHARTER.md"
summary: "Documento di avvio del progetto MarkPdfPublisher, che definisce obiettivi, ambito, stakeholder e criteri di successo per la toolchain di conversione Markdown-PDF."
usageterms: "Internal use – MarkPdfPublisher"
ssot: true
status: "draft"
created: "2025-09-08"
updated: "2025-09-09"
tags: ["project-charter", "governance", "markpdfpublisher", "planning", "toolchain"]
ai:
  generated: true
  model: "Gemini 1.5 Pro"
  prompt_id: "PROMPT-CHARTER-0001"
---

#  Scopo e Contesto del Progetto

Il progetto **MarkPdfPublisher** (nome interno MarkLeaf) nasce dall'esigenza di standardizzare e automatizzare la produzione di documenti professionali. Attualmente, la creazione di report, analisi e documentazione tecnica richiede processi manuali dispendiosi in termini di tempo e soggetti a inconsistenza stilistica.

Questo progetto si propone di sviluppare una soluzione centralizzata basata sul web che orchestra la conversione di semplici file di testo in formato Markdown in documenti PDF di alta qualità, utilizzando la potenza della toolchain Pandoc e del sistema tipografico XeLaTeX. L'obiettivo è fornire a tutti i team uno strumento robusto, semplice e riproducibile per la pubblicazione di artefatti conformi all'identità visiva aziendale.

#  Obiettivi di Business e di Progetto

##  Obiettivi di Business

- **Riduzione del Time-to-Market**: Accelerare la finalizzazione e la distribuzione della documentazione di progetto e di prodotto.
- **Consistenza del Brand**: Garantire che tutti i documenti ufficiali abbiano un aspetto uniforme e professionale.
- **Efficienza Operativa**: Liberare risorse (PM, BA, Dev) dal lavoro manuale di formattazione, permettendo loro di concentrarsi su attività a maggior valore aggiunto.

##  Obiettivi di Progetto (SMART)

- **Specific**: Sviluppare un'applicazione web (Flask) e una toolchain a riga di comando (`publish.sh`) per convertire file Markdown in PDF utilizzando template LaTeX predefiniti.
- **Measurable**: Raggiungere un tasso di adozione del 100% per la documentazione dei nuovi progetti entro la fine del primo trimestre post-rilascio. Ridurre del 90% il tempo medio di formattazione per un documento standard di 10 pagine.
- **Achievable**: Sfruttare tecnologie open-source mature e consolidate (Python, Docker, Pandoc, LaTeX) e basarsi su template già esistenti (Eisvogel).
- **Relevant**: Il progetto è direttamente allineato con la roadmap strategica (vedi `Governance/strategic_roadmap.md`) che prevede l'ottimizzazione dei processi interni e il rafforzamento della governance documentale.
- **Time-bound**: Rilasciare la versione 1.0.0 della toolchain entro la fine del Q4 2025.

#  Ambito del Progetto

##  In-Scope

- Sviluppo di un'applicazione web basata su Flask per l'upload di file Markdown e il download dei PDF generati.
- Creazione di uno script `publish.sh` per l'orchestrazione della conversione via CLI.
- Integrazione e personalizzazione di template LaTeX (es. Eisvogel) per supportare il branding dei diversi progetti o aziende (logo, font, colori).
- Gestione di metadati tramite front-matter YAML nei file Markdown.
- Containerizzazione dell'intera applicazione e delle sue dipendenze (Pandoc, TeX Live) tramite Docker per garantire la portabilità e la riproducibilità.
- Documentazione per l'utente finale e per gli sviluppatori.

##  Out-of-Scope

- Sviluppo di un editor Markdown WYSIWYG o di funzionalità di editing real-time.
- Creazione da zero di nuovi template LaTeX complessi.
- Gestione di workflow di approvazione documentale all'interno dell'applicazione.
- Hosting e gestione di una versione SaaS multi-tenant pubblica.
- Supporto per formati di input diversi da Markdown.

#  Stakeholder e Matrice di Responsabilità

Gli stakeholder chiave e le loro responsabilità sono definiti nella matrice seguente (vedi @tbl:raci).

Table: Matrice di Responsabilità (RACI) {#tbl:raci}

| Ruolo | PM | Lead Dev | Technical Writer | Utenti Finali |
|:---|:---:|:---:|:---:|:---:|
| **Definizione Requisiti** | R, A | C | I | I |
| **Sviluppo Toolchain** | I | R, A | C | - |
| **Test e QA** | A | R | I | C |
| **Redazione Documentazione** | A | C | R | - |
| **Approvazione Finale** | A | I | - | - |

*Legenda: R = Responsible, A = Accountable, C = Consulted, I = Informed*

#  Deliverable Principali

1.  **Applicazione Web**: Interfaccia funzionante per la conversione dei file.
2.  **Toolchain CLI**: Script `publish.sh` per l'uso in locale e in pipeline CI/CD.
3.  **Immagine Docker**: Immagine pronta per il deployment contenente l'intera stack.
4.  **Template LaTeX Personalizzati**: Template pronti all'uso con il branding Brightledger.
5.  **Documentazione di Progetto**: Include questo Project Charter, la documentazione utente e le guide per gli sviluppatori.

#  Architettura e Flusso di Lavoro

Il flusso operativo previsto per la generazione di un documento è illustrato di seguito (vedi @fig:workflow). Un utente (o un processo automatizzato) fornisce un file Markdown con un front-matter YAML valido. L'applicazione web o lo script CLI invoca la toolchain che, tramite Pandoc, converte il Markdown in LaTeX. Successivamente, XeLaTeX compila il file LaTeX utilizzando i template specificati per produrre il PDF finale.

![Workflow del processo di pubblicazione](docs/diagrams/MarkPdfPublisher_Workflow.png){#fig:workflow width=100%}

#  Rischi, Assunzioni e Mitigazioni

| Rischio | Probabilità | Impatto | Strategia di Mitigazione |
|:---|:---:|:---:|:---|
| **Dipendenze Complesse** | Alta | Medio | Utilizzare Docker per creare un ambiente di build stabile e versionato, isolando le dipendenze (Pandoc, TeX Live). |
| **Scope Creep** | Media | Alta | Aderire strettamente a quanto definito nella sezione "Ambito". Gestire le nuove richieste tramite un processo formale di change request. |
| **Difficoltà di Debug LaTeX** | Alta | Basso | Fornire messaggi di errore chiari e documentare gli errori più comuni. Limitare la personalizzazione degli utenti ai soli parametri sicuri. |
| **Bassa Adozione** | Bassa | Alta | Coinvolgere gli utenti finali (Technical Writer) fin dalle prime fasi di sviluppo. Produrre una documentazione chiara e concisa. |

#  Criteri di Successo e KPI

- **Qualità**: I PDF generati devono essere privi di artefatti di conversione e pixel-perfect rispetto ai template.
- **Adozione**: Almeno 3 team devono aver adottato la toolchain per la loro documentazione ufficiale entro 3 mesi dal lancio.
- **Affidabilità**: Tasso di successo delle build di conversione superiore al 99% in ambiente di produzione.
- **Performance**: Tempo di generazione di un documento di 20 pagine inferiore a 30 secondi.

#  Approvazione

Le firme sottostanti indicano l'approvazione di questo Project Charter e l'autorizzazione a procedere con il progetto come qui descritto.


**Project Manager:**

Nome: _________________________

Data: _________________________

---
**Sponsor del Progetto:**

Nome: _________________________

Data: _________________________
