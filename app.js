const STUDENTS_PER_SET = 15;
const MAX_JOBS = 4;
const DESCRIPTION_PREVIEW_CHARS = 520;
const ADMIN_USER = "adminA";
const ADMIN_PASSWORD = "1432";

const demoJobs = [
  {
    Posting_ID: "A1",
    title: "Data Scientist",
    type: "data_scientist",
    description: "พัฒนาโมเดลวิเคราะห์ข้อมูล สร้าง predictive analytics และสื่อสาร insight เพื่อสนับสนุนการตัดสินใจทางธุรกิจ",
    skills: ["Python", "Machine Learning", "Statistics", "SQL", "Data Visualization"]
  }
];

const demoProfiles = [
  { Candidate_Code: "C01", Source_ID: "C01", course: "Introduction to Programming", credit: 3, grade: "4" },
  { Candidate_Code: "C01", Source_ID: "C01", course: "Machine Learning", credit: 3, grade: "4" },
  { Candidate_Code: "C02", Source_ID: "C02", course: "Business Intelligence", credit: 3, grade: "3.5" },
  { Candidate_Code: "C02", Source_ID: "C02", course: "Statistics for Data Analysis", credit: 3, grade: "3.5" }
];

const state = {
  jobs: [...demoJobs],
  profiles: [...demoProfiles],
  ratings: new Map(),
  selectedCandidate: "",
  selectedRound: 1,
  descriptionExpanded: false
};

const el = {
  expertId: document.querySelector("#expertId"),
  adminToggle: document.querySelector("#adminToggle"),
  adminPanel: document.querySelector("#adminPanel"),
  adminModal: document.querySelector("#adminModal"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminUser: document.querySelector("#adminUser"),
  adminPassword: document.querySelector("#adminPassword"),
  adminLoginError: document.querySelector("#adminLoginError"),
  adminCancel: document.querySelector("#adminCancel"),
  uploadStatus: document.querySelector("#uploadStatus"),
  loadDemo: document.querySelector("#loadDemo"),
  roundSelect: document.querySelector("#roundSelect"),
  postingSelect: document.querySelector("#postingSelect"),
  jobTitle: document.querySelector("#jobTitle"),
  jobTypeBadge: document.querySelector("#jobTypeBadge"),
  jobDescription: document.querySelector("#jobDescription"),
  descriptionToggle: document.querySelector("#descriptionToggle"),
  skillTags: document.querySelector("#skillTags"),
  candidateName: document.querySelector("#candidateName"),
  gpaBadge: document.querySelector("#gpaBadge"),
  courseCount: document.querySelector("#courseCount"),
  courseTable: document.querySelector("#courseTable"),
  candidateRanking: document.querySelector("#candidateRanking"),
  savedState: document.querySelector("#savedState"),
  progressLabel: document.querySelector("#progressLabel"),
  progressFill: document.querySelector("#progressFill"),
  metricLabel: document.querySelector("#metricLabel"),
  downloadCsv: document.querySelector("#downloadCsv"),
  downloadJson: document.querySelector("#downloadJson")
};

function openAdminModal() {
  el.adminLoginError.hidden = true;
  el.adminUser.value = "";
  el.adminPassword.value = "";
  el.adminModal.hidden = false;
  el.adminUser.focus();
}

function closeAdminModal() {
  el.adminModal.hidden = true;
}

function unlockAdmin() {
  closeAdminModal();
  el.adminPanel.hidden = false;
}

function normalizeKey(row, candidates) {
  const entries = Object.entries(row);
  const exact = entries.find(([key]) => {
    const normalized = String(key).replace(/^\uFEFF/, "").trim().toLowerCase().replaceAll(" ", "_");
    return candidates.some((candidate) => normalized === candidate);
  });
  if (exact) return exact[1];
  const found = entries.find(([key]) => {
    const normalized = String(key).replace(/^\uFEFF/, "").trim().toLowerCase();
    return candidates.some((candidate) => normalized.includes(candidate));
  });
  return found ? found[1] : "";
}

function normalizeJob(row, index = 0) {
  const postingCode = normalizeKey(row, ["posting_code", "posting", "job_code", "รหัส"]);
  const sourceId = normalizeKey(row, ["job_id", "id"]);
  const jobType = normalizeKey(row, ["job_type", "job type", "type"]) || "";
  const skillCount = normalizeKey(row, ["n_skills", "skills"]);
  const ntacsCount = normalizeKey(row, ["n_distinct_ntacs", "ntacs"]);
  const spread = normalizeKey(row, ["spread_std", "spread"]);
  const skillList = row.Skill || row.skill || row.Required_Skills || row["Required Skills"] || "";
  return {
    Posting_ID: `A${index + 1}`,
    Source_Posting_ID: postingCode || sourceId || `P${index + 1}`,
    Job_ID: sourceId || "",
    title: normalizeKey(row, ["job_title", "job title", "title", "ตำแหน่ง", "ชื่อตำแหน่ง"]) || "Untitled Job",
    type: jobType,
    description:
      cleanDescription(normalizeKey(row, ["description", "คำบรรยาย", "รายละเอียด"])) ||
      `Posting source: ${postingCode || "-"}\nJob ID: ${sourceId || "-"}\nJob type: ${jobType || "-"}\nSkill count: ${skillCount || "-"}\nDistinct NTACS: ${ntacsCount || "-"}\nSpread std: ${spread || "-"}`,
    skills: parseSkillList(skillList),
    metadata: [
      jobType ? `Type: ${jobType}` : "",
      skillCount ? `Skills: ${skillCount}` : "",
      ntacsCount ? `NTACS: ${ntacsCount}` : "",
      spread ? `Spread: ${spread}` : ""
    ].filter(Boolean)
  };
}

function normalizeProfile(row) {
  const sourceId = normalizeKey(row, ["candidate_code", "id", "candidate", "student", "รหัส"]);
  return {
    Candidate_Code: sourceId || "C-UNKNOWN",
    Source_ID: sourceId || "C-UNKNOWN",
    course: normalizeKey(row, ["course", "subject_name_en", "course name", "subject", "รายวิชา", "ชื่อวิชา"]) || "",
    credit: normalizeKey(row, ["credit", "หน่วยกิต"]) || "",
    grade: normalizeKey(row, ["grade", "grade_en", "เกรด"]) || ""
  };
}

function parseSkillList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  const raw = String(value || "").trim();
  if (!raw) return [];
  const withoutBrackets = raw.replace(/^\[/, "").replace(/\]$/, "");
  return withoutBrackets
    .split(/,(?=(?:[^'"]|'[^']*'|"[^"]*")*$)|;|\|/)
    .map((skill) => skill.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function cleanDescription(value) {
  const parser = new DOMParser();
  const withBreaks = String(value || "")
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .replaceAll("</li>", "</li>\n")
    .replaceAll("</p>", "</p>\n")
    .replaceAll("<br/>", "\n")
    .replaceAll("<br>", "\n");
  const doc = parser.parseFromString(withBreaks, "text/html");
  return (doc.body.textContent || "")
    .replace(/[\[\]]/g, " ")
    .replace(/(^|\n)\s*,+\s*(?=\n|$)/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  const headers = rows.shift() || [];
  return rows.map((values) =>
    headers.reduce((record, header, index) => {
      record[header.replace(/^\uFEFF/, "").trim()] = (values[index] || "").trim();
      return record;
    }, {})
  );
}

function allCandidates() {
  return [...new Set(state.profiles.map((row) => row.Candidate_Code).filter(Boolean))].sort();
}

function currentRoundCandidates() {
  const start = (state.selectedRound - 1) * STUDENTS_PER_SET;
  return allCandidates().slice(start, start + STUDENTS_PER_SET);
}

function currentPostingId() {
  return el.postingSelect.value;
}

function currentJob() {
  return state.jobs.find((item) => item.Posting_ID === currentPostingId()) || state.jobs[0];
}

function currentCandidateCode() {
  const list = currentRoundCandidates();
  if (!state.selectedCandidate || !list.includes(state.selectedCandidate)) {
    state.selectedCandidate = list[0] || "";
  }
  return state.selectedCandidate;
}

function ratingKey(postingId = currentPostingId(), candidateCode = currentCandidateCode(), roundId = state.selectedRound) {
  return `set${roundId}__${postingId}__${candidateCode}`;
}

function ratingFor(candidateCode, postingId = currentPostingId(), roundId = state.selectedRound) {
  return state.ratings.get(ratingKey(postingId, candidateCode, roundId));
}

function renderSelectors() {
  const jobs = state.jobs.slice(0, MAX_JOBS);
  el.postingSelect.innerHTML = jobs
    .map((job) => `<option value="${escapeHtml(job.Posting_ID)}">${escapeHtml(job.Posting_ID)} - ${escapeHtml(job.title)}</option>`)
    .join("");
}

function renderJob() {
  const job = currentJob();
  el.jobTitle.textContent = job ? `${job.Posting_ID} ${job.title}` : "-";
  el.jobTypeBadge.textContent = job?.type || "งาน";

  const description = job?.description || "-";
  const shouldTruncate = description.length > DESCRIPTION_PREVIEW_CHARS;
  el.jobDescription.textContent =
    shouldTruncate && !state.descriptionExpanded ? `${description.slice(0, DESCRIPTION_PREVIEW_CHARS).trim()}...` : description;
  el.descriptionToggle.hidden = !shouldTruncate;
  el.descriptionToggle.textContent = state.descriptionExpanded ? "ย่อคำบรรยาย" : "ดูรายละเอียดเพิ่มเติม";

  const tags = (Array.isArray(job?.skills) && job.skills.length ? job.skills : job?.metadata) || [];
  el.skillTags.innerHTML = tags.length
    ? tags.map((tag) => `<span class="tag skill-tag">${escapeHtml(tag)}</span>`).join("")
    : `<span class="tag">ยังไม่มีข้อมูลทักษะ</span>`;
}

function renderProfile() {
  const candidateCode = currentCandidateCode();
  const rows = state.profiles.filter((row) => row.Candidate_Code === candidateCode);
  const sourceId = rows[0]?.Source_ID || candidateCode;
  el.candidateName.textContent = `${candidateCode} (${sourceId})`;
  el.gpaBadge.textContent = `GPA ${calculateGpa(rows)}`;
  el.courseCount.textContent = `${rows.length} วิชา`;
  el.courseTable.innerHTML = rows.length
    ? rows
        .map(
          (row) => `<tr><td>${escapeHtml(row.course)}</td><td>${escapeHtml(row.credit)}</td><td>${escapeHtml(row.grade)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="3">ยังไม่มีข้อมูลรายวิชาสำหรับนักศึกษานี้</td></tr>`;
}

function renderScoringBoard() {
  const list = currentRoundCandidates();
  const scoredCount = list.filter((candidateCode) => ratingFor(candidateCode)?.Score).length;
  const target = list.length;

  el.savedState.textContent = `${scoredCount}/${target} คน`;
  el.savedState.classList.toggle("muted", scoredCount < target);
  el.candidateRanking.innerHTML = list.length
    ? list
        .map((candidateCode) => {
          const rows = state.profiles.filter((row) => row.Candidate_Code === candidateCode);
          const rating = ratingFor(candidateCode);
          const selected = candidateCode === currentCandidateCode() ? " selected-row" : "";
          return `
            <tr class="candidate-row${selected}" data-candidate="${escapeHtml(candidateCode)}">
              <td>
                <button class="candidate-link" type="button" data-candidate="${escapeHtml(candidateCode)}">
                  ${escapeHtml(candidateCode)}
                </button>
              </td>
              <td>${escapeHtml(calculateGpa(rows))}</td>
              <td>${rows.length}</td>
              <td>
                <div class="score-buttons" data-candidate="${escapeHtml(candidateCode)}">
                  ${scoreButtons(rating?.Score)}
                </div>
              </td>
              <td>
                <input class="reason-input" data-candidate="${escapeHtml(candidateCode)}" value="${escapeHtml(rating?.Reason || "")}" placeholder="เหตุผลสั้น ๆ" />
              </td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td colspan="5">ไม่มีนักศึกษาในชุดที่ ${state.selectedRound}</td></tr>`;
}

function scoreButtons(selectedScore) {
  return [1, 2, 3, 4, 5]
    .map((score) => {
      const selected = Number(selectedScore) === score ? " selected" : "";
      return `<button class="score-button${selected}" type="button" data-score="${score}" aria-label="คะแนน ${score}">${score}</button>`;
    })
    .join("");
}

function calculateGpa(rows) {
  const totals = rows.reduce(
    (sum, row) => {
      const credit = Number(row.credit);
      const grade = Number(row.grade);
      if (Number.isFinite(credit) && Number.isFinite(grade)) {
        sum.credits += credit;
        sum.points += credit * grade;
      }
      return sum;
    },
    { credits: 0, points: 0 }
  );
  return totals.credits ? (totals.points / totals.credits).toFixed(2) : "-";
}

function renderProgress() {
  const roundCandidates = currentRoundCandidates();
  const jobs = state.jobs.slice(0, MAX_JOBS);
  const total = jobs.length * roundCandidates.length;
  const done = [...state.ratings.values()].filter((rating) => rating.Round_ID === state.selectedRound && rating.Score).length;
  const percent = total ? Math.round((done / total) * 100) : 0;
  const first = (state.selectedRound - 1) * STUDENTS_PER_SET + 1;
  const last = first + roundCandidates.length - 1;
  el.progressLabel.textContent = `${done} จาก ${total} รายการ`;
  el.metricLabel.textContent = `ชุดที่ ${state.selectedRound}: ${jobs.length} ประกาศ / ${roundCandidates.length} นักศึกษา (C${String(first).padStart(2, "0")}-C${String(last).padStart(2, "0")})`;
  el.progressFill.style.width = `${percent}%`;
}

function renderAll() {
  renderSelectors();
  renderSelected();
}

function renderSelected() {
  currentCandidateCode();
  renderJob();
  renderProfile();
  renderScoringBoard();
  renderProgress();
}

function saveScore(candidateCode, scoreValue) {
  const score = scoreValue ? Number(scoreValue) : "";
  const existing = ratingFor(candidateCode);
  if (!score && !existing?.Reason) {
    state.ratings.delete(ratingKey(currentPostingId(), candidateCode));
    renderSelected();
    return;
  }
  upsertRating(candidateCode, { Score: score });
  renderSelected();
}

function saveReason(candidateCode, reason) {
  const existing = ratingFor(candidateCode);
  if (!existing?.Score && !reason.trim()) {
    state.ratings.delete(ratingKey(currentPostingId(), candidateCode));
    renderProgress();
    return;
  }
  upsertRating(candidateCode, { Reason: reason.trim() });
  renderProgress();
}

function upsertRating(candidateCode, patch) {
  const job = currentJob();
  const existing = ratingFor(candidateCode) || {};
  const rows = state.profiles.filter((row) => row.Candidate_Code === candidateCode);
  const record = {
    Expert_ID: el.expertId.value.trim(),
    Round_ID: state.selectedRound,
    Posting_Code: job?.Posting_ID || "",
    Posting_Source_ID: job?.Source_Posting_ID || "",
    Job_ID: job?.Job_ID || "",
    Job_Title: job?.title || "",
    Candidate_Code: candidateCode,
    Student_Source_ID: rows[0]?.Source_ID || candidateCode,
    Score: existing.Score || "",
    Reason: existing.Reason || "",
    Rated_At: new Date().toISOString(),
    ...patch
  };
  state.ratings.set(ratingKey(currentPostingId(), candidateCode), record);
}

function download(format) {
  const rows = [...state.ratings.values()].sort((a, b) => {
    if (a.Round_ID !== b.Round_ID) return a.Round_ID - b.Round_ID;
    const jobCompare = String(a.Posting_Code).localeCompare(String(b.Posting_Code));
    if (jobCompare) return jobCompare;
    return String(a.Candidate_Code).localeCompare(String(b.Candidate_Code));
  });
  const payload =
    format === "json"
      ? JSON.stringify(rows, null, 2)
      : toCsv(rows, [
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
        ]);
  const mime = format === "json" ? "application/json" : "text/csv;charset=utf-8";
  const blob = new Blob([payload], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expert_groundtruth_scores.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows, headers) {
  const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))].join("\n");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadTemplateData() {
  try {
    const [jobResponse, studentResponse] = await Promise.all([
      fetch("./master_key_postings.csv"),
      fetch("./roster_BLIND_for_experts.csv")
    ]);
    if (!jobResponse.ok || !studentResponse.ok) throw new Error("ไม่พบไฟล์ template ในโฟลเดอร์เว็บ");
    const [jobText, studentText] = await Promise.all([jobResponse.text(), studentResponse.text()]);
    state.jobs = parseCsv(jobText).map(normalizeJob).filter((job) => job.Posting_ID).slice(0, MAX_JOBS);
    state.profiles = parseCsv(studentText).map(normalizeProfile).filter((profile) => profile.Candidate_Code);
    state.ratings.clear();
    state.selectedCandidate = "";
    state.descriptionExpanded = false;
    el.uploadStatus.textContent = `โหลด master_key_postings.csv (${state.jobs.length}/4 ประกาศ) และ roster_BLIND_for_experts.csv (${allCandidates().length} คน) แล้ว`;
    renderAll();
  } catch (error) {
    el.uploadStatus.textContent = `${error.message} กำลังใช้ข้อมูลตัวอย่าง`;
    renderAll();
  }
}

el.adminToggle.addEventListener("click", () => {
  if (!el.adminPanel.hidden) {
    el.adminPanel.hidden = true;
    return;
  }
  openAdminModal();
});

el.adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (el.adminUser.value.trim() === ADMIN_USER && el.adminPassword.value === ADMIN_PASSWORD) {
    unlockAdmin();
    return;
  }
  el.adminLoginError.hidden = false;
  el.adminPassword.select();
});

el.adminCancel.addEventListener("click", closeAdminModal);

el.adminModal.addEventListener("click", (event) => {
  if (event.target === el.adminModal) closeAdminModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !el.adminModal.hidden) closeAdminModal();
});

el.loadDemo.addEventListener("click", loadTemplateData);

el.roundSelect.addEventListener("change", () => {
  state.selectedRound = Number(el.roundSelect.value);
  state.selectedCandidate = "";
  renderSelected();
});

el.postingSelect.addEventListener("change", () => {
  state.descriptionExpanded = false;
  renderSelected();
});

el.descriptionToggle.addEventListener("click", () => {
  state.descriptionExpanded = !state.descriptionExpanded;
  renderJob();
});

el.candidateRanking.addEventListener("click", (event) => {
  if (event.target.closest("input")) return;
  const candidateCode = event.target.closest("[data-candidate]")?.dataset.candidate;
  if (!candidateCode) return;
  state.selectedCandidate = candidateCode;
  if (event.target.classList.contains("score-button")) {
    saveScore(candidateCode, event.target.dataset.score);
    return;
  }
  renderSelected();
});

el.candidateRanking.addEventListener("input", (event) => {
  if (!event.target.classList.contains("reason-input")) return;
  saveReason(event.target.dataset.candidate, event.target.value);
});

el.downloadCsv.addEventListener("click", () => download("csv"));
el.downloadJson.addEventListener("click", () => download("json"));

loadTemplateData();
