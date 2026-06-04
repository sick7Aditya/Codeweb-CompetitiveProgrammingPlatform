import { useState, useEffect, useRef } from "react";

const NAV_LINKS = {
  Navigate: ["Home", "About", "Contest", "Code", "Contact"],
  Compete: ["Leaderboard", "Past Contests", "Problem Archive", "Rankings"],
  Connect: ["GitHub", "Discord", "LinkedIn", "Twitter"],
};

export default function Footer() {
  const [hoveredLink, setHoveredLink] = useState(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

        :root {
          --linen:      #F0EDE6;
          --olive-dark: #3A4A1E;
          --olive-mid:  #6B7A3A;
          --near-black: #1A1A1A;
          --olive-pale: #C8CFA8;
        }

        .cw-footer * { box-sizing: border-box; margin: 0; padding: 0; }

        .cw-footer {
          background: var(--near-black);
          color: var(--linen);
          font-family: 'DM Mono', monospace;
          overflow: hidden;
          position: relative;
        }

        /* ── grain overlay ── */
        .cw-footer::before {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
          opacity: 0.5;
          z-index: 0;
        }

        /* ── big background text ── */
        .cw-bg-text {
          position: absolute;
          bottom: -30px; left: -10px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(80px, 16vw, 200px);
          color: transparent;
          -webkit-text-stroke: 1px rgba(106,122,58,0.18);
          letter-spacing: -4px;
          user-select: none;
          pointer-events: none;
          white-space: nowrap;
          z-index: 0;
        }

        /* ── intro band ── */
        .cw-intro {
          position: relative; z-index: 1;
          background: var(--olive-dark);
          padding: 56px 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
          border-bottom: 1px solid rgba(200,207,168,0.15);
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .cw-intro.visible { opacity: 1; transform: translateY(0); }

        .cw-logo-mark {
          display: flex; align-items: center; gap: 14px;
        }
        .cw-logo-icon {
          width: 48px; height: 48px;
          background: var(--olive-pale);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }
        .cw-logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 28px;
          color: var(--linen);
          letter-spacing: -0.5px;
        }
        .cw-logo-name span { color: var(--olive-pale); }

        .cw-tagline {
          font-size: 12px;
          color: var(--olive-pale);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .cw-intro-desc {
          font-size: 14px;
          color: rgba(240,237,230,0.65);
          line-height: 1.8;
          font-weight: 300;
          max-width: 400px;
          justify-self: end;
        }
        .cw-intro-desc strong {
          color: var(--olive-pale);
          font-weight: 500;
        }

        /* ── main footer body ── */
        .cw-body {
          position: relative; z-index: 1;
          padding: 60px 60px 0;
          display: grid;
          grid-template-columns: 1.4fr 1fr 1fr 1fr;
          gap: 40px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s;
        }
        .cw-body.visible { opacity: 1; transform: translateY(0); }

        .cw-cta-col {}
        .cw-cta-label {
          font-size: 11px;
          color: var(--olive-mid);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .cw-cta-heading {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: clamp(22px, 3vw, 32px);
          color: var(--linen);
          line-height: 1.2;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }
        .cw-cta-heading em {
          font-style: normal;
          color: var(--olive-pale);
          display: block;
        }

        .cw-cta-btn {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 12px 24px;
          background: var(--olive-pale);
          color: var(--near-black);
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: none; border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
          text-decoration: none;
        }
        .cw-cta-btn:hover {
          background: var(--linen);
          transform: translateY(-2px);
        }
        .cw-cta-btn .arrow {
          transition: transform 0.2s;
        }
        .cw-cta-btn:hover .arrow { transform: translateX(4px); }

        /* nav cols */
        .cw-nav-col {}
        .cw-nav-heading {
          font-size: 10px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--olive-mid);
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(106,122,58,0.3);
        }
        .cw-nav-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .cw-nav-list li a {
          font-size: 13px;
          color: rgba(240,237,230,0.55);
          text-decoration: none;
          display: flex; align-items: center; gap: 8px;
          transition: color 0.2s, gap 0.2s;
          letter-spacing: 0.03em;
        }
        .cw-nav-list li a::before {
          content: '//';
          font-size: 10px;
          color: var(--olive-mid);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .cw-nav-list li a:hover { color: var(--olive-pale); gap: 12px; }
        .cw-nav-list li a:hover::before { opacity: 1; }

        /* ── bottom bar ── */
        .cw-bottom {
          position: relative; z-index: 1;
          margin-top: 60px;
          padding: 20px 60px;
          border-top: 1px solid rgba(106,122,58,0.2);
          display: flex;
          align-items: center;
          justify-content: space-between;
          opacity: 0;
          transition: opacity 0.7s ease 0.4s;
        }
        .cw-bottom.visible { opacity: 1; }

        .cw-copy {
          font-size: 11px;
          color: rgba(240,237,230,0.3);
          letter-spacing: 0.08em;
        }
        .cw-copy span { color: var(--olive-mid); }

        .cw-email {
          font-size: 12px;
          color: rgba(240,237,230,0.4);
          text-decoration: none;
          letter-spacing: 0.05em;
          transition: color 0.2s;
        }
        .cw-email:hover { color: var(--olive-pale); }

        .cw-status {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px;
          color: rgba(240,237,230,0.3);
          letter-spacing: 0.08em;
        }
        .cw-status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #a6e3a1;
          box-shadow: 0 0 6px #a6e3a1;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        @media (max-width: 900px) {
          .cw-intro { grid-template-columns: 1fr; padding: 40px 30px; }
          .cw-intro-desc { justify-self: start; }
          .cw-body { grid-template-columns: 1fr 1fr; padding: 40px 30px 0; }
          .cw-bottom { padding: 20px 30px; flex-wrap: wrap; gap: 12px; }
        }
        @media (max-width: 560px) {
          .cw-body { grid-template-columns: 1fr; }
        }
      `}</style>

      <footer className="cw-footer" ref={ref}>
        <div className="cw-bg-text">CODEWEB</div>

        {/* ── Intro Band ── */}
        <div className={`cw-intro ${visible ? "visible" : ""}`}>
          <div>
            <div className="cw-logo-mark">
              <div className="cw-logo-icon">⚔️</div>
              <div>
                <div className="cw-logo-name">Code<span>Web</span></div>
                <div className="cw-tagline">Compete · Code · Conquer</div>
              </div>
            </div>
          </div>
          <p className="cw-intro-desc">
            <strong>CodeWeb</strong> is your arena for competitive programming contests.
            Sharpen your skills, climb the ranks, and go head-to-head with coders
            around the world — one problem at a time.
          </p>
        </div>

        {/* ── Main Body ── */}
        <div className={`cw-body ${visible ? "visible" : ""}`}>
          {/* CTA col */}
          <div className="cw-cta-col">
            <div className="cw-cta-label">Ready to compete?</div>
            <h2 className="cw-cta-heading">
              Join the next
              <em>contest.</em>
            </h2>
            <a href="#" className="cw-cta-btn">
              Enter Now <span className="arrow">→</span>
            </a>
          </div>

          {/* Nav cols */}
          {Object.entries(NAV_LINKS).map(([heading, links]) => (
            <div className="cw-nav-col" key={heading}>
              <div className="cw-nav-heading">{heading}</div>
              <ul className="cw-nav-list">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      onMouseEnter={() => setHoveredLink(link)}
                      onMouseLeave={() => setHoveredLink(null)}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mail.... */}
        <div className={`cw-bottom ${visible ? "visible" : ""}`}>
          <span className="cw-copy">
            © 2025 <span>CodeWeb</span>. All rights reserved.
          </span>
          <a href="mailto:adityasingh60908@gmail.com" className="cw-email">
            hello@codeweb.io
          </a>
          <div className="cw-status">
            <div className="cw-status-dot" />
            all systems operational
          </div>
        </div>
      </footer>
    </>
  );
}