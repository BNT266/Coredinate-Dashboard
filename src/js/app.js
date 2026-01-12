/* =============================================
   SECURITY EVENT DASHBOARD - app.js
   VOLLSTÄNDIGE EINZELDATEI (optimierte Version)
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
        pdf_title: { de: 'SECURITY DASHBOARD', en: 'SECURITY DASHBOARD' },
        pdf_subtitle: { de: 'Executive Summary & Risk Overview', en: 'Executive Summary & Risk Overview' },
        footer_left: { de: 'Security Dashboard – Konzernreport', en: 'Security Dashboard – Corporate Report' },
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
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    formatDate: function(d) {
        return d.toLocaleDateString('de-DE') + ' ' +
            d.toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});
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
    this.analyzeLocationsAndTypes();
    this.analyzeTemporalPatterns();
    this.analyzeDistributionPerSite();
    this.deriveMaturityLevel();
    this.buildRecommendations();
    this.buildForecastHint();
    this.renderAll();
};

// Gesamt-Risiko über gewichtete Event-Typen
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
        totalEvents: this.data.length,
        criticalTypes: byType.filter(function(e) { return (CONFIG.riskWeights[e.key] || 0) >= 8; }),
        byType: byType
    };
};

// Verteilung auf Security / FM / SHE / Other
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

// Top-Länder / -Standorte / -Eventtypen
SecurityAnalytics.prototype.analyzeLocationsAndTypes = function() {
    var self = this;
    var bySite = {};
    var byCountry = {};
    var byType = {};

    this.data.forEach(function(r) {
        var c = self.headerMap.country ? r[self.headerMap.country] : '';
        var s = self.headerMap.site ? r[self.headerMap.site] : '';
        var t = self.headerMap.type ? r[self.headerMap.type] : '';

        if (c) byCountry[c] = (byCountry[c] || 0) + 1;
        if (s) bySite[s] = (bySite[s] || 0) + 1;
        if (t) byType[t] = (byType[t] || 0) + 1;
    });

    function toArray(map) {
        var out = [];
        for (var k in map) out.push({ key: k, count: map[k] });
        out.sort(function(a, b){ return b.count - a.count; });
        return out;
    }

    this.insights.topCountries = toArray(byCountry).slice(0, 3);
    this.insights.topSites     = toArray(bySite).slice(0, 3);
    this.insights.topTypes     = toArray(byType).slice(0, 3);
};

// Zeitliche Muster: Peak-Stunde / Peak-Wochentag / grobe Schichten
SecurityAnalytics.prototype.analyzeTemporalPatterns = function() {
    var self = this;
    var byHour = new Array(24).fill(0);
    var byWeekday = new Array(7).fill(0);

    this.data.forEach(function(r) {
        if (!self.headerMap.date) return;
        var raw = r[self.headerMap.date];
        if (!raw) return;
        var d = new Date(raw);
        if (isNaN(d.getTime())) return;

        byHour[d.getHours()]++;
        byWeekday[d.getDay()]++; // 0=So, 1=Mo, ...
    });

    function peakIndex(arr) {
        var max = -1, idx = -1;
        arr.forEach(function(v, i) {
            if (v > max) { max = v; idx = i; }
        });
        return { index: idx, value: max };
    }

    var h = peakIndex(byHour);
    var w = peakIndex(byWeekday);

    var weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    // Zuordnung zu groben Schichten
    function classifyShift(hour) {
        if (hour === null || hour < 0) return null;
        if (hour >= 6  && hour < 14) return 'Frühschicht (06–14 Uhr)';
        if (hour >= 14 && hour < 22) return 'Spätschicht (14–22 Uhr)';
        return 'Nachtschicht (22–06 Uhr)';
    }

    this.insights.timePatterns = {
        byHour: byHour,
        byWeekday: byWeekday,
        peakHour: h.index >= 0 ? h.index : null,
        peakHourValue: h.value,
        peakWeekday: w.index >= 0 ? weekdayNames[w.index] : null,
        peakWeekdayValue: w.value,
        peakShift: classifyShift(h.index)
    };
};

// Verteilung Events pro Standort (zur Identifikation von Hotspots)
SecurityAnalytics.prototype.analyzeDistributionPerSite = function() {
    var self = this;
    var bySite = {};
    this.data.forEach(function(r) {
        var s = self.headerMap.site ? r[self.headerMap.site] : '';
        if (!s) return;
        bySite[s] = (bySite[s] || 0) + 1;
    });

    var arr = [];
    for (var k in bySite) arr.push({ site: k, count: bySite[k] });
    arr.sort(function(a, b) { return b.count - a.count; });

    this.insights.siteDistribution = arr;
};

// Grober "Reifegrad" der Sicherheitsorganisation aus den Kennzahlen abgeleitet
SecurityAnalytics.prototype.deriveMaturityLevel = function() {
    var r = this.insights.risk;
    var domains = this.insights.domains || [];
    var sites = this.insights.siteDistribution || [];
    var types = this.insights.topTypes || [];

    var level;
    var comments = [];

    if (!this.data.length) {
        level = 'Keine Einstufung (keine Daten)';
    } else if (r.score < 35 && (domains[0] && domains[0].share < 60)) {
        level = 'Reifegrad: Fortgeschritten';
        comments.push('Niedriges bis moderates Risikoniveau mit relativ ausgewogener Verteilung auf verschiedene Bereiche. Dies deutet auf eine grundsätzlich etablierte Sicherheitsorganisation hin.');
    } else if (r.score < 60) {
        level = 'Reifegrad: Etabliert mit Optimierungspotenzial';
        comments.push('Das Risikoniveau ist im mittleren Bereich. Einzelne Standorte oder Ereignistypen dominieren, was auf lokale Schwachstellen oder ungleich verteilte Maßnahmen hinweist.');
    } else {
        level = 'Reifegrad: Kritisch / Reaktiv';
        comments.push('Hohes Risikoniveau und/oder starke Konzentration bestimmter Eventtypen oder Standorte. Dies spricht für reaktive statt proaktive Sicherheitsprozesse.');
    }

    if (sites.length && sites[0].count > (this.data.length * 0.4)) {
        comments.push('Ein einzelner Standort weist mehr als 40% aller gemeldeten Ereignisse auf. Hier besteht akuter Handlungsbedarf und Potenzial für eine gezielte Standortstrategie.');
    }

    if (types.length && types[0].count > (this.data.length * 0.5)) {
        comments.push('Eine Ereignisart dominiert das Gesamtbild deutlich. Eine Ursachenanalyse (z.B. Prozesse, Technik, Verhalten) sollte priorisiert werden.');
    }

    this.insights.maturity = {
        level: level,
        comments: comments
    };
};

// Handlungsempfehlungen mit Enterprise-Fokus
SecurityAnalytics.prototype.buildRecommendations = function() {
    var r = this.insights.risk;
    var d = this.insights.domains || [];
    var time = this.insights.timePatterns || {};
    var sites = this.insights.siteDistribution || [];
    var maturity = this.insights.maturity || {};
    var recs = [];

    // Basis-Empfehlung nach Risiko-Level
    if (r.level === 'HOCH') {
        recs.push('Risikoniveau ist HOCH. Kurzfristig sollten zusätzliche Sicherungsmaßnahmen an den kritischen Standorten umgesetzt werden (z.B. Zutrittskontrollen verschärfen, Wachpersonal verstärken, technische Anlagen überprüfen).');
        recs.push('Ein konzernweites Incident-Review mit Fokus auf die letzten 4–8 Wochen ist sinnvoll, um Muster zu identifizieren und Sofortmaßnahmen abzuleiten.');
    } else if (r.level === 'MITTEL') {
        recs.push('Risikoniveau ist MITTEL. Empfohlen wird eine gezielte Überprüfung der aktuellen Maßnahmen und ein Fokus auf die am stärksten betroffenen Bereiche und Ereignisarten.');
        recs.push('Ein regelmäßiger Management-Report (monatlich/vierteljährlich) mit Top-Standorten und Eventtypen sollte etabliert oder geschärft werden.');
    } else {
        recs.push('Risikoniveau ist NIEDRIG. Die aktuelle Sicherheitslage ist stabil; regelmäßige Kontrollen und Monitoring sollten dennoch beibehalten werden.');
        recs.push('Nutzen Sie die aktuelle Lage, um Prozesse zu standardisieren, Schulungen durchzuführen und Lessons Learned zu dokumentieren.');
    }

    // Kritische Ereignistypen
    if (r.criticalTypes && r.criticalTypes.length) {
        var topCrit = r.criticalTypes[0];
        recs.push('Besonders kritisch fällt die Ereignisart "' + (topCrit.key || 'Unbekannt') + '" auf (' + topCrit.count + ' Vorkommen). Hier sollten gezielt Ursachen analysiert und spezifische Gegenmaßnahmen (technisch, organisatorisch, personell) definiert werden.');
    }

    // Dominanter Bereich (Security, FM, SHE)
    if (d && d.length && d[0].count > 0) {
        var dom = d[0];
        if (dom.domain === 'Security') {
            recs.push('Der überwiegende Teil der Ereignisse entfällt auf klassische Security-Vorfälle. Empfehlung: Überarbeitung des Sicherheitskonzeptes, Schulung des Personals zu Meldewegen und Verhalten sowie Überprüfung von Zutritts- und Alarmmanagement.');
        } else if (dom.domain === 'FM') {
            recs.push('Viele Ereignisse stehen im Zusammenhang mit Facility-Management. Prüfen Sie Wartungsintervalle und Störungsmeldungen (z.B. Aufzüge, Klima, Energieversorgung) und optimieren Sie die Eskalationswege.');
        } else if (dom.domain === 'SHE') {
            recs.push('Ein signifikanter Anteil der Ereignisse entfällt auf SHE-Themen (Safety, Health, Environment). Empfehlung: Safety-Begehungen, Trainings zu Arbeitssicherheit und Überprüfung der Brandschutz- und Evakuierungspläne.');
        } else {
            recs.push('Ein relevanter Teil der Ereignisse lässt sich keinem Kernbereich klar zuordnen. Hier lohnt eine bessere Klassifizierung und Harmonisierung der Eventtypen sowie ein einheitliches Regelwerk zur Erfassung.');
        }
    }

    // Zeitliche Muster
    if (time.peakHourValue > 0) {
        recs.push('Auffällig ist eine Häufung von Ereignissen gegen ca. ' + time.peakHour + ':00 Uhr. In diesem Zeitfenster sollten verstärkte Kontrollen, Monitoring oder zusätzliche Präsenz eingeplant werden.');
    }
    if (time.peakWeekdayValue > 0 && time.peakWeekday) {
        recs.push('Der Wochentag mit den meisten Ereignissen ist der ' + time.peakWeekday + '. Planen Sie an diesem Tag zusätzliche Ressourcen oder spezifische Maßnahmen (z.B. Schwerpunktkontrollen) ein.');
    }
    if (time.peakShift) {
        recs.push('Die meisten Ereignisse treten in der ' + time.peakShift + ' auf. Schichtübergaben, Wachstärken und technische Kontrollen sollten in dieser Zeit besonders sauber organisiert sein.');
    }

    // Standort-Hotspots
    if (sites && sites.length) {
        var topSite = sites[0];
        recs.push('Standort-Hotspot: "' + topSite.site + '" mit ' + topSite.count + ' Ereignissen. Eine detaillierte Standortanalyse (Zutritt, Perimeter, Beleuchtung, Prozesse) ist empfehlenswert.');
        if (sites.length > 1) {
            var second = sites[1];
            recs.push('Vergleich mit weiteren Standorten wie "' + second.site + '" kann helfen, Best Practices zu identifizieren und auf den Hotspot zu übertragen.');
        }
    }

    // Reifegrad-Kommentare
    if (maturity && maturity.comments && maturity.comments.length) {
        maturity.comments.forEach(function(c) { recs.push(c); });
    }

    this.insights.recommendations = recs;
};

// Trend- / Forecast-Text
SecurityAnalytics.prototype.buildForecastHint = function() {
    var r = this.insights.risk;
    var time = this.insights.timePatterns || {};
    var domains = this.insights.domains || [];
    var text;

    if (!this.data.length) {
        text = 'Keine Daten vorhanden, um einen Trend oder eine Prognose zu erstellen.';
    } else if (r.score > 70) {
        text = 'Die aktuelle Entwicklung deutet auf einen anhaltend erhöhten Risiko-Level hin. Ohne zusätzliche Maßnahmen ist mittelfristig mit einer weiteren Zunahme von kritischen Ereignissen zu rechnen.';
    } else if (r.score > 40) {
        text = 'Der Trend liegt im mittleren Bereich. Bei gleichbleibenden Rahmenbedingungen ist von einer moderaten Entwicklung auszugehen – einzelne Peaks (z.B. in Stoßzeiten oder an bestimmten Wochentagen) sollten jedoch aktiv beobachtet werden.';
    } else {
        text = 'Der aktuelle Trend wirkt stabil mit eher niedrigen Eventzahlen. Dennoch sollten Änderungen im Umfeld (z.B. neue Standorte, bauliche Maßnahmen, Personalwechsel) regelmäßig bewertet werden.';
    }

    if (time.peakHourValue > 0 && time.peakWeekdayValue > 0) {
        text += ' Besonders im Zeitraum um ' + time.peakHour + ':00 Uhr am ' + time.peakWeekday + ' ist mit einer überdurchschnittlichen Ereigniswahrscheinlichkeit zu rechnen.';
    }

    if (domains.length && domains[0].count > 0) {
        text += ' Der dominierende Bereich "' + domains[0].domain + '" sollte in zukünftigen Planungen (Ressourcen, Budget, Maßnahmen) vorrangig berücksichtigt werden.';
    }

    this.insights.forecastText = text;
};

// Rendering in die vier Smart-Analytics-Kacheln
SecurityAnalytics.prototype.renderAll = function() {
    var r = this.insights.risk;
    var d = this.insights.domains || [];
    var recList = this.insights.recommendations || [];
    var forecastText = this.insights.forecastText || 'Keine Trendinformationen verfügbar.';
    var maturity = this.insights.maturity || {};

    // Risiko-Einschätzung
    var riskEl = document.getElementById('riskAssessment');
    if (riskEl && r) {
        var html = '<div class="insight-item risk-' + r.riskClass + '">';
        html += '<div class="insight-value">Risiko: ' + r.level + ' (' + r.score + '%)</div>';
        html += '<div class="insight-trend">' + r.highRiskEvents + ' kritische von ' + r.totalEvents + ' Events</div>';
        html += '</div>';

        if (r.criticalTypes && r.criticalTypes.length) {
            html += '<div class="insight-item"><div class="insight-value">Top-kritische Ereignistypen:</div>';
            html += '<ul class="insight-list">';
            r.criticalTypes.slice(0, 3).forEach(function(ct) {
                html += '<li>' + Utils.escapeHtml(ct.key || '(leer)') + ' – ' + ct.count + ' Vorkommen</li>';
            });
            html += '</ul></div>';
        }

        if (maturity.level) {
            html += '<div class="insight-item"><div class="insight-trend">' + Utils.escapeHtml(maturity.level) + '</div></div>';
        }

        riskEl.innerHTML = html;
    }

    // Muster & Bereiche
    var patternEl = document.getElementById('patternDetection');
    if (patternEl && d && d.length) {
        var html2 = '<div class="insight-item">';
        html2 += '<div class="insight-value">Top-Bereich: ' + d[0].domain + '</div>';
        html2 += '<div class="insight-trend">' + d[0].count + ' Events (' + d[0].share + '%)</div>';
        html2 += '</div>';

        var secCount = (d.find(function(x){return x.domain==='Security';})||{count:0}).count;
        var fmCount  = (d.find(function(x){return x.domain==='FM';})||{count:0}).count;
        var sheCount = (d.find(function(x){return x.domain==='SHE';})||{count:0}).count;
        var otherCount = (d.find(function(x){return x.domain==='Other';})||{count:0}).count;

        html2 += '<div class="insight-item"><div class="insight-trend">';
        html2 += 'Security: ' + secCount + ' | ';
        html2 += 'FM: ' + fmCount + ' | ';
        html2 += 'SHE: ' + sheCount + ' | ';
        html2 += 'Other: ' + otherCount;
        html2 += '</div></div>';

        patternEl.innerHTML = html2;
    }

    // Empfehlungen
    var recEl = document.getElementById('smartRecommendations');
    if (recEl) {
        if (!recList.length) {
            recEl.innerHTML = '<div class="loading">Keine spezifischen Empfehlungen ableitbar.</div>';
        } else {
            var html3 = '<div class="insight-item"><div class="insight-value">Handlungsempfehlungen</div>';
            html3 += '<ul class="insight-list">';
            recList.forEach(function(line) {
                html3 += '<li>' + Utils.escapeHtml(line) + '</li>';
            });
            html3 += '</ul></div>';
            recEl.innerHTML = html3;
        }
    }

    // Trend & Forecast
    var trendEl = document.getElementById('trendForecast');
    if (trendEl) {
        var html4 = '<div class="insight-item">';
        html4 += '<div class="insight-value">Trend & Prognose</div>';
        html4 += '<div class="insight-trend">' + Utils.escapeHtml(forecastText) + '</div>';
        html4 += '</div>';
        trendEl.innerHTML = html4;
    }
};

SecurityAnalytics.prototype.renderAll = function() {
    var r = this.insights.risk;
    var d = this.insights.domains || [];
    var recList = this.insights.recommendations || [];
    var forecastText = this.insights.forecastText || 'Keine Trendinformationen verfügbar.';

    // Risiko-Einschätzung
    var riskEl = document.getElementById('riskAssessment');
    if (riskEl && r) {
        var html = '<div class="insight-item risk-' + r.riskClass + '">';
        html += '<div class="insight-value">Risiko: ' + r.level + ' (' + r.score + '%)</div>';
        html += '<div class="insight-trend">' + r.highRiskEvents + ' kritische von ' + r.totalEvents + ' Events</div>';
        html += '</div>';

        if (r.criticalTypes && r.criticalTypes.length) {
            html += '<div class="insight-item"><div class="insight-value">Top-kritische Ereignistypen:</div>';
            html += '<ul class="insight-list">';
            r.criticalTypes.slice(0, 3).forEach(function(ct) {
                html += '<li>' + Utils.escapeHtml(ct.key || '(leer)') + ' – ' + ct.count + ' Vorkommen</li>';
            });
            html += '</ul></div>';
        }

        riskEl.innerHTML = html;
    }

    // Muster & Bereiche
    var patternEl = document.getElementById('patternDetection');
    if (patternEl && d && d.length) {
        var html2 = '<div class="insight-item">';
        html2 += '<div class="insight-value">Top-Bereich: ' + d[0].domain + '</div>';
        html2 += '<div class="insight-trend">' + d[0].count + ' Events (' + d[0].share + '%)</div>';
        html2 += '</div>';

        var secCount = (d.find(function(x){return x.domain==='Security';})||{count:0}).count;
        var fmCount  = (d.find(function(x){return x.domain==='FM';})||{count:0}).count;
        var sheCount = (d.find(function(x){return x.domain==='SHE';})||{count:0}).count;
        var otherCount = (d.find(function(x){return x.domain==='Other';})||{count:0}).count;

        html2 += '<div class="insight-item"><div class="insight-trend">';
        html2 += 'Security: ' + secCount + ' | ';
        html2 += 'FM: ' + fmCount + ' | ';
        html2 += 'SHE: ' + sheCount + ' | ';
        html2 += 'Other: ' + otherCount;
        html2 += '</div></div>';

        patternEl.innerHTML = html2;
    }

    // Empfehlungen
    var recEl = document.getElementById('smartRecommendations');
    if (recEl) {
        if (!recList.length) {
            recEl.innerHTML = '<div class="loading">Keine spezifischen Empfehlungen ableitbar.</div>';
        } else {
            var html3 = '<div class="insight-item"><div class="insight-value">Handlungsempfehlungen</div>';
            html3 += '<ul class="insight-list">';
            recList.forEach(function(line) {
                html3 += '<li>' + Utils.escapeHtml(line) + '</li>';
            });
            html3 += '</ul></div>';
            recEl.innerHTML = html3;
        }
    }

    // Trend & Forecast
    var trendEl = document.getElementById('trendForecast');
    if (trendEl) {
        var html4 = '<div class="insight-item">';
        html4 += '<div class="insight-value">Trend & Prognose</div>';
        html4 += '<div class="insight-trend">' + Utils.escapeHtml(forecastText) + '</div>';
        html4 += '</div>';
        trendEl.innerHTML = html4;
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
            html += '<input class="risk-config-input" type="number" min="1" max="10" value="' + w +
                '" data-type="' + Utils.escapeHtml(type) + '">';
            html += '</div>';
        });
        container.innerHTML = html;

        container.querySelectorAll('.risk-config-input').forEach(function(input) {
            input.addEventListener('change', function(e) {
                var val = parseInt(e.target.value, 10) || 3;
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
            status.textContent = 'Zeige ' + DashboardState.currentData.length +
                ' von ' + DashboardState.allData.length + ' Datensaetzen';
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
        // Basiszahlen
        UI.updateText('kpiTotalEvents', DashboardState.allData.length);
        UI.updateText('kpiTotalEventsSub', DashboardState.currentData.length + ' nach Filter');

        var countries = {}, sites = {}, types = {};
        DashboardState.allData.forEach(function(r) {
            if (DashboardState.headerMap.country && r[DashboardState.headerMap.country]) {
                countries[r[DashboardState.headerMap.country]] = true;
            }
            if (DashboardState.headerMap.site && r[DashboardState.headerMap.site]) {
                sites[r[DashboardState.headerMap.site]] = true;
            }
            if (DashboardState.headerMap.type && r[DashboardState.headerMap.type]) {
                types[r[DashboardState.headerMap.type]] = true;
            }
        });

        var countryCount = Object.keys(countries).length;
        var siteCount = Object.keys(sites).length;
        var typeCount = Object.keys(types).length;

        // Header-KPIs
        UI.updateText('kpiCountries', countryCount);
        UI.updateText('kpiSites', siteCount);
        UI.updateText('kpiTypes', typeCount);

        // Karten-KPIs
        UI.updateText('kpiTotalEventsCard', DashboardState.allData.length);
        UI.updateText('kpiCountriesCard', countryCount);
        UI.updateText('kpiSitesCard', siteCount);
        UI.updateText('kpiTypesCard', typeCount);
    },

    renderFilters: function() {
        var countries = {}, sites = {}, types = {};
        DashboardState.allData.forEach(function(r) {
            if (DashboardState.headerMap.country && r[DashboardState.headerMap.country]) {
                countries[r[DashboardState.headerMap.country]] = true;
            }
            if (DashboardState.headerMap.site && r[DashboardState.headerMap.site]) {
                sites[r[DashboardState.headerMap.site]] = true;
            }
            if (DashboardState.headerMap.type && r[DashboardState.headerMap.type]) {
                types[r[DashboardState.headerMap.type]] = true;
            }
        });

        FilterManager.updateOptions('filterCountry', Object.keys(countries).sort(), 'Alle Laender');
        FilterManager.updateOptions('filterSite', Object.keys(sites).sort(), 'Alle Liegenschaften');
        FilterManager.updateOptions('filterType', Object.keys(types).sort(), 'Alle Ereignisarten');
    },

    renderTables: function() {
        var empty = '<tr><td colspan="3" class="empty-state">Keine Daten</td></tr>';

        if (!DashboardState.currentData.length) {
            var tcEmpty = document.querySelector('#tableByCountry tbody');
            var tsEmpty = document.querySelector('#tableBySite tbody');
            var ttEmpty = document.querySelector('#tableByType tbody');
            if (tcEmpty) tcEmpty.innerHTML = empty;
            if (tsEmpty) tsEmpty.innerHTML = empty;
            if (ttEmpty) ttEmpty.innerHTML = empty;
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
            bySite.push({
                site: parts[0] || '(leer)',
                country: parts[1] || '(leer)',
                count: siteMap[k]
            });
        }
        bySite.sort(function(a, b) { return b.count - a.count; });

        var tc = document.querySelector('#tableByCountry tbody');
        if (tc) {
            var htmlC = '';
            byCountry.forEach(function(item) {
                htmlC += '<tr><td>' + Utils.escapeHtml(item.key || '(leer)') +
                    '</td><td>' + item.count + '</td></tr>';
            });
            tc.innerHTML = htmlC;
        }

        var ts = document.querySelector('#tableBySite tbody');
        if (ts) {
            var htmlS = '';
            bySite.forEach(function(item) {
                htmlS += '<tr><td>' + Utils.escapeHtml(item.site) + '</td>' +
                    '<td>' + Utils.escapeHtml(item.country) + '</td>' +
                    '<td>' + item.count + '</td></tr>';
            });
            ts.innerHTML = htmlS;
        }

        var tt = document.querySelector('#tableByType tbody');
        if (tt) {
            var htmlT = '';
            byType.forEach(function(item) {
                htmlT += '<tr><td>' + Utils.escapeHtml(item.key || '(leer)') +
                    '</td><td>' + item.count + '</td></tr>';
            });
            tt.innerHTML = htmlT;
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
                fileStatus.textContent = '"' + filename + '" geladen (' +
                    DashboardState.allData.length + ' Datensaetze)';
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
            if (DashboardState.headerMap.country && r[DashboardState.headerMap.country]) {
                countriesSet[r[DashboardState.headerMap.country]] = true;
            }
            if (DashboardState.headerMap.site && r[DashboardState.headerMap.site]) {
                sitesSet[r[DashboardState.headerMap.site]] = true;
            }
            if (DashboardState.headerMap.type && r[DashboardState.headerMap.type]) {
                typesSet[r[DashboardState.headerMap.type]] = true;
            }
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

        // AI-basierte Executive Summary (Smart Analytics)
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);

        // Risiko & Reifegrad
        var riskLine = 'Risiko: ' + (aRisk.level || 'n/a') + ' (' + (aRisk.score != null ? aRisk.score + '%' : '-') + ')';
        pdf.text(riskLine, marginX, yPos); 
        yPos += 6;

        if (aMaturity.level) {
            pdf.setFontSize(10);
            pdf.text(aMaturity.level, marginX, yPos);
            yPos += 6;
        }

        // Dominanter Bereich & Verteilung
        if (aDomains.length) {
            var dom = aDomains[0];
            var domainLine = 'Dominanter Bereich: ' + dom.domain + ' – ' + dom.count + ' Events (' + dom.share + '%).';
            pdf.setFontSize(9);
            pdf.text(domainLine, marginX, yPos);
            yPos += 5;

            var secCount = (aDomains.find(function(x){return x.domain==='Security';})||{count:0}).count;
            var fmCount  = (aDomains.find(function(x){return x.domain==='FM';})||{count:0}).count;
            var sheCount = (aDomains.find(function(x){return x.domain==='SHE';})||{count:0}).count;
            var otherCount = (aDomains.find(function(x){return x.domain==='Other';})||{count:0}).count;

            var distLine = 'Verteilung – Security: ' + secCount + ', FM: ' + fmCount + ', SHE: ' + sheCount + ', Other: ' + otherCount + '.';
            pdf.text(distLine, marginX, yPos);
            yPos += 6;
        }

        // Top-Länder / -Standorte / -Typen
        pdf.setFontSize(9);
        var summaryLines = [];

        if (aTopCountries.length) {
            var tc = aTopCountries.map(function(c){ return c.key + ' (' + c.count + ')'; }).join(', ');
            summaryLines.push('Top-Länder: ' + tc + '.');
        }
        if (aTopSites.length) {
            var ts = aTopSites.map(function(s){ return s.key + ' (' + s.count + ')'; }).join(', ');
            summaryLines.push('Top-Standorte: ' + ts + '.');
        }
        if (aTopTypes.length) {
            var tt = aTopTypes.map(function(t){ return t.key + ' (' + t.count + ')'; }).join(', ');
            summaryLines.push('Top-Ereignisarten: ' + tt + '.');
        }

        summaryLines.forEach(function(line) {
            if (yPos > pageHeight - 30) {
                pdf.addPage();
                yPos = 22;
            }
            pdf.text(line, marginX, yPos);
            yPos += 5;
        });

        // Zeitliche Muster
        if (aTime.peakHourValue > 0 || aTime.peakWeekdayValue > 0 || aTime.peakShift) {
            if (yPos > pageHeight - 30) {
                pdf.addPage();
                yPos = 22;
            }
            pdf.setFontSize(9);
            var timeLine = 'Zeitliche Muster: ';
            var parts = [];
            if (aTime.peakHourValue > 0) {
                parts.push('Peak ca. ' + aTime.peakHour + ':00 Uhr');
            }
            if (aTime.peakWeekdayValue > 0 && aTime.peakWeekday) {
                parts.push('häufigster Wochentag: ' + aTime.peakWeekday);
            }
            if (aTime.peakShift) {
                parts.push('Schwerpunkt in ' + aTime.peakShift);
            }
            timeLine += parts.join(', ') + '.';
            pdf.text(timeLine, marginX, yPos);
            yPos += 6;
        }

        // Handlungsempfehlungen (stark verdichtet)
        if (aRecs.length) {
            if (yPos > pageHeight - 40) {
                pdf.addPage();
                yPos = 22;
            }
            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);
            pdf.text('Handlungsempfehlungen (Auszug)', marginX, yPos);
            yPos += 6;

            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);

            var maxRecs = 5;
            aRecs.slice(0, maxRecs).forEach(function(rec) {
                if (yPos > pageHeight - 20) {
                    pdf.addPage();
                    yPos = 22;
                }
                var split = pdf.splitTextToSize(rec, pageWidth - 2 * marginX);
                pdf.text(split, marginX, yPos);
                yPos += split.length * 4 + 1;
            });
        }

        // Trend / Prognose
        if (aForecast) {
            if (yPos > pageHeight - 40) {
                pdf.addPage();
                yPos = 22;
            }
            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);
            pdf.text('Trend & Prognose (AI)', marginX, yPos);
            yPos += 6;

            pdf.setFontSize(9);
            pdf.setTextColor(60, 60, 60);

            var forecastSplit = pdf.splitTextToSize(aForecast, pageWidth - 2 * marginX);
            pdf.text(forecastSplit, marginX, yPos);
            yPos += forecastSplit.length * 4 + 2;
        }

        // danach geht dein existierender Code weiter mit:
        // // Charts als Bilder
        var addChart = function(selector, title) {
            ...
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
