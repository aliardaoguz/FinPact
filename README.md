# 💳 FinPact — Yapay Zekâ Tabanlı Sözleşme Analiz Aracı

<p align="center">
  <img src="https://img.shields.io/badge/Hackathon-BTK_Akademi_Gemini_2026-blueviolet?style=for-the-badge" alt="Hackathon">
  <img src="https://img.shields.io/badge/Powered_By-Gemini_AI-blue?style=for-the-badge&logo=google-gemini" alt="Gemini">
  <img src="https://img.shields.io/badge/Tech_Stack-React_%7C_Vite_%7C_Tailwind-61dafb?style=for-the-badge" alt="Tech Stack">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

---

## 🚀 Proje Hakkında (About the Project)

**FinPact**, finans ve e-ticaret ekosistemindeki sözleşmelerde gözden kaçan hukuki ve mali riskleri yapay zekâ desteğiyle analiz eden, karmaşık hukuk jargonunu sade Türkçeye çeviren modern bir **Legal-Tech (Hukuk Teknolojisi)** platformudur. 

**Z-o7** takımı tarafından **BTK Akademi Gemini Hackathon 2026** kapsamında geliştirilen bu yenilikçi araç; KOBİ'lerin, dijital esnafların ve girişimcilerin masadaki hukuki haklarını korumak, kâr marjını eriten cezai şartları ve tek taraflı maddeleri önceden fark etmelerini sağlamak amacıyla tasarlanmıştır.

---

## 🎯 Öne Çıkan Özellikler (Key Features)

- **📄 Hibrit Dosya Desteği:** PDF, Word (.docx) ve düz metin (.txt) formatındaki sözleşmeleri doğrudan tarayıcı üzerinden okuyabilir ve saf metne dönüştürür.
- **🤖 Gemini AI Analiz Motoru:** Google Gemini API entegrasyonu sayesinde sözleşme maddelerini sadece kelime bazlı değil, derin anlamsal risk boyutlarıyla inceler.
- **📊 Gelişmiş Risk Skorlaması:** Sözleşmenin güvenliğini kategori bazlı değerlendirerek 100 üzerinden objektif bir risk puanı üretir.
- **📋 Sade Türkçe Deşifre Raporu:** Kullanıcı aleyhine tespit edilen kritik ve riskli maddeleri cımbızla çekerek, herkesin anlayabileceği duru bir dille açıklar.
- **📥 Profesyonel PDF Raporu:** Elde edilen analitik verileri ve yönetici özetini, kurumsal standartlarda bir A4 PDF raporu olarak dışa aktarmanızı sağlar.
- **🌙 Çift Tema Desteği (Dual-Theme):** Finans dünyasının premium çizgilerine uygun, göz yormayan Koyu Tema (Dark Mode) ve Açık Tema (Light Mode) arayüzü.

---

## 🛠️ Teknolojik Altyapı (Tech Stack)

- **Frontend:** React, Vite, Tailwind CSS
- **AI Core:** Google Gemini API
- **CI/CD & Deployment:** GitHub Actions & GitHub Pages
- **Libraries:** `pdfjs-dist` (Sözleşme belgelerinin istemci tarafında güvenle işlenmesi için)

---

## 👥 Z-o7 Takımı ve Kurucu Ortaklar (The Z-o7 Core Team)

FinPact, hackathon süreci boyunca tamamen eşit vizyon, emek ve ortaklıkla geliştirilmiş bir Z-o7 projesidir:

* **Ali Arda Oğuz** — Co-Founder & Lead Developer
  * [GitHub Profile](https://github.com/aliardaoguz)
* **Yusuf Alperen Çalış** — Co-Founder & Lead Developer
  * [GitHub Profile](https://github.com/Yusuf-Alperen)

---

## 💻 Yerel Kurulum (Local Setup Instructions)

Projeyi kendi bilgisayarınızda yerel olarak çalıştırmak için aşağıdaki adımları uygulayabilirsiniz:

1. Depoyu bilgisayarınıza klonlayın:
   ```bash
   git clone [https://github.com/aliardaoguz/FinPact.git](https://github.com/aliardaoguz/FinPact.git)
   cd FinPact
2. Gerekli bağımlılıkları ve paketleri yükleyin:
   ```bash
   npm install
3. Ana dizine bir .env.local dosyası oluşturun ve Gemini API anahtarınızı ekleyin:
   ```bash
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
4. Projeyi lokal sunucuda başlatın:
   ```bash
   npm run dev     
