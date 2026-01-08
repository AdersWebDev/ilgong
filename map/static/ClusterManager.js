/**
 * 클러스터링 관리 클래스
 * 
 * 줌 레벨에 따라 위치를 그룹화하여 성능 최적화
 */
class ClusterManager {
    /**
     * 줌 레벨에 따른 클러스터링 precision 계산
     * 
     * 줌 레벨이 낮을수록(상공) 더 큰 범위로 그룹화하여 성능 최적화
     * 
     * @param {number} zoomLevel - 현재 줌 레벨 (1~20)
     * @returns {number} 클러스터링 precision 값 (도 단위)
     */
    static getClusterPrecision(zoomLevel) {
        // 줌 레벨 11 미만: 시/현 단위 (큰 범위)
        if (zoomLevel < Constants.CLUSTER_ZOOM_THRESHOLD) {
            if (zoomLevel <= 8) {
                return Constants.CLUSTER_PRECISION.VERY_LARGE; // 약 100km (현 단위)
            } else if (zoomLevel <= 10) {
                return Constants.CLUSTER_PRECISION.LARGE; // 약 50km (현 단위)
            } else if (zoomLevel <= 12) {
                return Constants.CLUSTER_PRECISION.MEDIUM; // 약 30km (시 단위)
            }
            else if (zoomLevel <= 14) {
                return Constants.CLUSTER_PRECISION.SMALL; // 약 30km (시 단위)
            }
            else {
                return Constants.CLUSTER_PRECISION.VERY_SMALL;
            }
        } else {
            // 줌 레벨 11 이상: 50km 단위로 클러스터링
            return Constants.CLUSTER_PRECISION.LARGE; // 약 50km
        }
    }

    /**
     * 좌표를 기반으로 그룹 키 생성
     * 같은 precision 범위 내의 좌표는 같은 키를 반환
     * 
     * @param {number} lat - 위도
     * @param {number} lng - 경도
     * @param {number} precision - 클러스터링 precision 값
     * @returns {string} 그룹 키 (예: "34.68_135.49")
     */
    static getGroupKey(lat, lng, precision) {
        // precision 단위로 반올림하여 그룹화
        const latKey = Math.round(lat / precision) * precision;
        const lngKey = Math.round(lng / precision) * precision;
        
        // precision에 따라 소수점 자릿수 조정
        const decimals = precision >= 1.0 ? 0 : precision >= 0.1 ? 1 : precision >= 0.01 ? 2 : 3;
        
        return `${latKey.toFixed(decimals)}_${lngKey.toFixed(decimals)}`;
    }

    /**
     * 위치들을 시/현 또는 구 단위로 그룹화 (성능 최적화)
     * 
     * 줌 레벨에 따라 다른 범위로 그룹화:
     * - 줌 레벨 11 미만: 시/현 단위 (큰 범위)
     * - 줌 레벨 11 이상: 50km 단위
     * 
     * @param {Array} locations - 그룹화할 위치 배열
     * @param {number} zoomLevel - 현재 줌 레벨
     * @returns {Array} 그룹화된 위치 배열
     */
    static groupLocationsByWard(locations, zoomLevel) {
        const precision = ClusterManager.getClusterPrecision(zoomLevel);
        const groupMap = new Map();

        // 각 위치를 그룹에 할당
        locations.forEach(location => {
            const lat = Number(location.lat);
            const lng = Number(location.lng);

            // 유효하지 않은 좌표는 제외
            if (!Utils.isFiniteNumber(lat) || !Utils.isFiniteNumber(lng)) {
                return;
            }

            const groupKey = ClusterManager.getGroupKey(lat, lng, precision);
            
            // 그룹이 없으면 생성
            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, {
                    locations: [],
                    centerLat: 0,
                    centerLng: 0,
                    totalLat: 0,
                    totalLng: 0,
                    count: 0,
                    uniqueIds: new Set() // 중복 방지를 위한 Set
                });
            }

            const group = groupMap.get(groupKey);
            
            // 중복 건물 ID 체크 (같은 건물이 여러 번 카운트되는 것 방지)
            const locationId = location.id || `${lat}_${lng}`;
            if (!group.uniqueIds.has(locationId)) {
                group.locations.push(location);
                group.totalLat += lat;
                group.totalLng += lng;
                group.count += 1;
                group.uniqueIds.add(locationId);
            }
        });

        // 각 그룹의 중심점 계산 및 결과 배열 생성
        const groupedLocations = [];
        const groupType = zoomLevel >= Constants.CLUSTER_ZOOM_THRESHOLD ? '50km' : '시/현';
        
        groupMap.forEach((group, key) => {
            if (group.count === 0) return; // 카운트가 0인 그룹은 제외
            
            // 그룹의 중심점 계산 (평균 좌표)
            group.centerLat = group.totalLat / group.count;
            group.centerLng = group.totalLng / group.count;
            
            // 실제 건물 수 확인 (locations 배열 길이와 count가 일치해야 함)
            const actualCount = group.locations.length;
            const finalCount = Math.max(actualCount, group.count); // 둘 중 큰 값 사용
            
            groupedLocations.push({
                id: `${zoomLevel >= Constants.CLUSTER_ZOOM_THRESHOLD ? 'cluster' : 'city'}_${key}`,
                lat: group.centerLat,
                lng: group.centerLng,
                name: `${Utils.formatCount(finalCount)}개 건물`,
                count: finalCount,
                locations: group.locations, // 그룹에 속한 모든 위치
                isWardGroup: true,
                groupType: groupType
            });
        });

        return groupedLocations;
    }
}

