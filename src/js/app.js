/* =============================================
  SECURITY EVENT DASHBOARD — app.js v5
  ============================================= */
'use strict';
console.log('🚀 Security Dashboard v5 startet...');
// === GLOBAL STATE ===
const DashboardState = {
   allData: [],
   currentData: [],
   headerMap: {},
   chartInstances: {},
   isInitialized: false,
   timelineChartType: 'line'
};
// === CONFIG ===
const CONFIG = {
   riskWeights: {
       'Diebstahl': 9, 'Verdächtige Person': 7, 'Zutrittsverletzung': 6,
       'Alarmanlage ausgelöst': 5, 'Vandalismus': 8, 'Einbruch': 10, 'Brandschutz': 9
   },
   chartPalette: {
       light: ['#00a37a','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#10b981','#f97316'],
       dark:  ['#34d399','#60a5fa','#fbbf24','#a78bfa','#f87171','#22d3ee','#4ade80','#fb923c']
   }
};
// === i18n ===
const i18n = {
   current: 'de',
   set(lang) { this.current = ['de','en'].includes(lang) ? lang : 'de'; },
   t(key, vars) {
       vars = vars || {};
       const str = (this.strings[key] && this.strings[key][this.current]) || key;
       return str.replace(/\{\{(\w+)\}\}/g, (_, v) => vars[v] !== undefined ? String(vars[v]) : '');
   },
   strings: {
       pdf_title:                { de: 'SECURITY DASHBOARD', en: 'SECURITY DASHBOARD' },
       pdf_subtitle:             { de: 'Executive Summary & Risk Overview', en: 'Executive Summary & Risk Overview' },
       pdf_created_at:           { de: 'Erstellt: {{date}}', en: 'Generated: {{date}}' },
       section_executive_summary:{ de: 'Executive Summary', en: 'Executive Summary' },
       section_aggregated_overview:{ de: 'Aggregierte Uebersicht', en: 'Aggregated Overview' },
       key_facts_line:           { de: 'Events: {{events}} | Laender: {{countries}} | Liegenschaften: {{sites}} | Typen: {{types}}', en: 'Events: {{events}} | Countries: {{countries}} | Sites: {{sites}} | Types: {{types}}' },
       table_country_header:     { de: 'Land', en: 'Country' },
       table_site_header:        { de: 'Liegenschaft', en: 'Site' },
       table_type_header:        { de: 'Ereignisart', en: 'Event Type' },
       table_count_header:       { de: 'Anzahl', en: 'Count' },
       chart_countries_title:    { de: 'Nach Laendern', en: 'By Country' },
       chart_sites_title:        { de: 'Nach Liegenschaften', en: 'By Site' },
       chart_types_title:        { de: 'Nach Ereignisart', en: 'By Type' },
       chart_domains_title:      { de: 'Bereichsverteilung', en: 'Domain Distribution' },
       chart_timeline_title:     { de: 'Zeitverlauf', en: 'Timeline' },
       footer_left:              { de: 'Security Dashboard – Konzernreport', en: 'Security Dashboard – Corporate Report' },
       footer_page:              { de: 'Seite {{page}}', en: 'Page {{page}}' },
       toast_testdata_loaded:    { de: '✅ Testdaten geladen', en: '✅ Test data loaded' },
       toast_csv_loaded:         { de: '✅ CSV geladen: {{filename}}', en: '✅ CSV loaded: {{filename}}' },
       toast_no_data:            { de: 'Keine Daten vorhanden', en: 'No data available' },
       toast_csv_success:        { de: '✅ CSV exportiert ({{count}} Zeilen)', en: '✅ CSV exported ({{count}} rows)' },
       toast_pdf_start:          { de: 'PDF wird erstellt...', en: 'Creating PDF...' },
       toast_pdf_success:        { de: '✅ PDF erstellt: {{file}}', en: '✅ PDF created: {{file}}' },
       toast_pdf_error:          { de: 'PDF Fehler: {{error}}', en: 'PDF Error: {{error}}' },
       pdf_filename:             { de: 'Security-Report-{{date}}.pdf', en: 'Security-Report-{{date}}.pdf' },
       ai_risk_label:            { de: 'Risiko', en: 'Risk' },
       ai_maturity_label:        { de: 'Reifegrad', en: 'Maturity level' },
       ai_dominant_domain_line:  { de: 'Dominanter Bereich: {{domain}} – {{count}} Events ({{share}}%).', en: 'Dominant domain: {{domain}} – {{count}} events ({{share}}%).' },
       ai_domain_distribution_line: { de: 'Verteilung – Security: {{sec}}, FM: {{fm}}, SHE: {{she}}, Other: {{other}}.', en: 'Distribution – Security: {{sec}}, FM: {{fm}}, SHE: {{she}}, Other: {{other}}.' },
       ai_top_countries_line:    { de: 'Top-Länder: {{items}}.', en: 'Top countries: {{items}}.' },
       ai_top_sites_line:        { de: 'Top-Standorte: {{items}}.', en: 'Top sites: {{items}}.' },
       ai_top_types_line:        { de: 'Top-Ereignisarten: {{items}}.', en: 'Top event types: {{items}}.' },
       ai_time_pattern_line:     { de: 'Zeitliche Muster: {{parts}}.', en: 'Temporal patterns: {{parts}}.' },
       ai_recommendations_heading:{ de: 'Handlungsempfehlungen (Auszug)', en: 'Selected recommendations' },
       ai_trend_heading:         { de: 'Trend & Prognose', en: 'Trend & Forecast' }
   }
};
// === TEST DATA ===
const TestData = {
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
const Utils = {
   parseCSV(text) {
       if (!text) return { headers: [], rows: [] };
       const lines = text.split(/\r?\n/).filter(l => l.trim());
       if (!lines.length) return { headers: [], rows: [] };
       const delim = lines[0].indexOf(';') >= 0 ? ';' : ',';
       const headers = lines[0].split(delim).map(h => h.trim());
       const rows = [];
       for (let i = 1; i < lines.length; i++) {
           const cells = lines[i].split(delim);
           const row = {};
           headers.forEach((h, j) => { row[h] = (cells[j] || '').trim(); });
           rows.push(row);
       }
       return { headers, rows };
   },
   createHeaderMap(headers) {
       const map = {};
       headers.forEach(h => {
           const l = h.toLowerCase();
           if (l.includes('land') || l.includes('country')) map.country = h;
           if (l.includes('liegenschaft') || l.includes('site')) map.site = h;
           if (l.includes('ereignis') || l.includes('event') || l.includes('typ')) map.type = h;
           if (l.includes('datum') || l.includes('date')) map.date = h;
       });
       return map;
   },
   groupAndCount(data, keyFn) {
       const map = {};
       data.forEach(r => { const k = keyFn(r); if (k) map[k] = (map[k] || 0) + 1; });
       return Object.entries(map).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
   },
   classifyCategory(row, headerMap) {
       const text = (headerMap.type && row[headerMap.type] || '').toLowerCase();
       const security = ['diebstahl','einbruch','vandalismus','zutritt','verdaechtig','alarm','security'];
       const fm       = ['facility','aufzug','klima','heizung','wartung','stromausfall'];
       const she      = ['unfall','verletzung','brandschutz','brand','evakuierung'];
       if (security.some(k => text.includes(k))) return 'Security';
       if (fm.some(k => text.includes(k))) return 'FM';
       if (she.some(k => text.includes(k))) return 'SHE';
       return 'Other';
   },
   escapeHtml(str) {
       if (!str) return '';
       return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
   },
   formatDate(d) {
       return d.toLocaleDateString('de-DE') + ' ' +
           d.toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
   },
   // Get chart colors based on current theme
   getColors(count) {
       const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
       const palette = isDark ? CONFIG.chartPalette.dark : CONFIG.chartPalette.light;
       const colors = [];
       for (let i = 0; i < count; i++) colors.push(palette[i % palette.length]);
       return colors;
   },
   // Group events by month for timeline
   groupByMonth(data, headerMap) {
       const map = {};
       data.forEach(r => {
           if (!headerMap.date) return;
           const raw = r[headerMap.date];
           if (!raw) return;
           const d = new Date(raw);
           if (isNaN(d.getTime())) return;
           const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2,'0');
           map[key] = (map[key] || 0) + 1;
       });
       const keys = Object.keys(map).sort();
       return { labels: keys.map(k => { const [y,m] = k.split('-'); return `${m}/${y}`; }), values: keys.map(k => map[k]) };
   }
};
// === ANIMATED COUNTER ===
const AnimCounter = {
   animate(el, target, duration) {
       if (!el) return;
       duration = duration || 600;
       const start = parseInt(el.textContent) || 0;
       const diff  = target - start;
       if (diff === 0) return;
       const startTime = performance.now();
       const step = (now) => {
           const elapsed = now - startTime;
           const progress = Math.min(elapsed / duration, 1);
           const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
           el.textContent = Math.round(start + diff * eased);
           if (progress < 1) requestAnimationFrame(step);
       };
       requestAnimationFrame(step);
   }
};
// === UI ===
const UI = {
   showToast(message, type, timeout) {
       type    = type    || 'info';
       timeout = timeout || 4000;
       const container = document.getElementById('toastContainer');
       if (!container) return;
       const div = document.createElement('div');
       div.className  = 'toast toast-' + type;
       div.textContent = message;
       container.appendChild(div);
       setTimeout(() => {
           div.style.transition = 'opacity 300ms ease, transform 300ms ease';
           div.style.opacity    = '0';
           div.style.transform  = 'translateX(16px)';
           setTimeout(() => div.remove(), 300);
       }, timeout);
   },
   updateText(id, text) {
       const el = document.getElementById(id);
       if (el) el.textContent = text;
   }
};
// === CHART MANAGER ===
const ChartManager = {
   getChartDefaults() {
       const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
       return {
           gridColor:   isDark ? 'rgba(148,163,184,0.10)' : 'rgba(0,0,0,0.06)',
           tickColor:   isDark ? '#8a9ab8' : '#6b7280',
           legendColor: isDark ? '#e8ecf2' : '#111827',
           bgColor:     isDark ? '#132035'  : '#ffffff'
       };
   },
   create(containerId, data, type, maxBars) {
       type    = type    || 'bar';
       maxBars = maxBars || 6;
       const container = document.getElementById(containerId);
       if (!container) return;
       if (!data || !data.length) {
           container.innerHTML = '<div class="empty-state"><strong>Keine Daten</strong></div>';
           return;
       }
       if (DashboardState.chartInstances[containerId]) {
           DashboardState.chartInstances[containerId].destroy();
           delete DashboardState.chartInstances[containerId];
       }
       container.innerHTML = '<canvas></canvas>';
       const canvas    = container.querySelector('canvas');
       const chartData = data.slice(0, maxBars);
       const labels    = chartData.map(d => d.key || '(leer)');
       const values    = chartData.map(d => d.count);
       const colors    = Utils.getColors(values.length);
       const defaults  = this.getChartDefaults();
       const isPie     = type === 'pie' || type === 'doughnut';
       const config = {
           type,
           data: {
               labels,
               datasets: [{
                   label: 'Anzahl',
                   data: values,
                   backgroundColor: isPie
                       ? colors.map(c => c + 'cc')
                       : colors.map(c => c + '33'),
                   borderColor:    colors,
                   borderWidth:    isPie ? 2 : 2,
                   borderRadius:   isPie ? 0 : 4,
                   hoverBackgroundColor: isPie ? colors.map(c => c + 'ee') : colors.map(c => c + '66'),
                   fill: false
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               animation: { duration: 500, easing: 'easeOutQuart' },
               plugins: {
                   legend: {
                       display: isPie,
                       position: 'bottom',
                       labels: { color: defaults.legendColor, font: { size: 11, family: "'DM Sans', sans-serif" }, padding: 12, boxWidth: 12 }
                   },
                   tooltip: {
                       callbacks: {
                           label(ctx) { return ` ${ctx.parsed.y ?? ctx.parsed} Events`; }
                       }
                   }
               },
               scales: isPie ? {} : {
                   y: {
                       beginAtZero: true,
                       ticks: { stepSize: 1, color: defaults.tickColor, font: { size: 11 } },
                       grid: { color: defaults.gridColor }
                   },
                   x: {
                       ticks: { color: defaults.tickColor, font: { size: 11 }, maxRotation: 30 },
                       grid: { display: false }
                   }
               }
           }
       };
       // horizontal bar for sites
       if (containerId === 'chartSites') {
           config.type = 'bar';
           config.options.indexAxis = 'y';
           if (config.options.scales.x) {
               config.options.scales.x.ticks.maxRotation = 0;
           }
       }
       try {
           DashboardState.chartInstances[containerId] = new Chart(canvas, config);
       } catch(e) { console.error('Chart error:', e); }
   },
   createTimeline(data, type) {
       type = type || DashboardState.timelineChartType || 'line';
       const container = document.getElementById('chartTimeline');
       const section   = document.getElementById('timelineSection');
       if (!container) return;
       const { labels, values } = Utils.groupByMonth(data, DashboardState.headerMap);
       if (!labels.length) {
           if (section) section.style.display = 'none';
           return;
       }
       if (section) section.style.display = '';
       if (DashboardState.chartInstances['chartTimeline']) {
           DashboardState.chartInstances['chartTimeline'].destroy();
           delete DashboardState.chartInstances['chartTimeline'];
       }
       container.innerHTML = '<canvas></canvas>';
       const canvas   = container.querySelector('canvas');
       const defaults = this.getChartDefaults();
       const isDark   = document.documentElement.getAttribute('data-theme') === 'dark';
       const mainColor = isDark ? '#34d399' : '#00a37a';
       const config = {
           type,
           data: {
               labels,
               datasets: [{
                   label: 'Events',
                   data: values,
                   borderColor: mainColor,
                   backgroundColor: type === 'line'
                       ? (ctx => {
                           const g = ctx.chart.ctx.createLinearGradient(0,0,0,ctx.chart.height);
                           g.addColorStop(0, mainColor + '44');
                           g.addColorStop(1, mainColor + '00');
                           return g;
                       })
                       : mainColor + '55',
                   borderWidth: 2.5,
                   pointRadius: 4,
                   pointHoverRadius: 6,
                   pointBackgroundColor: mainColor,
                   tension: 0.4,
                   fill: type === 'line',
                   borderRadius: type === 'bar' ? 4 : 0
               }]
           },
           options: {
               responsive: true,
               maintainAspectRatio: false,
               animation: { duration: 600, easing: 'easeOutQuart' },
               plugins: {
                   legend: { display: false },
                   tooltip: {
                       callbacks: {
                           label(ctx) { return ` ${ctx.parsed.y} Events`; }
                       }
                   }
               },
               scales: {
                   y: {
                       beginAtZero: true,
                       ticks: { stepSize: 1, color: defaults.tickColor, font: { size: 11 } },
                       grid: { color: defaults.gridColor }
                   },
                   x: {
                       ticks: { color: defaults.tickColor, font: { size: 11 } },
                       grid: { display: false }
                   }
               }
           }
       };
       try {
           DashboardState.chartInstances['chartTimeline'] = new Chart(canvas, config);
       } catch(e) { console.error('Timeline chart error:', e); }
   },
   destroyAll() {
       Object.values(DashboardState.chartInstances).forEach(c => { try { c.destroy(); } catch(e) {} });
       DashboardState.chartInstances = {};
   },
   refreshAll() {
       // Recreate all charts with new theme colors
       RenderManager.renderCharts();
   }
};
// === ANALYTICS ===
function SecurityAnalytics(data, headerMap) {
   this.data      = data      || [];
   this.headerMap = headerMap || {};
   this.insights  = {};
}
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
SecurityAnalytics.prototype.calculateRisk = function() {
   const self   = this;
   const byType = Utils.groupAndCount(this.data, r => self.headerMap.type ? r[self.headerMap.type] : '');
   let total = 0, max = 0, high = 0;
   byType.forEach(e => {
       const w = CONFIG.riskWeights[e.key] || 3;
       total += e.count * w;
       max   += e.count * 10;
       if (w >= 8) high += e.count;
   });
   const score = Math.round((total / Math.max(max, 1)) * 100);
   const level = score >= 70 ? 'HOCH' : score >= 40 ? 'MITTEL' : 'NIEDRIG';
   this.insights.risk = {
       score, level,
       riskClass:      score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
       highRiskEvents: high,
       totalEvents:    this.data.length,
       criticalTypes:  byType.filter(e => (CONFIG.riskWeights[e.key] || 0) >= 8),
       byType
   };
};
SecurityAnalytics.prototype.analyzeDomains = function() {
   const self   = this;
   const counts = { Security:0, FM:0, SHE:0, Other:0 };
   this.data.forEach(r => { counts[Utils.classifyCategory(r, self.headerMap)]++; });
   const total = this.data.length || 1;
   this.insights.domains = Object.entries(counts)
       .map(([domain, count]) => ({ domain, count, share: Math.round((count / total) * 100) }))
       .sort((a,b) => b.count - a.count);
};
SecurityAnalytics.prototype.analyzeLocationsAndTypes = function() {
   const self = this;
   const bySite = {}, byCountry = {}, byType = {};
   this.data.forEach(r => {
       const c = self.headerMap.country ? r[self.headerMap.country] : '';
       const s = self.headerMap.site    ? r[self.headerMap.site]    : '';
       const t = self.headerMap.type    ? r[self.headerMap.type]    : '';
       if (c) byCountry[c] = (byCountry[c] || 0) + 1;
       if (s) bySite[s]    = (bySite[s]    || 0) + 1;
       if (t) byType[t]    = (byType[t]    || 0) + 1;
   });
   const toArr = map => Object.entries(map).map(([key,count]) => ({key,count})).sort((a,b)=>b.count-a.count);
   this.insights.topCountries = toArr(byCountry).slice(0,3);
   this.insights.topSites     = toArr(bySite).slice(0,3);
   this.insights.topTypes     = toArr(byType).slice(0,3);
};
SecurityAnalytics.prototype.analyzeTemporalPatterns = function() {
   const self     = this;
   const byHour    = new Array(24).fill(0);
   const byWeekday = new Array(7).fill(0);
   this.data.forEach(r => {
       if (!self.headerMap.date) return;
       const d = new Date(r[self.headerMap.date]);
       if (isNaN(d.getTime())) return;
       byHour[d.getHours()]++;
       byWeekday[d.getDay()]++;
   });
   const peak = arr => { let max=-1,idx=-1; arr.forEach((v,i)=>{ if(v>max){max=v;idx=i;} }); return {index:idx,value:max}; };
   const h = peak(byHour), w = peak(byWeekday);
   const days = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
   const shift = hour => {
       if (hour===null||hour<0) return null;
       if (hour>=6  && hour<14) return 'Frühschicht (06–14 Uhr)';
       if (hour>=14 && hour<22) return 'Spätschicht (14–22 Uhr)';
       return 'Nachtschicht (22–06 Uhr)';
   };
   this.insights.timePatterns = {
       byHour, byWeekday,
       peakHour:        h.index >= 0 ? h.index : null,
       peakHourValue:   h.value,
       peakWeekday:     w.index >= 0 ? days[w.index] : null,
       peakWeekdayValue:w.value,
       peakShift:       shift(h.index)
   };
};
SecurityAnalytics.prototype.analyzeDistributionPerSite = function() {
   const self   = this;
   const bySite = {};
   this.data.forEach(r => {
       const s = self.headerMap.site ? r[self.headerMap.site] : '';
       if (s) bySite[s] = (bySite[s] || 0) + 1;
   });
   this.insights.siteDistribution = Object.entries(bySite)
       .map(([site,count]) => ({site,count}))
       .sort((a,b) => b.count - a.count);
};
SecurityAnalytics.prototype.deriveMaturityLevel = function() {
   const r       = this.insights.risk;
   const domains = this.insights.domains || [];
   const sites   = this.insights.siteDistribution || [];
   const types   = this.insights.topTypes || [];
   const comments = [];
   let level;
   if (!this.data.length) {
       level = 'Keine Einstufung (keine Daten)';
   } else if (r.score < 35 && (domains[0] && domains[0].share < 60)) {
       level = 'Fortgeschritten';
       comments.push('Niedriges Risikoniveau mit ausgewogener Verteilung. Gut etablierte Sicherheitsorganisation.');
   } else if (r.score < 60) {
       level = 'Etabliert mit Optimierungspotenzial';
       comments.push('Mittleres Risikoniveau. Einzelne Standorte oder Ereignisarten dominieren.');
   } else {
       level = 'Kritisch / Reaktiv';
       comments.push('Hohes Risikoniveau. Starke Konzentration bestimmter Eventtypen – reaktive statt proaktive Prozesse.');
   }
   if (sites.length && sites[0].count > (this.data.length * 0.4))
       comments.push('Ein Standort hat >40% aller Ereignisse – akuter Handlungsbedarf.');
   if (types.length && types[0].count > (this.data.length * 0.5))
       comments.push('Eine Ereignisart dominiert – Ursachenanalyse priorisieren.');
   this.insights.maturity = { level, comments };
};
SecurityAnalytics.prototype.buildRecommendations = function() {
   const r     = this.insights.risk;
   const d     = this.insights.domains || [];
   const time  = this.insights.timePatterns || {};
   const sites = this.insights.siteDistribution || [];
   const recs  = [];
   if (r.level === 'HOCH') {
       recs.push('Risikoniveau HOCH: Kurzfristig zusätzliche Sicherungsmaßnahmen an kritischen Standorten umsetzen (Zutrittskontrolle, Wachpersonal, Technik).');
       recs.push('Konzernweites Incident-Review der letzten 4–8 Wochen zur Mustererkennung und Sofortmaßnahmen-Ableitung.');
   } else if (r.level === 'MITTEL') {
       recs.push('Risikoniveau MITTEL: Gezielte Überprüfung aktueller Maßnahmen, Fokus auf stark betroffene Bereiche und Ereignisarten.');
       recs.push('Regelmäßiger Management-Report (monatlich/vierteljährlich) mit Top-Standorten etablieren.');
   } else {
       recs.push('Risikoniveau NIEDRIG: Lage stabil – Kontrollen und Monitoring aufrechterhalten.');
       recs.push('Prozesse standardisieren, Schulungen durchführen und Lessons Learned dokumentieren.');
   }
   if (r.criticalTypes && r.criticalTypes.length) {
       const top = r.criticalTypes[0];
       recs.push(`Kritische Ereignisart "${top.key || 'Unbekannt'}" (${top.count}×): Ursachen analysieren, Gegenmaßnahmen definieren.`);
   }
   if (d.length && d[0].count > 0) {
       const dom = d[0].domain;
       if (dom === 'Security') recs.push('Security-Vorfälle dominieren: Sicherheitskonzept überarbeiten, Meldewege schulen, Zutritts-/Alarmmanagement prüfen.');
       else if (dom === 'FM') recs.push('Viele FM-Ereignisse: Wartungsintervalle und Störungsmeldungen prüfen, Eskalationswege optimieren.');
       else if (dom === 'SHE') recs.push('Hoher SHE-Anteil: Safety-Begehungen, Arbeitssicherheitstrainings, Brandschutz-/Evakuierungspläne aktualisieren.');
       else recs.push('Viele unkategorisierte Ereignisse: Klassifizierung harmonisieren, einheitliches Regelwerk zur Erfassung einführen.');
   }
   if (time.peakHourValue > 0)
       recs.push(`Häufung gegen ${time.peakHour}:00 Uhr – in diesem Zeitfenster verstärkte Kontrollen einplanen.`);
   if (time.peakWeekdayValue > 0 && time.peakWeekday)
       recs.push(`Wochentag-Peak: ${time.peakWeekday} – Schwerpunktkontrollen und zusätzliche Ressourcen an diesem Tag.`);
   if (time.peakShift)
       recs.push(`Schwerpunkt in der ${time.peakShift} – Schichtübergaben und Wachstärken besonders sorgfältig organisieren.`);
   if (sites.length) {
       recs.push(`Standort-Hotspot: "${sites[0].site}" (${sites[0].count} Events) – detaillierte Standortanalyse empfohlen.`);
       if (sites.length > 1) recs.push(`Vergleich mit "${sites[1].site}" kann Best Practices für den Hotspot liefern.`);
   }
   if (this.insights.maturity && this.insights.maturity.comments)
       this.insights.maturity.comments.forEach(c => recs.push(c));
   this.insights.recommendations = recs;
};
SecurityAnalytics.prototype.buildForecastHint = function() {
   const r       = this.insights.risk;
   const time    = this.insights.timePatterns || {};
   const domains = this.insights.domains || [];
   let text = '';
   if (!this.data.length) {
       text = 'Keine Daten vorhanden.';
   } else if (r.score > 70) {
       text = 'Aktuelle Entwicklung deutet auf anhaltend erhöhten Risiko-Level hin. Ohne zusätzliche Maßnahmen ist mit weiterer Zunahme kritischer Ereignisse zu rechnen.';
   } else if (r.score > 40) {
       text = 'Trend im mittleren Bereich. Bei gleichbleibenden Bedingungen moderate Entwicklung – einzelne Peaks sollten aktiv beobachtet werden.';
   } else {
       text = 'Aktueller Trend stabil mit niedrigen Eventzahlen. Umfeldänderungen (neue Standorte, Personalwechsel) regelmäßig bewerten.';
   }
   if (time.peakHourValue > 0 && time.peakWeekday)
       text += ` Erhöhte Ereigniswahrscheinlichkeit um ${time.peakHour}:00 Uhr am ${time.peakWeekday}.`;
   if (domains.length && domains[0].count > 0)
       text += ` Bereich "${domains[0].domain}" in Ressourcen- und Budgetplanung vorrangig berücksichtigen.`;
   this.insights.forecastText = text;
};
SecurityAnalytics.prototype.renderAll = function() {
   const r         = this.insights.risk;
   const d         = this.insights.domains || [];
   const recList   = this.insights.recommendations || [];
   const forecast  = this.insights.forecastText || '';
   const maturity  = this.insights.maturity || {};
   const time      = this.insights.timePatterns || {};
   // --- Risk Assessment ---
   const riskEl = document.getElementById('riskAssessment');
   if (riskEl && r) {
       let html = `
<span class="risk-badge ${r.riskClass}">
               ${ r.riskClass === 'high' ? '🔴' : r.riskClass === 'medium' ? '🟡' : '🟢' }
               Risiko: ${r.level}
</span>
<div class="risk-bar" style="margin-top:8px">
<div class="risk-bar-fill ${r.riskClass}" style="width:${r.score}%"></div>
</div>
<div style="display:flex;justify-content:space-between;font-size:0.70rem;color:var(--text-muted);margin-top:2px">
<span>Score: ${r.score}%</span>
<span>${r.highRiskEvents} krit. Events</span>
</div>`;
       if (maturity.level) {
           html += `<div style="margin-top:8px;padding:6px 8px;background:var(--bg-body);border-radius:6px;font-size:0.75rem;color:var(--text-muted)">
               📊 ${Utils.escapeHtml(maturity.level)}</div>`;
       }
       if (r.criticalTypes && r.criticalTypes.length) {
           html += `<div style="margin-top:8px"><div class="insight-value" style="font-size:0.75rem;margin-bottom:4px">Top kritische Typen:</div>`;
           r.criticalTypes.slice(0,3).forEach(ct => {
               const pct = Math.round((ct.count / r.totalEvents) * 100);
               html += `<div style="font-size:0.72rem;display:flex;justify-content:space-between;color:var(--text-muted);margin-bottom:2px">
<span>${Utils.escapeHtml(ct.key)}</span><span class="mono-num">${ct.count}×</span></div>`;
           });
           html += `</div>`;
       }
       riskEl.innerHTML = html;
   }
   // --- Pattern Detection ---
   const patternEl = document.getElementById('patternDetection');
   if (patternEl && d.length) {
       const totalD = d.reduce((s,x) => s + x.count, 0) || 1;
       let html2 = `<div class="domain-bars">`;
       const domColors = { Security:'Security', FM:'FM', SHE:'SHE', Other:'Other' };
       d.forEach(dom => {
           html2 += `
<div class="domain-bar-row">
<div class="domain-bar-label">
<span>${dom.domain}</span>
<span>${dom.count} (${dom.share}%)</span>
</div>
<div class="domain-bar-track">
<div class="domain-bar-fill domain-fill-${dom.domain}" style="width:${dom.share}%"></div>
</div>
</div>`;
       });
       html2 += `</div>`;
       if (time.peakHour !== null && time.peakWeekday) {
           html2 += `<div style="margin-top:8px;font-size:0.72rem;color:var(--text-muted)">
               ⏰ Peak: ${time.peakHour}:00 Uhr · ${time.peakWeekday}</div>`;
       }
       if (time.peakShift) {
           html2 += `<div style="font-size:0.72rem;color:var(--text-muted)">🔄 ${time.peakShift}</div>`;
       }
       patternEl.innerHTML = html2;
   }
   // --- Recommendations ---
   const recEl = document.getElementById('smartRecommendations');
   if (recEl) {
       if (!recList.length) {
           recEl.innerHTML = '<div class="loading-state">Keine spezifischen Empfehlungen ableitbar.</div>';
       } else {
           let html3 = `<ul class="insight-list">`;
           recList.slice(0, 6).forEach(line => {
               html3 += `<li>${Utils.escapeHtml(line)}</li>`;
           });
           html3 += `</ul>`;
           if (recList.length > 6) {
               html3 += `<div style="font-size:0.70rem;color:var(--text-muted);margin-top:4px">+ ${recList.length - 6} weitere im PDF-Report</div>`;
           }
           recEl.innerHTML = html3;
       }
   }
   // --- Trend & Forecast ---
   const trendEl = document.getElementById('trendForecast');
   if (trendEl) {
       const icon = r && r.score >= 70 ? '📈' : r && r.score >= 40 ? '➡️' : '📉';
       trendEl.innerHTML = `
<div style="font-size:1.4rem;margin-bottom:4px">${icon}</div>
<div class="insight-trend">${Utils.escapeHtml(forecast)}</div>`;
   }
};
// === THEME MANAGER ===
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
       // Rebuild charts with new theme colors
       if (DashboardState.isInitialized && DashboardState.currentData.length) {
           setTimeout(() => ChartManager.refreshAll(), 50);
       }
   }
};
// === RISK CONFIG MANAGER ===
const RiskConfigManager = {
   render() {
       const container = document.getElementById('riskConfigContainer');
       if (!container) return;
       const typesMap = {};
       DashboardState.allData.forEach(r => {
           const t = DashboardState.headerMap.type ? r[DashboardState.headerMap.type] : '';
           if (t) typesMap[t] = true;
       });
       const types = Object.keys(typesMap).sort();
       if (!types.length) {
           container.innerHTML = '<div class="hint">Keine Ereignisarten erkannt.</div>';
           return;
       }
       container.innerHTML = types.map(type => {
           const w = CONFIG.riskWeights[type] || 3;
           return `<div class="risk-config-row">
<label class="risk-config-label" title="${Utils.escapeHtml(type)}">${Utils.escapeHtml(type)}</label>
<input class="risk-config-input" type="number" min="1" max="10" value="${w}" data-type="${Utils.escapeHtml(type)}">
</div>`;
       }).join('');
       container.querySelectorAll('.risk-config-input').forEach(input => {
           input.addEventListener('change', e => {
               let val = parseInt(e.target.value, 10) || 3;
               val = Math.max(1, Math.min(10, val));
               e.target.value = val;
               CONFIG.riskWeights[e.target.getAttribute('data-type')] = val;
               RenderManager.runAnalytics();
           });
       });
   }
};
// === FILTER MANAGER ===
const FilterManager = {
   apply() {
       const country = document.getElementById('filterCountry')?.value || '__ALL__';
       const site    = document.getElementById('filterSite')?.value    || '__ALL__';
       const type    = document.getElementById('filterType')?.value    || '__ALL__';
       DashboardState.currentData = DashboardState.allData.filter(row => {
           const rc = DashboardState.headerMap.country ? row[DashboardState.headerMap.country] : '';
           const rs = DashboardState.headerMap.site    ? row[DashboardState.headerMap.site]    : '';
           const rt = DashboardState.headerMap.type    ? row[DashboardState.headerMap.type]    : '';
           if (country !== '__ALL__' && rc !== country) return false;
           if (site    !== '__ALL__' && rs !== site)    return false;
           if (type    !== '__ALL__' && rt !== type)    return false;
           return true;
       });
       this.updateStatus();
       RenderManager.renderAll();
   },
   reset() {
       ['filterCountry','filterSite','filterType'].forEach(id => {
           const el = document.getElementById(id);
           if (el) el.value = '__ALL__';
       });
       this.apply();
       UI.showToast('Filter zurückgesetzt', 'info', 2000);
   },
   updateStatus() {
       const el = document.getElementById('filterStatus');
       if (el) el.textContent = `Zeige ${DashboardState.currentData.length} von ${DashboardState.allData.length} Datensätzen`;
   },
   updateOptions(selectId, values, placeholder) {
       const select = document.getElementById(selectId);
       if (!select) return;
       const current = select.value;
       select.innerHTML = `<option value="__ALL__">${placeholder}</option>` +
           values.map(v => `<option value="${Utils.escapeHtml(v)}">${Utils.escapeHtml(v)}</option>`).join('');
       if (values.includes(current)) select.value = current;
   }
};
// === RENDER MANAGER ===
const RenderManager = {
   renderAll() {
       this.renderKPIs();
       this.renderFilters();
       this.renderTables();
       this.renderCharts();
       this.runAnalytics();
   },
   renderKPIs() {
       const countries = {}, sites = {}, types = {};
       DashboardState.allData.forEach(r => {
           if (DashboardState.headerMap.country && r[DashboardState.headerMap.country]) countries[r[DashboardState.headerMap.country]] = true;
           if (DashboardState.headerMap.site    && r[DashboardState.headerMap.site])    sites[r[DashboardState.headerMap.site]] = true;
           if (DashboardState.headerMap.type    && r[DashboardState.headerMap.type])    types[r[DashboardState.headerMap.type]] = true;
       });
       const total    = DashboardState.allData.length;
       const cCount   = Object.keys(countries).length;
       const sCount   = Object.keys(sites).length;
       const tCount   = Object.keys(types).length;
       // Animate KPI numbers
       AnimCounter.animate(document.getElementById('kpiTotalEvents'),     total);
       AnimCounter.animate(document.getElementById('kpiTotalEventsCard'), total);
       AnimCounter.animate(document.getElementById('kpiCountries'),       cCount);
       AnimCounter.animate(document.getElementById('kpiCountriesCard'),   cCount);
       AnimCounter.animate(document.getElementById('kpiSites'),           sCount);
       AnimCounter.animate(document.getElementById('kpiSitesCard'),       sCount);
       AnimCounter.animate(document.getElementById('kpiTypes'),           tCount);
       AnimCounter.animate(document.getElementById('kpiTypesCard'),       tCount);
       UI.updateText('kpiTotalEventsSub', DashboardState.currentData.length + ' nach Filter');
       // Progress bars on cards (relative to max possible)
       const maxVal = Math.max(cCount, sCount, tCount, 1);
       const setBar = (id, val, max) => {
           const el = document.getElementById(id);
           if (el) el.style.width = Math.round((val / max) * 100) + '%';
       };
       setBar('barCountries', cCount, maxVal);
       setBar('barSites',     sCount, maxVal);
       setBar('barTypes',     tCount, maxVal);
   },
   renderFilters() {
       const countries = {}, sites = {}, types = {};
       DashboardState.allData.forEach(r => {
           if (DashboardState.headerMap.country && r[DashboardState.headerMap.country]) countries[r[DashboardState.headerMap.country]] = true;
           if (DashboardState.headerMap.site    && r[DashboardState.headerMap.site])    sites[r[DashboardState.headerMap.site]] = true;
           if (DashboardState.headerMap.type    && r[DashboardState.headerMap.type])    types[r[DashboardState.headerMap.type]] = true;
       });
       FilterManager.updateOptions('filterCountry', Object.keys(countries).sort(), 'Alle Länder');
       FilterManager.updateOptions('filterSite',    Object.keys(sites).sort(),    'Alle Liegenschaften');
       FilterManager.updateOptions('filterType',    Object.keys(types).sort(),    'Alle Ereignisarten');
   },
   renderTables() {
       if (!DashboardState.currentData.length) {
           ['#tableByCountry tbody','#tableBySite tbody','#tableByType tbody'].forEach(sel => {
               const el = document.querySelector(sel);
               if (el) el.innerHTML = '<tr><td colspan="3" class="empty-state">Keine Daten</td></tr>';
           });
           return;
       }
       const total = DashboardState.currentData.length;
       const byCountry = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '');
       const byType    = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.type    ? r[DashboardState.headerMap.type]    : '');
       // Sites with country
       const siteMap = {};
       DashboardState.currentData.forEach(r => {
           const s = DashboardState.headerMap.site    ? r[DashboardState.headerMap.site]    : '';
           const c = DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '';
           const k = s + '||' + c;
           siteMap[k] = (siteMap[k] || 0) + 1;
       });
       const bySite = Object.entries(siteMap)
           .map(([k,count]) => { const [site,country] = k.split('||'); return {site:site||'(leer)',country:country||'(leer)',count}; })
           .sort((a,b) => b.count - a.count);
       const maxC = byCountry[0]?.count || 1;
       const maxS = bySite[0]?.count    || 1;
       const maxT = byType[0]?.count    || 1;
       const miniBar = (count, max) => {
           const pct = Math.round((count / max) * 100);
           return `<div class="table-bar">
<div class="table-bar-track"><div class="table-bar-fill" style="width:${pct}%"></div></div>
<span class="table-bar-label">${Math.round((count/total)*100)}%</span>
</div>`;
       };
       const tc = document.querySelector('#tableByCountry tbody');
       if (tc) tc.innerHTML = byCountry.map(item =>
           `<tr><td>${Utils.escapeHtml(item.key||'(leer)')}</td><td class="mono-num">${item.count}</td><td>${miniBar(item.count,maxC)}</td></tr>`
       ).join('');
       const ts = document.querySelector('#tableBySite tbody');
       if (ts) ts.innerHTML = bySite.map(item =>
           `<tr><td>${Utils.escapeHtml(item.site)}</td><td>${Utils.escapeHtml(item.country)}</td><td class="mono-num">${item.count}</td></tr>`
       ).join('');
       const tt = document.querySelector('#tableByType tbody');
       if (tt) tt.innerHTML = byType.map(item =>
           `<tr><td>${Utils.escapeHtml(item.key||'(leer)')}</td><td class="mono-num">${item.count}</td><td>${miniBar(item.count,maxT)}</td></tr>`
       ).join('');
   },
   renderCharts() {
       if (!DashboardState.currentData.length) {
           ['chartCountries','chartSites','chartTypes','chartDomains'].forEach(id => {
               const el = document.getElementById(id);
               if (el) el.innerHTML = '<div class="empty-state"><strong>Keine Daten</strong></div>';
           });
           const ts = document.getElementById('timelineSection');
           if (ts) ts.style.display = 'none';
           ChartManager.destroyAll();
           return;
       }
       const countries = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '');
       const sites     = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.site    ? r[DashboardState.headerMap.site]    : '');
       const types     = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.type    ? r[DashboardState.headerMap.type]    : '');
       const domainCounts = { Security:0, FM:0, SHE:0, Other:0 };
       DashboardState.currentData.forEach(r => { domainCounts[Utils.classifyCategory(r, DashboardState.headerMap)]++; });
       const domainData = Object.entries(domainCounts).filter(([,c]) => c > 0).map(([key,count]) => ({key,count}));
       ChartManager.create('chartCountries', countries, 'bar', 8);
       ChartManager.create('chartSites',     sites,     'bar', 6);
       ChartManager.create('chartTypes',     types,     'doughnut', 8);
       ChartManager.create('chartDomains',   domainData,'doughnut', 4);
       ChartManager.createTimeline(DashboardState.currentData, DashboardState.timelineChartType);
   },
   runAnalytics() {
       if (!DashboardState.currentData.length) {
           const html = '<div class="loading-state">Keine Daten für Analyse</div>';
           ['riskAssessment','patternDetection','smartRecommendations','trendForecast'].forEach(id => {
               const el = document.getElementById(id);
               if (el) el.innerHTML = html;
           });
           return;
       }
       const analytics = new SecurityAnalytics(DashboardState.currentData, DashboardState.headerMap);
       analytics.analyze();
   }
};
// === DATA MANAGER ===
const DataManager = {
   loadTestData() {
       try {
           const parsed = Utils.parseCSV(TestData.csv);
           DashboardState.allData    = parsed.rows;
           DashboardState.headerMap  = Utils.createHeaderMap(parsed.headers);
           DashboardState.currentData = DashboardState.allData.slice();
           RiskConfigManager.render();
           this.updateUI('testdata');
           RenderManager.renderAll();
           UI.showToast(i18n.t('toast_testdata_loaded'), 'success');
       } catch(e) {
           console.error(e);
           UI.showToast('Fehler: ' + e.message, 'error');
       }
   },
   loadCSVFile(file) {
       const reader = new FileReader();
       reader.onload = e => {
           try {
               const parsed = Utils.parseCSV(e.target.result);
               if (!parsed.rows.length) throw new Error('CSV enthält keine Daten');
               DashboardState.allData    = parsed.rows;
               DashboardState.headerMap  = Utils.createHeaderMap(parsed.headers);
               DashboardState.currentData = DashboardState.allData.slice();
               RiskConfigManager.render();
               this.updateUI('csv', file.name);
               RenderManager.renderAll();
               UI.showToast(i18n.t('toast_csv_loaded', { filename: file.name }), 'success');
           } catch(err) {
               const fs = document.getElementById('fileStatus');
               if (fs) { fs.textContent = 'Fehler: ' + err.message; fs.className = 'status error'; }
               UI.showToast('CSV-Fehler: ' + err.message, 'error');
           }
       };
       reader.onerror = () => UI.showToast('Datei konnte nicht gelesen werden', 'error');
       reader.readAsText(file);
   },
   updateUI(mode, filename) {
       filename = filename || '';
       const count = DashboardState.allData.length;
       AnimCounter.animate(document.getElementById('recordCount'), count);
       const modeEl   = document.getElementById('modeIndicator');
       const statusEl = document.getElementById('fileStatus');
       if (mode === 'testdata') {
           if (modeEl)   modeEl.textContent   = '⚡ Modus: Testdaten (Demo)';
           if (statusEl) statusEl.textContent  = 'Testdaten geladen (Demo-Modus)';
       } else {
           if (modeEl)   modeEl.textContent   = '📄 Modus: CSV-Datei';
           if (statusEl) statusEl.textContent  = `"${filename}" geladen (${count} Datensätze)`;
       }
   }
};
// === EXPORT MANAGER ===
const ExportManager = {
   toCSV() {
       if (!DashboardState.currentData.length) { UI.showToast(i18n.t('toast_no_data'), 'error'); return; }
       try {
           const headers = Object.keys(DashboardState.currentData[0]);
           const csv = headers.join(',') + '\n' +
               DashboardState.currentData.map(row =>
                   headers.map(h => '"' + String(row[h] || '').replace(/"/g,'""') + '"').join(',')
               ).join('\n');
           const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
           const link = document.createElement('a');
           link.href     = URL.createObjectURL(blob);
           link.download = 'security-events-' + new Date().toISOString().slice(0,10) + '.csv';
           link.click();
           UI.showToast(i18n.t('toast_csv_success', { count: DashboardState.currentData.length }), 'success');
       } catch(e) { UI.showToast('CSV-Export Fehler: ' + e.message, 'error'); }
   },
   toPDF() {
       if (!DashboardState.currentData.length) { UI.showToast(i18n.t('toast_no_data'), 'error'); return; }
       if (typeof window.jspdf === 'undefined') { UI.showToast('jsPDF nicht geladen', 'error'); return; }
       const btn = document.getElementById('exportPDF');
       if (btn) btn.disabled = true;
       UI.showToast(i18n.t('toast_pdf_start'), 'info');
       try {
           const jsPDF    = window.jspdf.jsPDF;
           const pdf      = new jsPDF('p','mm','a4');
           const pw       = pdf.internal.pageSize.getWidth();
           const ph       = pdf.internal.pageSize.getHeight();
           const mx       = 18;
           let y          = 22;
           const analytics = new SecurityAnalytics(DashboardState.currentData, DashboardState.headerMap);
           analytics.analyze();
           const aRisk = analytics.insights.risk || {};
           const aDomains = analytics.insights.domains || [];
           const aTopCountries = analytics.insights.topCountries || [];
           const aTopSites     = analytics.insights.topSites     || [];
           const aTopTypes     = analytics.insights.topTypes     || [];
           const aMaturity     = analytics.insights.maturity     || {};
           const aRecs         = analytics.insights.recommendations || [];
           const aForecast     = analytics.insights.forecastText || '';
           const aTime         = analytics.insights.timePatterns || {};
           // Header band
           pdf.setFillColor(0,163,122);
           pdf.rect(0,0,pw,30,'F');
           pdf.setTextColor(255,255,255);
           pdf.setFontSize(18); pdf.text(i18n.t('pdf_title'), mx, 16);
           pdf.setFontSize(10); pdf.text(i18n.t('pdf_subtitle'), mx, 23);
           const ds = Utils.formatDate(new Date());
           const dt = i18n.t('pdf_created_at',{date:ds});
           pdf.text(dt, pw - mx - pdf.getTextWidth(dt), 23);
           y = 40;
           pdf.setTextColor(0,0,0);
           pdf.setFontSize(13); pdf.text(i18n.t('section_executive_summary'), mx, y); y += 8;
           const cSet={}, sSet={}, tSet={};
           DashboardState.currentData.forEach(r => {
               if (DashboardState.headerMap.country && r[DashboardState.headerMap.country]) cSet[r[DashboardState.headerMap.country]]=true;
               if (DashboardState.headerMap.site    && r[DashboardState.headerMap.site])    sSet[r[DashboardState.headerMap.site]]=true;
               if (DashboardState.headerMap.type    && r[DashboardState.headerMap.type])    tSet[r[DashboardState.headerMap.type]]=true;
           });
           pdf.setFontSize(9); pdf.setTextColor(80,80,80);
           pdf.text(i18n.t('key_facts_line',{events:DashboardState.currentData.length,countries:Object.keys(cSet).length,sites:Object.keys(sSet).length,types:Object.keys(tSet).length}), mx, y); y += 10;
           pdf.setFontSize(11); pdf.setTextColor(0,0,0);
           pdf.text(`${i18n.t('ai_risk_label')}: ${aRisk.level||'n/a'} (${aRisk.score != null ? aRisk.score+'%' : '-'})`, mx, y); y += 6;
           if (aMaturity.level) { pdf.setFontSize(9); pdf.text(`${i18n.t('ai_maturity_label')}: ${aMaturity.level}`, mx, y); y += 6; }
           if (aDomains.length) {
               const dom = aDomains[0];
               pdf.setFontSize(9);
               pdf.text(i18n.t('ai_dominant_domain_line',{domain:dom.domain,count:dom.count,share:dom.share}), mx, y); y += 5;
               const sec   = (aDomains.find(x=>x.domain==='Security')||{count:0}).count;
               const fm    = (aDomains.find(x=>x.domain==='FM')||{count:0}).count;
               const she   = (aDomains.find(x=>x.domain==='SHE')||{count:0}).count;
               const other = (aDomains.find(x=>x.domain==='Other')||{count:0}).count;
               pdf.text(i18n.t('ai_domain_distribution_line',{sec,fm,she,other}), mx, y); y += 7;
           }
           const sumLines = [];
           if (aTopCountries.length) sumLines.push(i18n.t('ai_top_countries_line',{items:aTopCountries.map(c=>`${c.key} (${c.count})`).join(', ')}));
           if (aTopSites.length)     sumLines.push(i18n.t('ai_top_sites_line',    {items:aTopSites.map(s=>`${s.key} (${s.count})`).join(', ')}));
           if (aTopTypes.length)     sumLines.push(i18n.t('ai_top_types_line',    {items:aTopTypes.map(t=>`${t.key} (${t.count})`).join(', ')}));
           sumLines.forEach(line => { if (y>ph-30){pdf.addPage();y=22;} pdf.text(line,mx,y); y+=5; });
           if (aTime.peakHourValue > 0 || aTime.peakWeekday) {
               if (y>ph-30){pdf.addPage();y=22;}
               const parts=[];
               if (aTime.peakHourValue>0)                  parts.push(`Peak ca. ${aTime.peakHour}:00 Uhr`);
               if (aTime.peakWeekdayValue>0&&aTime.peakWeekday) parts.push(`häufigster Wochentag: ${aTime.peakWeekday}`);
               if (aTime.peakShift) parts.push(`Schwerpunkt in ${aTime.peakShift}`);
               pdf.text(i18n.t('ai_time_pattern_line',{parts:parts.join(', ')}),mx,y); y+=7;
           }
           if (aRecs.length) {
               if (y>ph-40){pdf.addPage();y=22;}
               pdf.setFontSize(11); pdf.setTextColor(0,0,0);
               pdf.text(i18n.t('ai_recommendations_heading'),mx,y); y+=6;
               pdf.setFontSize(9); pdf.setTextColor(60,60,60);
               aRecs.slice(0,6).forEach(rec => {
                   if (y>ph-20){pdf.addPage();y=22;}
                   const split = pdf.splitTextToSize(rec, pw - 2*mx);
                   pdf.text(split,mx,y); y += split.length*4+2;
               });
           }
           if (aForecast) {
               if (y>ph-40){pdf.addPage();y=22;}
               pdf.setFontSize(11); pdf.setTextColor(0,0,0);
               pdf.text(i18n.t('ai_trend_heading'),mx,y); y+=6;
               pdf.setFontSize(9); pdf.setTextColor(60,60,60);
               const fs = pdf.splitTextToSize(aForecast, pw-2*mx);
               pdf.text(fs,mx,y); y+=fs.length*4+4;
           }
           // Charts
           const addChart = (selector, title) => {
               const canvas = document.querySelector(selector + ' canvas');
               if (!canvas) return;
               try {
                   if (y>ph-80){pdf.addPage();y=22;}
                   pdf.setFontSize(11); pdf.setTextColor(0,0,0);
                   pdf.text(title,mx,y); y+=5;
                   pdf.addImage(canvas.toDataURL('image/png',1.0),'PNG',mx,y,pw-2*mx,48);
                   y+=53;
               } catch(err) { console.warn('Chart export:', err); }
           };
           addChart('#chartCountries', i18n.t('chart_countries_title'));
           addChart('#chartSites',     i18n.t('chart_sites_title'));
           addChart('#chartTimeline',  i18n.t('chart_timeline_title'));
           addChart('#chartTypes',     i18n.t('chart_types_title'));
           addChart('#chartDomains',   i18n.t('chart_domains_title'));
           // Tables
           if (pdf.autoTable) {
               pdf.addPage(); y=22;
               pdf.setFontSize(13); pdf.setTextColor(0,0,0);
               pdf.text(i18n.t('section_aggregated_overview'),mx,y); y+=8;
               const byCountry = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.country ? r[DashboardState.headerMap.country] : '');
               const byType    = Utils.groupAndCount(DashboardState.currentData, r => DashboardState.headerMap.type    ? r[DashboardState.headerMap.type]    : '');
               pdf.autoTable({ startY:y, head:[[i18n.t('table_country_header'),i18n.t('table_count_header')]], body:byCountry.map(r=>[r.key||'(leer)',r.count]), margin:{left:mx,right:mx}, styles:{fontSize:8}, headStyles:{fillColor:[0,163,122]} });
               y = pdf.lastAutoTable.finalY + 10;
               pdf.autoTable({ startY:y, head:[[i18n.t('table_type_header'),i18n.t('table_count_header')]],    body:byType.map(r=>[r.key||'(leer)',r.count]),    margin:{left:mx,right:mx}, styles:{fontSize:8}, headStyles:{fillColor:[0,163,122]} });
           }
           const filename = i18n.t('pdf_filename',{date:new Date().toISOString().slice(0,10)});
           pdf.save(filename);
           UI.showToast(i18n.t('toast_pdf_success',{file:filename}),'success');
       } catch(e) {
           console.error('PDF Error:', e);
           UI.showToast(i18n.t('toast_pdf_error',{error:e.message}),'error');
       } finally {
           if (btn) btn.disabled = false;
       }
   }
};
// === DASHBOARD ===
const Dashboard = {
   init() {
       ThemeManager.init();
       this.setupEventListeners();
       FilterManager.updateStatus();
       DashboardState.isInitialized = true;
       console.log('Dashboard v5 initialized!');
   },
   setupEventListeners() {
       document.getElementById('loadTestData')?.addEventListener('click', () => DataManager.loadTestData());
       document.getElementById('fileInput')?.addEventListener('change', e => {
           const file = e.target.files?.[0];
           if (file) DataManager.loadCSVFile(file);
       });
       ['filterCountry','filterSite','filterType'].forEach(id => {
           document.getElementById(id)?.addEventListener('change', () => FilterManager.apply());
       });
       document.getElementById('resetFilters')?.addEventListener('click', () => FilterManager.reset());
       document.getElementById('exportCSV')?.addEventListener('click', () => ExportManager.toCSV());
       document.getElementById('exportPDF')?.addEventListener('click', () => ExportManager.toPDF());
       document.getElementById('reportLanguage')?.addEventListener('change', e => i18n.set(e.target.value));
       // Analytics toggle with smooth animation
       const analyticsContent = document.getElementById('analyticsContent');
       const analyticsToggle  = document.getElementById('toggleAnalytics');
       const toggleLabel      = document.getElementById('toggleAnalyticsLabel');
       const toggleArrow      = document.getElementById('toggleAnalyticsArrow');
       if (analyticsContent && analyticsToggle) {
           analyticsContent.classList.add('collapsed');
           let isOpen = false;
           analyticsToggle.addEventListener('click', () => {
               isOpen = !isOpen;
               if (isOpen) {
                   analyticsContent.classList.remove('collapsed');
                   if (toggleLabel) toggleLabel.textContent = 'Smart Analytics ausblenden';
                   if (toggleArrow) toggleArrow.classList.add('open');
               } else {
                   analyticsContent.classList.add('collapsed');
                   if (toggleLabel) toggleLabel.textContent = 'Smart Analytics anzeigen';
                   if (toggleArrow) toggleArrow.classList.remove('open');
               }
           });
       }
       // Timeline chart type toggle
       document.querySelectorAll('.chart-type-btn').forEach(btn => {
           btn.addEventListener('click', () => {
               const chartId = btn.getAttribute('data-chart');
               const type    = btn.getAttribute('data-type');
               document.querySelectorAll(`.chart-type-btn[data-chart="${chartId}"]`).forEach(b => b.classList.remove('active'));
               btn.classList.add('active');
               if (chartId === 'timeline') {
                   DashboardState.timelineChartType = type;
                   ChartManager.createTimeline(DashboardState.currentData, type);
               }
           });
       });
   }
};
// === START ===
document.addEventListener('DOMContentLoaded', () => Dashboard.init());
window.onerror = (msg, url, line) => { console.error('Error:', msg, 'Line:', line); return false; };
// Global exports
Object.assign(window, { Dashboard, DashboardState, DataManager, ThemeManager, FilterManager, ExportManager, RenderManager, ChartManager, RiskConfigManager, i18n, CONFIG, Utils });
console.log('app.js v5 vollständig geladen');
