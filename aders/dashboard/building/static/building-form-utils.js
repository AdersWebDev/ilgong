/**
 * building-form-utils.js
 * - 건물 폼/스냅샷/디프용 순수 유틸 (DOM·state 없음)
 * - detail.building.js, add, snapshot 모듈에서 공통 사용
 */
(function () {
    'use strict';

    function normalizeValue(v) {
        if (v === true) return 'true';
        if (v === false) return 'false';
        if (v == null) return '';
        return String(v);
    }

    function toBoolLoose(v) {
        return v === true || v === 'true' || v === 1 || v === '1';
    }

    function arraysEqualShallow(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b)) return false;
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    function toIsoLocalDate(year, month, day) {
        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
        if (month < 1 || month > 12) return null;
        if (day < 1 || day > 31) return null;

        const dt = new Date(Date.UTC(year, month - 1, day));
        if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null;

        const mm = String(month).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return year + '-' + mm + '-' + dd;
    }

    function normalizeLocalDateString(v) {
        const s = (v == null ? '' : String(v)).trim();
        if (!s) return null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

        let t = s
            .replace(/\//g, '-')
            .replace(/\./g, '-')
            .replace(/\s+/g, '');

        let m = t.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
        if (m) {
            const y = Number(m[1]);
            const mo = Number(m[2]);
            const d = Number(m[3]);
            return toIsoLocalDate(y, mo, d);
        }
        m = t.match(/^(\d{4})年(\d{1,2})月$/);
        if (m) {
            const y = Number(m[1]);
            const mo = Number(m[2]);
            return toIsoLocalDate(y, mo, 1);
        }

        m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (m) {
            const y = Number(m[1]);
            const mo = Number(m[2]);
            const d = Number(m[3]);
            return toIsoLocalDate(y, mo, d);
        }

        return null;
    }

    var STRUCTURE_ENUM_LABEL = {
        CONCRETE: '철근·콘크리트 계열',
        STEEL: '철골 계열',
        OTHER: '기타 계열(목조 등)'
    };

    function normalizeStructureEnum(v) {
        const s = (v == null ? '' : String(v)).trim();
        if (!s) return null;
        if (s === 'CONCRETE' || s === 'STEEL' || s === 'OTHER') return s;

        if (s.includes('콘크리트') || s.includes('철근') || s.toLowerCase().includes('concrete')) return 'CONCRETE';
        if (s.includes('철골') || s.toLowerCase().includes('steel')) return 'STEEL';
        return 'OTHER';
    }

    /** keyOriginal → 서버로 보낼 경로. /content/original 제거, /building/xxx.png 형태 */
    function keyToPhotoPath(keyOriginal) {
        if (!keyOriginal || !String(keyOriginal).trim()) return '';
        var key = String(keyOriginal).trim().replace(/^\//, '').replace(/^content\/original\/?/i, '');
        return key ? '/' + key : '';
    }

    function cloneJson(obj) {
        if (obj == null) return obj;
        return JSON.parse(JSON.stringify(obj));
    }

    function toNumberOrNull(v) {
        const s = (v == null ? '' : String(v)).trim();
        if (!s) return null;
        const n = Number(s);
        return Number.isFinite(n) ? n : null;
    }

    window.BuildingFormUtils = {
        normalizeValue: normalizeValue,
        toBoolLoose: toBoolLoose,
        arraysEqualShallow: arraysEqualShallow,
        normalizeLocalDateString: normalizeLocalDateString,
        toIsoLocalDate: toIsoLocalDate,
        STRUCTURE_ENUM_LABEL: STRUCTURE_ENUM_LABEL,
        normalizeStructureEnum: normalizeStructureEnum,
        keyToPhotoPath: keyToPhotoPath,
        cloneJson: cloneJson,
        toNumberOrNull: toNumberOrNull
    };
})();
