import React, { useState, useRef } from 'react';
import Navbar from '../Pages/Navbar';

const LANGUAGE_IDS = { java: 62, python: 71, cpp: 54, c: 50 };

const BOILERPLATES = {
    python: `# your code here\nprint("Hello, CodeWeb!")`,
    java:   `public class Main {\n    public static void main(String[] args) {\n        // your code here\n        System.out.println("Hello, CodeWeb!");\n    }\n}`,
    cpp:    `#include <iostream>\nusing namespace std;\nint main() {\n    // your code here\n    cout << "Hello, CodeWeb!" << endl;\n    return 0;\n}`,
    c:      `#include <stdio.h>\nint main() {\n    // your code here\n    printf("Hello, CodeWeb!\\n");\n    return 0;\n}`,
};

const LANG_META = {
    python: { label: "Python", ext: "py",   color: "#a8c97f" },
    java:   { label: "Java",   ext: "java", color: "#f0c674" },
    cpp:    { label: "C++",    ext: "cpp",  color: "#C8CFA8" },
    c:      { label: "C",      ext: "c",    color: "#89b4fa" },
};

const API_KEY  = 'cf19efabb9mshf0671ae1433f882p1fb0b2jsnff89ecebebb6';
const API_HOST = import.meta.env.VITE_JUDGE0_API_HOST || 'judge029.p.rapidapi.com';

export default function Code() {
    const [language, setLanguage]   = useState('python');
    const [code, setCode]           = useState(BOILERPLATES['python']);
    const [input, setInput]         = useState('');
    const [output, setOutput]       = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [status, setStatus]       = useState('idle');
    const textareaRef               = useRef(null);
    const lineRef                   = useRef(null);

    const lines = code.split('\n');

    function syncScroll() {
        if (lineRef.current && textareaRef.current) {
            lineRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    }

    function handleLangChange(lang) {
        setLanguage(lang);
        setCode(BOILERPLATES[lang]);
        setOutput('');
        setStatus('idle');
    }

    async function runCode() {
        setIsRunning(true);
        setStatus('running');
        setOutput('');

        try {
            const submitRes = await fetch(
                `https://${API_HOST}/submissions?base64_encoded=false&wait=false`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':    'application/json',
                        'X-RapidAPI-Key':  API_KEY,
                        'X-RapidAPI-Host': API_HOST,
                    },
                    body: JSON.stringify({
                        source_code:  code,
                        language_id:  LANGUAGE_IDS[language],
                        stdin:        input,
                    }),
                }
            );

            const { token } = await submitRes.json();
            if (!token) {
                setOutput('Error: No token received.');
                setStatus('error');
                return;
            }

            let result = null;
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 1000));
                const pollRes = await fetch(
                    `https://${API_HOST}/submissions/${token}?base64_encoded=false`,
                    { headers: { 'X-RapidAPI-Key': API_KEY, 'X-RapidAPI-Host': API_HOST } }
                );
                result = await pollRes.json();
                if (result.status?.id > 2) break;
            }

            const out = result?.stdout || result?.stderr || result?.compile_output || result?.message || 'No output';
            setOutput(out);
            setStatus(result?.stderr || result?.compile_output ? 'error' : 'success');

        } catch (err) {
            setOutput(`Error: ${err.message}`);
            setStatus('error');
        } finally {
            setIsRunning(false);
        }
    }

    const accentColor = LANG_META[language].color;

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');

                .code-page {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                    background: #111409;
                    font-family: 'DM Mono', monospace;
                    color: #F0EDE6;
                    overflow: hidden;
                }

                /* ── TOPBAR ── */
                .code-topbar {
                    display: flex;
                    align-items: center;
                    gap: 0;
                    height: 48px;
                    background: #161a0d;
                    border-bottom: 1px solid rgba(106,122,58,0.25);
                    flex-shrink: 0;
                }

                .code-lang-tabs {
                    display: flex;
                    height: 100%;
                }

                .code-lang-tab {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 22px;
                    height: 100%;
                    background: transparent;
                    border: none;
                    border-right: 1px solid rgba(106,122,58,0.2);
                    border-bottom: 2px solid transparent;
                    color: #3A4A1E;
                    font-family: 'DM Mono', monospace;
                    font-size: 12px;
                    letter-spacing: 0.08em;
                    cursor: pointer;
                    transition: all 0.18s;
                }
                .code-lang-tab:hover { color: #6B7A3A; background: rgba(58,74,30,0.2); }
                .code-lang-tab.active {
                    color: #F0EDE6;
                    background: #111409;
                    border-bottom-color: var(--lang-color, #C8CFA8);
                }

                .code-lang-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: currentColor;
                    opacity: 0.6;
                    flex-shrink: 0;
                }
                .code-lang-tab.active .code-lang-dot { opacity: 1; }

                .code-topbar-right {
                    margin-left: auto;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 0 20px;
                }

                .code-file-pill {
                    font-size: 11px;
                    color: #3A4A1E;
                    letter-spacing: 0.05em;
                    padding: 4px 10px;
                    background: rgba(58,74,30,0.2);
                    border: 0.5px solid rgba(106,122,58,0.2);
                    border-radius: 4px;
                }

                .code-run-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 7px 20px;
                    background: #3A4A1E;
                    border: 1px solid #6B7A3A;
                    border-radius: 6px;
                    color: #C8CFA8;
                    font-family: 'DM Mono', monospace;
                    font-size: 11px;
                    font-weight: 500;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .code-run-btn:hover:not(:disabled) {
                    background: #6B7A3A;
                    color: #111409;
                    box-shadow: 0 0 18px rgba(106,122,58,0.4);
                }
                .code-run-btn:disabled { opacity: 0.45; cursor: not-allowed; }

                .code-spinner {
                    width: 11px;
                    height: 11px;
                    border: 2px solid rgba(200,207,168,0.2);
                    border-top-color: #C8CFA8;
                    border-radius: 50%;
                    animation: codespin 0.7s linear infinite;
                }
                @keyframes codespin { to { transform: rotate(360deg); } }

                /* ── WORKSPACE ── */
                .code-workspace {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    flex: 1;
                    overflow: hidden;
                    min-height: 0;
                }

                /* ── EDITOR ── */
                .code-editor-pane {
                    display: flex;
                    border-right: 1px solid rgba(106,122,58,0.25);
                    overflow: hidden;
                    background: #0f1107;
                    position: relative;
                }

                .code-line-nums {
                    width: 52px;
                    flex-shrink: 0;
                    background: #0e1108;
                    border-right: 1px solid rgba(106,122,58,0.1);
                    padding: 20px 0;
                    overflow: hidden;
                    user-select: none;
                }

                .code-line-num {
                    display: block;
                    text-align: right;
                    padding-right: 14px;
                    font-size: 12px;
                    line-height: 1.7;
                    color: #2a3516;
                    font-family: 'DM Mono', monospace;
                }

                .code-textarea {
                    flex: 1;
                    padding: 20px 20px 20px 16px;
                    background: transparent;
                    border: none;
                    resize: none;
                    font-family: 'DM Mono', monospace;
                    font-size: 13px;
                    line-height: 1.7;
                    color: #e8e0d0;
                    caret-color: #C8CFA8;
                    outline: none;
                    tab-size: 4;
                    overflow: auto;
                }
                .code-textarea::-webkit-scrollbar { width: 5px; }
                .code-textarea::-webkit-scrollbar-thumb { background: #2a3516; border-radius: 3px; }
                .code-textarea::selection { background: rgba(106,122,58,0.3); }

                /* ── RIGHT PANEL ── */
                .code-right {
                    display: flex;
                    flex-direction: column;
                    background: #111409;
                    overflow: hidden;
                }

                .code-panel-head {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: #161a0d;
                    border-bottom: 1px solid rgba(106,122,58,0.2);
                    font-size: 10px;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: #6B7A3A;
                    flex-shrink: 0;
                }

                .code-panel-dot {
                    width: 5px;
                    height: 5px;
                    border-radius: 50%;
                    background: #6B7A3A;
                    flex-shrink: 0;
                }

                .code-stdin {
                    display: flex;
                    flex-direction: column;
                    flex: 0 0 38%;
                    border-bottom: 1px solid rgba(106,122,58,0.2);
                    overflow: hidden;
                    min-height: 0;
                }

                .code-stdout {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    overflow: hidden;
                    min-height: 0;
                }

                .code-io-textarea {
                    flex: 1;
                    background: transparent;
                    border: none;
                    resize: none;
                    padding: 14px 16px;
                    font-family: 'DM Mono', monospace;
                    font-size: 12px;
                    line-height: 1.65;
                    outline: none;
                    color: rgba(240,237,230,0.7);
                    caret-color: #C8CFA8;
                    overflow: auto;
                    min-height: 0;
                }
                .code-io-textarea::placeholder { color: #2a3516; }
                .code-io-textarea::-webkit-scrollbar { width: 4px; }
                .code-io-textarea::-webkit-scrollbar-thumb { background: #2a3516; border-radius: 2px; }

                /* ── STATUS BAR ── */
                .code-statusbar {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 0 24px;
                    height: 30px;
                    background: #161a0d;
                    border-top: 1px solid rgba(106,122,58,0.2);
                    font-size: 11px;
                    letter-spacing: 0.08em;
                    color: #3A4A1E;
                    flex-shrink: 0;
                }

                .code-status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    flex-shrink: 0;
                    transition: background 0.3s, box-shadow 0.3s;
                }

                .code-statusbar-right {
                    margin-left: auto;
                    display: flex;
                    gap: 20px;
                    align-items: center;
                }

                .code-statusbar-divider {
                    width: 1px;
                    height: 12px;
                    background: rgba(106,122,58,0.2);
                }

                /* output color */
                .output-success { color: #a6e3a1; }
                .output-error   { color: #c97a6a; }
                .output-idle    { color: rgba(240,237,230,0.4); }

                @keyframes codefadein {
                    from { opacity: 0; transform: translateY(4px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .output-appear { animation: codefadein 0.25s ease; }
            `}</style>

            <Navbar />

            <div className="code-page">

                {/* ── TOPBAR ── */}
                <div className="code-topbar">
                    <div className="code-lang-tabs">
                        {Object.entries(LANG_META).map(([lang, meta]) => (
                            <button
                                key={lang}
                                className={`code-lang-tab ${language === lang ? 'active' : ''}`}
                                style={{ '--lang-color': meta.color }}
                                onClick={() => handleLangChange(lang)}>
                                <span className="code-lang-dot" style={{ background: meta.color }} />
                                {meta.label}
                            </button>
                        ))}
                    </div>

                    <div className="code-topbar-right">
                        <span className="code-file-pill">
                            main.{LANG_META[language].ext}
                        </span>

                        <button className="code-run-btn" onClick={runCode} disabled={isRunning}>
                            {isRunning
                                ? <><div className="code-spinner" /> Executing</>
                                : <><span>▶</span> Run Code</>
                            }
                        </button>
                    </div>
                </div>

                {/* ── WORKSPACE ── */}
                <div className="code-workspace">

                    {/* Editor */}
                    <div className="code-editor-pane">
                        <div className="code-line-nums" ref={lineRef}>
                            {lines.map((_, i) => (
                                <span key={i} className="code-line-num">{i + 1}</span>
                            ))}
                        </div>

                        <textarea
                            className="code-textarea"
                            ref={textareaRef}
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            onScroll={syncScroll}
                            spellCheck="false"
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                        />
                    </div>

                    {/* Right Panel */}
                    <div className="code-right">

                        {/* stdin */}
                        <div className="code-stdin">
                            <div className="code-panel-head">
                                <div className="code-panel-dot" />
                                stdin
                            </div>
                            <textarea
                                className="code-io-textarea"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="// input goes here..."
                                spellCheck="false"
                            />
                        </div>

                        {/* stdout */}
                        <div className="code-stdout">
                            <div className="code-panel-head">
                                <div className="code-panel-dot" style={{
                                    background:
                                        status === 'error'   ? '#c97a6a' :
                                        status === 'success' ? '#a6e3a1' : '#6B7A3A',
                                }} />
                                stdout
                                {output && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        fontSize: '10px',
                                        color: status === 'error' ? '#c97a6a' : '#a6e3a1'
                                    }}>
                                        {status === 'error' ? '✗ error' : '✓ ok'}
                                    </span>
                                )}
                            </div>
                            <textarea
                                className={`code-io-textarea ${
                                    output ? 'output-appear' : ''
                                } ${
                                    status === 'success' ? 'output-success' :
                                    status === 'error'   ? 'output-error'   : 'output-idle'
                                }`}
                                value={output}
                                readOnly
                                placeholder="// output appears here..."
                            />
                        </div>
                    </div>
                </div>

                {/* ── STATUS BAR ── */}
                <div className="code-statusbar">
                    <div className="code-status-dot" style={{
                        background:
                            status === 'running' ? '#f0c674' :
                            status === 'success' ? '#a6e3a1' :
                            status === 'error'   ? '#c97a6a' : 'rgba(106,122,58,0.3)',
                        boxShadow:
                            status === 'running' ? '0 0 8px #f0c674' :
                            status === 'success' ? '0 0 8px #a6e3a1' : 'none',
                    }} />
                    <span>
                        {status === 'idle'    ? '// ready'               :
                         status === 'running' ? '// executing...'        :
                         status === 'success' ? '// finished'            :
                                               '// finished with errors' }
                    </span>

                    <div className="code-statusbar-right">
                        <span style={{ color: LANG_META[language].color, letterSpacing: '0.05em' }}>
                            {LANG_META[language].label}
                        </span>
                        <div className="code-statusbar-divider" />
                        <span>judge0</span>
                        <div className="code-statusbar-divider" />
                        <span>utf-8</span>
                    </div>
                </div>
            </div>
        </>
    );
}