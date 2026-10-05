# CHANGELOG

## 2026-10-05
- Project initialised (development project: static website for GitHub Pages).
- Built UEQ-S Class Survey: home, survey, results (box plots per dimension with report, benchmark, Cronbach's alpha, PQ vs HQ, item means, data-quality check), data (spreadsheet view, CSV, demo data, delete-all with warning).
- Storage: local mode (localStorage) and shared mode (Google Apps Script + Sheet).
- Decisions: delete-all on the Data page with a confirmation warning, no password; benchmark from Hinderks et al. UEQ-S benchmark (246 products, 9,905 participants).
- Next: set up Apps Script, test shared mode, publish to GitHub Pages.
- Added `glossary.html`: 36 plain-language statistics terms (n, mean, median, SD, variance, quartiles, IQR, outliers, CI, SE, t, Cronbach's alpha, reliability, benchmark and more) with formulas and a shared worked example (−1, 0.5, 1, 1.5, 3). Added Glossary to the navigation, a home-page card, and links from the Results statistics labels and reports.
- Deployed to GitHub: repo RMIT-MAGI/grap2791-ueq (public), GitHub Pages enabled from main / root. Live at https://rmit-magi.github.io/grap2791-ueq/. Installed GitHub CLI on Stefan's PC and logged in as CubeDirector.
- Connected Google Sheet backend (Apps Script web app under me@stefangreuter.com, access: Anyone). Tested list/submit/deleteAll round trip, then switched the live site to shared mode.
- Added @OnlyCurrentDoc to apps-script/Code.gs so the script only requests access to its own Google Sheet (requires pasting into Apps Script, redeploying a new version and re-authorising).
