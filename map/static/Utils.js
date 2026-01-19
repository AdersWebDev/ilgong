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

    static getBoundsSignature(bounds) {
        if (!Utils.isBoundsValid(bounds)) return '';
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        return [
            ne.lat().toFixed(4),
            ne.lng().toFixed(4),
            sw.lat().toFixed(4),
            sw.lng().toFixed(4)
        ].join('|');
    }

    static buildBoundsQuery(bounds) {
        if (!Utils.isBoundsValid(bounds)) return '';
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        const params = new URLSearchParams({
            maxLat: ne.lat(),
            maxLon: ne.lng(),
            minLat: sw.lat(),
            minLon: sw.lng()
        });

        return params.toString();
    }

    static formatCurrency(value) {
        if (!Number.isFinite(value)) return '-';
        return `${value.toLocaleString('ko-KR')}엔`;
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
        return `${man.toFixed(1)}만`;
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

