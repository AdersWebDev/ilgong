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
//     <svg xmlns="http://www.w3.org/2000/svg" width="66" height="46" viewBox="0 0 66 46" fill="none">
//     <g filter="url(#filter0_d_3438_13735)">
//         <path d="M46.623 0C55.6677 0 63 7.33228 63 16.377C62.9999 25.4216 55.6677 32.7539 46.623 32.7539H40.0264L34.1279 39.4766C33.5305 40.1575 32.4695 40.1575 31.8721 39.4766L25.9736 32.7539H19.377C10.3323 32.7539 3.00007 25.4216 3 16.377C3 7.33228 10.3323 0 19.377 0H46.623Z" fill="#3D8BFF"/>
//         <text x="33" y="15" font-family="'Noto Sans KR', sans-serif" font-size="15" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="central">${priceText}</text>
//     </g>
//     <defs>
//         <filter id="filter0_d_3438_13735" x="0" y="0" width="66" height="50" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
//             <feFlood flood-opacity="0" result="BackgroundImageFix"/>
//             <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
//             <feOffset dy="3"/>
//             <feGaussianBlur stdDeviation="1.5"/>
//             <feComposite in2="hardAlpha" operator="out"/>
//             <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
//             <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3438_13735"/>
//             <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3438_13735" result="shape"/>
//         </filter>
//     </defs>
// </svg>
    /**
     * 커스텀 마커 아이콘 생성 (Union.svg 스타일)
     * @param {string} priceText - 표시할 가격 텍스트 (예: "5.0만")
     * @returns {Object} Google Maps 마커 아이콘 설정 객체
     */
    createCustomMarkerIcon(priceText) {
        // SVG 생성 (배경 먼저, 텍스트 나중에 그려서 텍스트가 위에 표시되도록)
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30" fill="none">
            <rect width="60" height="30" rx="10" fill="#3D8BFF"/>
            <text x="30" y="15" font-family="'Noto Sans KR', sans-serif" font-size="14" font-weight="500" fill="white" text-anchor="middle" dominant-baseline="central">${priceText}</text>
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
        
        // 상세 페이지 URL 생성
        const detailUrl = location.id ? `${API_BASE_URL}/big/map/detail/${location.producer}/${location.id}` : '#';
        
        return `
            <div id="info-window-content-${location.producer}_${location.id || 'default'}" style="padding: 0; min-width: 220px; max-width: 280px; font-family: 'Noto Sans KR', sans-serif; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: pointer;" onclick="window.location.href='${detailUrl}'">
                ${thumbnail ? `
                <div style="width: 100%; height: 120px; overflow: hidden; background: #f5f5f5;">
                    <img src="${thumbnail}" alt="${address}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none';">
                </div>
                ` : ''}
                <div style="padding: 12px 14px;">
                    <div style="font-weight: 600; font-size: 15px; color: #17171B; margin-bottom: 6px; line-height: 1.4; word-break: keep-all;">
                        ¥ ${price.toLocaleString()}
                    </div>
                    ${address ? `
                    <div style="font-size: 12px; color: #666; margin-bottom: 8px; line-height: 1.4; word-break: keep-all;">
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

        // 상세 페이지 URL 생성
        const detailUrl = location.id ? `${API_BASE_URL}/big/map/detail/${location.producer}/${location.id}` : '#';
        
        // 새 InfoWindow 생성 및 표시
        const content = this.createInfoWindowContent(location);
        this.infoWindow = new google.maps.InfoWindow({
            content: content,
            pixelOffset: new google.maps.Size(0, -10) // 마커 위에 표시
        });
        
        // InfoWindow가 열린 후 클릭 이벤트 리스너 추가
        this.infoWindow.addListener('domready', () => {
            const contentElement = document.getElementById(`info-window-content-${location.producer}_${location.id || 'default'}`);
            if (contentElement && location.id) {
                contentElement.style.cursor = 'pointer';
                contentElement.addEventListener('click', () => {
                    window.location.href = detailUrl;
                });
            }
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

        // 마커 클릭 이벤트
        if (onClick) {
            marker.addListener('click', onClick);
        }

        return marker;
    }

    /**
     * 위치 목록을 지도에 표시 및 마커 생성
     * 
     * @param {Array} locations - 표시할 위치 배열
     * @param {Object} options - 옵션 객체
     * @param {boolean} options.performanceMode - 성능 모드 여부 (그룹화된 마커 표시)
     * @param {Function} options.onGroupClick - 그룹 마커 클릭 핸들러
     * @param {Function} options.onMarkerClick - 개별 마커 클릭 핸들러
     * @returns {google.maps.LatLngBounds} 모든 마커를 포함하는 bounds
     */
    displayLocations(locations, options = {}) {
        const { 
            performanceMode = false,
            onGroupClick = null,
            onMarkerClick = null
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

