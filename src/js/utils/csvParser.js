// CSV Parser Utilities
export function parseCSV(text) {
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

export function detectDelimiter(headerLine) {
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

export function splitCSVLine(line, delimiter) {
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

export function createHeaderMap(headers) {
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
