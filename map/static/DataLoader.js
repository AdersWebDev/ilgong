/**
 * 데이터 로딩 클래스
 * 
 * 백엔드 API에서 지도 데이터를 로드하고 처리
 */
class DataLoader {
    /**
     * @param {string} endpoint - API 엔드포인트
     */
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    /**
     * 특정 위치의 상세 정보 로드
     * @param {string|number} locationId - 위치 ID
     * @returns {Promise<Array>} 상세 정보 배열
     */
    async loadLocationDetails(producer,locationId) {
        if (!locationId) return [];
        
        UIRenderer.setSidebarMessage('상세 정보를 불러오는 중...');
        
        try {
            const response = await fetch(`https://www.houberapp.com/big/map/detail/${locationId}`);
            // const response = await fetch(`http://localhost:40011/rent/detail/${producer}/${locationId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            // const details = Array.isArray(data) ? data : (data.details || []);
            
            // if (!details.length) {
            //     UIRenderer.setSidebarMessage('상세 정보가 없습니다.');
            //     return [];
            // }
            
            UIRenderer.renderDetailItems(data);
            this.loadSyncRoomData(data.buildingId);
            return data;
        } catch (error) {
            console.error('상세 정보 로드 오류:', error);
            UIRenderer.setSidebarMessage('상세 정보를 불러오는데 실패했습니다.');
            return [];
        }
    }

    /**
     * 지도 영역에 해당하는 건물 데이터 로드
     * 
     * @param {google.maps.LatLngBounds} bounds - 로드할 지도 영역
     * @param {string} filterQueryString - 필터 쿼리 스트링 (선택사항)
     * @returns {Promise<Array>} 위치 배열
     */
    async loadMapData(bounds, filterQueryString = '') {
        // 유효성 검사
        if (!Utils.isBoundsValid(bounds)) {
            throw new Error('유효하지 않은 bounds');
        }

        // 백엔드 API 호출
        const query = Utils.buildBoundsQuery(bounds);
        if (!query) {
            throw new Error('쿼리 생성 실패');
        }
        
        // 엔드포인트: localhost:40011/map/rent
        const baseUrl = 'https://www.houberapp.com/map/rent';
        // const baseUrl = 'http://localhost:40011/map/rent';
        
        // bounds 쿼리와 필터 쿼리 스트링 결합
        const queryParts = [query]; // bounds 쿼리
        
        // 필터 쿼리 스트링이 있으면 파라미터 추가
        if (filterQueryString) {
            // ? 제거하고 파라미터만 추출
            const filterParams = filterQueryString.startsWith('?') 
                ? filterQueryString.substring(1) 
                : filterQueryString;
            if (filterParams) {
                queryParts.push(filterParams);
            }
        }
        
        // 모든 쿼리 파라미터를 &로 연결
        const fullQuery = `?${queryParts.join('&')}`;
        
        const response = await fetch(`${baseUrl}${fullQuery}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const locations = Array.isArray(data) ? data : (data.locations || []);

        return locations;
    }

    /**
     * 임대 매물 상세 정보 로드 (property-card 클릭 시 사용)
     * @param {string|number} propertyId - 매물 ID
     * @returns {Promise<Object|null>} 상세 정보 객체
     */
    async loadRentDetail(propertyId) {
        if (!propertyId) return null;
        
        try {
            const response = await fetch(`${Constants.RENT_DETAIL_ENDPOINT}/${propertyId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('임대 매물 상세 정보 로드 오류:', error);
            throw error;
        }
    }

    async loadSyncRoomData(buildingId) {
        if (!buildingId) return [];
        
        UIRenderer.setSidebarMessage('상세 정보를 불러오는 중...');
        
        try {
            const response = await fetch(`https://www.houberapp.com/big/map/detail/${buildingId}/room/sync`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(data);
        } catch (error) {
            console.error('상세 정보 로드 오류:', error);
            UIRenderer.setSidebarMessage('상세 정보를 불러오는데 실패했습니다.');
            return [];
        }
    }
}

