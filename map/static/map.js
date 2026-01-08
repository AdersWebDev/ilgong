/**
 * Google Maps 기반 부동산 지도 애플리케이션 - 메인 파일 (필터 기능 통합)
 * 
 * 모든 모듈을 통합하여 애플리케이션을 초기화하고 관리
 * 필터, 검색, 프로퍼티 리스트 기능 포함
 * 
 * @author 일본공간 개발팀
 * @version 4.0 (필터 기능 통합)
 */
(function () {
    'use strict';

    // ============================================================================
    // 전역 변수
    // ============================================================================
    
    /** 애플리케이션 인스턴스 */
    let app = null;

    /** 프로퍼티 데이터 (필터링 전 원본) */
    let propertyData = [];

    /** 자동완성 데이터 */
    const AUTOCOMPLETE_DATA = [
        "CITYSPIRE難波WEST",
        "グランメゾン梅田",
        "パークハイツ心斎橋",
        "サンシティ天王寺",
        "レジデンス新大阪",
        "メゾン本町",
        "ハイツなんば",
        "プレミアム阿倍野",
        "エスポワール京橋",
        "コーポ福島"
    ];

    // ============================================================================
    // 메인 애플리케이션 클래스 (필터 기능 통합)
    // ============================================================================

    /**
     * 지도 애플리케이션 메인 클래스
     * 모든 모듈을 통합하여 관리 (필터, 검색, 프로퍼티 리스트 포함)
     */
    class MapApplication {
        /**
         * @param {string} mapElementId - 지도 컨테이너 요소 ID
         */
        constructor(mapElementId) {
            this.mapElementId = mapElementId;
            this.mapManager = null;
            this.markerManager = null;
            this.dataLoader = null;
            this.filterManager = null;
            this.searchManager = null;
            this.propertyListManager = null;
            this.mobileManager = null;
            this.propertyData = [];
        }

        /**
         * 애플리케이션 초기화
         */
        init() {
            // MapManager 초기화
            this.mapManager = new MapManager(this.mapElementId);
            this.mapManager.init();

            // DataLoader 초기화
            this.dataLoader = new DataLoader(Constants.DETAIL_ENDPOINT);

            // MarkerManager 초기화
            const map = this.mapManager.getMap();
            const markerClusterer = this.mapManager.getMarkerClusterer();
            this.markerManager = new MarkerManager(map, markerClusterer);

            // MapManager에 의존성 주입
            this.mapManager.setMarkerManager(this.markerManager);
            this.mapManager.setDataLoader(this.dataLoader);
            this.mapManager.setIdleCallback((bounds, options) => {
                this.handleMapIdle(bounds, options);
            });

            // 필터 관리자 초기화
            this.filterManager = new FilterManager((filteredProperties) => {
                this.onFilterChange(filteredProperties);
            });
            this.filterManager.init();
            
            // 프로퍼티 데이터가 로드되면 FilterManager에 설정
            // (loadPropertyData에서 설정됨)

            // 검색 관리자 초기화
            // 검색 쿼리는 SearchManager에서 독립적으로 처리됨
            this.searchManager = new SearchManager(AUTOCOMPLETE_DATA, (query) => {
                // 검색 쿼리는 별도 파일에서 독립적으로 fetch 처리
                // 필터는 FilterManager에서 별도로 처리
                // 필요시 여기서 검색 결과와 필터 결과를 조합
            });
            this.searchManager.init();

            // 프로퍼티 리스트 관리자 초기화 (DataLoader 주입)
            this.propertyListManager = new PropertyListManager(10, (property) => {
                this.onPropertyClick(property);
            }, this.dataLoader);
            this.propertyListManager.init();

            // 모바일 관리자 초기화
            this.mobileManager = new MobileManager();
            this.mobileManager.init();

            // DOM 이벤트 리스너 등록
            this.setupDOMEventListeners();

            // 프로퍼티 데이터 로드 (더미 데이터 또는 API)
            this.loadPropertyData();
        }


        /**
         * 프로퍼티 데이터 로드
         */
        loadPropertyData() {
            // TODO: 실제 API에서 데이터 로드
            // 현재는 더미 데이터 또는 빈 배열
            this.propertyData = [];
            
            // 필터 적용 (초기 상태)
            const filtered = this.filterManager.applyFilters(this.propertyData);
            this.propertyListManager.setFilteredProperties(filtered);
        }

        /**
         * 필터 변경 시 호출되는 콜백
         * @param {Array} filteredProperties - 필터링된 프로퍼티 배열
         */
        onFilterChange(filteredProperties) {
            // 필터가 변경되면 지도 데이터를 다시 로드 (필터 파라미터 포함)
            // API에서 이미 필터링된 데이터를 받아오므로 클라이언트 사이드 필터링은 불필요
            const map = this.mapManager.getMap();
            if (map) {
                const bounds = map.getBounds();
                if (bounds) {
                    // force: true로 설정하여 중복 로딩 방지 무시하고 재로드
                    this.handleMapIdle(bounds, { force: true });
                }
            }
        }

        /**
         * 프로퍼티 클릭 시 호출되는 콜백
         * @param {Object} property - 클릭된 프로퍼티
         */
        onPropertyClick(property) {
            const map = this.mapManager.getMap();
            if (map && property.lat && property.lng) {
                // 지도 중심 이동
                map.setCenter({ lat: property.lat, lng: property.lng });
                map.setZoom(20);
                
                // 프로퍼티 정보 표시 (필요시)
                // this.showPropertyInfo(property);
            }
            
            // 모바일에서 프로퍼티 리스트 패널 닫기
            if (window.innerWidth <= 1023) {
                const propertyListPanel = document.querySelector('.property-list-panel');
                if (propertyListPanel) {
                    propertyListPanel.classList.remove('active');
                }
            }
        }

        /**
         * 지도 마커 업데이트 (필터링된 프로퍼티로)
         * @param {Array} properties - 표시할 프로퍼티 배열
         */
        updateMapMarkers(properties) {
            if (!this.markerManager) return;
            
            // 기존 마커 제거
            this.markerManager.clearMarkers();
            
            if (properties.length === 0) {
                UIRenderer.updateMapStatus('필터링된 결과가 없습니다.');
                return;
            }
            
            // 프로퍼티를 위치 데이터 형식으로 변환
            const locations = properties.map(property => ({
                id: property.id,
                lat: property.lat,
                lng: property.lng,
                name: property.name || property.buildingName || '',
                price: property.price || 0,
                property: property
            }));
            
            this.updateMapMarkersFromLocations(locations, properties);
        }

        /**
         * 위치 데이터로부터 지도 마커 업데이트
         * @param {Array} locations - 위치 데이터 배열
         * @param {Array} filteredProperties - 필터링된 프로퍼티 배열 (상태 메시지용)
         */
        updateMapMarkersFromLocations(locations, filteredProperties = []) {
            if (!this.markerManager) return;
            
            const map = this.mapManager.getMap();
            if (!map) return;
            
            // 중복 제거
            const uniqueLocations = Utils.removeDuplicateLocations(locations);
            const actualLocationCount = uniqueLocations.length;
            
            // 현재 줌 레벨 확인
            const currentZoom = map.getZoom();
            const usePerformanceMode = currentZoom <= Constants.PERFORMANCE_ZOOM_THRESHOLD;
            
            // 기존 마커 제거
            this.markerManager.clearMarkers();
            
            // 성능 모드 여부에 따라 다른 방식으로 마커 표시
            if (usePerformanceMode && actualLocationCount > Constants.MIN_LOCATIONS_FOR_CLUSTERING) {
                // 성능 모드: 시/현 또는 구 단위로 그룹화
                const groupedLocations = ClusterManager.groupLocationsByWard(uniqueLocations, currentZoom);
                const totalGroupedCount = groupedLocations.reduce((sum, group) => sum + group.count, 0);
                const groupType = currentZoom >= Constants.CLUSTER_ZOOM_THRESHOLD ? '50km' : '시/현';
                
                // 그룹 마커 클릭 핸들러 생성
                const groupClickHandlers = new Map();
                groupedLocations.forEach(location => {
                    const key = `${location.lat}_${location.lng}`;
                    groupClickHandlers.set(key, () => {
                        // 그룹 마커 클릭 시 해당 영역으로 줌 인
                        if (location.locations) {
                            const groupBounds = new google.maps.LatLngBounds();
                            location.locations.forEach(loc => {
                                const locLat = Number(loc.lat);
                                const locLng = Number(loc.lng);
                                if (Utils.isFiniteNumber(locLat) && Utils.isFiniteNumber(locLng)) {
                                    groupBounds.extend({ lat: locLat, lng: locLng });
                                }
                            });
                            
                            if (!groupBounds.isEmpty()) {
                                map.fitBounds(groupBounds);
                            }
                        }
                    });
                });
                
                this.markerManager.displayLocations(groupedLocations, {
                    performanceMode: true,
                    onGroupClick: (marker, location) => {
                        const key = `${location.lat}_${location.lng}`;
                        const handler = groupClickHandlers.get(key);
                        if (handler) handler();
                    }
                });
                
                UIRenderer.updateMapStatus(
                    `${groupedLocations.length}개 ${groupType}에 ${Utils.formatCount(totalGroupedCount)}개 건물이 있습니다. (줌 레벨: ${currentZoom})`
                );
            } else {
                // 개별 마커 클릭 핸들러 생성
                const markerClickHandlers = new Map();
                uniqueLocations.forEach(location => {
                    const key = `${location.lat}_${location.lng}`;
                    markerClickHandlers.set(key, () => {
                        // 개별 마커 클릭 시 상세 정보 로드
                        if (location.id) {
                            this.dataLoader.loadLocationDetails(location.id);
                        }
                    });
                });
                
                // 일반 모드: 개별 마커 표시 (MarkerClusterer가 자동으로 클러스터링)
                this.markerManager.displayLocations(uniqueLocations, {
                    performanceMode: false,
                    onMarkerClick: (marker, location) => {
                        const key = `${location.lat}_${location.lng}`;
                        const handler = markerClickHandlers.get(key);
                        if (handler) handler();
                    }
                });
                
                const displayCount = filteredProperties.length > 0 ? filteredProperties.length : actualLocationCount;
                UIRenderer.updateMapStatus(`${displayCount.toLocaleString('ko-KR')}개의 위치를 표시했습니다.`);
            }
        }

        /**
         * 지도 idle 이벤트 핸들러
         * 지도 이동/확대가 끝날 때마다 데이터 갱신
         * 
         * @param {google.maps.LatLngBounds} bounds - 지도 영역
         * @param {Object} options - 옵션 객체
         */
        async handleMapIdle(bounds, options = {}) {
            const { force = false, adjustView } = options;
            const map = this.mapManager.getMap();
            
            if (!map) return;

            const effectiveBounds = bounds || map.getBounds();

            // 유효성 검사
            if (!effectiveBounds) {
                UIRenderer.updateMapStatus('지도가 준비되는 중...');
                return;
            }

            if (!Utils.isBoundsValid(effectiveBounds)) {
                UIRenderer.updateMapStatus('지도 영역을 계산하는 중...');
                return;
            }

            // 중복 로딩 방지
            const boundsSignature = Utils.getBoundsSignature(effectiveBounds);
            if (!force && boundsSignature === this.mapManager.getLastLoadedBoundsSignature()) {
                return;
            }

            try {
                // 로딩 상태 표시
                const loadingIndicator = document.getElementById('loadingIndicator');
                const locationList = document.getElementById('locationList');
                
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'block';
                    loadingIndicator.textContent = '데이터 로딩 중...';
                }
                if (locationList) locationList.innerHTML = '';
                UIRenderer.updateMapStatus('현재 화면의 데이터를 불러오는 중...');

                // 필터 쿼리 스트링 가져오기
                const filterQueryString = this.filterManager.getFilterQueryString();
                
                // 데이터 로드 (필터 파라미터 포함)
                const locations = await this.dataLoader.loadMapData(effectiveBounds, filterQueryString);

                // 데이터가 없을 경우
                if (locations.length === 0) {
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'block';
                        loadingIndicator.textContent = '표시할 위치가 없습니다.';
                    }
                    UIRenderer.updateMapStatus('해당 영역에 데이터가 없습니다.');
                    this.markerManager.clearMarkers();
                    this.mapManager.setLastLoadedBoundsSignature(boundsSignature);
                    return;
                }

                // 프로퍼티 데이터 업데이트 (API에서 받은 데이터를 프로퍼티 형식으로 변환)
                // 백엔드 DTO: id, lat, lng, thumbnail, buildingName
                this.propertyData = locations.map(loc => ({
                    id: loc.id,
                    name: loc.buildingName || '',
                    buildingName: loc.buildingName || '',
                    lat: Number(loc.lat),
                    lng: Number(loc.lng),
                    image: loc.thumbnail || '',
                    thumbnail: loc.thumbnail || '',
                    // 기본값 설정 (상세 정보는 나중에 로드)
                    price: 0,
                    type: '',
                    rooms: '',
                    location: '',
                    buildingType: '',
                    options: []
                }));

                // FilterManager에 프로퍼티 데이터 설정
                if (this.filterManager) {
                    this.filterManager.setPropertyData(this.propertyData);
                }

                // API에서 이미 필터링된 데이터를 받아왔으므로 그대로 사용
                // applyFilters를 호출하지 않음 (무한 루프 방지)
                this.propertyListManager.setFilteredProperties(this.propertyData);
                
                // 지도 마커용 locations 데이터에 name과 price 필드 추가
                const propertyMap = new Map();
                this.propertyData.forEach(prop => {
                    if (prop.id) {
                        propertyMap.set(prop.id, prop);
                    }
                });
                
                const locationsForMarkers = locations.map(loc => {
                    const property = propertyMap.get(loc.id);
                    return {
                        ...loc,
                        name: loc.buildingName || '',
                        price: property ? property.price : (loc.price || 0),
                        property: property || null
                    };
                });
                
                // 지도 마커 업데이트 (API에서 필터링된 데이터 사용)
                this.updateMapMarkersFromLocations(locationsForMarkers, this.propertyData);
                
                // 초기 뷰 조정 플래그 설정
                const shouldAdjustView = typeof adjustView === 'boolean' 
                    ? adjustView 
                    : !this.mapManager.getHasAdjustedToData();
                
                if (shouldAdjustView) {
                    this.mapManager.setHasAdjustedToData(true);
                }

                // 로딩 완료
                if (loadingIndicator) loadingIndicator.style.display = 'none';
                this.mapManager.setLastLoadedBoundsSignature(boundsSignature);

            } catch (error) {
                console.error('데이터 로드 오류:', error);
                const loadingIndicator = document.getElementById('loadingIndicator');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'block';
                    loadingIndicator.textContent = '데이터를 불러오는데 실패했습니다.';
                }
                UIRenderer.updateMapStatus('데이터 로드 실패');
            }
        }

        /**
         * DOM 이벤트 리스너 설정
         */
        setupDOMEventListeners() {
            document.addEventListener('DOMContentLoaded', () => {
                // 새로고침 버튼
                const refreshBtn = document.getElementById('refreshBtn');
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', () => {
                        const map = this.mapManager.getMap();
                        const bounds = map ? map.getBounds() : null;
                        this.handleMapIdle(bounds, { force: true, adjustView: true });
                    });
                }

                // 중심으로 버튼
                const centerBtn = document.getElementById('centerBtn');
                if (centerBtn) {
                    centerBtn.addEventListener('click', () => {
                        const markers = this.markerManager.getMarkers();
                        const map = this.mapManager.getMap();
                        
                        if (markers.length > 0) {
                            // 모든 마커를 포함하는 bounds로 이동
                            const bounds = new google.maps.LatLngBounds();
                            markers.forEach(marker => bounds.extend(marker.getPosition()));
                            map.fitBounds(bounds);
                        } else {
                            // 기본 위치로 이동
                            map.setCenter(Constants.DEFAULT_LOCATION);
                            map.setZoom(Constants.DEFAULT_ZOOM);
                        }
                    });
                }
            });
        }
    }

    // ============================================================================
    // 전역 함수 노출
    // ============================================================================

    /**
     * Google Maps API 콜백용 전역 함수
     * HTML에서 Google Maps API 로드 시 callback=initMap으로 지정
     */
    window.initMap = function() {
        if (!app) {
            app = new MapApplication('map');
            app.init();
        }
    };
})();
