// Data Processing Utilities
export function groupAndCount(rows, keyFn) {
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

export function updateSelectOptions(select, values, placeholder) {
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

export function getDistinctValues(data, headerMap, fieldName) {
    const values = new Set();
    for (const row of data) {
        if (headerMap[fieldName] && row[headerMap[fieldName]]) {
            values.add(row[headerMap[fieldName]].trim());
        }
    }
    return Array.from(values).sort();
}
