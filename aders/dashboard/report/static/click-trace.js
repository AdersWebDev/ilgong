// ============================================
// clickTrace Report (houber)
// API: GET /aders/report/trace/{agent}?start={Timestamp}&end={Timestamp}
// 집계: click_type < 100 만 날짜별 row count
// ============================================

const API_BASE_URL = 'https://houberapp.com';
const AGENT = 'houber';

const startAtEl = document.getElementById('startAt');
const endAtEl = document.getElementById('endAt');
const loadBtn = document.getElementById('loadBtn');

const statusText = document.getElementById('statusText');
const chartHint = document.getElementById('chartHint');
const chartSvg = document.getElementById('chartSvg');
const chartLegend = document.getElementById('chartLegend');

const hourlyPanel = document.getElementById('hourlyPanel');
const selectedDayText = document.getElementById('selectedDayText');
const hourlyStatusText = document.getElementById('hourlyStatusText');
const hourlyChartSvg = document.getElementById('hourlyChartSvg');
const hourlyHint = document.getElementById('hourlyHint');
const hourlyLegend = document.getElementById('hourlyLegend');

const summaryGrid = document.getElementById('summaryGrid');
const totalEventsEl = document.getElementById('totalEvents');
const avgPerDayEl = document.getElementById('avgPerDay');
const daysCountEl = document.getElementById('daysCount');

let hourlyRequestSeq = 0;

const TOP_N_CLICK_TYPES = 5;
const CLICK_TYPE_MAX_EXCLUSIVE = 100;
const STACKED_COLORS = [
    '#3D8BFF',
    '#12B76A',
    '#F79009',
    '#EE46BC',
    '#7A5AF8',
];
const OTHERS_COLOR = '#98A2B3';

function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatDateKeyLocal(d) {
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    return `${y}-${m}-${day}`;
}

function formatForDatetimeLocal(d) {
    const y = d.getFullYear();
    const m = pad2(d.getMonth() + 1);
    const day = pad2(d.getDate());
    const hh = pad2(d.getHours());
    const mm = pad2(d.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}`;
}

function parseDatetimeLocalToTimestampString(value) {
    // datetime-local: "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss"
    if (!value || typeof value !== 'string') return '';
    const v = value.trim();
    if (!v) return '';

    if (v.includes('T')) {
        const parts = v.split('T');
        const datePart = parts[0] || '';
        const timePart = parts[1] || '';
        const timeParts = timePart.split(':');
        const hh = (timeParts[0] || '00').padStart(2, '0');
        const mm = (timeParts[1] || '00').padStart(2, '0');
        const ss = (timeParts[2] || '00').padStart(2, '0');
        return `${datePart} ${hh}:${mm}:${ss}`;
    }

    // fallback: date만 들어오면 00:00:00
    return `${v} 00:00:00`;
}

function setStatus(message, kind = '') {
    if (!statusText) return;
    statusText.classList.remove('is-error', 'is-loading');
    if (kind === 'error') statusText.classList.add('is-error');
    if (kind === 'loading') statusText.classList.add('is-loading');
    statusText.textContent = message || '';
}

function setHourlyStatus(message, kind = '') {
    if (!hourlyStatusText) return;
    hourlyStatusText.classList.remove('is-error', 'is-loading');
    if (kind === 'error') hourlyStatusText.classList.add('is-error');
    if (kind === 'loading') hourlyStatusText.classList.add('is-loading');
    hourlyStatusText.textContent = message || '';
}

function clearSvg(svg) {
    while (svg && svg.firstChild) {
        svg.removeChild(svg.firstChild);
    }
}

function svgEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

function addSvgText(svg, { x, y, text, size = 12, fill = '#909090', anchor = 'start', rotate = null }) {
    const t = svgEl('text');
    t.setAttribute('x', String(x));
    t.setAttribute('y', String(y));
    t.setAttribute('fill', fill);
    t.setAttribute('font-size', String(size));
    t.setAttribute('font-family', 'inherit');
    t.setAttribute('text-anchor', anchor);
    t.textContent = text;
    if (rotate) {
        t.setAttribute('transform', `rotate(${rotate.deg} ${rotate.cx} ${rotate.cy})`);
    }
    svg.appendChild(t);
}

function renderLegend(containerEl, series) {
    if (!containerEl) return;
    while (containerEl.firstChild) containerEl.removeChild(containerEl.firstChild);
    if (!Array.isArray(series) || series.length === 0) return;

    for (const s of series) {
        const item = document.createElement('div');
        item.className = 'chart-legend-item';

        const swatch = document.createElement('span');
        swatch.className = 'chart-legend-swatch';
        swatch.style.background = s && s.color ? s.color : '#CCCCCC';

        const label = document.createElement('span');
        const total = Array.isArray(s && s.values)
            ? s.values.reduce((acc, v) => acc + (Number(v) || 0), 0)
            : 0;
        label.textContent = `${s && s.label ? s.label : 'Unknown'} (${total})`;

        item.appendChild(swatch);
        item.appendChild(label);
        containerEl.appendChild(item);
    }
}

function renderBarChart(svg, labels, values, options = {}) {
    const W = 960;
    const H = 360;
    const P = {
        left: 56,
        right: 18,
        top: 22,
        bottom: 72
    };

    clearSvg(svg);

    if (!labels || !labels.length || !values || !values.length) {
        addSvgText(svg, { x: 12, y: 32, text: '데이터가 없습니다.', size: 14, fill: '#909090' });
        return;
    }

    const xLabelFormatter = typeof options.xLabelFormatter === 'function'
        ? options.xLabelFormatter
        : (label) => (String(label).length >= 10 ? String(label).slice(5) : String(label));
    const titleFormatter = typeof options.titleFormatter === 'function'
        ? options.titleFormatter
        : (label, value) => `${label}: ${value}`;
    const onBarClick = typeof options.onBarClick === 'function' ? options.onBarClick : null;

    const maxVal = Math.max(1, ...values.map(v => (Number.isFinite(v) ? v : 0)));
    const plotW = W - P.left - P.right;
    const plotH = H - P.top - P.bottom;
    const barStep = plotW / labels.length;
    const barW = Math.max(2, Math.min(28, barStep * 0.7));

    // background grid
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
        const ratio = i / gridLines;
        const y = P.top + plotH * (1 - ratio);
        const line = svgEl('line');
        line.setAttribute('x1', String(P.left));
        line.setAttribute('x2', String(P.left + plotW));
        line.setAttribute('y1', String(y));
        line.setAttribute('y2', String(y));
        line.setAttribute('stroke', '#E0E0E0');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);

        const v = Math.round(maxVal * ratio);
        addSvgText(svg, { x: P.left - 8, y: y + 4, text: String(v), size: 11, fill: '#909090', anchor: 'end' });
    }

    // axes
    const axisX = svgEl('line');
    axisX.setAttribute('x1', String(P.left));
    axisX.setAttribute('x2', String(P.left + plotW));
    axisX.setAttribute('y1', String(P.top + plotH));
    axisX.setAttribute('y2', String(P.top + plotH));
    axisX.setAttribute('stroke', '#CCCCCC');
    axisX.setAttribute('stroke-width', '1');
    svg.appendChild(axisX);

    // bars
    const showEvery = Number.isFinite(options.showEvery) ? Math.max(1, options.showEvery) : Math.max(1, Math.ceil(labels.length / 10)); // x축 라벨은 10개 내외로
    for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const value = Number(values[i] || 0);
        const h = Math.round((value / maxVal) * plotH);

        const xCenter = P.left + i * barStep + barStep / 2;
        const x = xCenter - barW / 2;
        const y = P.top + plotH - h;

        const rect = svgEl('rect');
        rect.setAttribute('x', String(x));
        rect.setAttribute('y', String(y));
        rect.setAttribute('width', String(barW));
        rect.setAttribute('height', String(h));
        rect.setAttribute('rx', '3');
        rect.setAttribute('fill', options.barColor || '#3D8BFF');
        svg.appendChild(rect);

        if (onBarClick) {
            rect.style.cursor = 'pointer';
            rect.addEventListener('click', () => onBarClick(label, i, value));
        }

        const title = svgEl('title');
        title.textContent = titleFormatter(label, value);
        rect.appendChild(title);

        if (i % showEvery === 0 || i === labels.length - 1) {
            const shortLabel = xLabelFormatter(label, i);
            addSvgText(svg, {
                x: xCenter,
                y: P.top + plotH + 22,
                text: shortLabel,
                size: 11,
                fill: '#909090',
                anchor: 'middle',
                rotate: (options.rotateXLabels === true || (options.rotateXLabels == null && labels.length > 14))
                    ? { deg: -35, cx: xCenter, cy: P.top + plotH + 22 }
                    : null
            });
        }
    }
}

function extractDateKey(timestamp) {
    if (timestamp == null) return '';
    const s = String(timestamp);
    // "YYYY-MM-DD HH:mm:ss..." or "YYYY-MM-DDTHH:mm:ss..."
    if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
        return s.slice(0, 10);
    }
    return '';
}

function extractHour(timestamp) {
    if (timestamp == null) return NaN;
    const s = String(timestamp);
    if (s.length < 13) return NaN;
    if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return NaN;
    const sep = s[10];
    if (sep !== ' ' && sep !== 'T') return NaN;
    const hh = Number(s.slice(11, 13));
    if (!Number.isFinite(hh)) return NaN;
    if (hh < 0 || hh > 23) return NaN;
    return hh;
}

function normalizeClickType(item) {
    const raw = item && (item.click_type != null ? item.click_type : item.clickType);
    const ct = Number(raw);
    return Number.isFinite(ct) ? ct : NaN;
}

function clickTypeLabel(ct) {
    // 관리자용 표기
    if (ct === 1) return 'Web';
    if (ct === 2) return 'Mail';
    return `Type ${ct}`;
}

function isIncludedClickType(ct) {
    return Number.isFinite(ct) && ct < CLICK_TYPE_MAX_EXCLUSIVE;
}

function pickTopTypes(typeTotalsMap, topN) {
    const entries = Array.from(typeTotalsMap.entries())
        .filter(([k, v]) => Number.isFinite(k) && Number(v) > 0)
        .sort((a, b) => {
            const dv = (Number(b[1]) || 0) - (Number(a[1]) || 0);
            if (dv !== 0) return dv;
            return (Number(a[0]) || 0) - (Number(b[0]) || 0);
        });
    return entries.slice(0, Math.max(0, topN)).map(([k]) => k);
}

function aggregateDailyByTypeTopN(items, dateKeys, { topN = TOP_N_CLICK_TYPES } = {}) {
    const labels = Array.isArray(dateKeys) ? dateKeys.slice() : [];
    const dayIndex = {};
    labels.forEach((k, i) => (dayIndex[k] = i));

    const typeTotals = new Map();
    for (const it of items || []) {
        const ct = normalizeClickType(it);
        if (!isIncludedClickType(ct)) continue;
        const dayKey = extractDateKey(it && it.timestamp);
        if (!dayKey || dayIndex[dayKey] == null) continue;
        typeTotals.set(ct, (typeTotals.get(ct) || 0) + 1);
    }

    const topTypes = pickTopTypes(typeTotals, topN);
    const topSet = new Set(topTypes);

    const seriesByType = new Map();
    for (let i = 0; i < topTypes.length; i++) {
        const t = topTypes[i];
        seriesByType.set(t, {
            key: String(t),
            label: clickTypeLabel(t),
            color: STACKED_COLORS[i % STACKED_COLORS.length],
            values: Array.from({ length: labels.length }, () => 0)
        });
    }

    const others = {
        key: 'others',
        label: 'Others',
        color: OTHERS_COLOR,
        values: Array.from({ length: labels.length }, () => 0)
    };

    for (const it of items || []) {
        const ct = normalizeClickType(it);
        if (!isIncludedClickType(ct)) continue;
        const dayKey = extractDateKey(it && it.timestamp);
        const idx = dayKey ? dayIndex[dayKey] : null;
        if (idx == null) continue;

        if (topSet.has(ct)) {
            const s = seriesByType.get(ct);
            if (s) s.values[idx] += 1;
        } else {
            others.values[idx] += 1;
        }
    }

    const series = topTypes.map(t => seriesByType.get(t)).filter(Boolean);
    const othersTotal = others.values.reduce((acc, v) => acc + (Number(v) || 0), 0);
    if (othersTotal > 0) series.push(others);

    const totals = Array.from({ length: labels.length }, (_, i) =>
        series.reduce((acc, s) => acc + (Number(s.values[i]) || 0), 0)
    );

    return { labels, series, totals };
}

function aggregateHourlyByTypeTopN(items, dayKey, { topN = TOP_N_CLICK_TYPES } = {}) {
    const labels = Array.from({ length: 24 }, (_, i) => pad2(i));

    const typeTotals = new Map();
    for (const it of items || []) {
        const ct = normalizeClickType(it);
        if (!isIncludedClickType(ct)) continue;
        const key = extractDateKey(it && it.timestamp);
        if (key !== dayKey) continue;
        typeTotals.set(ct, (typeTotals.get(ct) || 0) + 1);
    }

    const topTypes = pickTopTypes(typeTotals, topN);
    const topSet = new Set(topTypes);

    const seriesByType = new Map();
    for (let i = 0; i < topTypes.length; i++) {
        const t = topTypes[i];
        seriesByType.set(t, {
            key: String(t),
            label: clickTypeLabel(t),
            color: STACKED_COLORS[i % STACKED_COLORS.length],
            values: Array.from({ length: 24 }, () => 0)
        });
    }

    const others = {
        key: 'others',
        label: 'Others',
        color: OTHERS_COLOR,
        values: Array.from({ length: 24 }, () => 0)
    };

    for (const it of items || []) {
        const ct = normalizeClickType(it);
        if (!isIncludedClickType(ct)) continue;
        const key = extractDateKey(it && it.timestamp);
        if (key !== dayKey) continue;
        const hour = extractHour(it && it.timestamp);
        if (!Number.isFinite(hour)) continue;

        if (topSet.has(ct)) {
            const s = seriesByType.get(ct);
            if (s) s.values[hour] += 1;
        } else {
            others.values[hour] += 1;
        }
    }

    const series = topTypes.map(t => seriesByType.get(t)).filter(Boolean);
    const othersTotal = others.values.reduce((acc, v) => acc + (Number(v) || 0), 0);
    if (othersTotal > 0) series.push(others);

    const totals = Array.from({ length: 24 }, (_, i) =>
        series.reduce((acc, s) => acc + (Number(s.values[i]) || 0), 0)
    );

    return { labels, series, totals };
}

function renderStackedBarChart(svg, labels, series, totals, options = {}) {
    const W = 960;
    const H = 360;
    const P = {
        left: 56,
        right: 18,
        top: 22,
        bottom: 72
    };

    clearSvg(svg);

    if (!labels || !labels.length || !Array.isArray(totals) || totals.length !== labels.length) {
        addSvgText(svg, { x: 12, y: 32, text: '데이터가 없습니다.', size: 14, fill: '#909090' });
        return;
    }

    const xLabelFormatter = typeof options.xLabelFormatter === 'function'
        ? options.xLabelFormatter
        : (label, i, total) => {
            const short = String(label).length >= 10 ? String(label).slice(5) : String(label);
            return `${short} (${Number(total) || 0})`;
        };

    const titleFormatter = typeof options.titleFormatter === 'function'
        ? options.titleFormatter
        : (label, i) => {
            const t = Number(totals[i]) || 0;
            const lines = [`${label}`, `총합: ${t}`];
            for (const s of series || []) {
                lines.push(`${s.label}: ${Number(s.values[i]) || 0}`);
            }
            return lines.join('\n');
        };

    const onBarClick = typeof options.onBarClick === 'function' ? options.onBarClick : null;

    const maxVal = Math.max(1, ...totals.map(v => (Number.isFinite(v) ? v : 0)));
    const plotW = W - P.left - P.right;
    const plotH = H - P.top - P.bottom;
    const barStep = plotW / labels.length;
    const barW = Math.max(2, Math.min(28, barStep * 0.7));

    // background grid
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
        const ratio = i / gridLines;
        const y = P.top + plotH * (1 - ratio);
        const line = svgEl('line');
        line.setAttribute('x1', String(P.left));
        line.setAttribute('x2', String(P.left + plotW));
        line.setAttribute('y1', String(y));
        line.setAttribute('y2', String(y));
        line.setAttribute('stroke', '#E0E0E0');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);

        const v = Math.round(maxVal * ratio);
        addSvgText(svg, { x: P.left - 8, y: y + 4, text: String(v), size: 11, fill: '#909090', anchor: 'end' });
    }

    // axes
    const axisX = svgEl('line');
    axisX.setAttribute('x1', String(P.left));
    axisX.setAttribute('x2', String(P.left + plotW));
    axisX.setAttribute('y1', String(P.top + plotH));
    axisX.setAttribute('y2', String(P.top + plotH));
    axisX.setAttribute('stroke', '#CCCCCC');
    axisX.setAttribute('stroke-width', '1');
    svg.appendChild(axisX);

    const showEvery = Number.isFinite(options.showEvery)
        ? Math.max(1, options.showEvery)
        : Math.max(1, Math.ceil(labels.length / 10));

    for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const total = Number(totals[i] || 0);

        const xCenter = P.left + i * barStep + barStep / 2;
        const x = xCenter - barW / 2;

        let yCursor = P.top + plotH;
        for (const s of series || []) {
            const v = Number(s && s.values ? s.values[i] : 0) || 0;
            if (v <= 0) continue;

            const h = (v / maxVal) * plotH;
            const y = yCursor - h;
            yCursor = y;

            const rect = svgEl('rect');
            rect.setAttribute('x', String(x));
            rect.setAttribute('y', String(y));
            rect.setAttribute('width', String(barW));
            rect.setAttribute('height', String(h));
            rect.setAttribute('fill', s && s.color ? s.color : '#3D8BFF');
            svg.appendChild(rect);

            if (onBarClick) {
                rect.style.cursor = 'pointer';
                rect.addEventListener('click', () => onBarClick(label, i, total));
            }

            const title = svgEl('title');
            title.textContent = titleFormatter(label, i, s);
            rect.appendChild(title);
        }

        if (i % showEvery === 0 || i === labels.length - 1) {
            const shortLabel = xLabelFormatter(label, i, total);
            addSvgText(svg, {
                x: xCenter,
                y: P.top + plotH + 22,
                text: shortLabel,
                size: 11,
                fill: '#909090',
                anchor: 'middle',
                rotate: (options.rotateXLabels === true || (options.rotateXLabels == null && labels.length > 14))
                    ? { deg: -35, cx: xCenter, cy: P.top + plotH + 22 }
                    : null
            });
        }
    }
}

function buildDateKeysInclusive(startDate, endDate) {
    const keys = [];
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) return keys;
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) return keys;

    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const last = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    while (cur.getTime() <= last.getTime()) {
        keys.push(formatDateKeyLocal(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return keys;
}

async function fetchClickTrace(agent, startTs, endTs) {
    const url =
        `${API_BASE_URL}/aders/report/trace/${encodeURIComponent(agent)}` +
        `?start=${encodeURIComponent(startTs)}` +
        `&end=${encodeURIComponent(endTs)}`;

    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`서버 오류: ${res.status}${text ? ' - ' + text : ''}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
}

function aggregateDaily(items, dateKeys) {
    const map = {};
    dateKeys.forEach(k => (map[k] = 0));

    for (const item of items || []) {
        const ctRaw = item && (item.click_type != null ? item.click_type : item.clickType);
        const ct = Number(ctRaw);
        if (!Number.isFinite(ct)) continue;
        if (ct >= 100) continue;

        const key = extractDateKey(item && item.timestamp);
        if (!key) continue;
        if (map[key] == null) continue; // 요청한 기간 밖은 제외
        map[key] += 1;
    }

    const labels = dateKeys.slice();
    const values = labels.map(k => map[k] || 0);
    return { labels, values };
}

function aggregateHourly(items, dayKey) {
    const counts = Array.from({ length: 24 }, () => 0);
    for (const item of items || []) {
        const ctRaw = item && (item.click_type != null ? item.click_type : item.clickType);
        const ct = Number(ctRaw);
        if (!Number.isFinite(ct)) continue;
        if (ct >= 100) continue;

        const key = extractDateKey(item && item.timestamp);
        if (key !== dayKey) continue;

        const hour = extractHour(item && item.timestamp);
        if (!Number.isFinite(hour)) continue;
        counts[hour] += 1;
    }

    const labels = Array.from({ length: 24 }, (_, i) => pad2(i));
    const values = labels.map((_, i) => counts[i] || 0);
    return { labels, values };
}

function updateSummary(labels, values) {
    const days = labels.length;
    const total = values.reduce((acc, v) => acc + (Number(v) || 0), 0);
    const avg = days > 0 ? total / days : 0;

    if (summaryGrid) summaryGrid.style.display = 'grid';
    if (totalEventsEl) totalEventsEl.textContent = String(total);
    if (avgPerDayEl) avgPerDayEl.textContent = avg.toFixed(2);
    if (daysCountEl) daysCountEl.textContent = String(days);
}

async function loadHourly(dayKey) {
    if (!dayKey) return;
    if (hourlyPanel) hourlyPanel.style.display = 'block';
    if (selectedDayText) selectedDayText.textContent = dayKey;
    if (hourlyHint) hourlyHint.textContent = '';

    const reqId = ++hourlyRequestSeq;
    setHourlyStatus('시간대 조회 중...', 'loading');
    clearSvg(hourlyChartSvg);
    addSvgText(hourlyChartSvg, { x: 12, y: 32, text: '조회 중...', size: 14, fill: '#909090' });

    const startTs = `${dayKey} 00:00:00`;
    const endTs = `${dayKey} 23:59:59`;

    try {
        const items = await fetchClickTrace(AGENT, startTs, endTs);
        if (reqId !== hourlyRequestSeq) return; // 최신 요청만 반영

        const { labels, series, totals } = aggregateHourlyByTypeTopN(items, dayKey, { topN: TOP_N_CLICK_TYPES });
        const total = totals.reduce((acc, v) => acc + (Number(v) || 0), 0);

        setHourlyStatus(`완료: ${total}건`, '');
        renderLegend(hourlyLegend, series);
        renderStackedBarChart(hourlyChartSvg, labels, series, totals, {
            rotateXLabels: false,
            showEvery: 2,
            xLabelFormatter: (label, i, t) => `${label} (${Number(t) || 0})`,
            titleFormatter: (label, i) => {
                const lines = [`${dayKey} ${label}:00 ~ ${label}:59`, `총합: ${Number(totals[i]) || 0}`];
                for (const s of series || []) {
                    lines.push(`${s.label}: ${Number(s.values[i]) || 0}`);
                }
                return lines.join('\n');
            }
        });

        if (hourlyHint) {
            const max = Math.max(0, ...totals);
            hourlyHint.textContent = max === 0 ? '해당 날짜에 이벤트가 없습니다.' : '색상별로 타입 구분해서 볼 수 있습니다.';
        }
    } catch (e) {
        if (reqId !== hourlyRequestSeq) return;
        console.error(e);
        setHourlyStatus(e && e.message ? e.message : '시간대 조회 중 오류가 발생했습니다.', 'error');
        clearSvg(hourlyChartSvg);
        addSvgText(hourlyChartSvg, { x: 12, y: 32, text: '오류로 인해 그래프를 표시할 수 없습니다.', size: 14, fill: '#c62828' });
        if (hourlyHint) hourlyHint.textContent = '';
        renderLegend(hourlyLegend, []);
    }
}

async function load() {
    const startVal = startAtEl ? startAtEl.value : '';
    const endVal = endAtEl ? endAtEl.value : '';

    const startDate = startVal ? new Date(startVal) : null;
    const endDate = endVal ? new Date(endVal) : null;

    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
        setStatus('시작 시간을 선택해주세요.', 'error');
        return;
    }
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
        setStatus('끝 시간을 선택해주세요.', 'error');
        return;
    }
    if (startDate.getTime() > endDate.getTime()) {
        setStatus('시작 시간이 끝 시간보다 이후입니다.', 'error');
        return;
    }

    const startTs = parseDatetimeLocalToTimestampString(startVal);
    const endTs = parseDatetimeLocalToTimestampString(endVal);
    const dateKeys = buildDateKeysInclusive(startDate, endDate);

    setStatus('조회 중...', 'loading');
    if (chartHint) chartHint.textContent = '';
    renderLegend(chartLegend, []);
    if (summaryGrid) summaryGrid.style.display = 'none';
    if (hourlyPanel) hourlyPanel.style.display = 'none';
    setHourlyStatus('');
    if (hourlyHint) hourlyHint.textContent = '';
    renderLegend(hourlyLegend, []);

    try {
        const items = await fetchClickTrace(AGENT, startTs, endTs);
        const { labels, series, totals } = aggregateDailyByTypeTopN(items, dateKeys, { topN: TOP_N_CLICK_TYPES });
        const filteredCount = totals.reduce((acc, v) => acc + (Number(v) || 0), 0);

        setStatus(`완료: ${filteredCount}건`, '');
        updateSummary(labels, totals);
        renderLegend(chartLegend, series);
        renderStackedBarChart(chartSvg, labels, series, totals, {
            onBarClick: (dayKey) => loadHourly(dayKey),
            xLabelFormatter: (dayKey, i, total) => {
                const short = String(dayKey).length >= 10 ? String(dayKey).slice(5) : String(dayKey);
                return `${short} (총 ${Number(total) || 0})`;
            },
            titleFormatter: (dayKey, i) => {
                const lines = [`${dayKey}`, `총합: ${Number(totals[i]) || 0}`];
                for (const s of series || []) {
                    lines.push(`${s.label}: ${Number(s.values[i]) || 0}`);
                }
                return lines.join('\n');
            }
        });

        if (chartHint) {
            const max = Math.max(0, ...totals);
            chartHint.textContent = max === 0
                ? '해당 기간에 이벤트가 없습니다.'
                : '막대를 클릭하면 해당 날짜를 시간대별로 보여줍니다.';
        }
    } catch (e) {
        console.error(e);
        setStatus(e && e.message ? e.message : '조회 중 오류가 발생했습니다.', 'error');
        clearSvg(chartSvg);
        addSvgText(chartSvg, { x: 12, y: 32, text: '오류로 인해 그래프를 표시할 수 없습니다.', size: 14, fill: '#c62828' });
        if (chartHint) chartHint.textContent = '';
        renderLegend(chartLegend, []);
    }
}

function initDefaultRange() {
    const now = new Date();
    const end = new Date(now);
    end.setSeconds(0, 0);

    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);

    if (startAtEl) startAtEl.value = formatForDatetimeLocal(start);
    if (endAtEl) endAtEl.value = formatForDatetimeLocal(end);
}

if (loadBtn) {
    loadBtn.addEventListener('click', load);
}

if (startAtEl) {
    startAtEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') load();
    });
}
if (endAtEl) {
    endAtEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') load();
    });
}

initDefaultRange();
setStatus('기간을 선택한 뒤 조회하세요.', '');
clearSvg(chartSvg);
addSvgText(chartSvg, { x: 12, y: 32, text: '조회 전입니다.', size: 14, fill: '#909090' });

