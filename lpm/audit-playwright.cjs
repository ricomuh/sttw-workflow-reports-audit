const { chromium } = require('/home/ubuntu/siakad-sttw/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://sttw-dev.leolitgames.com';
const OUT_DIR = '/home/ubuntu/siakad-sttw-audit/lpm/screenshots';
const RESULTS_FILE = '/home/ubuntu/siakad-sttw-audit/lpm/audit-results.json';

fs.mkdirSync(OUT_DIR, { recursive: true });

const delay = ms => new Promise(r => setTimeout(r, ms));

async function loginAs(page, email, password) {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.fill('input[name="login"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await delay(2000);
    const url = page.url();
    console.log(`  Logged in as ${email}, now at: ${url}`);
}

async function visitPage(page, url, name) {
    const result = { url, name, status: null, error: false, issues: [], screenshotPath: null };
    try {
        const resp = await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 20000 });
        await delay(500);
        result.status = resp?.status();

        const bodyText = await page.textContent('body').catch(() => '');
        const title = await page.title().catch(() => '');

        // Detect errors
        if (bodyText.includes('Whoops, looks like something went wrong') ||
            bodyText.includes('Server Error') ||
            bodyText.includes('ErrorException') ||
            bodyText.includes('SQLSTATE')) {
            result.error = true;
            result.issues.push({ level: 'CRITICAL', msg: `Laravel error on page: ${title}` });
        }
        if (result.status === 500) result.issues.push({ level: 'CRITICAL', msg: '500 Internal Server Error' });
        if (result.status === 404) result.issues.push({ level: 'CRITICAL', msg: '404 Not Found' });
        if (result.status === 403) result.issues.push({ level: 'CRITICAL', msg: '403 Forbidden' });
        if (result.status === 401) result.issues.push({ level: 'CRITICAL', msg: '401 Unauthorized' });
        if (result.status === 302 || page.url().includes('/login')) {
            result.issues.push({ level: 'CRITICAL', msg: `Redirected to login - auth failed (${page.url()})` });
            result.error = true;
        }

        // Layout checks
        const hasSidebar = await page.$('.sidebar, nav.sidebar, aside, [class*="sidebar"]').catch(() => null);
        if (!hasSidebar) result.issues.push({ level: 'WARNING', msg: 'No sidebar found' });

        const hasBreadcrumb = await page.$('[class*="breadcrumb"]').catch(() => null);
        if (!hasBreadcrumb) result.issues.push({ level: 'INFO', msg: 'No breadcrumb found' });

        // Check empty tables
        const tableRows = await page.$$('table tbody tr').catch(() => []);
        if (tableRows.length === 0) {
            const hasTable = await page.$('table').catch(() => null);
            if (hasTable) result.issues.push({ level: 'INFO', msg: 'Table is empty (no data rows)' });
        } else {
            result.dataCount = tableRows.length;
        }

        // Check for empty forms (create pages)
        if (url.includes('/create') || url.includes('/edit')) {
            const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"]), select, textarea').catch(() => []);
            if (inputs.length === 0) result.issues.push({ level: 'WARNING', msg: 'No form inputs found on create/edit page' });
        }

        // Screenshot
        const prefix = result.error || result.status >= 400 ? 'ERROR_' : '';
        const screenshotName = `${prefix}${name}.png`;
        const screenshotPath = path.join(OUT_DIR, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshotPath = screenshotName;

        const statusIcon = result.error ? '❌' : (result.issues.length ? '⚠️' : '✅');
        console.log(`  ${statusIcon} [${result.status}] ${url} → ${screenshotName}`);
        if (result.issues.length) {
            result.issues.forEach(i => console.log(`      ${i.level}: ${i.msg}`));
        }
    } catch (err) {
        result.error = true;
        result.issues.push({ level: 'CRITICAL', msg: `Navigation error: ${err.message.substring(0, 200)}` });
        await page.screenshot({ path: path.join(OUT_DIR, `ERROR_${name}.png`), fullPage: true }).catch(() => {});
        result.screenshotPath = `ERROR_${name}.png`;
        console.log(`  ❌ [FAIL] ${url}: ${err.message.substring(0, 100)}`);
    }
    return result;
}

async function main() {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
    const allResults = [];

    // ============ LPM ADMIN ============
    console.log('\n🔐 Testing LPM Admin routes...');
    const ctxAdmin = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pageAdmin = await ctxAdmin.newPage();
    await loginAs(pageAdmin, 'admin-lpm@sttw.ac.id', 'password');

    const adminRoutes = [
        ['lpm_admin', '/lpm/admin'],
        ['lpm_admin_ami-formulir-template', '/lpm/admin/ami-formulir-template'],
        ['lpm_admin_ami-formulir-template_create', '/lpm/admin/ami-formulir-template/create'],
        ['lpm_admin_ami-jadwal', '/lpm/admin/ami-jadwal'],
        ['lpm_admin_ami-jadwal_create', '/lpm/admin/ami-jadwal/create'],
        ['lpm_admin_ami-temuan', '/lpm/admin/ami-temuan'],
        ['lpm_admin_dokumen', '/lpm/admin/dokumen'],
        ['lpm_admin_dokumen_create', '/lpm/admin/dokumen/create'],
        ['lpm_admin_dokumen-spmi', '/lpm/admin/dokumen-spmi'],
        ['lpm_admin_dokumen-spmi_create', '/lpm/admin/dokumen-spmi/create'],
        ['lpm_admin_evaluasi', '/lpm/admin/evaluasi'],
        ['lpm_admin_evaluasi_create', '/lpm/admin/evaluasi/create'],
        ['lpm_admin_formulir', '/lpm/admin/formulir'],
        ['lpm_admin_formulir_create', '/lpm/admin/formulir/create'],
        ['lpm_admin_kebijakan', '/lpm/admin/kebijakan'],
        ['lpm_admin_kebijakan_create', '/lpm/admin/kebijakan/create'],
        ['lpm_admin_pelaksanaan', '/lpm/admin/pelaksanaan'],
        ['lpm_admin_pelaksanaan_create', '/lpm/admin/pelaksanaan/create'],
        ['lpm_admin_pengendalian', '/lpm/admin/pengendalian'],
        ['lpm_admin_pengendalian_create', '/lpm/admin/pengendalian/create'],
        ['lpm_admin_peningkatan', '/lpm/admin/peningkatan'],
        ['lpm_admin_peningkatan_create', '/lpm/admin/peningkatan/create'],
        ['lpm_admin_prodi', '/lpm/admin/prodi'],
        ['lpm_admin_profil-pt', '/lpm/admin/profil-pt'],
        ['lpm_admin_profil-pt_edit', '/lpm/admin/profil-pt/edit'],
        ['lpm_admin_setting', '/lpm/admin/setting'],
        ['lpm_admin_sk-akreditasi', '/lpm/admin/sk-akreditasi'],
        ['lpm_admin_sk-akreditasi_create', '/lpm/admin/sk-akreditasi/create'],
        ['lpm_admin_sk-pendirian', '/lpm/admin/sk-pendirian'],
        ['lpm_admin_sk-pendirian_create', '/lpm/admin/sk-pendirian/create'],
        ['lpm_admin_standar-institusi', '/lpm/admin/standar-institusi'],
        ['lpm_admin_standar-institusi_create', '/lpm/admin/standar-institusi/create'],
        ['lpm_admin_standar-lain', '/lpm/admin/standar-lain'],
        ['lpm_admin_standar-lain_create', '/lpm/admin/standar-lain/create'],
        ['lpm_admin_standar-pt', '/lpm/admin/standar-pt'],
    ];

    for (const [name, url] of adminRoutes) {
        const r = await visitPage(pageAdmin, url, name);
        r.role = 'admin';
        allResults.push(r);
    }
    await ctxAdmin.close();

    // ============ AUDITOR ============
    console.log('\n🔐 Testing Auditor routes...');
    const ctxAuditor = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pageAuditor = await ctxAuditor.newPage();
    await loginAs(pageAuditor, 'auditor@sttw.ac.id', 'password');

    const auditorRoutes = [
        ['lpm_auditor', '/lpm/auditor'],
        ['lpm_auditor_penugasan', '/lpm/auditor/penugasan'],
        ['lpm_auditor_temuan', '/lpm/auditor/temuan'],
        ['lpm_auditor_temuan_create', '/lpm/auditor/temuan/create'],
    ];
    for (const [name, url] of auditorRoutes) {
        const r = await visitPage(pageAuditor, url, name);
        r.role = 'auditor';
        allResults.push(r);
    }
    await ctxAuditor.close();

    // ============ KAPRODI ============
    console.log('\n🔐 Testing Kaprodi routes...');
    const ctxKaprodi = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pageKaprodi = await ctxKaprodi.newPage();
    await loginAs(pageKaprodi, 'kaprodi@sttw.ac.id', 'password');

    const kaprodiRoutes = [
        ['lpm_kaprodi', '/lpm/kaprodi'],
        ['lpm_kaprodi_standar', '/lpm/kaprodi/standar'],
        ['lpm_kaprodi_temuan', '/lpm/kaprodi/temuan'],
    ];
    for (const [name, url] of kaprodiRoutes) {
        const r = await visitPage(pageKaprodi, url, name);
        r.role = 'kaprodi';
        allResults.push(r);
    }
    await ctxKaprodi.close();

    // ============ PORTAL ============
    console.log('\n🔐 Testing Portal routes...');
    const ctxPortal = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pagePortal = await ctxPortal.newPage();
    await loginAs(pagePortal, 'developer@sttw.ac.id', 'password');

    const portalRoutes = [
        ['lpm_portal', '/lpm/portal'],
        ['lpm_portal_akreditasi', '/lpm/portal/akreditasi'],
        ['lpm_portal_dokumen', '/lpm/portal/dokumen'],
        ['lpm_portal_evaluasi', '/lpm/portal/evaluasi'],
        ['lpm_portal_pelaksanaan', '/lpm/portal/pelaksanaan'],
        ['lpm_portal_penetapan', '/lpm/portal/penetapan'],
        ['lpm_portal_pengendalian', '/lpm/portal/pengendalian'],
        ['lpm_portal_peningkatan', '/lpm/portal/peningkatan'],
        ['lpm_portal_prodi', '/lpm/portal/prodi'],
        ['lpm_portal_profil', '/lpm/portal/profil'],
    ];
    for (const [name, url] of portalRoutes) {
        const r = await visitPage(pagePortal, url, name);
        r.role = 'portal';
        allResults.push(r);
    }
    await ctxPortal.close();

    // Export routes (no screenshot, just status)
    console.log('\n📥 Testing Export routes (admin)...');
    const ctxExport = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const pageExport = await ctxExport.newPage();
    await loginAs(pageExport, 'admin-lpm@sttw.ac.id', 'password');
    const exportRoutes = [
        ['lpm_admin_export_evaluasi', '/lpm/admin/export/evaluasi'],
        ['lpm_admin_export_kebijakan', '/lpm/admin/export/kebijakan'],
        ['lpm_admin_export_pelaksanaan', '/lpm/admin/export/pelaksanaan'],
        ['lpm_admin_export_pengendalian', '/lpm/admin/export/pengendalian'],
        ['lpm_admin_export_peningkatan', '/lpm/admin/export/peningkatan'],
        ['lpm_admin_export_ppepp', '/lpm/admin/export/ppepp'],
        ['lpm_admin_export_standar-institusi', '/lpm/admin/export/standar-institusi'],
        ['lpm_admin_export_standar-lain', '/lpm/admin/export/standar-lain'],
    ];
    for (const [name, url] of exportRoutes) {
        const r = await visitPage(pageExport, url, name);
        r.role = 'admin-export';
        allResults.push(r);
    }
    await ctxExport.close();

    await browser.close();

    fs.writeFileSync(RESULTS_FILE, JSON.stringify(allResults, null, 2));

    // Summary
    const total = allResults.length;
    const errors = allResults.filter(r => r.error || (r.status && r.status >= 400));
    const warnings = allResults.filter(r => !r.error && r.issues.some(i => i.level === 'WARNING'));
    const pass = allResults.filter(r => !r.error && (r.status < 400 || !r.status));

    console.log(`\n\n📊 SUMMARY`);
    console.log(`  Total: ${total} | Pass: ${pass.length} | Errors: ${errors.length} | Warnings: ${warnings.length}`);
    console.log(`  Results saved to: ${RESULTS_FILE}`);
}

main().catch(e => { console.error(e); process.exit(1); });
