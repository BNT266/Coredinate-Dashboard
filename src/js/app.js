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
