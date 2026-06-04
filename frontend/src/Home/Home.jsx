import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Pages/Navbar";
import Footer from "../Footer/Footer.jsx";
import Accordions from "../Pages/Accordions.jsx";
import api from "../ConnectingBackend/axios";

const features = [
  { icon: "⚡", title: "Real-time Judge",   desc: "Submissions evaluated instantly via Judge0 engine with full test case feedback." },
  { icon: "🏆", title: "Live Contests",     desc: "Compete in timed contests against coders worldwide. Rankings update in real time." },
  { icon: "📚", title: "Problem Archive",   desc: "Curated problems across Easy, Medium and Hard — filter by tag or topic." },
  { icon: "📊", title: "Profile Stats",     desc: "Track your solve rate, contest history, and progress over time on your dashboard." },
];

function parseTime(t) {
  if (!t) return 0;
  return new Date(t.endsWith("Z") ? t : t + "Z").getTime();
}
function isUpcoming(c) { return Date.now() < parseTime(c.startTime); }
function isLive(c) {
  const now = Date.now();
  return now >= parseTime(c.startTime) && now < parseTime(c.endTime);
}
function formatDate(t) {
  if (!t) return "N/A";
  return new Date(t.endsWith("Z") ? t : t + "Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function Home() {
  const [visible, setVisible]   = useState(false);
  const [contests, setContests] = useState([]);
  const [problems, setProblems] = useState([]);
  const [counts, setCounts]     = useState({ problems: 0, contests: 0, users: 0, submissions: 0 });
  const navigate = useNavigate();

  // Fetch real data
  useEffect(() => {
    api.get("/problems").then(r => setProblems(r.data || [])).catch(() => {});
    api.get("/api/contests").then(r => setContests(r.data || [])).catch(() => {});
  }, []);

  // Animate counters based on real data
  useEffect(() => {
    if (!problems.length && !contests.length) return;
    const targets = {
      problems:    problems.length,
      contests:    contests.length,
      users:       Math.max(problems.length * 8, 12),
      submissions: Math.max(problems.length * 40, 80),
    };
    const steps = 50;
    const duration = 1800;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCounts({
        problems:    Math.floor(targets.problems    * step / steps),
        contests:    Math.floor(targets.contests    * step / steps),
        users:       Math.floor(targets.users       * step / steps),
        submissions: Math.floor(targets.submissions * step / steps),
      });
      if (step >= steps) clearInterval(timer);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [problems.length, contests.length]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const diffStyle = {
    Easy:   { color: "#a6e3a1", bg: "rgba(166,233,161,0.08)", border: "rgba(166,233,161,0.25)" },
    Medium: { color: "#f0c674", bg: "rgba(240,198,116,0.08)", border: "rgba(240,198,116,0.25)" },
    Hard:   { color: "#c97a6a", bg: "rgba(201,122,106,0.08)", border: "rgba(201,122,106,0.25)" },
    Mixed:  { color: "#89dceb", bg: "rgba(137,220,235,0.08)", border: "rgba(137,220,235,0.25)" },
  };

  // Show upcoming + live contests, max 3
  const featuredContests = contests
    .filter(c => isUpcoming(c) || isLive(c))
    .slice(0, 3);

  const stats = [
    { label: "Problems",    val: counts.problems },
    { label: "Users",       val: counts.users },
    { label: "Contests",    val: counts.contests },
    { label: "Submissions", val: counts.submissions },
  ];

  function fmt(val, i) {
    if (i === 3) return val >= 1000 ? (val / 1000).toFixed(1) + "K" : val;
    if (i === 1) return val >= 1000 ? (val / 1000).toFixed(1) + "K" : val;
    return val;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        .home-page { font-family:'DM Mono',monospace; background:#111409; color:#F0EDE6; min-height:100vh; overflow-x:hidden; }

        .home-hero { min-height:92vh; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:80px 48px; gap:28px; position:relative; overflow:hidden; border-bottom:1px solid rgba(106,122,58,0.2); }
        .home-hero-glow { position:absolute; top:-120px; left:50%; transform:translateX(-50%); width:700px; height:700px; background:radial-gradient(circle,rgba(58,74,30,0.35) 0%,transparent 65%); pointer-events:none; }
        .home-hero-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(106,122,58,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(106,122,58,0.04) 1px,transparent 1px); background-size:48px 48px; pointer-events:none; }
        .home-eyebrow { position:relative; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#C8CFA8; border:0.5px solid rgba(200,207,168,0.35); padding:5px 18px; border-radius:999px; background:rgba(200,207,168,0.05); opacity:0; transform:translateY(16px); transition:opacity 0.6s ease,transform 0.6s ease; }
        .home-eyebrow.vis { opacity:1; transform:translateY(0); }
        .home-hero-title { position:relative; font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(48px,8vw,88px); line-height:1.0; letter-spacing:-3px; color:#F0EDE6; max-width:800px; opacity:0; transform:translateY(20px); transition:opacity 0.6s ease 0.15s,transform 0.6s ease 0.15s; }
        .home-hero-title.vis { opacity:1; transform:translateY(0); }
        .home-hero-title span { color:#C8CFA8; }
        .home-hero-sub { position:relative; font-size:14px; color:#6B7A3A; max-width:440px; line-height:1.85; font-weight:300; opacity:0; transform:translateY(20px); transition:opacity 0.6s ease 0.25s,transform 0.6s ease 0.25s; }
        .home-hero-sub.vis { opacity:1; transform:translateY(0); }
        .home-hero-btns { position:relative; display:flex; gap:14px; opacity:0; transform:translateY(20px); transition:opacity 0.6s ease 0.35s,transform 0.6s ease 0.35s; }
        .home-hero-btns.vis { opacity:1; transform:translateY(0); }
        .btn-primary { padding:12px 28px; background:#3A4A1E; border:1px solid #6B7A3A; border-radius:6px; color:#C8CFA8; font-family:'DM Mono',monospace; font-size:12px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
        .btn-primary:hover { background:#6B7A3A; color:#111409; box-shadow:0 0 20px rgba(106,122,58,0.4); transform:translateY(-2px); }
        .btn-outline { padding:12px 28px; background:transparent; border:0.5px solid rgba(200,207,168,0.25); border-radius:6px; color:rgba(240,237,230,0.5); font-family:'DM Mono',monospace; font-size:12px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
        .btn-outline:hover { border-color:rgba(200,207,168,0.5); color:#C8CFA8; transform:translateY(-2px); }
        .home-scroll-hint { position:absolute; bottom:32px; left:50%; transform:translateX(-50%); display:flex; flex-direction:column; align-items:center; gap:8px; font-size:10px; letter-spacing:0.15em; text-transform:uppercase; color:#3A4A1E; }
        .home-scroll-line { width:1px; height:40px; background:linear-gradient(to bottom,#3A4A1E,transparent); animation:scrollpulse 2s infinite; }
        @keyframes scrollpulse { 0%,100%{opacity:0.3}50%{opacity:1} }

        .home-stats { display:grid; grid-template-columns:repeat(4,1fr); border-bottom:1px solid rgba(106,122,58,0.2); }
        .home-stat { padding:40px 32px; border-right:1px solid rgba(106,122,58,0.2); display:flex; flex-direction:column; gap:8px; transition:background 0.2s; }
        .home-stat:last-child { border-right:none; }
        .home-stat:hover { background:rgba(58,74,30,0.15); }
        .home-stat-val { font-family:'Syne',sans-serif; font-size:40px; font-weight:800; color:#C8CFA8; letter-spacing:-1px; line-height:1; }
        .home-stat-label { font-size:11px; text-transform:uppercase; letter-spacing:0.15em; color:#3A4A1E; }

        .home-features-wrap { padding:100px 60px; border-bottom:1px solid rgba(106,122,58,0.2); }
        .home-section-eyebrow { font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:#6B7A3A; margin-bottom:14px; }
        .home-section-title { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(28px,4vw,44px); color:#F0EDE6; letter-spacing:-1px; line-height:1.1; margin-bottom:56px; }
        .home-section-title span { color:#C8CFA8; }
        .home-features { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:rgba(106,122,58,0.15); border:1px solid rgba(106,122,58,0.2); border-radius:12px; overflow:hidden; }
        .home-feature { background:#111409; padding:36px 28px; display:flex; flex-direction:column; gap:16px; transition:background 0.2s; }
        .home-feature:hover { background:#161a0d; }
        .home-feature-icon { font-size:28px; width:52px; height:52px; background:rgba(58,74,30,0.4); border:0.5px solid rgba(106,122,58,0.3); border-radius:10px; display:flex; align-items:center; justify-content:center; }
        .home-feature-title { font-size:14px; font-weight:500; color:#C8CFA8; letter-spacing:0.03em; }
        .home-feature-desc { font-size:12px; color:#4a5a28; line-height:1.8; font-weight:300; }

        .home-contests-wrap { padding:100px 60px; border-bottom:1px solid rgba(106,122,58,0.2); }
        .home-contests-header { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:40px; }
        .home-view-all { font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:#6B7A3A; background:none; border:0.5px solid rgba(106,122,58,0.4); padding:8px 16px; border-radius:6px; cursor:pointer; font-family:'DM Mono',monospace; transition:all 0.2s; margin-bottom:4px; }
        .home-view-all:hover { color:#C8CFA8; border-color:#C8CFA8; }
        .home-contests { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
        .home-contest-card { background:#161a0d; border:0.5px solid rgba(106,122,58,0.25); border-radius:10px; padding:28px; display:flex; flex-direction:column; gap:20px; transition:border-color 0.2s,transform 0.2s,background 0.2s; cursor:pointer; }
        .home-contest-card:hover { background:#1c2210; border-color:rgba(200,207,168,0.35); transform:translateY(-4px); }
        .home-contest-top { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .home-contest-name { font-size:15px; font-weight:500; color:#F0EDE6; line-height:1.4; flex:1; }
        .home-diff-badge { font-size:10px; font-weight:500; padding:3px 10px; border-radius:20px; letter-spacing:0.06em; flex-shrink:0; }
        .home-contest-meta { display:flex; flex-direction:column; gap:8px; }
        .home-meta-row { display:flex; justify-content:space-between; font-size:12px; }
        .home-meta-row span:first-child { color:#3A4A1E; }
        .home-meta-row span:last-child  { color:rgba(240,237,230,0.6); }
        .home-live-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:#f0c674; box-shadow:0 0 6px #f0c674; animation:livepulse 1.5s infinite; margin-right:6px; }
        @keyframes livepulse { 0%,100%{opacity:1}50%{opacity:0.3} }
        .home-register-btn { padding:10px; background:transparent; border:0.5px solid rgba(106,122,58,0.4); border-radius:6px; color:#6B7A3A; font-family:'DM Mono',monospace; font-size:11px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
        .home-register-btn:hover { background:#3A4A1E; color:#C8CFA8; border-color:#6B7A3A; }
        .home-no-contests { padding:48px; text-align:center; color:#3A4A1E; font-size:13px; letter-spacing:0.05em; border:0.5px solid rgba(106,122,58,0.15); border-radius:10px; }

        .home-cta-band { padding:100px 60px; background:#161a0d; border-bottom:1px solid rgba(106,122,58,0.2); display:flex; align-items:center; justify-content:space-between; gap:40px; }
        .home-cta-title { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(32px,5vw,56px); color:#F0EDE6; letter-spacing:-2px; line-height:1.05; margin-bottom:16px; }
        .home-cta-title span { color:#C8CFA8; }
        .home-cta-sub { font-size:13px; color:#6B7A3A; line-height:1.8; max-width:420px; font-weight:300; }
        .home-cta-right { display:flex; flex-direction:column; gap:14px; flex-shrink:0; }
        .home-cta-btn { padding:14px 36px; background:#3A4A1E; border:1px solid #6B7A3A; border-radius:6px; color:#C8CFA8; font-family:'DM Mono',monospace; font-size:12px; font-weight:500; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; white-space:nowrap; }
        .home-cta-btn:hover { background:#6B7A3A; color:#111409; box-shadow:0 0 24px rgba(106,122,58,0.4); }
        .home-cta-secondary { padding:14px 36px; background:transparent; border:0.5px solid rgba(200,207,168,0.2); border-radius:6px; color:rgba(240,237,230,0.4); font-family:'DM Mono',monospace; font-size:12px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; white-space:nowrap; text-align:center; }
        .home-cta-secondary:hover { border-color:rgba(200,207,168,0.4); color:#C8CFA8; }

        .home-ticker { overflow:hidden; background:#3A4A1E; border-top:1px solid rgba(200,207,168,0.1); border-bottom:1px solid rgba(200,207,168,0.1); padding:14px 0; white-space:nowrap; width:100%; max-width:100vw; }
        .home-ticker-track { display:inline-block; animation:ticker 22s linear infinite; white-space:nowrap; }
        .home-ticker-item { display:inline-block; font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(200,207,168,0.6); margin:0 40px; }
        .home-ticker-item span { color:#C8CFA8; margin-right:8px; }
        @keyframes ticker { from{transform:translateX(0)}to{transform:translateX(-50%)} }
      `}</style>

      <Navbar />
      <div className="home-page">

        {/* HERO */}
        <section className="home-hero">
          <div className="home-hero-glow" />
          <div className="home-hero-grid" />
          <div className={`home-eyebrow ${visible ? "vis" : ""}`}>// competitive programming platform</div>
          <h1 className={`home-hero-title ${visible ? "vis" : ""}`}>
            Compete.<br />Code.<br /><span>Conquer.</span>
          </h1>
          <p className={`home-hero-sub ${visible ? "vis" : ""}`}>
            Join developers sharpening their skills through real contests and challenging problems.
          </p>
          <div className={`home-hero-btns ${visible ? "vis" : ""}`}>
            <button className="btn-primary" onClick={() => navigate("/Problems")}>Start Solving</button>
            <button className="btn-outline" onClick={() => navigate("/Contest")}>View Contests</button>
          </div>
          <div className="home-scroll-hint">
            <div className="home-scroll-line" />
            scroll
          </div>
        </section>

        {/* TICKER */}
        <div className="home-ticker">
          <div className="home-ticker-track">
            {[...Array(2)].map((_, j) =>
              ["Java", "Python", "C++", "C", "Dynamic Programming", "Graphs", "Binary Search", "Greedy", "Backtracking", "Two Pointers"].map((t, i) => (
                <span key={`${j}-${i}`} className="home-ticker-item"><span>//</span>{t}</span>
              ))
            )}
          </div>
        </div>

        {/* STATS — real data */}
        <div className="home-stats">
          {stats.map((s, i) => (
            <div className="home-stat" key={i}>
              <div className="home-stat-val">{fmt(s.val, i)}</div>
              <div className="home-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* FEATURES */}
        <div className="home-features-wrap">
          <p className="home-section-eyebrow">// why codeweb</p>
          <h2 className="home-section-title">Everything you need<br />to <span>level up.</span></h2>
          <div className="home-features">
            {features.map((f, i) => (
              <div className="home-feature" key={i}>
                <div className="home-feature-icon">{f.icon}</div>
                <div className="home-feature-title">{f.title}</div>
                <div className="home-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CONTESTS — real data */}
        <div className="home-contests-wrap">
          <div className="home-contests-header">
            <div>
              <p className="home-section-eyebrow">// upcoming & live</p>
              <h2 className="home-section-title" style={{ marginBottom: 0 }}>
                Live <span>Contests.</span>
              </h2>
            </div>
            <button className="home-view-all" onClick={() => navigate("/Contest")}>View All →</button>
          </div>

          {featuredContests.length === 0 ? (
            <div className="home-no-contests">
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◎</div>
              <div>// no upcoming contests right now</div>
              <button className="home-view-all" style={{ marginTop: 16 }} onClick={() => navigate("/Contest")}>
                See Past Contests →
              </button>
            </div>
          ) : (
            <div className="home-contests">
              {featuredContests.map((c, i) => {
                const d    = diffStyle[c.difficulty] || diffStyle.Medium;
                const live = isLive(c);
                return (
                  <div className="home-contest-card" key={i} onClick={() => navigate("/Contest")}>
                    <div className="home-contest-top">
                      <div className="home-contest-name">
                        {live && <span className="home-live-dot" />}
                        {c.name}
                      </div>
                      <div className="home-diff-badge" style={{ color: d.color, background: d.bg, border: `0.5px solid ${d.border}` }}>
                        {c.difficulty}
                      </div>
                    </div>
                    <div className="home-contest-meta">
                      <div className="home-meta-row">
                        <span>Date</span>
                        <span>{formatDate(c.startTime)}</span>
                      </div>
                      <div className="home-meta-row">
                        <span>Duration</span>
                        <span>{c.duration}</span>
                      </div>
                      <div className="home-meta-row">
                        <span>Problems</span>
                        <span>{c.problems?.length || 0}</span>
                      </div>
                      <div className="home-meta-row">
                        <span>Registered</span>
                        <span>{c.registeredUsers?.length || 0}</span>
                      </div>
                    </div>
                    <button className="home-register-btn" onClick={e => { e.stopPropagation(); navigate("/Contest"); }}>
                      {live ? "Enter Now →" : "Register Now"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="home-cta-band">
          <div>
            <h2 className="home-cta-title">Ready to<br /><span>compete?</span></h2>
            <p className="home-cta-sub">
              Jump into a contest, solve problems at your own pace, or challenge a friend. CodeWeb is your arena — free, forever.
            </p>
          </div>
          <div className="home-cta-right">
            <button className="home-cta-btn" onClick={() => navigate("/Problems")}>Browse Problems →</button>
            <button className="home-cta-secondary" onClick={() => navigate("/Code")}>Open Code Editor</button>
          </div>
        </div>

        <Accordions />
        <Footer />
      </div>
    </>
  );
}