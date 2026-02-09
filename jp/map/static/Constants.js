const API_BASE_URL = 'https://www.houberapp.com';

class Constants {
    static get DETAIL_ENDPOINT() {
        return `${API_BASE_URL}/big/map/working`;
    }
    
    static get DETAIL_ROUTE_PREFIX() {
        return `${API_BASE_URL}/big/map/detail`;
    }
    
    static get RENT_DETAIL_ENDPOINT() {
        return `${API_BASE_URL}/rent/detail`;
    }
    
    static get SEARCH_ENDPOINT() {
        return `${API_BASE_URL}/map/rent/search`;
    }
    
    static PERFORMANCE_ZOOM_THRESHOLD = 15;
    static CLUSTER_ZOOM_THRESHOLD = 16;
    static MIN_LOCATIONS_FOR_CLUSTERING = 10;
    static LOAD_DEBOUNCE_MS = 400;
    static CLUSTER_PRECISION = {
        VERY_LARGE: 2,
        LARGE: 0.3,
        MEDIUM: 0.1,
        SMALL: 0.03,
        VERY_SMALL: 0.01,
        TINY: 0.005
    };

    static DEFAULT_LOCATION = {
        lat: 34.6822,
        lng: 135.4975
    };

    static DEFAULT_ZOOM = 15;

    /** 바운딩 격자 step(도). 0.001 ≈ 110m. 캐시 히트를 위해 자릿수보다 의미 있는 격자 사용 */
    static BOUNDS_GRID_STEP = 0.001;
    /** 바운딩 값 출력 소수 자릿수 (URL/시그니처 고정용) */
    static BOUNDS_FIXED_DECIMALS = 4;
}

