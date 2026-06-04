/** Shared client-side validation for forms across the app. */

const EMAIL_RE = /^[a-zA-Z0-9_+&*-]+(?:\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

export const LIMITS = {
    nameMin: 2,
    nameMax: 80,
    titleMax: 220,
    descMax: 50000,
    tagLineMax: 500,
    problemIdPattern: /^prob_\d+$/,
    contestIdPattern: /^contest_\d+$/,
    passwordMin: 6,
    passwordMax: 128,
    memoryTimeMax: 32,
};

export function isValidEmail(str) {
    if (!str || typeof str !== "string") return false;
    const e = str.trim();
    return e.length >= 5 && e.length <= 254 && EMAIL_RE.test(e);
}

export function validateLoginForm(form, mode) {
    const e = {};
    if (mode === "Sign") {
        const n = (form.name || "").trim();
        if (n.length < LIMITS.nameMin) e.name = `Name must be at least ${LIMITS.nameMin} characters`;
        else if (n.length > LIMITS.nameMax) e.name = `Name must be at most ${LIMITS.nameMax} characters`;
    }
    if (!isValidEmail(form.email || "")) e.email = "Enter a valid email address";
    const pw = form.password || "";
    if (pw.length < LIMITS.passwordMin) e.password = `Password must be at least ${LIMITS.passwordMin} characters`;
    else if (pw.length > LIMITS.passwordMax) e.password = "Password is too long";
    if (mode === "Sign" && pw !== (form.confirm || "")) e.confirm = "Passwords don't match";
    return e;
}

export function validateAdminProblemForm(probForm) {
    const errs = {};
    const id = (probForm.id || "").trim();
    if (!id) errs.id = "Problem ID is required";
    else if (!LIMITS.problemIdPattern.test(id)) errs.id = "Format must be prob_001 (prob_ + digits)";
    const title = (probForm.title || "").trim();
    if (!title) errs.title = "Title is required";
    else if (title.length > LIMITS.titleMax) errs.title = `Title at most ${LIMITS.titleMax} characters`;
    const desc = (probForm.description || "").trim();
    if (!desc) errs.description = "Description is required";
    else if (desc.length > LIMITS.descMax) errs.description = `Description at most ${LIMITS.descMax} characters`;
    if ((probForm.tags || "").length > LIMITS.tagLineMax) errs.tags = `Tags line too long (max ${LIMITS.tagLineMax})`;
    const tl = (probForm.timeLimit || "").trim();
    const ml = (probForm.memoryLimit || "").trim();
    if (tl.length > LIMITS.memoryTimeMax) errs.timeLimit = "Time limit text too long";
    if (ml.length > LIMITS.memoryTimeMax) errs.memoryLimit = "Memory limit text too long";
    const tcs = probForm.testCases || [];
    if (tcs.some(tc => !(tc.input || "").toString().trim() || !(tc.output || "").toString().trim()))
        errs.testCases = "All test cases must have input and output";
    return errs;
}

export function validateAdminContestForm(contestForm) {
    const errs = {};
    const cid = (contestForm.contestId || "").trim();
    if (!cid) errs.contestId = "Contest ID is required";
    else if (!LIMITS.contestIdPattern.test(cid)) errs.contestId = "Format must be contest_001 (contest_ + digits)";
    const name = (contestForm.name || "").trim();
    if (!name) errs.name = "Contest name is required";
    else if (name.length > LIMITS.titleMax) errs.name = `Name at most ${LIMITS.titleMax} characters`;
    if (!contestForm.startTime) errs.startTime = "Start time is required";
    if (!contestForm.endTime) errs.endTime = "End time is required";
    if (contestForm.startTime && contestForm.endTime && new Date(contestForm.startTime) >= new Date(contestForm.endTime))
        errs.endTime = "End time must be after start time";
    const probs = (contestForm.problems || "").trim();
    if (!probs) errs.problems = "At least one problem ID is required";
    const dur = (contestForm.duration || "").trim();
    if (!dur) errs.duration = "Duration is required";
    else if (dur.length > 64) errs.duration = "Duration text too long";
    return errs;
}

export function validateUserSearch(q) {
    if (!q || !q.trim()) return "";
    if (q.length > 120) return q.slice(0, 120);
    return q.trim();
}
