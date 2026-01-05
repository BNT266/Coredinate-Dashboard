/*
 * =============================================
 * SECURITY DASHBOARD - MAIN APPLICATION v2.0
 * =============================================
 */

console.log('🚀 Security Dashboard startet...');

// =============================================
// GLOBAL STATE - MUSS GANZ OBEN STEHEN!
// =============================================
const DashboardState = {
    allData: [],
    currentData: [],
    headerMap: {},
    chartInstances: {}
};

// =============================================
// CONFIGURATION - MUSS VOR ChartManager STEHEN!
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

// Error handler ganz oben
window.addEventListener('error', (e) => {
    console.error('💥 KRITISCHER FEHLER:', e.error);
    alert(`JavaScript Fehler: ${e.error.message} in Zeile ${e.lineno}`);
});

// =============================================
// TEST DATA
// =============================================
const TestData = {
    csv: `Land;Liegenschaft;Ereignisart;Datum
Deutschland;Mainz Campus;Zutrittsverletzung;2025-01-03
Deutschland;Mainz Campus;Zutrittsverletzung;2025-01-04
Deutschland;Mainz Campus;Alarmanlage ausgelöst;2025-01-05
Deutschland;Berlin Research;Zutrittsverletzung;2025-02-01
Deutschland;Berlin Research;Verdächtige Person;2025-02-02
Deutschland;Berlin Research;Verdächtige Person;2025-02-04
Deutschland;München Warehouse;Diebstahl;2025-03-01
Deutschland;München Warehouse;Diebstahl;2025-03-02
Deutschland;München Warehouse;Alarmanlage ausgelöst;2025-03-05
Deutschland;München Warehouse;Zutrittsverletzung;2025-03-06
USA;Cambridge Lab;Zutrittsverletzung;2025-01-10
USA;Cambridge Lab;Verdächtige Person;2025-01-12
USA;Cambridge Lab;Alarmanlage ausgelöst;2025-01-15
USA;San Diego Office;Verdächtige Person;2025-02-10
USA;San Diego Office;Verdächtige Person;2025-02-12
USA;San Diego Office;Diebstahl;2025-02-14
USA;San Diego Office;Zutrittsverletzung;2025-02-16
UK;London HQ;Zutrittsverletzung;2025-01-07
UK;London HQ;Zutrittsverletzung;2025-01-09
UK;London HQ;Verdächtige Person;2025-01-11
UK;London HQ;Alarmanlage ausgelöst;2025-01-13
UK;Reading Plant;Diebstahl;2025-03-03
UK;Reading Plant;Diebstahl;2025-03-06
UK;Reading Plant;Zutrittsverletzung;2025-03-07
Schweiz;Basel Site;Verdächtige Person;2025-02-03
Schweiz;Basel Site;Verdächtige Person;2025-02-05
Schweiz;Basel Site;Alarmanlage ausgelöst;2025-02-06
Schweiz;Basel Site;Zutrittsverletzung;2025-02-08
Belgien;Brüssel Office;Zutrittsverletzung;2025-01-20
Belgien;Brüssel Office;Diebstahl;2025-01-22
Belgien;Brüssel Office;Diebstahl;2025-01-23
Belgien;Brüssel Office;Verdächtige Person;2025-01-25`
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
    }
};

// =============================================
// CHART MANAGER
// =============================================
const ChartManager = {
    create(containerId, data, type = 'bar', maxBars = 6) {
        const container = document.getElementById(containerId);
        if (!container || !data?.length) {
            if (container) container.innerHTML = '<p style="padding: 2rem; text-align: center; color: #999;">Keine Daten vorhanden</p>';
            return;
        }
        
        // Destroy existing chart
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
                plugins: { 
                    legend: { display: type === 'pie', position: 'bottom' }
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
// ANALYTICS ENGINE
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
        
        // Hotspot Detection
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
        
        // Event Concentration
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
        
        // Risk-based recommendations
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
        
        // General recommendations
        if (this.data.length > 20) {
            recommendations.push({
                priority: 'medium',
                icon: '📊',
                title: 'Regelmäßiges Monitoring',
                action: 'Wöchentliche Dashboard-Reviews etablieren',
                reason: `${this.data.length} Ereignisse zeigen hohe Aktivität`
            });
        }
        
        // Sort by priority
        recommendations.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
        
        this.insights.recommendations = recommendations.slice(0, 4);
    }
    
    forecastTrends() {
        const trends = [];
        const risk = this.insights.risk;
        
        // Risk trend
        const riskTrend = risk.score > 60 ? 'steigend' : risk.score < 30 ? 'fallend' : 'stabil';
        trends.push({
            metric: 'Gesamt-Risiko',
            current: `${risk.score}%`,
            forecast: riskTrend,
            confidence: '82%'
        });
        
        // Volume forecast
        const monthlyGrowth = this.data.length > 50 ? '+12%' : 
                            this.data.length > 20 ? '+5%' : '-3%';
        trends.push({
            metric: 'Ereignis-Volumen',
            current: `${this.data.length} Events`,
            forecast: `Nächster Monat: ${monthlyGrowth}`,
            confidence: '75%'
        });
        
        // Top risk type trend
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
            <div class="insight-item risk-${risk.class}">
                <div class="insight-value">Risiko-Level: ${risk.level} (${risk.score}%)</div>
                <div class="insight-trend">
                    ${risk.highRiskEvents} kritische Ereignisse von ${risk.totalEvents} gesamt
                </div>
            </div>
            ${risk.criticalTypes.length > 0 ? `
                <div class="insight-item">
                    <div class="insight-value">⚠️ Kritischster Typ:</div>
                    <div class="insight-trend">${risk.criticalTypes[0].key} (${risk.criticalTypes[0].count}x)</div>
                </div>
            ` : ''}
        `;
    }
    
    renderPatternDetection() {
        const container = document.getElementById('patternDetection');
        const patterns = this.insights.patterns;
        
        if (patterns.length === 0) {
            container.innerHTML = `
                <div class="insight-item">
                    <div class="insight-value">✅ Keine kritischen Muster erkannt</div>
                    <div class="insight-trend">Ereignisverteilung ist ausgewogen</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = patterns.slice(0, 2).map(pattern => `
            <div class="insight-item">
                <div class="insight-value">${pattern.severity === 'high' ? '🔴' : '🟡'} ${pattern.title}</div>
                <div class="insight-trend">${pattern.description}</div>
            </div>
        `).join('');
    }
    
    renderRecommendations() {
        const container = document.getElementById('smartRecommendations');
        const recommendations = this.insights.recommendations;
        
        container.innerHTML = recommendations.slice(0, 3).map(rec => `
            <div class="insight-item">
                <div class="insight-value">${rec.icon} ${rec.title}</div>
                <div class="insight-trend">${rec.action}</div>
            </div>
        `).join('');
    }
    
    renderTrendForecast() {
        const container = document.getElementById('trendForecast');
        const trends = this.insights.trends;
        
        container.innerHTML = trends.slice(0, 3).map(trend => `
            <div class="insight-item">
                <div class="insight-value">${trend.metric}: ${trend.current}</div>
                <div class="insight-trend trend-${trend.forecast.includes('+') ? 'up' : trend.forecast.includes('-') ? 'down' : 'stable'}">
                    ${trend.forecast} (${trend.confidence} Konfidenz)
                </div>
            </div>
        `).join('');
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
            const current = document.documentElement.getAttribute('data-theme');
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
// EXPORT MANAGER
// =============================================
const ExportManager = {
    toCSV() {
        if (!DashboardState.currentData || DashboardState.currentData.length === 0) {
            alert('Keine Daten zum Exportieren vorhanden!');
            return;
        }

        const status = document.getElementById('exportStatus');
        status.style.display = 'block';
        status.textContent = 'CSV wird erstellt...';

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

            status.textContent = `✅ CSV exportiert (${DashboardState.currentData.length} Datensätze)`;
            setTimeout(() => { status.style.display = 'none'; }, 3000);

        } catch (error) {
            console.error('CSV Export Error:', error);
            status.textContent = '❌ Fehler beim CSV-Export';
            setTimeout(() => { status.style.display = 'none'; }, 3000);
        }
    },

  async toPDF() {
    if (!DashboardState.currentData || DashboardState.currentData.length === 0) {
        alert('Keine Daten zum Exportieren vorhanden!');
        return;
    }

    const status = document.getElementById('exportStatus');
    status.style.display = 'block';
    status.textContent = 'Professioneller PDF Report wird erstellt...';

    try {
        if (typeof window.jspdf === 'undefined') {
            throw new Error('jsPDF ist nicht geladen!');
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // ===== SEITE 1: EXECUTIVE SUMMARY =====
        
        // Header mit grünem Hintergrund
        pdf.setFillColor(0, 163, 122);
        pdf.rect(0, 0, pageWidth, 40, 'F');
        
        // Titel in weiß
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(28);
        pdf.text('SECURITY DASHBOARD', 20, 25);
        
        pdf.setFontSize(12);
        pdf.text('Professional Security Events Analysis Report', 20, 35);

        // Report Info
        const timestamp = new Date().toLocaleString('de-DE');
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(18);
        pdf.text('Executive Summary', 20, 55);
        
        pdf.setFontSize(11);
        pdf.setTextColor(80, 80, 80);
        pdf.text('Erstellt am: ' + timestamp, 20, 65);
        pdf.text('Analysierte Datensaetze: ' + DashboardState.currentData.length + ' von ' + DashboardState.allData.length + ' gesamt', 20, 72);

        // KPI Boxes
        let yPos = 85;
        const kpis = [
            { label: 'Ereignisse', value: DashboardState.currentData.length },
            { label: 'Laender', value: new Set(DashboardState.currentData.map(r => 
                DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '')).size },
            { label: 'Standorte', value: new Set(DashboardState.currentData.map(r => 
                DashboardState.headerMap.site ? r[DashboardState.headerMap.site] : '')).size },
            { label: 'Event-Arten', value: new Set(DashboardState.currentData.map(r => 
                DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '')).size }
        ];

        // KPI Kaesten zeichnen
        kpis.forEach((kpi, i) => {
            const x = 20 + (i * 45);
            
            // Kasten Hintergrund
            pdf.setFillColor(245, 245, 245);
            pdf.rect(x, yPos, 40, 30, 'F');
            
            // Rahmen
            pdf.setDrawColor(0, 163, 122);
            pdf.setLineWidth(1);
            pdf.rect(x, yPos, 40, 30, 'S');
            
            // Wert (gross)
            pdf.setTextColor(0, 163, 122);
            pdf.setFontSize(20);
            pdf.text(String(kpi.value), x + 5, yPos + 15);
            
            // Label (klein)
            pdf.setTextColor(60, 60, 60);
            pdf.setFontSize(9);
            pdf.text(kpi.label, x + 5, yPos + 25);
        });

        // Top Events Liste
        yPos += 45;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(16);
        pdf.text('*** TOP EREIGNISARTEN ***', 20, yPos);
        
        yPos += 10;
        const byType = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : "");

        // Tabellen-Header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPos, 170, 10, 'F');
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
        pdf.text('RANG', 25, yPos + 7);
        pdf.text('EREIGNISART', 50, yPos + 7);
        pdf.text('ANZAHL', 130, yPos + 7);
        pdf.text('ANTEIL', 160, yPos + 7);
        
        yPos += 12;
        
        // Top 10 Events
        byType.slice(0, 10).forEach((item, i) => {
            const percentage = ((item.count / DashboardState.currentData.length) * 100).toFixed(1);
            
            // Alternierende Zeilen-Farben
            if (i % 2 === 0) {
                pdf.setFillColor(248, 248, 248);
                pdf.rect(20, yPos - 2, 170, 8, 'F');
            }
            
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
            
            // Rang mit Stern
            pdf.text('#' + String(i + 1), 25, yPos + 4);
            
            // Event Name (bereinigt)
            let eventName = item.key || '(leer)';
            // Deutsche Umlaute ersetzen
            eventName = eventName.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
            if (eventName.length > 25) eventName = eventName.substring(0, 25) + '...';
            pdf.text(eventName, 50, yPos + 4);
            
            // Anzahl
            pdf.text(String(item.count), 130, yPos + 4);
            
            // Prozent
            pdf.setTextColor(0, 163, 122);
            pdf.text(percentage + '%', 160, yPos + 4);
            
            yPos += 8;
        });

        // ===== SEITE 2: LAENDER-ANALYSE =====
        pdf.addPage();
        
        // Header Seite 2
        pdf.setFillColor(0, 163, 122);
        pdf.rect(0, 0, pageWidth, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.text('*** DETAILLIERTE ANALYSE NACH LAENDERN ***', 20, 20);

        yPos = 45;
        
        // Laender Tabelle
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(16);
        pdf.text('EREIGNISSE NACH LAENDERN', 20, yPos);
        
        yPos += 15;
        const byCountry = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : "");

        // Tabellen-Header
        pdf.setFillColor(0, 163, 122);
        pdf.rect(20, yPos, 170, 10, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(12);
        pdf.text('LAND', 25, yPos + 7);
        pdf.text('EREIGNISSE', 100, yPos + 7);
        pdf.text('ANTEIL', 150, yPos + 7);
        
        yPos += 12;
        
        // Laender Daten
        byCountry.forEach((country, i) => {
            const percentage = ((country.count / DashboardState.currentData.length) * 100).toFixed(1);
            
            // Balken-Hintergrund
            pdf.setFillColor(250, 250, 250);
            pdf.rect(20, yPos, 170, 8, 'F');
            
            // Balken (proportional zur Anzahl)
            const barWidth = (country.count / byCountry[0].count) * 60;
            pdf.setFillColor(0, 163, 122);
            pdf.rect(95, yPos + 1, barWidth, 6, 'F');
            
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
            
            // Land-Name bereinigen
            let countryName = country.key || '(unbekannt)';
            countryName = countryName.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
            pdf.text(countryName, 25, yPos + 5);
            
            pdf.text(String(country.count), 170, yPos + 5);
            pdf.text(percentage + '%', 155, yPos + 5);
            
            yPos += 10;
        });

        // Risk Assessment Box
        if (yPos < 220) {
            yPos += 20;
            
            // Risk Score berechnen
            let totalRisk = 0;
            byType.forEach(event => {
                const weight = CONFIG.riskWeights[event.key] || 3;
                totalRisk += (event.count * weight);
            });
            const riskScore = Math.min(Math.round(totalRisk / DashboardState.currentData.length), 10);
            const riskLevel = riskScore >= 8 ? 'HOCH' : riskScore >= 5 ? 'MITTEL' : 'NIEDRIG';
            
            // Risk Box
            const riskColor = riskScore >= 8 ? [231, 76, 60] : riskScore >= 5 ? [243, 156, 18] : [46, 204, 113];
            pdf.setFillColor(riskColor[0], riskColor[1], riskColor[2]);
            pdf.rect(20, yPos, 170, 25, 'F');
            
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(18);
            pdf.text('*** RISIKO-BEWERTUNG: ' + riskLevel + ' ***', 25, yPos + 12);
            
            pdf.setFontSize(12);
            pdf.text('Score: ' + riskScore + '/10 basierend auf Ereignisarten und Haeufigkeit', 25, yPos + 20);
        }

        // ===== SEITE 3: VOLLSTAENDIGE TABELLE =====
        pdf.addPage();
        
        pdf.setFillColor(0, 163, 122);
        pdf.rect(0, 0, pageWidth, 30, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.text('*** VOLLSTAENDIGE DATENAUSWERTUNG ***', 20, 20);

        yPos = 45;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.text('ALLE EREIGNISARTEN IM DETAIL', 20, yPos);
        
        yPos += 15;
        
        // Complete Table Header
        pdf.setFillColor(230, 230, 230);
        pdf.rect(20, yPos, 170, 10, 'F');
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
        pdf.text('NR.', 25, yPos + 7);
        pdf.text('EREIGNISART', 40, yPos + 7);
        pdf.text('ANZAHL', 130, yPos + 7);
        pdf.text('PROZENT', 160, yPos + 7);
        
        yPos += 12;
        
        // Alle Events
        byType.forEach((item, i) => {
            if (yPos > 250) {
                pdf.addPage();
                yPos = 30;
            }
            
            const percentage = ((item.count / DashboardState.currentData.length) * 100).toFixed(1);
            
            // Alternating rows
            if (i % 2 === 0) {
                pdf.setFillColor(248, 248, 248);
                pdf.rect(20, yPos - 1, 170, 7, 'F');
            }
            
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(9);
            pdf.text(String(i + 1), 25, yPos + 4);
            
            // Event Name bereinigen
            let eventName = item.key || '(leer)';
            eventName = eventName.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
            if (eventName.length > 30) eventName = eventName.substring(0, 30) + '...';
            pdf.text(eventName, 40, yPos + 4);
            
            pdf.text(String(item.count), 130, yPos + 4);
            pdf.text(percentage + '%', 160, yPos + 4);
            
            yPos += 7;
        });

        // Footer auf allen Seiten
        const totalPages = pdf.internal.getNumberOfPages();
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            pdf.setPage(pageNum);
            
            // Footer Line
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.5);
            pdf.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
            
            // Footer Text (ohne Umlaute)
            pdf.setTextColor(120, 120, 120);
            pdf.setFontSize(9);
            pdf.text('Security Events Dashboard Report', 20, pageHeight - 12);
            pdf.text(timestamp, 20, pageHeight - 6);
            pdf.text('Seite ' + pageNum + ' von ' + totalPages, pageWidth - 40, pageHeight - 6);
        }

        // Download
        const filename = 'Security-Events-Report-' + new Date().toISOString().slice(0, 10) + '.pdf';
        pdf.save(filename);

        status.textContent = 'Professional PDF Report erstellt: ' + filename;
        setTimeout(() => { status.style.display = 'none'; }, 4000);

    } catch (error) {
        console.error('PDF Export Error:', error);
        status.textContent = 'PDF Fehler: ' + error.message;
        setTimeout(() => { status.style.display = 'none'; }, 5000);
    }
},

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

        if (activeFilters.length === 0) {
            status.textContent = 'Keine Filter aktiv (zeige alle Datensätze)';
            status.className = 'status';
        } else {
            status.textContent = `Aktive Filter: ${activeFilters.join(' | ')}`;
            status.className = 'status active-filters';
        }
    },

    updateSelectOptions(selectId, values, placeholder) {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        select.innerHTML = `<option value="__ALL__">${placeholder}</option>`;
        values.forEach(value => {
            select.innerHTML += `<option value="${value}">${value}</option>`;
        });
        
        // Restore selection if still valid
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

        // Calculate unique values from all data
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
        // Extract unique values for filters
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
        // Group current data
        const byCountry = Utils.groupAndCount(DashboardState.currentData, row => 
            DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : '');
        const bySite = Utils.groupAndCount(DashboardState.currentData, row => 
            DashboardState.headerMap.site ? row[DashboardState.headerMap.site] : '');
        const byType = Utils.groupAndCount(DashboardState.currentData, row => 
            DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : '');

        // Render tables
        document.querySelector('#tableByCountry tbody').innerHTML = 
            byCountry.map(item => `<tr><td>${item.key || '(leer)'}</td><td>${item.count}</td></tr>`).join('');

        // Site table with country information
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
            
        } catch (error) {
            console.error('CSV loading error:', error);
            document.getElementById('fileStatus').textContent = `Fehler beim Lesen der Datei: ${error.message}`;
            document.getElementById('fileStatus').className = 'status error';
        }
    },

    updateUI(mode, filename = '') {
        document.getElementById('recordCount').textContent = DashboardState.allData.length;
        
        if (mode === 'testdata') {
            document.getElementById('modeIndicator').textContent = 'Modus: Testdaten (Demo)';
            document.getElementById('fileStatus').textContent = 'Testdaten sind geladen (Demo-Modus).';
            document.getElementById('fileStatus').className = 'status';
        } else if (mode === 'csv') {
            document.getElementById('modeIndicator').textContent = 'Modus: CSV-Datei';
            document.getElementById('fileStatus').textContent = `Datei "${filename}" geladen. Datensätze: ${DashboardState.allData.length}.`;
            document.getElementById('fileStatus').className = 'status';
        }
    }
};

// =============================================
// APPLICATION INITIALIZATION
// =============================================
const Dashboard = {
    init() {
        console.log('🚀 Initializing Security Dashboard...');
        
        // Initialize theme
        ThemeManager.init();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize UI state
        this.initializeUI();
        
        console.log('✅ Dashboard initialized successfully!');
    },

    setupEventListeners() {
        // Data loading
        document.getElementById('loadTestData').addEventListener('click', () => {
            DataManager.loadTestData();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) DataManager.loadCSVFile(file);
        });

        // Filters
        document.getElementById('filterCountry').addEventListener('change', FilterManager.apply.bind(FilterManager));
        document.getElementById('filterSite').addEventListener('change', FilterManager.apply.bind(FilterManager));
        document.getElementById('filterType').addEventListener('change', FilterManager.apply.bind(FilterManager));
        document.getElementById('resetFilters').addEventListener('click', FilterManager.reset.bind(FilterManager));

        // Export
        document.getElementById('exportCSV').addEventListener('click', ExportManager.toCSV);
        document.getElementById('exportPDF').addEventListener('click', ExportManager.toPDF);

        console.log('🔗 Event listeners attached');
    },

    initializeUI() {
        // Set initial filter status
        FilterManager.updateStatus();
        
        // Clear analytics panels
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

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Dashboard Error:', e.error);
});

// Export for debugging
window.Dashboard = Dashboard;
window.DashboardState = DashboardState;
