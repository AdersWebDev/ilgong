class DataLoader {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    async loadLocationDetails(producer, locationId) {
        if (!locationId) return [];
        
        UIRenderer.setSidebarMessage('情報を読み込んでいます···');
        
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
            console.error('情報ロードエラー：:', error);
            UIRenderer.setSidebarMessage('情報の取得に失敗しました。');
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
        return data;
    }
    
    async loadPanelData(bounds, filterQueryString = '', page = 1) {
        if (!Utils.isBoundsValid(bounds)) {
            throw new Error('유효하지 않은 bounds');
        }
        if (page > 5) {
            return { items: [], total: 0 };
        }

        const query = Utils.buildBoundsQuery(bounds);
        if (!query) {
            throw new Error('쿼리 생성 실패');
        }

        const baseUrl = `${API_BASE_URL}/map/rent/panel`;
        const queryParts = [query, `page=${page}`];
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
        if (data === null) {
            return { items: [], total: 0 };
        }
        // Spring Page 형식 (content, totalElements)
        const items = Array.isArray(data.content) ? data.content : [];
        const total = typeof data.totalElements === 'number' ? data.totalElements : items.length;
        return { items, total };
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
        
        UIRenderer.setSidebarMessage('情報を読み込んでいます···');
        
        try {
            const response = await fetch(`${API_BASE_URL}/big/map/detail/${buildingId}/room/sync`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
        } catch (error) {
            console.error('상세 정보 로드 오류:', error);
            UIRenderer.setSidebarMessage('情報の取得に失敗しました。');
            return [];
        }
    }
}

