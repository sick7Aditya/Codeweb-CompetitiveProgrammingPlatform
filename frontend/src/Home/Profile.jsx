import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../ConnectingBackend/axios";
import Navbar from "../Pages/Navbar";
import { useAuth } from "../Pages/AuthContext";

function SolutionViewModal({ title, language, code, onClose }) {
    const [copied, setCopied] = useState(false);
    function copy() {
        navigator.clipboard.writeText(code || "").then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
    }
    return (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, backdropFilter:"blur(6px)" }} onClick={onClose}>
            <div style={{ background:"#161a0d", border:"0.5px solid rgba(106,122,58,0.4)", borderRadius:12, width:"min(720px,94vw)", maxHeight:"88vh", display:"flex", flexDirection:"column", overflow:"hidden" }} onClick={e => e.stopPropagation()}>
                <div style={{ padding:"18px 24px", borderBottom:"0.5px solid rgba(106,122,58,0.2)", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
                    <div>
                        <div style={{ fontSize:10, color:"#6B7A3A", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4 }}>// my solution</div>
                        <div style={{ fontSize:16, color:"#F0EDE6", fontWeight:600 }}>{title}</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                        <button type="button" onClick={copy} style={{ padding:"6px 14px", background:copied ? "rgba(166,233,161,0.12)" : "transparent", border:`0.5px solid ${copied ? "rgba(166,233,161,0.4)" : "rgba(106,122,58,0.4)"}`, borderRadius:6, color:copied ? "#a6e3a1" : "#6B7A3A", fontFamily:"DM Mono", fontSize:11, cursor:"pointer" }}>{copied ? "✔ Copied" : "⎘ Copy"}</button>
                        <button type="button" onClick={onClose} style={{ padding:"6px 12px", background:"none", border:"0.5px solid rgba(106,122,58,0.3)", borderRadius:6, color:"#6B7A3A", fontFamily:"DM Mono", fontSize:11, cursor:"pointer" }}>✕</button>
                    </div>
                </div>
                <div style={{ padding:"8px 24px", fontSize:11, color:"#3A4A1E" }}>Language: <span style={{ color:"#C8CFA8" }}>{(language || "—").toUpperCase()}</span></div>
                <pre style={{ flex:1, overflowY:"auto", margin:0, padding:"0 24px 24px", fontFamily:"DM Mono, monospace", fontSize:12, lineHeight:1.75, color:"#e8e0d0", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{code || "// No code saved"}</pre>
            </div>
        </div>
    );
}

/** Leaderboard + your contest submissions */
function ContestHistoryModal({ contestId, contestName, onClose }) {
    const [lb, setLb] = useState([]);
    const [mySol, setMySol] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewSol, setViewSol] = useState(null);
    const medals = ["🥇","🥈","🥉"];

    useEffect(() => {
        if (!contestId) return;
        let cancelled = false;
        Promise.all([
            api.get(`/api/contests/${contestId}/leaderboard`).then(r => r.data || []).catch(() => []),
            api.get(`/api/user/contest-solutions/${contestId}`).then(r => r.data || []).catch(() => []),
        ]).then(([l, s]) => { if (!cancelled) { setLb(l); setMySol(s); } }).finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [contestId]);

    return (
        <>
            {viewSol && (
                <SolutionViewModal
                    title={viewSol.problemTitle || viewSol.problemId}
                    language={viewSol.language}
                    code={viewSol.code}
                    onClose={() => setViewSol(null)}
                />
            )}
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.78)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, backdropFilter:"blur(4px)", padding:16 }} onClick={onClose}>
                <div style={{ background:"#161a0d", border:"0.5px solid rgba(106,122,58,0.4)", borderRadius:12, width:"min(640px,96vw)", maxHeight:"90vh", overflow:"hidden", display:"flex", flexDirection:"column" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:"0.5px solid rgba(106,122,58,0.2)", flexShrink:0 }}>
                        <div>
                            <div style={{ fontSize:10, color:"#6B7A3A", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:6 }}>// contest</div>
                            <div style={{ fontFamily:"Syne, sans-serif", fontSize:20, fontWeight:800, color:"#F0EDE6" }}>{contestName}</div>
                        </div>
                        <button type="button" onClick={onClose} style={{ background:"none", border:"0.5px solid rgba(106,122,58,0.3)", borderRadius:6, color:"#6B7A3A", padding:"6px 12px", fontFamily:"DM Mono, monospace", fontSize:11, cursor:"pointer" }}>✕ Close</button>
                    </div>
                    <div style={{ overflowY:"auto", padding:"0 24px 24px", flex:1 }}>
                        <div style={{ fontSize:10, color:"#4a5a28", letterSpacing:"0.12em", textTransform:"uppercase", margin:"16px 0 10px" }}>Leaderboard</div>
                        {loading ? (
                            <div style={{ textAlign:"center", padding:24, color:"#3A4A1E" }}>Loading...</div>
                        ) : lb.length === 0 ? (
                            <div style={{ fontSize:12, color:"#3A4A1E", padding:"12px 0" }}>// no leaderboard data yet</div>
                        ) : (
                            <div style={{ marginBottom:24 }}>
                                <div style={{ display:"grid", gridTemplateColumns:"36px 1fr 72px 72px 56px", padding:"8px 12px", fontSize:10, color:"#3A4A1E", textTransform:"uppercase", letterSpacing:"0.1em", borderBottom:"0.5px solid rgba(106,122,58,0.2)" }}>
                                    <span>#</span><span>Name</span><span style={{ textAlign:"right" }}>Solved</span><span style={{ textAlign:"right" }}>Pts</span><span style={{ textAlign:"right" }}>Rk</span>
                                </div>
                                {[...lb].sort((a,b) => (a.rank||0) - (b.rank||0)).map((entry, i) => (
                                    <div key={i} style={{ display:"grid", gridTemplateColumns:"36px 1fr 72px 72px 56px", padding:"10px 12px", alignItems:"center", borderBottom:"0.5px solid rgba(106,122,58,0.08)", fontSize:12 }}>
                                        <span>{medals[i] || i + 1}</span>
                                        <span style={{ color:"#F0EDE6" }}>{entry.name || entry.user}</span>
                                        <span style={{ color:"#6B7A3A", textAlign:"right" }}>{entry.solvedCount ?? "—"}</span>
                                        <span style={{ color:"#a6e3a1", textAlign:"right" }}>{entry.score}</span>
                                        <span style={{ color:"#C8CFA8", textAlign:"right" }}>#{entry.rank}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ fontSize:10, color:"#4a5a28", letterSpacing:"0.12em", textTransform:"uppercase", margin:"8px 0 10px" }}>My submissions (contest)</div>
                        {loading ? null : mySol.length === 0 ? (
                            <div style={{ fontSize:12, color:"#3A4A1E" }}>// no saved code for this contest — solutions are stored when you submit a problem in the arena.</div>
                        ) : (
                            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                                {mySol.map((s, i) => (
                                    <button type="button" key={i} onClick={() => setViewSol(s)} style={{ textAlign:"left", padding:"12px 14px", background:"#111409", border:"0.5px solid rgba(106,122,58,0.25)", borderRadius:8, cursor:"pointer", color:"#C8CFA8", fontFamily:"DM Mono", fontSize:12 }}>
                                        <span style={{ color:"#6B7A3A", fontSize:10, marginRight:8 }}>{s.problemId}</span>
                                        {s.problemTitle || "Problem"}
                                        <span style={{ float:"right", color:"#3A4A1E", fontSize:10 }}>{(s.language || "").toUpperCase()} →</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default function Profile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats]         = useState(null);
    const [profile, setProfile]     = useState(null);
    const [loading, setLoading]     = useState(true);
    const [activeTab, setActiveTab] = useState("solved");
    const [contestModal, setContestModal] = useState(null); // { contestId, contestName }
    const [solutionModal, setSolutionModal] = useState(null); // { title, language, code }
    /** Practice solutions keyed by problemId (latest from API). */
    const [solutionByProblemId, setSolutionByProblemId] = useState({});

    useEffect(() => {
        Promise.all([
            api.get("/api/user/profile"),
            api.get("/api/user/stats"),
            api.get("/api/user/solutions").catch(() => ({ data: [] })),
        ])
        .then(([profileRes, statsRes, solRes]) => {
            setProfile(profileRes.data);
            setStats(statsRes.data);
            const map = {};
            (solRes.data || []).forEach((s) => {
                if (!s.contestId) map[s.problemId] = s;
            });
            setSolutionByProblemId(map);
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }, []);

    function openPracticeSolution(problemId, title) {
        const s = solutionByProblemId[problemId];
        if (!s || !s.code) {
            window.alert("No saved solution found. Submit your code again from the Problems page to store it.");
            return;
        }
        setSolutionModal({ title: title || s.problemTitle || problemId, language: s.language, code: s.code });
    }

    function getInitials(name) {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }

    function getDifficultyColor(d) {
        if (!d) return "#6B7A3A";
        const dl = d.toLowerCase();
        if (dl === "easy")   return "#a6e3a1";
        if (dl === "medium") return "#f9e2af";
        if (dl === "hard")   return "#f38ba8";
        return "#6B7A3A";
    }

    // New rating system: base 400, +20 per solved problem in contest, -10 if solved nothing
    // Stages: Beginner 0-700, Intermediate 700-1200, Elite 1200+
    function getRatingStage(r) {
        if (!r && r !== 0) return { label: "Unrated", color: "#3A4A1E" };
        if (r >= 1200) return { label: "Elite",        color: "#f0c674" };
        if (r >= 700)  return { label: "Intermediate", color: "#89dceb" };
        return               { label: "Beginner",      color: "#a6e3a1" };
    }

    function formatDate(val) {
        if (!val) return "";
        try {
            const d = new Date(val);
            if (isNaN(d)) return "";
            return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        } catch { return ""; }
    }

    const solvedList = profile?.solvedProblems || [];
    const diffCounts = {
        easy:   stats?.easySolved   || 0,
        medium: stats?.mediumSolved || 0,
        hard:   stats?.hardSolved   || 0
    };

    // Use rating from backend (persisted, starts at 400)
    const rating     = profile?.rating ?? stats?.rating ?? 400;
    const ratingMeta = getRatingStage(rating);
    const bestRank   = stats?.bestRank ?? null;
    const bestRankContestId   = stats?.bestRankContestId ?? null;
    const bestRankContestName = bestRankContestId
        ? (profile?.contestsAttended?.find(c => c.contestId === bestRankContestId)?.contestName || "Contest")
        : null;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
                .prof-page { min-height: 100vh; background: #111409; font-family: 'DM Mono', monospace; color: #F0EDE6; }
                .prof-header { background: #161a0d; border-bottom: 1px solid rgba(106,122,58,0.25); padding: 48px 60px; display: flex; align-items: center; gap: 32px; }
                .prof-avatar { width: 80px; height: 80px; border-radius: 50%; background: #3A4A1E; border: 2px solid rgba(106,122,58,0.4); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 500; color: #C8CFA8; flex-shrink: 0; overflow: hidden; }
                .prof-avatar img { width: 100%; height: 100%; object-fit: cover; }
                .prof-header-info { flex: 1; }
                .prof-name { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: #F0EDE6; letter-spacing: -1px; margin-bottom: 6px; }
                .prof-email { font-size: 12px; color: #6B7A3A; letter-spacing: 0.05em; margin-bottom: 12px; }
                .prof-badges { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
                .prof-badge { font-size: 10px; padding: 3px 10px; border-radius: 20px; letter-spacing: 0.08em; text-transform: uppercase; }
                .badge-role     { background: rgba(200,207,168,0.1); color: #C8CFA8; border: 0.5px solid rgba(200,207,168,0.3); }
                .badge-provider { background: rgba(58,74,30,0.4); color: #6B7A3A; border: 0.5px solid rgba(106,122,58,0.3); }
                .rating-label { font-size: 9px; padding: 2px 7px; border-radius: 20px; letter-spacing: 0.08em; text-transform: uppercase; background: rgba(200,207,168,0.08); border: 0.5px solid currentColor; align-self: flex-start; margin-top: 2px; }
                .prof-joined { font-size: 11px; color: #3A4A1E; letter-spacing: 0.05em; margin-left: auto; align-self: flex-start; }
                .prof-stats { display: grid; grid-template-columns: repeat(5, 1fr); border-bottom: 1px solid rgba(106,122,58,0.2); }
                .prof-stat { padding: 28px 24px; border-right: 1px solid rgba(106,122,58,0.2); display: flex; flex-direction: column; gap: 6px; transition: background 0.2s; }
                .prof-stat:last-child { border-right: none; }
                .prof-stat:hover { background: rgba(58,74,30,0.15); }
                .prof-stat.clickable { cursor: pointer; }
                .prof-stat.clickable:hover { background: rgba(58,74,30,0.25); }
                .prof-stat-val { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 800; color: #C8CFA8; letter-spacing: -1px; line-height: 1; }
                .prof-stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #3A4A1E; }
                .prof-stat-sub { font-size: 11px; color: #4a5a28; }
                .prof-progress-wrap { margin-top: 4px; height: 3px; background: rgba(106,122,58,0.15); border-radius: 2px; overflow: hidden; }
                .prof-progress-bar { height: 100%; background: #6B7A3A; border-radius: 2px; transition: width 0.8s ease; }
                .diff-bar-wrap { display: flex; gap: 3px; margin-top: 6px; height: 4px; border-radius: 2px; overflow: hidden; }
                .diff-bar-seg { height: 100%; border-radius: 2px; }
                .prof-tabs-wrap { padding: 0 60px; border-bottom: 1px solid rgba(106,122,58,0.2); display: flex; }
                .prof-tab { padding: 16px 24px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #3A4A1E; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; font-family: 'DM Mono', monospace; transition: all 0.18s; }
                .prof-tab:hover { color: #6B7A3A; }
                .prof-tab.active { color: #C8CFA8; border-bottom-color: #C8CFA8; }
                .prof-content { padding: 40px 60px; max-width: 960px; }
                .prof-section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
                .prof-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #4a5a28; }
                .prof-count-badge { font-size: 10px; padding: 2px 8px; background: rgba(58,74,30,0.4); border-radius: 20px; color: #6B7A3A; }
                .prof-solved-list { display: flex; flex-direction: column; gap: 8px; }
                .prof-solved-item { display: grid; grid-template-columns: 110px 1fr auto auto auto; align-items: center; gap: 16px; padding: 14px 20px; background: #161a0d; border: 0.5px solid rgba(106,122,58,0.25); border-radius: 8px; cursor: pointer; transition: border-color 0.18s, background 0.18s; }
                .prof-solved-item:hover { background: #1c2210; border-color: rgba(200,207,168,0.25); }
                .prof-solved-id    { font-size: 11px; color: #3A4A1E; }
                .prof-solved-name  { font-size: 13px; color: #F0EDE6; }
                .prof-solved-date  { font-size: 10px; color: #3A4A1E; letter-spacing: 0.04em; }
                .prof-diff-badge { font-size: 10px; padding: 2px 10px; border-radius: 20px; letter-spacing: 0.06em; text-transform: capitalize; background: rgba(200,207,168,0.06); border: 0.5px solid currentColor; justify-self: end; }
                .prof-solved-check { color: #a6e3a1; font-size: 13px; }
                .prof-contest-list { display: flex; flex-direction: column; gap: 8px; }
                .prof-contest-item { display: grid; grid-template-columns: 1fr auto auto auto auto; align-items: center; gap: 24px; padding: 16px 20px; background: #161a0d; border: 0.5px solid rgba(106,122,58,0.25); border-radius: 8px; cursor: pointer; transition: border-color 0.18s, background 0.18s; }
                .prof-contest-item:hover { background: #1c2210; border-color: rgba(200,207,168,0.3); }
                .prof-contest-name   { font-size: 13px; color: #F0EDE6; }
                .prof-contest-meta   { font-size: 11px; color: #6B7A3A; letter-spacing: 0.05em; }
                .prof-contest-rank   { font-size: 13px; color: #C8CFA8; font-weight: 500; }
                .prof-contest-score  { font-size: 13px; color: #a6e3a1; }
                .prof-contest-rc     { font-size: 11px; }
                .prof-empty { text-align: center; padding: 64px 0; color: #3A4A1E; font-size: 13px; letter-spacing: 0.05em; }
                .prof-empty-icon { font-size: 40px; margin-bottom: 16px; opacity: 0.4; }
                .prof-loading { display: flex; align-items: center; justify-content: center; height: calc(100vh - 60px); color: #3A4A1E; font-size: 13px; letter-spacing: 0.1em; gap: 12px; }
                .prof-spinner { width: 16px; height: 16px; border: 2px solid rgba(200,207,168,0.2); border-top-color: #C8CFA8; border-radius: 50%; animation: profspin 0.7s linear infinite; }
                @keyframes profspin { to { transform: rotate(360deg); } }
            `}</style>

            {solutionModal && (
                <SolutionViewModal
                    title={solutionModal.title}
                    language={solutionModal.language}
                    code={solutionModal.code}
                    onClose={() => setSolutionModal(null)}
                />
            )}
            {contestModal && (
                <ContestHistoryModal
                    contestId={contestModal.contestId}
                    contestName={contestModal.contestName}
                    onClose={() => setContestModal(null)}
                />
            )}

            <Navbar />

            <div className="prof-page">
                {loading ? (
                    <div className="prof-loading">
                        <div className="prof-spinner" />
                        loading profile...
                    </div>
                ) : (
                    <>
                        {/* HEADER */}
                        <div className="prof-header">
                            <div className="prof-avatar">
                                {profile?.picture || user?.picture
                                    ? <img src={profile?.picture || user?.picture} alt="avatar" referrerPolicy="no-referrer" />
                                    : getInitials(profile?.name || user?.name)
                                }
                            </div>

                            <div className="prof-header-info">
                                <div className="prof-name">{profile?.name || user?.name || "Unknown"}</div>
                                <div className="prof-email">{profile?.email || user?.email || ""}</div>
                                <div className="prof-badges">
                                    <span className="prof-badge badge-role">{profile?.role || "USER"}</span>
                                    <span className="prof-badge badge-provider">{profile?.provider || "LOCAL"}</span>
                                    <span className="rating-label" style={{ color: ratingMeta.color }}>
                                        {ratingMeta.label}
                                    </span>
                                </div>
                            </div>

                            <div className="prof-joined">
                                {profile?.createdAt ? `Joined ${formatDate(profile.createdAt)}` : ""}
                            </div>
                        </div>

                        {/* STATS */}
                        <div className="prof-stats">
                            {/* Problems Solved */}
                            <div className="prof-stat">
                                <div className="prof-stat-val">{stats?.totalSolved || 0}</div>
                                <div className="prof-stat-label">Problems Solved</div>
                                <div className="prof-progress-wrap">
                                    <div className="prof-progress-bar" style={{ width: `${Math.min((stats?.totalSolved || 0) / 60 * 100, 100)}%` }} />
                                </div>
                                <div className="prof-stat-sub">of 60 total</div>
                            </div>

                            {/* Difficulty breakdown */}
                            <div className="prof-stat">
                                <div className="prof-stat-val" style={{ fontSize: 20, paddingTop: 6 }}>
                                    <span style={{ color: "#a6e3a1" }}>{diffCounts.easy}</span>
                                    {" / "}
                                    <span style={{ color: "#f9e2af" }}>{diffCounts.medium}</span>
                                    {" / "}
                                    <span style={{ color: "#f38ba8" }}>{diffCounts.hard}</span>
                                </div>
                                <div className="prof-stat-label">Easy / Med / Hard</div>
                                <div className="diff-bar-wrap">
                                    {diffCounts.easy > 0 && <div className="diff-bar-seg" style={{ flex: diffCounts.easy, background: "#a6e3a1" }} />}
                                    {diffCounts.medium > 0 && <div className="diff-bar-seg" style={{ flex: diffCounts.medium, background: "#f9e2af" }} />}
                                    {diffCounts.hard > 0 && <div className="diff-bar-seg" style={{ flex: diffCounts.hard, background: "#f38ba8" }} />}
                                    {(diffCounts.easy + diffCounts.medium + diffCounts.hard) === 0 && (
                                        <div className="diff-bar-seg" style={{ flex: 1, background: "rgba(106,122,58,0.15)" }} />
                                    )}
                                </div>
                            </div>

                            {/* Contests Attended — uses backend contestsAttended.size */}
                            <div className="prof-stat">
                                <div className="prof-stat-val">{stats?.contestsAttended || 0}</div>
                                <div className="prof-stat-label">Contests Attended</div>
                            </div>

                            {/* Rating — from backend (starts 400) */}
                            <div className="prof-stat">
                                <div className="prof-stat-val" style={{ color: ratingMeta.color }}>{rating}</div>
                                <div className="prof-stat-label">Rating</div>
                                <span className="rating-label" style={{ color: ratingMeta.color }}>{ratingMeta.label}</span>
                                <div className="prof-stat-sub" style={{ fontSize:9 }}>
                                    Beginner &lt;700 · Inter. 700–1200 · Elite 1200+
                                </div>
                            </div>

                            {/* Best Rank — clickable, opens that contest's leaderboard */}
                            <div
                                className={`prof-stat ${bestRank && bestRankContestId ? "clickable" : ""}`}
                                title={bestRank && bestRankContestId ? "Click to view contest leaderboard" : ""}
                                onClick={() => {
                                    if (bestRank && bestRankContestId) {
                                        setContestModal({ contestId: bestRankContestId, contestName: bestRankContestName });
                                    }
                                }}>
                                <div className="prof-stat-val">{bestRank ?? "—"}</div>
                                <div className="prof-stat-label">Best Rank</div>
                                {bestRank && bestRankContestId && (
                                    <div className="prof-stat-sub" style={{ fontSize:10, color:"#6B7A3A" }}>
                                        🏆 click to view
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TABS */}
                        <div className="prof-tabs-wrap">
                            <button className={`prof-tab ${activeTab === "solved" ? "active" : ""}`} onClick={() => setActiveTab("solved")}>
                                Solved Problems
                            </button>
                            <button className={`prof-tab ${activeTab === "contests" ? "active" : ""}`} onClick={() => setActiveTab("contests")}>
                                Contest History
                            </button>
                        </div>

                        {/* CONTENT */}
                        <div className="prof-content">

                            {/* SOLVED TAB */}
                            {activeTab === "solved" && (
                                <>
                                    <div className="prof-section-header">
                                        <span className="prof-section-title">Solved Problems</span>
                                        <span className="prof-count-badge">{solvedList.length} solved</span>
                                    </div>

                                    <div className="prof-solved-list">
                                        {solvedList.length > 0
                                            ? solvedList.map((p, i) => (
                                                <div
                                                    key={i}
                                                    className="prof-solved-item"
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={e => { if (e.key === "Enter") openPracticeSolution(p.id, p.title); }}
                                                    onClick={() => openPracticeSolution(p.id, p.title)}
                                                    title="View your submitted code">
                                                    <span className="prof-solved-id">{p.id}</span>
                                                    <span className="prof-solved-name">{p.title}</span>
                                                    <span className="prof-solved-date">{formatDate(p.solvedAt)}</span>
                                                    <span
                                                        className="prof-diff-badge"
                                                        style={{ color: getDifficultyColor(p.difficulty) }}>
                                                        {p.difficulty || "—"}
                                                    </span>
                                                    <span className="prof-solved-check">✔</span>
                                                </div>
                                            ))
                                            : (
                                                <div className="prof-empty">
                                                    <div className="prof-empty-icon">◎</div>
                                                    <div>// no problems solved yet</div>
                                                    <button
                                                        onClick={() => navigate("/Problems")}
                                                        style={{ marginTop: 20, padding: "8px 20px", background: "#3A4A1E", border: "1px solid #6B7A3A", borderRadius: 6, color: "#C8CFA8", fontFamily: "DM Mono", fontSize: 12, cursor: "pointer", letterSpacing: "0.08em" }}>
                                                        Start Solving →
                                                    </button>
                                                </div>
                                            )
                                        }
                                    </div>
                                </>
                            )}

                            {/* CONTESTS TAB */}
                            {activeTab === "contests" && (
                                <>
                                    <div className="prof-section-header">
                                        <span className="prof-section-title">Contest History</span>
                                        <span className="prof-count-badge" style={{ color: ratingMeta.color }}>
                                            Rating: {rating}
                                        </span>
                                    </div>

                                    <div className="prof-contest-list">
                                        {profile?.contestsAttended?.length > 0
                                            ? profile.contestsAttended.map((c, i) => (
                                                // Clickable — shows leaderboard for that contest
                                                <div key={i} className="prof-contest-item"
                                                    onClick={() => setContestModal({ contestId: c.contestId, contestName: c.contestName || "Contest" })}>
                                                    <div>
                                                        <div className="prof-contest-name">
                                                            {c.contestName || `Contest ${c.contestId}`}
                                                        </div>
                                                        <div className="prof-contest-meta">
                                                            {c.attendedAt ? formatDate(c.attendedAt) : ""}
                                                        </div>
                                                    </div>
                                                    <span className="prof-contest-rank">#{c.rank || "—"}</span>
                                                    <span className="prof-contest-score">{c.score ?? 0} pts</span>
                                                    <span className="prof-contest-rc" style={{ color: (c.ratingChange || 0) >= 0 ? "#a6e3a1" : "#c97a6a" }}>
                                                        {(c.ratingChange || 0) >= 0 ? `+${c.ratingChange}` : c.ratingChange}
                                                    </span>
                                                    <span style={{ color:"#6B7A3A", fontSize:10 }}>🏆 view</span>
                                                </div>
                                            ))
                                            : (
                                                <div className="prof-empty">
                                                    <div className="prof-empty-icon">◎</div>
                                                    <div>// no contests attended yet</div>
                                                    <button
                                                        onClick={() => navigate("/Contest")}
                                                        style={{ marginTop: 20, padding: "8px 20px", background: "#3A4A1E", border: "1px solid #6B7A3A", borderRadius: 6, color: "#C8CFA8", fontFamily: "DM Mono", fontSize: 12, cursor: "pointer", letterSpacing: "0.08em" }}>
                                                        Join a Contest →
                                                    </button>
                                                </div>
                                            )
                                        }
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}
