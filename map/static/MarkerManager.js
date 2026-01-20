/**
 * 마커 관리 클래스
 * 
 * Google Maps 마커 생성, 표시, 제거를 담당
 */
class MarkerManager {
    /**
     * @param {google.maps.Map} map - Google Maps 인스턴스
     * @param {Object} markerClusterer - MarkerClusterer 인스턴스 (선택)
     */
    constructor(map, markerClusterer = null) {
        this.map = map;
        this.markerClusterer = markerClusterer;
        this.markers = [];
        this.infoWindow = null; // 현재 열려있는 InfoWindow
        this.mapClickListener = null; // 지도 클릭 리스너
        this.clickedMarker = null; // 현재 클릭된 마커 (grayscale 적용된 마커)
        this.markerOriginalIcons = new Map(); // 마커의 원본 아이콘 저장
        this.displayedMarkerKeys = new Set(); // 이미 표시된 마커 키 (producer_id 조합)
        this.setupMapClickListener();
    }

    /**
     * 지도 클릭 시 InfoWindow 닫기 리스너 설정
     */
    setupMapClickListener() {
        // 기존 리스너가 있으면 제거
        if (this.mapClickListener) {
            google.maps.event.removeListener(this.mapClickListener);
        }

        // 지도 클릭 시 InfoWindow 닫기
        this.mapClickListener = this.map.addListener('click', () => {
            this.closeInfoWindow();
        });
    }

    /**
     * InfoWindow 닫기
     */
    closeInfoWindow() {
        if (this.infoWindow) {
            this.infoWindow.close();
            this.infoWindow = null;
        }
    }

    /**
     * 모든 마커 제거
     * 
     * MarkerClusterer와 직접 추가된 마커 모두 제거
     */
    clearMarkers() {
        // InfoWindow도 닫기
        this.closeInfoWindow();
        // 먼저 모든 마커를 지도에서 제거 (직접 추가된 마커 포함)
        this.markers.forEach(marker => {
            if (marker && marker.setMap) {
                marker.setMap(null);
            }
        });

        // MarkerClusterer가 있으면 클러스터러의 마커도 제거
        if (this.markerClusterer) {
            if (typeof this.markerClusterer.clearMarkers === 'function') {
                this.markerClusterer.clearMarkers();
            } else if (typeof this.markerClusterer.removeMarkers === 'function') {
                // 클러스터러에 등록된 마커가 있으면 제거
                if (this.markerClusterer.markers && this.markerClusterer.markers.length > 0) {
                    this.markerClusterer.removeMarkers(this.markerClusterer.markers);
                }
            } else if (this.markerClusterer.markers) {
                // 마커 배열을 직접 조작 (구버전 호환)
                this.markerClusterer.markers.forEach(marker => {
                    if (marker && marker.setMap) {
                        marker.setMap(null);
                    }
                });
                this.markerClusterer.markers = [];
                if (typeof this.markerClusterer.render === 'function') {
                    this.markerClusterer.render();
                }
            }
        }

        // 마커 배열 초기화
        this.markers = [];
        // 클릭된 마커 및 원본 아이콘 맵 초기화
        this.clickedMarker = null;
        this.markerOriginalIcons.clear();
        // 표시된 마커 키 초기화
        this.displayedMarkerKeys.clear();
    }

    /**
     * 그룹 마커 생성 (성능 모드용)
     * @param {Object} position - 마커 위치 {lat, lng}
     * @param {Object} location - 위치 정보 객체
     * @param {Function} onClick - 클릭 이벤트 핸들러
     * @returns {google.maps.Marker} 생성된 마커
     */
    createGroupMarker(position, location, onClick) {
        const marker = new google.maps.Marker({
            position: position,
            title: location.name || `${Utils.formatCount(location.count)}개 건물`,
            label: {
                text: Utils.formatCount(location.count),
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px'
            },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 30,
                fillColor: '#1884E9',
                fillOpacity: 0.8,
                strokeColor: '#1884E902',
                strokeWeight: 2
            },
            zIndex: google.maps.Marker.MAX_ZINDEX + 1
        });

        // 그룹 마커 클릭 이벤트
        if (onClick) {
            marker.addListener('click', onClick);
        }

        return marker;
    }
    /**
     * 커스텀 마커 아이콘 생성 (Union.svg 스타일)
     * @param {string} priceText - 표시할 가격 텍스트 (예: "5.0만")
     * @param {boolean} applyGrayscale - grayscale 필터 적용 여부 (기본값: false)
     * @returns {Object} Google Maps 마커 아이콘 설정 객체
     */
    createCustomMarkerIcon(priceText, applyGrayscale = false) {
        // SVG 생성 (배경 먼저, 텍스트 나중에 그려서 텍스트가 위에 표시되도록)
        // grayscale(80%) = 80% grayscale + 20% 원본
        // 이를 위해 saturate를 0.2 (20% 채도 유지)로 설정
        const filterDef = applyGrayscale ? `
            <defs>
                <filter id="grayscale-${Math.random().toString(36).substr(2, 9)}">
                    <feColorMatrix type="saturate" values="0.2"/>
                </filter>
            </defs>
        ` : '';

        // 고유한 filter ID를 위해 랜덤 ID 생성
        let filterId = '';
        if (applyGrayscale) {
            const match = filterDef.match(/id="([^"]+)"/);
            if (match) filterId = match[1];
        }

        const filterAttr = applyGrayscale && filterId ? `filter="url(#${filterId})"` : '';

        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30" fill="none">
            ${filterDef}
            <g ${filterAttr}>
                <rect width="60" height="30" rx="10" fill="#3D8BFF"/>
                <text x="30" y="15" font-family="'Noto Sans KR', sans-serif" font-size="14" font-weight="500" fill="white" text-anchor="middle" dominant-baseline="central">${priceText}</text>
            </g>
        </svg>
        `;

        // SVG를 Data URL로 변환
        const encodedSvg = encodeURIComponent(svg);
        const dataUrl = `data:image/svg+xml,${encodedSvg}`;

        return {
            url: dataUrl,
            scaledSize: new google.maps.Size(60, 30),
            anchor: new google.maps.Point(30, 30), // 하단 중앙을 앵커 포인트로 설정
            origin: new google.maps.Point(0, 0)
        };
    }

    /**
     * InfoWindow 콘텐츠 생성
     * @param {Object} location - 위치 정보 객체
     * @returns {string} HTML 콘텐츠
     */
    createInfoWindowContent(location) {
        const address = location.address || location.fullAddress || '';
        const price = location.minRentalFee || 0;

        // 썸네일 이미지 (있는 경우)
        const thumbnail = location.thumbnail || null;

        // 상세 페이지 URL 생성 (query parameter 형식 - 테스트용)
        const detailUrl = location.id && location.producer ? `/map/detail/index.html?producer=${location.producer}&id=${location.id}` : '#';

        return `
            <div id="info-window-content-${location.producer}_${location.id || 'default'}" class="property-card pin" 
            onclick="window.open('${detailUrl}', '_blank');"
            ">
                ${thumbnail ? `
                <div class="property-card-image">
                    <img src="${thumbnail}" alt="${address}" onerror="this.style.display='none';">
                    <div class="property-card-carousel">
                        <span class="carousel-dot active"></span>
                        <span class="carousel-dot active"></span>
                        <span class="carousel-dot active"></span>
                    </div>
                </div>
                ` : ''}
                <div class="property-card-content">
                    <div class="property-price">
                        ¥ ${price.toLocaleString()} +
                    </div>
                    ${address ? `
                    <div class="property-info">
                        ${address}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }



    /**
     * InfoWindow 표시
     * @param {google.maps.Marker} marker - 마커 인스턴스
     * @param {Object} location - 위치 정보 객체
     */
    showInfoWindow(marker, location) {
        // 기존 InfoWindow 닫기
        if (this.infoWindow) {
            this.infoWindow.close();
        }

        // 이전에 클릭된 마커가 있으면 원본 아이콘으로 복원
        if (this.clickedMarker && this.clickedMarker !== marker) {
            this.removeGrayscaleFromMarker(this.clickedMarker);
        }

        // 현재 클릭된 마커에 grayscale 적용 (클러스터 마커 제외)
        if (marker.locationData) {
            this.applyGrayscaleToMarker(marker);
            this.clickedMarker = marker;
        }

        // 상세 페이지 URL 생성 (query parameter 형식 - 테스트용)
        const detailUrl = location.id && location.producer ? `/map/detail/index.html?producer=${location.producer}&id=${location.id}` : '#';

        // 새 InfoWindow 생성 및 표시
        const content = this.createInfoWindowContent(location);
        this.infoWindow = new google.maps.InfoWindow({
            content: content,
            pixelOffset: new google.maps.Size(0, -10) // 마커 위에 표시
        });

        this.infoWindow.open(this.map, marker);
    }

    /**
     * 개별 마커 생성 (일반 모드용)
     * @param {Object} position - 마커 위치 {lat, lng}
     * @param {Object} location - 위치 정보 객체
     * @param {Function} onClick - 클릭 이벤트 핸들러
     * @returns {google.maps.Marker} 생성된 마커
     */
    createIndividualMarker(position, location, onClick) {
        // 가격 정보 가져오기 (location.price 또는 location.property?.price)
        const price = location.minRentalFee || 0;
        const priceText = Utils.formatPriceToMan(price);

        // 커스텀 마커 아이콘 생성
        const customIcon = this.createCustomMarkerIcon(priceText);

        const marker = new google.maps.Marker({
            position: position,
            title: location.name,
            icon: customIcon,
            zIndex: google.maps.Marker.MAX_ZINDEX
        });

        // 원본 아이콘 저장 (나중에 grayscale을 제거할 때 사용)
        this.markerOriginalIcons.set(marker, customIcon);

        // location 정보를 마커에 저장 (grayscale 아이콘 생성 시 필요)
        marker.locationData = location;

        // 마커 클릭 이벤트
        if (onClick) {
            marker.addListener('click', onClick);
        }

        return marker;
    }

    /**
     * 마커에 grayscale 필터 적용
     * @param {google.maps.Marker} marker - 적용할 마커
     */
    applyGrayscaleToMarker(marker) {
        // 클러스터 마커는 제외 (개별 마커만)
        if (!marker.locationData) return;

        const price = marker.locationData.minRentalFee || 0;
        const priceText = Utils.formatPriceToMan(price);

        // grayscale이 적용된 아이콘 생성
        const grayscaleIcon = this.createCustomMarkerIcon(priceText, true);
        marker.setIcon(grayscaleIcon);
    }

    /**
     * 마커의 grayscale 필터 제거 (원본 아이콘으로 복원)
     * @param {google.maps.Marker} marker - 복원할 마커
     */
    removeGrayscaleFromMarker(marker) {
        const originalIcon = this.markerOriginalIcons.get(marker);
        if (originalIcon) {
            marker.setIcon(originalIcon);
        }
    }

    /**
     * 위치 목록을 지도에 표시 및 마커 생성
     * 
     * @param {Array} locations - 표시할 위치 배열
     * @param {Object} options - 옵션 객체
     * @param {boolean} options.performanceMode - 성능 모드 여부 (그룹화된 마커 표시)
     * @param {Function} options.onGroupClick - 그룹 마커 클릭 핸들러
     * @param {Function} options.onMarkerClick - 개별 마커 클릭 핸들러
     * @param {boolean} options.appendMode - 추가 모드 여부 (기존 마커 유지하고 새로운 것만 추가)
     * @returns {google.maps.LatLngBounds} 모든 마커를 포함하는 bounds
     */
    displayLocations(locations, options = {}) {
        const {
            performanceMode = false,
            onGroupClick = null,
            onMarkerClick = null,
            appendMode = false
        } = options;

        const bounds = new google.maps.LatLngBounds();
        const newMarkers = [];

        locations.forEach((location) => {
            const lat = Number(location.lat);
            const lng = Number(location.lng);

            // 유효하지 않은 좌표는 제외
            if (!Utils.isFiniteNumber(lat) || !Utils.isFiniteNumber(lng)) {
                return;
            }

            // appendMode일 때 이미 표시된 마커는 건너뛰기
            if (appendMode && location.producer && location.id) {
                const markerKey = `${location.producer}_${location.id}`;
                if (this.displayedMarkerKeys.has(markerKey)) {
                    return; // 이미 표시된 마커는 건너뛰기
                }
            }

            const position = { lat, lng };

            // 성능 모드: 시/현 또는 구 그룹 마커
            if (performanceMode && location.isWardGroup) {
                const marker = this.createGroupMarker(position, location, null);
                // 마커 생성 후 클릭 핸들러 등록
                if (onGroupClick) {
                    marker.addListener('click', () => onGroupClick(marker, location));
                }
                newMarkers.push(marker);
                this.markers.push(marker);
                bounds.extend(position);
            } else {
                // 일반 모드: 개별 마커
                const marker = this.createIndividualMarker(position, location, null);
                // 마커 생성 후 클릭 핸들러 등록
                if (onMarkerClick) {
                    marker.addListener('click', () => onMarkerClick(marker, location));
                }
                newMarkers.push(marker);
                this.markers.push(marker);

                // 표시된 마커 키 저장 (producer_id 조합)
                if (location.producer && location.id) {
                    const markerKey = `${location.producer}_${location.id}`;
                    this.displayedMarkerKeys.add(markerKey);
                }

                bounds.extend(position);
            }
        });

        // 마커를 지도에 추가
        this.addMarkersToMap(newMarkers, performanceMode);

        return bounds;
    }

    /**
     * 마커를 지도에 추가
     * @param {Array} newMarkers - 추가할 마커 배열
     * @param {boolean} performanceMode - 성능 모드 여부
     */
    addMarkersToMap(newMarkers, performanceMode) {
        if (newMarkers.length === 0) return;

        // 성능 모드가 아닐 때만 MarkerClusterer 사용
        if (!performanceMode && this.markerClusterer) {
            if (typeof this.markerClusterer.addMarkers === 'function') {
                this.markerClusterer.addMarkers(newMarkers);
            } else if (typeof this.markerClusterer.render === 'function') {
                // 구버전 호환
                this.markerClusterer.render();
            }
        } else if (performanceMode) {
            // 성능 모드: 그룹 마커는 클러스터러 없이 직접 지도에 추가
            newMarkers.forEach(marker => marker.setMap(this.map));
        } else {
            // MarkerClusterer가 없으면 직접 지도에 추가 (폴백)
            newMarkers.forEach(marker => marker.setMap(this.map));
        }
    }

    /**
     * 현재 마커 배열 반환
     * @returns {Array} 마커 배열
     */
    getMarkers() {
        return this.markers;
    }
}

