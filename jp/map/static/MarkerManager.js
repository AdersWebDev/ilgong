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

        // 핫딜 이벤트 타이머/캐시
        this.eventDetailCache = new Map(); // eventId -> {imageUrl, finDate}
        this.eventTimerIntervalId = null;
        this.activeEventTimerKey = null; // producer_id 조합 (현재 인포윈도우에 붙은 타이머 키)

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
        this.stopInfoWindowEventTimer();
        if (this.infoWindow) {
            this.infoWindow.close();
            this.infoWindow = null;
        }
    }

    /**
     * 현재 InfoWindow에 붙어있는 이벤트 타이머 중지
     */
    stopInfoWindowEventTimer() {
        if (this.eventTimerIntervalId) {
            clearInterval(this.eventTimerIntervalId);
            this.eventTimerIntervalId = null;
        }
        this.activeEventTimerKey = null;
    }

    /**
     * 이벤트 상세 조회 (캐시 사용)
     * GET /rent/detail/event/{id}
     * @param {string|number} eventId
     */
    async getEventDetail(eventId) {
        if (!eventId) return null;
        if (this.eventDetailCache.has(eventId)) {
            return this.eventDetailCache.get(eventId);
        }

        const base =
            (typeof API_BASE_URL !== 'undefined' && API_BASE_URL)
                ? API_BASE_URL
                : 'https://www.houberapp.com';

        const url = `${base}/rent/detail/event/${eventId}`;

        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`이벤트 API 호출 실패: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        this.eventDetailCache.set(eventId, data);
        return data;
    }

    /**
     * 디테일 페이지와 동일 규칙으로 LocalDateTime 파싱
     * - 마이크로초(6자리) -> 밀리초(3자리) 정규화
     * - 타임존 없으면 +09:00 부여
     * @param {string} input
     * @returns {Date|null}
     */
    parseLocalDateTime(input) {
        try {
            let s = String(input).trim();
            s = s.replace(/(\.\d{3})\d+/, '$1');
            if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) {
                s += '+09:00';
            }
            const d = new Date(s);
            if (Number.isNaN(d.getTime())) return null;
            return d;
        } catch {
            return null;
        }
    }

    /**
     * finDate 기준 남은 초 계산 (24시간 클램프)
     * - finDate <= now 이면 null
     * - diff >= 24h 이면 diff % 24h 로 24h 미만 표시
     * @param {string} finDate
     * @returns {number|null}
     */
    calcRemainingSeconds(finDate) {
        if (!finDate) return null;
        const fin = this.parseLocalDateTime(finDate);
        if (!fin) return null;

        let diffMs = fin.getTime() - Date.now();
        if (Number.isNaN(diffMs) || diffMs <= 0) return null;

        const DAY_MS = 24 * 60 * 60 * 1000;
        if (diffMs >= DAY_MS) diffMs = diffMs % DAY_MS;

        return Math.floor(diffMs / 1000);
    }

    /**
     * 초 -> HH:MM:SS
     * @param {number} totalSeconds
     */
    formatHms(totalSeconds) {
        const safe = Math.max(0, Number(totalSeconds) || 0);
        const hh = Math.floor(safe / 3600);
        const mm = Math.floor((safe % 3600) / 60);
        const ss = safe % 60;
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
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
     * 그룹 마커용 커스텀 아이콘 생성
     * @param {string} countText - 표시할 개수 텍스트 (예: "10")
     * @param {boolean} hasEvent - 이벤트가 있는지 여부
     * @returns {Object} Google Maps 마커 아이콘 설정 객체
     */
    createGroupMarkerIcon(countText, hasEvent = false) {
        let svg;
        let scaledSize;
        let anchor;

        if (hasEvent) {
            // 이벤트가 있는 그룹 마커: 원형 마커(80px) 위에 이벤트 레이어 추가
            // 전체 크기: 너비 80px (원 지름), 높이 130px (이벤트 레이어 50px + 원 80px)
            svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="92" viewBox="0 0 80 92" fill="none">
                <defs>
                    <filter id="filter0_d_4267_36745" x="0" y="0" width="80" height="92" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="3"/>
                        <feGaussianBlur stdDeviation="1.5"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_4267_36745"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_4267_36745" result="shape"/>
                    </filter>
                </defs>

                <circle  cx="40" cy="50" r="40" fill="#1884E9" fill-opacity="0.8" stroke="#1884E902" stroke-width="2"/>
                <text x="40" y="50" font-family="'Noto Sans KR', sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${countText}</text>

                
                <rect x="4" y="0" width="72" height="32" rx="16" fill="#FF5900" fill-opacity="0.4"/>
                <rect x="7" y="3" width="66" height="26" rx="13" fill="white"/>
                <rect x="7" y="3" width="66" height="26" rx="13" stroke="#FB8525" stroke-width="2"/>
                <g>
                    <g transform="translate(2, 0)">
                        <path xmlns="http://www.w3.org/2000/svg" d="M18.9779 20.965L13.1738 21L13.1203 19.3699L18.9244 19.3349L18.9779 20.965ZM18.9705 17.3742L11.0479 17.4278L11 15.7977L18.9244 15.7441L18.9705 17.3742ZM19 13.6301L14.5289 13.6575L14.4755 12.0263L18.9465 12L19 13.6301Z" fill="#FB8525"/>
                        <path xmlns="http://www.w3.org/2000/svg" d="M27.5 10C31.0899 10 34 12.9101 34 16.5C34 20.0899 31.0899 23 27.5 23C23.9101 23 21 20.0899 21 16.5C21 12.9101 23.9101 10 27.5 10ZM30.7461 18.7295C30.5197 18.7295 30.3282 18.8057 30.1719 18.958C30.0155 19.1103 29.9375 19.297 29.9375 19.5176C29.9375 19.7381 30.0156 19.9249 30.1719 20.0771C30.3282 20.2293 30.5198 20.3057 30.7461 20.3057C30.9724 20.3056 31.164 20.2294 31.3203 20.0771C31.4766 19.9249 31.5546 19.7381 31.5547 19.5176C31.5547 19.297 31.4766 19.1103 31.3203 18.958C31.164 18.8057 30.9725 18.7295 30.7461 18.7295ZM26.5547 13V17.4863L29.1709 19.0166L29.9375 17.9912L27.8486 16.791V13H26.5547Z" fill="#FB8525"/>
                    </g>
                    <text x="66" y="16" font-family="'Noto Sans KR', sans-serif" font-size="14" font-weight="600" fill="#FB8525" text-anchor="end" dominant-baseline="central">特価</text>
                </g>
            </svg>
            `;
            scaledSize = new google.maps.Size(80, 92);
            anchor = new google.maps.Point(40, 92);
        } else {
            // 일반 그룹 마커: 원형만 (원 지름 80px이므로 80px x 80px)
            svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="40" fill="#1884E9" fill-opacity="0.8" stroke="#1884E902" stroke-width="2"/>
                <text x="40" y="40" font-family="'Noto Sans KR', sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${countText}</text>
            </svg>
            `;
            scaledSize = new google.maps.Size(80, 80);
            anchor = new google.maps.Point(40, 80);
        }

        // SVG를 Data URL로 변환
        const encodedSvg = encodeURIComponent(svg);
        const dataUrl = `data:image/svg+xml,${encodedSvg}`;

        return {
            url: dataUrl,
            scaledSize: scaledSize,
            anchor: anchor,
            origin: new google.maps.Point(0, 0)
        };
    }

    /**
     * 그룹 마커 생성 (성능 모드용)
     * @param {Object} position - 마커 위치 {lat, lng}
     * @param {Object} location - 위치 정보 객체
     * @param {Function} onClick - 클릭 이벤트 핸들러
     * @returns {google.maps.Marker} 생성된 마커
     */
    createGroupMarker(position, location, onClick) {
        // 그룹 내부에 이벤트가 있는 마커가 있는지 확인 (MapClusterDto.hasEvent 0/1 또는 location.locations)
        const hasEvent = (location.hasEvent === 1) || (location.locations?.some(loc => loc.eventId)) || false;
        const countText = Utils.formatCount(location.count);

        // 그룹 마커 아이콘 생성
        const groupIcon = this.createGroupMarkerIcon(countText, hasEvent);

        const marker = new google.maps.Marker({
            position: position,
            title: location.name || `${countText}개 건물`,
            icon: groupIcon,
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
     * @param {string|null} eventId - 이벤트 ID (null이 아니면 이벤트 스타일 적용)
     * @returns {Object} Google Maps 마커 아이콘 설정 객체
     */
    createCustomMarkerIcon(priceText, applyGrayscale = false, eventId = null) {
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

        // eventId가 null이 아니면 이벤트 스타일 색상 사용 (빨간색 계열)

        let svg;
        let scaledSize;
        let anchor;

        if (eventId) {
            // 이벤트 마커: 기본 마커 위에 이벤트 배경과 아이콘 추가
            svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="72" height="56" viewBox="0 0 72 56" fill="none">
                ${filterDef}
                <defs>
                    <filter id="filter0_d_4267_36745" x="0" y="22" width="72" height="56" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
                        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
                        <feOffset dy="3"/>
                        <feGaussianBlur stdDeviation="1.5"/>
                        <feComposite in2="hardAlpha" operator="out"/>
                        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"/>
                        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_4267_36745"/>
                        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_4267_36745" result="shape"/>
                    </filter>
                </defs>
                <g ${filterAttr}>
                    <rect x="6" y="26" width="60" height="30" rx="10" fill="#3D8BFF"/>
                    <text x="36" y="39" font-family="'Noto Sans KR', sans-serif" font-size="14" font-weight="500" fill="white" text-anchor="middle" dominant-baseline="central">${priceText}</text>
                </g>
                <rect x="0" y="0" width="72" height="32" rx="16" fill="#FF5900" fill-opacity="0.4"/>
                <rect x="3" y="3" width="66" height="26" rx="13" fill="white"/>
                <rect x="3" y="3" width="66" height="26" rx="13" stroke="#FB8525" stroke-width="2"/>
                <g>
                    <g transform="translate(-1, 0)">
                        <path xmlns="http://www.w3.org/2000/svg" d="M18.9779 20.965L13.1738 21L13.1203 19.3699L18.9244 19.3349L18.9779 20.965ZM18.9705 17.3742L11.0479 17.4278L11 15.7977L18.9244 15.7441L18.9705 17.3742ZM19 13.6301L14.5289 13.6575L14.4755 12.0263L18.9465 12L19 13.6301Z" fill="#FB8525"/>
                        <path xmlns="http://www.w3.org/2000/svg" d="M27.5 10C31.0899 10 34 12.9101 34 16.5C34 20.0899 31.0899 23 27.5 23C23.9101 23 21 20.0899 21 16.5C21 12.9101 23.9101 10 27.5 10ZM30.7461 18.7295C30.5197 18.7295 30.3282 18.8057 30.1719 18.958C30.0155 19.1103 29.9375 19.297 29.9375 19.5176C29.9375 19.7381 30.0156 19.9249 30.1719 20.0771C30.3282 20.2293 30.5198 20.3057 30.7461 20.3057C30.9724 20.3056 31.164 20.2294 31.3203 20.0771C31.4766 19.9249 31.5546 19.7381 31.5547 19.5176C31.5547 19.297 31.4766 19.1103 31.3203 18.958C31.164 18.8057 30.9725 18.7295 30.7461 18.7295ZM26.5547 13V17.4863L29.1709 19.0166L29.9375 17.9912L27.8486 16.791V13H26.5547Z" fill="#FB8525"/>
                    </g>
                    <text x="62" y="16" font-family="'Noto Sans KR', sans-serif" font-size="14" font-weight="600" fill="#FB8525" text-anchor="end" dominant-baseline="central">特価</text>
                </g>
            </svg>
            `;
            scaledSize = new google.maps.Size(72, 56);
            anchor = new google.maps.Point(72, 56); // 하단 중앙을 앵커 포인트로 설정
        } else {
            svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="30" viewBox="0 0 60 30" fill="none">
                ${filterDef}
                <g ${filterAttr}>
                    <rect width="60" height="30" rx="10" fill="#3D8BFF"/>
                    <text x="30" y="15" font-family="'Noto Sans KR', sans-serif" font-size="14" font-weight="500" fill="white" text-anchor="middle" dominant-baseline="central">${priceText}</text>
                </g>
            </svg>
            `;
            scaledSize = new google.maps.Size(60, 30);
            anchor = new google.maps.Point(30, 30); // 하단 중앙을 앵커 포인트로 설정
        }

        // SVG를 Data URL로 변환
        const encodedSvg = encodeURIComponent(svg);
        const dataUrl = `data:image/svg+xml,${encodedSvg}`;

        return {
            url: dataUrl,
            scaledSize: scaledSize,
            anchor: anchor,
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
        const detailUrl = location.id && location.producer ? `/jp/map/detail/index.html?producer=${location.producer}&id=${location.id}` : '#';
        console.log(location);
        return `
            <div id="info-window-content-${location.producer}_${location.id || 'default'}" class="property-card pin" 
            onclick="window.open('${detailUrl}', '_blank');"
            ">
            ${location.eventId ? `
                <div class="property-card-event">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22" fill="none">
                        <path d="M16 3C17.1046 3 18.1458 3.20982 19.1212 3.63068C20.092 4.04959 20.9393 4.61923 21.66 5.33996C22.3808 6.0607 22.9504 6.90799 23.3693 7.87879C23.7902 8.85421 24 9.89542 24 11C24 11.3581 23.9802 11.7102 23.9403 12.0559C23.9001 12.4046 23.8326 12.7468 23.7386 13.0824L23.6184 13.5142L23.3229 13.1761C23.159 12.9889 22.9683 12.831 22.7509 12.7017C22.5376 12.5749 22.3034 12.488 22.0464 12.4413L21.804 12.3968L21.8523 12.1553C21.8894 11.9695 21.917 11.7796 21.9356 11.5871C21.9542 11.3948 21.964 11.1991 21.964 11C21.964 9.33041 21.3871 7.92495 20.2311 6.76894C19.0751 5.61293 17.6696 5.03598 16 5.03598C14.3304 5.03598 12.9249 5.61293 11.7689 6.76894C10.6129 7.92495 10.036 9.33041 10.036 11C10.036 12.6696 10.6129 14.0751 11.7689 15.2311C12.9249 16.3871 14.3304 16.964 16 16.964C16.6352 16.964 17.2402 16.8705 17.8163 16.6847C18.3955 16.4978 18.9269 16.2366 19.411 15.9015L19.6089 15.7642L19.7472 15.9612C19.8868 16.1589 20.0596 16.3343 20.2661 16.4877C20.4732 16.6416 20.6942 16.7597 20.929 16.8419L21.3409 16.9858L21 17.2595C20.3192 17.8067 19.5554 18.2337 18.7102 18.5398C17.8611 18.8473 16.9571 19 16 19C14.8954 19 13.8542 18.7902 12.8788 18.3693C11.908 17.9504 11.0607 17.3808 10.34 16.66C9.61923 15.9393 9.04959 15.092 8.63068 14.1212C8.20982 13.1458 8 12.1046 8 11C8 9.89542 8.20982 8.85421 8.63068 7.87879C9.04959 6.90799 9.61923 6.0607 10.34 5.33996C11.0607 4.61923 11.908 4.04959 12.8788 3.63068C13.8542 3.20982 14.8954 3 16 3ZM21.6241 13.4725C21.958 13.4725 22.2498 13.5908 22.4839 13.8248C22.718 14.0589 22.8361 14.3507 22.8362 14.6847C22.8362 15.0187 22.7181 15.3104 22.4839 15.5445C22.2498 15.7787 21.9581 15.8968 21.6241 15.8968C21.2901 15.8967 20.9983 15.7786 20.7642 15.5445C20.5302 15.3104 20.4119 15.0186 20.4119 14.6847C20.412 14.3507 20.5301 14.0589 20.7642 13.8248C20.9983 13.5907 21.2901 13.4726 21.6241 13.4725ZM17.018 10.589L19.9886 13.5597L18.5597 14.9886L14.982 11.411V6.87879H17.018V10.589Z" fill="white"/>
                        <path d="M5.99512 16.9541L1.6377 17.001L1.59766 14.8271L5.95508 14.7812L5.99512 16.9541ZM5.98242 12.165L0.0351562 12.2373L0 10.0635L5.94727 9.99219L5.98242 12.165ZM6.00293 7.17285L2.64648 7.20898L2.60645 5.03516L5.96289 5L6.00293 7.17285Z" fill="white"/>
                    </svg>
                    <span class="property-card-event-text">タイムセール</span>
                    <span class="property-card-event-timer" id="eventTimer_${location.producer}_${location.id || 'default'}">--:--:--</span>
                </div>
            ` : ''}
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
        this.stopInfoWindowEventTimer();

        // 이전에 클릭된 마커가 있으면 원본 아이콘으로 복원
        if (this.clickedMarker && this.clickedMarker !== marker) {
            this.removeGrayscaleFromMarker(this.clickedMarker);
        }

        // 현재 클릭된 마커에 grayscale 적용 (클러스터 마커 제외)
        if (marker.locationData) {
            this.applyGrayscaleToMarker(marker);
            this.clickedMarker = marker;
        }

        // 새 InfoWindow 생성 및 표시
        const content = this.createInfoWindowContent(location);
        this.infoWindow = new google.maps.InfoWindow({
            content: content,
            pixelOffset: new google.maps.Size(0, -10) // 마커 위에 표시
        });

        this.infoWindow.open(this.map, marker);

        // 닫기 버튼으로 닫혔을 때도 타이머 정리
        google.maps.event.addListenerOnce(this.infoWindow, 'closeclick', () => {
            this.stopInfoWindowEventTimer();
        });

        // 이벤트 타이머 부착 (eventId 있을 때만)
        if (location?.eventId && location?.producer && location?.id) {
            const key = `${location.producer}_${location.id}`;
            this.activeEventTimerKey = key;

            // InfoWindow DOM 렌더링 이후 실행 (setTimeout(0) 대신 domready 사용)
            google.maps.event.addListenerOnce(this.infoWindow, 'domready', () => {
                this.attachEventTimerToInfoWindow(location);
            });
        }
    }

    /**
     * InfoWindow 안에 이벤트 카운트다운 타이머 부착
     * @param {Object} location
     */
    async attachEventTimerToInfoWindow(location) {
        try {
            const key = `${location.producer}_${location.id}`;
            // 다른 마커로 바뀌었으면 중단
            if (this.activeEventTimerKey !== key) return;

            const timerEl = document.getElementById(`eventTimer_${location.producer}_${location.id}`);
            if (!timerEl) return;

            const event = await this.getEventDetail(location.eventId);
            const finDate = event?.finDate;
            if (!finDate) return;

            let remaining = this.calcRemainingSeconds(finDate);
            // finDate가 과거면 이벤트 오류로 보고 탈출
            if (remaining === null) return;

            // 초기 렌더
            timerEl.textContent = this.formatHms(remaining);

            // 기존 interval만 정리 후 시작 (active key는 유지)
            if (this.eventTimerIntervalId) {
                clearInterval(this.eventTimerIntervalId);
                this.eventTimerIntervalId = null;
            }

            this.eventTimerIntervalId = setInterval(() => {
                // 다른 인포윈도우로 바뀌었으면 중단
                if (this.activeEventTimerKey !== key) {
                    this.stopInfoWindowEventTimer();
                    return;
                }

                remaining -= 1;
                if (remaining < 0) {
                    this.stopInfoWindowEventTimer();
                    return;
                }
                timerEl.textContent = this.formatHms(remaining);
            }, 1000);
        } catch (e) {
            // 지도 인포윈도우 이벤트는 부가 기능이므로 조용히 실패 처리
            console.warn('인포윈도우 핫딜 타이머 적용 실패:', e);
        }
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

        // eventId 확인 (null이 아니면 이벤트 스타일 적용)
        const eventId = location.eventId || null;

        // 커스텀 마커 아이콘 생성
        const customIcon = this.createCustomMarkerIcon(priceText, false, eventId);

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

        // eventId 확인 (null이 아니면 이벤트 스타일 적용)
        const eventId = marker.locationData.eventId || null;

        // grayscale이 적용된 아이콘 생성
        const grayscaleIcon = this.createCustomMarkerIcon(priceText, true, eventId);
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
            appendMode = false,
            clusterFormat = 'ward'  // 'ward' | 'backend' - backend: MapClusterDto (cellX, cellY, count, hasEvent)
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

            // 성능 모드: 시/현 그룹 마커 또는 백엔드 클러스터( MapClusterDto: cellX, cellY, count, hasEvent )
            const isBackendCluster = clusterFormat === 'backend' && (location.cellX !== undefined || location.hasEvent !== undefined);
            if (performanceMode && (location.isWardGroup || isBackendCluster)) {
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

    /**
     * location 정보로 마커 찾기
     * @param {Object} location - 위치 정보 객체 (producer, id 또는 lat, lng)
     * @returns {google.maps.Marker|null} 찾은 마커 또는 null
     */
    findMarkerByLocation(location) {
        if (!location) return null;

        // producer와 id로 찾기
        if (location.producer && location.id) {
            const markerKey = `${location.producer}_${location.id}`;
            for (const marker of this.markers) {
                if (marker.locationData) {
                    const markerKey2 = `${marker.locationData.producer}_${marker.locationData.id}`;
                    if (markerKey === markerKey2) {
                        return marker;
                    }
                }
            }
        }

        // lat, lng로 찾기 (정확도 0.0001도 이내)
        if (location.lat !== undefined && location.lng !== undefined) {
            const targetLat = Number(location.lat);
            const targetLng = Number(location.lng);
            
            if (!Utils.isFiniteNumber(targetLat) || !Utils.isFiniteNumber(targetLng)) {
                return null;
            }

            for (const marker of this.markers) {
                if (!marker.locationData) continue;
                
                const markerLat = Number(marker.locationData.lat);
                const markerLng = Number(marker.locationData.lng);
                
                if (!Utils.isFiniteNumber(markerLat) || !Utils.isFiniteNumber(markerLng)) {
                    continue;
                }

                const latDiff = Math.abs(markerLat - targetLat);
                const lngDiff = Math.abs(markerLng - targetLng);
                
                if (latDiff < 0.0001 && lngDiff < 0.0001) {
                    return marker;
                }
            }
        }

        return null;
    }
}

