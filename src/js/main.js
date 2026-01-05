// Import modules
import { parseCSV, createHeaderMap } from './utils/csvParser.js';
import { groupAndCount, updateSelectOptions, getDistinctValues } from './utils/dataProcessor.js';
import { getTestData } from './data/testData.js';
import { createChart } from './components/charts.js';  // <- NEU HINZUGEFÜGT

// =======================
// GLOBALER STATE
// =======================
let allData = [];
let currentData = [];
let headerMap = {};
let currentMode = "none";

// DOM Elements
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
// DATA LOADING
// =======================
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

// =======================
// CSV UPLOAD
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

// =======================
// FILTER LOGIC
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

// =======================
// RENDERING
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

    const countries = getDistinctValues(allData, headerMap, 'country');
    const sites = getDistinctValues(allData, headerMap, 'site');
    const types = getDistinctValues(allData, headerMap, 'type');

    kpiCountries.textContent = countries.length.toString();
    kpiSites.textContent = sites.length.toString();
    kpiTypes.textContent = types.length.toString();
}

function renderFiltersFromData() {
    const countries = getDistinctValues(allData, headerMap, 'country');
    const sites = getDistinctValues(allData, headerMap, 'site');
    const types = getDistinctValues(allData, headerMap, 'type');

    updateSelectOptions(filterCountry, countries, "Alle Länder");
    updateSelectOptions(filterSite, sites, "Alle Liegenschaften");
    updateSelectOptions(filterType, types, "Alle Ereignisarten");
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
    createChart('chartCountries', countries, 'bar');  // <- GEÄNDERT: Chart.js

    const sites = groupAndCount(currentData, row =>
        headerMap.site ? (row[headerMap.site] || "").trim() : ""
    );
    createChart('chartSites', sites, 'bar');  // <- GEÄNDERT: Chart.js

    const types = groupAndCount(currentData, row =>
        headerMap.type ? (row[headerMap.type] || "").trim() : ""
    );
    createChart('chartTypes', types, 'pie');  // <- GEÄNDERT: Chart.js + Pie Chart
}

// =======================
// EVENT LISTENERS
// =======================
loadTestDataBtn.addEventListener("click", loadTestData);
filterCountry.addEventListener("change", applyFilters);
filterSite.addEventListener("change", applyFilters);
filterType.addEventListener("change", applyFilters);
resetFiltersBtn.addEventListener("click", () => {
    filterCountry.value = "__ALL__";
    filterSite.value = "__ALL__";
    filterType.value = "__ALL__";
    applyFilters();
});
