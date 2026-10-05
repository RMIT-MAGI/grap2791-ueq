# CLAUDE.md: UEQ-S Class Survey

## Project
- **Name:** UEQ-S Class Survey
- **Type:** Development project (static website)
- **Purpose:** Teaching tool for GRAP2791 AGI Workshop (MAGI, RMIT). Students play a game, complete the 8-item UEQ-S, and see box plots plus a plain-language report per dimension, to learn quantitative data collection and analysis.
- **Cohort size:** up to 20 students.

## Tech stack
- Plain HTML, CSS, vanilla JavaScript. No build step, no external libraries or CDNs (charts are hand-built SVG).
- Hosting: GitHub Pages (static). Local testing: `serve.bat` or `python -m http.server 8000`.
- Data store (pluggable, `js/store.js`):
  - Local mode (`APPS_SCRIPT_URL` empty): browser localStorage, key `ueqs_responses_v1`.
  - Shared mode: Google Apps Script Web App (`apps-script/Code.gs`) writing to a Google Sheet tab `Responses`. POST bodies are sent as text/plain to avoid CORS preflight.

## File structure
- `index.html` intro and process overview
- `survey.html` participant number + 8 items; upsert with "number already used" confirmation
- `results.html` + `js/results.js` box plots, stats, interpretation, benchmark, alpha, PQ vs HQ, item means, data-quality check
- `glossary.html` statistics glossary (36 terms in groups, search, A–Z index, anchors linked from Results)
- `data.html` + `js/data.js` spreadsheet view, raw/scored toggle, CSV export, demo data, delete-all with warning modal
- `js/config.js` settings (APPS_SCRIPT_URL, COURSE_TITLE, MAX_PARTICIPANT, AUTO_REFRESH_SECONDS)
- `js/ueq.js` item definitions, scoring, benchmark, statistics
- `js/charts.js` SVG box plot and item bar chart
- `css/style.css` design tokens (light/dark)
- `apps-script/Code.gs` Google backend
- `README.md` setup and class instructions

## Conventions and constraints
- UEQ-S item order/polarity must match the official English version (negative left = 1, positive right = 7). Re-code = value − 4.
- Delete-all lives on the Data page, protected only by a warning dialog (user decision, no password).
- Prose: Australian English, no em dashes in user-facing writing.
- Web files keep conventional names (index.html etc.) for GitHub Pages; the YYYYMMDD- prefix applies to new non-site documents and exports (CSV export is named YYYYMMDD-ueqs-responses.csv).
- Use relative paths only.
