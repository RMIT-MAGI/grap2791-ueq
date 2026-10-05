# UEQ-S Class Survey

A small static website for teaching quantitative UX evaluation. Students play a game, complete the 8-item **UEQ-S** (short User Experience Questionnaire), and the class immediately sees box plots and a plain-language report for each dimension.

| Page | What it does |
|---|---|
| `index.html` | Introduction to the activity and the quantitative research process |
| `survey.html` | Participant number + the 8 UEQ-S items (7-point scale). Warns if a number is already used. |
| `results.html` | Box plots for Pragmatic quality, Hedonic quality and Overall, each with descriptive statistics, 95% CI, interpretation, benchmark comparison and Cronbach's alpha. Also a PQ vs HQ comparison, item means and a data-quality check. Refreshes automatically. |
| `data.html` | Spreadsheet view of all responses (raw or scored), CSV download, demo data, and **Delete all data** (with a warning dialog) for a new cohort. |

No build step and no external libraries: plain HTML, CSS and JavaScript.

## 1. Run it locally

Double-click `serve.bat` (needs Python), or in a terminal in this folder run:

```
python -m http.server 8000
```

then open <http://localhost:8000>. With `APPS_SCRIPT_URL` empty in `js/config.js` the site runs in **local mode**: data are stored in that browser only. This is fine for testing, or for a class where everyone enters their answers on one shared computer. Use **Data → Add demo data** to see the results page populated.

## 2. Set up the shared Google Sheet (so students can use their own devices)

GitHub Pages only serves files and cannot store data, so a free Google Apps Script acts as the database.

1. Create a new Google Sheet (e.g. "UEQ-S responses").
2. **Extensions → Apps Script**. Delete the sample code, paste in the whole of `apps-script/Code.gs`, and save.
3. **Deploy → New deployment**. Click the cog, choose **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, authorise when asked (Google will warn that the app is unverified: choose *Advanced → Go to project*).
5. Copy the **Web app URL** (ends in `/exec`) and paste it into `js/config.js`:
   ```js
   APPS_SCRIPT_URL: "https://script.google.com/macros/s/XXXX/exec",
   ```
6. Reload the site. The header badge changes to **Shared mode · Google Sheet**. Responses appear in a `Responses` tab of your sheet.

If you later edit `Code.gs`, use **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy** so the URL stays the same.

## 3. Publish on GitHub Pages

1. Create a new repository on GitHub (public, or private with a plan that supports Pages).
2. Upload the contents of this folder (keep the folder structure; include the `.nojekyll` file).
3. Repository **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
4. After a minute the site is live at `https://<your-username>.github.io/<repo-name>/`.

Tip: share a QR code of the survey URL (`…/survey.html`) on the projector.

## 4. Running a class session

1. Give each student a participant number (1–20). Numbers keep the data anonymous and let students correct a mistaken submission.
2. Students play the game.
3. Students open the survey and submit.
4. Show `results.html` on the projector. It updates every 20 seconds.
5. Discuss: box plots, mean vs median, confidence intervals, the neutral band, the benchmark, reliability and whether to exclude suspicious responses.
6. Download the CSV from the Data page if you want to keep the cohort's data, then **Delete all data** to reset.

## Scoring (as in the official UEQ-S)

- Items, in order: obstructive–supportive, complicated–easy, inefficient–efficient, confusing–clear (pragmatic); boring–exciting, not interesting–interesting, conventional–inventive, usual–leading edge (hedonic). Negative term on the left (1), positive on the right (7).
- Each answer is re-coded to −3…+3 (answer − 4).
- Pragmatic quality = mean of items 1–4; Hedonic quality = mean of items 5–8; Overall = mean of all 8.
- Interpretation: > +0.8 positive, −0.8…+0.8 neutral, < −0.8 negative.
- Benchmark (Hinderks et al., 246 products, 9,905 participants), lower bounds for Excellent / Good / Above average / Below average:
  PQ 1.73 / 1.55 / 1.15 / 0.73 · HQ 1.55 / 1.25 / 0.88 / 0.57 · Overall 1.58 / 1.40 / 1.02 / 0.68.
- Consistency heuristic: a response whose items within a dimension differ by more than 3 points is flagged; flagged in both dimensions = suspicious (optional exclusion on the Results page).
- Box plot quartiles use linear interpolation (Excel `QUARTILE.INC`); whiskers extend to 1.5 × IQR; the 95% CI uses the t distribution.

## Settings (`js/config.js`)

| Setting | Default | Meaning |
|---|---|---|
| `APPS_SCRIPT_URL` | `""` | Empty = local mode; Web App URL = shared mode |
| `COURSE_TITLE` | `GRAP2791 AGI Workshop` | Shown in the header |
| `MAX_PARTICIPANT` | `99` | Highest participant number accepted |
| `AUTO_REFRESH_SECONDS` | `20` | Results/Data auto-refresh interval (0 = off) |

## Note on access

The site has no login, as requested. Anyone who has the site address can open the Data page and use **Delete all data** (after the warning). Keep a CSV backup if the data matter.

## References

- Schrepp, M., Hinderks, A. & Thomaschewski, J. (2017). Design and evaluation of a short version of the User Experience Questionnaire (UEQ-S). *IJIMAI*, 4(6), 103–108.
- Hinderks, A., Schrepp, M. & Thomaschewski, J. A benchmark for the short version of the User Experience Questionnaire.
- Laugwitz, B., Held, T. & Schrepp, M. (2008). Construction and evaluation of a user experience questionnaire. *USAB 2008*, LNCS 5298.
- Schrepp, M., Hinderks, A. & Thomaschewski, J. (2014). Applying the User Experience Questionnaire (UEQ) in different evaluation scenarios. *DUXU 2014*, LNCS 8517.
- <https://www.ueq-online.org/>
