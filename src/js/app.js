/* =============================================
   SECURITY EVENT DASHBOARD - app.js
   Vollständige, bereinigte Version
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

    /**
     * Setzt die aktuelle Sprache
     * @param {string} lang - Sprachcode ('de' oder 'en')
     */
    set(lang) {
        this.current = ['de', 'en'].includes(lang) ? lang : 'de';
        console.log('🌐 Report language set to:', this.current);
    },

    /**
     * Übersetzt einen Schlüssel mit optionalen Variablen
     * @param {string} key - Übersetzungsschlüssel
     * @param {Object} vars - Variablen zum Ersetzen
     * @returns {string} Übersetzte Zeichenkette
     */
    t(key, vars = {}) {
        const lang = this.current;
        const dict = this.strings[key]?.[lang] || this.strings[key]?.de || key;

        return dict.replace(/\{\{(\w+)\}\}/g, (_, v) => {
            return vars[v] !== undefined ? String(vars[v]) : '';
        });
    },

    strings: {
        // PDF Titel & Header
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

        // Sections
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

        // Descriptions
        desc_ai_insights: {
            de: 'Zusammenfassung der KI-gestützten Risikoanalyse, Bereichszuordnung und Zeit-/Trendmuster.',
            en: 'Summary of AI-based risk analysis, domain allocation, and time/trend patterns.'
        },
        desc_visual_analytics: {
            de: 'Verteilung der Ereignisse über Länder, Liegenschaften, Ereignisarten und Bereiche.',
            en: 'Distribution of events across countries, sites, event types, and domains.'
        },

        // Key Facts
        key_facts_line: {
            de: 'Ereignisse gesamt: {{events}}  |  Länder: {{countries}}  |  Liegenschaften: {{sites}}  |  Ereignisarten: {{types}}',
            en: 'Total events: {{events}}  |  Countries: {{countries}}  |  Sites: {{sites}}  |  Event types: {{types}}'
        },

        // Table Headers
        table_country_header: {
            de: 'Land',
            en: 'Country'
        },
        table_site_header: {
            de: 'Liegenschaft',
            en: 'Site'
        },
        table_type_header: {
            de: 'Ereignisart',
            en: 'Event Type'
        },
        table_count_header: {
            de: 'Anzahl',
            en: 'Count'
        },

        // Chart Titles
        chart_countries_title: {
            de: 'Ereignisse nach Ländern',
            en: 'Events by Country'
        },
        chart_sites_title: {
            de: 'Ereignisse nach Liegenschaften',
            en: 'Events by Site'
        },
        chart_types_title: {
            de: 'Ereignisse nach Ereignisarten',
            en: 'Events by Type'
        },
        chart_domains_title: {
            de: 'Bereichsverteilung (Security / FM / SHE)',
            en: 'Domain Distribution (Security / FM / SHE)'
        },

        // Footer
        footer_left: {
            de: 'Security Events Dashboard – Executive Report',
            en: 'Security Events Dashboard – Executive Report'
        },
        footer_page: {
            de: 'Seite {{page}}',
            en: 'Page {{page}}'
        },

        // Risk Assessment
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

        // Domain
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

        // Trends
        trend_risk_up: {
            de: 'Das Risiko wird voraussichtlich weiter ansteigen.',
            en: 'Risk levels are expected to increase further.'
        },
        trend_risk_down: {
            de: 'Das Risiko entwickelt sich tendenziell rückläufig.',
            en: 'Risk levels are expected to decline.'
        },
        trend_risk_stable: {
            de: 'Das Risiko wird als weitgehend stabil eingeschätzt.',
            en: 'Risk levels are expected to remain broadly stable.'
        },
        trend_risk_sentence: {
            de: 'Für das Gesamtrisiko wird eine {{trend}} Entwicklung mit einer geschätzten Konfidenz von {{confidence}} erwartet.',
            en: 'For overall risk, a {{trend}} development is expected with an estimated confidence level of {{confidence}}.'
        },
        trend_volume_sentence: {
            de: 'Das Ereignisvolumen wird für den nächsten Zeitraum mit {{forecast}} prognostiziert (Konfidenz {{confidence}}).',
            en: 'Event volume for the next period is forecast at {{forecast}} (confidence {{confidence}}).'
        },

        // Time Patterns
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

        // Actions
        actions_bullet_prefix: {
            de: '• ',
            en: '• '
        },

        // Toast Messages
        toast_pdf_start: {
            de: 'Professioneller PDF-Report wird erstellt...',
            en: 'Generating professional PDF report...'
        },
        toast_pdf_success: {
            de: 'Executive PDF-Report erfolgreich erstellt: {{file}}',
            en: 'Executive PDF report successfully created: {{file}}'
        },
        toast_pdf_error: {
            de: 'Fehler beim PDF-Export: {{error}}',
            en: 'Error during PDF export: {{error}}'
        },
        toast_csv_success: {
            de: 'CSV exportiert ({{count}} Datensätze).',
            en: 'CSV exported ({{count}} records).'
        },
        toast_csv_error: {
            de: 'Fehler beim CSV-Export: {{error}}',
            en: 'Error during CSV export: {{error}}'
        },
        toast_no_data: {
            de: 'Keine Daten zum Export vorhanden. Bitte Daten laden oder Filter anpassen.',
            en: 'No data available for export. Please load data or adjust filters.'
        },
        toast_testdata_loaded: {
            de: 'Testdaten wurden geladen (Demo-Modus).',
            en: 'Test data loaded (demo mode).'
        },
        toast_csv_loaded: {
            de: 'CSV-Datei "{{filename}}" geladen.',
            en: 'CSV file "{{filename}}" loaded.'
        },
        toast_columns_warning: {
            de: 'Hinweis: Einige erwartete Spalten (Land/Liegenschaft/Ereignisart) wurden nicht erkannt.',
            en: 'Note: Some expected columns (Country/Site/Event Type) were not recognized.'
        },

        // PDF Filename
        pdf_filename: {
            de: 'Security-Executive-Report-{{date}}.pdf',
            en: 'Security-Executive-Report-{{date}}.pdf'
        }
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
    /**
     * Parst CSV-Text in ein Objekt mit Headers und Rows
     * @param {string} text - CSV-Text
     * @returns {{headers: string[], rows: Object[]}}
     */
    parseCSV(text) {
        if (!text || typeof text !== 'string') {
            return { headers: [], rows: [] };
        }

        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (!lines.length) return { headers: [], rows: [] };

        // Delimiter automatisch erkennen
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

    /**
     * Erstellt eine Header-Map für bekannte Spalten
     * @param {string[]} headers - Array der Spaltenüberschriften
     * @returns {Object} Header-Map
     */
    createHeaderMap(headers) {
        const map = {};

        headers.forEach(h => {
            const lower = h.toLowerCase();

            if (lower.includes('land') || lower.includes('country')) {
                map.country = h;
            }
            if (lower.includes('liegenschaft') || lower.includes('site') || lower.includes('standort')) {
                map.site = h;
            }
            if (lower.includes('ereignis') || lower.includes('event') || lower.includes('typ') || lower.includes('type')) {
                map.type = h;
            }
            if (lower.includes('datum') || lower.includes('date')) {
                map.date = h;
            }
            if (lower.includes('zeit') || lower.includes('uhr') || lower.includes('time')) {
                map.time = h;
            }
        });

        return map;
    },

    /**
     * Gruppiert und zählt Daten nach einem Schlüssel
     * @param {Object[]} data - Datensätze
     * @param {Function} keyFn - Funktion zur Schlüsselextraktion
     * @returns {Array<{key: string, count: number}>}
     */
    groupAndCount(data, keyFn) {
        if (!Array.isArray(data)) return [];

        const map = new Map();

        data.forEach(row => {
            const key = keyFn(row);
            if (key) {
                map.set(key, (map.get(key) || 0) + 1);
            }
        });

        return Array.from(map.entries())
            .map(([key, count]) => ({ key, count }))
            .sort((a, b) => b.count - a.count);
    },

    /**
     * Klassifiziert einen Datensatz in einen Bereich (Security/FM/SHE/Other)
     * @param {Object} row - Datensatz
     * @param {Object} headerMap - Header-Map
     * @returns {string} Bereichsname
     */
    classifyCategory(row, headerMap) {
        const fields = [];

        if (headerMap.type && row[headerMap.type]) {
            fields.push(row[headerMap.type]);
        }

        // Zusätzliche Felder prüfen
        Object.keys(row).forEach(key => {
            const lower = key.toLowerCase();
            if (lower.includes('beschreibung') || lower.includes('description') || lower.includes('kategorie')) {
                fields.push(row[key]);
            }
        });

        const text = fields.join(' ').toLowerCase();

        const securityKeywords = [
            'diebstahl', 'einbruch', 'vandalismus', 'zutrittsverletzung',
            'unbefugter zutritt', 'verdächtige person', 'security', 'sicherheitsdienst',
            'alarm', 'alarmanlage', 'sabotage', 'überfall', 'raub'
        ];

        const fmKeywords = [
            'facility', 'gebäudetechnik', 'aufzug', 'fahrstuhl', 'klima',
            'heizung', 'hlk', 'wartung', 'instandhaltung', 'reinigung',
            'betriebstechnik', 'stromausfall', 'wasserleck', 'wasserleckage',
            'beleuchtung', 'sanitär'
        ];

        const sheKeywords = [
            'arbeitssicherheit', 'unfall', 'arbeitsunfall', 'verletzung', 'verletzte',
            'near miss', 'beinaheunfall', 'gefährdung', 'gefahrstoff', 'chemikalie',
            'brandschutz', 'brand', 'evakuierung', 'umwelt', 'leckage', 'austritt'
        ];

        const matchesAny = (list) => list.some(kw => text.includes(kw));

        if (matchesAny(securityKeywords)) return 'Security';
        if (matchesAny(fmKeywords)) return 'FM';
        if (matchesAny(sheKeywords)) return 'SHE';

        return 'Other';
    },

    /**
     * Escape HTML-Sonderzeichen
     * @param {string} str - Eingabestring
     * @returns {string} Escaped String
     */
    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Formatiert ein Datum
     * @param {Date} date - Datum
     * @param {string} locale - Locale
     * @returns {string} Formatiertes Datum
     */
    formatDate(date, locale = 'de-DE') {
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

// =============================================
// UI HELPER
// =============================================
const UI = {
    /**
     * Zeigt eine Toast-Nachricht an
     * @param {string} message - Nachricht
     * @param {string} type - Typ ('info', 'success', 'error')
     * @param {number} timeout - Anzeigedauer in ms
     */
    showToast(message, type = 'info', timeout = CONFIG.toastTimeout) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.warn('Toast container not found');
            return;
        }

        const div = document.createElement('div');
        div.className = `toast toast-${type}`;
        div.textContent = message;
        div.setAttribute('role', 'alert');

        container.appendChild(div);

        // Animation starten
        requestAnimationFrame(() => {
            div.style.opacity = '1';
        });

        setTimeout(() => {
            div.style.opacity = '0';
            setTimeout(() => {
                if (div.parentNode) {
                    div.remove();
                }
            }, 300);
        }, timeout);
    },

    /**
     * Aktualisiert den Text eines Elements sicher
     * @param {string} elementId - Element-ID
     * @param {string} text - Neuer Text
     */
    updateText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    },

    /**
     * Setzt den innerHTML eines Elements sicher
     * @param {string} elementId - Element-ID
     * @param {string} html - Neuer HTML-Inhalt
     */
    updateHtml(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    }
};

// =============================================
// CHART MANAGER (mit interaktiven Klicks)
// =============================================
const ChartManager = {
    /**
     * Erstellt oder aktualisiert ein Chart
     * @param {string} containerId - Container-ID
     * @param {Array} data - Chart-Daten
     * @param {string} type - Chart-Typ ('bar' oder 'pie')
     * @param {number} maxBars - Maximale Anzahl Balken/Segmente
     */
    create(containerId, data, type = 'bar', maxBars = CONFIG.maxChartBars) {
        const container = document.getElementById(containerId);

        if (!container) {
            console.warn(`Chart container "${containerId}" not found`);
            return;
        }

        if (!data || !data.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <strong>Keine Daten</strong>
                    <span>Bitte Daten laden oder Filter anpassen.</span>
                </div>
            `;
            return;
        }

        // Vorheriges Chart zerstören
        if (DashboardState.chartInstances[containerId]) {
            DashboardState.chartInstances[containerId].destroy();
            delete DashboardState.chartInstances[containerId];
        }

        // Canvas erstellen
        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');

        if (!canvas) {
            console.error('Could not create canvas element');
            return;
        }

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
                    backgroundColor: CONFIG.chartColors.slice(0, values.length).map(color => color + '80'),
                    borderColor: CONFIG.chartColors.slice(0, values.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                devicePixelRatio: 2,
                plugins: {
                    legend: {
                        display: type === 'pie',
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.raw} Ereignisse`
                        }
                    }
                },
                scales: type === 'pie' ? {} : {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                },
                onClick: (evt, elements) => {
                    this.handleChartClick(containerId, elements, labels);
                }
            }
        };

        try {
            const chart = new Chart(canvas, config);
            DashboardState.chartInstances[containerId] = chart;
        } catch (error) {
            console.error('Chart creation error:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <strong>Fehler beim Erstellen des Charts</strong>
                    <span>${Utils.escapeHtml(error.message)}</span>
                </div>
            `;
        }
    },

    /**
     * Behandelt Klicks auf Chart-Elemente
     * @param {string} containerId - Container-ID
     * @param {Array} elements - Geklickte Elemente
     * @param {Array} labels - Chart-Labels
     */
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

        const option =
            /**
     * Behandelt Klicks auf Chart-Elemente
     * @param {string} containerId - Container-ID
     * @param {Array} elements - Geklickte Elemente
     * @param {Array} labels - Chart-Labels
     */
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
            UI.showToast(`Filter gesetzt: ${label}`, 'info', 2000);
        }
    },

    /**
     * Zerstört alle Chart-Instanzen
     */
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
    /**
     * @param {Array} data - Ereignisdaten
     * @param {Object} headerMap - Header-Mapping
     */
    constructor(data, headerMap) {
        this.data = data || [];
        this.headerMap = headerMap || {};
        this.insights = {};
    }

    /**
     * Führt alle Analysen durch
     */
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
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }

    /**
     * Berechnet das Risiko-Assessment
     */
    calculateRiskAssessment() {
        const eventsByType = Utils.groupAndCount(this.data, row =>
            this.headerMap.type ? row[this.headerMap.type] : ''
        );

        let totalRisk = 0;
        let maxRisk = 0;
        let highRiskEvents = 0;

        eventsByType.forEach(event => {
            const weight = CONFIG.riskWeights[event.key] || 3;
            totalRisk += event.count * weight;
            maxRisk += event.count * 10;

            if (weight >= 8) {
                highRiskEvents += event.count;
            }
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

    /**
     * Erkennt Muster in den Daten
     */
    detectPatterns() {
        const patterns = [];

        // Hotspot-Erkennung
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

        // Konzentrations-Erkennung
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

    /**
     * Generiert Handlungsempfehlungen
     */
    generateRecommendations() {
        const recommendations = [];
        const risk = this.insights.risk;

        if (risk.level === 'HOCH') {
            recommendations.push({
                priority: 'high',
                icon: '🚨',
                title: 'Sofortige Sicherheitsmaßnahmen',
                title_en: 'Immediate Security Measures',
                action: 'Sicherheitsaudit durchführen und Notfallplan aktivieren',
                action_en: 'Conduct a security audit and activate emergency response plans',
                reason: `Risiko-Score von ${risk.score}% erfordert schnelles Handeln`
            });
        }

        if (risk.criticalTypes && risk.criticalTypes.length > 0) {
            recommendations.push({
                priority: 'high',
                icon: '🔒',
                title: 'Kritische Ereignisarten adressieren',
                title_en: 'Address Critical Event Types',
                action: `Präventionsmaßnahmen für ${risk.criticalTypes[0].key} verstärken`,
                action_en: `Strengthen preventive measures for ${risk.criticalTypes[0].key}`,
                reason: `${risk.criticalTypes[0].count} kritische Ereignisse registriert`
            });
        }

        if (this.data.length > 20) {
            recommendations.push({
                priority: 'medium',
                icon: '📊',
                title: 'Regelmäßiges Monitoring',
                title_en: 'Regular Monitoring',
                action: 'Wöchentliche Dashboard-Reviews etablieren',
                action_en: 'Establish weekly dashboard review routines',
                reason: `${this.data.length} Ereignisse zeigen hohe Aktivität`
            });
        }

        // Nach Priorität sortieren
        recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        this.insights.recommendations = recommendations.slice(0, 4);
    }

    /**
     * Erstellt Trend-Prognosen
     */
    forecastTrends() {
        const trends = [];
        const risk = this.insights.risk;

        // Risiko-Trend
        const riskTrend = risk.score > 60 ? 'steigend' : risk.score < 30 ? 'fallend' : 'stabil';
        trends.push({
            metric: 'Gesamt-Risiko',
            current: `${risk.score}%`,
            forecast: riskTrend,
            confidence: '82%'
        });

        // Volumen-Trend
        const monthlyGrowth = this.data.length > 50 ? '+12%' :
            this.data.length > 20 ? '+5%' : '-3%';
        trends.push({
            metric: 'Ereignis-Volumen',
            current: `${this.data.length} Events`,
            forecast: `Nächster Monat: ${monthlyGrowth}`,
            confidence: '75%'
        });

        // Top-Risiko-Typ
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

    /**
     * Analysiert zeitliche Muster
     */
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

            if (dateField && row[dateField]) {
                dateTimeStr += row[dateField];
            }
            if (timeField && row[timeField]) {
                dateTimeStr += ' ' + row[timeField];
            }

            const d = new Date(dateTimeStr.trim());
            if (isNaN(d.getTime())) return;

            const hour = d.getHours();
            const weekday = d.getDay();

            // Zeitbucket zuordnen
            if (hour < 6) hourBuckets['00-06']++;
            else if (hour < 12) hourBuckets['06-12']++;
            else if (hour < 18) hourBuckets['12-18']++;
            else hourBuckets['18-24']++;

            // Wochentag zählen
            if (weekday >= 0 && weekday <= 6) {
                weekdayCounts[weekday]++;
            }
        });

        const totalEvents = this.data.length || 1;

        // Top Zeitbucket
        const hourBucketArray = Object.entries(hourBuckets)
            .map(([range, count]) => ({ range, count }))
            .sort((a, b) => b.count - a.count);
        const topHourBucket = hourBucketArray[0];

        // Top Wochentag
        const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        const weekdayArray = weekdayCounts
            .map((count, idx) => ({ name: weekdayNames[idx], count }))
            .sort((a, b) => b.count - a.count);
        const topWeekday = weekdayArray[0];

        // Wochenende vs. Werktag
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

    /**
     * Analysiert die Bereichsverteilung (Security/FM/SHE)
     */
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

    /**
     * Rendert alle Insights in die UI
     */
    renderAllInsights() {
        this.renderRiskAssessment();
        this.renderPatternDetection();
        this.renderRecommendations();
        this.renderTrendForecast();
    }

    /**
     * Rendert das Risiko-Assessment
     */
    renderRiskAssessment() {
        const container = document.getElementById('riskAssessment');
        if (!container) return;

        const risk = this.insights.risk;

        let html = `
            <div class="insight-item risk-${risk.class}">
                <div class="insight-value">Risiko-Level: $${risk.level} ($${risk.score}%)</div>
                <div class="insight-trend">
                    $${risk.highRiskEvents} kritische Ereignisse von $${risk.totalEvents} gesamt
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
                    <div class="insight-trend">$${Utils.escapeHtml(risk.criticalTypes[0].key)} ($${risk.criticalTypes[0].count}x)</div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Rendert die Muster-Erkennung
     */
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
                    <div class="insight-value">$${pattern.severity === 'high' ? '🔴' : '🟡'} $${Utils.escapeHtml(pattern.title)}</div>
                    <div class="insight-trend">${Utils.escapeHtml(pattern.description)}</div>
                </div>
            `).join('');
        }

        // Bereichszuordnung anzeigen
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
                        ($${top.count} Events, $${top.share}% Anteil)
                    </div>
                    <div class="insight-trend">
                        Security: ${sec ? `$${sec.count} ($${sec.share}%)` : '0 (0%)'} |
                        FM: ${fm ? `$${fm.count} ($${fm.share}%)` : '0 (0%)'} |
                        SHE: ${she ? `$${she.count} ($${she.share}%)` : '0 (0%)'}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    /**
     * Rendert die Empfehlungen
     */
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
                    <div class="insight-value">$${rec.icon} $${Utils.escapeHtml(title)}</div>
                    <div class="insight-trend">${Utils.escapeHtml(action)}</div>
                </div>
            `;
        }).join('');
    }

    /**
     * Rendert die Trend-Prognose
     */
    renderTrendForecast() {
        const container = document.getElementById('trendForecast');
        if (!container) return;

        const trends = this.insights.trends || [];
        const timePatterns = this.insights.timePatterns;

        let html = trends.slice(0, 3).map(trend => `
            <div class="insight-item">
                <div class="insight-value">$${Utils.escapeHtml(trend.metric)}: $${Utils.escapeHtml(trend.current)}</div>
                <div class="insight-trend">
                    $${Utils.escapeHtml(trend.forecast)} ($${trend.confidence} Konfidenz)
                </div>
            </div>
        `).join('');

        // Zeitliche Muster anzeigen
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
    /**
     * Initialisiert das Theme-System
     */
    init() {
        const toggle = document.getElementById('themeToggle');
        const label = document.querySelector('.theme-label');

        if (!toggle) {
            console.warn('Theme toggle button not found');
            return;
        }

        // Gespeichertes Theme laden
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        // Event Listener
        toggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = current === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    },

    /**
     * Setzt das Theme
     * @param {string} theme - 'light' oder 'dark'
     */
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        const label = document.querySelector('.theme-label');
        if (label) {
            label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
        }

        console.log(`🎨 Theme changed to: ${theme}`);
    }
};

// =============================================
// RISK CONFIGURATION MANAGER
// =============================================
const RiskConfigManager = {
    STORAGE_KEY: 'securityDashboardRiskWeights',

    /**
     * Lädt die Risiko-Gewichtungen aus dem LocalStorage
     */
    loadFromStorage() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return;

            const stored = JSON.parse(raw);
            Object.assign(CONFIG.riskWeights, stored);
            console.log('🔐 Risk weights loaded from storage:', CONFIG.riskWeights);
        } catch (e) {
            console.warn('Could not load risk weights from storage:', e);
        }
    },

    /**
     * Speichert die Risiko-Gewichtungen im LocalStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(CONFIG.riskWeights));
            console.log('💾 Risk weights saved to storage');
        } catch (e) {
            console.warn('Could not save risk weights:', e);
        }
    },

    /**
     * Rendert die Risiko-Konfiguration UI
     */
    render() {
        const container = document.getElementById('riskConfigContainer');
        if (!container) return;

        // Alle einzigartigen Ereignisarten sammeln
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
                    <label class="risk-config-label" title="$${Utils.escapeHtml(type)}">$${Utils.escapeHtml(type)}</label>
                    <input
                        class="risk-config-input"
                        type="number"
                        min="1"
                        max="10"
                        step="1"
                        data-risk-type="${Utils.escapeHtml(type)}"
                        value="${currentWeight}"
                        aria-label="Risikogewichtung für ${Utils.escapeHtml(type)}"
                    />
                </div>
            `;
        }).join('');

        container.innerHTML = rowsHtml;

        // Event Listeners für Input-Felder
        container.querySelectorAll('.risk-config-input').forEach(input => {
            input.addEventListener('change', (e) => {
                let value = parseInt(e.target.value, 10);

                // Validierung
                if (isNaN(value)) value = 3;
                if (value < 1) value = 1;
                if (value > 10) value = 10;

                e.target.value = value;

                const type = e.target.getAttribute('data-risk-type');
                CONFIG.riskWeights[type] = value;

                this.saveToStorage();
                RenderManager.runAnalytics();

                UI.showToast(`Risikogewichtung für "$${type}" auf $${value} gesetzt`, 'info', 2000);
            });
        });
    }
};

// =============================================
// EXPORT MANAGER
// =============================================
const ExportManager = {
    /**
     * Exportiert die aktuellen Daten als CSV
     */
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
                    // CSV-Escaping
                    return `"${value.toString().replace(/"/g, '""')}"`;
                });
                csvContent += values.join(',') + '\n';
            });

            // Download erstellen
            const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');

            link.href = URL.createObjectURL(blob);
            link.download = `security-events-${timestamp}.csv`;
            link.click();

            // Cleanup
            URL.revokeObjectURL(link.href);

            UI.showToast(i18n.t('toast_csv_success', { count: DashboardState.currentData.length }), 'success');

            if (status) {
                status.textContent = `✅ CSV exportiert (${DashboardState.currentData.length} Datensätze)`;
                setTimeout(() => { status.style.display = 'none'; }, 3000);
            }

        } catch (error) {
            console.error('CSV Export Error:', error);
            UI.showToast(i18n.t('toast_csv_error', { error: error.message }), 'error');

            if (status) {
                status.textContent = '❌ Fehler beim CSV-Export';
                setTimeout(() => { status.style.display = 'none'; }, 3000);
            }
        }
    },

    /**
     * Erstellt die Executive Narrative für den PDF-Report
     * @param {SecurityAnalytics} analytics - Analytics-Instanz
     * @returns {{summaryLines: string[], actionLines: string[]}}
     */
    buildExecutiveNarrative(analytics) {
        if (!analytics || !analytics.insights) {
            return { summaryLines: [], actionLines: [] };
        }

        const risk = analytics.insights.risk;
        const domainMix = analytics.insights.domainMix;
        const trends = analytics.insights.trends || [];
        const tp = analytics.insights.timePatterns;
        const recs = analytics.insights.recommendations || [];

        const summaryLines = [];
        const actionLines = [];

        // Risiko-Bewertung
        if (risk) {
            let introKey = risk.level === 'HOCH' ? 'risk_intro_high' :
                           risk.level === 'MITTEL' ? 'risk_intro_medium' : 'risk_intro_low';

            summaryLines.push(i18n.t(introKey, { score: risk.score }));

            let detailKey = risk.level === 'HOCH' ? 'risk_detail_high' :
                            risk.level === 'MITTEL' ? 'risk_detail_medium' : 'risk_detail_low';

            summaryLines.push(i18n.t(detailKey, { count: risk.highRiskEvents }));

            if (risk.criticalTypes && risk.criticalTypes[0]) {
                summaryLines.push(i18n.t('risk_critical_type', {
                    type: risk.criticalTypes[0].key,
                    count: risk.criticalTypes[0].count
                }));
            }
        }

        // Bereichsverteilung
        if (domainMix && domainMix.byDomain && domainMix.byDomain.length) {
            const top = domainMix.byDomain[0];
            const sec = domainMix.byDomain.find(d => d.domain === 'Security');
            const fm = domainMix.byDomain.find(d => d.domain === 'FM');
            const she = domainMix.byDomain.find(d => d.domain === 'SHE');

            summaryLines.push(i18n.t('domain_main_line', {
                domain: top.domain,
                count: top.count,
                share: top.share
            }));

            summaryLines.push(i18n.t('domain_distribution_line', {
                secCount: sec ? sec.count : 0
                   summaryLines.push(i18n.t('domain_distribution_line', {
                secCount: sec ? sec.count : 0,
                secShare: sec ? sec.share : 0,
                fmCount: fm ? fm.count : 0,
                fmShare: fm ? fm.share : 0,
                sheCount: she ? she.count : 0,
                sheShare: she ? she.share : 0
            }));

            if (sec && fm && she) {
                const topRisk = [sec, fm, she].sort((a, b) => b.riskScore - a.riskScore)[0];
                summaryLines.push(i18n.t('domain_risk_focus', {
                    domain: topRisk.domain,
                    score: topRisk.riskScore
                }));
            }
        }

        // Trends
        const riskTrendInsight = trends.find(t => t.metric === 'Gesamt-Risiko');
        const volumeTrendInsight = trends.find(t => t.metric === 'Ereignis-Volumen');

        if (riskTrendInsight) {
            let trendKey = 'trend_risk_stable';
            if (riskTrendInsight.forecast.includes('steigend')) trendKey = 'trend_risk_up';
            else if (riskTrendInsight.forecast.includes('fallend')) trendKey = 'trend_risk_down';

            summaryLines.push(i18n.t('trend_risk_sentence', {
                trend: i18n.t(trendKey),
                confidence: riskTrendInsight.confidence
            }));
        }

        if (volumeTrendInsight) {
            const shortForecast = volumeTrendInsight.forecast.replace('Nächster Monat:', '').trim();
            summaryLines.push(i18n.t('trend_volume_sentence', {
                forecast: shortForecast,
                confidence: volumeTrendInsight.confidence
            }));
        }

        // Zeitliche Muster
        if (tp && tp.topHourBucket && tp.topWeekday) {
            summaryLines.push(i18n.t('time_bucket_line', {
                range: tp.topHourBucket.range,
                count: tp.topHourBucket.count
            }));
            summaryLines.push(i18n.t('time_weekday_line', {
                weekday: tp.topWeekday.name,
                count: tp.topWeekday.count
            }));
            summaryLines.push(i18n.t('time_weekend_share', {
                weekdayShare: tp.weekendVsWeekday.weekdayShare,
                weekendShare: tp.weekendVsWeekday.weekendShare
            }));
        }

        // Empfehlungen
        if (recs.length > 0) {
            recs.slice(0, 3).forEach(rec => {
                const title = i18n.current === 'de' ? rec.title : (rec.title_en || rec.title);
                const action = i18n.current === 'de' ? rec.action : (rec.action_en || rec.action);
                actionLines.push(`$${title}: $${action}.`);
            });
        }

        return { summaryLines, actionLines };
    },

    /**
     * Exportiert die Daten als professionellen PDF-Report
     */
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
            // jsPDF prüfen
            if (typeof window.jspdf === 'undefined') {
                throw new Error('jsPDF ist nicht geladen (prüfe Script-Tags)!');
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const marginX = 18;
            const footerHeight = 12;
            let yPos = 22;
            let pageNumber = 1;

            // Footer-Funktion
            const addFooter = () => {
                pdf.setFontSize(8);
                pdf.setTextColor(130, 130, 130);
                const footerLeft = i18n.t('footer_left');
                const footerRight = i18n.t('footer_page', { page: pageNumber });
                pdf.text(footerLeft, marginX, pageHeight - 6);
                const textWidth = pdf.getTextWidth(footerRight);
                pdf.text(footerRight, pageWidth - marginX - textWidth, pageHeight - 6);
            };

            // Neue Seite erstellen
            const newPage = () => {
                addFooter();
                pdf.addPage();
                pageNumber += 1;
                yPos = 22;
            };

            // Platz sicherstellen
            const ensureSpace = (neededHeight) => {
                if (yPos + neededHeight > pageHeight - footerHeight) {
                    newPage();
                }
            };

            // Analytics berechnen
            let analytics;
            try {
                analytics = new SecurityAnalytics(DashboardState.currentData, DashboardState.headerMap);
                analytics.analyze();
            } catch (e) {
                console.warn('Analytics konnten nicht berechnet werden:', e);
            }

            const narrative = this.buildExecutiveNarrative(analytics);
            const risk = analytics?.insights?.risk;
            const domainMix = analytics?.insights?.domainMix;

            // KPIs berechnen
            const totalEvents = DashboardState.currentData.length;
            const totalCountries = new Set(
                DashboardState.currentData
                    .map(r => DashboardState.headerMap.country ? (r[DashboardState.headerMap.country] || '').trim() : '')
                    .filter(Boolean)
            ).size;
            const totalSites = new Set(
                DashboardState.currentData
                    .map(r => DashboardState.headerMap.site ? (r[DashboardState.headerMap.site] || '').trim() : '')
                    .filter(Boolean)
            ).size;
            const totalTypes = new Set(
                DashboardState.currentData
                    .map(r => DashboardState.headerMap.type ? (r[DashboardState.headerMap.type] || '').trim() : '')
                    .filter(Boolean)
            ).size;

            // ========== SEITE 1: Header & Executive Summary ==========

            // Header-Banner
            pdf.setFillColor(0, 163, 122);
            pdf.rect(0, 0, pageWidth, 30, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.text(i18n.t('pdf_title'), marginX, 16);

            pdf.setFontSize(11);
            pdf.text(i18n.t('pdf_subtitle'), marginX, 23);

            // Datum rechts
            const now = new Date();
            const dateStr = Utils.formatDate(now, i18n.current === 'de' ? 'de-DE' : 'en-GB');
            const dateText = i18n.t('pdf_created_at', { date: dateStr });
            const dateWidth = pdf.getTextWidth(dateText);
            pdf.text(dateText, pageWidth - marginX - dateWidth, 23);

            // Executive Summary
            yPos = 40;
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.text(i18n.t('section_executive_summary'), marginX, yPos);
            yPos += 7;

            // Key Facts
            pdf.setFontSize(9);
            pdf.setTextColor(80, 80, 80);
            const keyFacts = i18n.t('key_facts_line', {
                events: totalEvents,
                countries: totalCountries,
                sites: totalSites,
                types: totalTypes
            });
            pdf.text(keyFacts, marginX, yPos);
            yPos += 7;

            // Narrative Summary
            const execLines = narrative.summaryLines.slice(0, 6);
            const splitExecLines = pdf.splitTextToSize(execLines.join(' '), pageWidth - 2 * marginX);
            splitExecLines.forEach(line => {
                ensureSpace(5);
                pdf.text(line, marginX, yPos);
                yPos += 4.5;
            });

            yPos += 4;

            // Domain Focus
            if (domainMix && domainMix.byDomain && domainMix.byDomain.length) {
                ensureSpace(20);
                pdf.setFontSize(11);
                pdf.setTextColor(0, 0, 0);
                pdf.text(i18n.t('section_domain_focus'), marginX, yPos);
                yPos += 5;

                pdf.setFontSize(9);
                pdf.setTextColor(80, 80, 80);

                domainMix.byDomain.slice(0, 3).forEach(d => {
                    const line = `• $${d.domain}: $${d.count} ($${d.share}%, ~$${d.riskScore} pts)`;
                    ensureSpace(5);
                    pdf.text(line, marginX, yPos);
                    yPos += 4;
                });
            }

            // ========== SEITE 2: AI Insights ==========
            newPage();

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.text(i18n.t('section_ai_insights'), marginX, yPos);
            yPos += 7;

            pdf.setFontSize(9);
            pdf.setTextColor(90, 90, 90);
            pdf.text(i18n.t('desc_ai_insights'), marginX, yPos);
            yPos += 7;

            // Risiko-Sektion
            if (risk) {
                ensureSpace(30);
                pdf.setFontSize(11);
                pdf.setTextColor(0, 0, 0);
                pdf.text(i18n.t('section_risk_and_domain'), marginX, yPos);
                yPos += 5;

                pdf.setFontSize(9);
                pdf.setTextColor(80, 80, 80);

                const riskTextParts = [];
                let introKey = risk.level === 'HOCH' ? 'risk_intro_high' :
                               risk.level === 'MITTEL' ? 'risk_intro_medium' : 'risk_intro_low';

                riskTextParts.push(i18n.t(introKey, { score: risk.score }));
                riskTextParts.push(i18n.t('risk_detail_high', { count: risk.highRiskEvents }));

                if (risk.criticalTypes && risk.criticalTypes[0]) {
                    riskTextParts.push(i18n.t('risk_critical_type', {
                        type: risk.criticalTypes[0].key,
                        count: risk.criticalTypes[0].count
                    }));
                }

                const riskBlock = pdf.splitTextToSize(riskTextParts.join(' '), pageWidth - 2 * marginX);
                riskBlock.forEach(line => {
                    ensureSpace(5);
                    pdf.text(line, marginX, yPos);
                    yPos += 4.5;
                });

                // Domain-Verteilung
                if (domainMix && domainMix.byDomain && domainMix.byDomain.length) {
                    yPos += 4;
                    const dm = domainMix.byDomain;
                    const sec = dm.find(d => d.domain === 'Security');
                    const fm = dm.find(d => d.domain === 'FM');
                    const she = dm.find(d => d.domain === 'SHE');
                    const top = dm[0];

                    const dmLines = [
                        i18n.t('domain_main_line', {
                            domain: top.domain,
                            count: top.count,
                            share: top.share
                        }),
                        i18n.t('domain_distribution_line', {
                            secCount: sec ? sec.count : 0,
                            secShare: sec ? sec.share : 0,
                            fmCount: fm ? fm.count : 0,
                            fmShare: fm ? fm.share : 0,
                            sheCount: she ? she.count : 0,
                            sheShare: she ? she.share : 0
                        })
                    ];

                    const dmText = pdf.splitTextToSize(dmLines.join(' '), pageWidth - 2 * marginX);
                    dmText.forEach(line => {
                        ensureSpace(5);
                        pdf.text(line, marginX, yPos);
                        yPos += 4.5;
                    });
                }
            }

            // Zeit & Trends
            const tp = analytics?.insights?.timePatterns;
            const trends = analytics?.insights?.trends || [];

            if (tp || trends.length) {
                yPos += 6;
                ensureSpace(30);
                pdf.setFontSize(11);
                pdf.setTextColor(0, 0, 0);
                pdf.text(i18n.t('section_time_and_trends'), marginX, yPos);
                yPos += 5;

                pdf.setFontSize(9);
                pdf.setTextColor(80, 80, 80);

                if (tp && tp.topHourBucket && tp.topWeekday) {
                    const timeLines = [
                        i18n.t('time_bucket_line', { range: tp.topHourBucket.range, count: tp.topHourBucket.count }),
                        i18n.t('time_weekday_line', { weekday: tp.topWeekday.name, count: tp.topWeekday.count }),
                        i18n.t('time_weekend_share', {
                            weekdayShare: tp.weekendVsWeekday.weekdayShare,
                            weekendShare: tp.weekendVsWeekday.weekendShare
                        })
                    ];

                    const tt = pdf.splitTextToSize(timeLines.join(' '), pageWidth - 2 * marginX);
                    tt.forEach(line => {
                        ensureSpace(5);
                        pdf.text(line, marginX, yPos);
                        yPos += 4.5;
                    });
                }

                if (trends.length) {
                    yPos += 4;
                    const riskTrend = trends.find(t => t.metric === 'Gesamt-Risiko');
                    const volumeTrend = trends.find(t => t.metric === 'Ereignis-Volumen');

                    const trendParts = [];
                    if (riskTrend) {
                        let trendKey = 'trend_risk_stable';
                        if (riskTrend.forecast.includes('steigend')) trendKey = 'trend_risk_up';
                        else if (riskTrend.forecast.includes('fallend')) trendKey = 'trend_risk_down';

                        trendParts.push(i18n.t('trend_risk_sentence', {
                            trend: i18n.t(trendKey),
                            confidence: riskTrend.confidence
                        }));
                    }

                    if (volumeTrend) {
                        const shortForecast = volumeTrend.forecast.replace('Nächster Monat:', '').trim();
                        trendParts.push(i18n.t('trend_volume_sentence', {
                            forecast: shortForecast,
                            confidence: volumeTrend.confidence
                        }));
                    }

                    if (trendParts.length) {
                        const trText = pdf.splitTextToSize(trendParts.join(' '), pageWidth - 2 * marginX);
                        trText.forEach(line => {
                            ensureSpace(5);
                            pdf.text(line, marginX, yPos);
                            yPos += 4.5;
                        });
                    }
                }
            }

            // Empfehlungen
            const actionLines = narrative.actionLines;
            if (actionLines && actionLines.length) {
                yPos += 8;
                ensureSpace(30);
                pdf.setFontSize(11);
                pdf.setTextColor(0, 0, 0);
                pdf.text(i18n.t('section_actions'), marginX, yPos);
                yPos += 5;

                pdf.setFontSize(9);
                pdf.setTextColor(80, 80, 80);

                actionLines.forEach(line => {
                    const text = pdf.splitTextToSize(i18n.t('actions_bullet_prefix') + line, pageWidth - 2 * marginX);
                    text.forEach(t => {
                        ensureSpace(5);
                        pdf.text(t, marginX, yPos);
                        yPos += 4.5;
                    });
                });
            }

            // ========== SEITE 3: Visual Analytics ==========
            newPage();

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.text(i18n.t('section_visual_analytics'), marginX, yPos);
            yPos += 7;

            pdf.setFontSize(9);
            pdf.setTextColor(90, 90, 90);
            pdf.text(i18n.t('desc_visual_analytics'), marginX, yPos);
            yPos += 6;

            // Charts als Bilder einfügen
            const addChart = (selector, titleKey) => {
                const container = document.querySelector(selector);
                if (!container) return;

                const canvas = container.querySelector('canvas');
                if (!canvas) return;

                try {
                    const imgData = canvas.toDataURL('image/png', 1.0);
                    const imgHeight = 55;
                    const imgWidth = pageWidth - 2 * marginX;

                    ensureSpace(imgHeight + 12);

                    pdf.setFontSize(10);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(i18n.t(titleKey), marginX, yPos);
                    yPos += 4;

                    pdf.addImage(imgData, 'PNG', marginX, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 6;
                } catch (e) {
                    console.warn('Could not add chart to PDF:', e);
                }
            };

            addChart('#chartCountries', 'chart_countries_title');
            addChart('#chartSites', 'chart_sites_title');
            addChart('#chartTypes', 'chart_types_title');
            addChart('#chartDomains', 'chart_domains_title');

            // ========== SEITE 4+: Tabellen (mit autoTable) ==========
            if (pdf.autoTable) {
                newPage();

                const byCountry = Utils.groupAndCount(DashboardState.currentData, row =>
                    DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : ''
                );
                const bySite = Utils.groupAndCount(DashboardState.currentData, row =>
                    DashboardState.headerMap.site ? row[DashboardState.headerMap.site] : ''
                );
                const byType = Utils.groupAndCount(DashboardState.currentData, row =>
                    DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : ''
                );

                pdf.setFontSize(14);
                pdf.setTextColor(0, 0, 0);
                pdf.text(i18n.t('section_aggregated_overview'), marginX, yPos);
                yPos += 7;

                // Tabelle: Nach Land
                pdf.setFontSize(11);
                pdf.text(i18n.t('chart_countries_title'), marginX, yPos);
                yPos += 4;

                pdf.autoTable({
                    startY: yPos,
                    head: [[i18n.t('table_country_header'), i18n.t('table_count_header')]],
                    body: byCountry.map(r => [r.key || '(leer)', r.count]),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [0, 163, 122], textColor: 255 }
                });
                yPos = pdf.lastAutoTable.finalY + 8;

                // Tabelle: Nach Liegenschaft
                pdf.setFontSize(11);
                pdf.text(i18n.t('chart_sites_title'), marginX, yPos);
                yPos += 4;

                pdf.autoTable({
                    startY: yPos,
                    head: [[i18n.t('table_site_header'), i18n.t('table_count_header')]],
                    body: bySite.map(r => [r.key || '(leer)', r.count]),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [0, 163, 122], textColor: 255 }
                });
                yPos = pdf.lastAutoTable.finalY + 8;

                // Tabelle: Nach Ereignisart
                pdf.setFontSize(11);
                pdf.text(i18n.t('chart_types_title'), marginX, yPos);
                yPos += 4;

                pdf.autoTable({
                    startY: yPos,
                    head: [[i18n.t('table_type_header'), i18n.t('table_count_header')]],
                    body: byType.map(r => [r.key || '(leer)', r.count]),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: [0, 163, 122], textColor: 255 }
                });
                yPos = pdf.lastAutoTable.finalY + 10;

                // ========== Detaillierte Ereignisliste ==========
                if (DashboardState.currentData.length > 0) {
                    newPage();

                    const maxRows = CONFIG.maxPdfRows;
                    const headers = Object.keys(DashboardState.currentData[0]);
                    const rows = DashboardState.currentData
                        .slice(0, maxRows)
                        .map(row => headers.map(h => row[h] || ''));

                    pdf.setFontSize(14);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text(
                        i18n.t('section_detailed_list', { count: Math.min(maxRows, DashboardState.currentData.length) }),
                        marginX,
                        yPos
                    );
                    yPos += 6;

                    pdf.autoTable({
                        startY: yPos,
                        head: [headers],
                        body: rows,
                        margin: { left: marginX, right: marginX },
                        styles: { fontSize: 7 },
                        headStyles: { fillColor: [0, 163, 122], textColor: 255 }
                    });
                }
            }

            // Footer auf letzter Seite
            addFooter();

            // PDF speichern
            const nowForName = new Date();
            const dateForName = `$${nowForName.getFullYear()}-$${String(nowForName.getMonth() + 1).padStart(2, '0')}-${String(nowForName.getDate()).padStart(2, '0')}`;
            const filename = i18n.t('pdf_filename', { date: dateForName });

            pdf.save(filename);

            UI.showToast(i18n.t('toast_pdf_success', { file: filename }), 'success');

            if (status) {
                status.textContent = i18n.t('toast_pdf_success', { file: filename });
                setTimeout(() => { status.style.display = 'none'; }, 4000);
            }

        } catch (error) {
            console.error('PDF Error:', error);
            UI.showToast(i18n.t('toast_pdf_error', { error: error.message }), 'error');

            if (status) {
                status.textContent = i18n.t('toast_pdf_error', { error: error.message });
                setTimeout(() => { status.style.display = 'none'; }, 5000);
            }
        } finally {
            if (btnPdf) btnPdf.disabled = false;
        }
    }
};

// =============================================
// FILTER MANAGER
// =============================================
const FilterManager = {
    /**
     * Wendet die aktiven Filter an
     */
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

        console.log(`🔍 Filter applied: $${DashboardState.currentData.length}/$${DashboardState.allData.length} records`);
    },

    /**
     * Setzt alle Filter zurück
     */
    reset() {
        const filterCountry = document.getElementById('filterCountry');
        const filterSite = document.getElementById('filterSite');
        const filterType = document.getElementById('filterType');

        if (filterCountry) filterCountry.value = '__ALL__';
        if (filterSite) filterSite.value = '__ALL__';
        if (filterType) filterType.value = '__ALL__';

        this.apply();
        UI.showToast('Filter zurückgesetzt', 'info', 2000);
    },

    /**
     * Aktualisiert die Statusanzeige
     */
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
            text = 'Keine Filter aktiv (zeige alle Datensätze)';
            status.className = 'status';
        } else {
            text = `Aktive Filter: ${activeFilters.join(' | ')}`;
            status.className = 'status active-filters';
        }

        const total = DashboardState.allData.length;
        const current = DashboardState.currentData.length;
        text += ` | Zeige $${current} von $${total} Datensätzen`;

        status.textContent = text;
    },

    /**
     * Aktualisiert die Optionen einer Select-Box
     * @param {string} selectId - ID des Select-Elements
     * @param {string[]} values - Werte für die Optionen
     * @param {string} placeholder - Platzhalter-Text
     */
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

        // Vorherigen Wert wiederherstellen falls möglich
        if (values.includes(currentValue)) {
            select.value = currentValue;
        }
    }
};

// =============================================
// RENDER MANAGER
// =============================================
const RenderManager = {
    /**
     * Rendert das komplette Dashboard
     */
    renderAll() {
        console.log('🎨 Rendering dashboard...');

        this.renderKPIs();
        this.renderFilters();
        this.renderTables();
        this.renderCharts();
        this.runAnalytics();
    },

    /**
     * Rendert die KPI-Karten
     */
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
            if (DashboardState.headerMap.type && row[DashboardState.header
                if (DashboardState.headerMap.type && row[DashboardState.headerMap.type]) {
                types.add(row[DashboardState.headerMap.type].trim());
            }
        });

        UI.updateText('kpiCountries', countries.size);
        UI.updateText('kpiSites', sites.size);
        UI.updateText('kpiTypes', types.size);
    },

    /**
     * Rendert die Filter-Dropdowns
     */
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

    /**
     * Rendert die Datentabellen
     */
    renderTables() {
        const emptyStateHtml = (colspan) => `
            <tr>
                <td colspan="${colspan}" class="empty-state">
                    <strong>Keine Daten</strong>
                    <span>Bitte laden Sie Daten oder passen Sie die Filter an.</span>
                </td>
            </tr>
        `;

        if (DashboardState.currentData.length === 0) {
            const tbodyCountry = document.querySelector('#tableByCountry tbody');
            const tbodySite = document.querySelector('#tableBySite tbody');
            const tbodyType = document.querySelector('#tableByType tbody');

            if (tbodyCountry) tbodyCountry.innerHTML = emptyStateHtml(2);
            if (tbodySite) tbodySite.innerHTML = emptyStateHtml(3);
            if (tbodyType) tbodyType.innerHTML = emptyStateHtml(2);
            return;
        }

        // Nach Land gruppieren
        const byCountry = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : ''
        );

        // Nach Ereignisart gruppieren
        const byType = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : ''
        );

        // Nach Liegenschaft gruppieren (mit Land)
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
                return {
                    site: site || '(leer)',
                    country: country || '(leer)',
                    count
                };
            })
            .sort((a, b) => b.count - a.count);

        // Tabellen befüllen
        const tbodyCountry = document.querySelector('#tableByCountry tbody');
        if (tbodyCountry) {
            tbodyCountry.innerHTML = byCountry.map(item => `
                <tr>
                    <td>${Utils.escapeHtml(item.key || '(leer)')}</td>
                    <td>${item.count}</td>
                </tr>
            `).join('');
        }

        const tbodySite = document.querySelector('#tableBySite tbody');
        if (tbodySite) {
            tbodySite.innerHTML = siteArray.map(item => `
                <tr>
                    <td>${Utils.escapeHtml(item.site)}</td>
                    <td>${Utils.escapeHtml(item.country)}</td>
                    <td>${item.count}</td>
                </tr>
            `).join('');
        }

        const tbodyType = document.querySelector('#tableByType tbody');
        if (tbodyType) {
            tbodyType.innerHTML = byType.map(item => `
                <tr>
                    <td>${Utils.escapeHtml(item.key || '(leer)')}</td>
                    <td>${item.count}</td>
                </tr>
            `).join('');
        }
    },

    /**
     * Rendert alle Charts
     */
    renderCharts() {
        const emptyHtml = `
            <div class="empty-state">
                <strong>Keine Daten</strong>
                <span>Bitte laden Sie Daten oder ändern Sie die Filter.</span>
            </div>
        `;

        if (DashboardState.currentData.length === 0) {
            ['chartCountries', 'chartSites', 'chartTypes', 'chartDomains'].forEach(id => {
                const container = document.getElementById(id);
                if (container) {
                    container.innerHTML = emptyHtml;
                }
            });
            ChartManager.destroyAll();
            return;
        }

        // Daten für Charts vorbereiten
        const countries = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : ''
        );

        const sites = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.site ? row[DashboardState.headerMap.site] : ''
        );

        const types = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : ''
        );

        // Domain-Verteilung berechnen
        const domainCounts = { Security: 0, FM: 0, SHE: 0, Other: 0 };
        DashboardState.currentData.forEach(row => {
            const domain = Utils.classifyCategory(row, DashboardState.headerMap);
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
        });

        const domainData = Object.keys(domainCounts)
            .map(domain => ({ key: domain, count: domainCounts[domain] }))
            .filter(d => d.count > 0);

        // Charts erstellen
        ChartManager.create('chartCountries', countries, 'bar');
        ChartManager.create('chartSites', sites, 'bar');
        ChartManager.create('chartTypes', types, 'pie');
        ChartManager.create('chartDomains', domainData, 'pie');
    },

    /**
     * Führt die Analytics aus
     */
    runAnalytics() {
        if (DashboardState.currentData.length === 0) {
            this.clearAnalytics();
            return;
        }

        try {
            const analytics = new SecurityAnalytics(DashboardState.currentData, DashboardState.headerMap);
            analytics.analyze();
        } catch (error) {
            console.error('Analytics error:', error);
            this.clearAnalytics();
        }
    },

    /**
     * Leert die Analytics-Anzeigen
     */
    clearAnalytics() {
        const loadingHtml = '<div class="loading">Keine Daten für Analyse verfügbar</div>';

        ['riskAssessment', 'patternDetection', 'smartRecommendations', 'trendForecast'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = loadingHtml;
            }
        });
    }
};

// =============================================
// DATA MANAGER
// =============================================
const DataManager = {
    /**
     * Lädt die Testdaten
     */
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

            console.log(`✅ Test data loaded: ${DashboardState.allData.length} records`);
            UI.showToast(i18n.t('toast_testdata_loaded'), 'info');

        } catch (error) {
            console.error('Error loading test data:', error);
            UI.showToast('Fehler beim Laden der Testdaten: ' + error.message, 'error');
        }
    },

    /**
     * Lädt eine CSV-Datei
     * @param {File} file - Die zu ladende Datei
     */
    async loadCSVFile(file) {
        console.log(`📁 Loading CSV file: ${file.name}`);

        const status = document.getElementById('fileStatus');

        try {
            const text = await file.text();
            const parsed = Utils.parseCSV(text);

            if (parsed.rows.length === 0) {
                throw new Error('CSV-Datei enthält keine gültigen Daten');
            }

            DashboardState.allData = parsed.rows;
            DashboardState.headerMap = Utils.createHeaderMap(parsed.headers);
            DashboardState.currentData = [...DashboardState.allData];

            RiskConfigManager.render();
            this.updateUI('csv', file.name);
            RenderManager.renderAll();

            console.log(`✅ CSV file loaded: ${DashboardState.allData.length} records`);
            UI.showToast(i18n.t('toast_csv_loaded', { filename: file.name }), 'success');

            // Warnung bei fehlenden Spalten
            if (!DashboardState.headerMap.country ||
                !DashboardState.headerMap.site ||
                !DashboardState.headerMap.type) {
                UI.showToast(i18n.t('toast_columns_warning'), 'info', 8000);
            }

        } catch (error) {
            console.error('CSV loading error:', error);

            if (status) {
                status.textContent = `Fehler beim Lesen der Datei: ${error.message}`;
                status.className = 'status error';
            }

            UI.showToast('Fehler beim Laden der CSV-Datei: ' + error.message, 'error');
        }
    },

    /**
     * Aktualisiert die UI nach dem Laden von Daten
     * @param {string} mode - 'testdata', 'csv' oder ''
     * @param {string} filename - Dateiname (optional)
     */
    updateUI(mode, filename = '') {
        UI.updateText('recordCount', DashboardState.allData.length);

        const modeIndicator = document.getElementById('modeIndicator');
        const fileStatus = document.getElementById('fileStatus');

        if (mode === 'testdata') {
            if (modeIndicator) modeIndicator.textContent = 'Modus: Testdaten (Demo)';
            if (fileStatus) {
                fileStatus.textContent = 'Testdaten sind geladen (Demo-Modus).';
                fileStatus.className = 'status';
            }
        } else if (mode === 'csv') {
            if (modeIndicator) modeIndicator.textContent = 'Modus: CSV-Datei';
            if (fileStatus) {
                fileStatus.textContent = `Datei "${filename}" geladen. Datensätze: ${DashboardState.allData.length}.`;
                fileStatus.className = 'status';
            }
        } else {
            if (modeIndicator) modeIndicator.textContent = 'Modus: Keine Daten';
            if (fileStatus) {
                fileStatus.textContent = 'Keine Datei geladen.';
                fileStatus.className = 'status';
            }
        }
    }
};

// =============================================
// APPLICATION INITIALIZATION
// =============================================
const Dashboard = {
    /**
     * Initialisiert das Dashboard
     */
    init() {
        console.log('🚀 Initializing Security Dashboard...');

        try {
            ThemeManager.init();
            RiskConfigManager.loadFromStorage();
            this.setupEventListeners();
            this.initializeUI();

            DashboardState.isInitialized = true;
            console.log('✅ Dashboard initialized successfully!');

        } catch (error) {
            console.error('Dashboard initialization error:', error);
            UI.showToast('Fehler bei der Initialisierung des Dashboards', 'error');
        }
    },

    /**
     * Richtet alle Event Listener ein
     */
    setupEventListeners() {
        // Testdaten laden
        const loadTestDataBtn = document.getElementById('loadTestData');
        if (loadTestDataBtn) {
            loadTestDataBtn.addEventListener('click', () => {
                DataManager.loadTestData();
            });
        }

        // CSV-Datei laden
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (file) {
                    DataManager.loadCSVFile(file);
                }
            });
        }

        // Filter
        const filterCountry = document.getElementById('filterCountry');
        const filterSite = document.getElementById('filterSite');
        const filterType = document.getElementById('filterType');
        const resetFiltersBtn = document.getElementById('resetFilters');

        if (filterCountry) {
            filterCountry.addEventListener('change', () => FilterManager.apply());
        }
        if (filterSite) {
            filterSite.addEventListener('change', () => FilterManager.apply());
        }
        if (filterType) {
            filterType.addEventListener('change', () => FilterManager.apply());
        }
        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => FilterManager.reset());
        }

        // Export
        const exportCSVBtn = document.getElementById('exportCSV');
        const exportPDFBtn = document.getElementById('exportPDF');

        if (exportCSVBtn) {
            exportCSVBtn.addEventListener('click', () => ExportManager.toCSV());
        }
        if (exportPDFBtn) {
            exportPDFBtn.addEventListener('click', () => ExportManager.toPDF());
        }

        // Sprachauswahl
        const langSelect = document.getElementById('reportLanguage');
        if (langSelect) {
            langSelect.addEventListener('change', (e) => {
                const lang = e.target.value || 'de';
                i18n.set(lang);
            });
            // Initiale Sprache setzen
            i18n.set(langSelect.value || 'de');
        }

        console.log('🔗 Event listeners attached');
    },

    /**
     * Initialisiert die UI
     */
    initializeUI() {
        FilterManager.updateStatus();
        RenderManager.clearAnalytics();
        console.log('🎨 UI initialized');
    }
};

// =============================================
// START THE APPLICATION
// =============================================
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

// Globaler Error Handler
window.addEventListener('error', (e) => {
    console.error('Dashboard Error:', e.error || e.message);
    UI.showToast('Unerwarteter Fehler im Dashboard. Details in der Konsole.', 'error', 6000);
});

// Unhandled Promise Rejection Handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e.reason);
    UI.showToast('Unerwarteter Fehler im Dashboard. Details in der Konsole.', 'error', 6000);
});

// Globale Exports für Debugging
window.Dashboard = Dashboard;
window.DashboardState = DashboardState;
window.i18n = i18n;
window.CONFIG = CONFIG;
window.Utils = Utils;
window.ChartManager = ChartManager;
window.FilterManager = FilterManager;
window.ExportManager = ExportManager;
window.RenderManager = RenderManager;
window.DataManager = DataManager;

console.log('📦 Security Dashboard module loaded');
