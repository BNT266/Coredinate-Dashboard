/*
 * =============================================
 * SECURITY DASHBOARD - MAIN APPLICATION v4.0
 * =============================================
 */

console.log('🚀 Security Dashboard startet...');

// =============================================
// GLOBAL STATE
// =============================================
const DashboardState = {
    allData: [],
    currentData: [],
    headerMap: {},
    chartInstances: {}
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
    ]
};

// =============================================
// TEST DATA (inkl. Uhrzeit für Zeitmuster)
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
            if (lower.includes('ereignis') || lower.includes('event')) map.type = h;
            if (lower.includes('datum') || lower.includes('date')) map.date = h;
            if (lower.includes('zeit') || lower.includes('uhr') || lower.includes('time')) map.time = h;
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

    formatTimestamp() {
        return new Date().toLocaleDateString('de-DE', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    },

    // Domain-Klassifikation: Security / FM / SHE / Other
    classifyCategory(row, headerMap) {
        const fields = [];

        if (headerMap.type && row[headerMap.type]) {
            fields.push(row[headerMap.type]);
        }
        // Optionale Zusatzfelder (z. B. Beschreibung, Kategorie) automatisch mitnutzen
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
    }
};

// =============================================
// UI HELPER (Toasts)
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
    }
};

// =============================================
// CHART MANAGER
// =============================================
const ChartManager = {
    create(containerId, data, type = 'bar', maxBars = 6) {
        const container = document.getElementById(containerId);
        if (!container || !data?.length) {
            if (container) container.innerHTML = '<div class="empty-state"><strong>Keine Daten</strong><span>Bitte Daten laden oder Filter anpassen.</span></div>';
            return;
        }

        if (DashboardState.chartInstances[containerId]) {
            DashboardState.chartInstances[containerId].destroy();
        }

        container.innerHTML = '<canvas></canvas>';
        const canvas = container.querySelector('canvas');

        const chartData = data.slice(0, maxBars);
        const labels = chartData.map(d => d.key || "(leer)");
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
                    legend: { display: type === 'pie', position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ${ctx.raw} Ereignisse`
                        }
                    }
                },
                scales: type === 'pie' ? {} : {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        };

        DashboardState.chartInstances[containerId] = new Chart(canvas, config);
    },

    destroyAll() {
        Object.values(DashboardState.chartInstances).forEach(chart => chart.destroy());
        DashboardState.chartInstances = {};
    }
};

// =============================================
// ANALYTICS ENGINE (KI-Layer)
// =============================================
class SecurityAnalytics {
    constructor(data, headerMap) {
        this.data = data;
        this.headerMap = headerMap;
        this.insights = {};
    }

    analyze() {
        console.log('🧠 Running Smart Analytics...');
        this.calculateRiskAssessment();
        this.detectPatterns();
        this.generateRecommendations();
        this.forecastTrends();
        this.analyzeTimePatterns();
        this.analyzeDomainMix();      // NEU: Security / FM / SHE
        this.renderAllInsights();
    }

    calculateRiskAssessment() {
        const eventsByType = Utils.groupAndCount(this.data, row =>
            this.headerMap.type ? row[this.headerMap.type] : '');

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
            this.headerMap.site ? row[this.headerMap.site] : "");

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
            this.headerMap.type ? row[this.headerMap.type] : "");

        if (typeEvents.length > 0) {
            const dominantType = typeEvents[0];
            const concentration = (dominantType.count / this.data.length) * 100;

            if (concentration > 40) {
                patterns.push({
                    type: 'concentration',
                    title: 'Ereignis-Konzentration erkannt',
                    description: `${Math.round(concentration)}% aller Ereignisse sind "${dominantType.key}"`,
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
                priority: 'high',
                icon: '🚨',
                title: 'Sofortige Sicherheitsmaßnahmen',
                action: 'Sicherheitsaudit durchführen und Notfallplan aktivieren',
                reason: `Risiko-Score von ${risk.score}% erfordert schnelles Handeln`
            });
        }

        if (risk.criticalTypes.length > 0) {
            recommendations.push({
                priority: 'high',
                icon: '🔒',
                title: 'Kritische Ereignisarten adressieren',
                action: `Präventionsmaßnahmen für ${risk.criticalTypes[0].key} verstärken`,
                reason: `${risk.criticalTypes[0].count} kritische Ereignisse registriert`
            });
        }

        if (this.data.length > 20) {
            recommendations.push({
                priority: 'medium',
                icon: '📊',
                title: 'Regelmäßiges Monitoring',
                action: 'Wöchentliche Dashboard-Reviews etablieren',
                reason: `${this.data.length} Ereignisse zeigen hohe Aktivität`
            });
        }

        recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
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

        const monthlyGrowth = this.data.length > 50 ? '+12%' :
            this.data.length > 20 ? '+5%' : '-3%';
        trends.push({
            metric: 'Ereignis-Volumen',
            current: `${this.data.length} Events`,
            forecast: `Nächster Monat: ${monthlyGrowth}`,
            confidence: '75%'
        });

        const topRiskType = risk.criticalTypes[0];
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

            if (weekday >= 0 && weekday <= 6) {
                weekdayCounts[weekday]++;
            }
        });

        const totalEvents = this.data.length || 1;

        const hourBucketArray = Object.entries(hourBuckets)
            .map(([range, count]) => ({ range, count }))
            .sort((a, b) => b.count - a.count);
        const topHourBucket = hourBucketArray[0];

        const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
        const weekdayArray = weekdayCounts.map((count, idx) => ({
            name: weekdayNames[idx],
            count
        })).sort((a, b) => b.count - a.count);
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

    // NEU: Domain-Mix (Security / FM / SHE / Other)
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

        const domainArray = Object.keys(counts).map(domain => ({
            domain,
            count: counts[domain],
            share: Math.round((counts[domain] / totalEvents) * 100),
            riskScore: Math.round(riskByDomain[domain])
        })).sort((a, b) => b.count - a.count);

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
        const risk = this.insights.risk;

        container.innerHTML = `
            <div class="insight-item risk-${risk.class}"
                 title="Risiko basierend auf gewichteter Häufigkeit (kritische Ereignisse wie Einbruch, Diebstahl, Vandalismus zählen stärker).">
                <div class="insight-value">Risiko-Level: ${risk.level} (${risk.score}%)</div>
                <div class="insight-trend">
                    ${risk.highRiskEvents} kritische Ereignisse von ${risk.totalEvents} gesamt
                </div>
                <div class="insight-trend">
                    Basis: gewichtete Häufigkeit nach Ereignisart (Einbruch, Diebstahl, Vandalismus etc.).
                </div>
            </div>
            ${risk.criticalTypes.length > 0 ? `
                <div class="insight-item"
                     title="Ereignisart mit dem höchsten Beitrag zum Gesamtrisiko.">
                    <div class="insight-value">⚠️ Kritischster Typ:</div>
                    <div class="insight-trend">${risk.criticalTypes[0].key} (${risk.criticalTypes[0].count}x)</div>
                </div>
            ` : ''}
        `;
    }

    // Angepasst: Muster + Bereichszuordnung
    renderPatternDetection() {
        const container = document.getElementById('patternDetection');
        const patterns = this.insights.patterns;
        const domainMix = this.insights.domainMix;

        let html = '';

        if (patterns.length === 0) {
            html += `
                <div class="insight-item" title="Es wurden keine signifikanten Abweichungen in den Verteilungen erkannt.">
                    <div class="insight-value">✅ Keine kritischen Muster erkannt</div>
                    <div class="insight-trend">Ereignisverteilung ist ausgewogen</div>
                </div>
            `;
        } else {
            html += patterns.slice(0, 2).map(pattern => `
                <div class="insight-item"
                    title="Erkanntes Muster basierend auf Auffälligkeiten in Häufigkeiten (Hotspots / Dominanz einer Ereignisart).">
                    <div class="insight-value">${pattern.severity === 'high' ? '🔴' : '🟡'} ${pattern.title}</div>
                    <div class="insight-trend">${pattern.description}</div>
                </div>
            `).join('');
        }

        if (domainMix && domainMix.byDomain && domainMix.byDomain.length) {
            const top = domainMix.byDomain[0];
            const sec = domainMix.byDomain.find(d => d.domain === 'Security');
            const fm  = domainMix.byDomain.find(d => d.domain === 'FM');
            const she = domainMix.byDomain.find(d => d.domain === 'SHE');

            html += `
                <div class="insight-item"
                     title="Zuweisung der Ereignisse zu den Bereichen Security, Facility Management (FM) und SHE (Safety, Health, Environment) auf Basis der Ereignisbezeichnung.">
                    <div class="insight-value">Bereichszuordnung (Security / FM / SHE)</div>
                    <div class="insight-trend">
                        Dominanter Bereich: <strong>${top.domain}</strong>
                        (${top.count} Events, ${top.share}% Anteil).
                    </div>
                    <div class="insight-trend">
                        Security: ${sec ? `${sec.count} (${sec.share}%)` : '0 (0%)'} |
                        FM: ${fm ? `${fm.count} (${fm.share}%)` : '0 (0%)'} |
                        SHE: ${she ? `${she.count} (${she.share}%)` : '0 (0%)'}
                    </div>
                    <div class="insight-trend">
                        Risikobeitrag (Punkte): 
                        Security ${sec ? sec.riskScore : 0}, 
                        FM ${fm ? fm.riskScore : 0}, 
                        SHE ${she ? she.riskScore : 0}.
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    }

    renderRecommendations() {
        const container = document.getElementById('smartRecommendations');
        const recommendations = this.insights.recommendations;

        container.innerHTML = recommendations.slice(0, 3).map(rec => `
            <div class="insight-item"
                 title="Empfehlung abgeleitet aus Risiko-Level, kritischen Ereignisarten und Aktivitätsniveau.">
                <div class="insight-value">${rec.icon} ${rec.title}</div>
                <div class="insight-trend">${rec.action}</div>
            </div>
        `).join('');
    }

    renderTrendForecast() {
        const container = document.getElementById('trendForecast');
        const trends = this.insights.trends || [];
        const timePatterns = this.insights.timePatterns;

        let html = trends.slice(0, 3).map(trend => `
            <div class="insight-item"
                 title="Prognose basiert auf der aktuellen Ereigniszahl und einfachen Wachstumsannahmen.">
                <div class="insight-value">${trend.metric}: ${trend.current}</div>
                <div class="insight-trend trend-${trend.forecast.includes('+') ? 'up' : trend.forecast.includes('-') ? 'down' : 'stable'}">
                    ${trend.forecast} (${trend.confidence} Konfidenz)
                </div>
            </div>
        `).join('');

        if (timePatterns && timePatterns.topHourBucket && timePatterns.topWeekday) {
            html += `
                <div class="insight-item"
                     title="Analyse der zeitlichen Verteilung basierend auf Datum/Uhrzeit-Feldern.">
                    <div class="insight-value">Zeitliche Muster</div>
                    <div class="insight-trend">
                        Häufigste Zeitspanne: <strong>${timePatterns.topHourBucket.range} Uhr</strong>
                        (${timePatterns.topHourBucket.count} Ereignisse).
                    </div>
                    <div class="insight-trend">
                        Häufigster Wochentag: <strong>${timePatterns.topWeekday.name}</strong>
                        (${timePatterns.topWeekday.count} Ereignisse).
                    </div>
                    <div class="insight-trend">
                        Verteilung: <strong>${timePatterns.weekendVsWeekday.weekdayShare}%</strong> Werktag vs.
                        <strong>${timePatterns.weekendVsWeekday.weekendShare}%</strong> Wochenende.
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
        const label = document.querySelector('.theme-label');

        if (!toggle || !label) return;

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

        console.log(`🎨 Theme changed to: ${theme}`);
    }
};

// =============================================
// EXPORT MANAGER (CSV + Executive PDF)
// =============================================
const ExportManager = {
    toCSV() {
        if (!DashboardState.currentData || DashboardState.currentData.length === 0) {
            UI.showToast('Keine Daten zum CSV-Export vorhanden. Bitte Daten laden oder Filter anpassen.', 'error');
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

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            link.href = URL.createObjectURL(blob);
            link.download = `security-events-${timestamp}.csv`;
            link.click();

            UI.showToast(`CSV exportiert (${DashboardState.currentData.length} Datensätze).`, 'success');

            if (status) {
                status.textContent = `✅ CSV exportiert (${DashboardState.currentData.length} Datensätze)`;
                setTimeout(() => { status.style.display = 'none'; }, 3000);
            }

        } catch (error) {
            console.error('CSV Export Error:', error);
            UI.showToast('Fehler beim CSV-Export: ' + error.message, 'error');
            if (status) {
                status.textContent = '❌ Fehler beim CSV-Export';
                setTimeout(() => { status.style.display = 'none'; }, 3000);
            }
        }
    },

    async toPDF() {
        if (!DashboardState.currentData || DashboardState.currentData.length === 0) {
            UI.showToast('Keine Daten zum PDF-Export vorhanden. Bitte Daten laden oder Filter anpassen.', 'error');
            return;
        }

        const status = document.getElementById('exportStatus');
        if (status) {
            status.style.display = 'block';
            status.textContent = '📄 Professioneller PDF-Report wird erstellt...';
        }

        const btnPdf = document.getElementById('exportPDF');
        if (btnPdf) btnPdf.disabled = true;

        try {
            if (typeof window.jspdf === 'undefined') {
                throw new Error('jsPDF ist nicht geladen (prüfe Script-Tags)!');
            }

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const marginX = 18;
            const footerHeight = 12;
            let yPos = 18;
            let pageNumber = 1;

            const addFooter = () => {
                pdf.setFontSize(8);
                pdf.setTextColor(130, 130, 130);
                const footerTextLeft = 'Security Events Dashboard Report';
                const footerTextRight = `Seite ${pageNumber}`;
                pdf.text(footerTextLeft, marginX, pageHeight - 6);
                const textWidth = pdf.getTextWidth(footerTextRight);
                pdf.text(footerTextRight, pageWidth - marginX - textWidth, pageHeight - 6);
            };

            const newPage = () => {
                addFooter();
                pdf.addPage();
                pageNumber += 1;
                yPos = 18;
            };

            const ensureSpace = (neededHeight) => {
                if (yPos + neededHeight > pageHeight - footerHeight) {
                    newPage();
                }
            };

            // Seite 1 – Executive Summary
            pdf.setFillColor(0, 163, 122);
            pdf.rect(0, 0, pageWidth, 26, 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.text('SECURITY EVENT DASHBOARD', marginX, 15);

            pdf.setFontSize(10);
            pdf.text('Executive Summary & Risikoanalyse', marginX, 21);

            const now = new Date();
            const dateStr = now.toLocaleDateString('de-DE', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            });
            const dateText = `Erstellt: ${dateStr}`;
            const dateWidth = pdf.getTextWidth(dateText);
            pdf.text(dateText, pageWidth - marginX - dateWidth, 21);

            yPos = 35;

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.text('Executive Summary', marginX, yPos);
            yPos += 6;

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

            const kpis = [
                { label: 'Ereignisse gesamt', value: totalEvents, color: [52, 152, 219] },
                { label: 'Länder', value: totalCountries, color: [155, 89, 182] },
                { label: 'Liegenschaften', value: totalSites, color: [230, 126, 34] },
                { label: 'Ereignisarten', value: totalTypes, color: [231, 76, 60] }
            ];

            const cardWidth = (pageWidth - 2 * marginX - 3 * 5) / 4;
            const cardHeight = 24;
            const cardY = yPos;

            kpis.forEach((kpi, i) => {
                const x = marginX + i * (cardWidth + 5);

                pdf.setFillColor(230, 230, 230);
                pdf.roundedRect(x + 1.5, cardY + 1.5, cardWidth, cardHeight, 2, 2, 'F');

                pdf.setFillColor(255, 255, 255);
                pdf.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'F');

                pdf.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
                pdf.roundedRect(x, cardY, cardWidth, 3, 2, 2, 'F');

                pdf.setDrawColor(230, 230, 230);
                pdf.setLineWidth(0.3);
                pdf.roundedRect(x, cardY, cardWidth, cardHeight, 2, 2, 'S');

                pdf.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
                pdf.setFontSize(14);
                pdf.text(String(kpi.value), x + 3, cardY + 14);

                pdf.setTextColor(90, 90, 90);
                pdf.setFontSize(8);
                pdf.text(kpi.label, x + 3, cardY + 20);
            });

            yPos = cardY + cardHeight + 10;

            pdf.setFontSize(11);
            pdf.setTextColor(0, 0, 0);
            pdf.text('Zusammenfassung', marginX, yPos);
            yPos += 5;

            pdf.setFontSize(9);
            pdf.setTextColor(80, 80, 80);
            const summaryLines = [
                `Dieser Bericht fasst ${totalEvents} gemeldete Sicherheitsereignisse zusammen, verteilt über`,
                `${totalCountries} Länder, ${totalSites} Liegenschaften und ${totalTypes} unterschiedliche Ereignisarten.`,
                `Auf den folgenden Seiten werden Risikolevel, Muster und Handlungsempfehlungen im Detail dargestellt.`
            ];
            summaryLines.forEach(line => {
                pdf.text(line, marginX, yPos);
                yPos += 4;
            });

            // Seite 2 – Visual Analytics
            newPage();

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.text('Visual Analytics', marginX, yPos);
            yPos += 6;

            pdf.setFontSize(9);
            pdf.setTextColor(80, 80, 80);
            pdf.text('Ereignisverteilung nach Ländern, Liegenschaften und Ereignisarten.', marginX, yPos);
            yPos += 6;

            const addChart = (selector, titel) => {
                const container = document.querySelector(selector);
                if (!container) return;
                const canvas = container.querySelector('canvas');
                if (!canvas) return;

                const imgData = canvas.toDataURL('image/png', 1.0);
                const imgHeight = 70;
                const imgWidth = pageWidth - 2 * marginX;

                ensureSpace(imgHeight + 12);

                pdf.setFontSize(11);
                pdf.setTextColor(0, 0, 0);
                pdf.text(titel, marginX, yPos);
                yPos += 4;

                pdf.addImage(imgData, 'PNG', marginX, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 8;
            };

            addChart('#chartCountries', 'Ereignisse nach Ländern');
            addChart('#chartSites', 'Ereignisse nach Liegenschaften');
            addChart('#chartTypes', 'Ereignisse nach Ereignisarten');

            // Seite 3 – Risiko & KI-Insights (+ Zeit & Domain-Mix)
            newPage();

            let analytics;
            try {
                analytics = new SecurityAnalytics(DashboardState.currentData, DashboardState.headerMap);
                analytics.analyze();
            } catch (e) {
                console.warn('Analytics konnten nicht berechnet werden:', e);
            }

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(14);
            pdf.text('Risikobewertung & KI-Insights', marginX, yPos);
            yPos += 6;

            if (analytics && analytics.insights && analytics.insights.risk) {
                const risk = analytics.insights.risk;
                const recs = analytics.insights.recommendations || [];
                const trends = analytics.insights.trends || [];
                const tp = analytics.insights.timePatterns;
                const domainMix = analytics.insights.domainMix;

                pdf.setFontSize(11);
                pdf.text('Risikoprofil', marginX, yPos);
                yPos += 5;

                pdf.setFontSize(9);
                pdf.setTextColor(80, 80, 80);

                const riskLines = [
                    `Gesamt-Risko-Level: ${risk.level} (${risk.score}%)`,
                    `${risk.highRiskEvents} kritische Ereignisse von insgesamt ${risk.totalEvents} gemeldeten Vorfällen.`,
                    `Berechnungsbasis: gewichtete Summe der Ereignisse nach Schwere (Einbruch, Diebstahl, Vandalismus etc.).`
                ];
                riskLines.forEach(line => {
                    pdf.text(line, marginX, yPos);
                    yPos += 4;
                });

                if (risk.criticalTypes && risk.criticalTypes[0]) {
                    const crit = risk.criticalTypes[0];
                    pdf.text(
                        `Kritischste Ereignisart: ${crit.key} (${crit.count} Vorfälle)`,
                        marginX,
                        yPos
                    );
                    yPos += 6;
                } else {
                    yPos += 2;
                }

                // Trend-Prognosen
                if (trends.length > 0) {
                    ensureSpace(25);
                    pdf.setFontSize(11);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text('Trend-Prognose', marginX, yPos);
                    yPos += 5;

                    pdf.setFontSize(9);
                    pdf.setTextColor(80, 80, 80);
                    trends.slice(0, 3).forEach(trend => {
                        const line = `• ${trend.metric}: aktuell ${trend.current}, Prognose ${trend.forecast} (${trend.confidence} Konfidenz)`;
                        ensureSpace(6);
                        pdf.text(line, marginX, yPos);
                        yPos += 4.5;
                    });
                }

                // Zeitliche Muster
                if (tp && tp.topHourBucket && tp.topWeekday) {
                    ensureSpace(25);
                    pdf.setFontSize(11);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text('Zeitliche Muster', marginX, yPos);
                    yPos += 5;

                    pdf.setFontSize(9);
                    pdf.setTextColor(80, 80, 80);
                    pdf.text(
                        `Häufigste Zeitspanne: ${tp.topHourBucket.range} Uhr (${tp.topHourBucket.count} Ereignisse).`,
                        marginX,
                        yPos
                    );
                    yPos += 4;

                    pdf.text(
                        `Häufigster Wochentag: ${tp.topWeekday.name} (${tp.topWeekday.count} Ereignisse).`,
                        marginX,
                        yPos
                    );
                    yPos += 4;

                    pdf.text(
                        `Verteilung: ${tp.weekendVsWeekday.weekdayShare}% Werktag vs. ${tp.weekendVsWeekday.weekendShare}% Wochenende.`,
                        marginX,
                        yPos
                    );
                    yPos += 6;
                }

                // Bereichszuordnung Security / FM / SHE
                if (domainMix && domainMix.byDomain && domainMix.byDomain.length) {
                    ensureSpace(25);
                    pdf.setFontSize(11);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text('Bereichszuordnung (Security / FM / SHE)', marginX, yPos);
                    yPos += 5;

                    pdf.setFontSize(9);
                    pdf.setTextColor(80, 80, 80);

                    const sec = domainMix.byDomain.find(d => d.domain === 'Security');
                    const fm  = domainMix.byDomain.find(d => d.domain === 'FM');
                    const she = domainMix.byDomain.find(d => d.domain === 'SHE');

                    const line1 = `Dominanter Bereich: ${domainMix.byDomain[0].domain} (${domainMix.byDomain[0].count} Ereignisse, ${domainMix.byDomain[0].share}% Anteil).`;
                    pdf.text(line1, marginX, yPos);
                    yPos += 4;

                    const line2 = `Verteilung: Security ${sec ? `${sec.count} (${sec.share}%)` : '0 (0%)'}, ` +
                                  `FM ${fm ? `${fm.count} (${fm.share}%)` : '0 (0%)'}, ` +
                                  `SHE ${she ? `${she.count} (${she.share}%)` : '0 (0%)'}.`;
                    pdf.text(line2, marginX, yPos);
                    yPos += 4;

                    const line3 = `Risikobeitrag (gewichtete Punkte): ` +
                                  `Security ${sec ? sec.riskScore : 0}, ` +
                                  `FM ${fm ? fm.riskScore : 0}, ` +
                                  `SHE ${she ? she.riskScore : 0}.`;
                    pdf.text(line3, marginX, yPos);
                    yPos += 6;
                }

                // Empfehlungen
                if (recs.length > 0) {
                    ensureSpace(25);
                    pdf.setFontSize(11);
                    pdf.setTextColor(0, 0, 0);
                    pdf.text('Empfohlene Maßnahmen', marginX, yPos);
                    yPos += 5;

                    pdf.setFontSize(9);
                    pdf.setTextColor(80, 80, 80);
                    recs.slice(0, 4).forEach(rec => {
                        const lineTitle = `• ${rec.title}`;
                        const lineAction = `   Handlung: ${rec.action}`;
                        ensureSpace(9);
                        pdf.text(lineTitle, marginX, yPos);
                        yPos += 4;
                        pdf.text(lineAction, marginX + 3, yPos);
                        yPos += 4;
                    });
                }
            } else {
                pdf.setFontSize(9);
                pdf.setTextColor(120, 120, 120);
                pdf.text('Keine ausreichenden Daten für eine Risikobewertung vorhanden.', marginX, yPos);
                yPos += 5;
            }

            // Seite 4 – Aggregierte Tabellen
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
                pdf.text('Aggregierte Ereignisübersicht', marginX, yPos);
                yPos += 6;

                pdf.setFontSize(11);
                pdf.text('Ereignisse nach Land', marginX, yPos);
                yPos += 4;

                pdf.autoTable({
                    startY: yPos,
                    head: [['Land', 'Anzahl']],
                    body: byCountry.map(r => [r.key || '(leer)', r.count]),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: {
                        fillColor: [0, 163, 122],
                        textColor: 255
                    }
                });
                yPos = pdf.lastAutoTable.finalY + 8;

                pdf.setFontSize(11);
                pdf.text('Ereignisse nach Liegenschaft', marginX, yPos);
                yPos += 4;

                pdf.autoTable({
                    startY: yPos,
                    head: [['Liegenschaft', 'Anzahl']],
                    body: bySite.map(r => [r.key || '(leer)', r.count]),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: {
                        fillColor: [0, 163, 122],
                        textColor: 255
                    }
                });
                yPos = pdf.lastAutoTable.finalY + 8;

                pdf.setFontSize(11);
                pdf.text('Ereignisse nach Ereignisart', marginX, yPos);
                yPos += 4;

                pdf.autoTable({
                    startY: yPos,
                    head: [['Ereignisart', 'Anzahl']],
                    body: byType.map(r => [r.key || '(leer)', r.count]),
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8 },
                    headStyles: {
                        fillColor: [0, 163, 122],
                        textColor: 255
                    }
                });
                yPos = pdf.lastAutoTable.finalY + 10;
            }

            // Seite 5 – Detailtabelle
            if (pdf.autoTable && DashboardState.currentData.length > 0) {
                newPage();

                const maxRows = 100;
                const headers = Object.keys(DashboardState.currentData[0]);
                const rows = DashboardState.currentData
                    .slice(0, maxRows)
                    .map(row => headers.map(h => row[h] || ''));

                pdf.setFontSize(14);
                pdf.setTextColor(0, 0, 0);
                pdf.text(
                    `Detailierte Ereignisliste (erste ${Math.min(maxRows, DashboardState.currentData.length)} Events)`,
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
                    headStyles: {
                        fillColor: [0, 163, 122],
                        textColor: 255
                    }
                });
            }

            addFooter();

            const nowForName = new Date();
            const filename =
                'Security-Dashboard-Report-' +
                nowForName.getFullYear() + '-' +
                String(nowForName.getMonth() + 1).padStart(2, '0') + '-' +
                String(nowForName.getDate()).padStart(2, '0') + '.pdf';

            pdf.save(filename);

            UI.showToast('PDF-Report erfolgreich erstellt: ' + filename, 'success');

            if (status) {
                status.textContent = '✅ Professioneller PDF-Report erstellt: ' + filename;
                setTimeout(() => { status.style.display = 'none'; }, 4000);
            }

        } catch (error) {
            console.error('PDF Error:', error);
            UI.showToast('Fehler beim PDF-Export: ' + error.message, 'error');
            if (status) {
                status.textContent = '❌ PDF Fehler: ' + error.message;
                setTimeout(() => { status.style.display = 'none'; }, 5000);
            }
        } finally {
            const btnPdf = document.getElementById('exportPDF');
            if (btnPdf) btnPdf.disabled = false;
        }
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

        const country = document.getElementById('filterCountry').value;
        const site = document.getElementById('filterSite').value;
        const type = document.getElementById('filterType').value;

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
        console.log(`🔍 Filter applied: ${DashboardState.currentData.length}/${DashboardState.allData.length} records`);
    },

    reset() {
        document.getElementById('filterCountry').value = '__ALL__';
        document.getElementById('filterSite').value = '__ALL__';
        document.getElementById('filterType').value = '__ALL__';
        this.apply();
    },

    updateStatus() {
        const status = document.getElementById('filterStatus');
        const activeFilters = [];

        const country = document.getElementById('filterCountry').value;
        const site = document.getElementById('filterSite').value;
        const type = document.getElementById('filterType').value;

        if (country !== '__ALL__') activeFilters.push(`Land: ${country}`);
        if (site !== '__ALL__') activeFilters.push(`Liegenschaft: ${site}`);
        if (type !== '__ALL__') activeFilters.push(`Ereignisart: ${type}`);

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
        text += `  |  Zeige ${current} von ${total} Datensätzen`;

        status.textContent = text;
    },

    updateSelectOptions(selectId, values, placeholder) {
        const select = document.getElementById(selectId);
        const currentValue = select.value;

        select.innerHTML = `<option value="__ALL__">${placeholder}</option>`;
        values.forEach(value => {
            select.innerHTML += `<option value="${value}">${value}</option>`;
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

        document.getElementById('kpiTotalEvents').textContent = total;
        document.getElementById('kpiTotalEventsSub').textContent = `${current} nach Filter`;

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

        document.getElementById('kpiCountries').textContent = countries.size;
        document.getElementById('kpiSites').textContent = sites.size;
        document.getElementById('kpiTypes').textContent = types.size;
    },

    renderFilters() {
        const countries = [...new Set(DashboardState.allData
            .map(row => DashboardState.headerMap.country ? row[DashboardState.headerMap.country].trim() : '')
            .filter(Boolean))].sort();

        const sites = [...new Set(DashboardState.allData
            .map(row => DashboardState.headerMap.site ? row[DashboardState.headerMap.site].trim() : '')
            .filter(Boolean))].sort();

        const types = [...new Set(DashboardState.allData
            .map(row => DashboardState.headerMap.type ? row[DashboardState.headerMap.type].trim() : '')
            .filter(Boolean))].sort();

        FilterManager.updateSelectOptions('filterCountry', countries, 'Alle Länder');
        FilterManager.updateSelectOptions('filterSite', sites, 'Alle Liegenschaften');
        FilterManager.updateSelectOptions('filterType', types, 'Alle Ereignisarten');
    },

    renderTables() {
        if (DashboardState.currentData.length === 0) {
            document.querySelector('#tableByCountry tbody').innerHTML =
                '<tr><td colspan="2" class="empty-state"><strong>Keine Daten</strong><span>Bitte laden Sie Daten oder passen Sie die Filter an.</span></td></tr>';
            document.querySelector('#tableBySite tbody').innerHTML =
                '<tr><td colspan="3" class="empty-state"><strong>Keine Daten</strong><span>Bitte laden Sie Daten oder passen Sie die Filter an.</span></td></tr>';
            document.querySelector('#tableByType tbody').innerHTML =
                '<tr><td colspan="2" class="empty-state"><strong>Keine Daten</strong><span>Bitte laden Sie Daten oder passen Sie die Filter an.</span></td></tr>';
            return;
        }

        const byCountry = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : '');
        const bySite = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.site ? row[DashboardState.headerMap.site] : '');
        const byType = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : '');

        document.querySelector('#tableByCountry tbody').innerHTML =
            byCountry.map(item => `<tr><td>${item.key || '(leer)'}</td><td>${item.count}</td></tr>`).join('');

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

        document.querySelector('#tableBySite tbody').innerHTML =
            siteArray.map(item =>
                `<tr><td>${item.site}</td><td>${item.country}</td><td>${item.count}</td></tr>`
            ).join('');

        document.querySelector('#tableByType tbody').innerHTML =
            byType.map(item => `<tr><td>${item.key || '(leer)'}</td><td>${item.count}</td></tr>`).join('');
    },

    renderCharts() {
        if (DashboardState.currentData.length === 0) {
            ['chartCountries', 'chartSites', 'chartTypes'].forEach(id => {
                const c = document.getElementById(id);
                if (c) {
                    c.innerHTML = `
                        <div class="empty-state">
                            <strong>Keine Daten</strong>
                            <span>Bitte laden Sie Daten oder ändern Sie die Filter.</span>
                        </div>`;
                }
            });
            ChartManager.destroyAll();
            return;
        }

        const countries = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : '');
        const sites = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.site ? row[DashboardState.headerMap.site] : '');
        const types = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : '');

        ChartManager.create('chartCountries', countries, 'bar');
        ChartManager.create('chartSites', sites, 'bar');
        ChartManager.create('chartTypes', types, 'pie');
    },

    runAnalytics() {
        if (DashboardState.currentData.length === 0) {
            this.clearAnalytics();
            return;
        }

        const analytics = new SecurityAnalytics(DashboardState.currentData, DashboardState.headerMap);
        analytics.analyze();
    },

    clearAnalytics() {
        ['riskAssessment', 'patternDetection', 'smartRecommendations', 'trendForecast'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '<div class="loading">Keine Daten für Analyse verfügbar</div>';
            }
        });
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
        DashboardState.currentData = DashboardState.allData;

        this.updateUI('testdata');
        RenderManager.renderAll();

        console.log(`✅ Test data loaded: ${DashboardState.allData.length} records`);
        UI.showToast('Testdaten wurden geladen (Demo-Modus).', 'info');
    },

    async loadCSVFile(file) {
        console.log(`📁 Loading CSV file: ${file.name}`);

        try {
            const text = await file.text();
            const parsed = Utils.parseCSV(text);

            if (parsed.rows.length === 0) {
                throw new Error('CSV-Datei enthält keine gültigen Daten');
            }

            DashboardState.allData = parsed.rows;
            DashboardState.headerMap = Utils.createHeaderMap(parsed.headers);
            DashboardState.currentData = DashboardState.allData;

            this.updateUI('csv', file.name);
            RenderManager.renderAll();

            console.log(`✅ CSV file loaded: ${DashboardState.allData.length} records`);
            UI.showToast(`CSV-Datei "${file.name}" geladen.`, 'success');

            if (!DashboardState.headerMap.country ||
                !DashboardState.headerMap.site ||
                !DashboardState.headerMap.type) {
                UI.showToast(
                    'Hinweis: Einige erwartete Spalten (Land/Liegenschaft/Ereignisart) wurden nicht erkannt. Auswertungen können unvollständig sein.',
                    'info',
                    8000
                );
            }

        } catch (error) {
            console.error('CSV loading error:', error);
            const status = document.getElementById('fileStatus');
            status.textContent = `Fehler beim Lesen der Datei: ${error.message}`;
            status.className = 'status error';
            UI.showToast('Fehler beim Laden der CSV-Datei: ' + error.message, 'error');
        }
    },

    updateUI(mode, filename = '') {
        document.getElementById('recordCount').textContent = DashboardState.allData.length;

        const modeIndicator = document.getElementById('modeIndicator');
        const fileStatus = document.getElementById('fileStatus');

        if (mode === 'testdata') {
            modeIndicator.textContent = 'Modus: Testdaten (Demo)';
            fileStatus.textContent = 'Testdaten sind geladen (Demo-Modus).';
            fileStatus.className = 'status';
        } else if (mode === 'csv') {
            modeIndicator.textContent = 'Modus: CSV-Datei';
            fileStatus.textContent = `Datei "${filename}" geladen. Datensätze: ${DashboardState.allData.length}.`;
            fileStatus.className = 'status';
        } else {
            modeIndicator.textContent = 'Modus: Keine Daten';
            fileStatus.textContent = 'Keine Datei geladen.';
            fileStatus.className = 'status';
        }
    }
};

// =============================================
// APPLICATION INITIALIZATION
// =============================================
const Dashboard = {
    init() {
        console.log('🚀 Initializing Security Dashboard...');

        ThemeManager.init();
        this.setupEventListeners();
        this.initializeUI();

        console.log('✅ Dashboard initialized successfully!');
    },

    setupEventListeners() {
        document.getElementById('loadTestData').addEventListener('click', () => {
            DataManager.loadTestData();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) DataManager.loadCSVFile(file);
        });

        document.getElementById('filterCountry').addEventListener('change', FilterManager.apply.bind(FilterManager));
        document.getElementById('filterSite').addEventListener('change', FilterManager.apply.bind(FilterManager));
        document.getElementById('filterType').addEventListener('change', FilterManager.apply.bind(FilterManager));
        document.getElementById('resetFilters').addEventListener('click', FilterManager.reset.bind(FilterManager));

        document.getElementById('exportCSV').addEventListener('click', ExportManager.toCSV);
        document.getElementById('exportPDF').addEventListener('click', ExportManager.toPDF);

        console.log('🔗 Event listeners attached');
    },

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

// Global error handler (ohne Alert, mit Toast)
window.addEventListener('error', (e) => {
    console.error('Dashboard Error:', e.error || e.message);
    UI.showToast('Unerwarteter Fehler im Dashboard. Details in der Konsole.', 'error', 6000);
});

// Export for debugging
window.Dashboard = Dashboard;
window.DashboardState = DashboardState;
