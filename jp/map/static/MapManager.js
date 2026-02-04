/**
 * 지도 관리 클래스
 * 
 * Google Maps 초기화 및 이벤트 관리
 */
class MapManager {
    /**
     * @param {string} mapElementId - 지도 컨테이너 요소 ID
     */
    constructor(mapElementId) {
        this.mapElementId = mapElementId;
        this.map = null;
        this.markerClusterer = null;
        this.loadDebounceTimer = null;
        this.lastLoadedBoundsSignature = '';
        this.hasAdjustedToData = false;
        
        // 의존성 주입
        this.markerManager = null;
        this.dataLoader = null;
        this.onIdleCallback = null;
    }

    /**
     * 지도 초기화
     */
    init() {
        const defaultLocation = Constants.DEFAULT_LOCATION;
        const defaultZoom = Constants.DEFAULT_ZOOM;

        // 지도 생성
        this.map = new google.maps.Map(document.getElementById(this.mapElementId), {
            center: defaultLocation,
            zoom: defaultZoom,
            disableDefaultUI: true,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM, // 위치 변경 가능
                style: google.maps.ZoomControlStyle.SMALL // 또는 DEFAULT, LARGE
            },
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: false,
            rotateControl: false,
            scaleControl: false,
            styles: this.getMapStyles(),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            gestureHandling: 'greedy'
        });

        UIRenderer.updateMapStatus('On Ready');

        // MarkerClusterer 초기화
        this.initMarkerClusterer();

        // 이벤트 리스너 등록
        this.setupEventListeners();
    }

    /**
     * MarkerClusterer 초기화
     */
    initMarkerClusterer() {
        const MarkerClustererClass = window.markerClusterer?.MarkerClusterer || window.MarkerClusterer;
        if (MarkerClustererClass) {
            this.markerClusterer = new MarkerClustererClass({ map: this.map });
        }
    }

    /**
     * 지도 스타일 설정 반환
     * @returns {Array} 지도 스타일 배열
     */
    getMapStyles() {
        return [
            {
                featureType: 'administrative.land_parcel',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'administrative.neighborhood',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'poi',
                elementType: 'labels.text',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'poi.business',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'poi.park',
                elementType: 'labels.text',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'road',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'road.arterial',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'road.highway',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'road.local',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'water',
                elementType: 'labels.text',
                stylers: [{ visibility: 'off' }]
            }
        ];
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 지도 idle 이벤트
        this.map.addListener('idle', () => this.handleMapIdle());
        
        // 줌 레벨 변경 감지
        let lastZoom = this.map.getZoom();
        this.map.addListener('zoom_changed', () => {
            const currentZoom = this.map.getZoom();
            
            // 줌 레벨이 임계값을 넘나들 때만 재로드
            if ((lastZoom <= Constants.PERFORMANCE_ZOOM_THRESHOLD) !== 
                (currentZoom <= Constants.PERFORMANCE_ZOOM_THRESHOLD)) {
                lastZoom = currentZoom;
                this.lastLoadedBoundsSignature = '';
                const bounds = this.map.getBounds();
                if (bounds && this.onIdleCallback) {
                    this.onIdleCallback(bounds, { force: true });
                }
            } else {
                lastZoom = currentZoom;
            }
        });
    }

    /**
     * 지도 idle 이벤트 핸들러
     */
    handleMapIdle() {
        if (!this.map) return;
        
        // 디바운스: 연속된 이벤트를 방지
        if (this.loadDebounceTimer) {
            clearTimeout(this.loadDebounceTimer);
        }
        
        this.loadDebounceTimer = setTimeout(() => {
            if (!this.map) return;
            const bounds = this.map.getBounds();
            if (!bounds) return;
            
            if (this.onIdleCallback) {
                this.onIdleCallback(bounds);
            }
            
            this.loadDebounceTimer = null;
        }, Constants.LOAD_DEBOUNCE_MS);
    }

    /**
     * MarkerManager 설정
     * @param {MarkerManager} markerManager - MarkerManager 인스턴스
     */
    setMarkerManager(markerManager) {
        this.markerManager = markerManager;
    }

    /**
     * DataLoader 설정
     * @param {DataLoader} dataLoader - DataLoader 인스턴스
     */
    setDataLoader(dataLoader) {
        this.dataLoader = dataLoader;
    }

    /**
     * Idle 콜백 설정
     * @param {Function} callback - 콜백 함수
     */
    setIdleCallback(callback) {
        this.onIdleCallback = callback;
    }

    /**
     * 지도 인스턴스 반환
     * @returns {google.maps.Map} 지도 인스턴스
     */
    getMap() {
        return this.map;
    }

    /**
     * MarkerClusterer 인스턴스 반환
     * @returns {Object} MarkerClusterer 인스턴스
     */
    getMarkerClusterer() {
        return this.markerClusterer;
    }

    /**
     * 마지막 로드된 bounds 시그니처 반환
     * @returns {string} bounds 시그니처
     */
    getLastLoadedBoundsSignature() {
        return this.lastLoadedBoundsSignature;
    }

    /**
     * 마지막 로드된 bounds 시그니처 설정
     * @param {string} signature - bounds 시그니처
     */
    setLastLoadedBoundsSignature(signature) {
        this.lastLoadedBoundsSignature = signature;
    }

    /**
     * 뷰 조정 플래그 반환
     * @returns {boolean} 뷰 조정 여부
     */
    getHasAdjustedToData() {
        return this.hasAdjustedToData;
    }

    /**
     * 뷰 조정 플래그 설정
     * @param {boolean} value - 뷰 조정 여부
     */
    setHasAdjustedToData(value) {
        this.hasAdjustedToData = value;
    }
}

