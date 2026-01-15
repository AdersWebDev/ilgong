/**
 * Detail Page Main Module
 * 메인 초기화 및 이벤트 바인딩
 */

const PropertyDetail = {
    propertyId: null,
    propertyData: null,

    /**
     * 초기화
     */
    async init() {
        // URL에서 부동산 ID 추출 (예: /map/detail/?id=1)
        const urlParams = new URLSearchParams(window.location.search);
        this.propertyId = urlParams.get('id') || 1; // 기본값 1

        try {
            // 데이터 로드
            await this.loadData();

            // 모듈 초기화
            this.initModules();

            // 이벤트 바인딩
            this.bindEvents();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('데이터를 불러오는 중 오류가 발생했습니다.');
        }
    },

    /**
     * 데이터 로드
     */
    async loadData() {
        // API에서 데이터 가져오기
        const [property, units, initialCosts, recommended] = await Promise.all([
            PropertyAPI.getPropertyDetail(this.propertyId),
            PropertyAPI.getUnits(this.propertyId),
            PropertyAPI.getInitialCosts(this.propertyId),
            PropertyAPI.getRecommended(this.propertyId)
        ]);

        this.propertyData = {
            property,
            units,
            initialCosts,
            recommended
        };
    },

    /**
     * 모듈 초기화
     */
    initModules() {
        const { property, units, initialCosts, recommended } = this.propertyData;

        // 부동산 정보 렌더링
        this.renderPropertyInfo(property);

        // 이미지 갤러리 초기화
        PropertyGallery.init(property.images || []);

        // 공실 목록 및 추천 맨션 카로셀 초기화
        PropertyCarousel.init(units || [], recommended || []);

        // 초기 비용 렌더링
        this.renderInitialCosts(initialCosts);

        // 할인 타이머 초기화
        DiscountTimer.init();

        // 문의 폼 초기화
        ContactForm.init();
    },

    /**
     * 부동산 정보 렌더링
     * @param {Object} property - 부동산 정보
     */
    renderPropertyInfo(property) {
        // 가격 정보
        const rentPriceElement = document.querySelector('.property-rent-price');
        if (rentPriceElement && property.rent) {
            rentPriceElement.textContent = `${property.rent.toLocaleString()}+ 엔 월세`;
        }

        const managementFeeElement = document.querySelector('.property-management-fee');
        if (managementFeeElement && property.managementFee) {
            managementFeeElement.textContent = `${property.managementFee.toLocaleString()} 엔 관리비`;
        }

        // 부동산명
        const nameElement = document.getElementById('propertyName');
        if (nameElement && property.name) {
            nameElement.textContent = property.name;
        }

        // 주소
        const addressElement = document.getElementById('propertyAddress');
        if (addressElement && property.address) {
            addressElement.textContent = property.address;
        }

        // 건축일 및 구조 정보
        const basicInfoItems = document.querySelectorAll('.property-basic-info-item');
        if (basicInfoItems.length >= 2 && property.constructionDate && property.structure) {
            basicInfoItems[0].textContent = `건축일 ${property.constructionDate}`;
            basicInfoItems[1].textContent = `구조 ${property.structure}`;
        }

        // 건물 설비
        const buildingFacilitiesContainer = document.getElementById('buildingFacilities');
        if (buildingFacilitiesContainer && property.buildingFacilities) {
            buildingFacilitiesContainer.innerHTML = '';

            property.buildingFacilities.forEach((facility, idx) => {
                const tag = document.createElement('span');
                tag.className = 'property-feature-tag';
                tag.textContent = facility;
                buildingFacilitiesContainer.appendChild(tag);

                // 마지막 요소가 아니면 divider 추가
                if (idx !== property.buildingFacilities.length - 1) {
                    const divider = document.createElement('span');
                    divider.className = 'divider';
                    buildingFacilitiesContainer.appendChild(divider);
                }
            });
        }

        // 호실 설비 옵션
        const roomEquipmentContainer = document.getElementById('roomEquipment');
        if (roomEquipmentContainer && property.roomEquipment) {
            roomEquipmentContainer.innerHTML = '';
            property.roomEquipment.forEach((equipment, idx) => {
                const tag = document.createElement('div');
                tag.className = 'property-feature-tag';
                tag.textContent = equipment;
                roomEquipmentContainer.appendChild(tag);

                // 마지막 요소가 아니면 divider 추가
                if (idx !== property.roomEquipment.length - 1) {
                    const divider = document.createElement('span');
                    divider.className = 'divider';
                    roomEquipmentContainer.appendChild(divider);
                }
            });
        }
    },

    /**
     * 초기 비용 렌더링
     * @param {Object} costs - 초기 비용 정보
     */
    renderInitialCosts(costs) {
        if (!costs) return;

        // 총 초기비용
        const totalElement = document.getElementById('totalInitialCost');
        if (totalElement) {
            totalElement.textContent = `¥${costs.total?.toLocaleString() || '0'}`;
        }

        // 비용 항목
        const costItemsContainer = document.getElementById('costItems');
        if (costItemsContainer) {
            costItemsContainer.innerHTML = '';

            const costItems = [
                { label: '광열비', value: costs.utilities || 0 },
                { label: '보증금', value: costs.deposit || 0, note: '(계약 시 1회)' },
                { label: '하우스 클리닝 비용', value: costs.cleaningFee || 0 },
                { label: '중개수수료', value: costs.brokerageFee || 0 }
            ];

            costItems.forEach(item => {
                const costItem = document.createElement('div');
                costItem.className = 'cost-item';
                costItem.innerHTML = `
                    <span class="cost-label">${item.label}${item.note ? ' ' + item.note : ''}</span>
                    <span class="cost-value">¥${item.value.toLocaleString()}</span>
                `;
                costItemsContainer.appendChild(costItem);
            });

            // 초기 예상 총액
            const estimatedTotal = document.querySelector('.estimated-total-value');
            if (estimatedTotal && costs.estimatedTotal) {
                estimatedTotal.textContent = `¥${costs.estimatedTotal.toLocaleString()}`;
            }
        }
    },

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 뒤로가기 버튼
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '/map/';
                }
            });
        }

        // 더보기 메뉴 버튼 (향후 구현)
        const moreMenuBtn = document.querySelector('.more-menu-btn');
        if (moreMenuBtn) {
            moreMenuBtn.addEventListener('click', () => {
                // 메뉴 열기 (향후 구현)
                console.log('More menu clicked');
            });
        }

        // 예약하기 버튼 (향후 구현)
        const reserveBtn = document.querySelector('.unit-reserve-btn');
        if (reserveBtn) {
            reserveBtn.addEventListener('click', () => {
                // 예약 페이지로 이동 (향후 구현)
                console.log('Reserve clicked');
            });
        }

        // 할인 배너 버튼
        const discountBtn = document.querySelector('.discount-btn');
        if (discountBtn) {
            discountBtn.addEventListener('click', () => {
                // 예약 페이지로 이동 또는 스크롤 (향후 구현)
                const unitSection = document.querySelector('.unit-list-section');
                if (unitSection) {
                    unitSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    },

    /**
     * 에러 메시지 표시
     * @param {string} message - 에러 메시지
     */
    showError(message) {
        // 간단한 알림 (향후 모달로 변경 가능)
        alert(message);
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    PropertyDetail.init();
});

