# SIAKAD STTW Module Audit Instructions

## Objective
Audit a specific module of the SIAKAD STTW web application using Playwright browser automation.
Check every accessible page for:
1. **Dummy data** - All visible data should be dummy/test data
2. **Styling/layout consistency** - Uses proper components (breadcrumbs in navbar, no buttons in navbar, consistent card/table layouts)
3. **No HTTP errors** - No 500, 403, 404, or other error pages
4. **No Laravel errors** - No "Whoops!" error pages or stack traces

## Environment
- **Base URL**: https://sttw-dev.leolitgames.com
- **Password for ALL accounts**: `password`
- **Playwright installed**: Use `npx playwright` or import from `playwright`

## Available Test Accounts
| Email | Role | Use For |
|-------|------|---------|
| developer@sttw.ac.id | developer | Full access fallback |
| admin@sttw.ac.id | admin | Admin modules |
| waket1@sttw.ac.id | waket1 | P3M admin |
| waket2@sttw.ac.id | waket2 | HRM admin |
| budi.santoso@sttw.ac.id | dosen | HRM portal dosen, P3M dosen |
| dosen@sttw.ac.id | dosen | Alternative dosen |
| mahasiswa@sttw.ac.id | mahasiswa | SISKA student modules |
| tendik@sttw.ac.id | tendik | HRM tendik portal |
| asesor@sttw.ac.id | asesor | HRM asesor |
| admin-lpm@sttw.ac.id | admin-lpm | LPM admin |
| auditor@sttw.ac.id | auditor-internal | LPM auditor |
| kaprodi@sttw.ac.id | kaprodi | LPM kaprodi |
| admin-mhs@sttw.ac.id | admin-kemahasiswaan | PMB admin |
| akademik@sttw.ac.id | akademik | Academic admin |

## Module → Role Mapping
- **HRM**: waket2 (admin), asesor, budi.santoso (dosen portal), tendik
- **P3M**: waket1 (admin), budi.santoso/dosen (dosen portal)
- **LPM**: admin-lpm (admin), auditor (auditor), kaprodi (kaprodi), portal (public or admin-lpm)
- **PMB**: admin-mhs (admin), public landing (no auth needed for /pmb)
- **SISKA PKL/KKN/TA/Skripsi**: admin (admin pages), dosen (dosen pages), mahasiswa (student pages)

## Audit Process
1. Login with the appropriate role for the module section
2. Navigate to each GET route (skip parameterized routes like `{id}` unless you can find a real ID from index pages)
3. Take a full-page screenshot of each page
4. Check for errors in the page content
5. Check styling: breadcrumbs present, no misplaced buttons, consistent layouts
6. Record findings

## Output Format
Write a `REPORT.md` in the module's audit directory with:
```markdown
# Audit Report: [MODULE NAME]
**Date**: YYYY-MM-DD
**Auditor**: Sub-agent (Sonnet)

## Summary
- Total pages tested: X
- ✅ Passed: X
- ❌ Failed: X
- ⚠️ Warnings: X

## Criteria Check
### 1. Dummy Data
[findings]

### 2. Styling & Layout Consistency
[findings]

### 3. HTTP Errors (500/403/404)
[findings]

### 4. Other Issues
[findings]

## Detailed Results
[per-page results with screenshots]
```

## Existing Workflow Reports (Reference)
Check `/home/ubuntu/siakad-sttw-workflow-reports/` for existing workflow report screenshots.
Compare current state with these reference screenshots where available.

## Important Notes
- The app uses HTTPS with valid cert at sttw-dev.leolitgames.com
- Some routes with `{parameters}` need real IDs - get them from index/list pages
- Use `fullPage: true` for screenshots
- Export routes are usually downloads - skip them or just verify they respond 200
- Some pages require specific permissions - if you get 403, note it as a finding
- The codebase is at `/home/ubuntu/siakad-sttw/` - you can check blade files for expected layout
