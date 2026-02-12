(function () {
    'use strict';

    let app = null;
    let propertyData = [];

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
            this.initVisaTutorial();
            this.loadPropertyData();
        }

        initVisaTutorial() {
            const STORAGE_KEY = 'ilgong_visa_tutorial_dismissed_until';
            const HOUR_24_MS = 24 * 60 * 60 * 1000;

            function shouldShowVisaTutorial() {
                const val = localStorage.getItem(STORAGE_KEY);
                if (!val) return true;
                return Date.now() > parseInt(val, 10);
            }

            function dismissTutorial() {
                localStorage.setItem(STORAGE_KEY, String(Date.now() + HOUR_24_MS));

                const tutorialModal = document.getElementById('visaTutorialModal');
                const selectedCheckbox = tutorialModal?.querySelector('input[name="visaTypeTutorial"]:checked');
                if (selectedCheckbox && this.filterManager) {
                    const value = selectedCheckbox.value;
                    const visaTypeModal = document.getElementById('visaTypeModal');
                    if (visaTypeModal) {
                        visaTypeModal.querySelectorAll('input[name="visaType"]').forEach(cb => {
                            cb.checked = cb.value === value;
                        });
                    }
                    this.filterManager.filterState.visaType = value;
                    this.filterManager.triggerFilterChange();
                }

                const overlay = document.getElementById('visaTutorialOverlay');
                if (overlay) overlay.classList.remove('active');
                if (tutorialModal) {
                    tutorialModal.classList.remove('active');
                    tutorialModal.setAttribute('aria-hidden', 'true');
                }
            }

            if (!shouldShowVisaTutorial()) return;

            const overlay = document.getElementById('visaTutorialOverlay');
            const modal = document.getElementById('visaTutorialModal');
            const visaBtn = document.getElementById('visa-tutorial-btn');
            const confirmBtn = document.getElementById('visaTutorialConfirm');
            const dismissLabel = document.querySelector('.visa-tutorial-dismiss-label');

            if (overlay) overlay.classList.add('active');
            if (modal) {
                if (visaBtn) {
                    const rect = visaBtn.getBoundingClientRect();
                    modal.style.left = (rect.left + 13) + 'px';
                    modal.style.top = (rect.bottom + 26) + 'px';
                }
                modal.classList.add('active');
                modal.setAttribute('aria-hidden', 'false');
            }

            const handleDismiss = () => {
                dismissTutorial.call(this);
            };

            if (confirmBtn) {
                confirmBtn.addEventListener('click', handleDismiss);
            }
            if (dismissLabel) {
                dismissLabel.addEventListener('click', handleDismiss);
            }

            const tutorialCheckboxes = modal?.querySelectorAll('input[name="visaTypeTutorial"]');
            if (tutorialCheckboxes) {
                tutorialCheckboxes.forEach(cb => {
                    cb.addEventListener('change', () => {
                        if (cb.checked) {
                            tutorialCheckboxes.forEach(other => {
                                if (other !== cb) other.checked = false;
                            });
                        }
                    });
                });
            }
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

        updateMapMarkersFromLocations(mapResponseData, map) {
            if (!this.markerManager || !map) return;
            const { mode, items, cellSizeM } = mapResponseData;
            this.markerManager.clearMarkers();

            if (mode === 'cluster') {
                const groupClickHandlers = new Map();
                items.forEach((location) => {
                    const key = `${location.lat}_${location.lng}`;
                    groupClickHandlers.set(key, () => {
                        map.setCenter({ lat: Number(location.lat), lng: Number(location.lng) });
                        const currentZoom = map.getZoom();
                        map.setZoom(Math.min(currentZoom + 2, 21));
                    });
                });
                this.markerManager.displayLocations(items, {
                    performanceMode: true,
                    clusterFormat: 'backend',
                    onGroupClick: (marker, location) => {
                        const key = `${location.lat}_${location.lng}`;
                        const handler = groupClickHandlers.get(key);
                        if (handler) handler();
                    }
                });
                const totalCount = items.reduce((sum, g) => sum + (g.count || 0), 0);
                UIRenderer.updateMapStatus(
                    `${items.length}개 클러스터에 ${Utils.formatCount(totalCount)}개 건물이 있습니다.`
                );
            } else {
                const mapPointToUnified = (p) => ({
                    producer: p.producer,
                    id: p.originalId ?? p.id,
                    lat: Number(p.lat),
                    lng: Number(p.lng),
                    thumbnail: p.photo ?? p.thumbnail ?? '',
                    minRentalFee: p.minRentalFee ?? 0,
                    address: p.address ?? '',
                    eventId: p.eventId ?? null,
                    buildingName: p.buildingName ?? '',
                    name: p.buildingName ?? ''
                });
                const locationsForMarkers = items.map(mapPointToUnified);
                const uniqueLocations = Utils.removeDuplicateLocations(locationsForMarkers);
                this.markerManager.displayLocations(uniqueLocations, {
                    performanceMode: false,
                    onMarkerClick: (marker, location) => {
                        this.markerManager.showInfoWindow(marker, location);
                    }
                });
                UIRenderer.updateMapStatus(`${uniqueLocations.length.toLocaleString('ko-KR')}개의 위치를 표시했습니다.`);
            }

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
                const mapResponse = await this.dataLoader.loadMapData(effectiveBounds, filterQueryString);
                const mode = mapResponse?.mode || 'point';
                const items = mapResponse?.items || [];
                const cellSizeM = mapResponse?.cellSizeM || 0;

                if (items.length === 0) {
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'block';
                        loadingIndicator.textContent = '표시할 위치가 없습니다.';
                    }
                    UIRenderer.updateMapStatus('해당 영역에 데이터가 없습니다.');
                    this.markerManager.clearMarkers();
                    this.propertyListManager.setPanelData(effectiveBounds, filterQueryString, 1, { items: [], total: 0 });
                    this.mapManager.setLastLoadedBoundsSignature(boundsSignature);
                    return;
                }

                this.propertyListManager.setBounds(effectiveBounds);
                this.propertyListManager.setFilter(filterQueryString);
                this.dataLoader.loadPanelData(effectiveBounds, filterQueryString, 1)
                    .then((panelData) => {
                        this.propertyListManager.setPanelData(effectiveBounds, filterQueryString, 1, panelData);
                    })
                    .catch((err) => {
                        console.error('패널 데이터 로드 오류:', err);
                        this.propertyListManager.setPanelData(effectiveBounds, filterQueryString, 1, { items: [], total: 0 });
                    });

                this.updateMapMarkersFromLocations({ mode, items, cellSizeM }, map);
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
