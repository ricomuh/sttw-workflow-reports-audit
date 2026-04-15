# 📋 SIAKAD STTW Module Audit Report
**Tanggal**: 2026-04-15
**Auditor**: OpenClaw (Playwright automated + visual review)
**URL**: https://sttw-dev.leolitgames.com

---

## 📊 Executive Summary

| Modul | Total Pages | ✅ OK | ⚠️ Warning | ❌ Error | Dummy Data |
|-------|:-----------:|:-----:|:----------:|:-------:|:----------:|
| HRM | 54 | 53 | 1 | 0 | ⚠️ Partial |
| P3M | 35 | 35 | 0 | 0 | ❌ Mostly empty |
| LPM | 52 | 42 | 10 | 0 | ❌ Mostly empty |
| PMB | 20 | 16 | 0 | 4* | ✅ Good |
| PKL | 11 | 10 | 0 | 1 | ❌ Empty |
| KKN | 14 | 13 | 0 | 1 | ❌ Empty |
| TA | 16 | 15 | 0 | 1 | ❌ Empty |
| Skripsi | 16 | 15 | 0 | 1 | ❌ Empty |
| **TOTAL** | **218** | **199** | **11** | **8** | |

\* PMB public pages (4) = script bug, manual curl confirms all return 200 OK.

---

## 🔴 Critical Errors (500 Server Error)

### 1. KKN — `/siska/kkn/peserta` (500)
**Error**: `Column not found: 1054 Unknown column 'kkn_batch_id' in WHERE`
**Table**: `kkn_locations`
**Cause**: Missing column `kkn_batch_id` in `kkn_locations` table. Likely needs migration from branch `dev/siska-kkn`.

### 2. TA — `/siska/ta/rekap-dosen` (500)
**Error**: `Syntax error: 1055 'siakad_sttw.dosen.user_id' isn't in GROUP BY`
**Cause**: MySQL strict mode — `SELECT dosen.*` with `GROUP BY dosen.id` violates `ONLY_FULL_GROUP_BY`. Fix: add all selected columns to GROUP BY or use `selectRaw` with explicit columns.

### 3. Skripsi — `/siska/skripsi/rekap-dosen` (500)
**Error**: Same as TA — `dosen.user_id isn't in GROUP BY`
**Cause**: Identical query pattern as TA rekap-dosen. Same fix needed.

### 4. Dashboard Dosen (cross-cutting) — `unified.blade.php` (500)
**Error**: `Column not found: 1054 Unknown column 'semester_aktif' in WHERE` on `formasi_dosen` table
**Note**: This affects ALL dosen login → dashboard. During audit, HRM portal pages still loaded because they bypass the unified dashboard. This will block any dosen user trying to access their main dashboard.

---

## 🟡 HTTP 404 Errors

### 5. PKL — `/siska/pkl/sidangs/create` (404)
Route registered tapi tidak ada view/controller handler untuk create tanpa parameter. Kemungkinan create sidang harus melalui flow lain (dari detail registration).

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

### ⚠️ Minor:
- P3M dashboard: Stat card labels terpotong ("Pe...", "Da...") karena text terlalu panjang untuk card width. Functional tapi kurang rapi.
- LPM portal: Layout beda tapi ini by design untuk public portal.

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

### P0 — Fix Server Errors:
1. **Fix unified.blade.php** — `semester_aktif` column missing in `formasi_dosen`. Run migration atau fix query.
2. **Fix KKN peserta** — `kkn_batch_id` column missing in `kkn_locations`. Need migration from `dev/siska-kkn` branch.
3. **Fix TA & Skripsi rekap-dosen** — GROUP BY strict mode violation. Fix query to be MySQL strict-compliant.

### P1 — Seed Dummy Data:
4. **P3M** — Needs full dummy data seeder (proposals, seleksi, SPK, monev, laporan, luaran)
5. **LPM** — Needs dummy data for kebijakan, standar, dokumen, AMI, temuan
6. **PKL/KKN/TA/Skripsi** — Need registrations, proposals, logbooks, sidang data
7. **HRM Portal** — Seed per-dosen and per-tendik kinerja data

### P2 — Minor UI:
8. **P3M dashboard stat cards** — Fix label truncation
9. **Merge remaining branches** — `dev/siska-kkn`, `dev/siska-skripsi` may have fixes for the 500 errors above

---

## 📁 Screenshots
All screenshots saved to `/home/ubuntu/siakad-sttw-audit/<module>/screenshots/`
Total: 218 screenshots across 8 modules.
