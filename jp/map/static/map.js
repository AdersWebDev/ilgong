(function () {
    'use strict';

    let app = null;
    let propertyData = [];

    const AUTOCOMPLETE_DATA = []

    class MapApplication {
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
        this.isInitialLoad = true;
        this.pendingInfoWindowLocation = null;
    }

        init() {
            this.mapManager = new MapManager(this.mapElementId);
            this.mapManager.init();
            this.dataLoader = new DataLoader(Constants.DETAIL_ENDPOINT);
            const map = this.mapManager.getMap();
            const markerClusterer = this.mapManager.getMarkerClusterer();
            this.markerManager = new MarkerManager(map, markerClusterer);
            this.mapManager.setMarkerManager(this.markerManager);
            this.mapManager.setDataLoader(this.dataLoader);
            this.mapManager.setIdleCallback((bounds, options) => {
                this.handleMapIdle(bounds, options);
            });
            this.filterManager = new FilterManager((filteredProperties) => {
                this.onFilterChange(filteredProperties);
            });
            this.filterManager.init();
            this.searchManager = new SearchManager(AUTOCOMPLETE_DATA, (query) => {
            }, (result) => {
                this.requestOpenInfoWindow({
                    lat: Number(result.lat),
                    lng: Number(result.lng),
                    producer: result.producer || undefined,
                    id: result.id || undefined
                });
            });
            this.searchManager.init();
            this.propertyListManager = new PropertyListManager(10, (property) => {
                this.onPropertyClick(property);
            }, this.dataLoader, (location) => {
                this.requestOpenInfoWindow(location);
            });
            this.propertyListManager.init();
            this.mobileManager = new MobileManager();
            this.mobileManager.init();
            this.setupDOMEventListeners();
            this.loadPropertyData();
        }

        loadPropertyData() {
            this.propertyData = [];
            const filtered = this.filterManager.applyFilters(this.propertyData);
            this.propertyListManager.setFilteredProperties(filtered);
        }

        onFilterChange(filteredProperties) {
            const map = this.mapManager.getMap();
            if (map) {
                const bounds = map.getBounds();
                if (bounds) {
                    this.handleMapIdle(bounds, { force: true });
                }
            }
        }

        onPropertyClick(property) {
            const map = this.mapManager.getMap();
            if (map && property.lat && property.lng) {
                map.setCenter({ lat: property.lat, lng: property.lng });
                map.setZoom(20);
            }
            if (window.innerWidth <= 1023) {
                const propertyListPanel = document.querySelector('.property-list-panel');
                if (propertyListPanel) {
                    propertyListPanel.classList.remove('active');
                }
            }
        }

        updateMapMarkersFromLocations(locations, filteredProperties = []) {
            if (!this.markerManager) return;
            const map = this.mapManager.getMap();
            if (!map) return;
            const uniqueLocations = Utils.removeDuplicateLocations(locations);
            const actualLocationCount = uniqueLocations.length;
            const currentZoom = map.getZoom();
            const usePerformanceMode = currentZoom <= Constants.PERFORMANCE_ZOOM_THRESHOLD;
            const appendMode = !this.isInitialLoad && currentZoom >= 16;
            if (this.isInitialLoad || currentZoom < 16) {
                this.markerManager.clearMarkers();
            }
            if (usePerformanceMode && actualLocationCount > Constants.MIN_LOCATIONS_FOR_CLUSTERING) {
                if (!appendMode) {
                    const groupedLocations = ClusterManager.groupLocationsByWard(uniqueLocations, currentZoom);
                    const totalGroupedCount = groupedLocations.reduce((sum, group) => sum + group.count, 0);
                    const groupType = currentZoom >= Constants.CLUSTER_ZOOM_THRESHOLD ? '50km' : '시/현';
                    const groupClickHandlers = new Map();
                    groupedLocations.forEach(location => {
                        const key = `${location.lat}_${location.lng}`;
                        groupClickHandlers.set(key, () => {
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
                }
            } else {
                const markerClickHandlers = new Map();
                uniqueLocations.forEach(location => {
                    const key = `${location.lat}_${location.lng}`;
                    markerClickHandlers.set(key, () => {
                        if (location.id) {
                            this.dataLoader.loadLocationDetails(location.producer, location.id);
                        }
                    });
                });
                this.markerManager.displayLocations(uniqueLocations, {
                    performanceMode: false,
                    appendMode: appendMode,
                    onMarkerClick: (marker, location) => {
                        this.markerManager.showInfoWindow(marker, location);
                    }
                });
                
                const displayCount = filteredProperties.length > 0 ? filteredProperties.length : actualLocationCount;
                const newMarkersCount = appendMode ? uniqueLocations.filter(loc => {
                    if (!loc.producer || !loc.id) return false;
                    const markerKey = `${loc.producer}_${loc.id}`;
                    return !this.markerManager.displayedMarkerKeys.has(markerKey);
                }).length : actualLocationCount;
                
                if (appendMode && newMarkersCount > 0) {
                    UIRenderer.updateMapStatus(`새로운 ${newMarkersCount.toLocaleString('ko-KR')}개의 위치를 추가했습니다.`);
                } else {
                    UIRenderer.updateMapStatus(`${displayCount.toLocaleString('ko-KR')}개의 위치를 표시했습니다.`);
                }
            }

            // 카드/검색 클릭으로 요청된 InfoWindow가 있으면, 마커 생성 이후에 오픈 시도
            this.tryOpenPendingInfoWindow();
        }

        requestOpenInfoWindow(location) {
            const map = this.mapManager.getMap();
            if (!map || !location) return;

            this.pendingInfoWindowLocation = location;

            // 클러스터링 상태에서도 확실히 개별 마커가 나오도록 충분히 줌인
            map.setCenter({ lat: Number(location.lat), lng: Number(location.lng) });
            map.setZoom(20);

            // 즉시 열 수 있으면 열고, 아니면 다음 렌더(Idle)에서 열림
            this.tryOpenPendingInfoWindow();
        }

        tryOpenPendingInfoWindow() {
            if (!this.pendingInfoWindowLocation || !this.markerManager) return;

            const marker = this.markerManager.findMarkerByLocation(this.pendingInfoWindowLocation);
            if (marker && marker.locationData) {
                this.markerManager.showInfoWindow(marker, marker.locationData);
                this.pendingInfoWindowLocation = null;
            }
        }

        async handleMapIdle(bounds, options = {}) {
            const { force = false, adjustView } = options;
            const map = this.mapManager.getMap();
            if (!map) return;
            const effectiveBounds = bounds || map.getBounds();
            if (!effectiveBounds) {
                UIRenderer.updateMapStatus('지도가 준비되는 중...');
                return;
            }

            if (!Utils.isBoundsValid(effectiveBounds)) {
                UIRenderer.updateMapStatus('지도 영역을 계산하는 중...');
                return;
            }
            if (force) {
                this.isInitialLoad = true;
            }
            const boundsSignature = Utils.getBoundsSignature(effectiveBounds);
            if (!force && boundsSignature === this.mapManager.getLastLoadedBoundsSignature()) {
                return;
            }
            try {
                const loadingIndicator = document.getElementById('loadingIndicator');
                const locationList = document.getElementById('locationList');
                if (loadingIndicator) {
                    loadingIndicator.style.display = 'block';
                    loadingIndicator.textContent = '데이터 로딩 중...';
                }
                if (locationList) locationList.innerHTML = '';
                UIRenderer.updateMapStatus('현재 화면의 데이터를 불러오는 중...');
                const filterQueryString = this.filterManager.getFilterQueryString();
                const locations = await this.dataLoader.loadMapData(effectiveBounds, filterQueryString);
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
                this.propertyData = locations.map(loc => ({
                    producer: loc.producer,
                    id: loc.id,
                    lat: Number(loc.lat),
                    lng: Number(loc.lng),
                    thumbnail: loc.thumbnail || '',
                    minRentalFee: loc.minRentalFee || 0,
                    address: loc.address || '',
                    type: '',
                    buildingType: '',
                    eventId: loc.eventId || null,
                    options: []
                }));
                if (this.filterManager) {
                    this.filterManager.setPropertyData(this.propertyData);
                }
                this.propertyListManager.setFilteredProperties(this.propertyData);
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
                this.updateMapMarkersFromLocations(locationsForMarkers, this.propertyData);
                if (this.isInitialLoad) {
                    this.isInitialLoad = false;
                }
                const shouldAdjustView = typeof adjustView === 'boolean' 
                    ? adjustView 
                    : !this.mapManager.getHasAdjustedToData();
                if (shouldAdjustView) {
                    this.mapManager.setHasAdjustedToData(true);
                }
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

        setupDOMEventListeners() {
            document.addEventListener('DOMContentLoaded', () => {
                const refreshBtn = document.getElementById('refreshBtn');
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', () => {
                        const map = this.mapManager.getMap();
                        const bounds = map ? map.getBounds() : null;
                        this.handleMapIdle(bounds, { force: true, adjustView: true });
                    });
                }
                const centerBtn = document.getElementById('centerBtn');
                if (centerBtn) {
                    centerBtn.addEventListener('click', () => {
                        const markers = this.markerManager.getMarkers();
                        const map = this.mapManager.getMap();
                        if (markers.length > 0) {
                            const bounds = new google.maps.LatLngBounds();
                            markers.forEach(marker => bounds.extend(marker.getPosition()));
                            map.fitBounds(bounds);
                        } else {
                            map.setCenter(Constants.DEFAULT_LOCATION);
                            map.setZoom(Constants.DEFAULT_ZOOM);
                        }
                    });
                }
            });
        }
    }

    window.initMap = function() {
        if (!app) {
            app = new MapApplication('map');
            app.init();
        }
    };
})();
