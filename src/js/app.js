/* =============================================
   SECURITY EVENT DASHBOARD - app.js
   Kompakte, vollständige Version
   ============================================= */

'use strict';

console.log('🚀 Security Dashboard startet...');

// =============================================
// GLOBAL STATE & CONFIG
// =============================================
const DashboardState = {
    allData: [],
    currentData: [],
    headerMap: {},
    chartInstances: {},
    isInitialized: false
};

const CONFIG = {
    riskWeights: {
        'Diebstahl': 9, 'Verdächtige Person': 7, 'Zutrittsverletzung': 6,
        'Alarmanlage ausgelöst': 5, 'Vandalismus': 8, 'Einbruch': 10, 'Brandschutz': 9
    },
    chartColors: ['#00a37a', '#006b4e', '#4caf50', '#8bc34a', '#cddc39', '#ffc107', '#ff9800', '#ff5722']
};

// =============================================
// i18n - Sprachen
// =============================================
const i18n = {
    current: 'de',
    set(lang) { this.current = ['de', 'en'].includes(lang) ? lang : 'de'; },
    t(key, vars = {}) {
        const str = this.strings[key]?.[this.current] || this.strings[key]?.de || key;
        return str.replace(/\{\{(\w+)\}\}/g, (_, v) => vars[v] !== undefined ? String(vars[v]) : '');
    },
    strings: {
        pdf_title: { de: 'SECURITY EVENT DASHBOARD', en: 'SECURITY EVENT DASHBOARD' },
        pdf_subtitle: { de: 'Executive Summary Report', en: 'Executive Summary Report' },
        toast_pdf_start: { de: 'PDF-Report wird erstellt...', en: 'Generating PDF report...' },
        toast_pdf_success: { de: 'PDF-Report erstellt: {{file}}', en: 'PDF report created: {{file}}' },
        toast_pdf_error: { de: 'PDF-Fehler: {{error}}', en: 'PDF error: {{error}}' },
        footer_left: { de: 'Security Events Dashboard', en: 'Security Events Dashboard' },
        footer_page: { de: 'Seite {{page}}', en: 'Page {{page}}' }
    }
};

// =============================================
// TEST DATA
// =============================================
const TestData = {
    csv: `Land;Liegenschaft;Ereignisart;Datum
Deutschland;Mainz Campus;Zutrittsverletzung;2025-01-03 18:23
Deutschland;Mainz Campus;Zutrittsverletzung;2025-01-04 22:10
Deutschland;Mainz Campus;Alarmanlage ausgelöst;2025-01-05 05:11
Deutschland;Berlin Research;Zutrittsverletzung;2025-02-01 08:45
Deutschland;Berlin Research;Verdächtige Person;2025-02-02 09:30
Deutschland;Berlin Research;Verdächtige Person;2025-02-04 14:05
Deutschland;München Warehouse;Diebstahl;2025-03-01 23:50
Deutschland;München Warehouse;Diebstahl;2025-03-02 21:40
Deutschland;München Warehouse;Alarmanlage ausgelöst;2025-03-05 03:10
Deutschland;München Warehouse;Zutrittsverletzung;2025-03-06 06:05
USA;Cambridge Lab;Zutrittsverletzung;2025-01-10 11:15
USA;Cambridge Lab;Verdächtige Person;2025-01-12 19:05
USA;Cambridge Lab;Alarmanlage ausgelöst;2025-01-15 20:45
USA;San Diego Office;Verdächtige Person;2025-02-10 17:20
USA;San Diego Office;Verdächtige Person;2025-02-12 18:10
USA;San Diego Office;Diebstahl;2025-02-14 16:55
USA;San Diego Office;Zutrittsverletzung;2025-02-16 07:40
UK;London HQ;Zutrittsverletzung;2025-01-07 08:05
UK;London HQ;Zutrittsverletzung;2025-01-09 09:15
UK;London HQ;Verdächtige Person;2025-01-11 10:30
UK;London HQ;Alarmanlage ausgelöst;2025-01-13 21:55
UK;Reading Plant;Diebstahl;2025-03-03 23:05
UK;Reading Plant;Diebstahl;2025-03-06 22:50
UK;Reading Plant;Zutrittsverletzung;2025-03-07 04:15
Schweiz;Basel Site;Verdächtige Person;2025-02-03 13:15
Schweiz;Basel Site;Verdächtige Person;2025-02-05 14:25
Schweiz;Basel Site;Alarmanlage ausgelöst;2025-02-06 02:50
Schweiz;Basel Site;Zutrittsverletzung;2025-02-08 06:30
Belgien;Brüssel Office;Zutrittsverletzung;2025-01-20 07:40
Belgien;Brüssel Office;Diebstahl;2025-01-22 20:10
Belgien;Brüssel Office;Diebstahl;2025-01-23 21:20
Belgien;Brüssel Office;Verdächtige Person;2025-01-25 15:30`
};

// =============================================
// UTILITIES
// =============================================
const Utils = {
    parseCSV(text) {
        if (!text) return { headers: [], rows: [] };
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (!lines.length) return { headers: [], rows: [] };
        const delimiter = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim());
        const rows = lines.slice(1).map(line => {
            const cells = line.split(delimiter);
            const row = {};
            headers.forEach((h, i) => row[h] = (cells[i] || '').trim());
            return row;
        });
        return { headers, rows };
    },

    createHeaderMap(headers) {
        const map = {};
        headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes('land') || lower.includes('country')) map.country = h;
            if (lower.includes('liegenschaft') || lower.includes('site')) map.site = h;
            if (lower.includes('ereignis') || lower.includes('event') || lower.includes('typ')) map.type = h;
            if (lower.includes('datum') || lower.includes('date')) map.date = h;
        });
        return map;
    },

    groupAndCount(data, keyFn) {
        const map = new Map();
        data.forEach(row => {
            const key = keyFn(row);
            if (key) map.set(key, (map.get(key) || 0) + 1);
        });
        return Array.from(map.entries())
            .map(([key, count]) => ({ key, count }))
            .sort((a, b) => b.count - a.count);
    },

    classifyCategory(row, headerMap) {
        const text = (headerMap.type && row[headerMap.type] || '').toLowerCase();
        const security = ['diebstahl', 'einbruch', 'vandalismus', 'zutritt', 'verdächtig', 'alarm', 'security'];
        const fm = ['facility', 'aufzug', 'klima', 'heizung', 'wartung', 'stromausfall'];
        const she = ['unfall', 'verletzung', 'brandschutz', 'brand', 'evakuierung', 'gefahrstoff'];
        if (security.some(kw => text.includes(kw))) return 'Security';
        if (fm.some(kw => text.includes(kw))) return 'FM';
        if (she.some(kw => text.includes(kw))) return 'SHE';
        return 'Other';
    },

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
};

// =============================================
// UI HELPER
// =============================================
const UI = {
    showToast(message, type = 'info', timeout = 4000) {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const div = document.createElement('div');
        div.className = `toast toast-${type}`;
        div.textContent = message;
        container.appendChild(div);
        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => div.remove(), 300);
        }, timeout);
    },

    updateText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
};

// =============================================
// CHART MANAGER
// =============================================
const ChartManager = {
    create(containerId, data, type = 'bar', maxBars = 6) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!data || !data.length) {
            container.innerHTML = '<div class="empty-state"><strong>Keine Daten</strong></div>';
            return;
        }

        if (DashboardState.chartInstances[containerId]) {
            DashboardState.chartInstances[containerId].destroy();
        }

        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        const chartData = data.slice(0, maxBars);

        const config = {
            type,
            data: {
                labels: chartData.map(d => d.key || '(leer)'),
                datasets: [{
                    label: 'Anzahl',
                    data: chartData.map(d => d.count),
                    backgroundColor: CONFIG.chartColors.slice(0, chartData.length).map(c => c + '80'),
                    borderColor: CONFIG.chartColors.slice(0, chartData.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: type === 'pie', position: 'bottom' } },
                scales: type === 'pie' ? {} : { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }
        };

        try {
            DashboardState.chartInstances[containerId] = new Chart(canvas, config);
        } catch (e) {
            console.error('Chart error:', e);
        }
    },

    destroyAll() {
        Object.values(DashboardState.chartInstances).forEach(c => c && c.destroy());
        DashboardState.chartInstances = {};
    }
};
// =============================================
// ANALYTICS ENGINE
// =============================================
class SecurityAnalytics {
    constructor(data, headerMap) {
        this.data = data || [];
        this.headerMap = headerMap || {};
        this.insights = {};
    }

    analyze() {
        this.calculateRisk();
        this.detectPatterns();
        this.renderAll();
    }

    calculateRisk() {
        const byType = Utils.groupAndCount(this.data, r => this.headerMap.type ? r[this.headerMap.type] : '');
        let total = 0, max = 0, high = 0;
        byType.forEach(e => {
            const w = CONFIG.riskWeights[e.key] || 3;
            total += e.count * w;
            max += e.count * 10;
            if (w >= 8) high += e.count;
        });
        const score = Math.round((total / Math.max(max, 1)) * 100);
        this.insights.risk = {
            score,
            level: score >= 70 ? 'HOCH' : score >= 40 ? 'MITTEL' : 'NIEDRIG',
            class: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
            highRiskEvents: high,
            criticalTypes: byType.filter(e => (CONFIG.riskWeights[e.key] || 0) >= 8)
        };
    }

    detectPatterns() {
        const sites = Utils.groupAndCount(this.data, r => this.headerMap.site ? r[this.headerMap.site] : '');
        const avg = this.data.length / Math.max(sites.length, 1);
        this.insights.hotspots = sites.filter(s => s.count > avg * 1.5);

        const domains = { Security: 0, FM: 0, SHE: 0, Other: 0 };
        this.data.forEach(r => { domains[Utils.classifyCategory(r, this.headerMap)]++; });
        this.insights.domains = Object.entries(domains).map(([k, v]) => ({
            domain: k, count: v, share: Math.round((v / this.data.length) * 100)
        })).sort((a, b) => b.count - a.count);
    }

    renderAll() {
        const r = this.insights.risk;
        const riskEl = document.getElementById('riskAssessment');
        if (riskEl) {
            riskEl.innerHTML = `
                <div class="insight-item risk-${r.class}">
                    <div class="insight-value">Risiko: $${r.level} ($${r.score}%)</div>
                    <div class="insight-trend">$${r.highRiskEvents} kritische von $${this.data.length} Ereignissen</div>
                </div>
                $${r.criticalTypes[0] ? `<div class="insight-item"><div class="insight-value">⚠️ $${r.criticalTypes[0].key}: ${r.criticalTypes[0].count}x</div></div>` : ''}
            `;
        }

        const patternEl = document.getElementById('patternDetection');
        if (patternEl) {
            const d = this.insights.domains[0];
            patternEl.innerHTML = `
                <div class="insight-item">
                    <div class="insight-value">${this.insights.hotspots.length ? '🔴 ' + this.insights.hotspots.length + ' Hotspots erkannt' : '✅ Keine kritischen Muster'}</div>
                </div>
                <div class="insight-item">
                    <div class="insight-value">Top-Bereich: $${d.domain} ($${d.count}, ${d.share}%)</div>
                </div>
            `;
        }

        const recEl = document.getElementById('smartRecommendations');
        if (recEl) {
            recEl.innerHTML = r.level === 'HOCH'
                ? '<div class="insight-item"><div class="insight-value">🚨 Sofortige Sicherheitsmaßnahmen empfohlen</div></div>'
                : '<div class="insight-item"><div class="insight-value">✅ Standardmonitoring fortführen</div></div>';
        }

        const trendEl = document.getElementById('trendForecast');
        if (trendEl) {
            trendEl.innerHTML = `
                <div class="insight-item">
                    <div class="insight-value">Trend: ${r.score > 50 ? '📈 Steigend' : '📉 Stabil'}</div>
                    <div class="insight-trend">${this.data.length} Events analysiert</div>
                </div>
            `;
        }
    }
}

// =============================================
// THEME MANAGER
// =============================================
const ThemeManager = {
    init() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) return;
        const saved = localStorage.getItem('theme') || 'light';
        this.setTheme(saved);
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            this.setTheme(current === 'dark' ? 'light' : 'dark');
        });
    },
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        const label = document.querySelector('.theme-label');
        if (label) label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    }
};

// =============================================
// FILTER MANAGER
// =============================================
const FilterManager = {
    apply() {
        const country = document.getElementById('filterCountry')?.value || '__ALL__';
        const site = document.getElementById('filterSite')?.value || '__ALL__';
        const type = document.getElementById('filterType')?.value || '__ALL__';

        DashboardState.currentData = DashboardState.allData.filter(row => {
            const rc = DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : '';
            const rs = DashboardState.headerMap.site ? row[DashboardState.headerMap.site] : '';
            const rt = DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : '';
            if (country !== '__ALL__' && rc !== country) return false;
            if (site !== '__ALL__' && rs !== site) return false;
            if (type !== '__ALL__' && rt !== type) return false;
            return true;
        });

        this.updateStatus();
        RenderManager.renderAll();
    },

    reset() {
        ['filterCountry', 'filterSite', 'filterType'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '__ALL__';
        });
        this.apply();
    },

    updateStatus() {
        const status = document.getElementById('filterStatus');
        if (status) {
            status.textContent = `Zeige $${DashboardState.currentData.length} von $${DashboardState.allData.length} Datensätzen`;
        }
    },

    updateOptions(selectId, values, placeholder) {
        const select = document.getElementById(selectId);
        if (!select) return;
        const current = select.value;
        select.innerHTML = `<option value="__ALL__">${placeholder}</option>` +
            values.map(v => `<option value="$${v}">$${v}</option>`).join('');
        if (values.includes(current)) select.value = current;
    }
};

// =============================================
// RENDER MANAGER
// =============================================
const RenderManager = {
    renderAll() {
        this.renderKPIs();
        this.renderFilters();
        this.renderTables();
        this.renderCharts();
        this.runAnalytics();
    },

    renderKPIs() {
        UI.updateText('kpiTotalEvents', DashboardState.allData.length);
        UI.updateText('kpiTotalEventsSub', DashboardState.currentData.length + ' nach Filter');

        const countries = new Set(), sites = new Set(), types = new Set();
        DashboardState.allData.forEach(r => {
            if (DashboardState.headerMap.country && r[DashboardState.headerMap.country]) countries.add(r[DashboardState.headerMap.country]);
            if (DashboardState.headerMap.site && r[DashboardState.headerMap.site]) sites.add(r[DashboardState.headerMap.site]);
            if (DashboardState.headerMap.type && r[DashboardState.headerMap.type]) types.add(r[DashboardState.headerMap.type]);
        });
        UI.updateText('kpiCountries', countries.size);
        UI.updateText('kpiSites', sites.size);
        UI.updateText('kpiTypes', types.size);
    },

    renderFilters() {
        const get = (key) => [...new Set(DashboardState.allData.map(r => DashboardState.headerMap[key] ? r[DashboardState.headerMap[key]] : '').filter(Boolean))].sort();
        FilterManager.updateOptions('filterCountry', get('country'), 'Alle Länder');
        FilterManager.updateOptions('filterSite', get('site'), 'Alle Liegenschaften');
        FilterManager.updateOptions('filterType', get('type'), 'Alle Ereignisarten');
    },

    renderTables() {
        const empty = '<tr><td colspan="3" class="empty-state">Keine Daten</td></tr>';
        if (!DashboardState.currentData.length) {
            ['tableByCountry', 'tableBySite', 'tableByType'].forEach(id => {
                const tbody = document.querySelector(`#${id} tbody`);
                if (tbody) tbody.innerHTML = empty;
            });
            return;
        }

        const byCountry = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '');
        const byType = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '');

        const siteMap = new Map();
        DashboardState.currentData.forEach(r => {
            const s = DashboardState.headerMap.site ? r[DashboardState.headerMap.site] : '';
            const c = DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '';
            const k = `$${s}||$${c}`;
            siteMap.set(k, (siteMap.get(k) || 0) + 1);
        });
        const bySite = Array.from(siteMap.entries()).map(([k, v]) => {
            const [site, country] = k.split('||');
            return { site, country, count: v };
        }).sort((a, b) => b.count - a.count);

        const tc = document.querySelector('#tableByCountry tbody');
        if (tc) tc.innerHTML = byCountry.map(i => `<tr><td>$${Utils.escapeHtml(i.key)}</td><td>$${i.count}</td></tr>`).join('');

        const ts = document.querySelector('#tableBySite tbody');
        if (ts) ts.innerHTML = bySite.map(i => `<tr><td>$${Utils.escapeHtml(i.site)}</td><td>$${Utils.escapeHtml(i.country)}</td><td>${i.count}</td></tr>`).join('');

        const tt = document.querySelector('#tableByType tbody');
        if (tt) tt.innerHTML = byType.map(i => `<tr><td>$${Utils.escapeHtml(i.key)}</td><td>$${i.count}</td></tr>`).join('');
    },

    renderCharts() {
        if (!DashboardState.currentData.length) {
            ['chartCountries', 'chartSites', 'chartTypes', 'chartDomains'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '<div class="empty-state">Keine Daten</div>';
            });
            ChartManager.destroyAll();
            return;
        }

        const countries = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '');
        const sites = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.site ? r[DashboardState.headerMap.site] : '');
        const types = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '');

        const domains = { Security: 0, FM: 0, SHE: 0, Other: 0 };
        DashboardState.currentData.forEach(r => { domains[Utils.classifyCategory(r, DashboardState.headerMap)]++; });
        const domainData = Object.entries(domains).filter(([_, v]) => v > 0).map(([k, v]) => ({ key: k, count: v }));

        ChartManager.create('chartCountries', countries, 'bar');
        ChartManager.create('chartSites', sites, 'bar');
        ChartManager.create('chartTypes', types, 'pie');
        ChartManager.create('chartDomains', domainData, 'pie');
    },

    runAnalytics() {
        if (!DashboardState.currentData.length) {
            ['riskAssessment', 'patternDetection', 'smartRecommendations', 'trendForecast'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = '<div class="loading">Keine Daten</div>';
            });
            return;
        }
        new SecurityAnalytics(DashboardState.currentData, DashboardState.headerMap).analyze();
    }
};

// =============================================
// DATA MANAGER
// =============================================
const DataManager = {
    loadTestData() {
        console.log('📊 Loading test data...');
        const parsed = Utils.parseCSV(TestData.csv);
        DashboardState.allData = parsed.rows;
        DashboardState.headerMap = Utils.createHeaderMap(parsed.headers);
        DashboardState.currentData = [...DashboardState.allData];
        this.updateUI('testdata');
        RenderManager.renderAll();
        UI.showToast('Testdaten geladen (Demo-Modus)', 'success');
    },

    async loadCSVFile(file) {
        try {
            const text = await file.text();
            const parsed = Utils.parseCSV(text);
            if (!parsed.rows.length) throw new Error('Keine Daten in CSV');
            DashboardState.allData = parsed.rows;
            DashboardState.headerMap = Utils.createHeaderMap(parsed.headers);
            DashboardState.currentData = [...DashboardState.allData];
            this.updateUI('csv', file.name);
            RenderManager.renderAll();
            UI.showToast(`${file.name} geladen`, 'success');
        } catch (e) {
            UI.showToast('Fehler: ' + e.message, 'error');
        }
    },

    updateUI(mode, filename = '') {
        UI.updateText('recordCount', DashboardState.allData.length);
        const mi = document.getElementById('modeIndicator');
        const fs = document.getElementById('fileStatus');
        if (mode === 'testdata') {
            if (mi) mi.textContent = 'Modus: Testdaten';
            if (fs) fs.textContent = 'Testdaten geladen';
        } else if (mode === 'csv') {
            if (mi) mi.textContent = 'Modus: CSV';
            if (fs) fs.textContent = `$${filename} geladen ($${DashboardState.allData.length} Datensätze)`;
        }
    }
};

// =============================================
// EXPORT MANAGER
// =============================================
const ExportManager = {
    toCSV() {
        if (!DashboardState.currentData.length) { UI.showToast('Keine Daten', 'error'); return; }
        const headers = Object.keys(DashboardState.currentData[0]);
        let csv = headers.join(',') + '\n';
        DashboardState.currentData.forEach(r => {
            csv += headers.map(h => `"${(r[h] || '').replace(/"/g, '""')}"`).join(',') + '\n';
        });
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `security-events-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        UI.showToast('CSV exportiert', 'success');
    },

    async toPDF() {
        if (!DashboardState.currentData.length) { UI.showToast('Keine Daten', 'error'); return; }
        if (typeof window.jspdf === 'undefined') { UI.showToast('jsPDF nicht geladen', 'error'); return; }
        
        UI.showToast('PDF wird erstellt...', 'info');
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            pdf.setFontSize(18);
            pdf.text('Security Event Dashboard Report', 20, 20);
            pdf.setFontSize(12);
            pdf.text(`Erstellt: ${new Date().toLocaleString('de-DE')}`, 20, 30);
            pdf.text(`Ereignisse: ${DashboardState.currentData.length}`, 20, 40);
            
            const filename = `Security-Report-${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(filename);
            UI.showToast('PDF erstellt: '
                         UI.showToast('PDF erstellt: ' + filename, 'success');
        } catch (e) {
            UI.showToast('PDF-Fehler: ' + e.message, 'error');
        }
    }
};

// =============================================
// RISK CONFIG MANAGER
// =============================================
const RiskConfigManager = {
    render() {
        const container = document.getElementById('riskConfigContainer');
        if (!container) return;
        
        const types = [...new Set(
            DashboardState.allData
                .map(r => DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '')
                .filter(Boolean)
        )].sort();

        if (!types.length) {
            container.innerHTML = '<div class="hint">Keine Ereignisarten. Bitte Daten laden.</div>';
            return;
        }

        container.innerHTML = types.map(type => {
            const weight = CONFIG.riskWeights[type] || 3;
            return `
                <div class="risk-config-row">
                    <label class="risk-config-label">${Utils.escapeHtml(type)}</label>
                    <input class="risk-config-input" type="number" min="1" max="10" 
                           value="${weight}" data-type="${Utils.escapeHtml(type)}">
                </div>
            `;
        }).join('');

        container.querySelectorAll('.risk-config-input').forEach(input => {
            input.addEventListener('change', (e) => {
                let val = parseInt(e.target.value) || 3;
                if (val < 1) val = 1;
                if (val > 10) val = 10;
                e.target.value = val;
                CONFIG.riskWeights[e.target.dataset.type] = val;
                RenderManager.runAnalytics();
            });
        });
    }
};

// =============================================
// DASHBOARD INIT
// =============================================
const Dashboard = {
    init() {
        console.log('🚀 Initializing Dashboard...');
        
        try {
            ThemeManager.init();
            this.setupEventListeners();
            FilterManager.updateStatus();
            
            DashboardState.isInitialized = true;
            console.log('✅ Dashboard initialized!');
        } catch (e) {
            console.error('Init error:', e);
        }
    },

    setupEventListeners() {
        // Testdaten Button
        const loadBtn = document.getElementById('loadTestData');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                DataManager.loadTestData();
                RiskConfigManager.render();
            });
        }

        // CSV Upload
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (file) {
                    DataManager.loadCSVFile(file);
                    setTimeout(() => RiskConfigManager.render(), 100);
                }
            });
        }

        // Filter
        ['filterCountry', 'filterSite', 'filterType'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', () => FilterManager.apply());
        });

        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) resetBtn.addEventListener('click', () => FilterManager.reset());

        // Export
        const csvBtn = document.getElementById('exportCSV');
        if (csvBtn) csvBtn.addEventListener('click', () => ExportManager.toCSV());

        const pdfBtn = document.getElementById('exportPDF');
        if (pdfBtn) pdfBtn.addEventListener('click', () => ExportManager.toPDF());

        // Sprache
        const langSelect = document.getElementById('reportLanguage');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => i18n.set(e.target.value));
        }

        console.log('🔗 Event listeners attached');
    }
};

// =============================================
// START
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

// Global exports
window.Dashboard = Dashboard;
window.DashboardState = DashboardState;
window.DataManager = DataManager;
window.ThemeManager = ThemeManager;
window.FilterManager = FilterManager;
window.ExportManager = ExportManager;
window.RenderManager = RenderManager;

console.log('📦 app.js vollständig geladen');
