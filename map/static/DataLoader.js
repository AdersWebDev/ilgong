class DataLoader {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    async loadLocationDetails(producer, locationId) {
        if (!locationId) return [];
        
        UIRenderer.setSidebarMessage('상세 정보를 불러오는 중...');
        
        try {
            const response = await fetch(`${API_BASE_URL}/big/map/detail/${locationId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            UIRenderer.renderDetailItems(data);
            this.loadSyncRoomData(data.buildingId);
            return data;
        } catch (error) {
            console.error('상세 정보 로드 오류:', error);
            UIRenderer.setSidebarMessage('상세 정보를 불러오는데 실패했습니다.');
            return [];
        }
    }

    async loadMapData(bounds, filterQueryString = '') {
        if (!Utils.isBoundsValid(bounds)) {
            throw new Error('유효하지 않은 bounds');
        }

        const query = Utils.buildBoundsQuery(bounds);
        if (!query) {
            throw new Error('쿼리 생성 실패');
        }
        
        const baseUrl = `${API_BASE_URL}/map/rent`;
        const queryParts = [query];
        
        if (filterQueryString) {
            const filterParams = filterQueryString.startsWith('?') 
                ? filterQueryString.substring(1) 
                : filterQueryString;
            if (filterParams) {
                queryParts.push(filterParams);
            }
        }
        
        const fullQuery = `?${queryParts.join('&')}`;
        
        const response = await fetch(`${baseUrl}${fullQuery}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const locations = Array.isArray(data) ? data : (data.locations || []);
        return locations;
    }

    async loadRentDetail(producer, propertyId) {
        if (!propertyId) return null;
        
        try {
            const response = await fetch(`${Constants.RENT_DETAIL_ENDPOINT}/${producer}/${propertyId}`);
            
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
            const response = await fetch(`${API_BASE_URL}/big/map/detail/${buildingId}/room/sync`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
        } catch (error) {
            console.error('상세 정보 로드 오류:', error);
            UIRenderer.setSidebarMessage('상세 정보를 불러오는데 실패했습니다.');
            return [];
        }
    }
}

