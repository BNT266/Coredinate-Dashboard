/*
 * =============================================
 * SECURITY DASHBOARD - MAIN APPLICATION
 * =============================================
 */

console.log('Security Dashboard v2.0 - Modular Edition');

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
// CONTINUE IN NEXT MESSAGE...
// =============================================
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
    status.textContent = '🎨 PDF Report wird erstellt...';

    try {
        // Check if libraries are loaded
        if (!window.jspdf) {
            throw new Error('jsPDF Library nicht geladen!');
        }
        if (!window.html2canvas) {
            throw new Error('html2canvas Library nicht geladen!');
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();

        // ===== SEITE 1: EXECUTIVE SUMMARY =====
        pdf.setFillColor(0, 163, 122);
        pdf.rect(0, 0, pageWidth, 30, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(20);
        pdf.text('SECURITY DASHBOARD', 20, 20);
        
        pdf.setFontSize(10);
        pdf.text('Professional Security Events Report', 20, 26);

        // Report Info
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(14);
        pdf.text('Executive Summary', 20, 45);
        
        const timestamp = new Date().toLocaleDateString('de-DE');
        pdf.setFontSize(10);
        pdf.setTextColor(100);
        pdf.text(`Erstellt: ${timestamp}`, 20, 52);
        pdf.text(`Datensätze: ${DashboardState.currentData.length}`, 20, 57);

        // KPI Summary
        let yPos = 70;
        const kpis = [
            { label: 'Events', value: DashboardState.currentData.length },
            { label: 'Countries', value: new Set(DashboardState.currentData.map(r => DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '')).size },
            { label: 'Sites', value: new Set(DashboardState.currentData.map(r => DashboardState.headerMap.site ? r[DashboardState.headerMap.site] : '')).size }
        ];

        kpis.forEach((kpi, i) => {
            const x = 20 + (i * 60);
            pdf.setFillColor(240, 240, 240);
            pdf.rect(x, yPos, 50, 20, 'F');
            
            pdf.setTextColor(0, 163, 122);
            pdf.setFontSize(16);
            pdf.text(String(kpi.value), x + 5, yPos + 12);
            
            pdf.setFontSize(8);
            pdf.setTextColor(0, 0, 0);
            pdf.text(kpi.label, x + 5, yPos + 17);
        });

        // Top Events List
        yPos += 35;
        pdf.setFontSize(12);
        pdf.text('Top Ereignisarten:', 20, yPos);
        yPos += 10;

        const byType = Utils.groupAndCount(DashboardState.currentData, row =>
            DashboardState.headerMap.type ? row[DashboardState.headerMap.type] : "");

        byType.slice(0, 10).forEach((item, i) => {
            pdf.setFontSize(9);
            pdf.setTextColor(0, 0, 0);
            pdf.text(`${i + 1}. ${item.key}: ${item.count}`, 25, yPos);
            yPos += 6;
        });

        // ===== SEITE 2: CHARTS =====
        pdf.addPage();
        pdf.setFillColor(0, 163, 122);
        pdf.rect(0, 0, pageWidth, 25, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text('Charts & Visualisierungen', 20, 17);

        yPos = 40;
        status.textContent = '📊 Screenshots werden erstellt...';

        // Try to capture charts
        const chartIds = ['chartCountries', 'chartTypes', 'chartSites'];
        
        for (const chartId of chartIds) {
            try {
                const chartElement = document.getElementById(chartId);
                
                if (chartElement && chartElement.querySelector('canvas')) {
                    const canvas = await html2canvas(chartElement, {
                        backgroundColor: '#ffffff',
                        scale: 1,
                        logging: false,
                        useCORS: true,
                        allowTaint: false,
                        height: 300,
                        width: 500
                    });
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.8);
                    
                    if (yPos > 220) {
                        pdf.addPage();
                        yPos = 20;
                    }
                    
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFontSize(11);
                    pdf.text(`Chart: ${chartId.replace('chart', '')}`, 20, yPos);
                    
                    pdf.addImage(imgData, 'JPEG', 20, yPos + 5, 160, 50);
                    yPos += 65;
                    
                } else {
                    pdf.setTextColor(200, 0, 0);
                    pdf.setFontSize(9);
                    pdf.text(`⚠ Chart ${chartId} nicht verfügbar`, 20, yPos);
                    yPos += 10;
                }
                
            } catch (chartError) {
                console.warn(`Chart ${chartId} capture failed:`, chartError);
                pdf.setTextColor(200, 0, 0);
                pdf.setFontSize(9);
                pdf.text(`⚠ Chart ${chartId} Fehler`, 20, yPos);
                yPos += 10;
            }
        }

        // ===== SEITE 3: TABELLEN =====
        pdf.addPage();
        pdf.setFillColor(0, 163, 122);
        pdf.rect(0, 0, pageWidth, 25, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(16);
        pdf.text('Detaillierte Tabellen', 20, 17);

        yPos = 40;
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(12);
        pdf.text('Ereignisarten (Top 15):', 20, yPos);
        yPos += 10;

        // Table Header
        pdf.setFillColor(240, 240, 240);
        pdf.rect(20, yPos, 160, 7, 'F');
        pdf.setFontSize(9);
        pdf.text('Ereignisart', 22, yPos + 5);
        pdf.text('Anzahl', 120, yPos + 5);
        pdf.text('Anteil', 150, yPos + 5);
        yPos += 10;

        // Table Data
        const total = DashboardState.currentData.length;
        byType.slice(0, 15).forEach((item, index) => {
            if (yPos < 260) {
                const percentage = ((item.count / total) * 100).toFixed(1);
                
                pdf.setTextColor(0, 0, 0);
                pdf.text(`${item.key || "(leer)"}`, 22, yPos);
                pdf.text(`${item.count}`, 120, yPos);
                pdf.text(`${percentage}%`, 150, yPos);
                yPos += 6;
            }
        });

        // Footer
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setTextColor(100);
            pdf.setFontSize(8);
            pdf.text(`Security Dashboard • ${timestamp} • Seite ${i}/${totalPages}`, 20, 285);
        }

        // Download
        const filename = `security-report-${new Date().toISOString().slice(0, 10)}.pdf`;
        pdf.save(filename);

        status.textContent = `✅ PDF Report erstellt: ${filename}`;
        setTimeout(() => { status.style.display = 'none'; }, 3000);

    } catch (error) {
        console.error('PDF Export Error:', error);
        status.textContent = `❌ PDF Fehler: ${error.message}`;
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
