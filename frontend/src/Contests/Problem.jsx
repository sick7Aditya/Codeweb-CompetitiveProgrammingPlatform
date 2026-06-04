import { useEffect, useState } from "react";
import api from "../ConnectingBackend/axios";
import Navbar from "../Pages/Navbar";
import { useAuth } from "../Pages/AuthContext";

const API_KEY  = 'cf19efabb9mshf0671ae1433f882p1fb0b2jsnff89ecebebb6';
const API_HOST = import.meta.env.VITE_JUDGE0_API_HOST || 'judge029.p.rapidapi.com';
const LANGUAGE_IDS = { java: 62, python: 71, cpp: 54, c: 50 };
const BOILERPLATES = {
    c:      `#include <stdio.h>\nint main() {\n    // your code here\n    return 0;\n}`,
    java:   `public class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}`,
    python: `# your code here\n`,
    cpp:    `#include <iostream>\nusing namespace std;\nint main() {\n    // your code here\n    return 0;\n}`,
};
const LANG_META = {
    java:   { label: "Java",   ext: "java" },
    python: { label: "Python", ext: "py"   },
    cpp:    { label: "C++",    ext: "cpp"  },
    c:      { label: "C",      ext: "c"    },
};

function normalize(str) {
    return str?.trim().replace(/\r\n/g, "\n").replace(/\s+$/, "").toLowerCase();
}

async function judge0Run(code, langId, stdin) {
    const submitRes = await fetch(
        `https://${API_HOST}/submissions?base64_encoded=false&wait=false`,
        { method: "POST", headers: { "Content-Type": "application/json", "X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": API_HOST }, body: JSON.stringify({ source_code: code, language_id: langId, stdin }) }
    );
    const { token } = await submitRes.json();
    if (!token) throw new Error("No token from Judge0");
    let result = null;
    for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const pollRes = await fetch(`https://${API_HOST}/submissions/${token}?base64_encoded=false`, { headers: { "X-RapidAPI-Key": API_KEY, "X-RapidAPI-Host": API_HOST } });
        result = await pollRes.json();
        if (result.status?.id > 2) break;
    }
    return result;
}

// Solution viewer modal
function SolutionModal({ problem, solution, onClose }) {
    const [copied, setCopied] = useState(false);
    function copy() {
        navigator.clipboard.writeText(solution?.code || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
    return (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.82)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:10000, backdropFilter:"blur(6px)" }} onClick={onClose}>
            <div style={{ background:"#161a0d", border:"0.5px solid rgba(106,122,58,0.4)", borderRadius:12, width:"min(700px,94vw)", maxHeight:"88vh", display:"flex", flexDirection:"column", overflow:"hidden" }} onClick={e => e.stopPropagation()}>
                <div style={{ padding:"18px 24px", borderBottom:"0.5px solid rgba(106,122,58,0.2)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div>
                        <div style={{ fontSize:10, color:"#6B7A3A", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:4 }}>// my solution</div>
                        <div style={{ fontSize:15, color:"#F0EDE6", fontWeight:500 }}>{problem?.title}</div>
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                        <button onClick={copy} style={{ padding:"6px 14px", background: copied?"rgba(166,233,161,0.15)":"transparent", border:`0.5px solid ${copied?"rgba(166,233,161,0.4)":"rgba(106,122,58,0.4)"}`, borderRadius:6, color: copied?"#a6e3a1":"#6B7A3A", fontFamily:"DM Mono", fontSize:11, cursor:"pointer" }}>
                            {copied ? "✔ Copied" : "⎘ Copy"}
                        </button>
                        <button onClick={onClose} style={{ padding:"6px 12px", background:"none", border:"0.5px solid rgba(106,122,58,0.3)", borderRadius:6, color:"#6B7A3A", fontFamily:"DM Mono", fontSize:11, cursor:"pointer" }}>✕</button>
                    </div>
                </div>
                <div style={{ padding:"8px 16px", borderBottom:"0.5px solid rgba(106,122,58,0.1)", display:"flex", gap:12 }}>
                    <span style={{ fontSize:10, color:"#3A4A1E", textTransform:"uppercase", letterSpacing:"0.1em" }}>Language:</span>
                    <span style={{ fontSize:10, color:"#C8CFA8" }}>{solution?.language?.toUpperCase() || "—"}</span>
                </div>
                <pre style={{ flex:1, overflowY:"auto", margin:0, padding:20, fontFamily:"DM Mono, monospace", fontSize:12, lineHeight:1.8, color:"#e8e0d0", whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
                    {solution?.code || "// No solution saved"}
                </pre>
            </div>
        </div>
    );
}

function Problem() {
    const { user } = useAuth();
    const [problems, setProblems]         = useState([]);
    const [selected, setSelected]         = useState(null);
    const [lang, setLang]                 = useState("python");
    const [code, setCode]                 = useState(BOILERPLATES["python"]);
    const [output, setOutput]             = useState("");
    const [verdict, setVerdict]           = useState(null);
    const [isRunning, setIsRunning]       = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus]             = useState("idle");
    const [filter, setFilter]             = useState("All");
    const [search, setSearch]             = useState("");
    const [savedNotice, setSavedNotice]   = useState(false);
    const [submitResult, setSubmitResult] = useState(null);
    const [solvedSet, setSolvedSet]       = useState(new Set()); // tracked locally after load
    const [solutions, setSolutions]       = useState({}); // {problemId: {code, language}}
    const [viewSolution, setViewSolution] = useState(null);
   
    useEffect(() => {
        api.get("/problems")
            .then(res => setProblems(res.data))
            .catch(err => console.error(err));
        // Load user's solved problems which are already done , completed or not completed :3
        api.get("/api/user/profile")
            .then(res => {
                const ids = (res.data.solvedProblems || []).map(p => p.id || p);
                setSolvedSet(new Set(ids));
            })
            .catch(() => {});
        // Load saved solutions
        api.get("/api/user/solutions")
            .then(res => {
                const solMap = {};
                (res.data || []).forEach(s => { solMap[s.problemId] = { code: s.code, language: s.language }; });
                setSolutions(solMap);
            })
            .catch(() => {});
    }, []);

    const q = (search || "").trim().slice(0, 200);
    const filtered = problems.filter(p => {
        const matchDiff   = filter === "All" || p.difficulty === filter;
        const matchSearch = !q || p.title?.toLowerCase().includes(q.toLowerCase());
        return matchDiff && matchSearch;
    });

    const counts = {
        All:    problems.length,
        Easy:   problems.filter(p => p.difficulty === "Easy").length,
        Medium: problems.filter(p => p.difficulty === "Medium").length,
        Hard:   problems.filter(p => p.difficulty === "Hard").length,
    };

    function handleLangChange(e) {
        const chosen = e.target.value;
        setLang(chosen);
        setCode(BOILERPLATES[chosen]);
        setOutput(""); setVerdict(null); setStatus("idle"); setSubmitResult(null);
    }

    async function runCode() {
        if (!selected) return;
        setIsRunning(true); setStatus("running"); setOutput(""); setVerdict(null); setSavedNotice(false); setSubmitResult(null);
        try {
            const stdin = selected.testCases?.[0]?.input || "";
            const result = await judge0Run(code, LANGUAGE_IDS[lang], stdin);
            const out = result?.stdout || result?.stderr || result?.compile_output || result?.message || "No output";
            setOutput(out);
            if (result?.stderr || result?.compile_output) { setStatus("error"); setVerdict("error"); }
            else {
                const pass = normalize(out) === normalize(selected.testCases?.[0]?.output || "");
                setStatus(pass ? "success" : "fail"); setVerdict(pass ? "pass" : "fail");
            }
        } catch (err) { setOutput(`Error: ${err.message}`); setStatus("error"); setVerdict("error"); }
        finally { setIsRunning(false); }
    }

    async function submitCode() {
        if (!selected) return;
        const testCases = selected.testCases || [];
        if (!testCases.length) { setOutput("No test cases to check."); return; }
        setIsSubmitting(true); setStatus("running"); setOutput("Checking all test cases..."); setVerdict(null); setSavedNotice(false); setSubmitResult(null);
        let passed = 0;
        const details = [];
        try {
            for (let i = 0; i < testCases.length; i++) {
                const tc = testCases[i];
                const result = await judge0Run(code, LANGUAGE_IDS[lang], tc.input || "");
                const out = result?.stdout || "";
                const hasError = !!(result?.stderr || result?.compile_output);
                const pass = !hasError && normalize(out) === normalize(tc.output || "");
                if (pass) passed++;
                details.push({ index: i+1, pass, output: result?.stdout || result?.stderr || "No output", expected: tc.output, error: hasError });
            }
            const allPassed = passed === testCases.length;
            setSubmitResult({ passed, total: testCases.length, details });
            setVerdict(allPassed ? "pass" : "fail");
            setStatus(allPassed ? "success" : "fail");
            setOutput(`${passed}/${testCases.length} test cases passed`);
            if (allPassed) {
                setSolvedSet(prev => new Set([...prev, selected.id]));
                const sol = { code, language: lang };
                setSolutions(prev => ({ ...prev, [selected.id]: sol }));
                try {
                    await api.post("/api/user/submit-problem", { problemId: selected.id });
                    await api.post("/api/user/save-solution", { problemId: selected.id, code, language: lang });
                    setSavedNotice(true);
                } catch (e) { console.error("Failed to submit problem", e); }
            }
        } catch (err) { setOutput(`Submit error: ${err.message}`); setStatus("error"); setVerdict("error"); }
        finally { setIsSubmitting(false); }
    }

    function handleBack() {
        setSelected(null); setOutput(""); setVerdict(null); setStatus("idle");
        setSavedNotice(false); setSubmitResult(null); setCode(BOILERPLATES[lang]);
    }

    if (!selected) {
        return (
            <>
                <style>{STYLES}</style>
                <Navbar />
                <div className="prob-list-page">
                    <div className="prob-list-wrap">
                        <div className="prob-toolbar" style={{ marginTop:24 }}>
                            <p className="prob-list-heading">Problems</p>
                            <input className="prob-search" placeholder="Search problems..." value={search} maxLength={200} onChange={e => setSearch(e.target.value.slice(0, 200))} />
                            <div className="prob-filter-tabs">
                                {["All", "Easy", "Medium", "Hard"].map(f => (
                                    <button key={f} className={`prob-filter-tab ${filter === f ? `active-${f.toLowerCase()}` : ""}`} onClick={() => setFilter(f)}>
                                        {f}<span className="prob-count-pill">{counts[f]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="prob-stats">
                            {[
                                { label: "Total",  num: counts.All,    color: "#C8CFA8" },
                                { label: "Easy",   num: counts.Easy,   color: "#a6e3a1" },
                                { label: "Medium", num: counts.Medium, color: "#f0c674" },
                                { label: "Hard",   num: counts.Hard,   color: "#c97a6a" },
                                { label: "Solved", num: solvedSet.size, color: "#a6e3a1" },
                            ].map(s => (
                                <div key={s.label} className="prob-stat-card">
                                    <div className="prob-stat-num" style={{ color: s.color }}>{s.num}</div>
                                    <div className="prob-stat-label">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        {viewSolution && (
                            <SolutionModal problem={viewSolution.problem} solution={viewSolution.solution} onClose={() => setViewSolution(null)} />
                        )}

                        {filtered.length === 0
                            ? <div className="prob-empty">// no problems found</div>
                            : filtered.map((p, index) => {
                                const isSolved = solvedSet.has(p.id);
                                return (
                                    <div key={index} className="prob-card" onClick={() => { setSelected(p); setOutput(""); setVerdict(null); setSubmitResult(null); setCode(BOILERPLATES[lang]); }}>
                                        <div className="prob-card-left">
                                            <span className="prob-index">{index + 1}.</span>
                                            <span className="prob-title">{p.title}</span>
                                            {p.tags?.length > 0 && (
                                                <div className="prob-tags">
                                                    {p.tags.slice(0, 2).map((t, i) => <span key={i} className="prob-tag">{t}</span>)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="prob-card-right">
                                            {/* Solved status */}
                                            {isSolved ? (
                                                <span style={{ fontSize:11, color:"#a6e3a1", display:"flex", alignItems:"center", gap:4 }}>
                                                    <span>✔</span>
                                                    <span style={{ fontSize:10, opacity:0.8 }}>Solved</span>
                                                </span>
                                            ) : (
                                                <span style={{ fontSize:10, color:"#3A4A1E" }}>Not Solved</span>
                                            )}
                                            <span className={`prob-badge ${ p.difficulty === "Easy" ? "badge-easy" : p.difficulty === "Hard" ? "badge-hard" : "badge-medium" }`}>
                                                {p.difficulty}
                                            </span>
                                            {/* View solution button if solved */}
                                            {isSolved && solutions[p.id] && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); setViewSolution({ problem: p, solution: solutions[p.id] }); }}
                                                    style={{ padding:"3px 10px", background:"rgba(166,233,161,0.08)", border:"0.5px solid rgba(166,233,161,0.3)", borderRadius:4, color:"#a6e3a1", fontFamily:"DM Mono", fontSize:10, cursor:"pointer" }}>
                                                    My Solution
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </>
        );
    }

    // ── Problem detail view ──
    const isSolved = solvedSet.has(selected.id);
    return (
        <>
            <style>{STYLES}</style>
            <Navbar />
            {viewSolution && (
                <SolutionModal problem={viewSolution.problem} solution={viewSolution.solution} onClose={() => setViewSolution(null)} />
            )}
            <div className="prob-detail-page">
                <div className="prob-left">
                    <button className="prob-back-btn" onClick={handleBack}>← Back</button>
                    <h2 className="prob-detail-title">{selected.title}</h2>
                    <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
                        <span className={`prob-detail-badge ${ selected.difficulty === "Easy" ? "badge-easy" : selected.difficulty === "Hard" ? "badge-hard" : "badge-medium" }`}>
                            {selected.difficulty}
                        </span>
                        {isSolved ? (
                            <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, padding:"3px 12px", borderRadius:20, color:"#a6e3a1", background:"rgba(166,233,161,0.08)", border:"0.5px solid rgba(166,233,161,0.3)" }}>
                                ✔ Solved
                            </span>
                        ) : (
                            <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, padding:"3px 12px", borderRadius:20, color:"#c97a6a", background:"rgba(201,122,106,0.06)", border:"0.5px solid rgba(201,122,106,0.2)" }}>
                                ✘ Not Solved
                            </span>
                        )}
                        {isSolved && solutions[selected.id] && (
                            <button
                                onClick={() => setViewSolution({ problem: selected, solution: solutions[selected.id] })}
                                style={{ padding:"3px 12px", background:"rgba(166,233,161,0.07)", border:"0.5px solid rgba(166,233,161,0.25)", borderRadius:20, color:"#a6e3a1", fontFamily:"DM Mono", fontSize:11, cursor:"pointer" }}>
                                View My Solution
                            </button>
                        )}
                    </div>
                    <p className="prob-description">{selected.description}</p>
                    {selected.constraints?.length > 0 && (
                        <>
                            <p className="prob-section-title">Constraints</p>
                            <ul className="prob-constraints">
                                {selected.constraints.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </>
                    )}
                    {selected.testCases?.length > 0 && (
                        <>
                            <p className="prob-section-title">Sample Test Cases</p>
                            {selected.testCases.slice(0, 2).map((tc, i) => (
                                <div key={i} className="prob-tc-card">
                                    <div className="prob-tc-label">Input</div>
                                    <div className="prob-tc-value">{tc.input}</div>
                                    <div className="prob-tc-label" style={{ marginTop: "8px" }}>Expected Output</div>
                                    <div className="prob-tc-value">{tc.output}</div>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                <div className="prob-right">
                    <div className="prob-editor-topbar">
                        <select className="prob-lang-select" value={lang} onChange={handleLangChange}>
                            {Object.entries(LANG_META).map(([id, meta]) => <option key={id} value={id}>{meta.label}</option>)}
                        </select>
                        <button className="prob-run-btn" onClick={runCode} disabled={isRunning || isSubmitting}>
                            {isRunning ? <><div className="prob-spinner" /> Running</> : <><span>▶</span> Run</>}
                        </button>
                        <button className="prob-submit-btn" onClick={isSolved ? undefined : submitCode} disabled={isRunning || isSubmitting || isSolved}
                            style={{ opacity: isSolved ? 0.6 : 1, cursor: isSolved ? "default" : "pointer" }}>
                            {isSubmitting ? <><div className="prob-spinner" style={{ borderTopColor: "#111409" }} /> Submitting</>
                            : isSolved ? "✔ Already Solved"
                            : <>↑ Submit</>}
                        </button>
                    </div>

                    <textarea className="prob-code-area" value={code} onChange={e => setCode(e.target.value)} spellCheck={false} autoComplete="off" />

                    <div className="prob-output-panel">
                        <div className="prob-output-header">
                            <div className="prob-output-dot" style={{ background: status === "error" ? "#c97a6a" : status === "success" ? "#a6e3a1" : status === "fail" ? "#c97a6a" : "#6B7A3A" }} />
                            {isSubmitting ? "Judging all test cases..." : "stdout"}
                            {output && !isSubmitting && (
                                <span style={{ marginLeft: "auto", color: status === "error" || status === "fail" ? "#c97a6a" : "#a6e3a1" }}>
                                    {status === "error" ? "✗ error" : status === "success" ? "✓ accepted" : "✗ wrong answer"}
                                </span>
                            )}
                        </div>
                        {verdict && !isSubmitting && (
                            <div className={`prob-verdict ${ verdict === "pass" ? "verdict-pass" : verdict === "error" ? "verdict-error" : "verdict-fail" }`}>
                                {verdict === "pass" ? "✔ All test cases passed!" : verdict === "error" ? "✘ Compilation / Runtime Error" : "✘ Some test cases failed"}
                                {savedNotice && verdict === "pass" && (
                                    <span style={{ marginLeft: "auto", fontSize: 10, color: "#a6e3a1", opacity: 0.7 }}>solved — profile updated ✓</span>
                                )}
                            </div>
                        )}
                        {submitResult && (
                            <div style={{ padding: "8px 16px", overflowY: "auto", maxHeight: 130 }}>
                                {submitResult.details.map((d, i) => (
                                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", borderBottom: "0.5px solid rgba(106,122,58,0.1)", fontSize: 11 }}>
                                        <span style={{ color: d.pass ? "#a6e3a1" : "#c97a6a", minWidth: 14 }}>{d.pass ? "✔" : "✘"}</span>
                                        <span style={{ color: "#6B7A3A" }}>TC {d.index}</span>
                                        {!d.pass && !d.error && <span style={{ color: "#4a5a28", fontSize: 10 }}>got: {String(d.output).slice(0, 30)}</span>}
                                        {d.error && <span style={{ color: "#c97a6a", fontSize: 10 }}>runtime error</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                        {!submitResult && (
                            <div className="prob-output-text" style={{ color: status === "error" ? "#c97a6a" : status === "success" ? "#a6e3a1" : "rgba(240,237,230,0.6)" }}>
                                {output || "// output appears here after Run or Submit..."}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

export default Problem;

const STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&display=swap');
    .prob-list-page { min-height: 100vh; background: #111409; padding: 32px 24px; font-family: 'DM Mono', monospace; }
    .prob-list-wrap { max-width: 760px; margin: 0 auto; }
    .prob-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    .prob-list-heading { font-size: 18px; font-weight: 500; color: #C8CFA8; letter-spacing: 0.08em; text-transform: uppercase; margin-right: auto; }
    .prob-search { padding: 7px 14px; background: #161a0d; border: 0.5px solid rgba(106,122,58,0.4); border-radius: 6px; color: #C8CFA8; font-family: 'DM Mono', monospace; font-size: 12px; outline: none; width: 200px; transition: border-color 0.18s; }
    .prob-search::placeholder { color: #3A4A1E; }
    .prob-search:focus { border-color: #C8CFA8; }
    .prob-filter-tabs { display: flex; gap: 4px; }
    .prob-filter-tab { display: flex; align-items: center; gap: 6px; padding: 6px 14px; background: transparent; border: 0.5px solid rgba(106,122,58,0.3); border-radius: 6px; color: #6B7A3A; font-family: 'DM Mono', monospace; font-size: 11px; cursor: pointer; transition: all 0.18s; letter-spacing: 0.05em; }
    .prob-filter-tab:hover { border-color: #C8CFA8; color: #C8CFA8; }
    .prob-filter-tab.active-all    { background: rgba(200,207,168,0.1); color: #C8CFA8; border-color: #C8CFA8; }
    .prob-filter-tab.active-easy   { background: rgba(166,233,161,0.1); color: #a6e3a1; border-color: #a6e3a1; }
    .prob-filter-tab.active-medium { background: rgba(240,198,116,0.1); color: #f0c674; border-color: #f0c674; }
    .prob-filter-tab.active-hard   { background: rgba(201,122,106,0.1); color: #c97a6a; border-color: #c97a6a; }
    .prob-count-pill { font-size: 10px; padding: 1px 6px; border-radius: 10px; background: rgba(255,255,255,0.07); }
    .prob-stats { display: flex; gap: 12px; margin-bottom: 20px; }
    .prob-stat-card { flex: 1; padding: 12px 16px; background: #161a0d; border: 0.5px solid rgba(106,122,58,0.2); border-radius: 8px; text-align: center; }
    .prob-stat-num  { font-size: 22px; font-weight: 500; color: #C8CFA8; }
    .prob-stat-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #3A4A1E; margin-top: 2px; }
    .prob-card { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; margin-bottom: 10px; background: #161a0d; border: 0.5px solid rgba(106,122,58,0.3); border-radius: 8px; cursor: pointer; transition: background 0.18s, border-color 0.18s, transform 0.15s; }
    .prob-card:hover { background: #1c2210; border-color: rgba(200,207,168,0.4); transform: translateX(4px); }
    .prob-card-left { display: flex; align-items: center; gap: 16px; flex:1; }
    .prob-index { font-size: 12px; color: #3A4A1E; min-width: 28px; }
    .prob-title { font-size: 14px; color: #F0EDE6; }
    .prob-card-right { display: flex; align-items: center; gap: 10px; flex-shrink:0; }
    .prob-tags { display: flex; gap: 6px; }
    .prob-tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(58,74,30,0.5); color: #6B7A3A; }
    .prob-badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 500; letter-spacing: 0.05em; }
    .badge-easy   { background: rgba(166,233,161,0.12); color: #a6e3a1; }
    .badge-medium { background: rgba(240,198,116,0.12); color: #f0c674; }
    .badge-hard   { background: rgba(201,122,106,0.12); color: #c97a6a; }
    .prob-empty { text-align: center; padding: 48px 0; color: #3A4A1E; font-size: 13px; }
    .prob-detail-page { display: flex; height: calc(100vh - 60px); background: #111409; font-family: 'DM Mono', monospace; overflow: hidden; }
    .prob-left { width: 50%; overflow-y: auto; padding: 24px 28px; border-right: 1px solid rgba(106,122,58,0.25); background: #111409; }
    .prob-left::-webkit-scrollbar { width: 5px; }
    .prob-left::-webkit-scrollbar-thumb { background: #2a3516; border-radius: 3px; }
    .prob-back-btn { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 20px; padding: 6px 14px; background: transparent; border: 0.5px solid rgba(106,122,58,0.4); border-radius: 6px; color: #6B7A3A; font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; transition: all 0.18s; }
    .prob-back-btn:hover { background: rgba(106,122,58,0.1); color: #C8CFA8; border-color: #C8CFA8; }
    .prob-detail-title  { font-size: 20px; font-weight: 500; color: #F0EDE6; margin-bottom: 8px; }
    .prob-detail-badge  { display: inline-block; font-size: 11px; padding: 3px 12px; border-radius: 20px; font-weight: 500; letter-spacing: 0.05em; }
    .prob-description   { font-size: 13px; color: rgba(240,237,230,0.75); line-height: 1.8; margin-bottom: 24px; }
    .prob-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #6B7A3A; margin-bottom: 10px; margin-top: 20px; }
    .prob-constraints   { padding-left: 16px; margin: 0; }
    .prob-constraints li { font-size: 13px; color: rgba(240,237,230,0.6); line-height: 1.8; }
    .prob-tc-card   { background: #161a0d; border: 0.5px solid rgba(106,122,58,0.25); border-radius: 8px; padding: 14px 16px; margin-bottom: 10px; }
    .prob-tc-label  { color: #6B7A3A; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .prob-tc-value  { color: #C8CFA8; font-family: 'DM Mono', monospace; font-size: 13px; }
    .prob-right { width: 50%; display: flex; flex-direction: column; background: #0f1107; overflow: hidden; }
    .prob-editor-topbar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #161a0d; border-bottom: 1px solid rgba(106,122,58,0.25); }
    .prob-lang-select { padding: 6px 12px; background: #1c2210; border: 0.5px solid rgba(106,122,58,0.4); border-radius: 6px; color: #C8CFA8; font-family: 'DM Mono', monospace; font-size: 12px; cursor: pointer; outline: none; }
    .prob-run-btn { margin-left: auto; display: flex; align-items: center; gap: 8px; padding: 7px 18px; background: transparent; border: 1px solid #6B7A3A; border-radius: 6px; color: #C8CFA8; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
    .prob-run-btn:hover:not(:disabled) { background: rgba(106,122,58,0.2); }
    .prob-run-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .prob-submit-btn { display: flex; align-items: center; gap: 8px; padding: 7px 20px; background: #3A4A1E; border: 1px solid #6B7A3A; border-radius: 6px; color: #C8CFA8; font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
    .prob-submit-btn:hover:not(:disabled) { background: #6B7A3A; color: #111409; }
    .prob-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .prob-spinner { width: 11px; height: 11px; border: 2px solid rgba(200,207,168,0.3); border-top-color: #C8CFA8; border-radius: 50%; animation: probspin 0.7s linear infinite; }
    @keyframes probspin { to { transform: rotate(360deg); } }
    .prob-code-area { flex: 1; padding: 16px; background: transparent; border: none; resize: none; font-family: 'DM Mono', monospace; font-size: 13px; line-height: 1.7; color: #e8e0d0; caret-color: #C8CFA8; outline: none; tab-size: 4; min-height: 0; }
    .prob-output-panel { border-top: 1px solid rgba(106,122,58,0.25); background: #111409; display: flex; flex-direction: column; max-height: 240px; }
    .prob-output-header { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-bottom: 1px solid rgba(106,122,58,0.2); font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; color: #6B7A3A; }
    .prob-output-dot { width: 5px; height: 5px; border-radius: 50%; }
    .prob-output-text { flex: 1; padding: 12px 16px; font-family: 'DM Mono', monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; overflow-y: auto; }
    .prob-verdict { margin: 0 16px 8px; padding: 10px 16px; border-radius: 6px; font-size: 12px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
    .verdict-pass  { background: rgba(166,233,161,0.1); color: #a6e3a1; border: 0.5px solid rgba(166,233,161,0.3); }
    .verdict-fail  { background: rgba(201,122,106,0.1); color: #c97a6a; border: 0.5px solid rgba(201,122,106,0.3); }
    .verdict-error { background: rgba(240,198,116,0.1); color: #f0c674; border: 0.5px solid rgba(240,198,116,0.3); }
`;