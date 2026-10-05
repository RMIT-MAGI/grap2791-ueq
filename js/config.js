/* =========================================================================
   UEQ-S Class Survey: configuration
   -------------------------------------------------------------------------
   APPS_SCRIPT_URL
     Leave empty ("") to run in LOCAL MODE: responses are stored in this
     browser only (good for testing on localhost or for one shared lab PC).
     Paste your Google Apps Script Web App URL (ends in /exec) to run in
     SHARED MODE: every student's device writes to one Google Sheet.
     See README.md, section "Set up the shared Google Sheet".
   ========================================================================= */
window.UEQ_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwD7zkHG_ir6-yg49r5qfl0d7YTmxxSWPnzbLBLBMgeKMi_Sn4h52xE-iJsGXDlLFDMdg/exec",

  // Shown in the page header
  COURSE_TITLE: "GRAP2791 AGI Workshop",

  // Highest participant number students can enter
  MAX_PARTICIPANT: 99,

  // How often the Results and Data pages refresh automatically (seconds, 0 = off)
  AUTO_REFRESH_SECONDS: 20
};
