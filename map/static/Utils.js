/**
 * 유틸리티 함수 모음
 * 
 * 범용적으로 사용되는 헬퍼 함수들
 */
class Utils {
    /**
     * 값이 유한한 숫자인지 확인
     * @param {*} value - 확인할 값
     * @returns {boolean} 유한한 숫자이면 true
     */
    static isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    /**
     * 지도 bounds가 유효한지 확인
     * @param {google.maps.LatLngBounds} bounds - 확인할 bounds
     * @returns {boolean} 유효하면 true
     */
    static isBoundsValid(bounds) {
        if (!bounds) return false;
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        if (!ne || !sw) return false;
        const coords = [ne.lat(), ne.lng(), sw.lat(), sw.lng()];
        return coords.every(Utils.isFiniteNumber);
    }

    /**
     * 지도 bounds의 고유 시그니처 생성 (중복 로딩 방지용)
     * @param {google.maps.LatLngBounds} bounds - 지도 영역
     * @returns {string} bounds 시그니처 문자열
     */
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

    /**
     * 지도 bounds를 쿼리 파라미터로 변환
     * @param {google.maps.LatLngBounds} bounds - 지도 영역
     * @returns {string} URL 쿼리 문자열
     */
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

    /**
     * 통화 형식으로 포맷팅 (엔화)
     * @param {number} value - 포맷팅할 값
     * @returns {string} 포맷팅된 문자열 (예: "10,000엔")
     */
    static formatCurrency(value) {
        if (!Number.isFinite(value)) return '-';
        return `${value.toLocaleString('ko-KR')}엔`;
    }

    /**
     * 큰 숫자를 간단하게 표시 (1M, 100K 형식)
     * @param {number} count - 표시할 숫자
     * @returns {string} 포맷팅된 문자열 (예: "1.5K", "10M")
     */
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

    /**
     * 가격을 '00.0만' 형식으로 포맷팅
     * @param {number} price - 가격 (엔)
     * @returns {string} 포맷팅된 문자열 (예: "5.0만", "10.5만")
     */
    static formatPriceToMan(price) {
        if (!Number.isFinite(price) || price < 0) return '--';
        
        const man = price / 10000; // 만엔 단위로 변환
        return `${man.toFixed(1)}만`;
    }

    /**
     * 중복된 위치 제거
     * @param {Array} locations - 위치 배열
     * @returns {Array} 중복이 제거된 위치 배열
     */
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

