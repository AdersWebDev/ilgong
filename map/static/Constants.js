/**
 * 애플리케이션 상수 정의
 * 
 * 모든 설정값과 상수를 중앙에서 관리
 */
class Constants {
    // API 엔드포인트 설정
    // static DETAIL_ENDPOINT = 'http://localhost:40011/big/map/working';
    // static DETAIL_ROUTE_PREFIX = 'http://localhost:40011/big/map/detail';
    // static RENT_DETAIL_ENDPOINT = 'http://localhost:40011/rent/detail';
    static DETAIL_ENDPOINT = 'https://www.houberapp.com/big/map/working';
    static DETAIL_ROUTE_PREFIX = 'https://www.houberapp.com/big/map/detail';
    static RENT_DETAIL_ENDPOINT = 'https://www.houberapp.com/rent/detail';
    
    // 성능 최적화 설정
    static PERFORMANCE_ZOOM_THRESHOLD = 15; // 줌 레벨 15 이하일 때 성능 모드 활성화
    static CLUSTER_ZOOM_THRESHOLD = 16; // 줌 레벨 11을 기준으로 클러스터링 범위 변경
    static MIN_LOCATIONS_FOR_CLUSTERING = 10; // 클러스터링을 위한 최소 건물 수
    
    // 디바운스 설정
    static LOAD_DEBOUNCE_MS = 400; // 지도 이동 후 데이터 로딩 지연 시간 (ms)
    
    // 클러스터링 precision 값 (도 단위, 약 111km = 1도)
    static CLUSTER_PRECISION = {
        VERY_LARGE: 1.5,   // 약 100km (현 단위)
        LARGE: 0.5,        // 약 50km (시 단위 또는 11 이상)
        MEDIUM: 0.3,       // 약 30km (시 단위)
        SMALL: 0.08,        // 약 20km (시 단위)
        VERY_SMALL: 0.02,  // 약 2km (구 단위)
        TINY: 0.01         // 약 1km (구 단위)
    };

    // 기본 지도 위치 (오사카)
    static DEFAULT_LOCATION = {
        lat: 34.68226531215091,
        lng: 135.497583508982
    };

    // 기본 지도 줌 레벨
    static DEFAULT_ZOOM = 16;
}

