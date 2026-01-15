/**
 * API Module
 * API 호출 구조 및 샘플 데이터 관리
 */

const PropertyAPI = {
    // 샘플 데이터
    sampleData: {
        property: {
            id: 1,
            name: "セオリー難波南プレミアム",
            address: "大阪府大阪市浪速区戎本町1丁目9-18",
            rent: 75000,
            managementFee: 7000,
            views: 75000,
            discount: 7000,
            constructionDate: "2022년 2월",
            structure: "철근콘크리트조 / 12층 건물",
            buildingFacilities: [
                "오토록",
                "방범 카메라",
                "엘리베이터",
                "인터폰",
                "택배함",
                "전용 쓰레기장",
                "반려동물 발 세척장",
                "자전거보관소"
            ],
            roomEquipment: [
                "욕실/화장실 분리",
                "가스레인지",
                "시스템 주방",
                "IH 인덕션",
                "전기레인지",
                "비데 변기",
                "욕실 건조기",
                "인터넷 대응",
                "가스레인지 설치 가능",
                "세탁기 설치 가능",
                "에어컨",
                "로프트 있음",
                "신발장",
                "고속 인터넷",
                "와이파이",
                "전기",
                "조명 포함"
            ],
            images: [
                "https://picsum.photos/400/400?random=1",
                "https://picsum.photos/400/400?random=2",
                "https://picsum.photos/400/400?random=3",
                "https://picsum.photos/400/400?random=4",
                "https://picsum.photos/400/400?random=5"
            ]
        },
        units: [
            {
                id: 1,
                number: "302호",
                type: "1K",
                area: 25.37,
                direction: "남서향",
                status: "vacant",
                moveOutDate: "2025-11월 하순",
                moveInDate: "2025-12-26",
                rent: 61000,
                commonFee: 10000,
                keyMoney: 0,
                deposit: 0,
                gratuity: 70000,
                floorPlan: "https://picsum.photos/300/200?random=10",
                photos: Array(8).fill(0).map((_, i) => `https://picsum.photos/400/400?random=${11 + i}`)
            },
            {
                id: 2,
                number: "705호",
                type: "1K",
                area: 25.37,
                direction: "남향",
                status: "expected",
                moveOutDate: "2025-1월 초순",
                moveInDate: "2025-02-06",
                rent: 61000,
                commonFee: 10000,
                keyMoney: 0,
                deposit: 0,
                gratuity: 70000,
                floorPlan: "https://picsum.photos/300/200?random=20",
                photos: Array(8).fill(0).map((_, i) => `https://picsum.photos/400/400?random=${21 + i}`)
            },
            {
                id: 3,
                number: "803호",
                type: "1K",
                area: 25.37,
                direction: "북향",
                status: "vacant",
                moveOutDate: "2025-1월 중순",
                moveInDate: "2025-02-17",
                rent: 63000,
                commonFee: 10000,
                keyMoney: 0,
                deposit: 0,
                gratuity: 70000,
                floorPlan: "https://picsum.photos/300/200?random=30",
                photos: Array(8).fill(0).map((_, i) => `https://picsum.photos/400/400?random=${31 + i}`)
            },
            {
                id: 4,
                number: "901호",
                type: "1K",
                area: 26,
                direction: "남서향",
                status: "vacant",
                moveOutDate: "2025-12월 하순",
                moveInDate: "2025-01-10",
                rent: 65000,
                commonFee: 10000,
                keyMoney: 0,
                deposit: 0,
                gratuity: 70000,
                floorPlan: "https://picsum.photos/300/200?random=40",
                photos: Array(8).fill(0).map((_, i) => `https://picsum.photos/400/400?random=${41 + i}`)
            },
            {
                id: 5,
                number: "1004호",
                type: "1K",
                area: 26,
                direction: "남향",
                status: "vacant",
                moveOutDate: "2025-1월 하순",
                moveInDate: "2025-02-26",
                rent: 65000,
                commonFee: 10000,
                keyMoney: 0,
                deposit: 0,
                gratuity: 70000,
                floorPlan: "https://picsum.photos/300/200?random=50",
                photos: Array(8).fill(0).map((_, i) => `https://picsum.photos/400/400?random=${51 + i}`)
            }
        ],
        initialCosts: {
            utilities: 11000,
            deposit: 22000,
            cleaningFee: 66000,
            brokerageFee: 0,
            total: 121000,
            estimatedTotal: 304800
        },
        koreanSupport: {
            company: "하우비(주) | 메이더스",
            address: "도쿄도 신주쿠구 신주쿠 1-1-1",
            phone: "03-1234-5678",
            logo: "https://picsum.photos/60/60?random=200"
        },
        recommended: [
            {
                id: 1,
                name: "추천 맨션 1",
                price: 75000,
                area: 22.42,
                image: "https://picsum.photos/300/200?random=100"
            },
            {
                id: 2,
                name: "추천 맨션 2",
                price: 68000,
                area: 20.15,
                image: "https://picsum.photos/300/200?random=101"
            },
            {
                id: 3,
                name: "추천 맨션 3",
                price: 95000,
                area: 28.50,
                image: "https://picsum.photos/300/200?random=102"
            },
            {
                id: 4,
                name: "추천 맨션 4",
                price: 82000,
                area: 25.30,
                image: "https://picsum.photos/300/200?random=103"
            },
            {
                id: 5,
                name: "추천 맨션 5",
                price: 72000,
                area: 21.80,
                image: "https://picsum.photos/300/200?random=104"
            }
        ]
    },

    /**
     * 부동산 상세 정보 가져오기
     * @param {number} propertyId - 부동산 ID
     * @returns {Promise<Object>} 부동산 정보
     */
    async getPropertyDetail(propertyId) {
        // 향후 실제 API 호출로 대체
        // const response = await fetch(`/api/properties/${propertyId}`);
        // return await response.json();
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.sampleData.property);
            }, 100);
        });
    },

    /**
     * 공실 목록 가져오기
     * @param {number} propertyId - 부동산 ID
     * @returns {Promise<Array>} 공실 목록
     */
    async getUnits(propertyId) {
        // 향후 실제 API 호출로 대체
        // const response = await fetch(`/api/properties/${propertyId}/units`);
        // return await response.json();
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.sampleData.units);
            }, 100);
        });
    },

    /**
     * 초기 비용 정보 가져오기
     * @param {number} unitId - 호실 ID
     * @returns {Promise<Object>} 초기 비용 정보
     */
    async getInitialCosts(unitId) {
        // 향후 실제 API 호출로 대체
        // const response = await fetch(`/api/units/${unitId}/costs`);
        // return await response.json();
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.sampleData.initialCosts);
            }, 100);
        });
    },

    /**
     * 추천 맨션 목록 가져오기
     * @param {number} propertyId - 부동산 ID
     * @returns {Promise<Array>} 추천 맨션 목록
     */
    async getRecommended(propertyId) {
        // 향후 실제 API 호출로 대체
        // const response = await fetch(`/api/properties/${propertyId}/recommended`);
        // return await response.json();
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.sampleData.recommended);
            }, 100);
        });
    },

    /**
     * 문의 폼 제출
     * @param {Object} formData - 폼 데이터
     * @returns {Promise<Object>} 응답 데이터
     */
    async submitInquiry(formData) {
        // 향후 실제 API 호출로 대체
        // const response = await fetch('/api/inquiry', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify(formData)
        // });
        // return await response.json();
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: "문의가 성공적으로 전송되었습니다."
                });
            }, 500);
        });
    }
};

