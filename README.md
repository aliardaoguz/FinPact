# FinPact — Sözleşme Analiz Aracı

FinPact, sözleşmelerinizdeki gizli riskleri yapay zeka (Gemini AI) ile analiz eden, hukuki metinleri sade Türkçeye çeviren modern bir web uygulamasıdır.

## Özellikler

- 📄 PDF, Word (.docx) ve düz metin (.txt) dosya desteği
- 🤖 Gemini AI ile akıllı sözleşme analizi
- 📊 Risk skoru ve kategori bazlı değerlendirme
- 📋 Tespit edilen riskli maddelerin sade Türkçe açıklaması
- 📥 Profesyonel PDF rapor indirme
- 🌙 Dark mode desteği

## Kurulum

```bash
npm install
npm run dev
```

## Ortam Değişkenleri

`.env.local` dosyasına Gemini API anahtarınızı ekleyin:

```
VITE_GEMINI_API_KEY=your_api_key_here
```
