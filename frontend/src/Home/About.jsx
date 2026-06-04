import Navbar from "../Pages/Navbar";
import Footer from "../Footer/Footer.jsx";
import { useNavigate } from "react-router-dom";

const team = [
  { name: "Aditya Singh", role: "Founder & Backend", avatar: "AS", color: "#C8CFA8" },
  { name: "CodeWeb Team", role: "Frontend & Design",  avatar: "CW", color: "#89dceb" },
];

const tech = [
  { name: "Spring Boot",   desc: "Java backend with REST APIs",    icon: "☕" },
  { name: "MongoDB",       desc: "NoSQL database for flexibility",  icon: "🍃" },
  { name: "React",         desc: "Fast, responsive frontend",       icon: "⚛️" },
  { name: "Judge0",        desc: "Code execution & judging",        icon: "⚡" },
  { name: "JWT Auth",      desc: "Secure token-based auth",         icon: "🔐" },
  { name: "Google OAuth",  desc: "One-click Google login",          icon: "🔑" },
];

const values = [
  { icon: "🎯", title: "Merit-based",   desc: "Rankings are based purely on skill. No shortcuts, no pay-to-win." },
  { icon: "🌍", title: "Open Access",   desc: "CodeWeb is free to use. Every problem, every contest — for everyone." },
  { icon: "🔥", title: "Built by Coders", desc: "Every feature is designed by developers, for developers." },
  { icon: "📈", title: "Progress First", desc: "We care about your growth. Track every solved problem and every contest." },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');

        .abt-page { font-family:'DM Mono',monospace; background:#111409; color:#F0EDE6; min-height:100vh; }

        /* HERO */
        .abt-hero { padding:80px 60px; border-bottom:1px solid rgba(106,122,58,0.2); position:relative; overflow:hidden; }
        .abt-hero-glow { position:absolute; top:-80px; right:-100px; width:500px; height:500px; background:radial-gradient(circle,rgba(58,74,30,0.3) 0%,transparent 65%); pointer-events:none; }
        .abt-eyebrow { font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:#6B7A3A; margin-bottom:16px; }
        .abt-hero-title { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(40px,7vw,80px); letter-spacing:-3px; line-height:1.0; color:#F0EDE6; margin-bottom:24px; }
        .abt-hero-title span { color:#C8CFA8; }
        .abt-hero-sub { font-size:14px; color:#6B7A3A; max-width:560px; line-height:1.9; font-weight:300; margin-bottom:36px; }
        .abt-hero-btns { display:flex; gap:14px; flex-wrap:wrap; }
        .abt-btn-primary { padding:12px 28px; background:#3A4A1E; border:1px solid #6B7A3A; border-radius:6px; color:#C8CFA8; font-family:'DM Mono',monospace; font-size:12px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
        .abt-btn-primary:hover { background:#6B7A3A; color:#111409; }
        .abt-btn-outline { padding:12px 28px; background:transparent; border:0.5px solid rgba(200,207,168,0.25); border-radius:6px; color:rgba(240,237,230,0.5); font-family:'DM Mono',monospace; font-size:12px; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; transition:all 0.2s; }
        .abt-btn-outline:hover { border-color:rgba(200,207,168,0.5); color:#C8CFA8; }

        /* MISSION */
        .abt-mission { display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid rgba(106,122,58,0.2); }
        .abt-mission-left { padding:80px 60px; border-right:1px solid rgba(106,122,58,0.2); }
        .abt-mission-right { padding:80px 60px; background:#161a0d; }
        .abt-section-title { font-family:'Syne',sans-serif; font-weight:800; font-size:32px; letter-spacing:-1px; color:#F0EDE6; margin-bottom:20px; }
        .abt-section-title span { color:#C8CFA8; }
        .abt-body-text { font-size:13px; color:#6B7A3A; line-height:2.0; font-weight:300; }
        .abt-quote { font-size:18px; color:#C8CFA8; line-height:1.7; letter-spacing:0.02em; font-weight:300; border-left:2px solid #3A4A1E; padding-left:24px; margin-top:32px; }

        /* VALUES */
        .abt-values-wrap { padding:80px 60px; border-bottom:1px solid rgba(106,122,58,0.2); }
        .abt-values-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:rgba(106,122,58,0.15); border:1px solid rgba(106,122,58,0.2); border-radius:12px; overflow:hidden; margin-top:40px; }
        .abt-value-card { background:#111409; padding:32px 24px; display:flex; flex-direction:column; gap:14px; transition:background 0.2s; }
        .abt-value-card:hover { background:#161a0d; }
        .abt-value-icon { font-size:28px; width:52px; height:52px; background:rgba(58,74,30,0.4); border:0.5px solid rgba(106,122,58,0.3); border-radius:10px; display:flex; align-items:center; justify-content:center; }
        .abt-value-title { font-size:13px; font-weight:500; color:#C8CFA8; }
        .abt-value-desc { font-size:12px; color:#4a5a28; line-height:1.8; font-weight:300; }

        /* TECH */
        .abt-tech-wrap { padding:80px 60px; border-bottom:1px solid rgba(106,122,58,0.2); background:#161a0d; }
        .abt-tech-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-top:40px; }
        .abt-tech-card { padding:24px; background:#111409; border:0.5px solid rgba(106,122,58,0.25); border-radius:10px; display:flex; align-items:center; gap:16px; transition:border-color 0.2s,background 0.2s; }
        .abt-tech-card:hover { background:#1c2210; border-color:rgba(200,207,168,0.3); }
        .abt-tech-icon { font-size:24px; width:44px; height:44px; background:rgba(58,74,30,0.4); border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .abt-tech-name { font-size:13px; color:#C8CFA8; margin-bottom:4px; }
        .abt-tech-desc { font-size:11px; color:#4a5a28; }

        /* TEAM */
        .abt-team-wrap { padding:80px 60px; border-bottom:1px solid rgba(106,122,58,0.2); }
        .abt-team-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; margin-top:40px; max-width:600px; }
        .abt-team-card { padding:28px; background:#161a0d; border:0.5px solid rgba(106,122,58,0.25); border-radius:10px; display:flex; align-items:center; gap:20px; transition:border-color 0.2s; }
        .abt-team-card:hover { border-color:rgba(200,207,168,0.3); }
        .abt-team-avatar { width:52px; height:52px; border-radius:50%; background:#3A4A1E; border:1.5px solid rgba(106,122,58,0.4); display:flex; align-items:center; justify-content:center; font-size:16px; font-weight:500; flex-shrink:0; }
        .abt-team-name { font-size:14px; color:#F0EDE6; margin-bottom:4px; }
        .abt-team-role { font-size:11px; color:#6B7A3A; letter-spacing:0.05em; }

        /* CTA */
        .abt-cta { padding:80px 60px; background:#161a0d; display:flex; align-items:center; justify-content:space-between; gap:40px; }
        .abt-cta-title { font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(28px,4vw,44px); color:#F0EDE6; letter-spacing:-1px; margin-bottom:12px; }
        .abt-cta-title span { color:#C8CFA8; }
        .abt-cta-sub { font-size:13px; color:#6B7A3A; line-height:1.8; }
        .abt-cta-btns { display:flex; gap:12px; flex-shrink:0; }
      `}</style>

      <Navbar />
      <div className="abt-page">

        {/* HERO */}
        <section className="abt-hero">
          <div className="abt-hero-glow" />
          <p className="abt-eyebrow">// about codeweb</p>
          <h1 className="abt-hero-title">
            Built for<br /><span>Coders.</span>
          </h1>
          <p className="abt-hero-sub">
            CodeWeb is a competitive programming platform built by developers, for developers.
            We believe that the best way to grow as a programmer is to solve real problems under real pressure.
          </p>
          <div className="abt-hero-btns">
            <button className="abt-btn-primary" onClick={() => navigate("/Problems")}>Start Solving →</button>
            <button className="abt-btn-outline" onClick={() => navigate("/Contest")}>View Contests</button>
          </div>
        </section>

        {/* MISSION */}
        <div className="abt-mission">
          <div className="abt-mission-left">
            <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B7A3A", marginBottom: 16 }}>// our mission</p>
            <h2 className="abt-section-title">Why we <span>built this.</span></h2>
            <p className="abt-body-text">
              Most competitive programming platforms are either too complex for beginners or too simple for advanced users.
              CodeWeb bridges that gap — offering a clean, fast, and focused environment where every developer can grow at their own pace.
            </p>
            <p className="abt-body-text" style={{ marginTop: 16 }}>
              From your first "Hello World" to competing in timed contests, CodeWeb is designed to grow with you.
              Every feature exists to make you a better programmer.
            </p>
          </div>
          <div className="abt-mission-right">
            <p style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#6B7A3A", marginBottom: 16 }}>// philosophy</p>
            <h2 className="abt-section-title">Code is <span>craft.</span></h2>
            <p className="abt-body-text">
              We believe programming is more than writing code that works.
              It's about writing code that's elegant, efficient, and correct — even under pressure.
            </p>
            <div className="abt-quote">
              "The best way to predict the future is to implement it."
            </div>
          </div>
        </div>

        {/* VALUES */}
        <div className="abt-values-wrap">
          <p className="abt-eyebrow">// core values</p>
          <h2 className="abt-section-title">What we <span>stand for.</span></h2>
          <div className="abt-values-grid">
            {values.map((v, i) => (
              <div className="abt-value-card" key={i}>
                <div className="abt-value-icon">{v.icon}</div>
                <div className="abt-value-title">{v.title}</div>
                <div className="abt-value-desc">{v.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* TECH STACK */}
        <div className="abt-tech-wrap">
          <p className="abt-eyebrow">// tech stack</p>
          <h2 className="abt-section-title">Built with the <span>best tools.</span></h2>
          <div className="abt-tech-grid">
            {tech.map((t, i) => (
              <div className="abt-tech-card" key={i}>
                <div className="abt-tech-icon">{t.icon}</div>
                <div>
                  <div className="abt-tech-name">{t.name}</div>
                  <div className="abt-tech-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TEAM */}
        <div className="abt-team-wrap">
          <p className="abt-eyebrow">// the team</p>
          <h2 className="abt-section-title">Who <span>built this.</span></h2>
          <div className="abt-team-grid">
            {team.map((m, i) => (
              <div className="abt-team-card" key={i}>
                <div className="abt-team-avatar" style={{ color: m.color }}>{m.avatar}</div>
                <div>
                  <div className="abt-team-name">{m.name}</div>
                  <div className="abt-team-role">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="abt-cta">
          <div>
            <h2 className="abt-cta-title">Ready to <span>compete?</span></h2>
            <p className="abt-cta-sub">Join CodeWeb and start your journey today. Free, forever.</p>
          </div>
          <div className="abt-cta-btns">
            <button className="abt-btn-primary" onClick={() => navigate("/Problems")}>Browse Problems →</button>
            <button className="abt-btn-outline" onClick={() => navigate("/Contest")}>View Contests</button>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}