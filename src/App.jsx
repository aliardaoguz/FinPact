import React, { useState, useRef, useEffect } from 'react';
import {
  FileText, CloudUpload, Search, Bot,
  ChevronDown, Download, ArrowRightLeft, Moon, Sun,
  TriangleAlert, XCircle, AlertTriangle, Calendar,
  Bell, HelpCircle, User, CheckCircle2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import * as mammoth from 'mammoth';
import { RobotoRegular, RobotoBold } from './fonts.js';

// Setup PDF.js worker (Local Vite import is 100% reliable and prevents CDN version mismatches)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const STEPS = [
  "Metin okunuyor ve işleniyor...",
  "Hukuki terimler analiz ediliyor...",
  "Kullanıcı aleyhine riskli maddeler tespit ediliyor...",
  "Kritik değerlendirme ve sonuç oluşturuluyor..."
];

const generatePrompt = (text) => `
Aşağıdaki sözleşme veya hukuki metni detaylıca analiz et.
Lütfen SADECE GEÇERLİ BİR JSON nesnesi döndür. Metin, markdown, backtick (\`\`\`) veya başka bir açıklama KULLANMA. SADECE JSON.

Metin:
"""
${text}
"""

Döndürmen gereken JSON formatı tam olarak şöyle olmalı:
{
  "contractType": "AWS Kullanım Koşulları", // Sözleşmenin hangi şirkete/kuruma ait olduğunu da bularak tam adını yaz (Örn: AWS Hizmet Şartları, Google Gizlilik Politikası, Apple Kullanıcı Sözleşmesi vb.)
  "score": 78, // 0-100 arası risk skoru (100 en riskli)
  "summary": "Metnin genel özeti...",
  "stats": {
    "critical": 1, // yüksek riskli madde sayısı
    "warning": 2 // orta riskli madde sayısı
  },
  "categories": [
    { "label": "Veri Gizliliği", "score": 85 }, // score > 70 ise Kötü (Kırmızı), > 40 ise Orta, değilse İyi
    { "label": "Tüketici Hakları", "score": 45 },
    { "label": "Mali Yükümlülük", "score": 20 }
  ],
  "findings": [
    {
      "title": "Madde 4.2: Veri Paylaşımı",
      "risk": "Yüksek Risk", // "Yüksek Risk" veya "Orta Risk" veya "Düşük Risk"
      "originalText": "Şirket, elde ettiği verileri üçüncü taraf iş ortaklarıyla paylaşma hakkını saklı tutar.",
      "simpleExplanation": "Bu şirket size sormadan bilgilerinizi başkalarına satabilir.",
      "importance": "Kişisel verilerinizin kontrolünün tamamen onlarda olduğu anlamına gelir."
    }
  ]
}
`;

const CircularGauge = ({ score }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = score > 70 ? "#DC2626" : score > 40 ? "#F59E0B" : "#10B981";
  let label = score > 70 ? "Yüksek Risk" : score > 40 ? "Orta Risk" : "Düşük Risk";
  let labelBg = score > 70 ? "text-red-600 border-red-100" : score > 40 ? "text-orange-600 border-orange-100" : "text-green-600 border-green-100";

  return (
    <div className="flex flex-col items-center justify-center pt-2 pb-10">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-gray-100 dark:text-[#1E293B]" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-5xl font-black text-[#0A192F] dark:text-white leading-none">{score}</span>
          <span className="text-[11px] font-bold text-gray-400 mt-1">/ 100</span>
        </div>
        <div className={"absolute -bottom-3 bg-white dark:bg-[#0F172A] px-5 py-1.5 rounded-full shadow-sm text-xs font-bold border " + labelBg + " dark:border-transparent"}>
          {label}
        </div>
      </div>
    </div>
  );
};

const FindingCard = ({ finding }) => {
  const [open, setOpen] = useState(false);
  const isHighRisk = finding.risk === 'Yüksek Risk';

  return (
    <div className={"relative border rounded-xl shadow-sm overflow-hidden flex flex-col transition-colors " + (isHighRisk ? "border-l-[6px] border-l-[#DC2626]" : "border-l-[6px] border-l-[#F59E0B]") + " bg-[#FFFFFF] dark:bg-[#0F172A] border-[#E5E7EB] dark:border-[#1E293B]"}>

      {/* Absolute Badge */}
      <div className={"absolute top-0 right-0 text-[#FFFFFF] text-[11px] font-bold px-4 py-1.5 rounded-bl-xl " + (isHighRisk ? "bg-[#DC2626]" : "bg-[#F59E0B]")}>
        ! {finding.risk}
      </div>

      <div className="p-7 pb-6 flex flex-col gap-5">
        <h4 className="text-[16px] font-bold text-[#0A192F] dark:text-white pr-28 leading-snug">{finding.title}</h4>

        <div className="bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#F3F4F6] dark:border-[#1E293B] rounded-xl p-5 text-[13.5px] text-[#4B5563] dark:text-gray-300 font-mono leading-relaxed">
          "{finding.originalText}"
        </div>

        <div className="bg-[#F8FAFC] dark:bg-[#0B1120] border border-[#F3F4F6] dark:border-[#1E293B] rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#6B7280] dark:text-gray-400 mb-3">
            <Bot className="w-4 h-4 text-[#3B82F6]" /> Kritik Değerlendirme
          </div>
          <p className="text-[14px] text-[#0A192F] dark:text-gray-200 font-medium leading-relaxed">
            {finding.simpleExplanation}
          </p>
        </div>
      </div>

      <div
        className="border-t border-[#F3F4F6] dark:border-[#1E293B] px-6 py-3.5 flex justify-between items-center cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#111827] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs font-bold text-[#4B5563] dark:text-gray-400">Neden önemli?</span>
        <ChevronDown className={"w-4 h-4 text-[#9CA3AF] transition-transform " + (open ? "rotate-180" : "")} />
      </div>
      {open && (
        <div className="px-6 py-4 bg-[#F9FAFB] dark:bg-[#0B1120] border-t border-[#F3F4F6] dark:border-[#1E293B] text-[13px] text-[#4B5563] dark:text-gray-300 font-medium">
          {finding.importance}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, complete
  const [loadingStep, setLoadingStep] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const resultsRef = useRef(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const extractTextFromFile = async (file) => {
    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map(item => item.str);
          fullText += strings.join(' ') + '\n';
        }
        return fullText;
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        return result.value;
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.onerror = (error) => reject(error);
          reader.readAsText(file);
        });
      } else {
        throw new Error("Desteklenmeyen dosya formatı");
      }
    } catch (err) {
      console.error("Dosya okuma hatası:", err);
      alert("Dosya okunamadı. Lütfen geçerli bir PDF, Word (.docx) veya Metin (.txt) dosyası yükleyin.");
      return "";
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    setStatus('loading');
    setLoadingStep(0);
    const extracted = await extractTextFromFile(file);
    if (extracted) {
      setText(extracted);
    }
    setStatus('idle');
  };

  const handleFileUpload = (e) => {
    processFile(e.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;

    setStatus('loading');
    setLoadingStep(0);

    const stepInterval = setInterval(() => {
      setLoadingStep(prev => prev < 3 ? prev + 1 : prev);
    }, 1500);

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: generatePrompt(text) }] }]
        })
      });

      const data = await response.json();
      let resultText = data.candidates[0].content.parts[0].text;

      resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(resultText);

      setAnalysis(parsedData);
      clearInterval(stepInterval);
      setLoadingStep(4);

      setTimeout(() => {
        setStatus('complete');
      }, 800);

    } catch (error) {
      console.error("Analysis Error:", error);
      clearInterval(stepInterval);
      setStatus('idle');
      alert("Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  const downloadPDFReport = () => {
    if (!analysis) {
      alert("Hata: Analiz verisi bulunamadı!");
      return;
    }

    setIsGeneratingPDF(true);

    // Küçük bir gecikme ekliyoruz ki ekrandaki "İndiriliyor..." yazısı render olabilsin
    setTimeout(() => {
      try {
        const PDFDoc = typeof jsPDF === 'function' ? jsPDF : (jsPDF.jsPDF || window.jsPDF);
        const doc = new PDFDoc('p', 'mm', 'a4');

        // Özel fontu PDF'e ekle (Türkçe karakter desteği için)
        doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
        doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");

        doc.addFileToVFS("Roboto-Bold.ttf", RobotoBold);
        doc.addFont("Roboto-Bold.ttf", "Roboto", "bold");

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let y = 20;

        const checkPageBreak = (needed) => {
          if (y + needed > pageHeight - margin) {
            doc.addPage();
            y = margin + 5;
          }
        };

        // Başlık
        doc.setFont("Roboto", "bold");
        doc.setFontSize(18);
        const reportTitle = analysis.contractType ? `${analysis.contractType.toUpperCase()} ANALİZ RAPORU` : "SÖZLEŞME ANALİZ RAPORU";
        const titleLines = doc.splitTextToSize(reportTitle, pageWidth - margin * 2);
        doc.text(titleLines, margin, y);
        y += (titleLines.length * 8) + 2;

        // Genel İstatistikler
        doc.setFont("Roboto", "normal");
        doc.setFontSize(11);
        doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, margin, y);
        y += 6;
        doc.text(`Genel Risk Skoru: ${analysis.score} / 100`, margin, y);
        y += 6;
        doc.text(`Kritik Madde: ${analysis.stats?.critical || 0} | Uyarı: ${analysis.stats?.warning || 0}`, margin, y);
        y += 15;

        // Özet
        doc.setFont("Roboto", "bold");
        doc.setFontSize(14);
        doc.text("KRİTİK DEĞERLENDİRME & SONUÇ", margin, y);
        y += 8;

        doc.setFont("Roboto", "normal");
        doc.setFontSize(11);
        const summaryLines = doc.splitTextToSize(analysis.summary, pageWidth - margin * 2);
        checkPageBreak(summaryLines.length * 6);
        doc.text(summaryLines, margin, y);
        y += (summaryLines.length * 5) + 12;

        // Tespit Edilen Maddeler
        if (analysis.findings && analysis.findings.length > 0) {
          doc.setFont("Roboto", "bold");
          doc.setFontSize(14);
          checkPageBreak(15);
          doc.text("TESPİT EDİLEN RİSKLER VE DETAYLAR", margin, y);
          y += 10;

          analysis.findings.forEach((finding, i) => {
            checkPageBreak(25);

            // Madde Başlığı
            doc.setFont("Roboto", "bold");
            doc.setFontSize(12);
            const titleText = `${i + 1}. ${finding.title} [${finding.risk}]`;
            const titleLines = doc.splitTextToSize(titleText, pageWidth - margin * 2);
            doc.text(titleLines, margin, y);
            y += (titleLines.length * 5) + 2;

            // Orijinal Metin
            doc.setFont("Roboto", "normal");
            doc.setFontSize(10);
            const origText = `Orijinal Metin: "${finding.originalText}"`;
            const origLines = doc.splitTextToSize(origText, pageWidth - margin * 2);
            checkPageBreak(origLines.length * 5 + 5);
            doc.text(origLines, margin, y);
            y += (origLines.length * 5) + 3;

            // Anlamı (Sade Türkçe)
            doc.setFont("Roboto", "normal");
            const expText = `Anlamı: ${finding.simpleExplanation}`;
            const expLines = doc.splitTextToSize(expText, pageWidth - margin * 2);
            checkPageBreak(expLines.length * 5 + 5);
            doc.text(expLines, margin, y);
            y += (expLines.length * 5) + 3;

            // Neden Önemli
            const impText = `Neden Önemli: ${finding.importance}`;
            const impLines = doc.splitTextToSize(impText, pageWidth - margin * 2);
            checkPageBreak(impLines.length * 5 + 8);
            doc.text(impLines, margin, y);
            y += (impLines.length * 5) + 8;
          });
        }

        const fileName = analysis.contractType ? `${analysis.contractType.replace(/\s+/g, '_')}_Analiz_Raporu.pdf` : 'Sozlesme_Analiz_Raporu.pdf';
        doc.save(fileName);
      } catch (error) {
        console.error("PDF oluşturma hatası:", error);
        alert("PDF Hatası: " + error.message);
      } finally {
        setIsGeneratingPDF(false);
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors flex flex-col font-sans w-full overflow-x-hidden">
      {status === 'loading' && (
        <div className="fixed inset-0 z-50 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-sm flex flex-col items-center justify-center text-[#0A192F] dark:text-white animate-fade-in">
          <div className="w-20 h-20 border-4 border-gray-200 dark:border-gray-800 border-t-[#0A192F] dark:border-t-white rounded-full animate-spin-slow mb-10"></div>
          <h2 className="text-3xl font-black mb-10 text-[#0A192F] dark:text-white">Analiz Bekleniyor</h2>
          <div className="flex flex-col gap-6 w-80">
            {STEPS.map((step, idx) => (
              <div key={idx} className={"flex items-center gap-4 transition-all duration-300 " + (idx <= loadingStep ? "opacity-100 transform translate-x-2" : "opacity-30")}>
                {idx < loadingStep ? (
                  <CheckCircle2 className="w-6 h-6 text-[#10B981] shrink-0" />
                ) : idx === loadingStep ? (
                  <div className="w-6 h-6 border-[3px] border-[#10B981] border-t-transparent rounded-full animate-spin-slow shrink-0"></div>
                ) : (
                  <div className="w-6 h-6 border-[3px] border-gray-300 dark:border-gray-700 rounded-full shrink-0"></div>
                )}
                <span className="text-base font-bold text-gray-800 dark:text-gray-200 leading-snug">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className="bg-white dark:bg-[#0F172A] border-b border-gray-200 dark:border-[#1E293B] transition-colors h-16 flex items-center justify-center sticky top-0 z-40 w-full">
        <div className="max-w-[1300px] w-full px-8 lg:px-12 flex items-center justify-between mx-auto">
          <div className="flex items-center gap-2 text-[#0A192F] dark:text-white">
            <FileText className="w-5 h-5" />
            <h1 className="text-[17px] font-black tracking-tight">FinPact</h1>
          </div>
          <div className="flex items-center gap-5 text-gray-500 dark:text-gray-400 relative">
            <button onClick={() => setDarkMode(!darkMode)} className="hover:text-[#0A192F] dark:hover:text-white transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <HelpCircle
              className="w-5 h-5 cursor-pointer hover:text-[#0A192F] dark:hover:text-white transition-colors"
              onClick={() => setShowInfo(!showInfo)}
            />
            {showInfo && (
              <div className="absolute top-8 right-0 w-64 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-5 z-50 animate-fade-in text-center">
                <p className="text-[14px] font-bold text-[#0A192F] dark:text-white">Bu sayfa <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md mx-1">Z-o7</span> tarafından yapılmıştır.</p>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full flex justify-center pb-20">
        <div className="max-w-[1300px] w-full grid grid-cols-1 lg:grid-cols-12 gap-8 p-8 lg:px-12 mx-auto mt-4">

          {/* Sol Kolon - Input Form */}
          <div className="lg:col-span-4 flex flex-col h-fit lg:sticky lg:top-24">
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-[#1E293B] shadow-sm flex flex-col overflow-hidden transition-colors">
              <div className="p-6 border-b border-gray-100 dark:border-[#1E293B]">
                <h3 className="text-[15px] font-bold text-[#0A192F] dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Yeni Metin Ekle
                </h3>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                  Analiz edilecek sözleşme veya metni buraya yapıştırın veya dosya yükleyin.
                </p>

                <label
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={"border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors " + (isDragging ? "border-[#0A192F] dark:border-white bg-blue-50 dark:bg-[#1E293B]" : "border-gray-300 dark:border-[#1E293B] hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-[#0B1120]")}
                >
                  <input type="file" className="hidden" accept=".pdf,.txt,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileUpload} />
                  <CloudUpload className="w-8 h-8 text-gray-500 dark:text-gray-400 mb-3" />
                  <span className="text-[13px] font-bold text-[#0A192F] dark:text-gray-200 text-center mb-1">PDF, Word veya Metin dosyası yükleyin</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500 text-center">veya bilgisayarınızdan seçin</span>
                </label>

                <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 dark:text-gray-600">
                  <div className="flex-1 border-b border-gray-200 dark:border-gray-700"></div>
                  VEYA
                  <div className="flex-1 border-b border-gray-200 dark:border-gray-700"></div>
                </div>

                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Metni buraya yapıştırın..."
                  className="w-full h-40 bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-[#1E293B] rounded-xl py-4 pl-6 pr-4 text-[13px] font-medium text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-[#0A192F] dark:focus:ring-blue-500 placeholder:text-gray-400 dark:placeholder-gray-600 transition-colors"
                />

                <button
                  onClick={handleAnalyze}
                  disabled={!text.trim() && status !== 'loading'}
                  className="w-full bg-[#0F172A] dark:bg-gray-200 text-white dark:text-[#0A192F] font-bold py-3.5 rounded-xl hover:bg-black dark:hover:bg-white transition-colors text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  Analiz Et
                </button>
              </div>
            </div>
          </div>

          {/* Orta Kolon - Analiz Sonuçları */}
          <div className="lg:col-span-5 flex flex-col" ref={resultsRef}>
            {status === 'idle' ? (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center opacity-40">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-400 dark:text-gray-500 mb-2">Henüz Bir Metin Analizi Yok</h2>
                <p className="text-sm text-gray-400 dark:text-gray-600 max-w-sm">Sol panelden bir metin yapıştırarak veya PDF dosyası yükleyerek analizi başlatabilirsiniz.</p>
              </div>
            ) : status === 'complete' && analysis ? (
              <div className="flex flex-col animate-fade-in w-full bg-[#F8FAFC] dark:bg-[#0B1120] pb-4 transition-colors">

                {analysis.score > 60 && (
                  <div className="bg-[#FEF2F2] dark:bg-[#450a0a] border border-[#FCA5A5] dark:border-red-900 rounded-xl p-5 mb-8 transition-colors">
                    <div className="flex items-center gap-3 text-[#DC2626] dark:text-red-400 font-bold text-[13px] mb-2 tracking-wide uppercase">
                      <div className="bg-[#DC2626] dark:bg-red-500 rounded-full p-1.5 text-white">
                        <TriangleAlert className="w-4 h-4" />
                      </div>
                      YÜKSEK RİSK TESPİT EDİLDİ
                    </div>
                    <p className="text-[#DC2626] dark:text-red-300 text-[13px] font-medium ml-[42px]">
                      Sözleşmede kullanıcı aleyhine ciddi maddeler bulundu. Lütfen aşağıda kırmızı ile işaretlenmiş maddeleri dikkatle inceleyiniz.
                    </p>
                  </div>
                )}

                <div id="analysis-report-view" className="flex flex-col w-full bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors">
                  <h2 className="text-[26px] font-bold text-[#0A192F] dark:text-white mb-3">Sözleşme Analizi</h2>
                  <div className="flex items-center gap-4 text-[13px] font-medium text-[#6B7280] dark:text-gray-400 mb-8">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Bugün</span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4" /> Metin Analizi</span>
                  </div>

                  <div className="mb-6 border-b border-[#E5E7EB] dark:border-[#1E293B] pb-4">
                    <h3 className="text-[17px] font-bold text-[#0A192F] dark:text-white flex items-center gap-2">
                      <Search className="w-5 h-5" /> Tespit Edilen Maddeler ({analysis.findings ? analysis.findings.length : 0})
                    </h3>
                  </div>

                  <div className="flex flex-col gap-8">
                    {analysis.findings && analysis.findings.length > 0 ? (
                      analysis.findings.map((finding, index) => (
                        <FindingCard key={index} finding={finding} />
                      ))
                    ) : (
                      <p className="text-sm font-medium text-[#6B7280] py-6">Herhangi bir sorunlu madde tespit edilmedi.</p>
                    )}
                  </div>

                  {/* KRİTİK DEĞERLENDİRME & SONUÇ */}
                  <div className="mt-8 relative bg-[#F0F9FF] dark:bg-[#0F172A] border border-[#BAE6FD] dark:border-[#1E293B] rounded-xl p-8 pt-9 shadow-sm transition-colors">
                    <div className="absolute -top-5 -left-5 bg-[#334155] dark:bg-[#1E293B] p-3 rounded-xl text-[#FFFFFF] shadow-md">
                      <Bot className="w-6 h-6" />
                    </div>
                    <h4 className="text-[14px] font-bold text-[#0369A1] dark:text-blue-400 mb-3 uppercase tracking-wide">KRİTİK DEĞERLENDİRME &amp; SONUÇ</h4>
                    <p className="text-[14px] text-[#0A192F] dark:text-gray-300 font-medium leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1"></div>
            )}
          </div>

          {/* Sağ Kolon - Skor ve İstatistikler */}
          <div className="lg:col-span-3 flex flex-col h-fit lg:sticky lg:top-24">
            {status === 'idle' ? (
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-[#1E293B] shadow-sm flex flex-col animate-fade-in transition-colors">
                <div className="p-6 border-b border-gray-100 dark:border-[#1E293B]">
                  <h3 className="text-[15px] font-bold text-[#0A192F] dark:text-white flex items-center gap-2">
                    <Search className="w-4 h-4" /> Risk Skoru
                  </h3>
                </div>
                <div className="p-8 flex flex-col items-center justify-center">
                  <div className="w-40 h-40 border-8 border-gray-100 dark:border-[#1E293B] rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">Veri Bekleniyor</span>
                  </div>
                </div>
              </div>
            ) : status === 'complete' && analysis ? (
              <div className="flex flex-col gap-6 animate-fade-in">
                <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-gray-200 dark:border-[#1E293B] shadow-sm flex flex-col transition-colors">
                  <div className="p-6 border-b border-gray-100 dark:border-[#1E293B]">
                    <h3 className="text-[15px] font-bold text-[#0A192F] dark:text-white flex items-center gap-2">
                      <Search className="w-4 h-4" /> Risk Skoru
                    </h3>
                  </div>

                  <CircularGauge score={analysis.score || 0} />

                  {analysis.categories && analysis.categories.length > 0 && (
                    <div className="p-6 pt-2">
                      <div className="flex flex-col gap-5">
                        {analysis.categories.map((cat, i) => {
                          const catColor = cat.score > 70 ? "text-[#DC2626]" : cat.score > 40 ? "text-[#F59E0B]" : "text-[#10B981]";
                          const bgCat = cat.score > 70 ? "bg-[#DC2626]" : cat.score > 40 ? "bg-[#F59E0B]" : "bg-[#10B981]";
                          const catText = cat.score > 70 ? "Kötü" : cat.score > 40 ? "Orta" : "İyi";

                          return (
                            <div key={i}>
                              <div className="flex justify-between items-start gap-2 text-[11px] font-bold mb-2">
                                <span className="text-[#0A192F] dark:text-gray-200 leading-tight">{cat.label}</span>
                                <span className={catColor + " shrink-0"}>{catText}</span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-[#1E293B] rounded-full h-[6px]">
                                <div className={bgCat + " h-[6px] rounded-full"} style={{ width: cat.score + "%" }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {analysis.stats && (
                    <div className="px-6 pb-6">
                      <div className="bg-[#F8FAFC] dark:bg-[#0B1120] border border-gray-100 dark:border-[#1E293B] rounded-xl p-4 flex justify-around transition-colors">
                        <div className="flex flex-col items-center">
                          <div className="bg-white dark:bg-[#0F172A] rounded-full p-1 mb-1">
                            <XCircle className="w-4 h-4 text-red-500" />
                          </div>
                          <span className="text-xl font-black text-[#0A192F] dark:text-white">{analysis.stats.critical || 0}</span>
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Kritik Madde</span>
                        </div>
                        <div className="w-px bg-gray-200 dark:bg-[#1E293B]"></div>
                        <div className="flex flex-col items-center">
                          <div className="bg-white dark:bg-[#0F172A] rounded-full p-1 mb-1">
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                          </div>
                          <span className="text-xl font-black text-[#0A192F] dark:text-white">{analysis.stats.warning || 0}</span>
                          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Uyarı</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-5 bg-white dark:bg-[#0F172A] rounded-b-2xl flex flex-col gap-3 border-t border-gray-100 dark:border-[#1E293B] transition-colors">
                    <button
                      onClick={downloadPDFReport}
                      className="w-full bg-[#0F172A] dark:bg-gray-200 text-white dark:text-[#0A192F] font-bold py-3.5 rounded-xl hover:bg-black dark:hover:bg-white transition-colors text-[13px] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!analysis || isGeneratingPDF}
                    >
                      {isGeneratingPDF ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white dark:border-[#0A192F] border-t-transparent rounded-full animate-spin"></div>
                          İndiriliyor...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" /> Raporu PDF İndir
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div></div>
            )}
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#E2E8F0]/50 dark:bg-[#0F172A]/50 border-t border-gray-200 dark:border-[#1E293B] py-6 mt-auto w-full flex justify-center transition-colors">
        <div className="max-w-[1300px] w-full mx-auto px-8 lg:px-12 flex justify-between items-center text-[11px] font-bold text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2 text-[#0A192F] dark:text-white">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-black">FinPact</span>
          </div>
          <span>© 2026 FinPact. Intelligence-driven legal analysis.</span>
          <div className="w-[200px]"></div> {/* Boşluk tutucu, ortalamayı korur */}
        </div>
      </footer>
    </div>
  );
}
