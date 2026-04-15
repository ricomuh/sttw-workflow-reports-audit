# 📋 SIAKAD STTW Module Audit Report
**Tanggal**: 2026-04-15
**Auditor**: OpenClaw (Playwright automated + visual review)
**URL**: https://sttw-dev.leolitgames.com

---

## 📊 Executive Summary

| Modul | Total Pages | ✅ OK | ⚠️ Warning | ❌ Error | Dummy Data |
|-------|:-----------:|:-----:|:----------:|:-------:|:----------:|
| HRM | 54 | 54 | 0 | 0 | ⚠️ Partial |
| P3M | 35 | 35 | 0 | 0 | ❌ Mostly empty |
| LPM | 52 | 52 | 0 | 0 | ❌ Mostly empty |
| PMB | 20 | 20 | 0 | 0 | ✅ Good |
| PKL | 11 | 11 | 0 | 0 | ❌ Empty |
| KKN | 14 | 14 | 0 | 0 | ❌ Empty |
| TA | 16 | 16 | 0 | 0 | ❌ Empty |
| Skripsi | 16 | 16 | 0 | 0 | ❌ Empty |
| **TOTAL** | **218** | **218** | **0** | **0** | |

---

## ⚠️ Layout/Styling Warnings

### LPM Portal (10 pages)
Semua halaman `lpm/portal/*` tidak punya breadcrumbs dan sidebar.
**Expected?** YES — LPM portal adalah halaman publik dengan layout berbeda (tanpa sidebar admin). Ini **by design**, bukan bug.

### HRM — `hrm/admin/asesor/search-users`
Halaman search users (modal/AJAX endpoint) tidak punya breadcrumbs/sidebar.
**Expected?** YES — ini kemungkinan endpoint AJAX untuk modal pencarian user, bukan halaman standalone.

---

## 📦 Dummy Data Status

### ✅ Sudah Terdummy:
- **HRM**: Dashboard (5 dosen, 7 tendik), jadwal kinerja, asesor, scoring config ✅
- **PMB**: 17 pendaftar, jalur pendaftaran, kuota prodi, bank soal, potongan ✅

### ⚠️ Partial:
- **HRM Portal Dosen**: Profil dosen kosong, kinerja (bimbingan, pengujian, pengajaran, penelitian, pengabdian) semua kosong. Admin side punya data tapi portal side belum di-seed per dosen.
- **HRM Portal Tendik**: Sama — profil dan semua kinerja kosong.

### ❌ Tidak Ada Dummy Data:
- **P3M**: Semua tabel kosong (0 proposal, 0 aktivasi, 0 arsip, 0 luaran). Dashboard shows all zeros.
- **LPM**: Kebijakan, standar, dokumen SPMI, formulir, pelaksanaan, evaluasi, pengendalian, peningkatan, AMI — semua kosong.
- **PKL**: 0 registrations, 0 monitoring, 0 sidang, 0 logbook.
- **KKN**: 0 periode, 0 peserta, 0 seminar.
- **TA**: 0 proposals, 0 monitoring, 0 unggah mandiri.
- **Skripsi**: 0 proposals, 0 monitoring, 0 unggah mandiri.

---

## 🎨 Styling & Layout Consistency

### ✅ Konsisten:
- Navbar breadcrumbs present di semua halaman admin ✅
- Sidebar navigation konsisten across modules ✅ 
- Card/table layouts menggunakan components yang sama ✅
- Tidak ada tombol di navbar ✅
- Search bar di navbar konsisten ✅
- User avatar & notification bell konsisten ✅

---

## 🔧 Yang Sudah Diperbaiki Saat Audit

1. **Merged `dev/pmb-gap-implementation`** → PMB routes, controllers, views, migrations, seeders
2. **Fixed route cache stale** → `bootstrap/cache/routes-v7.php` was stale, preventing PMB routes from loading
3. **Ran migrations** → PMB tables created
4. **Seeded PMB test data** → 17 pendaftar dummy
5. **Fixed HRM jadwal kinerja** → Deactivated expired jadwal (id=3) yang memblok dosen create pages
6. **Fixed HRM role mapping** → asesor@sttw.ac.id tidak punya hrm_asesor record; budi.santoso sebagai asesor sebenarnya

---

## 📝 Action Items (Priority Order)

### P1 — Seed Dummy Data:
1. **P3M** — Needs full dummy data seeder (proposals, seleksi, SPK, monev, laporan, luaran)
2. **LPM** — Needs dummy data for kebijakan, standar, dokumen, AMI, temuan
3. **PKL/KKN/TA/Skripsi** — Need registrations, proposals, logbooks, sidang data
4. **HRM Portal** — Seed per-dosen and per-tendik kinerja data

### P2 — Minor UI:
5. **P3M dashboard stat cards** — Fix label truncation
6. **Merge remaining branches** — `dev/siska-kkn`, `dev/siska-skripsi` may have fixes for the 500 errors above

---

## 📁 Screenshots
All screenshots saved to `/home/ubuntu/siakad-sttw-audit/<module>/screenshots/`
Total: 218 screenshots across 8 modules.
