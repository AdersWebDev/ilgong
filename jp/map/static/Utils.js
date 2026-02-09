class Utils {
    static isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    static isBoundsValid(bounds) {
        if (!bounds) return false;
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        if (!ne || !sw) return false;
        const coords = [ne.lat(), ne.lng(), sw.lat(), sw.lng()];
        return coords.every(Utils.isFiniteNumber);
    }

    /** step 격자로 내림. minLat/minLon용, 경계 누락 방지 */
    static floorToStep(v, step) {
        if (!Utils.isFiniteNumber(v) || !step) return v;
        return Math.floor(v / step) * step;
    }

    /** step 격자로 올림. maxLat/maxLon용, 경계 누락 방지 */
    static ceilToStep(v, step) {
        if (!Utils.isFiniteNumber(v) || !step) return v;
        return Math.ceil(v / step) * step;
    }

    /** 격자로 정규화한 bounds 값 4개 반환. getBoundsSignature / buildBoundsQuery 공용 */
    static getNormalizedBoundsStrings(bounds, step = Constants.BOUNDS_GRID_STEP, fixed = Constants.BOUNDS_FIXED_DECIMALS) {
        if (!Utils.isBoundsValid(bounds)) return null;
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        return {
            minLat: Utils.floorToStep(sw.lat(), step).toFixed(fixed),
            minLon: Utils.floorToStep(sw.lng(), step).toFixed(fixed),
            maxLat: Utils.ceilToStep(ne.lat(), step).toFixed(fixed),
            maxLon: Utils.ceilToStep(ne.lng(), step).toFixed(fixed)
        };
    }

    /** 캐시/중복 요청 방지용. buildBoundsQuery와 동일 격자·min=floor, max=ceil */
    static getBoundsSignature(bounds, step = Constants.BOUNDS_GRID_STEP, fixed = Constants.BOUNDS_FIXED_DECIMALS) {
        const n = Utils.getNormalizedBoundsStrings(bounds, step, fixed);
        if (!n) return '';
        return [n.maxLat, n.maxLon, n.minLat, n.minLon].join('|');
    }

    /** 좌표를 고정 소수 자리로 반올림 (bounds 외 용도) */
    static roundCoord(value, decimals = 5) {
        if (!Utils.isFiniteNumber(value)) return value;
        const factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /** 격자(step) 기반 바운딩. nginx 캐시 히트를 위해 의미 있는 격자 사용, min=floor / max=ceil 로 누락 방지 */
    static buildBoundsQuery(bounds, step = Constants.BOUNDS_GRID_STEP, fixed = Constants.BOUNDS_FIXED_DECIMALS) {
        const n = Utils.getNormalizedBoundsStrings(bounds, step, fixed);
        if (!n) return '';
        return new URLSearchParams({ minLat: n.minLat, minLon: n.minLon, maxLat: n.maxLat, maxLon: n.maxLon }).toString();
    }

    static formatCurrency(value) {
        if (!Number.isFinite(value)) return '-';
        return `${value.toLocaleString('ja-JP')}円`;
    }

    static formatCount(count) {
        if (!Number.isFinite(count) || count < 0) return '0';
        
        if (count >= 1000000) {
            const millions = count / 1000000;
            return millions >= 10 ? `${Math.floor(millions)}M` : `${millions.toFixed(1)}M`;
        } else if (count >= 1000) {
            const thousands = count / 1000;
            return thousands >= 100 ? `${Math.floor(thousands)}K` : `${thousands.toFixed(1)}K`;
        }
        return count.toString();
    }

    static formatPriceToMan(price) {
        if (!Number.isFinite(price) || price < 0) return '--';
        const man = price / 10000;
        return `${man.toFixed(1)}万`;
    }

    static removeDuplicateLocations(locations) {
        const uniqueLocations = [];
        const seenIds = new Set();
        
        locations.forEach(location => {
            const locationId = location.id || `${location.lat}_${location.lng}`;
            if (!seenIds.has(locationId)) {
                seenIds.add(locationId);
                uniqueLocations.push(location);
            }
        });
        
        return uniqueLocations;
    }
}

