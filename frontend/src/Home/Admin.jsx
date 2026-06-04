import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Pages/AuthContext";
import Navbar from "../Pages/Navbar";
import api from "../ConnectingBackend/axios";
import { validateAdminProblemForm, validateAdminContestForm, validateUserSearch, LIMITS } from "../utils/formValidation";

// ── jsPDF loader (loads from CDN once, then caches on window) ────────────────
function loadJsPDF() {
    return new Promise((resolve, reject) => {
        if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
        const s = document.createElement("script");
        s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
        s.onload = () => resolve(window.jspdf.jsPDF);
        s.onerror = reject;
        document.head.appendChild(s);
    });
}

// ── PDF helpers ───────────────────────────────────────────────────────────────
const DARK   = [17,  20,  9];
const MID    = [22,  26, 13];
const GREEN  = [106,122, 58];
const LGRE   = [200,207,168];
const YELLOW = [240,198,116];
const RED    = [201,122,106];
const DIM    = [74,  90, 40];
const WHITE  = [240,237,230];

function pdfHeader(doc, title, subtitle) {
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(...DARK); doc.rect(0, 0, W, 28, "F");
    doc.setFillColor(...GREEN); doc.rect(0, 28, W, 1, "F");
    doc.setTextColor(...YELLOW); doc.setFont("courier","bold"); doc.setFontSize(14);
    doc.text("CodeWeb", 14, 12);
    doc.setTextColor(...DIM); doc.setFont("courier","normal"); doc.setFontSize(8);
    doc.text("// admin export", 14, 19);
    doc.setTextColor(...WHITE); doc.setFont("courier","bold"); doc.setFontSize(13);
    doc.text(title, 14, 41);
    if (subtitle) {
        doc.setTextColor(...DIM); doc.setFont("courier","normal"); doc.setFontSize(8);
        doc.text(subtitle, 14, 49);
    }
    return subtitle ? 58 : 50;
}

function pdfSectionLabel(doc, label, y) {
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(...MID); doc.rect(0, y, W, 13, "F");
    doc.setTextColor(...GREEN); doc.setFont("courier","bold"); doc.setFontSize(8);
    doc.text(label.toUpperCase(), 14, y + 9);
    return y + 18;
}

function pdfRow(doc, cols, y, colWidths, isHeader = false) {
    const H = doc.internal.pageSize.getHeight();
    if (y > H - 20) { doc.addPage(); pdfSetBg(doc); y = 20; }
    if (isHeader) {
        doc.setFillColor(...[30,36,18]); doc.rect(0, y-5, doc.internal.pageSize.getWidth(), 12, "F");
        doc.setTextColor(...DIM); doc.setFont("courier","bold"); doc.setFontSize(7.5);
    } else {
        doc.setTextColor(...LGRE); doc.setFont("courier","normal"); doc.setFontSize(8);
    }
    let x = 14;
    cols.forEach((c, i) => { doc.text(String(c ?? "—"), x, y); x += colWidths[i]; });
    doc.setDrawColor(...[30,36,18]); doc.line(14, y+3, doc.internal.pageSize.getWidth()-14, y+3);
    return y + 11;
}

function pdfSetBg(doc) {
    const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight();
    doc.setFillColor(...DARK); doc.rect(0, 0, W, H, "F");
}

function pdfCodeBlock(doc, code, y) {
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const lines = (code || "// no code").split("\n").slice(0, 60);
    const blockH = Math.min(lines.length * 5 + 8, H - y - 10);
    if (y + blockH > H - 10) { doc.addPage(); pdfSetBg(doc); y = 20; }
    doc.setFillColor(...MID); doc.roundedRect(12, y, W - 24, blockH, 2, 2, "F");
    doc.setTextColor(...[168,196,128]); doc.setFont("courier","normal"); doc.setFontSize(6.5);
    let ty = y + 6;
    for (const line of lines) {
        if (ty > y + blockH - 4) break;
        doc.text(line.substring(0, 110), 16, ty);
        ty += 5;
    }
    return y + blockH + 6;
}

// ── LEADERBOARD PDF ───────────────────────────────────────────────────────────
async function downloadLeaderboardPDF(contest, showToast) {
    showToast("Generating PDF...");
    try {
        const res  = await api.get(`/api/admin/contests/${contest.id}/leaderboard-download`);
        const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
        const JsPDF = await loadJsPDF();
        const doc   = new JsPDF({ orientation:"portrait", unit:"pt", format:"a4" });
        pdfSetBg(doc);

        let y = pdfHeader(doc, data.contestName || contest.name, `Contest ID: ${data.contestId}  •  Total Registered: ${data.totalRegistered}  •  Generated: ${new Date().toLocaleDateString("en-IN")}`);

        // Summary strip
        doc.setTextColor(...LGRE); doc.setFont("courier","normal"); doc.setFontSize(8);
        doc.text(`Duration: ${contest.duration || "—"}   Status: ${contest.status || "—"}   Leaderboard entries: ${(data.leaderboard || []).length}`, 14, y);
        y += 18;

        for (const entry of data.leaderboard || []) {
            const H = doc.internal.pageSize.getHeight();
            if (y > H - 40) { doc.addPage(); pdfSetBg(doc); y = 20; }

            // Entry header bar
            doc.setFillColor(...(entry.rank && entry.rank !== "—" ? [28,38,14] : [30,22,14]));
            doc.rect(0, y, doc.internal.pageSize.getWidth(), 22, "F");
            doc.setTextColor(...YELLOW); doc.setFont("courier","bold"); doc.setFontSize(9);
            const rankStr = entry.rank && entry.rank !== "—" ? `#${entry.rank}` : "—";
            doc.text(rankStr, 14, y + 14);
            doc.setTextColor(...WHITE); doc.setFontSize(10);
            doc.text(entry.name || entry.email, 48, y + 14);
            doc.setTextColor(...DIM); doc.setFontSize(7.5);
            doc.text(`Score: ${entry.score}   Solved: ${entry.solvedCount}   ${entry.email}`, 14, y + 22);
            y += 30;

            if (!entry.submissions || entry.submissions.length === 0) {
                doc.setTextColor(...DIM); doc.setFont("courier","normal"); doc.setFontSize(7.5);
                doc.text("No submissions saved for this contest.", 18, y);
                y += 14;
            } else {
                for (const sub of entry.submissions) {
                    if (y > H - 60) { doc.addPage(); pdfSetBg(doc); y = 20; }
                    doc.setTextColor(...GREEN); doc.setFont("courier","bold"); doc.setFontSize(8);
                    doc.text(`${sub.problemId || "—"}  ${sub.problemTitle || ""}  [${(sub.language || "").toUpperCase()}]`, 18, y);
                    y += 5;
                    y = pdfCodeBlock(doc, sub.code, y);
                }
            }
            y += 6;
        }

        // Page numbers
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setTextColor(...DIM); doc.setFont("courier","normal"); doc.setFontSize(7);
            doc.text(`Page ${i} / ${totalPages}`, doc.internal.pageSize.getWidth() - 60, doc.internal.pageSize.getHeight() - 8);
        }

        doc.save(`leaderboard_${contest.id}.pdf`);
        showToast(`PDF downloaded for ${contest.name}`);
    } catch (e) {
        console.error(e);
        showToast("PDF generation failed", "error");
    }
}

// ── USER REPORT PDF ───────────────────────────────────────────────────────────
async function downloadUserPDF(u, showToast) {
    showToast("Generating user PDF...");
    try {
        const res     = await api.get(`/api/user/admin/users/${u.id}/detail`);
        const detail  = res.data;
        const JsPDF   = await loadJsPDF();
        const doc     = new JsPDF({ orientation:"portrait", unit:"pt", format:"a4" });
        pdfSetBg(doc);

        let y = pdfHeader(doc, detail.name || detail.email, `User Report  •  Generated: ${new Date().toLocaleDateString("en-IN")}`);

        // ── Profile summary ──────────────────────────────────────────────────
        y = pdfSectionLabel(doc, "Profile", y);
        const profile = [
            ["Email",    detail.email],
            ["Role",     detail.role],
            ["Rating",   String(detail.rating || 400)],
            ["Solved",   String(detail.solvedProblems?.length ?? 0)],
            ["Contests", String(detail.contestsAttended?.length ?? 0)],
            ["Joined",   detail.createdAt ? new Date(detail.createdAt).toLocaleDateString("en-IN") : "—"],
        ];
        for (const [k, v] of profile) {
            const H = doc.internal.pageSize.getHeight();
            if (y > H - 20) { doc.addPage(); pdfSetBg(doc); y = 20; }
            doc.setTextColor(...DIM); doc.setFont("courier","bold"); doc.setFontSize(8);
            doc.text(k, 18, y);
            doc.setTextColor(...LGRE); doc.setFont("courier","normal");
            doc.text(v, 90, y);
            y += 12;
        }
        y += 6;

        // ── Solved problems ──────────────────────────────────────────────────
        y = pdfSectionLabel(doc, "Solved Problems", y);
        if (!detail.solvedProblems?.length) {
            doc.setTextColor(...DIM); doc.setFontSize(8); doc.text("No problems solved yet.", 18, y); y += 14;
        } else {
            y = pdfRow(doc, ["ID","Title","Difficulty"], y, [70, 240, 80], true);
            for (const p of detail.solvedProblems) {
                const H = doc.internal.pageSize.getHeight();
                if (y > H - 20) { doc.addPage(); pdfSetBg(doc); y = 20; }
                y = pdfRow(doc, [p.id, p.title, p.difficulty], y, [70, 240, 80]);
            }
        }
        y += 8;

        // ── Contest history ──────────────────────────────────────────────────
        y = pdfSectionLabel(doc, "Contest History", y);
        if (!detail.contestsAttended?.length) {
            doc.setTextColor(...DIM); doc.setFontSize(8); doc.text("No contests attended.", 18, y); y += 14;
        } else {
            y = pdfRow(doc, ["Contest","Rank","Score","Solved","Rating Δ"], y, [180,50,60,55,70], true);
            for (const c of detail.contestsAttended) {
                const H = doc.internal.pageSize.getHeight();
                if (y > H - 20) { doc.addPage(); pdfSetBg(doc); y = 20; }
                const delta = c.ratingChange > 0 ? `+${c.ratingChange}` : String(c.ratingChange ?? 0);
                y = pdfRow(doc, [c.contestName || c.contestId, `#${c.rank}`, c.score, c.solvedCount, delta], y, [180,50,60,55,70]);
            }
        }
        y += 8;

        // ── Saved solutions (code) ────────────────────────────────────────────
        const sols = detail.savedSolutions || [];
        if (sols.length) {
            y = pdfSectionLabel(doc, "Saved Solutions / Code", y);
            for (const s of sols) {
                const H = doc.internal.pageSize.getHeight();
                if (y > H - 60) { doc.addPage(); pdfSetBg(doc); y = 20; }
                doc.setTextColor(...GREEN); doc.setFont("courier","bold"); doc.setFontSize(8);
                const ctx = s.contestId ? `Contest: ${s.contestId}` : "Practice";
                doc.text(`${s.problemId || "—"}  ${s.problemTitle || ""}  [${(s.language||"").toUpperCase()}]  (${ctx})`, 18, y);
                y += 5;
                y = pdfCodeBlock(doc, s.code, y);
            }
        }

        // Page numbers
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setTextColor(...DIM); doc.setFont("courier","normal"); doc.setFontSize(7);
            doc.text(`Page ${i} / ${totalPages}`, doc.internal.pageSize.getWidth() - 60, doc.internal.pageSize.getHeight() - 8);
        }

        doc.save(`user_report_${detail.email || u.id}.pdf`);
        showToast(`PDF downloaded for ${detail.name || detail.email}`);
    } catch (e) {
        console.error(e);
        showToast("User PDF generation failed", "error");
    }
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Admin() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [problems, setProblems]   = useState([]);
    const [contests, setContests]   = useState([]);
    const [users, setUsers]         = useState([]);
    const [userSearch, setUserSearch] = useState("");
    const [toast, setToast]         = useState(null);
    const [deleting, setDeleting]   = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [confirmBan, setConfirmBan]       = useState(null);
    const [banning, setBanning]             = useState(null);
    const [userDetailId, setUserDetailId]   = useState(null);
    const [userDetail, setUserDetail]       = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [adminCodeModal, setAdminCodeModal] = useState(null);
    const [contestSubsModal, setContestSubsModal] = useState(null);

    const [probForm, setProbForm] = useState({
        id:"", title:"", description:"", difficulty:"Easy",
        tags:"", constraints:"", timeLimit:"1s", memoryLimit:"256MB",
        explanation:"", testCases:[{ input:"", output:"" }]
    });

    const [contestForm, setContestForm] = useState({
        contestId:"", name:"", difficulty:"Easy", duration:"90 min",
        startTime:"", endTime:"", problems:""
    });

    const [probErrors, setProbErrors]     = useState({});
    const [contestErrors, setContestErrors] = useState({});

    useEffect(() => {
        if (user && user.role !== "ADMIN") navigate("/home");
    }, [user]);

    function loadData() {
        api.get("/problems").then(r => setProblems(r.data)).catch(console.error);
        api.get("/api/contests").then(r => setContests(r.data)).catch(console.error);
    }

    function loadUsers() {
        api.get("/api/user/admin/users").then(r => setUsers(r.data)).catch(console.error);
    }

    useEffect(() => { loadData(); }, []);
    useEffect(() => { if (activeTab === "manage-users") loadUsers(); }, [activeTab]);

    useEffect(() => {
        if (!userDetailId) { setUserDetail(null); return; }
        setDetailLoading(true);
        api.get(`/api/user/admin/users/${userDetailId}/detail`)
            .then(r => setUserDetail(r.data))
            .catch(() => setUserDetail(null))
            .finally(() => setDetailLoading(false));
    }, [userDetailId]);

    function showToast(msg, type = "success") {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    }

    function updateProb(field, val) { setProbForm(f => ({ ...f, [field]: val })); }
    function updateTC(i, field, val) {
        setProbForm(f => { const tcs = [...f.testCases]; tcs[i] = { ...tcs[i], [field]: val }; return { ...f, testCases:tcs }; });
    }
    function addTC()     { setProbForm(f => ({ ...f, testCases:[...f.testCases, { input:"", output:"" }] })); }
    function removeTC(i) { setProbForm(f => ({ ...f, testCases:f.testCases.filter((_,idx) => idx !== i) })); }

    function validateProblem() {
        const errs = validateAdminProblemForm(probForm);
        setProbErrors(errs);
        return Object.keys(errs).length === 0;
    }

    async function handleAddProblem() {
        if (!validateProblem()) return;
        try {
            await api.post("/api/admin/problems", {
                id:probForm.id.trim(), title:probForm.title.trim(), description:probForm.description.trim(),
                difficulty:probForm.difficulty,
                tags:probForm.tags.split(",").map(s => s.trim()).filter(Boolean),
                constraints:probForm.constraints.split("\n").map(s => s.trim()).filter(Boolean),
                timeLimit:probForm.timeLimit, memoryLimit:probForm.memoryLimit,
                explanation:probForm.explanation, testCases:probForm.testCases,
            });
            showToast("Problem added successfully!");
            setProbForm({ id:"", title:"", description:"", difficulty:"Easy", tags:"", constraints:"", timeLimit:"1s", memoryLimit:"256MB", explanation:"", testCases:[{ input:"", output:"" }] });
            setProbErrors({});
            loadData();
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to add problem", "error");
        }
    }

    function updateContest(field, val) { setContestForm(f => ({ ...f, [field]: val })); }

    function validateContest() {
        const errs = validateAdminContestForm(contestForm);
        setContestErrors(errs);
        return Object.keys(errs).length === 0;
    }

    function adminFindLatestSolution(solutions, pred) {
        const list = (solutions || []).filter(pred);
        if (!list.length) return null;
        list.sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
        return list[0];
    }

    function openAdminPracticeSolution(p) {
        const s = adminFindLatestSolution(userDetail?.savedSolutions, x => x.problemId === p.id && !x.contestId);
        if (!s?.code) { showToast("No saved practice solution for this problem", "error"); return; }
        setAdminCodeModal({ title: p.title || p.id, subtitle: "Practice", language: s.language || "", code: s.code });
    }

    function openAdminContestSubmissions(c) {
        const items = (userDetail?.savedSolutions || []).filter(x => x.contestId === c.contestId);
        setContestSubsModal({ contestName: c.contestName || c.contestId, contestId: c.contestId, items });
    }

    async function handleAddContest() {
        if (!validateContest()) return;
        try {
            await api.post("/api/admin/contests", {
                id:contestForm.contestId.trim(), name:contestForm.name.trim(),
                difficulty:contestForm.difficulty, duration:contestForm.duration,
                startTime:contestForm.startTime, endTime:contestForm.endTime,
                problems:contestForm.problems.split(",").map(s => s.trim()).filter(Boolean),
            });
            showToast("Contest created successfully!");
            setContestForm({ contestId:"", name:"", difficulty:"Easy", duration:"90 min", startTime:"", endTime:"", problems:"" });
            setContestErrors({});
            loadData();
        } catch (err) {
            showToast(err.response?.data?.error || "Failed to create contest", "error");
        }
    }

    async function handleDelete() {
        if (!confirmDelete) return;
        const { type, id } = confirmDelete;
        setDeleting(id);
        try {
            if (type === "problem") { await api.delete(`/api/admin/problems/${id}`); showToast("Problem deleted"); }
            else { await api.delete(`/api/admin/contests/${id}`); showToast("Contest deleted"); }
            loadData();
        } catch (err) {
            showToast(err.response?.data?.error || "Delete failed", "error");
        } finally { setDeleting(null); setConfirmDelete(null); }
    }

    async function handleBanUser() {
        if (!confirmBan) return;
        setBanning(confirmBan.id);
        try {
            await api.delete(`/api/user/admin/users/${confirmBan.id}/ban`);
            showToast(`User ${confirmBan.email} has been banned`);
            loadUsers();
        } catch (err) {
            showToast(err.response?.data?.error || "Ban failed", "error");
        } finally { setBanning(null); setConfirmBan(null); }
    }

    const searchQ = validateUserSearch(userSearch);
    const filteredUsers = users.filter(u =>
        !searchQ || u.email?.toLowerCase().includes(searchQ.toLowerCase()) ||
        u.name?.toLowerCase().includes(searchQ.toLowerCase())
    );

    const stats = [
        { label:"Total Problems", val:problems.length,                                      color:"#C8CFA8" },
        { label:"Total Contests", val:contests.length,                                      color:"#89dceb" },
        { label:"Live Contests",  val:contests.filter(c => c.status === "live").length,     color:"#a6e3a1" },
        { label:"Upcoming",       val:contests.filter(c => c.status === "upcoming").length, color:"#f0c674" },
    ];

    return (
        <>
            <style>{STYLES}</style>
            <Navbar />

            {toast && (
                <div className={`adm-toast ${toast.type === "error" ? "adm-toast-err" : ""}`}>
                    {toast.type === "error" ? "✘ " : "✔ "}{toast.msg}
                </div>
            )}

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, backdropFilter:"blur(4px)" }}>
                    <div style={{ background:"#161a0d", border:"0.5px solid rgba(201,122,106,0.4)", borderRadius:12, padding:32, width:"min(420px,90vw)" }}>
                        <div style={{ fontFamily:"Syne, sans-serif", fontSize:18, fontWeight:800, color:"#F0EDE6", marginBottom:12 }}>Confirm Delete</div>
                        <div style={{ fontSize:13, color:"#6B7A3A", lineHeight:1.7, marginBottom:24 }}>
                            Delete <span style={{ color:"#F0EDE6" }}>"{confirmDelete.name}"</span>? This cannot be undone.
                        </div>
                        <div style={{ display:"flex", gap:12 }}>
                            <button onClick={() => setConfirmDelete(null)} style={{ flex:1, padding:"10px", background:"transparent", border:"0.5px solid rgba(106,122,58,0.4)", borderRadius:7, color:"#6B7A3A", fontFamily:"DM Mono", fontSize:12, cursor:"pointer" }}>Cancel</button>
                            <button onClick={handleDelete} disabled={!!deleting} style={{ flex:1, padding:"10px", background:"rgba(201,122,106,0.15)", border:"0.5px solid rgba(201,122,106,0.5)", borderRadius:7, color:"#c97a6a", fontFamily:"DM Mono", fontSize:12, cursor:"pointer", opacity: deleting ? 0.5 : 1 }}>
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {adminCodeModal && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10002, backdropFilter:"blur(6px)", padding:16 }} onClick={() => setAdminCodeModal(null)}>
                    <div style={{ background:"#161a0d", border:"0.5px solid rgba(106,122,58,0.4)", borderRadius:12, width:"min(700px,96vw)", maxHeight:"88vh", display:"flex", flexDirection:"column", overflow:"hidden" }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding:"16px 20px", borderBottom:"0.5px solid rgba(106,122,58,0.2)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                            <div>
                                <div style={{ fontSize:10, color:"#6B7A3A", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4 }}>{adminCodeModal.subtitle}</div>
                                <div style={{ fontFamily:"Syne, sans-serif", fontSize:17, fontWeight:700, color:"#F0EDE6" }}>{adminCodeModal.title}</div>
                                <div style={{ fontSize:11, color:"#3A4A1E", marginTop:6 }}>Language: <span style={{ color:"#C8CFA8" }}>{(adminCodeModal.language || "—").toUpperCase()}</span></div>
                            </div>
                            <button type="button" onClick={() => setAdminCodeModal(null)} style={{ background:"none", border:"0.5px solid rgba(106,122,58,0.3)", borderRadius:6, color:"#6B7A3A", padding:"6px 12px", fontFamily:"DM Mono", fontSize:11, cursor:"pointer", flexShrink:0 }}>✕</button>
                        </div>
                        <pre style={{ margin:0, padding:20, overflow:"auto", fontFamily:"DM Mono, monospace", fontSize:12, lineHeight:1.75, color:"#e8e0d0", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{adminCodeModal.code || "// empty"}</pre>
                    </div>
                </div>
            )}

            {contestSubsModal && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10001, backdropFilter:"blur(4px)", padding:16 }} onClick={() => setContestSubsModal(null)}>
                    <div style={{ background:"#161a0d", border:"0.5px solid rgba(240,198,116,0.35)", borderRadius:12, width:"min(520px,96vw)", maxHeight:"80vh", overflow:"hidden", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding:"16px 20px", borderBottom:"0.5px solid rgba(106,122,58,0.2)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div style={{ fontFamily:"Syne, sans-serif", fontSize:16, fontWeight:700, color:"#F0EDE6" }}>Contest: {contestSubsModal.contestName}</div>
                            <button type="button" onClick={() => setContestSubsModal(null)} style={{ background:"none", border:"0.5px solid rgba(106,122,58,0.3)", borderRadius:6, color:"#6B7A3A", padding:"6px 12px", fontFamily:"DM Mono", fontSize:11, cursor:"pointer" }}>✕</button>
                        </div>
                        <div style={{ padding:16, overflowY:"auto", fontFamily:"DM Mono, monospace", fontSize:12 }}>
                            {contestSubsModal.items.length === 0 ? (
                                <div style={{ color:"#3A4A1E", lineHeight:1.6 }}>No saved contest code for this user on this contest.</div>
                            ) : (
                                contestSubsModal.items.map((s, i) => (
                                    <button type="button" key={i} onClick={() => {
                                        setContestSubsModal(null);
                                        setAdminCodeModal({ title: s.problemTitle || s.problemId, subtitle: `Contest ${contestSubsModal.contestId}`, language: s.language || "", code: s.code || "" });
                                    }} style={{ display:"block", width:"100%", textAlign:"left", marginBottom:8, padding:"12px 14px", background:"#111409", border:"0.5px solid rgba(106,122,58,0.25)", borderRadius:8, color:"#C8CFA8", cursor:"pointer", fontFamily:"DM Mono, monospace", fontSize:12 }}>
                                        <span style={{ color:"#f0c674" }}>{s.problemId}</span>
                                        <span style={{ color:"#3A4A1E", margin:"0 8px" }}>·</span>
                                        {(s.language || "code").toUpperCase()}
                                        <span style={{ float:"right", color:"#6B7A3A", fontSize:10 }}>view →</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* User detail modal */}
            {userDetailId && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, backdropFilter:"blur(4px)", padding:16 }} onClick={() => { setUserDetailId(null); setAdminCodeModal(null); setContestSubsModal(null); }}>
                    <div style={{ background:"#161a0d", border:"0.5px solid rgba(106,122,58,0.4)", borderRadius:12, width:"min(720px,96vw)", maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:"0.5px solid rgba(106,122,58,0.2)" }}>
                            <div style={{ fontFamily:"Syne, sans-serif", fontSize:18, fontWeight:800, color:"#F0EDE6" }}>User detail</div>
                            <button type="button" onClick={() => { setUserDetailId(null); setAdminCodeModal(null); setContestSubsModal(null); }} style={{ background:"none", border:"0.5px solid rgba(106,122,58,0.3)", borderRadius:6, color:"#6B7A3A", padding:"6px 12px", fontFamily:"DM Mono", fontSize:11, cursor:"pointer" }}>✕ Close</button>
                        </div>
                        <div style={{ overflowY:"auto", padding:24, fontFamily:"DM Mono, monospace", fontSize:12, color:"#C8CFA8" }}>
                            {detailLoading ? (
                                <div style={{ color:"#3A4A1E", textAlign:"center", padding:32 }}>Loading...</div>
                            ) : !userDetail ? (
                                <div style={{ color:"#c97a6a" }}>Could not load user.</div>
                            ) : (
                                <>
                                    <div style={{ marginBottom:20, lineHeight:1.8 }}>
                                        <div><span style={{ color:"#3A4A1E" }}>Name</span> — {userDetail.name}</div>
                                        <div><span style={{ color:"#3A4A1E" }}>Email</span> — {userDetail.email}</div>
                                        <div><span style={{ color:"#3A4A1E" }}>Role</span> — {userDetail.role}</div>
                                        <div><span style={{ color:"#3A4A1E" }}>Rating</span> — {userDetail.rating}</div>
                                        <div><span style={{ color:"#3A4A1E" }}>Problems solved</span> — {userDetail.solvedProblems?.length ?? 0}</div>
                                        <div><span style={{ color:"#3A4A1E" }}>Contests participated</span> — {userDetail.contestsAttended?.length ?? 0}</div>
                                    </div>
                                    <div style={{ fontSize:10, color:"#4a5a28", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Solved problems — click row to view saved practice code</div>
                                    <div style={{ maxHeight:180, overflowY:"auto", marginBottom:20, border:"0.5px solid rgba(106,122,58,0.2)", borderRadius:8, padding:10 }}>
                                        {(userDetail.solvedProblems || []).length === 0 ? <span style={{ color:"#3A4A1E" }}>—</span> : userDetail.solvedProblems.map((p, i) => (
                                            <div key={i} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") openAdminPracticeSolution(p); }} onClick={() => openAdminPracticeSolution(p)} style={{ padding:"8px 6px", borderBottom:"0.5px solid rgba(106,122,58,0.08)", cursor:"pointer", borderRadius:4 }} title="View practice submission">
                                                {p.id} · {p.title} <span style={{ color:"#3A4A1E" }}>({p.difficulty})</span>
                                                <span style={{ float:"right", color:"#6B7A3A", fontSize:10 }}>code →</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ fontSize:10, color:"#4a5a28", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:10 }}>Contest history — click row to view contest submissions</div>
                                    <div style={{ maxHeight:160, overflowY:"auto", marginBottom:8, border:"0.5px solid rgba(106,122,58,0.2)", borderRadius:8, padding:10 }}>
                                        {(userDetail.contestsAttended || []).length === 0 ? <span style={{ color:"#3A4A1E" }}>—</span> : userDetail.contestsAttended.map((c, i) => (
                                            <div key={i} role="button" tabIndex={0} onKeyDown={e => { if (e.key === "Enter") openAdminContestSubmissions(c); }} onClick={() => openAdminContestSubmissions(c)} style={{ padding:"8px 6px", borderBottom:"0.5px solid rgba(106,122,58,0.06)", cursor:"pointer" }} title="View saved code for this contest">
                                                {c.contestName || c.contestId} · rank #{c.rank} · {c.solvedCount ?? 0} solved · {c.score ?? 0} pts
                                                <span style={{ float:"right", color:"#6B7A3A", fontSize:10 }}>submissions →</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Ban Modal */}
            {confirmBan && (
                <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, backdropFilter:"blur(4px)" }}>
                    <div style={{ background:"#161a0d", border:"0.5px solid rgba(201,122,106,0.4)", borderRadius:12, padding:32, width:"min(420px,90vw)" }}>
                        <div style={{ fontFamily:"Syne, sans-serif", fontSize:18, fontWeight:800, color:"#F0EDE6", marginBottom:12 }}>Ban User?</div>
                        <div style={{ fontSize:13, color:"#6B7A3A", lineHeight:1.7, marginBottom:24 }}>
                            Ban <span style={{ color:"#F0EDE6" }}>{confirmBan.name}</span> (<span style={{ color:"#c97a6a" }}>{confirmBan.email}</span>)?<br/>
                            This will permanently remove the user account.
                        </div>
                        <div style={{ display:"flex", gap:12 }}>
                            <button onClick={() => setConfirmBan(null)} style={{ flex:1, padding:"10px", background:"transparent", border:"0.5px solid rgba(106,122,58,0.4)", borderRadius:7, color:"#6B7A3A", fontFamily:"DM Mono", fontSize:12, cursor:"pointer" }}>Cancel</button>
                            <button onClick={handleBanUser} disabled={!!banning} style={{ flex:1, padding:"10px", background:"rgba(201,122,106,0.15)", border:"0.5px solid rgba(201,122,106,0.5)", borderRadius:7, color:"#c97a6a", fontFamily:"DM Mono", fontSize:12, cursor:"pointer", opacity: banning ? 0.5 : 1 }}>
                                {banning ? "Banning..." : "Ban User"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="adm-page">
                {/* Sidebar */}
                <div className="adm-sidebar">
                    <div className="adm-sidebar-head">
                        <div className="adm-sidebar-title">Admin</div>
                        <div className="adm-sidebar-sub">// dashboard</div>
                    </div>
                    {[
                        { id:"overview",      label:"Overview" },
                        { id:"problems",      label:"Add Problem" },
                        { id:"manage-p",      label:"Manage Problems" },
                        { id:"contests",      label:"Create Contest" },
                        { id:"manage-c",      label:"Manage Contests" },
                        { id:"manage-users",  label:"Manage Users" },
                    ].map(t => (
                        <button key={t.id} className={`adm-nav-item ${activeTab === t.id ? "active" : ""}`}
                            onClick={() => setActiveTab(t.id)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Main */}
                <div className="adm-main">

                    {/* OVERVIEW */}
                    {activeTab === "overview" && (
                        <div className="adm-section">
                            <div className="adm-section-title">Overview</div>
                            <div className="adm-stats-grid">
                                {stats.map(s => (
                                    <div key={s.label} className="adm-stat-card">
                                        <div className="adm-stat-val" style={{ color:s.color }}>{s.val}</div>
                                        <div className="adm-stat-label">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="adm-sub-title">Recent Problems</div>
                            <div className="adm-table">
                                <div className="adm-table-head"><span>ID</span><span>Title</span><span>Difficulty</span><span>Tags</span></div>
                                {problems.slice(0,8).map((p,i) => (
                                    <div key={i} className="adm-table-row">
                                        <span className="adm-cell-mono">{p.id}</span>
                                        <span>{p.title}</span>
                                        <span style={{ color: p.difficulty==="Easy"?"#a6e3a1":p.difficulty==="Hard"?"#c97a6a":"#f0c674" }}>{p.difficulty}</span>
                                        <span className="adm-cell-dim">{p.tags?.slice(0,2).join(", ")}</span>
                                    </div>
                                ))}
                                {problems.length === 0 && <div className="adm-empty">// no problems yet</div>}
                            </div>
                            <div className="adm-sub-title" style={{ marginTop:32 }}>Contests</div>
                            <div className="adm-table">
                                <div className="adm-table-head"><span>Name</span><span>Status</span><span>Start</span><span>Duration</span></div>
                                {contests.slice(0,6).map((c,i) => (
                                    <div key={i} className="adm-table-row">
                                        <span>{c.name}</span>
                                        <span style={{ color: c.status==="live"?"#a6e3a1":c.status==="upcoming"?"#f0c674":"#6B7A3A" }}>{c.status}</span>
                                        <span className="adm-cell-dim">{c.startTime?.slice(0,10)}</span>
                                        <span className="adm-cell-dim">{c.duration}</span>
                                    </div>
                                ))}
                                {contests.length === 0 && <div className="adm-empty">// no contests yet</div>}
                            </div>
                        </div>
                    )}

                    {/* ADD PROBLEM */}
                    {activeTab === "problems" && (
                        <div className="adm-section">
                            <div className="adm-section-title">Add New Problem</div>
                            <div className="adm-form-grid">
                                <div className="adm-field">
                                    <label className="adm-label">Problem ID * <span style={{ color:"#4a5a28" }}>(e.g. prob_042)</span></label>
                                    <input className={`adm-input ${probErrors.id ? "adm-input-err" : ""}`} placeholder="prob_042" value={probForm.id} maxLength={32} onChange={e => updateProb("id", e.target.value)} />
                                    {probErrors.id && <span className="adm-error">{probErrors.id}</span>}
                                </div>
                                <div className="adm-field">
                                    <label className="adm-label">Difficulty *</label>
                                    <select className="adm-input" value={probForm.difficulty} onChange={e => updateProb("difficulty", e.target.value)}>
                                        <option>Easy</option><option>Medium</option><option>Hard</option>
                                    </select>
                                </div>
                                <div className="adm-field" style={{ gridColumn:"1 / -1" }}>
                                    <label className="adm-label">Title *</label>
                                    <input className={`adm-input ${probErrors.title ? "adm-input-err" : ""}`} placeholder="Problem title" value={probForm.title} maxLength={LIMITS.titleMax} onChange={e => updateProb("title", e.target.value)} />
                                    {probErrors.title && <span className="adm-error">{probErrors.title}</span>}
                                </div>
                                <div className="adm-field" style={{ gridColumn:"1 / -1" }}>
                                    <label className="adm-label">Description *</label>
                                    <textarea className={`adm-textarea ${probErrors.description ? "adm-input-err" : ""}`} rows={4} placeholder="Full problem description..." value={probForm.description} maxLength={LIMITS.descMax} onChange={e => updateProb("description", e.target.value)} />
                                    {probErrors.description && <span className="adm-error">{probErrors.description}</span>}
                                </div>
                                <div className="adm-field">
                                    <label className="adm-label">Tags (comma separated)</label>
                                    <input className={`adm-input ${probErrors.tags ? "adm-input-err" : ""}`} placeholder="Arrays, DP, Graph" value={probForm.tags} maxLength={LIMITS.tagLineMax} onChange={e => updateProb("tags", e.target.value)} />
                                    {probErrors.tags && <span className="adm-error">{probErrors.tags}</span>}
                                </div>
                                <div className="adm-field">
                                    <label className="adm-label">Time Limit</label>
                                    <input className="adm-input" placeholder="1s" value={probForm.timeLimit} maxLength={LIMITS.memoryTimeMax} onChange={e => updateProb("timeLimit", e.target.value)} />
                                </div>
                                <div className="adm-field">
                                    <label className="adm-label">Memory Limit</label>
                                    <input className="adm-input" placeholder="256MB" value={probForm.memoryLimit} maxLength={LIMITS.memoryTimeMax} onChange={e => updateProb("memoryLimit", e.target.value)} />
                                </div>
                                <div className="adm-field" style={{ gridColumn:"1 / -1" }}>
                                    <label className="adm-label">Constraints (one per line)</label>
                                    <textarea className="adm-textarea" rows={3} placeholder={"1 <= n <= 10^5\n0 <= arr[i] <= 10^9"} value={probForm.constraints} onChange={e => updateProb("constraints", e.target.value)} />
                                </div>
                                <div className="adm-field" style={{ gridColumn:"1 / -1" }}>
                                    <label className="adm-label">Explanation (optional)</label>
                                    <textarea className="adm-textarea" rows={2} placeholder="Explanation of approach..." value={probForm.explanation} onChange={e => updateProb("explanation", e.target.value)} />
                                </div>
                            </div>
                            <div className="adm-sub-title">Test Cases *</div>
                            {probErrors.testCases && <div className="adm-error" style={{ marginBottom:12 }}>{probErrors.testCases}</div>}
                            {probForm.testCases.map((tc, i) => (
                                <div key={i} className="adm-tc-row">
                                    <div className="adm-tc-num">#{i+1}</div>
                                    <div className="adm-field" style={{ flex:1 }}>
                                        <label className="adm-label">Input</label>
                                        <textarea className="adm-textarea" rows={2} placeholder="stdin input" value={tc.input} onChange={e => updateTC(i, "input", e.target.value)} />
                                    </div>
                                    <div className="adm-field" style={{ flex:1 }}>
                                        <label className="adm-label">Expected Output</label>
                                        <textarea className="adm-textarea" rows={2} placeholder="expected stdout" value={tc.output} onChange={e => updateTC(i, "output", e.target.value)} />
                                    </div>
                                    {probForm.testCases.length > 1 && (
                                        <button className="adm-remove-btn" onClick={() => removeTC(i)}>✕</button>
                                    )}
                                </div>
                            ))}
                            <button className="adm-add-tc-btn" onClick={addTC}>+ Add Test Case</button>
                            <button className="adm-submit-btn" onClick={handleAddProblem}>Add Problem</button>
                        </div>
                    )}

                    {/* MANAGE PROBLEMS */}
                    {activeTab === "manage-p" && (
                        <div className="adm-section">
                            <div className="adm-section-title">Manage Problems</div>
                            <div className="adm-table">
                                <div className="adm-table-head" style={{ gridTemplateColumns:"100px 1fr 100px 80px 80px" }}>
                                    <span>ID</span><span>Title</span><span>Difficulty</span><span>Tags</span><span>Action</span>
                                </div>
                                {problems.map((p, i) => (
                                    <div key={i} className="adm-table-row" style={{ gridTemplateColumns:"100px 1fr 100px 80px 80px" }}>
                                        <span className="adm-cell-mono">{p.id}</span>
                                        <span>{p.title}</span>
                                        <span style={{ color: p.difficulty==="Easy"?"#a6e3a1":p.difficulty==="Hard"?"#c97a6a":"#f0c674" }}>{p.difficulty}</span>
                                        <span className="adm-cell-dim">{p.tags?.length || 0}</span>
                                        <button className="adm-delete-btn" onClick={() => setConfirmDelete({ type:"problem", id:p.id, name:p.title })}>Delete</button>
                                    </div>
                                ))}
                                {problems.length === 0 && <div className="adm-empty">// no problems yet</div>}
                            </div>
                        </div>
                    )}

                    {/* CREATE CONTEST */}
                    {activeTab === "contests" && (
                        <div className="adm-section">
                            <div className="adm-section-title">Create Contest</div>
                            <div className="adm-form-grid">
                                <div className="adm-field">
                                    <label className="adm-label">Contest ID * <span style={{ color:"#4a5a28" }}>(e.g. contest_005)</span></label>
                                    <input className={`adm-input ${contestErrors.contestId ? "adm-input-err" : ""}`} placeholder="contest_005" value={contestForm.contestId} maxLength={48} onChange={e => updateContest("contestId", e.target.value)} />
                                    {contestErrors.contestId && <span className="adm-error">{contestErrors.contestId}</span>}
                                </div>
                                <div className="adm-field">
                                    <label className="adm-label">Difficulty</label>
                                    <select className="adm-input" value={contestForm.difficulty} onChange={e => updateContest("difficulty", e.target.value)}>
                                        <option>Easy</option><option>Medium</option><option>Hard</option><option>Mixed</option>
                                    </select>
                                </div>
                                <div className="adm-field" style={{ gridColumn:"1 / -1" }}>
                                    <label className="adm-label">Contest Name *</label>
                                    <input className={`adm-input ${contestErrors.name ? "adm-input-err" : ""}`} placeholder="e.g. CodeWeb Round #12" value={contestForm.name} maxLength={LIMITS.titleMax} onChange={e => updateContest("name", e.target.value)} />
                                    {contestErrors.name && <span className="adm-error">{contestErrors.name}</span>}
                                </div>
                                <div className="adm-field">
                                    <label className="adm-label">Duration *</label>
                                    <input className={`adm-input ${contestErrors.duration ? "adm-input-err" : ""}`} placeholder="e.g. 90 min" value={contestForm.duration} maxLength={64} onChange={e => updateContest("duration", e.target.value)} />
                                    {contestErrors.duration && <span className="adm-error">{contestErrors.duration}</span>}
                                </div>
                                <div className="adm-field">
                                    <label className="adm-label">Start Time *</label>
                                    <input className={`adm-input ${contestErrors.startTime ? "adm-input-err" : ""}`} type="datetime-local" value={contestForm.startTime} onChange={e => updateContest("startTime", e.target.value)} />
                                    {contestErrors.startTime && <span className="adm-error">{contestErrors.startTime}</span>}
                                </div>
                                <div className="adm-field">
                                    <label className="adm-label">End Time *</label>
                                    <input className={`adm-input ${contestErrors.endTime ? "adm-input-err" : ""}`} type="datetime-local" value={contestForm.endTime} onChange={e => updateContest("endTime", e.target.value)} />
                                    {contestErrors.endTime && <span className="adm-error">{contestErrors.endTime}</span>}
                                </div>
                                <div className="adm-field" style={{ gridColumn:"1 / -1" }}>
                                    <label className="adm-label">Problem IDs (comma separated) *</label>
                                    <input className={`adm-input ${contestErrors.problems ? "adm-input-err" : ""}`} placeholder="prob_001, prob_002, prob_003" value={contestForm.problems} maxLength={2000} onChange={e => updateContest("problems", e.target.value)} />
                                    {contestErrors.problems && <span className="adm-error">{contestErrors.problems}</span>}
                                    <div className="adm-hint">Available: {problems.map(p => p.id).join(", ") || "none yet"}</div>
                                </div>
                            </div>
                            <button className="adm-submit-btn" onClick={handleAddContest}>Create Contest</button>
                        </div>
                    )}

                    {/* MANAGE CONTESTS */}
                    {activeTab === "manage-c" && (
                        <div className="adm-section">
                            <div className="adm-section-title">Manage Contests</div>
                            <div className="adm-table">
                                <div className="adm-table-head" style={{ gridTemplateColumns:"110px 1fr 80px 80px 110px 72px" }}>
                                    <span>ID</span><span>Name</span><span>Status</span><span>Duration</span><span>Leaderboard</span><span>Action</span>
                                </div>
                                {contests.map((c, i) => (
                                    <div key={i} className="adm-table-row" style={{ gridTemplateColumns:"110px 1fr 80px 80px 110px 72px" }}>
                                        <span className="adm-cell-mono">{c.id}</span>
                                        <span>{c.name}</span>
                                        <span style={{ color: c.status==="live"?"#a6e3a1":c.status==="upcoming"?"#f0c674":"#6B7A3A" }}>{c.status}</span>
                                        <span className="adm-cell-dim">{c.duration}</span>
                                        <button
                                            className="adm-dl-btn"
                                            title="Download leaderboard PDF with all user code"
                                            onClick={() => downloadLeaderboardPDF(c, showToast)}
                                        >⬇ PDF</button>
                                        <button className="adm-delete-btn" onClick={() => setConfirmDelete({ type:"contest", id:c.id, name:c.name })}>Delete</button>
                                    </div>
                                ))}
                                {contests.length === 0 && <div className="adm-empty">// no contests yet</div>}
                            </div>
                        </div>
                    )}

                    {/* MANAGE USERS */}
                    {activeTab === "manage-users" && (
                        <div className="adm-section">
                            <div className="adm-section-title">Manage Users</div>
                            <div style={{ marginBottom:20 }}>
                                <input
                                    className="adm-input"
                                    style={{ width:320, maxWidth:"100%" }}
                                    placeholder="Search by email or name..."
                                    value={userSearch}
                                    maxLength={120}
                                    onChange={e => setUserSearch(e.target.value)}
                                />
                            </div>
                            <div className="adm-table">
                                <div className="adm-table-head" style={{ gridTemplateColumns:"1fr 140px 56px 48px 60px 60px 60px" }}>
                                    <span>Name / Email</span><span>Joined</span><span>Rating</span><span>Solved</span><span>View</span><span>PDF</span><span>Ban</span>
                                </div>
                                {filteredUsers.map((u, i) => (
                                    <div key={i} className="adm-table-row" style={{ gridTemplateColumns:"1fr 140px 56px 48px 60px 60px 60px" }}>
                                        <div>
                                            <div style={{ fontSize:12, color:"#F0EDE6" }}>{u.name}</div>
                                            <div style={{ fontSize:10, color:"#6B7A3A", marginTop:2 }}>{u.email}</div>
                                        </div>
                                        <span className="adm-cell-dim">{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-IN") : "—"}</span>
                                        <span style={{ color:"#C8CFA8" }}>{u.rating || 400}</span>
                                        <span className="adm-cell-dim">{u.solvedCount || 0}</span>
                                        <button type="button" className="adm-view-btn" onClick={() => setUserDetailId(u.id)}>View</button>
                                        <button type="button" className="adm-dl-btn" title="Download full user report PDF" onClick={() => downloadUserPDF(u, showToast)}>⬇ PDF</button>
                                        <button type="button" className="adm-ban-btn" onClick={() => setConfirmBan({ id:u.id, name:u.name, email:u.email })}>Ban</button>
                                    </div>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <div className="adm-empty">
                                        {userSearch ? "// no users match that search" : "// no users found"}
                                    </div>
                                )}
                            </div>
                            <div style={{ marginTop:12, fontSize:11, color:"#3A4A1E" }}>
                                {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} shown
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
    .adm-page { display:flex; min-height:calc(100vh - 60px); background:#111409; font-family:'DM Mono',monospace; color:#F0EDE6; }
    .adm-sidebar { width:220px; flex-shrink:0; background:#161a0d; border-right:1px solid rgba(106,122,58,0.25); padding:32px 0; display:flex; flex-direction:column; }
    .adm-sidebar-head { padding:0 24px 28px; border-bottom:0.5px solid rgba(106,122,58,0.2); margin-bottom:12px; }
    .adm-sidebar-title { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; color:#f0c674; letter-spacing:-0.5px; }
    .adm-sidebar-sub { font-size:10px; color:#3A4A1E; letter-spacing:0.1em; margin-top:2px; }
    .adm-nav-item { display:block; width:100%; padding:11px 24px; background:none; border:none; color:#4a5a28; font-family:'DM Mono',monospace; font-size:12px; letter-spacing:0.08em; text-align:left; cursor:pointer; transition:all 0.15s; border-left:2px solid transparent; }
    .adm-nav-item:hover { color:#C8CFA8; background:rgba(58,74,30,0.2); }
    .adm-nav-item.active { color:#f0c674; background:rgba(240,198,116,0.07); border-left-color:#f0c674; }
    .adm-main { flex:1; padding:40px 48px; overflow-y:auto; }
    .adm-section { max-width:900px; }
    .adm-section-title { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#F0EDE6; letter-spacing:-0.5px; margin-bottom:28px; }
    .adm-sub-title { font-size:10px; text-transform:uppercase; letter-spacing:0.15em; color:#4a5a28; margin-bottom:12px; margin-top:8px; }
    .adm-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:36px; }
    .adm-stat-card { padding:20px; background:#161a0d; border:0.5px solid rgba(106,122,58,0.25); border-radius:10px; }
    .adm-stat-val { font-family:'Syne',sans-serif; font-size:28px; font-weight:800; letter-spacing:-1px; line-height:1; margin-bottom:6px; }
    .adm-stat-label { font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:#3A4A1E; }
    .adm-table { background:#161a0d; border:0.5px solid rgba(106,122,58,0.25); border-radius:10px; overflow:hidden; margin-bottom:12px; }
    .adm-table-head { display:grid; grid-template-columns:120px 1fr 100px 1fr; padding:10px 20px; font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:#3A4A1E; border-bottom:0.5px solid rgba(106,122,58,0.2); }
    .adm-table-row { display:grid; grid-template-columns:120px 1fr 100px 1fr; padding:12px 20px; font-size:12px; border-bottom:0.5px solid rgba(106,122,58,0.1); transition:background 0.15s; align-items:center; }
    .adm-table-row:last-child { border-bottom:none; }
    .adm-table-row:hover { background:rgba(58,74,30,0.15); }
    .adm-cell-mono { color:#6B7A3A; font-size:11px; }
    .adm-cell-dim  { color:#4a5a28; font-size:11px; }
    .adm-empty { padding:24px 20px; font-size:12px; color:#3A4A1E; letter-spacing:0.05em; }
    .adm-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:24px; }
    .adm-field { display:flex; flex-direction:column; gap:6px; }
    .adm-label { font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:#4a5a28; }
    .adm-input { padding:9px 14px; background:#161a0d; border:0.5px solid rgba(106,122,58,0.35); border-radius:7px; color:#F0EDE6; font-family:'DM Mono',monospace; font-size:12px; outline:none; transition:border-color 0.18s; width:100%; box-sizing:border-box; }
    .adm-input:focus { border-color:#6B7A3A; }
    .adm-input::placeholder { color:#2a3516; }
    .adm-input-err { border-color:rgba(201,122,106,0.6) !important; }
    .adm-error { font-size:10px; color:#c97a6a; letter-spacing:0.04em; }
    .adm-textarea { padding:9px 14px; background:#161a0d; border:0.5px solid rgba(106,122,58,0.35); border-radius:7px; color:#F0EDE6; font-family:'DM Mono',monospace; font-size:12px; outline:none; resize:vertical; transition:border-color 0.18s; width:100%; box-sizing:border-box; line-height:1.6; }
    .adm-textarea:focus { border-color:#6B7A3A; }
    .adm-textarea::placeholder { color:#2a3516; }
    .adm-hint { font-size:10px; color:#3A4A1E; letter-spacing:0.04em; margin-top:2px; }
    .adm-tc-row { display:flex; align-items:flex-start; gap:12px; margin-bottom:12px; padding:16px; background:#161a0d; border:0.5px solid rgba(106,122,58,0.2); border-radius:8px; }
    .adm-tc-num { font-size:10px; color:#3A4A1E; padding-top:26px; min-width:24px; letter-spacing:0.06em; }
    .adm-remove-btn { margin-top:26px; padding:6px 10px; background:transparent; border:0.5px solid rgba(201,122,106,0.3); border-radius:6px; color:#c97a6a; font-size:11px; cursor:pointer; transition:all 0.15s; font-family:'DM Mono',monospace; }
    .adm-remove-btn:hover { background:rgba(201,122,106,0.1); }
    .adm-add-tc-btn { padding:8px 16px; background:transparent; border:0.5px solid rgba(106,122,58,0.4); border-radius:6px; color:#6B7A3A; font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.08em; cursor:pointer; margin-bottom:24px; transition:all 0.15s; }
    .adm-add-tc-btn:hover { border-color:#C8CFA8; color:#C8CFA8; }
    .adm-submit-btn { padding:11px 32px; background:#3A4A1E; border:1px solid #6B7A3A; border-radius:7px; color:#C8CFA8; font-family:'DM Mono',monospace; font-size:12px; font-weight:500; letter-spacing:0.12em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; margin-top:8px; }
    .adm-submit-btn:hover { background:#6B7A3A; color:#111409; box-shadow:0 0 16px rgba(106,122,58,0.3); }
    .adm-delete-btn { padding:5px 10px; background:rgba(201,122,106,0.1); border:0.5px solid rgba(201,122,106,0.35); border-radius:6px; color:#c97a6a; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.06em; cursor:pointer; transition:all 0.15s; }
    .adm-delete-btn:hover { background:rgba(201,122,106,0.2); border-color:rgba(201,122,106,0.6); }
    .adm-dl-btn { padding:5px 10px; background:rgba(137,220,235,0.08); border:0.5px solid rgba(137,220,235,0.3); border-radius:6px; color:#89dceb; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.06em; cursor:pointer; transition:all 0.15s; }
    .adm-dl-btn:hover { background:rgba(137,220,235,0.18); border-color:#89dceb; box-shadow:0 0 10px rgba(137,220,235,0.15); }
    .adm-ban-btn { padding:5px 10px; background:rgba(201,122,106,0.1); border:0.5px solid rgba(201,122,106,0.35); border-radius:6px; color:#c97a6a; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.06em; cursor:pointer; transition:all 0.15s; }
    .adm-ban-btn:hover { background:rgba(201,122,106,0.25); border-color:#c97a6a; }
    .adm-view-btn { padding:5px 10px; background:rgba(137,220,235,0.08); border:0.5px solid rgba(137,220,235,0.35); border-radius:6px; color:#89dceb; font-family:'DM Mono',monospace; font-size:10px; letter-spacing:0.06em; cursor:pointer; transition:all 0.15s; }
    .adm-view-btn:hover { background:rgba(137,220,235,0.18); border-color:#89dceb; }
    .adm-info-box { padding:14px 18px; background:rgba(240,198,116,0.06); border:0.5px solid rgba(240,198,116,0.2); border-radius:8px; font-size:12px; color:#a0a870; line-height:1.7; margin:16px 0; }
    .adm-toast { position:fixed; bottom:28px; right:28px; padding:12px 20px; background:rgba(166,233,161,0.12); border:0.5px solid rgba(166,233,161,0.4); border-radius:8px; color:#a6e3a1; font-family:'DM Mono',monospace; font-size:12px; letter-spacing:0.06em; z-index:9999; animation:toastIn 0.25s ease; box-shadow:0 4px 20px rgba(0,0,0,0.4); }
    .adm-toast-err { background:rgba(201,122,106,0.12); border-color:rgba(201,122,106,0.4); color:#c97a6a; }
    @keyframes toastIn { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
    .adm-input[type="datetime-local"] { color-scheme:dark; }
`;
