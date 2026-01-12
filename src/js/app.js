/* =============================================
   SECURITY EVENT DASHBOARD - app.js
   VOLLSTÄNDIGE EINZELDATEI
   ============================================= */

'use strict';

console.log('🚀 Security Dashboard startet...');

// === GLOBAL STATE ===
const DashboardState = {
    allData: [],
    currentData: [],
    headerMap: {},
    chartInstances: {},
    isInitialized: false
};

// === CONFIG ===
const CONFIG = {
    riskWeights: {
        'Diebstahl': 9,
        'Verdächtige Person': 7,
        'Zutrittsverletzung': 6,
        'Alarmanlage ausgelöst': 5,
        'Vandalismus': 8,
        'Einbruch': 10,
        'Brandschutz': 9
    },
    chartColors: ['#00a37a', '#006b4e', '#4caf50', '#8bc34a', '#cddc39', '#ffc107', '#ff9800', '#ff5722']
};

// === i18n ===
const i18n = {
    current: 'de',
    set: function(lang) { this.current = ['de', 'en'].includes(lang) ? lang : 'de'; },
    t: function(key, vars) {
        vars = vars || {};
        var str = (this.strings[key] && this.strings[key][this.current]) || key;
        return str.replace(/\{\{(\w+)\}\}/g, function(_, v) { return vars[v] !== undefined ? String(vars[v]) : ''; });
    },
    strings: {
        pdf_title: { de: 'SECURITY EVENT DASHBOARD', en: 'SECURITY EVENT DASHBOARD' },
        pdf_subtitle: { de: 'Executive Summary Report', en: 'Executive Summary Report' },
        pdf_created_at: { de: 'Erstellt: {{date}}', en: 'Generated: {{date}}' },
        section_executive_summary: { de: 'Executive Summary', en: 'Executive Summary' },
        section_aggregated_overview: { de: 'Aggregierte Uebersicht', en: 'Aggregated Overview' },
        key_facts_line: { de: 'Events: {{events}} | Laender: {{countries}} | Liegenschaften: {{sites}} | Typen: {{types}}', en: 'Events: {{events}} | Countries: {{countries}} | Sites: {{sites}} | Types: {{types}}' },
        table_country_header: { de: 'Land', en: 'Country' },
        table_site_header: { de: 'Liegenschaft', en: 'Site' },
        table_type_header: { de: 'Ereignisart', en: 'Event Type' },
        table_count_header: { de: 'Anzahl', en: 'Count' },
        chart_countries_title: { de: 'Nach Laendern', en: 'By Country' },
        chart_sites_title: { de: 'Nach Liegenschaften', en: 'By Site' },
        chart_types_title: { de: 'Nach Ereignisart', en: 'By Type' },
        chart_domains_title: { de: 'Bereichsverteilung', en: 'Domain Distribution' },
        footer_left: { de: 'Security Dashboard Report', en: 'Security Dashboard Report' },
        footer_page: { de: 'Seite {{page}}', en: 'Page {{page}}' },
        toast_testdata_loaded: { de: 'Testdaten geladen', en: 'Test data loaded' },
        toast_csv_loaded: { de: 'CSV geladen: {{filename}}', en: 'CSV loaded: {{filename}}' },
        toast_no_data: { de: 'Keine Daten vorhanden', en: 'No data available' },
        toast_csv_success: { de: 'CSV exportiert ({{count}} Zeilen)', en: 'CSV exported ({{count}} rows)' },
        toast_pdf_start: { de: 'PDF wird erstellt...', en: 'Creating PDF...' },
        toast_pdf_success: { de: 'PDF erstellt: {{file}}', en: 'PDF created: {{file}}' },
        toast_pdf_error: { de: 'PDF Fehler: {{error}}', en: 'PDF Error: {{error}}' },
        pdf_filename: { de: 'Security-Report-{{date}}.pdf', en: 'Security-Report-{{date}}.pdf' }
    }
};

// === TEST DATA ===
var TestData = {
    csv: 'Land;Liegenschaft;Ereignisart;Datum\n' +
        'Deutschland;Mainz Campus;Zutrittsverletzung;2025-01-03 18:23\n' +
        'Deutschland;Mainz Campus;Zutrittsverletzung;2025-01-04 22:10\n' +
        'Deutschland;Mainz Campus;Alarmanlage ausgeloest;2025-01-05 05:11\n' +
        'Deutschland;Berlin Research;Zutrittsverletzung;2025-02-01 08:45\n' +
        'Deutschland;Berlin Research;Verdaechtige Person;2025-02-02 09:30\n' +
        'Deutschland;Berlin Research;Verdaechtige Person;2025-02-04 14:05\n' +
        'Deutschland;Muenchen Warehouse;Diebstahl;2025-03-01 23:50\n' +
        'Deutschland;Muenchen Warehouse;Diebstahl;2025-03-02 21:40\n' +
        'Deutschland;Muenchen Warehouse;Alarmanlage ausgeloest;2025-03-05 03:10\n' +
        'Deutschland;Muenchen Warehouse;Zutrittsverletzung;2025-03-06 06:05\n' +
        'USA;Cambridge Lab;Zutrittsverletzung;2025-01-10 11:15\n' +
        'USA;Cambridge Lab;Verdaechtige Person;2025-01-12 19:05\n' +
        'USA;Cambridge Lab;Alarmanlage ausgeloest;2025-01-15 20:45\n' +
        'USA;San Diego Office;Verdaechtige Person;2025-02-10 17:20\n' +
        'USA;San Diego Office;Verdaechtige Person;2025-02-12 18:10\n' +
        'USA;San Diego Office;Diebstahl;2025-02-14 16:55\n' +
        'USA;San Diego Office;Zutrittsverletzung;2025-02-16 07:40\n' +
        'UK;London HQ;Zutrittsverletzung;2025-01-07 08:05\n' +
        'UK;London HQ;Zutrittsverletzung;2025-01-09 09:15\n' +
        'UK;London HQ;Verdaechtige Person;2025-01-11 10:30\n' +
        'UK;London HQ;Alarmanlage ausgeloest;2025-01-13 21:55\n' +
        'UK;Reading Plant;Diebstahl;2025-03-03 23:05\n' +
        'UK;Reading Plant;Diebstahl;2025-03-06 22:50\n' +
        'UK;Reading Plant;Zutrittsverletzung;2025-03-07 04:15\n' +
        'Schweiz;Basel Site;Verdaechtige Person;2025-02-03 13:15\n' +
        'Schweiz;Basel Site;Verdaechtige Person;2025-02-05 14:25\n' +
        'Schweiz;Basel Site;Alarmanlage ausgeloest;2025-02-06 02:50\n' +
        'Schweiz;Basel Site;Zutrittsverletzung;2025-02-08 06:30\n' +
        'Belgien;Bruessel Office;Zutrittsverletzung;2025-01-20 07:40\n' +
        'Belgien;Bruessel Office;Diebstahl;2025-01-22 20:10\n' +
        'Belgien;Bruessel Office;Diebstahl;2025-01-23 21:20\n' +
        'Belgien;Bruessel Office;Verdaechtige Person;2025-01-25 15:30'
};

// === UTILS ===
var Utils = {
    parseCSV: function(text) {
        if (!text) return { headers: [], rows: [] };
        var lines = text.split(/\r?\n/).filter(function(l) { return l.trim(); });
        if (!lines.length) return { headers: [], rows: [] };
        var delim = lines[0].indexOf(';') >= 0 ? ';' : ',';
        var headers = lines[0].split(delim).map(function(h) { return h.trim(); });
        var rows = [];
        for (var i = 1; i < lines.length; i++) {
            var cells = lines[i].split(delim);
            var row = {};
            for (var j = 0; j < headers.length; j++) {
                row[headers[j]] = (cells[j] || '').trim();
            }
            rows.push(row);
        }
        return { headers: headers, rows: rows };
    },

    createHeaderMap: function(headers) {
        var map = {};
        headers.forEach(function(h) {
            var lower = h.toLowerCase();
            if (lower.indexOf('land') >= 0 || lower.indexOf('country') >= 0) map.country = h;
            if (lower.indexOf('liegenschaft') >= 0 || lower.indexOf('site') >= 0) map.site = h;
            if (lower.indexOf('ereignis') >= 0 || lower.indexOf('event') >= 0 || lower.indexOf('typ') >= 0) map.type = h;
            if (lower.indexOf('datum') >= 0 || lower.indexOf('date') >= 0) map.date = h;
        });
        return map;
    },

    groupAndCount: function(data, keyFn) {
        var map = {};
        data.forEach(function(row) {
            var key = keyFn(row);
            if (key) map[key] = (map[key] || 0) + 1;
        });
        var result = [];
        for (var k in map) {
            result.push({ key: k, count: map[k] });
        }
        result.sort(function(a, b) { return b.count - a.count; });
        return result;
    },

    classifyCategory: function(row, headerMap) {
        var text = (headerMap.type && row[headerMap.type] || '').toLowerCase();
        var security = ['diebstahl', 'einbruch', 'vandalismus', 'zutritt', 'verdaechtig', 'alarm', 'security'];
        var fm = ['facility', 'aufzug', 'klima', 'heizung', 'wartung', 'stromausfall'];
        var she = ['unfall', 'verletzung', 'brandschutz', 'brand', 'evakuierung'];
        for (var i = 0; i < security.length; i++) { if (text.indexOf(security[i]) >= 0) return 'Security'; }
        for (var i = 0; i < fm.length; i++) { if (text.indexOf(fm[i]) >= 0) return 'FM'; }
        for (var i = 0; i < she.length; i++) { if (text.indexOf(she[i]) >= 0) return 'SHE'; }
        return 'Other';
    },

    escapeHtml: function(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },

    formatDate: function(d) {
        return d.toLocaleDateString('de-DE') + ' ' + d.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});
    }
};

// === UI ===
var UI = {
    showToast: function(message, type, timeout) {
        type = type || 'info';
        timeout = timeout || 4000;
        var container = document.getElementById('toastContainer');
        if (!container) return;
        var div = document.createElement('div');
        div.className = 'toast toast-' + type;
        div.textContent = message;
        container.appendChild(div);
        setTimeout(function() {
            div.style.opacity = '0';
            setTimeout(function() { div.remove(); }, 300);
        }, timeout);
    },

    updateText: function(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
    }
};

// === CHART MANAGER ===
var ChartManager = {
    create: function(containerId, data, type, maxBars) {
        type = type || 'bar';
        maxBars = maxBars || 6;
        var container = document.getElementById(containerId);
        if (!container) return;

        if (!data || !data.length) {
            container.innerHTML = '<div class="empty-state"><strong>Keine Daten</strong></div>';
            return;
        }

        if (DashboardState.chartInstances[containerId]) {
            DashboardState.chartInstances[containerId].destroy();
        }

        container.innerHTML = '<canvas></canvas>';
        var canvas = container.querySelector('canvas');
        var chartData = data.slice(0, maxBars);
        var labels = chartData.map(function(d) { return d.key || '(leer)'; });
        var values = chartData.map(function(d) { return d.count; });
        var colors = CONFIG.chartColors.slice(0, values.length);

        var config = {
            type: type,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Anzahl',
                    data: values,
                    backgroundColor: colors.map(function(c) { return c + '80'; }),
                    borderColor: colors,
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

    destroyAll: function() {
        for (var key in DashboardState.chartInstances) {
            if (DashboardState.chartInstances[key]) {
                DashboardState.chartInstances[key].destroy();
            }
        }
        DashboardState.chartInstances = {};
    }
};

// === ANALYTICS ===
var SecurityAnalytics = function(data, headerMap) {
    this.data = data || [];
    this.headerMap = headerMap || {};
    this.insights = {};
};

SecurityAnalytics.prototype.analyze = function() {
    this.calculateRisk();
    this.analyzeDomains();
    this.renderAll();
};

SecurityAnalytics.prototype.calculateRisk = function() {
    var self = this;
    var byType = Utils.groupAndCount(this.data, function(r) {
        return self.headerMap.type ? r[self.headerMap.type] : '';
    });

    var total = 0, max = 0, high = 0;
    byType.forEach(function(e) {
        var w = CONFIG.riskWeights[e.key] || 3;
        total += e.count * w;
        max += e.count * 10;
        if (w >= 8) high += e.count;
    });

    var score = Math.round((total / Math.max(max, 1)) * 100);
    var level = score >= 70 ? 'HOCH' : score >= 40 ? 'MITTEL' : 'NIEDRIG';
    var riskClass = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

    this.insights.risk = {
        score: score,
        level: level,
        riskClass: riskClass,
        highRiskEvents: high,
        criticalTypes: byType.filter(function(e) { return (CONFIG.riskWeights[e.key] || 0) >= 8; })
    };
};

SecurityAnalytics.prototype.analyzeDomains = function() {
    var self = this;
    var counts = { Security: 0, FM: 0, SHE: 0, Other: 0 };
    this.data.forEach(function(r) {
        var domain = Utils.classifyCategory(r, self.headerMap);
        counts[domain]++;
    });
    var total = this.data.length || 1;
    var arr = [];
    for (var k in counts) {
        arr.push({ domain: k, count: counts[k], share: Math.round((counts[k] / total) * 100) });
    }
    arr.sort(function(a, b) { return b.count - a.count; });
    this.insights.domains = arr;
};

SecurityAnalytics.prototype.renderAll = function() {
    var r = this.insights.risk;
    var d = this.insights.domains;

    var riskEl = document.getElementById('riskAssessment');
    if (riskEl) {
        var html = '<div class="insight-item risk-' + r.riskClass + '">';
        html += '<div class="insight-value">Risiko: ' + r.level + ' (' + r.score + '%)</div>';
        html += '<div class="insight-trend">' + r.highRiskEvents + ' kritische von ' + this.data.length + ' Events</div>';
        html += '</div>';
        if (r.criticalTypes && r.criticalTypes[0]) {
            html += '<div class="insight-item"><div class="insight-value">Kritisch: ' + Utils.escapeHtml(r.criticalTypes[0].key) + ' (' + r.criticalTypes[0].count + 'x)</div></div>';
        }
        riskEl.innerHTML = html;
    }

    var patternEl = document.getElementById('patternDetection');
    if (patternEl && d && d[0]) {
        var html = '<div class="insight-item">';
        html += '<div class="insight-value">Top-Bereich: ' + d[0].domain + '</div>';
        html += '<div class="insight-trend">' + d[0].count + ' Events (' + d[0].share + '%)</div>';
        html += '</div>';
        html += '<div class="insight-item"><div class="insight-trend">';
        html += 'Security: ' + (d.find(function(x){return x.domain==='Security';})||{count:0}).count + ' | ';
        html += 'FM: ' + (d.find(function(x){return x.domain==='FM';})||{count:0}).count + ' | ';
        html += 'SHE: ' + (d.find(function(x){return x.domain==='SHE';})||{count:0}).count;
        html += '</div></div>';
        patternEl.innerHTML = html;
    }

    var recEl = document.getElementById('smartRecommendations');
    if (recEl) {
        var html = '';
        if (r.level === 'HOCH') {
            html = '<div class="insight-item"><div class="insight-value">🚨 Sofortige Massnahmen empfohlen</div></div>';
        } else if (r.level === 'MITTEL') {
            html = '<div class="insight-item"><div class="insight-value">⚠️ Erhoehte Aufmerksamkeit</div></div>';
        } else {
            html = '<div class="insight-item"><div class="insight-value">✅ Normalbetrieb</div></div>';
        }
        recEl.innerHTML = html;
    }

    var trendEl = document.getElementById('trendForecast');
    if (trendEl) {
        var trend = r.score > 50 ? 'steigend' : 'stabil';
        var html = '<div class="insight-item">';
        html += '<div class="insight-value">Trend: ' + trend + '</div>';
        html += '<div class="insight-trend">' + this.data.length + ' Events analysiert</div>';
        html += '</div>';
        trendEl.innerHTML = html;
    }
};

// === THEME MANAGER ===
var ThemeManager = {
    init: function() {
        var toggle = document.getElementById('themeToggle');
        if (!toggle) return;

        var saved = localStorage.getItem('theme') || 'light';
        this.setTheme(saved);

        var self = this;
        toggle.addEventListener('click', function() {
            var current = document.documentElement.getAttribute('data-theme') || 'light';
            self.setTheme(current === 'dark' ? 'light' : 'dark');
        });
    },

    setTheme: function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        var label = document.querySelector('.theme-label');
        if (label) label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
        console.log('Theme:', theme);
    }
};

// === RISK CONFIG MANAGER ===
var RiskConfigManager = {
    render: function() {
        var container = document.getElementById('riskConfigContainer');
        if (!container) return;

        var typesMap = {};
        DashboardState.allData.forEach(function(r) {
            var t = DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '';
            if (t) typesMap[t] = true;
        });
        var types = Object.keys(typesMap).sort();

        if (!types.length) {
            container.innerHTML = '<div class="hint">Keine Ereignisarten. Bitte Daten laden.</div>';
            return;
        }

        var html = '';
        types.forEach(function(type) {
            var w = CONFIG.riskWeights[type] || 3;
            html += '<div class="risk-config-row">';
            html += '<label class="risk-config-label">' + Utils.escapeHtml(type) + '</label>';
            html += '<input class="risk-config-input" type="number" min="1" max="10" value="' + w + '" data-type="' + Utils.escapeHtml(type) + '">';
            html += '</div>';
        });
        container.innerHTML = html;

        container.querySelectorAll('.risk-config-input').forEach(function(input) {
            input.addEventListener('change', function(e) {
                var val = parseInt(e.target.value) || 3;
                if (val < 1) val = 1;
                if (val > 10) val = 10;
                e.target.value = val;
                CONFIG.riskWeights[e.target.getAttribute('data-type')] = val;
                RenderManager.runAnalytics();
            });
        });
    }
};

// === FILTER MANAGER ===
var FilterManager = {
    apply: function() {
        var country = (document.getElementById('filterCountry') || {}).value || '__ALL__';
        var site = (document.getElementById('filterSite') || {}).value || '__ALL__';
        var type = (document.getElementById('filterType') || {}).value || '__ALL__';

        DashboardState.currentData = DashboardState.allData.filter(function(row) {
            var rc = DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : '';
            var rs = DashboardState.headerMap.site ? row[DashboardState.headerMap.site] : '';
            var rt = DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : '';
            if (country !== '__ALL__' && rc !== country) return false;
            if (site !== '__ALL__' && rs !== site) return false;
            if (type !== '__ALL__' && rt !== type) return false;
            return true;
        });

        this.updateStatus();
        RenderManager.renderAll();
    },

    reset: function() {
        var fc = document.getElementById('filterCountry');
        var fs = document.getElementById('filterSite');
        var ft = document.getElementById('filterType');
        if (fc) fc.value = '__ALL__';
        if (fs) fs.value = '__ALL__';
        if (ft) ft.value = '__ALL__';
        this.apply();
        UI.showToast('Filter zurueckgesetzt', 'info', 2000);
    },

    updateStatus: function() {
        var status = document.getElementById('filterStatus');
        if (status) {
            status.textContent = 'Zeige ' + DashboardState.currentData.length + ' von ' + DashboardState.allData.length + ' Datensaetzen';
        }
    },

    updateOptions: function(selectId, values, placeholder) {
        var select = document.getElementById(selectId);
        if (!select) return;
        var current = select.value;
        var html = '<option value="__ALL__">' + placeholder + '</option>';
        values.forEach(function(v) {
            html += '<option value="' + Utils.escapeHtml(v) + '">' + Utils.escapeHtml(v) + '</option>';
        });
        select.innerHTML = html;
        if (values.indexOf(current) >= 0) select.value = current;
    }
};

// === RENDER MANAGER ===
var RenderManager = {
    renderAll: function() {
        this.renderKPIs();
        this.renderFilters();
        this.renderTables();
        this.renderCharts();
        this.runAnalytics();
    },

    renderKPIs: function() {
        UI.updateText('kpiTotalEvents', DashboardState.allData.length);
        UI.updateText('kpiTotalEventsSub', DashboardState.currentData.length + ' nach Filter');

        var countries = {}, sites = {}, types = {};
        DashboardState.allData.forEach(function(r) {
            if (DashboardState.headerMap.country && r[DashboardState.headerMap.country]) countries[r[DashboardState.headerMap.country]] = true;
            if (DashboardState.headerMap.site && r[DashboardState.headerMap.site]) sites[r[DashboardState.headerMap.site]] = true;
            if (DashboardState.headerMap.type && r[DashboardState.headerMap.type]) types[r[DashboardState.headerMap.type]] = true;
        });

        UI.updateText('kpiCountries', Object.keys(countries).length);
        UI.updateText('kpiSites', Object.keys(sites).length);
        UI.updateText('kpiTypes', Object.keys(types).length);
    },

    renderFilters: function() {
        var countries = {}, sites = {}, types = {};
        DashboardState.allData.forEach(function(r) {
            if (DashboardState.headerMap.country && r[DashboardState.headerMap.country]) countries[r[DashboardState.headerMap.country]] = true;
            if (DashboardState.headerMap.site && r[DashboardState.headerMap.site]) sites[r[DashboardState.headerMap.site]] = true;
            if (DashboardState.headerMap.type && r[DashboardState.headerMap.type]) types[r[DashboardState.headerMap.type]] = true;
        });

        FilterManager.updateOptions('filterCountry', Object.keys(countries).sort(), 'Alle Laender');
        FilterManager.updateOptions('filterSite', Object.keys(sites).sort(), 'Alle Liegenschaften');
        FilterManager.updateOptions('filterType', Object.keys(types).sort(), 'Alle Ereignisarten');
    },

    renderTables: function() {
        var empty = '<tr><td colspan="3" class="empty-state">Keine Daten</td></tr>';

        if (!DashboardState.currentData.length) {
            var tc = document.querySelector('#tableByCountry tbody');
            var ts = document.querySelector('#tableBySite tbody');
            var tt = document.querySelector('#tableByType tbody');
            if (tc) tc.innerHTML = empty;
            if (ts) ts.innerHTML = empty;
            if (tt) tt.innerHTML = empty;
            return;
        }

        var byCountry = Utils.groupAndCount(DashboardState.currentData, function(r) {
            return DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '';
        });

        var byType = Utils.groupAndCount(DashboardState.currentData, function(r) {
            return DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '';
        });

        var siteMap = {};
        DashboardState.currentData.forEach(function(r) {
            var s = DashboardState.headerMap.site ? r[DashboardState.headerMap.site] : '';
            var c = DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '';
            var k = s + '||' + c;
            siteMap[k] = (siteMap[k] || 0) + 1;
        });

        var bySite = [];
        for (var k in siteMap) {
            var parts = k.split('||');
            bySite.push({ site: parts[0] || '(leer)', country: parts[1] || '(leer)', count: siteMap[k] });
        }
        bySite.sort(function(a, b) { return b.count - a.count; });
       var tc = document.querySelector('#tableByCountry tbody');
        if (tc) {
            var html = '';
            byCountry.forEach(function(item) {
                html += '<tr><td>' + Utils.escapeHtml(item.key || '(leer)') + '</td><td>' + item.count + '</td></tr>';
            });
            tc.innerHTML = html;
        }

        var ts = document.querySelector('#tableBySite tbody');
        if (ts) {
            var html = '';
            bySite.forEach(function(item) {
                html += '<tr><td>' + Utils.escapeHtml(item.site) + '</td><td>' + Utils.escapeHtml(item.country) + '</td><td>' + item.count + '</td></tr>';
            });
            ts.innerHTML = html;
        }

        var tt = document.querySelector('#tableByType tbody');
        if (tt) {
            var html = '';
            byType.forEach(function(item) {
                html += '<tr><td>' + Utils.escapeHtml(item.key || '(leer)') + '</td><td>' + item.count + '</td></tr>';
            });
            tt.innerHTML = html;
        }
    },

    renderCharts: function() {
        var emptyHtml = '<div class="empty-state"><strong>Keine Daten</strong></div>';

        if (!DashboardState.currentData.length) {
            ['chartCountries', 'chartSites', 'chartTypes', 'chartDomains'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) el.innerHTML = emptyHtml;
            });
            ChartManager.destroyAll();
            return;
        }

        var countries = Utils.groupAndCount(DashboardState.currentData, function(r) {
            return DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '';
        });

        var sites = Utils.groupAndCount(DashboardState.currentData, function(r) {
            return DashboardState.headerMap.site ? r[DashboardState.headerMap.site] : '';
        });

        var types = Utils.groupAndCount(DashboardState.currentData, function(r) {
            return DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '';
        });

        var domainCounts = { Security: 0, FM: 0, SHE: 0, Other: 0 };
        DashboardState.currentData.forEach(function(r) {
            var domain = Utils.classifyCategory(r, DashboardState.headerMap);
            domainCounts[domain]++;
        });

        var domainData = [];
        for (var k in domainCounts) {
            if (domainCounts[k] > 0) {
                domainData.push({ key: k, count: domainCounts[k] });
            }
        }

        ChartManager.create('chartCountries', countries, 'bar');
        ChartManager.create('chartSites', sites, 'bar');
        ChartManager.create('chartTypes', types, 'pie');
        ChartManager.create('chartDomains', domainData, 'pie');
    },

    runAnalytics: function() {
        if (!DashboardState.currentData.length) {
            var html = '<div class="loading">Keine Daten fuer Analyse</div>';
            ['riskAssessment', 'patternDetection', 'smartRecommendations', 'trendForecast'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) el.innerHTML = html;
            });
            return;
        }

        var analytics = new SecurityAnalytics(DashboardState.currentData, DashboardState.headerMap);
        analytics.analyze();
    }
};

// === DATA MANAGER ===
var DataManager = {
    loadTestData: function() {
        console.log('Loading test data...');

        try {
            var parsed = Utils.parseCSV(TestData.csv);
            DashboardState.allData = parsed.rows;
            DashboardState.headerMap = Utils.createHeaderMap(parsed.headers);
            DashboardState.currentData = DashboardState.allData.slice();

            RiskConfigManager.render();
            this.updateUI('testdata');
            RenderManager.renderAll();

            console.log('Test data loaded:', DashboardState.allData.length, 'records');
            UI.showToast(i18n.t('toast_testdata_loaded'), 'success');
        } catch (e) {
            console.error('Test data error:', e);
            UI.showToast('Fehler: ' + e.message, 'error');
        }
    },

    loadCSVFile: function(file) {
        var self = this;
        console.log('Loading CSV:', file.name);

        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var text = e.target.result;
                var parsed = Utils.parseCSV(text);

                if (!parsed.rows.length) {
                    throw new Error('CSV enthaelt keine Daten');
                }

                DashboardState.allData = parsed.rows;
                DashboardState.headerMap = Utils.createHeaderMap(parsed.headers);
                DashboardState.currentData = DashboardState.allData.slice();

                RiskConfigManager.render();
                self.updateUI('csv', file.name);
                RenderManager.renderAll();

                console.log('CSV loaded:', DashboardState.allData.length, 'records');
                UI.showToast(i18n.t('toast_csv_loaded', { filename: file.name }), 'success');
            } catch (err) {
                console.error('CSV error:', err);
                var fs = document.getElementById('fileStatus');
                if (fs) {
                    fs.textContent = 'Fehler: ' + err.message;
                    fs.className = 'status error';
                }
                UI.showToast('CSV-Fehler: ' + err.message, 'error');
            }
        };

        reader.onerror = function() {
            UI.showToast('Datei konnte nicht gelesen werden', 'error');
        };

        reader.readAsText(file);
    },

    updateUI: function(mode, filename) {
        filename = filename || '';
        UI.updateText('recordCount', DashboardState.allData.length);

        var modeIndicator = document.getElementById('modeIndicator');
        var fileStatus = document.getElementById('fileStatus');

        if (mode === 'testdata') {
            if (modeIndicator) modeIndicator.textContent = 'Modus: Testdaten (Demo)';
            if (fileStatus) {
                fileStatus.textContent = 'Testdaten geladen (Demo-Modus)';
                fileStatus.className = 'status';
            }
        } else if (mode === 'csv') {
            if (modeIndicator) modeIndicator.textContent = 'Modus: CSV-Datei';
            if (fileStatus) {
                fileStatus.textContent = '"' + filename + '" geladen (' + DashboardState.allData.length + ' Datensaetze)';
                fileStatus.className = 'status';
            }
        }
    }
};

// === EXPORT MANAGER ===
var ExportManager = {
    toCSV: function() {
        if (!DashboardState.currentData || !DashboardState.currentData.length) {
            UI.showToast(i18n.t('toast_no_data'), 'error');
            return;
        }

        try {
            var headers = Object.keys(DashboardState.currentData[0]);
            var csv = headers.join(',') + '\n';

            DashboardState.currentData.forEach(function(row) {
                var values = headers.map(function(h) {
                    var val = row[h] || '';
                    return '"' + String(val).replace(/"/g, '""') + '"';
                });
                csv += values.join(',') + '\n';
            });

            var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
            var link = document.createElement('a');
            var date = new Date().toISOString().slice(0, 10);

            link.href = URL.createObjectURL(blob);
            link.download = 'security-events-' + date + '.csv';
            link.click();

            UI.showToast(i18n.t('toast_csv_success', { count: DashboardState.currentData.length }), 'success');
        } catch (e) {
            console.error('CSV Export Error:', e);
            UI.showToast('CSV-Export Fehler: ' + e.message, 'error');
        }
    },

    toPDF: function() {
        if (!DashboardState.currentData || !DashboardState.currentData.length) {
            UI.showToast(i18n.t('toast_no_data'), 'error');
            return;
        }

        if (typeof window.jspdf === 'undefined') {
            UI.showToast('jsPDF nicht geladen', 'error');
            return;
        }

        var btnPdf = document.getElementById('exportPDF');
        if (btnPdf) btnPdf.disabled = true;

        UI.showToast(i18n.t('toast_pdf_start'), 'info');

        try {
            var jsPDF = window.jspdf.jsPDF;
            var pdf = new jsPDF('p', 'mm', 'a4');

            var pageWidth = pdf.internal.pageSize.getWidth();
            var pageHeight = pdf.internal.pageSize.getHeight();
            var marginX = 18;
            var yPos = 22;
            var pageNumber = 1;

            // Header
            pdf.setFillColor(0, 163, 122);
            pdf.rect(0, 0, pageWidth, 30, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.text(i18n.t('pdf_title'), marginX, 16);
            pdf.setFontSize(11);
            pdf.text(i18n.t('pdf_subtitle'), marginX, 23);

            var dateStr = Utils.formatDate(new Date());
            var dateText = i18n.t('pdf_created_at', { date: dateStr });
            pdf.text(dateText, pageWidth - marginX - pdf.getTextWidth(dateText), 23);

            // Content
            yPos = 40;
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.text(i18n.t('section_executive_summary'), marginX, yPos);
            yPos += 8;

            // KPIs
            var countriesSet = {}, sitesSet = {}, typesSet = {};
            DashboardState.currentData.forEach(function(r) {
                if (DashboardState.headerMap.country && r[DashboardState.headerMap.country]) countriesSet[r[DashboardState.headerMap.country]] = true;
                if (DashboardState.headerMap.site && r[DashboardState.headerMap.site]) sitesSet[r[DashboardState.headerMap.site]] = true;
                if (DashboardState.headerMap.type && r[DashboardState.headerMap.type]) typesSet[r[DashboardState.headerMap.type]] = true;
            });

            pdf.setFontSize(9);
            pdf.setTextColor(80, 80, 80);
            pdf.text(i18n.t('key_facts_line', {
                events: DashboardState.currentData.length,
                countries: Object.keys(countriesSet).length,
                sites: Object.keys(sitesSet).length,
                types: Object.keys(typesSet).length
            }), marginX, yPos);
            yPos += 12;

            // Charts als Bilder
            var addChart = function(selector, title) {
                var container = document.querySelector(selector);
                if (!container) return;
                var canvas = container.querySelector('canvas');
                if (!canvas) return;

                try {
                    if (yPos > pageHeight - 80) {
                        pdf.addPage();
                        pageNumber++;
                        yPos = 22;
                    }

                    pdf.setFontSize(11);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(title, marginX, yPos);
                    yPos += 5;

                    var imgData = canvas.toDataURL('image/png', 1.0);
                    pdf.addImage(imgData, 'PNG', marginX, yPos, pageWidth - 2 * marginX, 50);
                    yPos += 55;
                } catch (err) {
                    console.warn('Chart export error:', err);
                }
            };

            addChart('#chartCountries', i18n.t('chart_countries_title'));
            addChart('#chartSites', i18n.t('chart_sites_title'));
            addChart('#chartTypes', i18n.t('chart_types_title'));
            addChart('#chartDomains', i18n.t('chart_domains_title'));

            // Tabellen mit autoTable
            if (pdf.autoTable) {
                pdf.addPage();
                pageNumber++;
                yPos = 22;

                pdf.setFontSize(14);
                pdf.setTextColor(0, 0, 0);
                pdf.text(i18n.t('section_aggregated_overview'), marginX, yPos);
                yPos += 8;

                var byCountry = Utils.groupAndCount(DashboardState.currentData, function(r) {
                    return DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '';
                });

                var byType = Utils.groupAndCount(DashboardState.currentData, function(r) {
                    return DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '';
                });

                pdf.autoTable({
                    startY: yPos,
                    head: [[i18n.t('table_country_header'), i18n.t('table_count_header')]],
                    body: byCountry.map(function(r) { return [r.key || '(leer)', r.count]; }),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [0, 163, 122] }
                });

                yPos = pdf.lastAutoTable.finalY + 10;

                pdf.autoTable({
                    startY: yPos,
                    head: [[i18n.t('table_type_header'), i18n.t('table_count_header')]],
                    body: byType.map(function(r) { return [r.key || '(leer)', r.count]; }),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [0, 163, 122] }
                });
            }

            // Footer
            pdf.setFontSize(8);
            pdf.setTextColor(130, 130, 130);
            pdf.text(i18n.t('footer_left'), marginX, pageHeight - 6);

            // Speichern
            var filename = i18n.t('pdf_filename', { date: new Date().toISOString().slice(0, 10) });
            pdf.save(filename);

            UI.showToast(i18n.t('toast_pdf_success', { file: filename }), 'success');
        } catch (e) {
            console.error('PDF Error:', e);
            UI.showToast(i18n.t('toast_pdf_error', { error: e.message }), 'error');
        } finally {
            if (btnPdf) btnPdf.disabled = false;
        }
    }
};

// === DASHBOARD ===
var Dashboard = {
    init: function() {
        console.log('Initializing Dashboard...');

        try {
            ThemeManager.init();
            this.setupEventListeners();
            FilterManager.updateStatus();

            DashboardState.isInitialized = true;
            console.log('Dashboard initialized!');
        } catch (e) {
            console.error('Init error:', e);
        }
    },

    setupEventListeners: function() {
        // Testdaten Button
        var loadBtn = document.getElementById('loadTestData');
        if (loadBtn) {
            loadBtn.addEventListener('click', function() {
                DataManager.loadTestData();
            });
        }

        // CSV Upload
        var fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                var file = e.target.files && e.target.files[0];
                if (file) DataManager.loadCSVFile(file);
            });
        }

        // Filter
        var filterCountry = document.getElementById('filterCountry');
        var filterSite = document.getElementById('filterSite');
        var filterType = document.getElementById('filterType');

        if (filterCountry) filterCountry.addEventListener('change', function() { FilterManager.apply(); });
        if (filterSite) filterSite.addEventListener('change', function() { FilterManager.apply(); });
        if (filterType) filterType.addEventListener('change', function() { FilterManager.apply(); });

        var resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() { FilterManager.reset(); });
        }

        // Export
        var csvBtn = document.getElementById('exportCSV');
        if (csvBtn) {
            csvBtn.addEventListener('click', function() { ExportManager.toCSV(); });
        }

        var pdfBtn = document.getElementById('exportPDF');
        if (pdfBtn) {
            pdfBtn.addEventListener('click', function() { ExportManager.toPDF(); });
        }

        // Sprache
        var langSelect = document.getElementById('reportLanguage');
        if (langSelect) {
            langSelect.addEventListener('change', function(e) {
                i18n.set(e.target.value);
            });
        }

        console.log('Event listeners attached');
    }
};

// === START ===
document.addEventListener('DOMContentLoaded', function() {
    Dashboard.init();
});

// Error Handler
window.onerror = function(msg, url, line) {
    console.error('Error:', msg, 'Line:', line);
    return false;
};

// Global Exports
window.Dashboard = Dashboard;
window.DashboardState = DashboardState;
window.DataManager = DataManager;
window.ThemeManager = ThemeManager;
window.FilterManager = FilterManager;
window.ExportManager = ExportManager;
window.RenderManager = RenderManager;
window.ChartManager = ChartManager;
window.RiskConfigManager = RiskConfigManager;
window.i18n = i18n;
window.CONFIG = CONFIG;
window.Utils = Utils;

console.log('app.js vollstaendig geladen');
