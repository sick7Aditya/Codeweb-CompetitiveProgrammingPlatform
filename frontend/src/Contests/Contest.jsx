import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../ConnectingBackend/axios";
import Navbar from "../Pages/Navbar";
import { useAuth } from "../Pages/AuthContext";

const diffStyle = {
    Easy:   { color: "#a6e3a1", bg: "rgba(166,233,161,0.08)", border: "rgba(166,233,161,0.25)" },
    Medium: { color: "#f0c674", bg: "rgba(240,198,116,0.08)", border: "rgba(240,198,116,0.25)" },
    Hard:   { color: "#c97a6a", bg: "rgba(201,122,106,0.08)", border: "rgba(201,122,106,0.25)" },
    Mixed:  { color: "#89dceb", bg: "rgba(137,220,235,0.08)", border: "rgba(137,220,235,0.25)" },
};

function parseTime(t) { if (!t) return 0; return new Date(t.endsWith("Z") ? t : t + "Z").getTime(); }
function isLive(c)     { const n = Date.now(); return n >= parseTime(c.startTime) && n < parseTime(c.endTime); }
function isPast(c)     { return Date.now() >= parseTime(c.endTime); }
function isUpcoming(c) { return Date.now() < parseTime(c.startTime); }
function formatDate(t) {
    if (!t) return "N/A";
    return new Date(t.endsWith("Z") ? t : t + "Z").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

/** Per-user localStorage keys so one account's contest progress does not apply to another on the same browser. */
function contestUserSuffix(user) {
    if (!user) return "_anon";
    const id = user.sub ?? user.email ?? user.id ?? user.name;
    return id ? encodeURIComponent(String(id)) : "_anon";
}

function readLocalCompleted(suf) {
    try {
        return JSON.parse(localStorage.getItem(`cw_completed_${suf}`) || "{}");
    } catch {
        return {};
    }
}

/** Build completed map from profile.contestsAttended (server source of truth per account). */
function completedMapFromProfile(contestsAttended) {
    const map = {};
    for (const c of contestsAttended || []) {
        if (c?.contestId != null) map[c.contestId] = true;
    }
    return map;
}

function Countdown({ startTime, endTime }) {
    const [timeLeft, setTimeLeft] = useState("");
    const [phase, setPhase]       = useState("");
    function fmt(ms) { const h=Math.floor(ms/3600000),m=Math.floor((ms%3600000)/60000),s=Math.floor((ms%60000)/1000); return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`; }
    useEffect(() => {
        function calc() {
            const now=Date.now(),start=parseTime(startTime),end=parseTime(endTime);
            if(now<start){setPhase("starts_in");setTimeLeft(fmt(start-now));}
            else if(now>=start&&now<end){setPhase("ends_in");setTimeLeft(fmt(end-now));}
            else{setPhase("ended");setTimeLeft("Ended");}
        }
        calc(); const t=setInterval(calc,1000); return ()=>clearInterval(t);
    }, [startTime, endTime]);
    const color=phase==="ends_in"?"#f0c674":phase==="starts_in"?"#C8CFA8":"#3A4A1E";
    return (
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
            <span style={{fontSize:10,color:"#3A4A1E",letterSpacing:"0.1em",textTransform:"uppercase"}}>{phase==="starts_in"?"starts in":phase==="ends_in"?"ends in":""}</span>
            <span style={{fontSize:16,fontWeight:500,color,letterSpacing:"0.05em",fontVariantNumeric:"tabular-nums"}}>{timeLeft}</span>
        </div>
    );
}

function LeaderboardModal({ contest, onClose }) {
    const lb=contest.leaderboard||[];
    const medals=["🥇","🥈","🥉"];
    return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)"}} onClick={onClose}>
            <div style={{background:"#161a0d",border:"0.5px solid rgba(106,122,58,0.4)",borderRadius:12,padding:32,width:"min(560px,90vw)",maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                    <div>
                        <div style={{fontSize:10,color:"#6B7A3A",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:6}}>// final results</div>
                        <div style={{fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:800,color:"#F0EDE6",letterSpacing:"-0.5px"}}>{contest.name}</div>
                    </div>
                    <button onClick={onClose} style={{background:"none",border:"0.5px solid rgba(106,122,58,0.3)",borderRadius:6,color:"#6B7A3A",padding:"6px 12px",fontFamily:"DM Mono,monospace",fontSize:11,cursor:"pointer"}}>✕ Close</button>
                </div>
                {lb.length===0?(
                    <div style={{textAlign:"center",padding:"40px 0",color:"#3A4A1E",fontSize:13}}><div style={{fontSize:32,marginBottom:12,opacity:0.3}}>◎</div>// no leaderboard data yet</div>
                ):(
                    <div style={{overflowY:"auto"}}>
                        <div style={{display:"grid",gridTemplateColumns:"40px 1fr 80px 80px 80px",padding:"8px 16px",fontSize:10,color:"#3A4A1E",textTransform:"uppercase",letterSpacing:"0.12em",borderBottom:"0.5px solid rgba(106,122,58,0.2)"}}>
                            <span>#</span><span>Name</span><span style={{textAlign:"right"}}>Solved</span><span style={{textAlign:"right"}}>Score</span><span style={{textAlign:"right"}}>Rank</span>
                        </div>
                        {[...lb].sort((a,b)=>a.rank-b.rank).map((entry,i)=>(
                            <div key={i} style={{display:"grid",gridTemplateColumns:"40px 1fr 80px 80px 80px",padding:"14px 16px",alignItems:"center",borderBottom:"0.5px solid rgba(106,122,58,0.1)",background:i===0?"rgba(240,198,116,0.05)":"transparent"}}>
                                <span style={{fontSize:16}}>{medals[i]||`${i+1}`}</span>
                                <span style={{fontSize:13,color:i<3?"#F0EDE6":"rgba(240,237,230,0.7)"}}>{entry.name||entry.user}</span>
                                <span style={{fontSize:12,color:"#6B7A3A",textAlign:"right"}}>{entry.solvedCount??"—"}</span>
                                <span style={{fontSize:13,color:"#a6e3a1",textAlign:"right",fontWeight:500}}>{entry.score}</span>
                                <span style={{fontSize:13,color:"#C8CFA8",textAlign:"right"}}>#{entry.rank}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const API_KEY  = import.meta.env.VITE_JUDGE0_API_KEY || 'cf19efabb9mshf0671ae1433f882p1fb0b2jsnff89ecebebb6';
const API_HOST = import.meta.env.VITE_JUDGE0_API_HOST || 'judge029.p.rapidapi.com';
const LANGUAGE_IDS = { python:71,java:62, cpp:54, c:50 };
const BOILERPLATES = {
    python: `# your code here\n`,
    java:   `public class Main {\n    public static void main(String[] args) {\n        // your code here\n    }\n}`,
    cpp:    `#include <iostream>\nusing namespace std;\nint main() {\n    // your code here\n    return 0;\n}`,
    c:      `#include <stdio.h>\nint main() {\n    // your code here\n    return 0;\n}`,
};
const LANG_META = {
    python: { label:"Python", color:"#a8c97f" },
    java:   { label:"Java",   color:"#f0c674" },
    cpp:    { label:"C++",    color:"#C8CFA8" },
    c:      { label:"C",      color:"#89b4fa" },
};

function normalize(str) { return str?.trim().replace(/\r\n/g,"\n").replace(/\s+$/,"").toLowerCase(); }

async function judge0Run(code, langId, stdin) {
    const submitRes = await fetch(`https://${API_HOST}/submissions?base64_encoded=false&wait=false`,{
        method:"POST",
        headers:{"Content-Type":"application/json","X-RapidAPI-Key":API_KEY,"X-RapidAPI-Host":API_HOST},
        body:JSON.stringify({source_code:code,language_id:langId,stdin}),
    });
    const {token}=await submitRes.json();
    if(!token) throw new Error("No token");
    let result=null;
    for(let i=0;i<12;i++){
        await new Promise(r=>setTimeout(r,1000));
        const pollRes=await fetch(`https://${API_HOST}/submissions/${token}?base64_encoded=false`,{headers:{"X-RapidAPI-Key":API_KEY,"X-RapidAPI-Host":API_HOST}});
        result=await pollRes.json();
        if(result.status?.id>2) break;
    }
    return result;
}

function SolutionModal({ solution, onClose }) {
    const [copied, setCopied] = useState(false);
    function copy() { navigator.clipboard.writeText(solution.code||"").then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}); }
    return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10000,backdropFilter:"blur(4px)"}} onClick={onClose}>
            <div style={{background:"#161a0d",border:"0.5px solid rgba(106,122,58,0.4)",borderRadius:12,padding:28,width:"min(640px,92vw)",maxHeight:"80vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                    <div>
                        <div style={{fontSize:10,color:"#6B7A3A",letterSpacing:"0.15em",textTransform:"uppercase",marginBottom:4}}>// my solution</div>
                        <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:"#F0EDE6"}}>{solution.problemTitle}</div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                        <button onClick={copy} style={{padding:"6px 14px",background:copied?"rgba(166,233,161,0.1)":"rgba(106,122,58,0.1)",border:`0.5px solid ${copied?"rgba(166,233,161,0.4)":"rgba(106,122,58,0.3)"}`,borderRadius:6,color:copied?"#a6e3a1":"#6B7A3A",fontFamily:"DM Mono",fontSize:11,cursor:"pointer"}}>{copied?"✔ Copied":"⎘ Copy"}</button>
                        <button onClick={onClose} style={{background:"none",border:"0.5px solid rgba(106,122,58,0.3)",borderRadius:6,color:"#6B7A3A",padding:"6px 12px",fontFamily:"DM Mono",fontSize:11,cursor:"pointer"}}>✕</button>
                    </div>
                </div>
                <div style={{fontSize:11,color:"#3A4A1E",marginBottom:12}}>Language: <span style={{color:"#C8CFA8"}}>{solution.language?.toUpperCase()||"—"}</span></div>
                <div style={{flex:1,overflowY:"auto",background:"#111409",border:"0.5px solid rgba(106,122,58,0.2)",borderRadius:8,padding:16}}>
                    <pre style={{margin:0,fontFamily:"DM Mono,monospace",fontSize:12,lineHeight:1.7,color:"#e8e0d0",whiteSpace:"pre-wrap",wordBreak:"break-all"}}>{solution.code||"// No solution code stored"}</pre>
                </div>
            </div>
        </div>
    );
}

function ContestArena({ contest, onExit, markCompleted }) {
    const [problems, setProblems]         = useState([]);
    const [selected, setSelected]         = useState(null);
    const [loading, setLoading]           = useState(true);
    const [code, setCode]                 = useState("");
    const [lang, setLang]                 = useState("python");
    const [output, setOutput]             = useState("");
    const [verdict, setVerdict]           = useState(null);
    const [isRunning, setIsRunning]       = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft]         = useState("");
    const [solvedSet, setSolvedSet]       = useState(new Set());
    const [submitResult, setSubmitResult] = useState(null);
    const [contestSubmitted, setContestSubmitted] = useState(false);
    const [submitModal, setSubmitModal]   = useState(false);
    const [submittingContest, setSubmittingContest] = useState(false);
    const [solutions, setSolutions]       = useState({});
    const [viewSolution, setViewSolution] = useState(null);

    useEffect(()=>{
        api.get(`/api/contests/${contest.id}/problems`).then(res=>setProblems(res.data)).catch(console.error).finally(()=>setLoading(false));
    },[]);

    useEffect(()=>{
        function calc(){
            const diff=parseTime(contest.endTime)-Date.now();
            if(diff<=0){setTimeLeft("00:00:00");return;}
            const h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
            setTimeLeft(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`);
        }
        calc(); const t=setInterval(calc,1000); return ()=>clearInterval(t);
    },[]);

    async function runCode(){
        if(!selected) return;
        setIsRunning(true);setOutput("");setVerdict(null);setSubmitResult(null);
        try{
            const result=await judge0Run(code,LANGUAGE_IDS[lang],selected.testCases?.[0]?.input||"");
            const out=result?.stdout||result?.stderr||result?.compile_output||"No output";
            setOutput(out);
            if(result?.stderr||result?.compile_output) setVerdict("error");
            else if(normalize(out)===normalize(selected.testCases?.[0]?.output||"")) setVerdict("pass");
            else setVerdict("fail");
        }catch(err){setOutput(`Error: ${err.message}`);setVerdict("error");}
        finally{setIsRunning(false);}
    }

    async function submitProblem(){
        if(!selected) return;
        const testCases=selected.testCases||[];
        if(testCases.length===0) return;
        setIsSubmitting(true);setOutput("Checking all test cases...");setVerdict(null);setSubmitResult(null);
        let passed=0;const details=[];
        try{
            for(let i=0;i<testCases.length;i++){
                const tc=testCases[i];
                const result=await judge0Run(code,LANGUAGE_IDS[lang],tc.input||"");
                const out=result?.stdout||"";
                const hasError=!!(result?.stderr||result?.compile_output);
                const pass=!hasError&&normalize(out)===normalize(tc.output||"");
                if(pass) passed++;
                details.push({index:i+1,pass,output:out||result?.stderr||"No output",error:hasError});
            }
            const allPassed=passed===testCases.length;
            setSubmitResult({passed,total:testCases.length,details});
            setVerdict(allPassed?"pass":"fail");
            setOutput(`${passed}/${testCases.length} test cases passed`);
            if(allPassed&&!solvedSet.has(selected.id)){
                setSolvedSet(prev=>new Set([...prev,selected.id]));
                setSolutions(prev=>({...prev,[selected.id]:{code,language:lang,problemTitle:selected.title}}));
                try{await api.post("/api/user/solve",{problemId:selected.id});}catch{}
                try{await api.post("/api/user/save-solution",{problemId:selected.id,code,language:lang,contestId:contest.id});}catch{}
            }
        }catch(err){setOutput(`Error: ${err.message}`);setVerdict("error");}
        finally{setIsSubmitting(false);}
    }

    async function handleFinalSubmit(){
        if(contestSubmitted) return;
        setSubmittingContest(true);
        try{
            await api.post("/api/user/submit-contest",{contestId:contest.id,solvedCount:solvedSet.size});
            setContestSubmitted(true);
            setSubmitModal(false);
            markCompleted(contest.id);
            setTimeout(()=>onExit(),1200);
        }catch(err){console.error("Contest submit failed",err);}
        finally{setSubmittingContest(false);}
    }

    return (
        <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#111409",fontFamily:"DM Mono,monospace",color:"#F0EDE6"}}>
            {viewSolution&&<SolutionModal solution={viewSolution} onClose={()=>setViewSolution(null)}/>}

            {submitModal&&(
                <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)"}}>
                    <div style={{background:"#161a0d",border:"0.5px solid rgba(200,207,168,0.3)",borderRadius:12,padding:32,width:"min(420px,90vw)"}}>
                        <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:"#F0EDE6",marginBottom:12}}>Submit Contest?</div>
                        <div style={{fontSize:13,color:"#6B7A3A",lineHeight:1.8,marginBottom:20}}>
                            You've solved <span style={{color:"#a6e3a1",fontWeight:600}}>{solvedSet.size}</span> of {problems.length} problems.<br/>
                            Rating change: <span style={{color:solvedSet.size>0?"#a6e3a1":"#c97a6a"}}>{solvedSet.size>0?`+${solvedSet.size*20}`:"-10"}</span><br/><br/>
                            <span style={{color:"#c97a6a"}}>⚠ You will exit the contest. This cannot be undone.</span>
                        </div>
                        <div style={{display:"flex",gap:12}}>
                            <button onClick={()=>setSubmitModal(false)} style={{flex:1,padding:10,background:"transparent",border:"0.5px solid rgba(106,122,58,0.4)",borderRadius:7,color:"#6B7A3A",fontFamily:"DM Mono",fontSize:12,cursor:"pointer"}}>Cancel</button>
                            <button onClick={handleFinalSubmit} disabled={submittingContest} style={{flex:1,padding:10,background:"#3A4A1E",border:"1px solid #6B7A3A",borderRadius:7,color:"#C8CFA8",fontFamily:"DM Mono",fontSize:12,cursor:"pointer"}}>
                                {submittingContest?"Submitting...":"Confirm Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Topbar */}
            <div style={{display:"flex",alignItems:"center",padding:"0 24px",height:48,background:"#161a0d",borderBottom:"1px solid rgba(106,122,58,0.25)",gap:16,flexShrink:0}}>
                <button onClick={onExit} style={{background:"none",border:"0.5px solid rgba(106,122,58,0.4)",borderRadius:6,color:"#6B7A3A",padding:"5px 12px",fontFamily:"DM Mono",fontSize:11,cursor:"pointer",letterSpacing:"0.08em"}}>← Exit</button>
                <span style={{fontSize:13,color:"#C8CFA8",fontWeight:500}}>{contest.name}</span>
                <div style={{fontSize:11,color:"#3A4A1E"}}>{solvedSet.size}/{problems.length} solved</div>
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:11,color:"#3A4A1E",letterSpacing:"0.1em",textTransform:"uppercase"}}>time left</span>
                    <span style={{fontSize:16,color:"#f0c674",fontWeight:500,fontVariantNumeric:"tabular-nums"}}>{timeLeft}</span>
                    {contestSubmitted?(
                        <span style={{padding:"6px 16px",background:"rgba(166,233,161,0.1)",border:"1px solid rgba(166,233,161,0.3)",borderRadius:6,color:"#a6e3a1",fontSize:11,letterSpacing:"0.08em"}}>✔ Submitted — Exiting...</span>
                    ):(
                        <button onClick={()=>setSubmitModal(true)} style={{padding:"6px 16px",background:"#C8CFA8",border:"none",borderRadius:6,color:"#111409",fontFamily:"DM Mono",fontSize:11,fontWeight:600,letterSpacing:"0.08em",cursor:"pointer",textTransform:"uppercase"}}>Submit Contest</button>
                    )}
                </div>
            </div>

            <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>
                {/* Sidebar */}
                <div style={{width:230,borderRight:"1px solid rgba(106,122,58,0.2)",background:"#0f1107",display:"flex",flexDirection:"column",overflow:"hidden auto",flexShrink:0}}>
                    <div style={{padding:"12px 16px",borderBottom:"1px solid rgba(106,122,58,0.2)",fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:"#6B7A3A",flexShrink:0}}>Problems</div>
                    {loading?<div style={{padding:20,fontSize:12,color:"#3A4A1E"}}>Loading...</div>
                    :problems.length===0?<div style={{padding:20,fontSize:12,color:"#3A4A1E"}}>// no problems found</div>
                    :problems.map((p,i)=>{
                        const d=diffStyle[p.difficulty];
                        const solved=solvedSet.has(p.id);
                        return(
                            <div key={i}>
                                <div onClick={()=>{setSelected(p);setCode(BOILERPLATES[lang]);setOutput("");setVerdict(null);setSubmitResult(null);}}
                                    style={{padding:"14px 16px",cursor:"pointer",borderBottom:"0.5px solid rgba(106,122,58,0.1)",background:selected?.id===p.id?"#1c2210":"transparent",borderLeft:selected?.id===p.id?"2px solid #C8CFA8":"2px solid transparent",transition:"all 0.15s"}}>
                                    <div style={{fontSize:11,color:"#3A4A1E",marginBottom:4,display:"flex",justifyContent:"space-between"}}>
                                        <span>P{i+1}</span>{solved&&<span style={{color:"#a6e3a1"}}>✔</span>}
                                    </div>
                                    <div style={{fontSize:12,color:selected?.id===p.id?"#C8CFA8":"#F0EDE6"}}>{p.title}</div>
                                    {d&&<span style={{display:"inline-block",marginTop:6,fontSize:10,padding:"2px 8px",borderRadius:20,color:d.color,background:d.bg,border:`0.5px solid ${d.border}`}}>{p.difficulty}</span>}
                                </div>
                                {solved&&solutions[p.id]&&(
                                    <div onClick={()=>setViewSolution(solutions[p.id])} style={{padding:"6px 16px 10px",cursor:"pointer",borderBottom:"0.5px solid rgba(106,122,58,0.1)",background:"rgba(106,122,58,0.04)"}}>
                                        <span style={{fontSize:10,color:"#6B7A3A",letterSpacing:"0.06em",textDecoration:"underline"}}>⎘ view my solution</span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {selected?(
                    <div style={{display:"flex",flex:1,overflow:"hidden",minHeight:0}}>
                        <div style={{width:"40%",overflowY:"auto",padding:24,borderRight:"1px solid rgba(106,122,58,0.2)",background:"#111409"}}>
                            <h2 style={{fontSize:18,fontWeight:500,color:"#F0EDE6",marginBottom:8}}>{selected.title}</h2>
                            {diffStyle[selected.difficulty]&&<span style={{display:"inline-block",fontSize:10,padding:"3px 10px",borderRadius:20,marginBottom:16,color:diffStyle[selected.difficulty].color,background:diffStyle[selected.difficulty].bg,border:`0.5px solid ${diffStyle[selected.difficulty].border}`}}>{selected.difficulty}</span>}
                            <p style={{fontSize:13,color:"rgba(240,237,230,0.7)",lineHeight:1.8,marginBottom:20}}>{selected.description}</p>
                            {selected.constraints?.length>0&&(<><p style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.12em",color:"#6B7A3A",marginBottom:8}}>Constraints</p><ul style={{paddingLeft:16,marginBottom:20}}>{selected.constraints.map((c,i)=><li key={i} style={{fontSize:12,color:"rgba(240,237,230,0.5)",lineHeight:1.8}}>{c}</li>)}</ul></>)}
                            {selected.testCases?.length>0&&(<><p style={{fontSize:10,textTransform:"uppercase",letterSpacing:"0.12em",color:"#6B7A3A",marginBottom:8}}>Sample Test Cases</p>{selected.testCases.slice(0,2).map((tc,i)=>(
                                <div key={i} style={{padding:12,background:"#161a0d",border:"0.5px solid rgba(106,122,58,0.2)",borderRadius:8,marginBottom:8}}>
                                    <div style={{fontSize:10,color:"#6B7A3A",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Input</div>
                                    <div style={{fontSize:12,color:"#C8CFA8",fontFamily:"DM Mono",marginBottom:8}}>{tc.input}</div>
                                    <div style={{fontSize:10,color:"#6B7A3A",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Output</div>
                                    <div style={{fontSize:12,color:"#C8CFA8",fontFamily:"DM Mono"}}>{tc.output}</div>
                                </div>
                            ))}</>)}
                        </div>
                        <div style={{flex:1,display:"flex",flexDirection:"column",background:"#0f1107",overflow:"hidden",minHeight:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:8,padding:"0 16px",height:44,background:"#161a0d",borderBottom:"1px solid rgba(106,122,58,0.2)",flexShrink:0}}>
                                {Object.entries(LANG_META).map(([id,meta])=>(
                                    <button key={id} onClick={()=>{setLang(id);setCode(BOILERPLATES[id]);}} style={{padding:"4px 12px",background:lang===id?"rgba(58,74,30,0.5)":"transparent",border:`0.5px solid ${lang===id?meta.color:"rgba(106,122,58,0.2)"}`,borderRadius:4,color:lang===id?meta.color:"#3A4A1E",fontFamily:"DM Mono",fontSize:11,cursor:"pointer",letterSpacing:"0.06em"}}>{meta.label}</button>
                                ))}
                                <button onClick={runCode} disabled={isRunning||isSubmitting} style={{marginLeft:"auto",padding:"6px 14px",background:"transparent",border:"0.5px solid #6B7A3A",borderRadius:6,color:"#C8CFA8",fontFamily:"DM Mono",fontSize:11,cursor:isRunning||isSubmitting?"not-allowed":"pointer",letterSpacing:"0.1em",textTransform:"uppercase",opacity:isRunning||isSubmitting?0.5:1}}>{isRunning?"Running...":"▶ Run"}</button>
                                <button onClick={submitProblem} disabled={isRunning||isSubmitting} style={{padding:"6px 16px",background:"#3A4A1E",border:"1px solid #6B7A3A",borderRadius:6,color:"#C8CFA8",fontFamily:"DM Mono",fontSize:11,cursor:isRunning||isSubmitting?"not-allowed":"pointer",letterSpacing:"0.1em",textTransform:"uppercase",opacity:isRunning||isSubmitting?0.5:1}}>{isSubmitting?"Checking...":"↑ Submit"}</button>
                            </div>
                            <textarea value={code} onChange={e=>setCode(e.target.value)} spellCheck={false} style={{flex:1,padding:16,background:"transparent",border:"none",resize:"none",fontFamily:"DM Mono",fontSize:13,lineHeight:1.7,color:"#e8e0d0",caretColor:"#C8CFA8",outline:"none",minHeight:0}}/>
                            <div style={{borderTop:"1px solid rgba(106,122,58,0.2)",flexShrink:0}}>
                                <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",background:"#161a0d",borderBottom:"1px solid rgba(106,122,58,0.15)",fontSize:10,textTransform:"uppercase",letterSpacing:"0.12em",color:"#6B7A3A"}}>
                                    <div style={{width:5,height:5,borderRadius:"50%",background:verdict==="pass"?"#a6e3a1":verdict==="fail"||verdict==="error"?"#c97a6a":"#6B7A3A"}}/>
                                    {isSubmitting?"Judging all test cases...":"stdout"}
                                    {verdict&&!isSubmitting&&<span style={{marginLeft:"auto",color:verdict==="pass"?"#a6e3a1":"#c97a6a"}}>{verdict==="pass"?"✔ Accepted":verdict==="error"?"✘ Error":"✘ Wrong Answer"}</span>}
                                </div>
                                {submitResult&&(
                                    <div style={{padding:"8px 16px",maxHeight:100,overflowY:"auto"}}>
                                        {submitResult.details.map((d,i)=>(
                                            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"3px 0",fontSize:11}}>
                                                <span style={{color:d.pass?"#a6e3a1":"#c97a6a"}}>{d.pass?"✔":"✘"}</span>
                                                <span style={{color:"#6B7A3A"}}>TC {d.index}</span>
                                                {!d.pass&&<span style={{color:"#4a5a28",fontSize:10}}>got: {String(d.output).slice(0,30)}</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!submitResult&&<div style={{padding:"12px 16px",fontFamily:"DM Mono",fontSize:12,color:verdict==="pass"?"#a6e3a1":verdict==="error"?"#c97a6a":"rgba(240,237,230,0.5)",whiteSpace:"pre-wrap",maxHeight:100,overflowY:"auto",minHeight:50}}>{output||"// output appears here..."}</div>}
                            </div>
                        </div>
                    </div>
                ):(
                    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:12,color:"#3A4A1E"}}>
                        <div style={{fontSize:32,opacity:0.3}}>◎</div>
                        <div style={{fontSize:13,letterSpacing:"0.05em"}}>// select a problem to start</div>
                    </div>
                )}
            </div>
        </div>
    );
}

function RegistrationGuardModal({ contest, onClose }) {
    return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)"}} onClick={onClose}>
            <div style={{background:"#161a0d",border:"0.5px solid rgba(201,122,106,0.4)",borderRadius:12,padding:32,width:"min(380px,90vw)"}} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:32,marginBottom:16,textAlign:"center"}}>🔒</div>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:"#F0EDE6",marginBottom:10,textAlign:"center"}}>Registration Required</div>
                <div style={{fontSize:13,color:"#6B7A3A",lineHeight:1.7,textAlign:"center",marginBottom:24}}>Register for <span style={{color:"#C8CFA8"}}>{contest.name}</span> before entering the contest.</div>
                <button onClick={onClose} style={{width:"100%",padding:10,background:"#3A4A1E",border:"1px solid #6B7A3A",borderRadius:7,color:"#C8CFA8",fontFamily:"DM Mono",fontSize:12,cursor:"pointer",letterSpacing:"0.08em"}}>Got it</button>
            </div>
        </div>
    );
}

function EntryConfirmModal({ contest, onConfirm, onCancel }) {
    return (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,backdropFilter:"blur(4px)"}} onClick={onCancel}>
            <div style={{background:"#161a0d",border:"0.5px solid rgba(240,198,116,0.35)",borderRadius:12,padding:32,width:"min(420px,90vw)"}} onClick={e=>e.stopPropagation()}>
                <div style={{fontSize:28,marginBottom:12,textAlign:"center"}}>⏱</div>
                <div style={{fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:800,color:"#F0EDE6",marginBottom:12,textAlign:"center"}}>Ready to Enter?</div>
                <div style={{fontSize:13,color:"#6B7A3A",lineHeight:1.8,textAlign:"center",marginBottom:24}}>
                    You're about to enter <span style={{color:"#f0c674"}}>{contest.name}</span>.<br/>
                    Please ensure you can dedicate <span style={{color:"#F0EDE6"}}>{contest.duration||"the full duration"}</span>.<br/><br/>
                    <span style={{color:"#c97a6a",fontSize:12}}>⚠ You can only enter this contest once.</span>
                </div>
                <div style={{display:"flex",gap:12}}>
                    <button onClick={onCancel} style={{flex:1,padding:10,background:"transparent",border:"0.5px solid rgba(106,122,58,0.4)",borderRadius:7,color:"#6B7A3A",fontFamily:"DM Mono",fontSize:12,cursor:"pointer"}}>Not Now</button>
                    <button onClick={onConfirm} style={{flex:1,padding:10,background:"#f0c674",border:"none",borderRadius:7,color:"#111409",fontFamily:"DM Mono",fontSize:12,fontWeight:600,cursor:"pointer"}}>Enter Contest →</button>
                </div>
            </div>
        </div>
    );
}

export default function Contest() {
    const { user }  = useAuth();
    const navigate  = useNavigate();
    const [contests, setContests]                     = useState([]);
    const [loading, setLoading]                       = useState(true);
    const [activeTab, setActiveTab]                   = useState("upcoming");
    const [registering, setRegistering]               = useState(null);
    const [registered, setRegistered]                 = useState({});
    const [activeContest, setActiveContest]           = useState(null);
    const [leaderboardContest, setLeaderboardContest] = useState(null);
    const [guardModal, setGuardModal]                 = useState(null);
    const [entryConfirm, setEntryConfirm]             = useState(null);
    const [enteredContests, setEnteredContests]       = useState({});
    const [completedContests, setCompletedContests]   = useState({});
    const [registerError, setRegisterError]           = useState(null);

    useEffect(()=>{
        api.get("/api/contests").then(res=>setContests(res.data)).catch(console.error).finally(()=>setLoading(false));
    },[]);

    useEffect(()=>{
        const suf = contestUserSuffix(user);
        try{
            setEnteredContests(JSON.parse(localStorage.getItem(`cw_entered_${suf}`)||"{}"));
        }catch{
            setEnteredContests({});
        }

        const localCompleted = readLocalCompleted(suf);

        if(!user){
            setCompletedContests(localCompleted);
            return;
        }

        api.get("/api/user/profile")
            .then(res=>{
                const fromServer = completedMapFromProfile(res.data?.contestsAttended);
                setCompletedContests({ ...localCompleted, ...fromServer });
            })
            .catch(()=>{
                setCompletedContests(localCompleted);
            });
    },[user]);

    function markCompleted(id) {
        const completedKey = `cw_completed_${contestUserSuffix(user)}`;
        setCompletedContests(prev=>{ const n={...prev,[id]:true}; localStorage.setItem(completedKey,JSON.stringify(n)); return n; });
    }
    function markEntered(id) {
        const enteredKey = `cw_entered_${contestUserSuffix(user)}`;
        setEnteredContests(prev=>{ const n={...prev,[id]:true}; localStorage.setItem(enteredKey,JSON.stringify(n)); return n; });
    }

    async function handleRegister(contestId, e) {
        e.stopPropagation();
        if(!user){navigate("/login");return;}
        setRegistering(contestId);
        setRegisterError(null);
        try{
            await api.post(`/api/contests/${contestId}/register`);
            setRegistered(r=>({...r,[contestId]:true}));
        }catch(err){
            const msg = err.response?.data?.error || err.response?.data?.message || (typeof err.response?.data === "string" ? err.response.data : null) || "Registration failed";
            setRegisterError(typeof msg === "string" ? msg : "Registration failed");
            setTimeout(()=>setRegisterError(null), 8000);
            console.error(err);
        }finally{setRegistering(null);}
    }

    function isRegistered(c) {
        return registered[c.id] || c.registeredUsers?.includes(user?.email) || c.registeredUsers?.includes(user?.sub);
    }

    function handleEnterAttempt(contest) {
        if(!isRegistered(contest)){setGuardModal(contest);return;}
        if(enteredContests[contest.id]){setActiveContest(contest);return;}
        setEntryConfirm(contest);
    }

    function confirmEntry() {
        if(!entryConfirm) return;
        markEntered(entryConfirm.id);
        setActiveContest(entryConfirm);
        setEntryConfirm(null);
    }

    const upcoming=contests.filter(isUpcoming);
    const live=contests.filter(isLive);
    const past=contests.filter(isPast);

    if(activeContest) return <ContestArena contest={activeContest} onExit={()=>setActiveContest(null)} markCompleted={markCompleted}/>;

    return (
        <>
            <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
    .ct-page{min-height:100vh;background:#111409;font-family:'DM Mono',monospace;color:#F0EDE6;}
    .ct-hero{background:#161a0d;border-bottom:1px solid rgba(106,122,58,0.25);padding:48px 60px;display:flex;align-items:flex-end;justify-content:space-between;gap:24px;}
    .ct-eyebrow{font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#6B7A3A;margin-bottom:12px;}
    .ct-hero-title{font-family:'Syne',sans-serif;font-weight:800;font-size:40px;color:#F0EDE6;letter-spacing:-1px;line-height:1.1;margin-bottom:8px;}
    .ct-hero-title span{color:#C8CFA8;}
    .ct-hero-sub{font-size:12px;color:#4a5a28;line-height:1.8;font-weight:300;}
    .ct-hero-stats{display:flex;gap:32px;flex-shrink:0;}
    .ct-hero-stat{text-align:right;}
    .ct-hero-stat-val{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;color:#C8CFA8;letter-spacing:-1px;}
    .ct-hero-stat-label{font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#3A4A1E;margin-top:2px;}
    .ct-live-banner{background:rgba(240,198,116,0.06);border-bottom:1px solid rgba(240,198,116,0.2);padding:0 60px;}
    .ct-live-inner{padding:24px 0;}
    .ct-live-label{display:flex;align-items:center;gap:8px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#f0c674;margin-bottom:16px;}
    .ct-live-dot{width:6px;height:6px;border-radius:50%;background:#f0c674;box-shadow:0 0 8px #f0c674;animation:livepulse 1.5s infinite;}
    @keyframes livepulse{0%,100%{opacity:1}50%{opacity:0.3}}
    .ct-live-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;}
    .ct-live-card{background:rgba(240,198,116,0.04);border:0.5px solid rgba(240,198,116,0.3);border-radius:10px;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;}
    .ct-live-card-name{font-size:14px;font-weight:500;color:#F0EDE6;margin-bottom:6px;}
    .ct-enter-btn{padding:8px 20px;background:#f0c674;border:none;border-radius:6px;color:#111409;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;flex-shrink:0;}
    .ct-enter-btn:hover:not(.locked):not(.completed){background:#fff;box-shadow:0 0 16px rgba(240,198,116,0.4);}
    .ct-enter-btn.locked{background:rgba(58,74,30,0.2);color:#3A4A1E;border:0.5px solid rgba(106,122,58,0.2);cursor:not-allowed;}
    .ct-enter-btn.completed{background:rgba(166,233,161,0.12);color:#a6e3a1;border:0.5px solid rgba(166,233,161,0.3);cursor:default;}
    .ct-tabs-wrap{display:flex;gap:0;border-bottom:1px solid rgba(106,122,58,0.2);padding:0 60px;}
    .ct-tab{padding:16px 24px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#3A4A1E;background:none;border:none;border-bottom:2px solid transparent;cursor:pointer;font-family:'DM Mono',monospace;transition:all 0.18s;display:flex;align-items:center;gap:8px;}
    .ct-tab:hover{color:#6B7A3A;}
    .ct-tab.active{color:#C8CFA8;border-bottom-color:#C8CFA8;}
    .ct-tab-count{font-size:10px;padding:1px 6px;border-radius:10px;background:rgba(106,122,58,0.2);color:#6B7A3A;}
    .ct-tab.active .ct-tab-count{background:rgba(200,207,168,0.15);color:#C8CFA8;}
    .ct-content{padding:40px 60px;}
    .ct-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;}
    .ct-card{background:#161a0d;border:0.5px solid rgba(106,122,58,0.25);border-radius:10px;padding:24px;display:flex;flex-direction:column;gap:18px;transition:border-color 0.18s,background 0.18s,transform 0.15s;}
    .ct-card:hover{background:#1c2210;border-color:rgba(200,207,168,0.3);transform:translateY(-3px);}
    .ct-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;}
    .ct-card-name{font-size:15px;font-weight:500;color:#F0EDE6;line-height:1.4;flex:1;}
    .ct-diff-badge{font-size:10px;padding:3px 10px;border-radius:20px;letter-spacing:0.06em;flex-shrink:0;font-weight:500;}
    .ct-card-meta{display:flex;flex-direction:column;gap:8px;}
    .ct-meta-row{display:flex;justify-content:space-between;font-size:12px;}
    .ct-meta-row span:first-child{color:#3A4A1E;}
    .ct-meta-row span:last-child{color:rgba(240,237,230,0.6);}
    .ct-card-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:4px;border-top:0.5px solid rgba(106,122,58,0.15);}
    .ct-register-btn{padding:8px 18px;background:#3A4A1E;border:1px solid #6B7A3A;border-radius:6px;color:#C8CFA8;font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;cursor:pointer;transition:all 0.2s;}
    .ct-register-btn:hover:not(:disabled):not(.done){background:#6B7A3A;color:#111409;box-shadow:0 0 14px rgba(106,122,58,0.3);}
    .ct-register-btn:disabled{opacity:0.4;cursor:not-allowed;}
    .ct-register-btn.done{background:rgba(166,233,161,0.1);border-color:rgba(166,233,161,0.3);color:#a6e3a1;cursor:default;}
    .ct-registered-count{font-size:11px;color:#3A4A1E;letter-spacing:0.05em;}
    .ct-past-card{background:#161a0d;border:0.5px solid rgba(106,122,58,0.2);border-radius:10px;padding:20px 24px;display:grid;grid-template-columns:1fr auto auto auto;align-items:center;gap:24px;cursor:pointer;transition:border-color 0.18s,background 0.18s;}
    .ct-past-card:hover{background:#1c2210;border-color:rgba(200,207,168,0.3);}
    .ct-past-name{font-size:14px;color:#F0EDE6;margin-bottom:6px;}
    .ct-past-meta{display:flex;gap:24px;}
    .ct-past-meta-item{display:flex;flex-direction:column;align-items:flex-end;gap:2px;}
    .ct-past-meta-val{font-size:12px;color:rgba(240,237,230,0.5);}
    .ct-past-meta-label{font-size:10px;color:#3A4A1E;text-transform:uppercase;letter-spacing:0.1em;}
    .ct-leaderboard-btn{padding:7px 14px;background:transparent;border:0.5px solid rgba(106,122,58,0.4);border-radius:6px;color:#6B7A3A;font-family:'DM Mono',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;transition:all 0.18s;white-space:nowrap;}
    .ct-leaderboard-btn:hover{border-color:#C8CFA8;color:#C8CFA8;}
    .ct-empty{text-align:center;padding:64px 0;color:#3A4A1E;font-size:13px;letter-spacing:0.05em;}
    .ct-loading{display:flex;align-items:center;justify-content:center;height:calc(100vh - 60px);color:#3A4A1E;font-size:13px;gap:12px;}
    .ct-spinner{width:14px;height:14px;border:2px solid rgba(200,207,168,0.15);border-top-color:#C8CFA8;border-radius:50%;animation:ctspin 0.7s linear infinite;}
    @keyframes ctspin{to{transform:rotate(360deg)}}
            `}</style>
            <Navbar/>

            {registerError&&(
                <div style={{position:"fixed",top:72,left:"50%",transform:"translateX(-50%)",zIndex:10001,maxWidth:"min(520px,92vw)",padding:"10px 18px",background:"rgba(201,122,106,0.15)",border:"0.5px solid rgba(201,122,106,0.45)",borderRadius:8,color:"#e8c4be",fontFamily:"DM Mono,monospace",fontSize:12,textAlign:"center"}}>
                    {registerError}
                </div>
            )}

            {leaderboardContest&&<LeaderboardModal contest={leaderboardContest} onClose={()=>setLeaderboardContest(null)}/>}
            {guardModal&&<RegistrationGuardModal contest={guardModal} onClose={()=>setGuardModal(null)}/>}
            {entryConfirm&&<EntryConfirmModal contest={entryConfirm} onConfirm={confirmEntry} onCancel={()=>setEntryConfirm(null)}/>}

            <div className="ct-page">
                {loading?(
                    <div className="ct-loading"><div className="ct-spinner"/>loading contests...</div>
                ):(
                    <>
                        <div className="ct-hero">
                            <div>
                                <p className="ct-eyebrow">// arena</p>
                                <h1 className="ct-hero-title">Compete & <span>Conquer.</span></h1>
                                <p className="ct-hero-sub">Join live contests, solve problems under pressure,<br/>and climb the global leaderboard.</p>
                            </div>
                            <div className="ct-hero-stats">
                                <div className="ct-hero-stat"><div className="ct-hero-stat-val">{upcoming.length}</div><div className="ct-hero-stat-label">Upcoming</div></div>
                                <div className="ct-hero-stat"><div className="ct-hero-stat-val" style={{color:"#f0c674"}}>{live.length}</div><div className="ct-hero-stat-label">Live Now</div></div>
                                <div className="ct-hero-stat"><div className="ct-hero-stat-val">{past.length}</div><div className="ct-hero-stat-label">Past</div></div>
                            </div>
                        </div>

                        {live.length>0&&(
                            <div className="ct-live-banner">
                                <div className="ct-live-inner">
                                    <div className="ct-live-label"><div className="ct-live-dot"/>Live Now</div>
                                    <div className="ct-live-cards">
                                        {live.map(c=>{
                                            const reg=isRegistered(c);
                                            const completed=completedContests[c.id];
                                            return(
                                                <div key={c.id} className="ct-live-card">
                                                    <div>
                                                        <div className="ct-live-card-name">{c.name}</div>
                                                        <Countdown startTime={c.startTime} endTime={c.endTime}/>
                                                    </div>
                                                    {completed?(
                                                        <button className="ct-enter-btn completed" disabled>✔ Completed</button>
                                                    ):(
                                                        <button className={`ct-enter-btn${!reg?" locked":""}`} onClick={()=>reg?handleEnterAttempt(c):setGuardModal(c)}>
                                                            {reg?"Enter →":"🔒 Register First"}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="ct-tabs-wrap">
                            <button className={`ct-tab ${activeTab==="upcoming"?"active":""}`} onClick={()=>setActiveTab("upcoming")}>Upcoming <span className="ct-tab-count">{upcoming.length}</span></button>
                            <button className={`ct-tab ${activeTab==="past"?"active":""}`} onClick={()=>setActiveTab("past")}>Past Contests <span className="ct-tab-count">{past.length}</span></button>
                        </div>

                        <div className="ct-content">
                            {activeTab==="upcoming"&&(
                                upcoming.length===0?<div className="ct-empty">// no upcoming contests right now</div>
                                :<div className="ct-grid">
                                    {upcoming.map(c=>{
                                        const d=diffStyle[c.difficulty]||diffStyle.Medium;
                                        // BUG FIX: use isRegistered() helper which checks backend data too
                                        const done=isRegistered(c);
                                        return(
                                            <div key={c.id} className="ct-card">
                                                <div className="ct-card-top">
                                                    <div className="ct-card-name">{c.name}</div>
                                                    <span className="ct-diff-badge" style={{color:d.color,background:d.bg,border:`0.5px solid ${d.border}`}}>{c.difficulty}</span>
                                                </div>
                                                <div className="ct-card-meta">
                                                    <div className="ct-meta-row"><span>Start</span><span>{formatDate(c.startTime)}</span></div>
                                                    <div className="ct-meta-row"><span>Duration</span><span>{c.duration}</span></div>
                                                    <div className="ct-meta-row"><span>Problems</span><span>{c.problems?.length||0}</span></div>
                                                </div>
                                                <Countdown startTime={c.startTime} endTime={c.endTime}/>
                                                <div className="ct-card-footer">
                                                    <span className="ct-registered-count">{c.registeredUsers?.length||0} registered</span>
                                                    <button
                                                        className={`ct-register-btn${done?" done":""}`}
                                                        onClick={e=>!done&&handleRegister(c.id,e)}
                                                        disabled={registering===c.id||done}>
                                                        {registering===c.id?"...":done?"✔ Registered":"Register"}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {activeTab==="past"&&(
                                past.length===0?<div className="ct-empty">// no past contests yet</div>
                                :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                                    {past.map(c=>{
                                        const d=diffStyle[c.difficulty]||diffStyle.Medium;
                                        return(
                                            <div key={c.id} className="ct-past-card" onClick={()=>setLeaderboardContest(c)}>
                                                <div>
                                                    <div className="ct-past-name">{c.name}</div>
                                                    <span style={{display:"inline-block",marginTop:6,fontSize:10,padding:"2px 8px",borderRadius:20,color:d.color,background:d.bg,border:`0.5px solid ${d.border}`}}>{c.difficulty}</span>
                                                </div>
                                                <div className="ct-past-meta">
                                                    <div className="ct-past-meta-item"><div className="ct-past-meta-val">{formatDate(c.startTime)}</div><div className="ct-past-meta-label">Date</div></div>
                                                    <div className="ct-past-meta-item"><div className="ct-past-meta-val">{c.duration}</div><div className="ct-past-meta-label">Duration</div></div>
                                                    <div className="ct-past-meta-item"><div className="ct-past-meta-val">{c.registeredUsers?.length||0}</div><div className="ct-past-meta-label">Participants</div></div>
                                                </div>
                                                <button className="ct-leaderboard-btn" onClick={e=>{e.stopPropagation();setLeaderboardContest(c);}}>🏆 Leaderboard</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}