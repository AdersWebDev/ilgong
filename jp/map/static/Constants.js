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
        VERY_LARGE: 1.5,
        LARGE: 0.5,
        MEDIUM: 0.3,
        SMALL: 0.08,
        VERY_SMALL: 0.02,
        TINY: 0.01
    };

    static DEFAULT_LOCATION = {
        lat: 34.68226531215091,
        lng: 135.497583508982
    };

    static DEFAULT_ZOOM = 16;
}

