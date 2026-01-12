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
