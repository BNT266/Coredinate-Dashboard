// =======================
// HELFERFUNKTIONEN
// =======================
function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];

    const delimiter = detectDelimiter(lines[0]);
    const headers = lines[0].split(delimiter).map(h => h.trim());

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const cells = splitCSVLine(line, delimiter);
        if (cells.length === 1 && cells[0] === "") continue;
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = (cells[idx] || "").trim();
        });
        rows.push(row);
    }
    return { headers, rows };
}

function detectDelimiter(headerLine) {
    const candidates = [",", ";", "\t"];
    let best = ",";
    let bestCount = 0;
    for (const d of candidates) {
        const count = headerLine.split(d).length;
        if (count > bestCount) {
            bestCount = count;
            best = d;
        }
    }
    return best;
}

function splitCSVLine(line, delimiter) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            inQuotes = !inQuotes;
            continue;
        }
        if (c === delimiter && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += c;
        }
    }
    result.push(current);
    return result;
}

function groupAndCount(rows, keyFn) {
    const map = new Map();
    for (const row of rows) {
        const key = keyFn(row);
        if (!key) continue;
        map.set(key, (map.get(key) || 0) + 1);
    }
    return Array.from(map.entries())
        .map(([key, count]) => ({ key, count }))
        .sort((a, b) => b.count - a.count);
}

function updateSelectOptions(select, values, placeholder) {
    const current = select.value;
    select.innerHTML = "";
    const optAll = document.createElement("option");
    optAll.value = "__ALL__";
    optAll.textContent = placeholder;
    select.appendChild(optAll);

    values.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.textContent = v;
        select.appendChild(opt);
    });

    if (Array.from(select.options).some(o => o.value === current)) {
        select.value = current;
    }
}

function createChart(container, data, maxBars = 6) {
    container.innerHTML = "";
    if (!data || data.length === 0) {
        const noData = document.createElement("div");
        noData.textContent = "Keine Daten vorhanden.";
        noData.style.fontSize = "0.75rem";
        noData.style.color = "#999";
        container.appendChild(noData);
        return;
    }

    const top = data.slice(0, maxBars);
    const maxCount = Math.max(...top.map(d => d.count));

    top.forEach(d => {
        const row = document.createElement("div");
        row.className = "chart-row";

        const label = document.createElement("div");
        label.className = "chart-label";
        label.textContent = d.key || "(leer)";

        const barWrapper = document.createElement("div");
        barWrapper.className = "chart-bar-wrapper";

        const bar = document.createElement("div");
        bar.className = "chart-bar";
        const width = maxCount === 0 ? 0 : (d.count / maxCount * 100);
        bar.style.width = width + "%";

        barWrapper.appendChild(bar);

        const value = document.createElement("div");
        value.className = "chart-value";
        value.textContent = d.count;

        row.appendChild(label);
        row.appendChild(barWrapper);
        row.appendChild(value);

        container.appendChild(row);
    });
}

// =======================
// GLOBALER STATE
// =======================
let allData = [];
let currentData = [];
let headerMap = {};
let currentMode = "none";

const fileInput = document.getElementById("fileInput");
const fileStatus = document.getElementById("fileStatus");
const filterStatus = document.getElementById("filterStatus");
const loadTestDataBtn = document.getElementById("loadTestData");
const modeIndicator = document.getElementById("modeIndicator");

const filterCountry = document.getElementById("filterCountry");
const filterSite = document.getElementById("filterSite");
const filterType = document.getElementById("filterType");
const resetFiltersBtn = document.getElementById("resetFilters");

const recordCount = document.getElementById("recordCount");
const kpiTotalEvents = document.getElementById("kpiTotalEvents");
const kpiTotalEventsSub = document.getElementById("kpiTotalEventsSub");
const kpiCountries = document.getElementById("kpiCountries");
const kpiSites = document.getElementById("kpiSites");
const kpiTypes = document.getElementById("kpiTypes");

const tableByCountry = document.querySelector("#tableByCountry tbody");
const tableBySite = document.querySelector("#tableBySite tbody");
const tableByType = document.querySelector("#tableByType tbody");

const chartCountries = document.getElementById("chartCountries");
const chartSites = document.getElementById("chartSites");
const chartTypes = document.getElementById("chartTypes");

// =======================
// TESTDATEN (DEMO-MODUS)
// =======================
function getTestData() {
    const csv = `Land;Liegenschaft;Ereignisart;Datum
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
Belgien;Brüssel Office;Verdächtige Person;2025-01-25
Deutschland;Mainz Campus;Verdächtige Person;2025-01-06
Deutschland;Mainz Campus;Diebstahl;2025-01-08
USA;Cambridge Lab;Diebstahl;2025-01-18
USA;San Diego Office;Alarmanlage ausgelöst;2025-02-20
UK;Reading Plant;Alarmanlage ausgelöst;2025-03-08
Schweiz;Basel Site;Diebstahl;2025-02-10`;
    return csv;
}

function loadTestData() {
    const csv = getTestData();
    const parsed = parseCSV(csv);
    allData = parsed.rows;
    headerMap = createHeaderMap(parsed.headers);
    recordCount.textContent = allData.length.toString();
    fileStatus.classList.remove("error");
    fileStatus.textContent = "Testdaten sind geladen (Demo-Modus).";
    currentMode = "test";
    updateModeIndicator();
    applyFilters();
}

function updateModeIndicator() {
    if (currentMode === "test") {
        modeIndicator.textContent = "Modus: Testdaten (Demo)";
    } else if (currentMode === "file") {
        modeIndicator.textContent = "Modus: CSV-Datei";
    } else {
        modeIndicator.textContent = "Modus: Keine Daten";
    }
}

loadTestDataBtn.addEventListener("click", () => {
    loadTestData();
});

// =======================
// CSV LADEN
// =======================
fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    fileStatus.classList.remove("error");
    fileStatus.textContent = "Lade Datei ...";

    try {
        const text = await file.text();
        const parsed = parseCSV(text);
        if (!parsed || !parsed.rows || parsed.rows.length === 0) {
            fileStatus.classList.add("error");
            fileStatus.textContent = "Keine gültigen Daten in der CSV gefunden.";
            return;
        }

        allData = parsed.rows;
        headerMap = createHeaderMap(parsed.headers);

        recordCount.textContent = allData.length.toString();
        fileStatus.textContent = `Datei „${file.name}" geladen. Datensätze: ${allData.length}.`;
        currentMode = "file";
        updateModeIndicator();

        applyFilters();
    } catch (err) {
        console.error(err);
        fileStatus.classList.add("error");
        fileStatus.textContent = "Fehler beim Lesen der Datei.";
    }
});

function createHeaderMap(headers) {
    const normalize = (s) =>
        s.toLowerCase()
            .replace(/\s+/g, "")
            .replace(/ß/g, "ss")
            .replace(/[^a-z0-9]/g, "");

    const map = {};
    const targetNames = {
        country: ["land", "country"],
        site: ["liegenschaft", "site", "standort"],
        type: ["ereignisart", "ereignissart", "eventtype", "ereignis"]
    };

    const normalized = headers.map(h => ({ header: h, norm: normalize(h) }));

    for (const n of normalized) {
        const val = n.norm;
        if (targetNames.country.some(t => val.includes(t))) {
            map.country = n.header;
        }
        if (targetNames.site.some(t => val.includes(t))) {
            map.site = n.header;
        }
        if (targetNames.type.some(t => val.includes(t))) {
            map.type = n.header;
        }
    }

    return map;
}

// =======================
// FILTER LOGIK
// =======================
function applyFilters() {
    if (!allData || allData.length === 0) {
        currentData = [];
        renderAll();
        return;
    }

    const selCountry = filterCountry.value;
    const selSite = filterSite.value;
    const selType = filterType.value;

    currentData = allData.filter(row => {
        const rowCountry = headerMap.country ? (row[headerMap.country] || "").trim() : "";
        const rowSite = headerMap.site ? (row[headerMap.site] || "").trim() : "";
        const rowType = headerMap.type ? (row[headerMap.type] || "").trim() : "";

        if (selCountry !== "__ALL__" && rowCountry !== selCountry) return false;
        if (selSite !== "__ALL__" && rowSite !== selSite) return false;
        if (selType !== "__ALL__" && rowType !== selType) return false;
        return true;
    });

    updateFilterStatus();
    renderAll();
}

function updateFilterStatus() {
    const activeFilters = [];
    if (filterCountry.value !== "__ALL__") {
        activeFilters.push("Land: " + filterCountry.value);
    }
    if (filterSite.value !== "__ALL__") {
        activeFilters.push("Liegenschaft: " + filterSite.value);
    }
    if (filterType.value !== "__ALL__") {
        activeFilters.push("Ereignisart: " + filterType.value);
    }

    if (activeFilters.length === 0) {
        filterStatus.textContent = "Keine Filter aktiv (zeige alle Datensätze).";
    } else {
        filterStatus.textContent = "Aktive Filter: " + activeFilters.join(" | ");
    }
}

filterCountry.addEventListener("change", applyFilters);
filterSite.addEventListener("change", applyFilters);
filterType.addEventListener("change", applyFilters);

resetFiltersBtn.addEventListener("click", () => {
    filterCountry.value = "__ALL__";
    filterSite.value = "__ALL__";
    filterType.value = "__ALL__";
    applyFilters();
});

// =======================
// RENDER FUNKTIONEN
// =======================
function renderAll() {
    renderKPIs();
    renderFiltersFromData();
    renderTables();
    renderCharts();
}

function renderKPIs() {
    const total = allData.length;
    const current = currentData.length;

    kpiTotalEvents.textContent = total.toString();
    kpiTotalEventsSub.textContent = `${current} nach Filter`;

    const countries = new Set();
    const sites = new Set();
    const types = new Set();

    for (const row of allData) {
        if (headerMap.country && row[headerMap.country]) {
            countries.add(row[headerMap.country].trim());
        }
        if (headerMap.site && row[headerMap.site]) {
            sites.add(row[headerMap.site].trim());
        }
        if (headerMap.type && row[headerMap.type]) {
            types.add(row[headerMap.type].trim());
        }
    }

    kpiCountries.textContent = countries.size.toString();
    kpiSites.textContent = sites.size.toString();
    kpiTypes.textContent = types.size.toString();
}

function renderFiltersFromData() {
    const countries = new Set();
    const sites = new Set();
    const types = new Set();

    for (const row of allData) {
        if (headerMap.country && row[headerMap.country]) {
            countries.add(row[headerMap.country].trim());
        }
        if (headerMap.site && row[headerMap.site]) {
            sites.add(row[headerMap.site].trim());
        }
        if (headerMap.type && row[headerMap.type]) {
            types.add(row[headerMap.type].trim());
        }
    }

    updateSelectOptions(filterCountry, Array.from(countries).sort(), "Alle Länder");
    updateSelectOptions(filterSite, Array.from(sites).sort(), "Alle Liegenschaften");
    updateSelectOptions(filterType, Array.from(types).sort(), "Alle Ereignisarten");
}

function renderTables() {
    tableByCountry.innerHTML = "";
    tableBySite.innerHTML = "";
    tableByType.innerHTML = "";

    if (currentData.length === 0) return;

    const byCountry = groupAndCount(currentData, row =>
        headerMap.country ? (row[headerMap.country] || "").trim() : ""
    );
    byCountry.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.key || "(leer)"}</td>
            <td>${item.count}</td>
        `;
        tableByCountry.appendChild(tr);
    });

    const siteMap = new Map();
    for (const row of currentData) {
        const site = headerMap.site ? (row[headerMap.site] || "").trim() : "";
        const country = headerMap.country ? (row[headerMap.country] || "").trim() : "";
        if (!site && !country) continue;
        const key = site + "||" + country;
        siteMap.set(key, (siteMap.get(key) || 0) + 1);
    }
    const siteArray = Array.from(siteMap.entries()).map(([key, count]) => {
        const [site, country] = key.split("||");
        return { site, country, count };
    }).sort((a, b) => b.count - a.count);

    siteArray.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.site || "(leer)"}</td>
            <td>${item.country || "(leer)"}</td>
            <td>${item.count}</td>
        `;
        tableBySite.appendChild(tr);
    });

    const byType = groupAndCount(currentData, row =>
        headerMap.type ? (row[headerMap.type] || "").trim() : ""
    );
    byType.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.key || "(leer)"}</td>
            <td>${item.count}</td>
        `;
        tableByType.appendChild(tr);
    });
}

function renderCharts() {
    const countries = groupAndCount(currentData, row =>
        headerMap.country ? (row[headerMap.country] || "").trim() : ""
    );
    createChart(chartCountries, countries);

    const sites = groupAndCount(currentData, row =>
        headerMap.site ? (row[headerMap.site] || "").trim() : ""
    );
    createChart(chartSites, sites);

    const types = groupAndCount(currentData, row =>
        headerMap.type ? (row[headerMap.type] || "").trim() : ""
    );
    createChart(chartTypes, types);
}
