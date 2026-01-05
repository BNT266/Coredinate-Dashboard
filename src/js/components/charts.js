// Professional Chart Rendering with Chart.js

let chartInstances = {};

export function createChart(containerId, data, chartType = 'bar', maxBars = 6) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Destroy existing chart if it exists
    if (chartInstances[containerId]) {
        chartInstances[containerId].destroy();
        delete chartInstances[containerId];
    }

    // Clear container and create canvas
    container.innerHTML = '';
    
    if (!data || data.length === 0) {
        const noData = document.createElement("div");
        noData.textContent = "Keine Daten vorhanden.";
        noData.style.fontSize = "0.75rem";
        noData.style.color = "#999";
        noData.style.textAlign = "center";
        noData.style.padding = "2rem";
        container.appendChild(noData);
        return;
    }

    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Prepare data
    const top = data.slice(0, maxBars);
    const labels = top.map(d => d.key || "(leer)");
    const values = top.map(d => d.count);

    // Color scheme
    const colors = [
        '#00a37a', '#006b4e', '#4caf50', '#8bc34a', 
        '#cddc39', '#ffc107', '#ff9800', '#ff5722'
    ];

    const config = {
        type: chartType,
        data: {
            labels: labels,
            datasets: [{
                label: 'Anzahl Ereignisse',
                data: values,
                backgroundColor: colors.slice(0, values.length).map(color => color + '80'),
                borderColor: colors.slice(0, values.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
