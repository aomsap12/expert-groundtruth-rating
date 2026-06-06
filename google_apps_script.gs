const SHEET_NAME = "Expert Ratings";

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  const headers = [
    "Submitted_At",
    "Expert_ID",
    "Round_ID",
    "Posting_Code",
    "Posting_Source_ID",
    "Job_ID",
    "Job_Title",
    "Candidate_Code",
    "Student_Source_ID",
    "Score",
    "Reason",
    "Rated_At"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  const rows = (payload.ratings || []).map((rating) => [
    payload.submittedAt || new Date().toISOString(),
    rating.Expert_ID || payload.expertId || "",
    rating.Round_ID || "",
    rating.Posting_Code || "",
    rating.Posting_Source_ID || "",
    rating.Job_ID || "",
    rating.Job_Title || "",
    rating.Candidate_Code || "",
    rating.Student_Source_ID || "",
    rating.Score || "",
    rating.Reason || "",
    rating.Rated_At || ""
  ]);

  if (rows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  }

  return ContentService.createTextOutput(JSON.stringify({ ok: true, inserted: rows.length })).setMimeType(
    ContentService.MimeType.JSON
  );
}
