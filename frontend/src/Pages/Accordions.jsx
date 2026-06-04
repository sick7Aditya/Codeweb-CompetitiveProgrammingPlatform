import { useState } from "react";

const FAQS = [
  {
    q: "What is CodeWeb?",
    a: "CodeWeb is a competitive programming platform where you can participate in timed contests, solve algorithmic problems, and climb the global leaderboard. Whether you're a beginner or a seasoned coder, there's a challenge waiting for you.",
  },
  {
    q: "How do I join a contest?",
    a: "Simply create an account, head to the Contests page, and hit Register on any upcoming contest. You'll get a reminder before it starts. During the contest, submit your solutions directly in our built-in code editor.",
  },
  {
    q: "What programming languages are supported?",
    a: "We currently support Java, Python, and C++ in our code runner — powered by the Judge0 engine. More languages like Kotlin, Rust, and Go are coming soon.",
  },
  {
    q: "How is scoring calculated?",
    a: "Each problem has a point value based on difficulty. Your score is determined by correctness and, in timed contests, submission speed. Partial scoring is available on selected problems.",
  },
  {
    q: "Can I practice outside of contests?",
    a: "Absolutely. The Problem Archive is open 24/7. Filter by topic, difficulty, or tag and grind at your own pace. Your submissions are tracked and contribute to your profile stats.",
  },
  {
    q: "Is CodeWeb free to use?",
    a: "Yes — CodeWeb is completely free. All contests, problems, and the code editor are available to every registered user at no cost.",
  },
];

export default function Accordions() {
  const [open, setOpen] = useState(null);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Mono:wght@300;400;500&display=swap');

        :root {
          --linen:      #F0EDE6;
          --olive-dark: #3A4A1E;
          --olive-mid:  #6B7A3A;
          --olive-pale: #C8CFA8;
          --near-black: #1A1A1A;
        }

        .faq-section {
          background: var(--near-black);
          padding: 100px 60px;
          font-family: 'DM Mono', monospace;
          position: relative;
          overflow: hidden;
        }

        .faq-section::before {
          content: 'FAQ';
          position: absolute;
          right: -20px; top: 20px;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(80px, 14vw, 180px);
          color: transparent;
          -webkit-text-stroke: 1px rgba(106,122,58,0.1);
          pointer-events: none;
          user-select: none;
          letter-spacing: -4px;
        }

        .faq-inner {
          max-width: 860px;
          margin: 0 auto;
          position: relative; z-index: 1;
        }

        .faq-eyebrow {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--olive-mid);
          margin-bottom: 16px;
        }

        .faq-heading {
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: clamp(28px, 5vw, 48px);
          color: var(--linen);
          line-height: 1.1;
          letter-spacing: -1px;
          margin-bottom: 60px;
        }
        .faq-heading span { color: var(--olive-pale); }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 0;
          border-top: 1px solid rgba(106,122,58,0.2);
        }

        .faq-item {
          border-bottom: 1px solid rgba(106,122,58,0.2);
          overflow: hidden;
        }

        .faq-trigger {
          width: 100%;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 28px 0;
          cursor: pointer;
          text-align: left;
          transition: background 0.2s;
        }
        .faq-trigger:hover .faq-q { color: var(--olive-pale); }

        .faq-q {
          font-family: 'DM Mono', monospace;
          font-size: 15px;
          font-weight: 500;
          color: var(--linen);
          letter-spacing: 0.02em;
          transition: color 0.2s;
          flex: 1;
        }
        .faq-q.open { color: var(--olive-pale); }

        .faq-icon {
          width: 32px; height: 32px;
          flex-shrink: 0;
          border-radius: 50%;
          border: 1px solid rgba(106,122,58,0.4);
          display: flex; align-items: center; justify-content: center;
          color: var(--olive-mid);
          font-size: 18px;
          font-weight: 300;
          transition: all 0.3s ease;
          background: rgba(58,74,30,0.2);
        }
        .faq-icon.open {
          background: var(--olive-dark);
          border-color: var(--olive-mid);
          color: var(--olive-pale);
          transform: rotate(45deg);
        }

        .faq-body {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.35s ease;
        }
        .faq-body.open {
          grid-template-rows: 1fr;
        }

        .faq-body-inner {
          overflow: hidden;
        }

        .faq-a {
          padding: 0 48px 28px 0;
          font-size: 13px;
          line-height: 1.85;
          color: rgba(240,237,230,0.55);
          font-weight: 300;
          letter-spacing: 0.02em;
          border-left: 2px solid var(--olive-dark);
          padding-left: 20px;
          margin-left: 2px;
        }

        @media (max-width: 600px) {
          .faq-section { padding: 60px 24px; }
          .faq-q { font-size: 13px; }
        }
      `}</style>

      <section className="faq-section">
        <div className="faq-inner">
          <p className="faq-eyebrow">// got questions?</p>
          <h2 className="faq-heading">
            Frequently<br />
            <span>Asked.</span>
          </h2>

          <div className="faq-list">
            {FAQS.map((faq, i) => {
              const isOpen = open === i;
              return (
                <div className="faq-item" key={i}>
                  <button
                    className="faq-trigger"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <span className={`faq-q ${isOpen ? 'open' : ''}`}>
                      <span style={{ color: 'var(--olive-mid)', marginRight: 12 }}>
                        {String(i + 1).padStart(2, '0')}.
                      </span>
                      {faq.q}
                    </span>
                    <div className={`faq-icon ${isOpen ? 'open' : ''}`}>+</div>
                  </button>

                  <div className={`faq-body ${isOpen ? 'open' : ''}`}>
                    <div className="faq-body-inner">
                      <p className="faq-a">{faq.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}