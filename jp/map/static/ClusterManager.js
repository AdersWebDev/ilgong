class ClusterManager {
    static getClusterPrecision(zoomLevel) {
        if (zoomLevel < Constants.CLUSTER_ZOOM_THRESHOLD) {
            if (zoomLevel <= 8) {
                return Constants.CLUSTER_PRECISION.VERY_LARGE;
            } else if (zoomLevel <= 10) {
                return Constants.CLUSTER_PRECISION.LARGE;
            } else if (zoomLevel <= 12) {
                return Constants.CLUSTER_PRECISION.MEDIUM;
            } else if (zoomLevel <= 14) {
                return Constants.CLUSTER_PRECISION.SMALL;
            } else {
                return Constants.CLUSTER_PRECISION.VERY_SMALL;
            }
        } else {
            return Constants.CLUSTER_PRECISION.LARGE;
        }
    }

    static getGroupKey(lat, lng, precision) {
        const latKey = Math.round(lat / precision) * precision;
        const lngKey = Math.round(lng / precision) * precision;
        const decimals = precision >= 1.0 ? 0 : precision >= 0.1 ? 1 : precision >= 0.01 ? 2 : 3;
        return `${latKey.toFixed(decimals)}_${lngKey.toFixed(decimals)}`;
    }

    static groupLocationsByWard(locations, zoomLevel) {
        const precision = ClusterManager.getClusterPrecision(zoomLevel);
        const groupMap = new Map();

        locations.forEach(location => {
            const lat = Number(location.lat);
            const lng = Number(location.lng);

            if (!Utils.isFiniteNumber(lat) || !Utils.isFiniteNumber(lng)) {
                return;
            }

            const groupKey = ClusterManager.getGroupKey(lat, lng, precision);
            
            if (!groupMap.has(groupKey)) {
                groupMap.set(groupKey, {
                    locations: [],
                    centerLat: 0,
                    centerLng: 0,
                    totalLat: 0,
                    totalLng: 0,
                    count: 0,
                    uniqueIds: new Set()
                });
            }

            const group = groupMap.get(groupKey);
            const locationId = location.id || `${lat}_${lng}`;
            if (!group.uniqueIds.has(locationId)) {
                group.locations.push(location);
                group.totalLat += lat;
                group.totalLng += lng;
                group.count += 1;
                group.uniqueIds.add(locationId);
            }
        });

        const groupedLocations = [];
        const groupType = zoomLevel >= Constants.CLUSTER_ZOOM_THRESHOLD ? '50km' : '시/현';
        
        groupMap.forEach((group, key) => {
            if (group.count === 0) return;
            
            group.centerLat = group.totalLat / group.count;
            group.centerLng = group.totalLng / group.count;
            const actualCount = group.locations.length;
            const finalCount = Math.max(actualCount, group.count);
            
            groupedLocations.push({
                id: `${zoomLevel >= Constants.CLUSTER_ZOOM_THRESHOLD ? 'cluster' : 'city'}_${key}`,
                lat: group.centerLat,
                lng: group.centerLng,
                name: `${Utils.formatCount(finalCount)}개 건물`,
                count: finalCount,
                locations: group.locations,
                isWardGroup: true,
                groupType: groupType
            });
        });

        return groupedLocations;
    }
}

