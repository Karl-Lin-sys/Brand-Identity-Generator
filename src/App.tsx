import { useState, useEffect, useRef } from 'react';
import { Loader2, Palette, Type as TypeIcon, Image as ImageIcon, MessageSquare, Send, Sparkles, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { generateBrandIdentityText, generateBrandImage, BrandIdentityText } from './services/gemini';
import { sendChatMessage } from './services/chat';

export default function App() {
  const [mission, setMission] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [brandData, setBrandData] = useState<BrandIdentityText | null>(null);
  const [primaryLogo, setPrimaryLogo] = useState<string | null>(null);
  const [secondaryMark, setSecondaryMark] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model", parts: { text: string }[] }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (brandData) {
      const { headerFont, bodyFont } = brandData.typography;
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${headerFont.replace(/ /g, '+')}:wght@400;600;700&family=${bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [brandData]);

  const handleGenerate = async () => {
    if (!mission.trim()) return;
    
    // Check for API key before starting
    // @ts-ignore
    if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }

    setIsGenerating(true);
    setBrandData(null);
    setPrimaryLogo(null);
    setSecondaryMark(null);
    
    try {
      const textData = await generateBrandIdentityText(mission);
      setBrandData(textData);
      
      // Generate images in parallel
      const [logo, mark] = await Promise.all([
        generateBrandImage(textData.logoPrompt, imageSize),
        generateBrandImage(textData.secondaryMarkPrompt, imageSize)
      ]);
      
      setPrimaryLogo(logo);
      setSecondaryMark(mark);
      
      setChatHistory([{
        role: "model",
        parts: [{ text: "Hi! I'm your brand assistant. I've generated your brand identity based on your mission. What do you think? I can help you refine it or answer any questions." }]
      }]);
    } catch (error) {
      console.error("Error generating brand:", error);
      alert("Failed to generate brand identity. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !brandData) return;
    
    const newMessage = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: "user", parts: [{ text: newMessage }] }]);
    setIsChatting(true);
    
    try {
      const brandContext = JSON.stringify(brandData, null, 2);
      const responseText = await sendChatMessage(chatHistory, newMessage, brandContext);
      
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: responseText }] }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory(prev => [...prev, { role: "model", parts: [{ text: "Sorry, I encountered an error processing your request." }] }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-semibold tracking-tight">BrandForge</h1>
        </div>
        {brandData && (
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors text-sm font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            Brand Assistant
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
        {/* Input Section */}
        <div className="w-full md:w-1/3 p-6 md:p-12 border-r border-stone-200 bg-white flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Define Your Mission</h2>
            <p className="text-stone-500 text-sm">Describe what your company does, your target audience, and the vibe you want to convey.</p>
          </div>
          
          <textarea
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            placeholder="e.g., We are a sustainable coffee roaster focused on fair trade and community building. We want to feel warm, earthy, and modern."
            className="w-full h-48 p-4 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
          />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-stone-700">Image Quality</label>
            <select 
              value={imageSize}
              onChange={(e) => setImageSize(e.target.value as any)}
              className="w-full p-3 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="1K">1K (Standard)</option>
              <option value="2K">2K (High)</option>
              <option value="4K">4K (Ultra)</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !mission.trim()}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Forging Brand...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Brand Bible
              </>
            )}
          </button>
        </div>

        {/* Dashboard Section */}
        <div className="w-full md:w-2/3 p-6 md:p-12 bg-stone-50 overflow-y-auto">
          {!brandData && !isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-4">
              <div className="w-24 h-24 rounded-full bg-stone-200/50 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-stone-300" />
              </div>
              <p>Your Brand Bible will appear here</p>
            </div>
          ) : isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-500 gap-6">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
              <div className="text-center">
                <p className="font-medium text-stone-900">Crafting your identity...</p>
                <p className="text-sm">Analyzing mission, selecting colors, generating logos.</p>
              </div>
            </div>
          ) : brandData ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 pb-24"
            >
              {/* Logos */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-semibold">Visual Marks</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center gap-4">
                    <h4 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Primary Logo</h4>
                    {primaryLogo ? (
                      <img src={primaryLogo} alt="Primary Logo" className="w-full aspect-square object-contain rounded-xl bg-stone-50" />
                    ) : (
                      <div className="w-full aspect-square bg-stone-100 rounded-xl flex items-center justify-center animate-pulse">
                        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
                      </div>
                    )}
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex flex-col items-center gap-4">
                    <h4 className="text-sm font-medium text-stone-500 uppercase tracking-wider">Secondary Mark</h4>
                    {secondaryMark ? (
                      <img src={secondaryMark} alt="Secondary Mark" className="w-full aspect-square object-contain rounded-xl bg-stone-50" />
                    ) : (
                      <div className="w-full aspect-square bg-stone-100 rounded-xl flex items-center justify-center animate-pulse">
                        <Loader2 className="w-8 h-8 animate-spin text-stone-300" />
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Color Palette */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Palette className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-semibold">Color Palette</h3>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
                  <div className="flex flex-col md:flex-row h-auto md:h-48">
                    {brandData.colors.map((color, idx) => (
                      <div 
                        key={idx} 
                        className="flex-1 flex flex-col justify-end p-4 min-h-[120px] transition-all hover:flex-[1.2]"
                        style={{ backgroundColor: color.hex }}
                      >
                        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm">
                          <p className="font-bold text-sm text-stone-900">{color.hex}</p>
                          <p className="text-xs font-medium text-stone-600 truncate">{color.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brandData.colors.map((color, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="w-4 h-4 rounded-full mt-1 shrink-0" style={{ backgroundColor: color.hex }} />
                        <div>
                          <p className="text-sm font-semibold">{color.name}</p>
                          <p className="text-xs text-stone-500 leading-relaxed">{color.usage}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Typography */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <TypeIcon className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-xl font-semibold">Typography</h3>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">Header Font</h4>
                    <div className="p-6 bg-stone-50 rounded-xl border border-stone-100">
                      <p className="text-3xl font-bold text-stone-900 mb-2" style={{ fontFamily: brandData.typography.headerFont }}>{brandData.typography.headerFont}</p>
                      <p className="text-sm text-stone-500">Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">Body Font</h4>
                    <div className="p-6 bg-stone-50 rounded-xl border border-stone-100">
                      <p className="text-xl text-stone-900 mb-2" style={{ fontFamily: brandData.typography.bodyFont }}>{brandData.typography.bodyFont}</p>
                      <p className="text-sm text-stone-500">Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz</p>
                    </div>
                  </div>
                  <div className="md:col-span-2 pt-6 border-t border-stone-100">
                    <h4 className="text-sm font-medium text-stone-900 mb-2">Usage Notes</h4>
                    <p className="text-stone-600 text-sm leading-relaxed">{brandData.typography.notes}</p>
                  </div>
                </div>
              </section>
            </motion.div>
          ) : null}
        </div>
      </main>

      {/* Chatbot Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-2xl border-l border-stone-200 flex flex-col z-50"
          >
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-indigo-600 text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-semibold">Brand Assistant</h3>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="p-1 hover:bg-indigo-700 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-stone-200 text-stone-800 rounded-tl-sm shadow-sm'
                  }`}>
                    <div className="markdown-body prose prose-sm max-w-none">
                      <Markdown>{msg.parts[0].text}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                  <div className="bg-white border border-stone-200 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-stone-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-stone-200">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your brand..."
                  className="flex-1 p-3 bg-stone-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl outline-none transition-all text-sm"
                />
                <button 
                  type="submit"
                  disabled={!chatInput.trim() || isChatting}
                  className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

