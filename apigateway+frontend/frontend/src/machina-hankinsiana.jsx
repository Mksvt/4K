import React, { useState, useEffect } from 'react';
import { Copy, ChevronDown, ChevronUp, Shuffle } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim();
const apiUrl = (path) => {
  if (!API_BASE_URL) return path;
  const base = API_BASE_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
};

const MacchinaHankinsiana = () => {
  const [input, setInput] = useState('');
  
  // Оновлені значення за замовчуванням (повні назви для кращого розуміння AI)
  const [format, setFormat] = useState('Email Response');
  const [era, setEra] = useState('Late Hankins (2019+)');
  
  const [output, setOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [token] = useState(() => localStorage.getItem('mh_token') || '');
  const [showPrompt, setShowPrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]); // Додано ініціалізацію масиву історії
  const [expandedHistory, setExpandedHistory] = useState({});
  const [copied, setCopied] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);

  const randomize = () => {
    const formats = ['Email Response', 'Conversational Feedback', 'Answer a Question'];
    const eras = ['Early Hankins (1990s)', 'Mid Hankins (2000s-2010s)', 'Late Hankins (2019+)'];
    setFormat(formats[Math.floor(Math.random() * formats.length)]);
    setEra(eras[Math.floor(Math.random() * eras.length)]);
  };

  const toggleHistoryItem = (id) => {
    setExpandedHistory((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(apiUrl('/history'), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setHistoryData(data.history || []);
      } else {
        console.error('Failed to fetch history:', data.error);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  useEffect(() => {
    fetchHistory(); // Load history on component mount
  }, []);

  const generateResponse = async () => {
    if (!input.trim() || isGenerating) return;

    if (!token) {
      setOutput('Error: Unauthorized. Please enter password first.');
      return;
    }

    setIsGenerating(true);
    setOutput('');

    try {
      const response = await fetch(apiUrl('/api/chatmessage'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: input.trim(),
          sessionId: sessionId,
          responseFormat: format, // ВИПРАВЛЕНО: передаємо як responseFormat
          phase: era,             // ВИПРАВЛЕНО: передаємо як phase
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Підтримуємо і answer (від Python) і response (старий формат)
        setOutput(data.answer || data.response || '');
        fetchHistory(); // Refresh history after generating response
      } else {
        setOutput(`Error: ${data.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      setOutput(`Connection error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const examplePrompt = `SYSTEM PROMPT - MACHINA HANKINSIANA

You are simulating Professor James Hankins at different career stages.

[This is a simplified demo. Full production prompt includes:]

VOICE CHARACTERISTICS BY ERA:
- Early (1990s): Cautious, methodologically defensive, heavy footnoting style
- Mid (2000s-2010s): Confident, analytical, collegial
- Late (2019+): Bold, polemical, claims originality, impatient with field

KNOWLEDGE BASE INTEGRATION:
- Reference specific published works when relevant
- Cite passages from his scholarship
- Draw on full corpus of writings

CHARACTERISTIC PATTERNS:
- Opening strategies, argumentative moves
- Favorite phrases and rhetorical devices
- Scholarly personality and foibles
- Appropriate use of humor

EASTER EGG TRIGGERS:
- Keywords activate contextual references
- "British barbarians," scholastics, Florence libraries
- Complaints about theoretical abstraction, Anglophone scholarship
- Frequency adjusted by era`;

  return (
    <div
      className="min-h-screen bg-[#f5f1e8] p-4 md:p-8"
      style={{
        backgroundImage: `
        linear-gradient(rgba(245, 241, 232, 0.95), rgba(245, 241, 232, 0.95)),
        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b8956a' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
      `,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Spectral:wght@400;600;700&display=swap');
        
        * {
          font-family: 'Spectral', serif;
        }
        
        .title-font {
          font-family: 'Cormorant Garamond', serif;
          letter-spacing: 0.02em;
        }
        
        .output-text {
          line-height: 1.85;
          font-size: 1.0625rem;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .fade-in {
          animation: fadeIn 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .slide-in {
          animation: slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .parchment-shadow {
          box-shadow: 
            0 1px 3px rgba(120, 80, 40, 0.12),
            0 1px 2px rgba(120, 80, 40, 0.08),
            inset 0 0 0 1px rgba(184, 149, 106, 0.1);
        }
        
        .parchment-shadow-lg {
          box-shadow: 
            0 10px 25px rgba(120, 80, 40, 0.12),
            0 4px 10px rgba(120, 80, 40, 0.08),
            inset 0 0 0 1px rgba(184, 149, 106, 0.15);
        }
        
        .ornament {
          width: 80px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #8b6f47, transparent);
        }

        /* Layout helpers (avoid Tailwind responsive variants) */
        .mh-controls {
          display: grid;
          grid-template-columns: 1fr;
          gap: 22px;
          margin-bottom: 28px;
        }

        @media (min-width: 900px) {
          .mh-controls {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
        }

        .mh-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .mh-btn {
          height: 56px;
        }

        .mh-btn-generate {
          flex: 1;
        }

        .mh-btn-surprise {
          width: 190px;
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12 md:mb-16 fade-in">
          <h1 className="title-font text-5xl md:text-7xl font-bold text-[#4a3526] mb-4 tracking-wide">
            Machina Hankinsiana
          </h1>
          <div className="ornament mx-auto mb-6"></div>
        </header>

        {/* Instructions Placeholder */}
        <div className="bg-[#fdfbf7]/60 rounded-lg p-8 mb-8 text-center border border-[#e5d9c3] fade-in">
          <h2 className="text-2xl font-semibold text-[#6b5744] mb-3 title-font">
            [Placeholder for Instructions]
          </h2>
          <p className="text-[#8b7355] italic">
            Copy for instructions will be provided
          </p>
        </div>

        {/* Note */}
        <div className="bg-[#faf7f2] border-l-4 border-[#c4b298] p-5 mb-8 rounded-r">
          <p className="text-sm text-[#6b5744] leading-relaxed">
            <span className="font-semibold">Note:</span> This AI simulation can
            make mistakes and is not a perfect replication. Professor James
            Hankins is irreplaceable—this is merely a tribute to his scholarship
            and mentorship.
          </p>
        </div>

        {/* Main Interface */}
        <div className="bg-[#fdfbf7] rounded-lg parchment-shadow-lg p-6 md:p-10 mb-6 slide-in border-2 border-[#d4c4a8]">
          {/* Input Area */}
          <div className="mb-8">
            <label className="block text-[#4a3526] font-semibold mb-3 text-lg title-font">
              What do you want to send to MH?
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste your work, ask a question, or share your thoughts..."
              className="w-full h-56 p-5 border-2 border-[#d4c4a8] rounded-md focus:border-[#8b6f47] focus:outline-none resize-none bg-white text-[#3a2a1a] placeholder-[#a89278] transition-all duration-200"
              style={{ lineHeight: '1.7' }}
            />
          </div>

          {/* Controls */}
          <div className="mh-controls">
            <div>
              <label className="block text-[#4a3526] font-medium mb-2">
                Response Format
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full p-3.5 border-2 border-[#d4c4a8] rounded-md focus:border-[#8b6f47] focus:outline-none bg-white text-[#3a2a1a] cursor-pointer transition-all duration-200 hover:border-[#a89278]"
              >
                {/* Оновлені значення value для інтеграції з AI */}
                <option value="Email Response">Email Response</option>
                <option value="Conversational Feedback">Conversational Feedback</option>
                <option value="Answer a Question">Answer a Question</option>
              </select>
            </div>

            <div>
              <label className="block text-[#4a3526] font-medium mb-2">
                Phase
              </label>
              <select
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="w-full p-3.5 border-2 border-[#d4c4a8] rounded-md focus:border-[#8b6f47] focus:outline-none bg-white text-[#3a2a1a] cursor-pointer transition-all duration-200 hover:border-[#a89278]"
              >
                {/* Оновлені значення value для інтеграції з AI */}
                <option value="Early Hankins (1990s)">Early Hankins (1990s)</option>
                <option value="Mid Hankins (2000s-2010s)">Mid Hankins (2000s-2010s)</option>
                <option value="Late Hankins (2019+)">Late Hankins (2019+)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mh-actions">
            <button
              onClick={generateResponse}
              disabled={!input.trim() || isGenerating}
              className="mh-btn mh-btn-generate bg-[#f5f1e8] text-[#8b7355] px-8 rounded-md font-medium border-2 border-[#d4c4a8] hover:bg-[#efe7d9] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 parchment-shadow title-font text-lg"
            >
              {isGenerating ? 'Generating Commentary...' : 'Generate Response'}
            </button>
            <button
              onClick={randomize}
              className="mh-btn mh-btn-surprise bg-[#f5f1e8] text-[#4a3526] px-6 rounded-md hover:bg-[#efe7d9] transition-all duration-200 parchment-shadow flex items-center justify-center gap-2 font-medium border-2 border-[#d4c4a8]"
              title="Randomize settings"
            >
              <Shuffle size={20} />
              <span>Surprise Me</span>
            </button>
          </div>
        </div>

        {/* Output */}
        {output && (
          <div className="bg-[#fdfbf7] rounded-lg parchment-shadow-lg p-6 md:p-10 mb-6 fade-in border-2 border-[#d4c4a8]">
            <div className="flex justify-between items-start mb-6 pb-4 border-b border-[#d4c4a8]">
              <h2 className="title-font text-3xl font-bold text-[#4a3526]">
                Response
              </h2>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 text-[#6b5233] hover:text-[#4a3526] transition-colors font-medium"
              >
                <Copy size={18} />
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="output-text text-[#3a2a1a] whitespace-pre-wrap">
              {output}
            </div>
          </div>
        )}

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {/* History of Prior Submissions */}
          <div className="bg-[#fdfbf7]/80 backdrop-blur-sm rounded-lg parchment-shadow border border-[#d4c4a8] overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full px-6 py-5 flex justify-between items-center hover:bg-[#f5f1e8]/50 transition-colors"
            >
              <span className="font-semibold text-[#4a3526] title-font text-lg">
                History of Prior Submissions
              </span>
              {showHistory ? (
                <ChevronUp className="text-[#6b5233]" />
              ) : (
                <ChevronDown className="text-[#6b5233]" />
              )}
            </button>
            {showHistory && (
              <div className="border-t border-[#d4c4a8] overflow-x-auto">
                <table
                  className="w-full"
                  style={{ minWidth: 980, borderCollapse: 'collapse' }}
                >
                  <thead>
                    <tr
                      className="text-sm font-semibold text-[#4a3526]"
                      style={{ borderBottom: '1px solid #d4c4a8' }}
                    >
                      <th className="text-left px-6 py-4">Date</th>
                      <th className="text-left px-6 py-4">
                        Submission Preview
                      </th>
                      <th className="text-left px-6 py-4">Response Preview</th>
                      <th className="text-left px-6 py-4">Format</th>
                      <th className="text-left px-6 py-4">Phase</th>
                      <th className="px-6 py-4" style={{ width: 44 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyData && historyData.length > 0 ? (
                      historyData.map((item) => (
                        <React.Fragment key={item.id}>
                          <tr
                            className="text-sm text-[#3a2a1a]"
                            style={{ borderBottom: '1px solid #e5d9c3' }}
                          >
                            <td className="px-6 py-4">{item.date}</td>
                            <td className="px-6 py-4">
                              {item.submissionPreview}
                            </td>
                            <td className="px-6 py-4">{item.responsePreview}</td>
                            <td className="px-6 py-4">{item.format}</td>
                            <td className="px-6 py-4">{item.phase}</td>
                            <td
                              className="px-6 py-4"
                              style={{ textAlign: 'right' }}
                            >
                              <button
                                type="button"
                                onClick={() => toggleHistoryItem(item.id)}
                                className="inline-flex items-center justify-center"
                                aria-label={
                                  expandedHistory[item.id]
                                    ? 'Collapse history row'
                                    : 'Expand history row'
                                }
                              >
                                {expandedHistory[item.id] ? (
                                  <ChevronUp
                                    size={18}
                                    className="text-[#6b5233]"
                                  />
                                ) : (
                                  <ChevronDown
                                    size={18}
                                    className="text-[#6b5233]"
                                  />
                                )}
                              </button>
                            </td>
                          </tr>

                          {expandedHistory[item.id] && (
                            <tr style={{ borderBottom: '1px solid #e5d9c3' }}>
                              <td
                                colSpan={6}
                                className="px-6 py-6"
                                style={{ background: '#faf7f2' }}
                              >
                                <div className="space-y-6">
                                  <div>
                                    <div
                                      className="flex items-center gap-4 mb-3"
                                      style={{ flexWrap: 'wrap' }}
                                    >
                                      <div className="font-semibold text-[#4a3526]">
                                        Original Submission
                                      </div>
                                      <div className="text-sm text-[#6b5744]">
                                        {item.format}
                                      </div>
                                      <div className="text-sm text-[#6b5744]">
                                        {item.phaseLabel || item.phase}
                                      </div>
                                    </div>
                                    <div
                                      className="text-[#3a2a1a] leading-relaxed"
                                      style={{
                                        background: 'rgba(255,255,255,0.75)',
                                        padding: 16,
                                        border: '1px solid #e5d9c3',
                                        borderRadius: 6,
                                      }}
                                    >
                                      {item.submissionFull}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="font-semibold text-[#4a3526] mb-3">
                                      MH Response
                                    </div>
                                    <div
                                      className="text-[#3a2a1a] leading-relaxed"
                                      style={{
                                        background: 'rgba(255,255,255,0.75)',
                                        padding: 16,
                                        border: '1px solid #e5d9c3',
                                        borderRadius: 6,
                                      }}
                                    >
                                      {item.responseFull}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-[#8b7355] italic">
                          No history available yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Chat History (Alternative View) */}
          {showHistory && historyData && historyData.length > 0 && (
            <div className="bg-[#fdfbf7] rounded-lg parchment-shadow-lg p-6 md:p-10 mb-6 slide-in border-2 border-[#d4c4a8] mt-6">
              <h2 className="text-2xl font-semibold text-[#6b5744] mb-4 title-font">
                Chat History Summary
              </h2>
              <ul className="space-y-4">
                {historyData.map((item) => (
                  <li
                    key={`summary-${item.id}`}
                    className="border-b border-[#d4c4a8] pb-4"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[#4a3526] font-medium">
                          {item.date} - {item.phaseLabel || item.phase}
                        </p>
                        <p className="text-[#8b7355] italic">{item.format}</p>
                      </div>
                      <button
                        onClick={() => toggleHistoryItem(`summary-${item.id}`)}
                        className="text-[#8b6f47] hover:underline"
                      >
                        {expandedHistory[`summary-${item.id}`] ? 'Hide' : 'Show'} Details
                      </button>
                    </div>
                    {expandedHistory[`summary-${item.id}`] && (
                      <div className="mt-4">
                        <p className="text-[#4a3526] font-semibold mb-2">
                          Submission:
                        </p>
                        <p className="text-[#3a2a1a] mb-4">
                          {item.submissionFull}
                        </p>
                        <p className="text-[#4a3526] font-semibold mb-2">
                          Response:
                        </p>
                        <p className="text-[#3a2a1a]">{item.responseFull}</p>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* System Prompt */}
          <div className="bg-[#fdfbf7]/80 backdrop-blur-sm rounded-lg parchment-shadow border border-[#d4c4a8] overflow-hidden">
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              className="w-full px-6 py-5 flex justify-between items-center hover:bg-[#f5f1e8]/50 transition-colors"
            >
              <span className="font-semibold text-[#4a3526] title-font text-lg">
                View System Prompt
              </span>
              {showPrompt ? (
                <ChevronUp className="text-[#6b5233]" />
              ) : (
                <ChevronDown className="text-[#6b5233]" />
              )}
            </button>
            {showPrompt && (
              <div className="px-6 pb-6 pt-2 border-t border-[#d4c4a8]">
                <pre className="text-sm text-[#5a4a3a] whitespace-pre-wrap font-mono bg-white/60 p-5 rounded border border-[#d4c4a8] leading-relaxed">
                  {examplePrompt}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 mb-8 text-sm text-[#8b7355]">
          <div className="ornament mx-auto mb-4 opacity-50"></div>
          <p className="text-xs text-[#a89278] mt-4">
            A tribute created with appreciation and admiration • 2026
          </p>
        </footer>
      </div>
    </div>
  );
};

export default MacchinaHankinsiana;