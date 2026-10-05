# HANDOFF

**Status (2026-10-05):** v1 of the site built and tested in local mode (survey submit, duplicate-number dialog, results rendering, data table, CSV, demo data, delete-all), light and dark, desktop and mobile. Glossary page added and linked from Results.

**Session goal:** Build a GitHub-hosted UEQ-S survey site with box plots + report, spreadsheet data page, and delete-all.

## Next steps
1. Stefan: test locally with `serve.bat`, try "Add demo data" on the Data page.
2. Set up the Google Sheet + Apps Script (README section 2) and paste the Web App URL into `js/config.js`. Shared mode has not yet been tested against a live Apps Script deployment.
3. Publish to GitHub Pages (README section 3).

## Open decisions
- Benchmark comparison included by default (not explicitly confirmed by Stefan).
- No password on delete-all (Stefan's choice: warning dialog only).
- Possible extras: per-row delete, a "game/condition" field to compare two games, QR code on the home page.
