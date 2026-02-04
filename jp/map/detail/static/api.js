/**
 * API Module
 * API 호출 구조 및 데이터 변환 관리
 */

const PropertyAPI = {
    baseUrl: 'https://www.houberapp.com',

    /**
     * URL에서 producer와 id 추출 (query parameter 형식 - 테스트용)
     * @returns {Object|null} {producer, id} 또는 null
     */
    extractUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const producer = urlParams.get('producer');
        const id = urlParams.get('id');

        if (producer && id) {
            return {
                producer: producer,
                id: parseInt(id, 10)
            };
        }
        return null;
    },

    /**
     * photoMulti JSON 문자열 파싱
     * @param {string} photoMulti - JSON 문자열
     * @param {string} filterType - 필터링할 사진 타입 ('building' 또는 'room'), 없으면 모두 반환
     * @returns {Array} 사진 경로 배열
     */
    parsePhotoMulti(photoMulti, filterType = null) {
        if (!photoMulti || typeof photoMulti !== 'string') {
            return [];
        }
        try {
            const photos = JSON.parse(photoMulti);
            if (!Array.isArray(photos)) {
                return [];
            }

            // 타입 필터링
            let filteredPhotos = photos;
            if (filterType) {
                filteredPhotos = photos.filter(p => p.type === filterType);
            }

            return filteredPhotos.map(p => p.path);
        } catch (error) {
            console.error('Failed to parse photoMulti:', error);
            return [];
        }
    },

    /**
     * 건물 설비를 한국어 라벨 배열로 변환
     * @param {Object} buildingData - 건물 데이터
     * @returns {Array} 설비 라벨 배열
     */
    mapBuildingFacilities(buildingData) {
        const facilities = [];
        const mapping = {
            dedicatedGarbagePatch: '専用ごみ置場',
            intercom: 'インターホン',
            autoRock: 'オートロック',
            deliveryBox: '宅配BOX',
            securityCamera: '防犯カメラ',
            bicycleStorage: '自転車置場',
            elevator: 'エレベーター',
            petFootWashroom: 'ペット相談'
        };

        for (const [key, label] of Object.entries(mapping)) {
            if (buildingData[key] === true) {
                facilities.push(label);
            }
        }

        return facilities;
    },

    /**
     * 호실 설비를 한국어 라벨 배열로 변환
     * @param {Object} roomData - 호실 데이터
     * @returns {Array} 설비 라벨 배열
     */
    mapRoomEquipment(roomData) {
        const equipment = [];
        const mapping = {
            bathroomSeparation: 'バス・トイレ別',
            gasStove: 'ガスコンロ',
            systemKitchen: 'システムキッチン',
            induction: 'IHコンロ',
            electricStove: '電気コンロ',
            bidet: 'シャワートイレ',
            bathroomDryer: '浴室乾燥機',
            canInternet: 'インターネット対応',
            canInstalledGasStove: 'ガスコンロ設置可',
            washingMachineInstallable: '洗濯機置場',
            airConditioner: 'エアコン',
            lofted: 'ロフト付',
            shoebox: 'シューズボックス',
            highSpeedInternet: '高速ネット対応',
            wiFi: 'Wi-Fi',
            allElectric: 'オール電化',
            switchLighting: '照明'
        };

        for (const [key, label] of Object.entries(mapping)) {
            if (roomData[key] === true) {
                equipment.push(label);
            }
        }

        return equipment;
    },

    /**
     * roomType 포맷팅 (예: "ldk1" → "1LDK")
     * @param {string} roomType - 원본 roomType
     * @returns {string} 포맷팅된 roomType
     */
    formatRoomType(roomType) {
        if (!roomType) return '';
        // "ldk1" → "1LDK", "k1" → "1K" 등
        const match = roomType.match(/(\d+)?(ldk|k|dk|ld)(\d+)?/i);
        if (match) {
            const num1 = match[1] || match[3] || '';
            const type = match[2].toUpperCase();
            return num1 ? `${num1}${type}` : type;
        }
        return roomType.toUpperCase();
    },

    /**
     * 가격을 통일된 형식으로 변환
     * @param {string|number} price - 가격 (문자열 또는 숫자)
     * @returns {string} 포맷팅된 가격 (예: "120,000엔")
     */
    normalizePrice(price) {
        if (price === null || price === undefined || price === '') {
            return '0円';
        }
        // 문자열에서 숫자만 추출
        const numStr = String(price).replace(/[^\d]/g, '');
        const num = parseInt(numStr, 10);
        if (isNaN(num)) {
            return '0円';
        }
        return `${num.toLocaleString('ja-jp')}円`;
    },

    /**
     * 방향을 한글로 변환 (백엔드 로직 참고)
     * @param {string} direction - 방향 문자열
     * @returns {string} 한글 방향 또는 "문의필요"
     */
    formatDirection(direction) {
        if (!direction || typeof direction !== 'string' || direction.trim() === '') {
            return 'お問い合';
        }
        return direction;
    },

    /**
     * 보증금 파싱 (백엔드 로직 참고)
     * @param {string} deposit - 보증금 문자열
     * @returns {string} 파싱된 보증금 또는 "없음"
     */
    parseDeposit(deposit) {
        if (!deposit || typeof deposit !== 'string' || deposit.trim() === '') {
            return 'なし';
        }

        const lower = deposit.toLowerCase();
        if (lower.includes('nashi') || lower.includes('なし')) {
            return 'なし';
        }
        if (lower.includes('円')) {
            return deposit;
        }
        if (lower.includes('ヶ月') || lower.includes('か月')) {
            return deposit;
        }
        return 'なし';
    },

    /**
     * 호실 사진 가져오기 (layoutfile + room 타입 사진만)
     * @param {Object} room - 호실 데이터
     * @returns {Array} 사진 경로 배열
     */
    getRoomPhotos(room) {
        const photos = [];

        // 1) layoutfile (평면도)
        if (room.layoutfile) {
            photos.push(room.layoutfile);
        }

        // 2) ilgongRoomPhotoList (앞쪽)
        if (Array.isArray(room.ilgongRoomPhotoList) && room.ilgongRoomPhotoList.length > 0) {
            room.ilgongRoomPhotoList.forEach((item) => {
                const url = typeof item === 'string' ? item : (item && item.path) || '';
                if (url) photos.push(url);
            });
        }

        // 3) photoMulti room 타입 (뒤쪽)
        if (room.photoMulti) {
            const roomPhotos = this.parsePhotoMulti(room.photoMulti, 'room');
            photos.push(...roomPhotos);
        }

        return photos;
    },

    /**
     * 레이킹(권리금) 파싱 (백엔드 로직 참고)
     * @param {string} recompense - 레이킹 문자열
     * @returns {string} 파싱된 레이킹 또는 "없음"
     */
    parseRecompense(recompense) {
        if (!recompense || typeof recompense !== 'string' || recompense.trim() === '') {
            return 'なし';
        }

        const lower = recompense.toLowerCase();
        if (lower.includes('nashi') || lower.includes('なし')) {
            return 'なし';
        }
        if (lower.includes('ヶ月') || lower.includes('か月')) {
            return recompense;
        }
        return recompense;
    },

    /**
     * 룸 상태 포맷팅 (백엔드 로직 참고)
     * @param {string} status - 상태 문자열
     * @returns {Object} {statusClass, statusText}
     */
    formatRoomStatus(status, application, cleaning) {
        // Java 로직은 status null이어도 else로 떨어져 "확인필요"가 됨
        const s = (typeof status === 'string') ? status : '';
        const sLower = s.toLowerCase();
      
        // 1) close or application != null => closed
        if (s === "close" || application != null) {
          return { statusClass: "closed", statusText: "満室" };
        }
      
        // 2) available keywords => available
        if (s.includes("空室") || s.includes("新築") || sLower.includes("available") || sLower.includes("offered")) {
          return { statusClass: "available", statusText: "空室" };
        }
      
        // 3) 建築中 exact => scheduled (건축 중)
        if (s === "建築中") {
          return { statusClass: "scheduled", statusText: "建築中" };
        }
      
        // 4) 予定 or cleaning != null => scheduled (공실예정)
        if (s.includes("予定") || cleaning != null) {
          return { statusClass: "scheduled", statusText: "空室予定" };
        }
      
        // 5) default
        return { statusClass: "scheduled", statusText: "お問い合" };
    },

    /**
     * 입주가능일 포맷팅 (백엔드 로직 참고)
     * @param {string} enableEnterDate - 입주가능일
     * @param {string} enablePreviewDate - 입주예정일
     * @returns {string} 포맷팅된 입주가능일
     */
    formatEnterDate(enableEnterDate) {
        // enableEnterDate가 있으면 우선 사용
        if (enableEnterDate && typeof enableEnterDate === 'string' && enableEnterDate.trim() !== '') {
            const trimmed = enableEnterDate.trim();

            switch (trimmed) {
                case '相談':
                    return 'お問い合';
                case '即入':
                case '即入居可':
                    return '-';
                default:
                    return trimmed;
            }
        }


        // 둘 다 없으면 빈 문자열
        return '';
    },

    /**
     * 호실 번호 추출 (정렬용)
     * @param {string} roomNumber - 호실 번호 문자열 (예: "302호", "101호")
     * @returns {number} 추출된 숫자 (없으면 0)
     */
    extractRoomNumber(roomNumber) {
        if (!roomNumber || typeof roomNumber !== 'string') {
            return 0;
        }

        // 숫자 부분만 추출
        const match = roomNumber.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
    },

    /**
     * 전철역 정보 문자열에서 전철선명을 찾아 해당 CSS 클래스를 반환합니다.
     * @param {string} trans - 전철역 정보 문자열 (예: "千日前線「阿波座」徒歩8分")
     * @returns {string} CSS 클래스명 (예: "i"), 매칭되는 전철선이 없으면 빈 문자열
     */
    getSubwayClass(trans) {
        if (!trans || typeof trans !== 'string' || trans.trim() === '') {
            return '';
        }

        // 전철선명과 클래스 매핑 (순서대로)
        const subwayMapping = [
            ['中央線', 'c'],
            ['御堂筋線', 'm'],
            ['千日前線', 's'],
            ['谷町線', 't'],
            ['長堀鶴見線', 'n'],
            ['四つ橋線', 'y'],
            ['堺筋線', 'k'],
            ['今里筋線', 'i'],
            ['阪急京都線', 'hk'],
            ['環状線', 'jr'],
            ["ＪＲ", "jr"]
        ];

        // trans 문자열에 전철선명이 포함되어 있는지 확인
        for (const [lineName, className] of subwayMapping) {
            if (trans.includes(lineName)) {
                return className;
            }
        }

        // 매칭되는 전철선이 없으면 빈 문자열 반환
        return '';
    },

    /**
     * 호실 목록을 정렬 (closed가 아닌 것 먼저, 그 다음 숫자 순)
     * @param {Array} units - 호실 목록
     * @returns {Array} 정렬된 호실 목록
     */
    sortUnitsByRoomNumber(units) {
        if (!Array.isArray(units)) {
            return units;
        }

        return [...units].sort((a, b) => {
            // 1순위: closed가 아닌 것들을 앞으로
            const isAClosed = a.status === 'closed';
            const isBClosed = b.status === 'closed';

            if (isAClosed !== isBClosed) {
                // closed가 아닌 것(a가 closed가 아니면 -1, b가 closed가 아니면 1)
                return isAClosed ? 1 : -1;
            }

            // 2순위: 같은 상태 그룹 내에서 숫자로 비교
            const numA = this.extractRoomNumber(a.number);
            const numB = this.extractRoomNumber(b.number);

            if (numA !== numB) {
                return numA - numB;
            }

            // 숫자가 같으면 문자열로 비교 (예: "101A호" vs "101B호")
            const strA = a.number || '';
            const strB = b.number || '';
            return strA.localeCompare(strB, 'ko', { numeric: true, sensitivity: 'base' });
        });
    },

    /**
     * API 응답을 UI 형식으로 변환
     * @param {Object} apiResponse - API 응답 데이터
     * @returns {Object} UI 형식 데이터
     */
    transformApiResponse(apiResponse) {
        // 건물 사진: ilgongPhotoList(API) + images(photoMulti building fallback) 분리
        const ilgongPhotoList = [];
        if (Array.isArray(apiResponse.ilgongPhotoList) && apiResponse.ilgongPhotoList.length > 0) {
            apiResponse.ilgongPhotoList.forEach((item) => {
                const url = typeof item === 'string' ? item : (item && item.path) || '';
                if (url) ilgongPhotoList.push(url);
            });
        }
        let images = [];
        if (apiResponse.ilgongRooms && apiResponse.ilgongRooms.length > 0) {
            const firstRoom = apiResponse.ilgongRooms[0];
            if (firstRoom && firstRoom.photoMulti) {
                images = this.parsePhotoMulti(firstRoom.photoMulti, 'building');
            }
        }

        // 최소 월세 계산
        let minRent = null;
        if (apiResponse.ilgongRooms && apiResponse.ilgongRooms.length > 0) {
            const rents = apiResponse.ilgongRooms
                .map(r => r.rentalCost)
                .filter(r => r != null && r > 0);
            if (rents.length > 0) {
                minRent = Math.min(...rents);
            }
        }

        return {
            property: {
                id: apiResponse.originalId,
                listPhoto: apiResponse.photo,
                producer: apiResponse.producer,
                name: apiResponse.buildingName || ' - ',
                address: apiResponse.address || ' - ',
                rent: minRent,
                constructionDate: apiResponse.constructionDate || ' - ',
                structure: apiResponse.structure || ' - ',
                updatedAt: apiResponse.updatedAt || ' - ',
                buildingFacilities: this.mapBuildingFacilities(apiResponse),
                ilgongPhotoList,
                images,
                trans1: apiResponse.trans1 || null,
                trans2: apiResponse.trans2 || null,
                trans3: apiResponse.trans3 || null,
                // 이벤트 ID (있으면 핫딜 이벤트 적용)
                eventId: apiResponse.eventId ?? null
            },
            units: this.sortUnitsByRoomNumber(
                (apiResponse.ilgongRooms || []).map(room => {
                    const statusInfo = this.formatRoomStatus(room.status, room.application, room.cleaning);
                    const enterDate = this.formatEnterDate(room.enableEnterDate);

                    return {
                        id: room.originalId,
                        producer: room.producer,
                        number: room.roomName || ' - ',
                        type: this.formatRoomType(room.roomType || 'お問い合'),
                        area: parseFloat(room.squareMeter) || 0,
                        direction: this.formatDirection(room.roomDirection || 'お問い合'),
                        status: statusInfo.statusClass,
                        statusText: statusInfo.statusText,
                        application: room.application,
                        cleaning: room.cleaning,
                        rent: room.rentalCost || 0,
                        commonFee: room.feeCommon || 0,
                        deposit: this.parseDeposit(room.deposit || 'お問い合'),
                        gratuity: this.parseRecompense(room.recompense || 'お問い合'),
                        moveInDate: enterDate,
                        floorPlan: room.layoutfile || '',
                        photoMulti: room.photoMulti || '',
                        photos: this.getRoomPhotos(room),
                        roomEquipment: this.mapRoomEquipment(room)
                    };
                })
            )
        };
    },

    /**
     * 핫딜 이벤트 상세 조회
     * GET /rent/detail/event/{id}
     * @param {number|string} eventId
     * @returns {Promise<{imageUrl: string, finDate: string}>}
     */
    async getEventDetail(eventId) {
        try {
            const url = `${this.baseUrl}/rent/detail/event/${eventId}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`이벤트 API 호출 실패: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('이벤트 API 호출 오류:', error);
            throw error;
        }
    },
    /**
     * 부동산 상세 정보 가져오기 (단일 API 호출)
     * @param {string} producer - 프로듀서
     * @param {number} id - 부동산 ID
     * @returns {Promise<Object>} 변환된 부동산 정보
     */
    async getPropertyDetail(producer, id) {
        try {
            const url = `${this.baseUrl}/rent/detail/${producer}/${id}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const apiData = await response.json();
            const transformed = this.transformApiResponse(apiData);

            return transformed.property;
        } catch (error) {
            console.error('API 호출 오류:', error);
            throw error;
        }
    },

    /**
     * 공실 목록 가져오기 (단일 API 호출에서 함께 가져옴)
     * @param {string} producer - 프로듀서
     * @param {number} id - 부동산 ID
     * @returns {Promise<Array>} 공실 목록
     */
    async getUnits(producer, id) {
        try {
            const url = `${this.baseUrl}/rent/detail/${producer}/${id}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const apiData = await response.json();
            const transformed = this.transformApiResponse(apiData);

            return transformed.units;
        } catch (error) {
            console.error('API 호출 오류:', error);
            throw error;
        }
    },

    /**
     * 전체 데이터 가져오기 (property + units)
     * @param {string} producer - 프로듀서
     * @param {number} id - 부동산 ID
     * @returns {Promise<Object>} {property, units}
     */
    async getPropertyDetailWithUnits(producer, id) {
        try {
            const url = `${this.baseUrl}/rent/detail/${producer}/${id}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const apiData = await response.json();
            return this.transformApiResponse(apiData);
        } catch (error) {
            console.error('API 호출 오류:', error);
            throw error;
        }
    },

    /**
     * 갱신 API 호출 (업데이트 시간과 호실 목록만 갱신)
     * @param {string} producer - 프로듀서
     * @param {number} id - 부동산 ID
     * @returns {Promise<Object>} {updatedAt, units}
     */
    async refreshProperty(producer, id) {
        try {
            const url = `${this.baseUrl}/refresh/${producer}/${id}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
                // body 없음
            });

            if (!response.ok) {
                throw new Error(`갱신 API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const apiData = await response.json();
            const transformed = this.transformApiResponse(apiData);

            return {
                updatedAt: transformed.property.updatedAt,
                units: transformed.units
            };
        } catch (error) {
            console.error('갱신 API 호출 오류:', error);
            throw error;
        }
    },

    /**
     * 초기 비용 문서 정보 가져오기 (건물 단위)
     * @param {string} producer - 프로듀서
     * @param {number} buildingId - 건물 ID
     * @returns {Promise<Object>} 초기 비용 문서 정보 {roomName, initCostRow, specialTerms}
     */
    async getInitCostDocument(producer, buildingId) {
        try {
            const url = `${this.baseUrl}/rent/detail/${producer}/${buildingId}/document`;
            const response = await fetch(url);

            if (!response.ok) {
                // 404나 다른 에러 시 null 반환 (null 케이스로 처리)
                if (response.status === 400) {
                    return null;
                }
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('초기 비용 문서 API 호출 오류:', error);
            // 에러 발생 시 null 반환 (null 케이스로 처리)
            return null;
        }
    }
};

