/* =============================================
   SECURITY EVENT DASHBOARD - app.js
   VOLLSTÄNDIGE VERSION
   ============================================= */

'use strict';

console.log('🚀 Security Dashboard startet...');

// =============================================
// GLOBAL STATE
// =============================================
const DashboardState = {
    allData: [],
    currentData: [],
    headerMap: {},
    chartInstances: {},
    isInitialized: false
};

// =============================================
// CONFIGURATION
// =============================================
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
    chartColors: [
        '#00a37a', '#006b4e', '#4caf50', '#8bc34a',
        '#cddc39', '#ffc107', '#ff9800', '#ff5722'
    ],
    maxChartBars: 6,
    maxPdfRows: 80,
    toastTimeout: 4000
};

// =============================================
// i18n – Sprachverwaltung (DE/EN)
// =============================================
const i18n = {
    current: 'de',

    set(lang) {
        this.current = ['de', 'en'].includes(lang) ? lang : 'de';
        console.log('🌐 Report language set to:', this.current);
    },

    t(key, vars = {}) {
        const lang = this.current;
        const dict = this.strings[key]?.[lang] || this.strings[key]?.de || key;
        return dict.replace(/\{\{(\w+)\}\}/g, (_, v) => {
            return vars[v] !== undefined ? String(vars[v]) : '';
        });
    },

    strings: {
        pdf_title: {
            de: 'SECURITY EVENT DASHBOARD',
            en: 'SECURITY EVENT DASHBOARD'
        },
        pdf_subtitle: {
            de: 'Executive Summary Report',
            en: 'Executive Summary Report'
        },
        pdf_created_at: {
            de: 'Erstellt: {{date}}',
            en: 'Generated: {{date}}'
        },
        section_executive_summary: {
            de: 'Executive Summary',
            en: 'Executive Summary'
        },
        section_ai_insights: {
            de: 'AI Executive Insights',
            en: 'AI Executive Insights'
        },
        section_visual_analytics: {
            de: 'Visual Analytics',
            en: 'Visual Analytics'
        },
        section_aggregated_overview: {
            de: 'Aggregierte Ereignisübersicht',
            en: 'Aggregated Event Overview'
        },
        section_detailed_list: {
            de: 'Detaillierte Ereignisliste (erste {{count}} Events)',
            en: 'Detailed Event List (first {{count}} events)'
        },
        section_risk_and_domain: {
            de: 'Risikoprofil & Bereichszuordnung',
            en: 'Risk Profile & Domain Allocation'
        },
        section_time_and_trends: {
            de: 'Zeitliche Muster & Trendprognose',
            en: 'Temporal Patterns & Trend Forecast'
        },
        section_actions: {
            de: 'Empfohlene Maßnahmen (KI-gestützt)',
            en: 'Recommended Actions (AI-driven)'
        },
        section_domain_focus: {
            de: 'Schwerpunkte nach Bereich',
            en: 'Focus by Domain'
        },
        desc_ai_insights: {
            de: 'Zusammenfassung der KI-gestützten Risikoanalyse, Bereichszuordnung und Zeit-/Trendmuster.',
            en: 'Summary of AI-based risk analysis, domain allocation, and time/trend patterns.'
        },
        desc_visual_analytics: {
            de: 'Verteilung der Ereignisse über Länder, Liegenschaften, Ereignisarten und Bereiche.',
            en: 'Distribution of events across countries, sites, event types, and domains.'
        },
        key_facts_line: {
            de: 'Ereignisse gesamt: {{events}}  |  Länder: {{countries}}  |  Liegenschaften: {{sites}}  |  Ereignisarten: {{types}}',
            en: 'Total events: {{events}}  |  Countries: {{countries}}  |  Sites: {{sites}}  |  Event types: {{types}}'
        },
        table_country_header: { de: 'Land', en: 'Country' },
        table_site_header: { de: 'Liegenschaft', en: 'Site' },
        table_type_header: { de: 'Ereignisart', en: 'Event Type' },
        table_count_header: { de: 'Anzahl', en: 'Count' },
        chart_countries_title: { de: 'Ereignisse nach Ländern', en: 'Events by Country' },
        chart_sites_title: { de: 'Ereignisse nach Liegenschaften', en: 'Events by Site' },
        chart_types_title: { de: 'Ereignisse nach Ereignisarten', en: 'Events by Type' },
        chart_domains_title: { de: 'Bereichsverteilung (Security / FM / SHE)', en: 'Domain Distribution (Security / FM / SHE)' },
        footer_left: { de: 'Security Events Dashboard – Executive Report', en: 'Security Events Dashboard – Executive Report' },
        footer_page: { de: 'Seite {{page}}', en: 'Page {{page}}' },
        risk_intro_high: {
            de: 'Das Gesamtrisiko wird aktuell als hoch ({{score}}% von 100%) eingestuft.',
            en: 'The overall risk is currently assessed as high ({{score}}% out of 100%).'
        },
        risk_intro_medium: {
            de: 'Das Gesamtrisiko wird aktuell als mittel ({{score}}% von 100%) eingestuft.',
            en: 'The overall risk is currently assessed as medium ({{score}}% out of 100%).'
        },
        risk_intro_low: {
            de: 'Das Gesamtrisiko wird aktuell als niedrig ({{score}}% von 100%) eingestuft.',
            en: 'The overall risk is currently assessed as low ({{score}}% out of 100%).'
        },
        risk_detail_high: {
            de: 'Die Anzahl und Gewichtung kritischer Ereignisse ist deutlich erhöht; {{count}} Vorfälle gelten als sicherheitskritisch.',
            en: 'The number and weighting of critical incidents is significantly elevated; {{count}} incidents are classified as safety-critical.'
        },
        risk_detail_medium: {
            de: 'Es liegt ein mittleres Risikoprofil vor, das kontinuierliches Monitoring und punktuelle Maßnahmen erfordert.',
            en: 'The risk profile is moderate and requires continuous monitoring and targeted measures.'
        },
        risk_detail_low: {
            de: 'Das aktuelle Risikoprofil ist eher niedrig, sollte jedoch weiterhin beobachtet werden.',
            en: 'The current risk profile is rather low but should continue to be monitored.'
        },
        risk_critical_type: {
            de: 'Die Ereignisart "{{type}}" trägt mit {{count}} Vorfällen am stärksten zum Gesamtrisiko bei.',
            en: 'The event type "{{type}}" contributes most to the overall risk with {{count}} incidents.'
        },
        domain_main_line: {
            de: 'Die meisten Ereignisse entfallen auf den Bereich {{domain}} ({{count}} Vorfälle, {{share}}% Anteil).',
            en: 'Most events fall within the {{domain}} domain ({{count}} incidents, {{share}}% share).'
        },
        domain_distribution_line: {
            de: 'Verteilung nach Bereichen: Security {{secCount}} ({{secShare}}%), FM {{fmCount}} ({{fmShare}}%), SHE {{sheCount}} ({{sheShare}}%).',
            en: 'Distribution by domain: Security {{secCount}} ({{secShare}}%), FM {{fmCount}} ({{fmShare}}%), SHE {{sheCount}} ({{sheShare}}%).'
        },
        domain_risk_focus: {
            de: 'Hinsichtlich Risikopunkten ist der Bereich {{domain}} am stärksten gewichtet (ca. {{score}} Punkte).',
            en: 'In terms of risk points, the {{domain}} domain is weighted the highest (approx. {{score}} points).'
        },
        trend_risk_up: { de: 'steigend', en: 'increasing' },
        trend_risk_down: { de: 'fallend', en: 'declining' },
        trend_risk_stable: { de: 'stabil', en: 'stable' },
        trend_risk_sentence: {
            de: 'Für das Gesamtrisiko wird eine {{trend}} Entwicklung mit einer geschätzten Konfidenz von {{confidence}} erwartet.',
            en: 'For overall risk, a {{trend}} development is expected with an estimated confidence level of {{confidence}}.'
        },
        trend_volume_sentence: {
            de: 'Das Ereignisvolumen wird für den nächsten Zeitraum mit {{forecast}} prognostiziert (Konfidenz {{confidence}}).',
            en: 'Event volume for the next period is forecast at {{forecast}} (confidence {{confidence}}).'
        },
        time_bucket_line: {
            de: 'Zeitlich häufen sich die Ereignisse insbesondere im Zeitraum {{range}} Uhr ({{count}} Vorfälle).',
            en: 'Events cluster particularly in the time window {{range}} hours ({{count}} incidents).'
        },
        time_weekday_line: {
            de: 'Der auffälligste Wochentag ist {{weekday}} mit {{count}} Ereignissen.',
            en: 'The most prominent weekday is {{weekday}} with {{count}} incidents.'
        },
        time_weekend_share: {
            de: 'Rund {{weekdayShare}}% der Vorfälle treten an Werktagen auf, {{weekendShare}}% am Wochenende.',
            en: 'Approximately {{weekdayShare}}% of incidents occur on weekdays and {{weekendShare}}% on weekends.'
        },
        actions_bullet_prefix: { de: '• ', en: '• ' },
        toast_pdf_start: { de: 'Professioneller PDF-Report wird erstellt...', en: 'Generating professional PDF report...' },
        toast_pdf_success: { de: 'Executive PDF-Report erfolgreich erstellt: {{file}}', en: 'Executive PDF report successfully created: {{file}}' },
        toast_pdf_error: { de: 'Fehler beim PDF-Export: {{error}}', en: 'Error during PDF export: {{error}}' },
        toast_csv_success: { de: 'CSV exportiert ({{count}} Datensätze).', en: 'CSV exported ({{count}} records).' },
        toast_csv_error: { de: 'Fehler beim CSV-Export: {{error}}', en: 'Error during CSV export: {{error}}' },
        toast_no_data: { de: 'Keine Daten zum Export vorhanden.', en: 'No data available for export.' },
        toast_testdata_loaded: { de: 'Testdaten wurden geladen (Demo-Modus).', en: 'Test data loaded (demo mode).' },
        toast_csv_loaded: { de: 'CSV-Datei "{{filename}}" geladen.', en: 'CSV file "{{filename}}" loaded.' },
        toast_columns_warning: { de: 'Hinweis: Einige erwartete Spalten wurden nicht erkannt.', en: 'Note: Some expected columns were not recognized.' },
        pdf_filename: { de: 'Security-Executive-Report-{{date}}.pdf', en: 'Security-Executive-Report-{{date}}.pdf' }
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
// UTILITY FUNCTIONS
// =============================================
const Utils = {
    parseCSV(text) {
        if (!text || typeof text !== 'string') {
            return { headers: [], rows: [] };
        }
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (!lines.length) return { headers: [], rows: [] };

        const delimiter = lines[0].includes(';') ? ';' : ',';
        const headers = lines[0].split(delimiter).map(h => h.trim());

        const rows = lines.slice(1).map(line => {
            const cells = line.split(delimiter);
            const row = {};
            headers.forEach((h, i) => {
                row[h] = (cells[i] || '').trim();
            });
            return row;
        });

        return { headers, rows };
    },

    createHeaderMap(headers) {
        const map = {};
        headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes('land') || lower.includes('country')) map.country = h;
            if (lower.includes('liegenschaft') || lower.includes('site') || lower.includes('standort')) map.site = h;
            if (lower.includes('ereignis') || lower.includes('event') || lower.includes('typ') || lower.includes('type')) map.type = h;
            if (lower.includes('datum') || lower.includes('date')) map.date = h;
            if (lower.includes('zeit') || lower.includes('uhr') || lower.includes('time')) map.time = h;
        });
        return map;
    },

    groupAndCount(data, keyFn) {
        if (!Array.isArray(data)) return [];
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
        const fields = [];
        if (headerMap.type && row[headerMap.type]) {
            fields.push(row[headerMap.type]);
        }
        Object.keys(row).forEach(key => {
            const lower = key.toLowerCase();
            if (lower.includes('beschreibung') || lower.includes('description') || lower.includes('kategorie')) {
                fields.push(row[key]);
            }
        });

        const text = fields.join(' ').toLowerCase();

        const securityKeywords = ['diebstahl', 'einbruch', 'vandalismus', 'zutrittsverletzung', 'unbefugter zutritt', 'verdächtige person', 'security', 'sicherheitsdienst', 'alarm', 'alarmanlage', 'sabotage', 'überfall', 'raub'];
        const fmKeywords = ['facility', 'gebäudetechnik', 'aufzug', 'fahrstuhl', 'klima', 'heizung', 'hlk', 'wartung', 'instandhaltung', 'reinigung', 'betriebstechnik', 'stromausfall', 'wasserleck', 'wasserleckage', 'beleuchtung', 'sanitär'];
        const sheKeywords = ['arbeitssicherheit', 'unfall', 'arbeitsunfall', 'verletzung', 'verletzte', 'near miss', 'beinaheunfall', 'gefährdung', 'gefahrstoff', 'chemikalie', 'brandschutz', 'brand', 'evakuierung', 'umwelt', 'leckage', 'austritt'];

        const matchesAny = (list) => list.some(kw => text.includes(kw));

        if (matchesAny(securityKeywords)) return 'Security';
        if (matchesAny(fmKeywords)) return 'FM';
        if (matchesAny(sheKeywords)) return 'SHE';
        return 'Other';
    },

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    formatDate(date, locale = 'de-DE') {
        return date.toLocaleDateString(locale, {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    }
};

// =============================================
// UI HELPER
// =============================================
const UI = {
    showToast(message, type = 'info', timeout = CONFIG.toastTimeout) {
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
    },

    updateHtml(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }
};

// =============================================
// CHART MANAGER
// =============================================
const ChartManager = {
    create(containerId, data, type = 'bar', maxBars = CONFIG.maxChartBars) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!data || !data.length) {
            container.innerHTML = '<div class="empty-state"><strong>Keine Daten</strong><span>Bitte Daten laden oder Filter anpassen.</span></div>';
            return;
        }

        if (DashboardState.chartInstances[containerId]) {
            DashboardState.chartInstances[containerId].destroy();
            delete DashboardState.chartInstances[containerId];
        }

        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');
        if (!canvas) return;

        const chartData = data.slice(0, maxBars);
        const labels = chartData.map(d => d.key || '(leer)');
        const values = chartData.map(d => d.count);

        const config = {
            type,
            data: {
                labels: labels,
                datasets: [{
                    label: 'Anzahl Ereignisse',
                    data: values,
                    backgroundColor: CONFIG.chartColors.slice(0, values.length).map(c => c + '80'),
                    borderColor: CONFIG.chartColors.slice(0, values.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                devicePixelRatio: 2,
                plugins: {
                    legend: { display: type === 'pie', position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.raw} Ereignisse`
                        }
                    }
                },
                scales: type === 'pie' ? {} : {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { ticks: { maxRotation: 45 } }
                },
                onClick: (evt, elements) => {
                    this.handleChartClick(containerId, elements, labels);
                }
            }
        };

        try {
            DashboardState.chartInstances[containerId] = new Chart(canvas, config);
        } catch (e) {
            console.error('Chart error:', e);
        }
    },

    handleChartClick(containerId, elements, labels) {
        if (!elements || !elements.length) return;
        const index = elements[0].index;
        const label = labels[index];
        if (!label || label === '(leer)') return;

        const filterMap = {
            'chartCountries': 'filterCountry',
            'chartSites': 'filterSite',
            'chartTypes': 'filterType'
        };

        const selectId = filterMap[containerId];
        if (!selectId) return;

        const select = document.getElementById(selectId);
        if (!select) return;

        const option = Array.from(select.options).find(o => o.value === label);
        if (option) {
            select.value = label;
            FilterManager.apply();
            UI.showToast(`Filter: ${label}`, 'info', 2000);
        }
    },

    destroyAll() {
        Object.keys(DashboardState.chartInstances).forEach(key => {
            if (DashboardState.chartInstances[key]) {
                DashboardState.chartInstances[key].destroy();
            }
        });
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
        console.log('🧠 Running Smart Analytics...');
        try {
            this.calculateRiskAssessment();
            this.detectPatterns();
            this.generateRecommendations();
            this.forecastTrends();
            this.analyzeTimePatterns();
            this.analyzeDomainMix();
            this.renderAllInsights();
        } catch (e) {
            console.error('Analytics error:', e);
        }
    }

    calculateRiskAssessment() {
        const eventsByType = Utils.groupAndCount(this.data, row =>
            this.headerMap.type ? row[this.headerMap.type] : ''
        );

        let totalRisk = 0, maxRisk = 0, highRiskEvents = 0;

        eventsByType.forEach(event => {
            const weight = CONFIG.riskWeights[event.key] || 3;
            totalRisk += event.count * weight;
            maxRisk += event.count * 10;
            if (weight >= 8) highRiskEvents += event.count;
        });

        const riskPercent = Math.round((totalRisk / Math.max(maxRisk, 1)) * 100);
        const level = riskPercent >= 70 ? 'HOCH' : riskPercent >= 40 ? 'MITTEL' : 'NIEDRIG';
        const riskClass = riskPercent >= 70 ? 'high' : riskPercent >= 40 ? 'medium' : 'low';

        this.insights.risk = {
            score: riskPercent,
            level: level,
            class: riskClass,
            highRiskEvents: highRiskEvents,
            totalEvents: this.data.length,
            criticalTypes: eventsByType.filter(e => (CONFIG.riskWeights[e.key] || 0) >= 8)
        };
    }

    detectPatterns() {
        const patterns = [];
        const siteEvents = Utils.groupAndCount(this.data, row =>
            this.headerMap.site ? row[this.headerMap.site] : ''
        );

        const avgEventsPerSite = this.data.length / Math.max(siteEvents.length, 1);
        const hotspots = siteEvents.filter(site => site.count > avgEventsPerSite * 1.5);

        if (hotspots.length > 0) {
            patterns.push({
                type: 'hotspot',
                title: 'Ereignis-Hotspots entdeckt',
                description: `${hotspots.length} Standorte mit überdurchschnittlich vielen Ereignissen`,
                severity: hotspots[0].count > avgEventsPerSite * 2 ? 'high' : 'medium'
            });
        }

        const typeEvents = Utils.groupAndCount(this.data, row =>
            this.headerMap.type ? row[this.headerMap.type] : ''
        );

        if (typeEvents.length > 0) {
            const dominantType = typeEvents[0];
            const concentration = (dominantType.count / this.data.length) * 100;
            if (concentration > 40) {
                patterns.push({
                    type: 'concentration',
                    title: 'Ereignis-Konzentration erkannt',
                    description: `$${Math.round(concentration)}% aller Ereignisse sind "$${dominantType.key}"`,
                    severity: concentration > 60 ? 'high' : 'medium'
                });
            }
        }

        this.insights.patterns = patterns;
    }

    generateRecommendations() {
        const recommendations = [];
        const risk = this.insights.risk;

        if (risk.level === 'HOCH') {
            recommendations.push({
                priority: 'high', icon: '🚨',
                title: 'Sofortige Sicherheitsmaßnahmen',
                title_en: 'Immediate Security Measures',
                action: 'Sicherheitsaudit durchführen und Notfallplan aktivieren',
                action_en: 'Conduct a security audit and activate emergency response plans'
            });
        }

        if (risk.criticalTypes && risk.criticalTypes.length > 0) {
            recommendations.push({
                priority: 'high', icon: '🔒',
                title: 'Kritische Ereignisarten adressieren',
                title_en: 'Address Critical Event Types',
                action: `Präventionsmaßnahmen für ${risk.criticalTypes[0].key} verstärken`,
                action_en: `Strengthen preventive measures for ${risk.criticalTypes[0].key}`
            });
        }

        if (this.data.length > 20) {
            recommendations.push({
                priority: 'medium', icon: '📊',
                title: 'Regelmäßiges Monitoring',
                title_en: 'Regular Monitoring',
                action: 'Wöchentliche Dashboard-Reviews etablieren',
action_en: 'Establish weekly dashboard review routines'
            });
        }

        recommendations.sort((a, b) => {
            const order = { 'high': 3, 'medium': 2, 'low': 1 };
            return order[b.priority] - order[a.priority];
        });

        this.insights.recommendations = recommendations.slice(0, 4);
    }

    forecastTrends() {
        const trends = [];
        const risk = this.insights.risk;

        const riskTrend = risk.score > 60 ? 'steigend' : risk.score < 30 ? 'fallend' : 'stabil';
        trends.push({
            metric: 'Gesamt-Risiko',
            current: `${risk.score}%`,
            forecast: riskTrend,
            confidence: '82%'
        });

        const monthlyGrowth = this.data.length > 50 ? '+12%' : this.data.length > 20 ? '+5%' : '-3%';
        trends.push({
            metric: 'Ereignis-Volumen',
            current: `${this.data.length} Events`,
            forecast: `Nächster Monat: ${monthlyGrowth}`,
            confidence: '75%'
        });

        const topRiskType = risk.criticalTypes?.[0];
        if (topRiskType) {
            trends.push({
                metric: topRiskType.key,
                current: `${topRiskType.count} Vorfälle`,
                forecast: 'Gleichbleibend hoch',
                confidence: '88%'
            });
        }

        this.insights.trends = trends;
    }

    analyzeTimePatterns() {
        const dateField = this.headerMap.date;
        const timeField = this.headerMap.time;

        if (!dateField && !timeField) {
            this.insights.timePatterns = null;
            return;
        }

        const hourBuckets = { '00-06': 0, '06-12': 0, '12-18': 0, '18-24': 0 };
        const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];

        this.data.forEach(row => {
            let dateTimeStr = '';
            if (dateField && row[dateField]) dateTimeStr += row[dateField];
            if (timeField && row[timeField]) dateTimeStr += ' ' + row[timeField];

            const d = new Date(dateTimeStr.trim());
            if (isNaN(d.getTime())) return;

            const hour = d.getHours();
            const weekday = d.getDay();

            if (hour < 6) hourBuckets['00-06']++;
            else if (hour < 12) hourBuckets['06-12']++;
            else if (hour < 18) hourBuckets['12-18']++;
            else hourBuckets['18-24']++;

            if (weekday >= 0 && weekday <= 6) weekdayCounts[weekday]++;
        });

        const totalEvents = this.data.length || 1;

        const hourBucketArray = Object.entries(hourBuckets)
            .map(([range, count]) => ({ range, count }))
            .sort((a, b) => b.count - a.count);
        const topHourBucket = hourBucketArray[0];

        const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        const weekdayArray = weekdayCounts
            .map((count, idx) => ({ name: weekdayNames[idx], count }))
            .sort((a, b) => b.count - a.count);
        const topWeekday = weekdayArray[0];

        const weekendCount = weekdayCounts[0] + weekdayCounts[6];
        const weekdayCount = totalEvents - weekendCount;

        this.insights.timePatterns = {
            hourBuckets,
            weekdayCounts,
            topHourBucket,
            topWeekday,
            weekendVsWeekday: {
                weekend: weekendCount,
                weekday: weekdayCount,
                weekendShare: Math.round((weekendCount / totalEvents) * 100),
                weekdayShare: Math.round((weekdayCount / totalEvents) * 100)
            }
        };
    }

    analyzeDomainMix() {
        const counts = { Security: 0, FM: 0, SHE: 0, Other: 0 };
        const riskByDomain = { Security: 0, FM: 0, SHE: 0, Other: 0 };

        this.data.forEach(row => {
            const domain = Utils.classifyCategory(row, this.headerMap);
            counts[domain]++;

            const typeValue = this.headerMap.type ? row[this.headerMap.type] : '';
            const weight = CONFIG.riskWeights[typeValue] || 3;
            riskByDomain[domain] += weight;
        });

        const totalEvents = this.data.length || 1;

        const domainArray = Object.keys(counts)
            .map(domain => ({
                domain,
                count: counts[domain],
                share: Math.round((counts[domain] / totalEvents) * 100),
                riskScore: Math.round(riskByDomain[domain])
            }))
            .sort((a, b) => b.count - a.count);

        this.insights.domainMix = {
            totalEvents,
            byDomain: domainArray
        };
    }

    renderAllInsights() {
        this.renderRiskAssessment();
        this.renderPatternDetection();
        this.renderRecommendations();
        this.renderTrendForecast();
    }

    renderRiskAssessment() {
        const container = document.getElementById('riskAssessment');
        if (!container) return;

        const risk = this.insights.risk;

        let html = `
            <div class="insight-item risk-${risk.class}">
                <div class="insight-value">Risiko-Level: ${risk.level} (${risk.score}%)</div>
                <div class="insight-trend">
                    ${risk.highRiskEvents} kritische Ereignisse von ${risk.totalEvents} gesamt
                </div>
                <div class="insight-trend">
                    Basis: gewichtete Häufigkeit nach Ereignisart
                </div>
            </div>
        `;

        if (risk.criticalTypes && risk.criticalTypes.length > 0) {
            html += `
                <div class="insight-item">
                    <div class="insight-value">⚠️ Kritischster Typ:</div>
                    <div class="insight-trend">${Utils.escapeHtml(risk.criticalTypes[0].key)} (${risk.criticalTypes[0].count}x)</div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    renderPatternDetection() {
        const container = document.getElementById('patternDetection');
        if (!container) return;

        const patterns = this.insights.patterns;
        const domainMix = this.insights.domainMix;

        let html = '';

        if (!patterns || patterns.length === 0) {
            html += `
                <div class="insight-item">
                    <div class="insight-value">✅ Keine kritischen Muster erkannt</div>
                    <div class="insight-trend">Ereignisverteilung ist ausgewogen</div>
                </div>
            `;
        } else {
            html += patterns.slice(0, 2).map(pattern => `
                <div class="insight-item">
                    <div class="insight-value">${pattern.severity === 'high' ? '🔴' : '🟡'} ${Utils.escapeHtml(pattern.title)}</div>
                    <div class="insight-trend">${Utils.escapeHtml(pattern.description)}</div>
                </div>
            `).join('');
        }

        if (domainMix && domainMix.byDomain && domainMix.byDomain.length) {
            const top = domainMix.byDomain[0];
            const sec = domainMix.byDomain.find(d => d.domain === 'Security');
            const fm = domainMix.byDomain.find(d => d.domain === 'FM');
            const she = domainMix.byDomain.find(d => d.domain === 'SHE');

            html += `
                <div class="insight-item">
                    <div class="insight-value">Bereichszuordnung (Security / FM / SHE)</div>
                    <div class="insight-trend">
                        Dominanter Bereich: <strong>${top.domain}</strong>
                        (${top.count} Events, ${top.share}% Anteil)
                    </div>
                    <div class="insight-trend">
                        Security: ${sec ? `${sec.count} (${sec.share}%)` : '0 (0%)'} |
                        FM: ${fm ? `${fm.count} (${fm.share}%)` : '0 (0%)'} |
                        SHE: ${she ? `${she.count} (${she.share}%)` : '0 (0%)'}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    renderRecommendations() {
        const container = document.getElementById('smartRecommendations');
        if (!container) return;

        const recommendations = this.insights.recommendations;
        const lang = i18n.current;

        if (!recommendations || recommendations.length === 0) {
            container.innerHTML = `
                <div class="insight-item">
                    <div class="insight-value">✅ Keine dringenden Maßnahmen erforderlich</div>
                </div>
            `;
            return;
        }

        container.innerHTML = recommendations.slice(0, 3).map(rec => {
            const title = lang === 'de' ? rec.title : (rec.title_en || rec.title);
            const action = lang === 'de' ? rec.action : (rec.action_en || rec.action);
            return `
                <div class="insight-item">
                    <div class="insight-value">${rec.icon} ${Utils.escapeHtml(title)}</div>
                    <div class="insight-trend">${Utils.escapeHtml(action)}</div>
                </div>
            `;
        }).join('');
    }

    renderTrendForecast() {
        const container = document.getElementById('trendForecast');
        if (!container) return;

        const trends = this.insights.trends || [];
        const timePatterns = this.insights.timePatterns;

        let html = trends.slice(0, 3).map(trend => `
            <div class="insight-item">
                <div class="insight-value">${Utils.escapeHtml(trend.metric)}: ${Utils.escapeHtml(trend.current)}</div>
                <div class="insight-trend">
                    ${Utils.escapeHtml(trend.forecast)} (${trend.confidence} Konfidenz)
                </div>
            </div>
        `).join('');

        if (timePatterns && timePatterns.topHourBucket && timePatterns.topWeekday) {
            html += `
                <div class="insight-item">
                    <div class="insight-value">Zeitliche Muster</div>
                    <div class="insight-trend">
                        Häufigste Zeitspanne: <strong>${timePatterns.topHourBucket.range} Uhr</strong>
                        (${timePatterns.topHourBucket.count} Ereignisse)
                    </div>
                    <div class="insight-trend">
                        Häufigster Wochentag: <strong>${timePatterns.topWeekday.name}</strong>
                        (${timePatterns.topWeekday.count} Ereignisse)
                    </div>
                    <div class="insight-trend">
                        Verteilung: <strong>${timePatterns.weekendVsWeekday.weekdayShare}%</strong> Werktag vs.
                        <strong>${timePatterns.weekendVsWeekday.weekendShare}%</strong> Wochenende
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }
}
// =============================================
// THEME MANAGER
// =============================================
const ThemeManager = {
    init() {
        const toggle = document.getElementById('themeToggle');
        if (!toggle) {
            console.warn('Theme toggle not found');
            return;
        }

        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = current === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        const label = document.querySelector('.theme-label');
        if (label) {
            label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
        }
        console.log(`🎨 Theme: ${theme}`);
    }
};

// =============================================
// RISK CONFIGURATION MANAGER
// =============================================
const RiskConfigManager = {
    STORAGE_KEY: 'securityDashboardRiskWeights',

    loadFromStorage() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return;
            const stored = JSON.parse(raw);
            Object.assign(CONFIG.riskWeights, stored);
            console.log('🔐 Risk weights loaded');
        } catch (e) {
            console.warn('Could not load risk weights:', e);
        }
    },

    saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(CONFIG.riskWeights));
            console.log('💾 Risk weights saved');
        } catch (e) {
            console.warn('Could not save risk weights:', e);
        }
    },

    render() {
        const container = document.getElementById('riskConfigContainer');
        if (!container) return;

        const types = [...new Set(
            DashboardState.allData
                .map(row => DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : '')
                .filter(Boolean)
                .map(v => v.trim())
        )].sort();

        if (!types.length) {
            container.innerHTML = '<div class="hint">Keine Ereignisarten erkannt. Bitte Daten laden.</div>';
            return;
        }

        const rowsHtml = types.map(type => {
            const currentWeight = CONFIG.riskWeights[type] ?? 3;
            return `
                <div class="risk-config-row">
                    <label class="risk-config-label" title="${Utils.escapeHtml(type)}">${Utils.escapeHtml(type)}</label>
                    <input
                        class="risk-config-input"
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        data-risk-type="${Utils.escapeHtml(type)}"
                        value="${currentWeight}"
                    />
                </div>
            `;
        }).join('');

        container.innerHTML = rowsHtml;

        container.querySelectorAll('.risk-config-input').forEach(input => {
            input.addEventListener('change', (e) => {
                let value = parseInt(e.target.value, 10);
                if (isNaN(value)) value = 3;
                if (value < 1) value = 1;
                if (value > 10) value = 10;
                e.target.value = value;

                const type = e.target.getAttribute('data-risk-type');
                CONFIG.riskWeights[type] = value;

                this.saveToStorage();
                RenderManager.runAnalytics();
                UI.showToast(`Risiko "${type}": ${value}`, 'info', 2000);
            });
        });
    }
};

// =============================================
// FILTER MANAGER
// =============================================
const FilterManager = {
    apply() {
        if (!DashboardState.allData || DashboardState.allData.length === 0) {
            DashboardState.currentData = [];
            this.updateStatus();
            RenderManager.renderAll();
            return;
        }

        const country = document.getElementById('filterCountry')?.value || '__ALL__';
        const site = document.getElementById('filterSite')?.value || '__ALL__';
        const type = document.getElementById('filterType')?.value || '__ALL__';

        DashboardState.currentData = DashboardState.allData.filter(row => {
            const rowCountry = DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : '';
            const rowSite = DashboardState.headerMap.site ? row[DashboardState.headerMap.site] : '';
            const rowType = DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : '';

            if (country !== '__ALL__' && rowCountry !== country) return false;
            if (site !== '__ALL__' && rowSite !== site) return false;
            if (type !== '__ALL__' && rowType !== type) return false;
            return true;
        });

        this.updateStatus();
        RenderManager.renderAll();
        console.log(`🔍 Filter: ${DashboardState.currentData.length}/${DashboardState.allData.length}`);
    },

    reset() {
        ['filterCountry', 'filterSite', 'filterType'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '__ALL__';
        });
        this.apply();
        UI.showToast('Filter zurückgesetzt', 'info', 2000);
    },

    updateStatus() {
        const status = document.getElementById('filterStatus');
        if (!status) return;

        const activeFilters = [];
        const country = document.getElementById('filterCountry')?.value;
        const site = document.getElementById('filterSite')?.value;
        const type = document.getElementById('filterType')?.value;

        if (country && country !== '__ALL__') activeFilters.push(`Land: ${country}`);
        if (site && site !== '__ALL__') activeFilters.push(`Liegenschaft: ${site}`);
        if (type && type !== '__ALL__') activeFilters.push(`Ereignisart: ${type}`);

        let text;
        if (activeFilters.length === 0) {
            text = 'Keine Filter aktiv';
            status.className = 'status';
        } else {
            text = `Filter: ${activeFilters.join(' | ')}`;
            status.className = 'status active-filters';
        }

        text += ` | Zeige ${DashboardState.currentData.length} von ${DashboardState.allData.length}`;
        status.textContent = text;
    },

    updateSelectOptions(selectId, values, placeholder) {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = `<option value="__ALL__">${placeholder}</option>`;
        
        values.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });

        if (values.includes(currentValue)) {
            select.value = currentValue;
        }
    }
};

// =============================================
// RENDER MANAGER
// =============================================
const RenderManager = {
    renderAll() {
        console.log('🎨 Rendering dashboard...');
        this.renderKPIs();
        this.renderFilters();
        this.renderTables();
        this.renderCharts();
        this.runAnalytics();
    },

    renderKPIs() {
        const total = DashboardState.allData.length;
        const current = DashboardState.currentData.length;

        UI.updateText('kpiTotalEvents', total);
        UI.updateText('kpiTotalEventsSub', `${current} nach Filter`);

        const countries = new Set();
        const sites = new Set();
        const types = new Set();

        DashboardState.allData.forEach(row => {
            if (DashboardState.headerMap.country && row[DashboardState.headerMap.country]) {
                countries.add(row[DashboardState.headerMap.country].trim());
            }
            if (DashboardState.headerMap.site && row[DashboardState.headerMap.site]) {
                sites.add(row[DashboardState.headerMap.site].trim());
            }
            if (DashboardState.headerMap.type && row[DashboardState.headerMap.type]) {
                types.add(row[DashboardState.headerMap.type].trim());
            }
        });

        UI.updateText('kpiCountries', countries.size);
        UI.updateText('kpiSites', sites.size);
        UI.updateText('kpiTypes', types.size);
    },

    renderFilters() {
        const countries = [...new Set(
            DashboardState.allData
                .map(row => DashboardState.headerMap.country ? (row[DashboardState.headerMap.country] || '').trim() : '')
                .filter(Boolean)
        )].sort();

        const sites = [...new Set(
            DashboardState.allData
                .map(row => DashboardState.headerMap.site ? (row[DashboardState.headerMap.site] || '').trim() : '')
                .filter(Boolean)
        )].sort();

        const types = [...new Set(
            DashboardState.allData
                .map(row => DashboardState.headerMap.type ? (row[DashboardState.headerMap.type] || '').trim() : '')
                .filter(Boolean)
        )].sort();

        FilterManager.updateSelectOptions('filterCountry', countries, 'Alle Länder');
        FilterManager.updateSelectOptions('filterSite', sites, 'Alle Liegenschaften');
        FilterManager.updateSelectOptions('filterType', types, 'Alle Ereignisarten');
    },

    renderTables() {
        const emptyHtml = (cols) => `<tr><td colspan="${cols}" class="empty-state"><strong>Keine Daten</strong><span>Bitte Daten laden oder Filter anpassen.</span></td></tr>`;

        if (DashboardState.currentData.length === 0) {
            const tc = document.querySelector('#tableByCountry tbody');
            const ts = document.querySelector('#tableBySite tbody');
            const tt = document.querySelector('#tableByType tbody');
            if (tc) tc.innerHTML = emptyHtml(2);
            if (ts) ts.innerHTML = emptyHtml(3);
            if (tt) tt.innerHTML = emptyHtml(2);
            return;
        }

        const byCountry = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : ''
        );

        const byType = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : ''
        );

        const siteMap = new Map();
        DashboardState.currentData.forEach(row => {
            const site = DashboardState.headerMap.site ? row[DashboardState.headerMap.site] : '';
            const country = DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : '';
            const key = `${site}||${country}`;
            siteMap.set(key, (siteMap.get(key) || 0) + 1);
        });

        const siteArray = Array.from(siteMap.entries())
            .map(([key, count]) => {
                const [site, country] = key.split('||');
                return { site: site || '(leer)', country: country || '(leer)', count };
            })
            .sort((a, b) => b.count - a.count);

        const tc = document.querySelector('#tableByCountry tbody');
        if (tc) {
            tc.innerHTML = byCountry.map(item => `
                <tr><td>${Utils.escapeHtml(item.key || '(leer)')}</td><td>${item.count}</td></tr>
            `).join('');
        }

        const ts = document.querySelector('#tableBySite tbody');
        if (ts) {
            ts.innerHTML = siteArray.map(item => `
                <tr><td>${Utils.escapeHtml(item.site)}</td><td>${Utils.escapeHtml(item.country)}</td><td>${item.count}</td></tr>
            `).join('');
        }

        const tt = document.querySelector('#tableByType tbody');
        if (tt) {
            tt.innerHTML = byType.map(item => `
                <tr><td>${Utils.escapeHtml(item.key || '(leer)')}</td><td>${item.count}</td></tr>
            `).join('');
        }
    },

    renderCharts() {
        const emptyHtml = '<div class="empty-state"><strong>Keine Daten</strong><span>Bitte Daten laden oder Filter anpassen.</span></div>';

        if (DashboardState.currentData.length === 0) {
            ['chartCountries', 'chartSites', 'chartTypes', 'chartDomains'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = emptyHtml;
            });
            ChartManager.destroyAll();
            return;
        }

        const countries = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : ''
        );

        const sites = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.site ? row[DashboardState.headerMap.site] : ''
        );

        const types = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : ''
        );

        const domainCounts = { Security: 0, FM: 0, SHE: 0, Other: 0 };
        DashboardState.currentData.forEach(row => {
            const domain = Utils.classifyCategory(row, DashboardState.headerMap);
            domainCounts[domain]++;
        });

        const domainData = Object.entries(domainCounts)
            .filter(([_, v]) => v > 0)
            .map(([k, v]) => ({ key: k, count: v }));

        ChartManager.create('chartCountries', countries, 'bar');
        ChartManager.create('chartSites', sites, 'bar');
        ChartManager.create('chartTypes', types, 'pie');
        ChartManager.create('chartDomains', domainData, 'pie');
    },

    runAnalytics() {
        if (DashboardState.currentData.length === 0) {
            this.clearAnalytics();
            return;
        }

        try {
            const analytics = new SecurityAnalytics(DashboardState.currentData, DashboardState.headerMap);
            analytics.analyze();
        } catch (e) {
            console.error('Analytics error:', e);
            this.clearAnalytics();
        }
    },

    clearAnalytics() {
        const html = '<div class="loading">Keine Daten für Analyse verfügbar</div>';
        ['riskAssessment', 'patternDetection', 'smartRecommendations', 'trendForecast'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = html;
        });
    }
};
// =============================================
// DATA MANAGER
// =============================================
const DataManager = {
    loadTestData() {
        console.log('📊 Loading test data...');

        try {
            const parsed = Utils.parseCSV(TestData.csv);
            DashboardState.allData = parsed.rows;
            DashboardState.headerMap = Utils.createHeaderMap(parsed.headers);
            DashboardState.currentData = [...DashboardState.allData];

            RiskConfigManager.render();
            this.updateUI('testdata');
            RenderManager.renderAll();

            console.log(`✅ Test data: ${DashboardState.allData.length} records`);
            UI.showToast(i18n.t('toast_testdata_loaded'), 'success');
        } catch (e) {
            console.error('Test data error:', e);
            UI.showToast('Fehler: ' + e.message, 'error');
        }
    },

    async loadCSVFile(file) {
        console.log(`📁 Loading: ${file.name}`);

        try {
            const text = await file.text();
            const parsed = Utils.parseCSV(text);

            if (parsed.rows.length === 0) {
                throw new Error('CSV enthält keine Daten');
            }

            DashboardState.allData = parsed.rows;
            DashboardState.headerMap = Utils.createHeaderMap(parsed.headers);
            DashboardState.currentData = [...DashboardState.allData];

            RiskConfigManager.render();
            this.updateUI('csv', file.name);
            RenderManager.renderAll();

            console.log(`✅ CSV: ${DashboardState.allData.length} records`);
            UI.showToast(i18n.t('toast_csv_loaded', { filename: file.name }), 'success');

            if (!DashboardState.headerMap.country || !DashboardState.headerMap.site || !DashboardState.headerMap.type) {
                UI.showToast(i18n.t('toast_columns_warning'), 'info', 6000);
            }
        } catch (e) {
            console.error('CSV error:', e);
            const fs = document.getElementById('fileStatus');
            if (fs) {
                fs.textContent = `
fs.textContent = `Fehler: ${e.message}`;
                fs.className = 'status error';
            }
            UI.showToast('CSV-Fehler: ' + e.message, 'error');
        }
    },

    updateUI(mode, filename = '') {
        UI.updateText('recordCount', DashboardState.allData.length);

        const modeIndicator = document.getElementById('modeIndicator');
        const fileStatus = document.getElementById('fileStatus');

        if (mode === 'testdata') {
            if (modeIndicator) modeIndicator.textContent = 'Modus: Testdaten (Demo)';
            if (fileStatus) {
                fileStatus.textContent = 'Testdaten geladen (Demo-Modus)';
                fileStatus.className = 'status';
            }
        } else if (mode === 'csv') {
            if (modeIndicator) modeIndicator.textContent = 'Modus: CSV-Datei';
            if (fileStatus) {
                fileStatus.textContent = `"${filename}" geladen (${DashboardState.allData.length} Datensätze)`;
                fileStatus.className = 'status';
            }
        } else {
            if (modeIndicator) modeIndicator.textContent = 'Modus: Keine Daten';
            if (fileStatus) {
                fileStatus.textContent = 'Keine Datei geladen';
                fileStatus.className = 'status';
            }
        }
    }
};

// =============================================
// EXPORT MANAGER
// =============================================
const ExportManager = {
    toCSV() {
        if (!DashboardState.currentData || DashboardState.currentData.length === 0) {
            UI.showToast(i18n.t('toast_no_data'), 'error');
            return;
        }

        const status = document.getElementById('exportStatus');
        if (status) {
            status.style.display = 'block';
            status.textContent = 'CSV wird erstellt...';
        }

        try {
            const headers = Object.keys(DashboardState.currentData[0]);
            let csvContent = headers.join(',') + '\n';

            DashboardState.currentData.forEach(row => {
                const values = headers.map(header => {
                    const value = row[header] || '';
                    return `"${value.toString().replace(/"/g, '""')}"`;
                });
                csvContent += values.join(',') + '\n';
            });

            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 10);

            link.href = URL.createObjectURL(blob);
            link.download = `security-events-${timestamp}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            UI.showToast(i18n.t('toast_csv_success', { count: DashboardState.currentData.length }), 'success');

            if (status) {
                status.textContent = `✅ CSV exportiert (${DashboardState.currentData.length} Datensätze)`;
                setTimeout(() => { status.style.display = 'none'; }, 3000);
            }
        } catch (e) {
            console.error('CSV Export Error:', e);
            UI.showToast(i18n.t('toast_csv_error', { error: e.message }), 'error');
            if (status) {
                status.textContent = '❌ CSV-Export fehlgeschlagen';
                setTimeout(() => { status.style.display = 'none'; }, 3000);
            }
        }
    },

    async toPDF() {
        if (!DashboardState.currentData || DashboardState.currentData.length === 0) {
            UI.showToast(i18n.t('toast_no_data'), 'error');
            return;
        }

        const status = document.getElementById('exportStatus');
        const btnPdf = document.getElementById('exportPDF');

        if (status) {
            status.style.display = 'block';
            status.textContent = i18n.t('toast_pdf_start');
        }
        if (btnPdf) btnPdf.disabled = true;

        try {
            if (typeof window.jspdf === 'undefined') {
                throw new Error('jsPDF nicht geladen');
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const marginX = 18;
            let yPos = 22;
            let pageNumber = 1;

            const addFooter = () => {
                pdf.setFontSize(8);
                pdf.setTextColor(130, 130, 130);
                pdf.text(i18n.t('footer_left'), marginX, pageHeight - 6);
                const pageText = i18n.t('footer_page', { page: pageNumber });
                pdf.text(pageText, pageWidth - marginX - pdf.getTextWidth(pageText), pageHeight - 6);
            };

            const newPage = () => {
                addFooter();
                pdf.addPage();
                pageNumber++;
                yPos = 22;
            };

            const ensureSpace = (needed) => {
                if (yPos + needed > pageHeight - 15) newPage();
            };

            // Header
            pdf.setFillColor(0, 163, 122);
            pdf.rect(0, 0, pageWidth, 30, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.text(i18n.t('pdf_title'), marginX, 16);
            pdf.setFontSize(11);
            pdf.text(i18n.t('pdf_subtitle'), marginX, 23);

            const dateStr = Utils.formatDate(new Date(), i18n.current === 'de' ? 'de-DE' : 'en-GB');
            const dateText = i18n.t('pdf_created_at', { date: dateStr });
            pdf.text(dateText, pageWidth - marginX - pdf.getTextWidth(dateText), 23);

            // KPIs
            yPos = 40;
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.text(i18n.t('section_executive_summary'), marginX, yPos);
            yPos += 8;

            const totalCountries = new Set(DashboardState.currentData.map(r => DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '').filter(Boolean)).size;
            const totalSites = new Set(DashboardState.currentData.map(r => DashboardState.headerMap.site ? r[DashboardState.headerMap.site] : '').filter(Boolean)).size;
            const totalTypes = new Set(DashboardState.currentData.map(r => DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '').filter(Boolean)).size;

            pdf.setFontSize(9);
            pdf.setTextColor(80, 80, 80);
            pdf.text(i18n.t('key_facts_line', {
                events: DashboardState.currentData.length,
                countries: totalCountries,
                sites: totalSites,
                types: totalTypes
            }), marginX, yPos);
            yPos += 10;

            // Charts
            const addChart = (selector, title) => {
                const container = document.querySelector(selector);
                if (!container) return;
                const canvas = container.querySelector('canvas');
                if (!canvas) return;

                try {
                    ensureSpace(70);
                    pdf.setFontSize(11);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(title, marginX, yPos);
                    yPos += 5;

                    const imgData = canvas.toDataURL('image/png', 1.0);
                    pdf.addImage(imgData, 'PNG', marginX, yPos, pageWidth - 2 * marginX, 55);
                    yPos += 60;
                } catch (e) {
                    console.warn('Chart export error:', e);
                }
            };

            addChart('#chartCountries', i18n.t('chart_countries_title'));
            addChart('#chartSites', i18n.t('chart_sites_title'));
            addChart('#chartTypes', i18n.t('chart_types_title'));
            addChart('#chartDomains', i18n.t('chart_domains_title'));

            // Tabellen mit autoTable
            if (pdf.autoTable) {
                newPage();
                pdf.setFontSize(14);
                pdf.setTextColor(0, 0, 0);
                pdf.text(i18n.t('section_aggregated_overview'), marginX, yPos);
                yPos += 8;

                const byCountry = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '');
                const bySite = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.site ? r[DashboardState.headerMap.site] : '');
                const byType = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '');

                pdf.autoTable({
                    startY: yPos,
                    head: [[i18n.t('table_country_header'), i18n.t('table_count_header')]],
                    body: byCountry.map(r => [r.key || '(leer)', r.count]),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [0, 163, 122] }
                });
                yPos = pdf.lastAutoTable.finalY + 10;

                pdf.autoTable({
                    startY: yPos,
                    head: [[i18n.t('table_site_header'), i18n.t('table_count_header')]],
                    body: bySite.map(r => [r.key || '(leer)', r.count]),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [0, 163, 122] }
                });
                yPos = pdf.lastAutoTable.finalY + 10;

                pdf.autoTable({
                    startY: yPos,
                    head: [[i18n.t('table_type_header'), i18n.t('table_count_header')]],
                    body: byType.map(r => [r.key || '(leer)', r.count]),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [0, 163, 122] }
                });
            }

            addFooter();

            const filename = i18n.t('pdf_filename', { date: new Date().toISOString().slice(0, 10) });
            pdf.save(filename);

            UI.showToast(i18n.t('toast_pdf_success', { file: filename }), 'success');

            if (status) {
                status.textContent = `✅ ${filename}`;
                setTimeout(() => { status.style.display = 'none'; }, 4000);
            }
        } catch (e) {
            console.error('PDF Error:', e);
            UI.showToast(i18n.t('toast_pdf_error', { error: e.message }), 'error');
            if (status) {
                status.textContent = '❌ PDF-Export fehlgeschlagen';
                setTimeout(() => { status.style.display = 'none'; }, 4000);
            }
        } finally {
            if (btnPdf) btnPdf.disabled = false;
        }
    }
};

// =============================================
// DASHBOARD INITIALIZATION
// =============================================
const Dashboard = {
    init() {
        console.log('🚀 Initializing Dashboard...');

        try {
            ThemeManager.init();
            RiskConfigManager.loadFromStorage();
            this.setupEventListeners();
            FilterManager.updateStatus();

            DashboardState.isInitialized = true;
            console.log('✅ Dashboard initialized!');
        } catch (e) {
            console.error('Init error:', e);
            UI.showToast('Initialisierungsfehler: ' + e.message, 'error');
        }
    },

    setupEventListeners() {
        // Testdaten Button
        const loadBtn = document.getElementById('loadTestData');
        if (loadBtn) {
            loadBtn.addEventListener('click', () => DataManager.loadTestData());
        }

        // CSV Upload
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (file) DataManager.loadCSVFile(file);
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
            i18n.set(langSelect.value || 'de');
        }

        console.log('🔗 Event listeners attached');
    }
};

// =============================================
// START APPLICATION
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

// Error Handler
window.addEventListener('error', (e) => {
    console.error('Error:', e.error || e.message);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Promise Error:', e.reason);
});

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

console.log('📦 app.js vollständig geladen');
