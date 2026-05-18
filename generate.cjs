const fs = require('fs');

const appContent = `import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, TriangleAlert, Bot, FileText, Download, 
  Bell, HelpCircle, User, ChevronDown, Lock, 
  CheckCircle2, ArrowRightLeft, LayoutDashboard, FileType, Archive
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const CONTRACT_TYPES = ["Kullanım Koşulları", "Gizlilik Politikası", "İş Sözleşmesi", "Kira Kontratı"];

const STEPS = [
  "Metin okunuyor...",
  "Zararlı maddeler taranıyor...",
  "Risk skorları hesaplanıyor...",
  "Türkçe özet hazırlanıyor..."
];

const CircularGauge = ({ score }) => {
  const [currentScore, setCurrentScore] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = score / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setCurrentScore(score);
        clearInterval(timer);
      } else {
        setCurrentScore(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  const radius = 60;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;
  
  const color = currentScore > 70 ? '#D32F2F' : currentScore > 40 ? '#F59E0B' : '#10B981';

  return (
    <div className="relative flex flex-col items-center justify-center py-4">
      <svg className="w-48 h-28" viewBox="0 0 160 85">
        <path
          d={"M 20 80 A " + radius + " " + radius + " 0 0 1 140 80"}
          fill="none"
          stroke="#E5E4E7"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d={"M 20 80 A " + radius + " " + radius + " 0 0 1 140 80"}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-300 ease-out"
        />
      </svg>
      <div className="absolute top-14 flex flex-col items-center">
        <span className="text-4xl font-bold text-[#0A192F]">{currentScore} <span className="text-xl text-gray-400">/ 100</span></span>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center px-4">Daha düşük skor, daha az risk anlamına gelir.</p>
    </div>
  );
};

const FindingCard = ({ finding }) => {
  const [expanded, setExpanded] = useState(false);
  const [expandedQuote, setExpandedQuote] = useState(false);

  return (
    <div className={"bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden border-l-4 " + finding.color + " animate-fade-in-up mb-4"}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className={"px-2.5 py-1 text-xs font-semibold rounded-md " + finding.bg + " " + finding.text}>
            {finding.category}
          </span>
          <span className="text-sm font-medium text-gray-500">{finding.clause}</span>
        </div>
        
        <div className="bg-gray-50 p-3 rounded border border-gray-100 mb-3 relative">
          <p className={"font-mono text-xs text-gray-600 leading-relaxed " + (!expandedQuote ? "line-clamp-3" : "")}>
            "{finding.quote}"
          </p>
          {finding.quote.length > 100 && (
            <button 
              onClick={() => setExpandedQuote(!expandedQuote)}
              className="text-xs font-medium text-[#0A192F] hover:underline mt-1"
            >
              {expandedQuote ? 'daralt' : 'devamını gör'}
            </button>
          )}
        </div>

        <p className="text-sm text-gray-800 font-medium mb-3">
          {finding.aiText}
        </p>

        <div className="border-t border-gray-100 pt-2 mt-2">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-[#0A192F] transition-colors"
          >
            <span className="font-medium">Neden önemli?</span>
            <ChevronDown className={"w-4 h-4 transition-transform duration-300 " + (expanded ? "rotate-180" : "")} />
          </button>
          
          <div className={"grid transition-all duration-300 ease-in-out " + (expanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0")}>
            <div className="overflow-hidden text-sm text-gray-600">
              {finding.why}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [text, setText] = useState('');
  const [type, setType] = useState('Kullanım Koşulları');
  const [status, setStatus] = useState('idle');
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const resultsRef = useRef(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setStatus('loading');
    setLoadingStep(0);
    setAnalysis(null);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => prev < 3 ? prev + 1 : prev);
    }, 1000);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API Key bulunamadı!");
      }

      const prompt = \`Lütfen aşağıdaki sözleşme metnini (Tür: \${type}) hukuki açıdan tüketici/kullanıcı hakları çerçevesinde analiz et.
      
Eğer metin anlamsızsa (örn: "aaa", sadece test yazısı vb.), score'u 0 ver ve summary kısmına "Geçerli bir sözleşme metni bulunamadı, lütfen anlamlı bir metin girin." yaz, findings ve diğerlerini boş liste dön.
Eğer geçerli bir sözleşmeyse riskleri analiz et. 

Tam olarak aşağıdaki JSON formatında yanıt dön:
{
  "score": 75,
  "summary": "Sade Türkçe 3 cümlelik özet",
  "categories": [
    { "label": "Kategori Adı", "score": 80, "color": "bg-red-600" }
  ],
  "quickFindings": [
    { "icon": "🔴", "text": "Hızlı bulgu metni" }
  ],
  "findings": [
    {
      "id": 1,
      "severity": "danger",
      "color": "border-red-600",
      "bg": "bg-red-50",
      "text": "text-red-700",
      "category": "Veri Paylaşımı",
      "clause": "Madde no",
      "quote": "Alıntı metin",
      "aiText": "Sade vatandaş için ne anlama geliyor",
      "why": "Neden önemli"
    }
  ]
}

Metin:
\${text}\`;

      const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${apiKey}\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
             responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error('API Hatası');
      }

      const data = await response.json();
      const aiTextRaw = data.candidates[0].content.parts[0].text;
      const aiResult = JSON.parse(aiTextRaw);
      
      clearInterval(stepInterval);
      setLoadingStep(3);

      setTimeout(() => {
        setAnalysis(aiResult);
        setStatus('complete');
      }, 500);

    } catch (err) {
      console.error(err);
      clearInterval(stepInterval);
      setStatus('idle');
      alert("Analiz sırasında bir hata oluştu veya API kotası doldu.");
    }
  };

  const loadMock = () => {
    setText("Örnek Sözleşme: Kullanıcı, bu platformu kullanarak verilerinin 3. şahıslara satılmasını peşinen kabul eder. Otomatik yenileme iptal edilmedikçe karttan habersiz para çekilir. İhtilaf durumunda Papua Yeni Gine mahkemeleri yetkilidir.");
  };

  const handleDownloadPDF = async () => {
    if (!resultsRef.current) return;
    try {
      const canvas = await html2canvas(resultsRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('sozlesme-analiz-raporu.pdf');
    } catch (err) {
      console.error('PDF generation failed', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans">
      {status === 'loading' && (
        <div className="fixed inset-0 z-50 bg-[#0A192F]/90 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in">
          <div className="w-16 h-16 border-4 border-white/20 border-t-[#10B981] rounded-full animate-spin-slow mb-8"></div>
          <h2 className="text-2xl font-bold mb-6">Sözleşme Analiz Ediliyor</h2>
          <div className="flex flex-col gap-3 w-64">
            {STEPS.map((step, idx) => (
              <div key={idx} className={"flex items-center gap-3 transition-opacity duration-300 " + (idx <= loadingStep ? "opacity-100" : "opacity-30")}>
                {idx < loadingStep ? (
                  <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                ) : idx === loadingStep ? (
                  <div className="w-5 h-5 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin-slow"></div>
                ) : (
                  <div className="w-5 h-5 border-2 border-white/30 rounded-full"></div>
                )}
                <span className="text-sm font-medium">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <nav className="bg-white border-b border-[#E5E4E7] h-16 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-[#0A192F]">
            <Shield className="w-6 h-6 text-[#10B981]" />
            <h1 className="text-xl font-bold tracking-tight">FinPact</h1>
          </div>
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
            <a href="#" className="flex items-center gap-1.5 hover:text-[#0A192F] transition-colors"><LayoutDashboard className="w-4 h-4"/> Analizlerim</a>
            <a href="#" className="flex items-center gap-1.5 hover:text-[#0A192F] transition-colors"><FileType className="w-4 h-4"/> Sözleşme Tipleri</a>
            <a href="#" className="flex items-center gap-1.5 hover:text-[#0A192F] transition-colors"><Archive className="w-4 h-4"/> Arşiv</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="hidden sm:block bg-[#0A192F] text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-[#112240] transition-colors">
            Premium'a Geç
          </button>
          <div className="flex items-center gap-3 text-gray-500 border-l border-gray-200 pl-4">
            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><Bell className="w-5 h-5" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><HelpCircle className="w-5 h-5" /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"><User className="w-5 h-5" /></button>
          </div>
        </div>
      </nav>

      <div className="flex-1 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 p-4 lg:p-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-[#E5E4E7] p-5 shadow-sm h-fit flex flex-col mb-6 lg:mb-0 lg:sticky lg:top-24">
          <h2 className="text-lg font-bold text-[#0A192F] mb-1">Yeni Belge Analizi</h2>
          <p className="text-xs text-gray-500 mb-5">Hukuki riskleri tespit etmek için belgeyi yapıştırın veya yükleyin.</p>
          
          <div className="mb-4 flex-1">
            <textarea 
              className="w-full h-48 lg:h-64 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A192F] focus:border-transparent resize-none font-mono text-gray-700 bg-gray-50"
              placeholder="Sözleşme metnini buraya yapıştırın..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 mb-6">
            <button 
              onClick={handleAnalyze}
              disabled={!text.trim()}
              className="w-full bg-[#0A192F] text-white font-medium py-2.5 rounded-lg hover:bg-[#112240] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Analiz Et (Gemini AI)
            </button>
            <button 
              onClick={loadMock}
              className="w-full bg-white text-[#0A192F] border border-gray-300 font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Kısa Bir Örnek Yükle
            </button>
          </div>

          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 block">Sözleşme Türü</label>
            <div className="flex flex-wrap gap-2">
              {CONTRACT_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={"px-3 py-1 text-xs rounded-full border transition-colors " + (type === t ? 'bg-[#0A192F] text-white border-[#0A192F]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300')}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-auto flex items-center justify-center gap-1.5 text-gray-400 bg-gray-50 p-2 rounded-md">
            <Lock className="w-3 h-3" />
            <span className="text-[11px] font-medium">Gemini AI tarafından güvenle işlenir.</span>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col min-h-[500px]" ref={resultsRef}>
          {status === 'idle' ? (
            <div className="flex-1 bg-white rounded-xl border border-[#E5E4E7] border-dashed flex flex-col items-center justify-center p-12 text-center animate-fade-in shadow-sm">
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#0A192F] mb-2">Analiz edilecek metin bekleniyor...</h3>
              <p className="text-sm text-gray-500 max-w-md leading-relaxed">
                Sol taraftaki alana bir sözleşme metni yapıştırın veya sistemin nasıl çalıştığını görmek için bir örnek yükleyin. Metin analizi Gemini yapay zekası ile saniyeler içinde tamamlanacaktır.
              </p>
            </div>
          ) : status === 'complete' && analysis ? (
            <div className="flex flex-col gap-5 animate-fade-in">
              {analysis.score > 60 && (
                <div className="bg-[#FEE2E2] border border-[#D32F2F] rounded-lg p-4 flex gap-4 items-start shadow-sm">
                  <TriangleAlert className="w-6 h-6 text-[#D32F2F] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-[#D32F2F] uppercase tracking-wide mb-1">Yüksek Rİsk</h3>
                    <p className="text-sm text-red-900 font-medium leading-relaxed">
                      Bu sözleşmede ciddi sorunlar tespit edildi. Lütfen aşağıda kırmızı ile işaretlenmiş maddeleri dikkatle inceleyin.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-gray-200 pb-2 mt-2">
                <h2 className="text-xl font-bold text-[#0A192F]">Tespit Edilen Maddeler</h2>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  {analysis.findings ? analysis.findings.length : 0} madde
                </span>
              </div>

              <div className="flex flex-col gap-0">
                {analysis.findings && analysis.findings.length > 0 ? (
                  analysis.findings.map((finding, index) => (
                    <FindingCard key={index} finding={finding} />
                  ))
                ) : (
                  <p className="text-sm text-gray-500 py-4">Herhangi bir sorunlu madde tespit edilmedi veya anlamsız metin girdiniz.</p>
                )}
              </div>

              <div className="bg-[#E0F2FE] border border-[#BAE6FD] rounded-xl p-5 flex gap-4 items-start mt-2 shadow-sm">
                <div className="bg-blue-500 text-white p-2 rounded-lg shrink-0">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-1">Sade Türkçe Özet (Yapay Zeka)</h3>
                  <p className="text-sm text-blue-800 leading-relaxed font-medium">
                    {analysis.summary}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1"></div>
          )}
        </div>

        <div className="lg:col-span-3">
          {status === 'complete' && analysis && (
            <div className="bg-white rounded-xl border border-[#E5E4E7] shadow-sm flex flex-col sticky top-24 animate-fade-in-up">
              <div className="p-5 border-b border-gray-100 flex flex-col items-center">
                <CircularGauge score={analysis.score || 0} />
              </div>

              {analysis.categories && analysis.categories.length > 0 && (
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Kategori Analizi</h3>
                  <div className="flex flex-col gap-3">
                    {analysis.categories.map((cat, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">{cat.label}</span>
                          <span className="font-bold text-gray-500">{cat.score} Risk</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={cat.color + " h-1.5 rounded-full"} style={{ width: cat.score + "%" }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.quickFindings && analysis.quickFindings.length > 0 && (
                <div className="p-5 border-b border-gray-100">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Hızlı Bulgular</h3>
                  <ul className="space-y-2.5">
                    {analysis.quickFindings.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700 font-medium">
                        <span className="mt-1 text-[10px]">{q.icon}</span> {q.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-5 bg-gray-50 rounded-b-xl flex flex-col gap-2">
                <button 
                  onClick={handleDownloadPDF}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-[#0A192F] font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm shadow-sm"
                >
                  <Download className="w-4 h-4" /> Raporu PDF İndir
                </button>
                <button className="w-full flex items-center justify-center gap-2 text-gray-600 font-medium py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                  <ArrowRightLeft className="w-4 h-4" /> Başka Sözleşmeyle Karşılaştır
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/App.jsx', appContent);
