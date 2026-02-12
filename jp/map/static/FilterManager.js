/**
 * 필터 관리 클래스
 * 
 * 필터 상태 관리 및 필터링 로직 담당
 * 
 * 필터 구조:
 * 주의: 검색 쿼리(searchQuery)는 SearchManager에서 독립적으로 처리됩니다.
 * 
 * 1. 비자 선택 (visaType): 문자열 (단일 선택) - '1' (취업/장기비자), '2' (워킹홀리데이), '3' (유학비자) 중 하나
 * 2. 월세 금액대 (price): minPrice, maxPrice (숫자, 엔 단위) - 최대값은 -1 (예: 4만엔 = 49999)
 * 3. 방 타입 (roomType): 배열 - ['r1', 'k1', 'dk1', 'ldk1', 'k2', 'dk2', 'ldk2', 'k3', 'dk3', 'ldk3']
 * 4. 건물 구조 타입 (structureType): 배열 - ['CONCRETE', 'STEEL', 'OTHER']
 * 5. 건물 축년 수 (buildingAgeYears): 배열 - [1990, 2000, 2010, 2020] (최소 연도 기준)
 * 6. 많이 찾는 옵션 (popularOptions): 숫자 배열 - [184, 128, 113] (인터넷 무료, 2인 입주가능, 반려동물 상담 가능)
 * 7. 건물 옵션 (buildingOptions): 숫자 배열 - [114, 1, 6, 10, 4, 5, 7, 13] (인터폰, 오토록, 택배함, 방범 카메라, 자전거 보관소, 전용 쓰레기장, 엘리베이터, 반려동물 발 세척장)
 * 8. 내부 옵션 (interiorOptions): 배열 - (현재 주석 처리됨, 필요시 활성화)
 * 9. 정렬 (sortOrder): 문자열 - 'price-asc' | 'price-desc'
 */
class FilterManager {
    /**
     * @param {Function} onFilterChange - 필터 변경 시 호출될 콜백 함수
     */
    constructor(onFilterChange = null) {
        this.onFilterChange = onFilterChange;
        this.propertyData = []; // 필터링할 프로퍼티 데이터 저장
        this.filterState = {
            // 검색 쿼리는 SearchManager에서 독립적으로 처리됨
            visaType: null,                     // 비자 선택 (단일 선택)
            roomTypes: [],                      // 방 타입 (roomType)
            buildingTypes: [],                  // 건물 구조 타입 (structureType)
            popularOptions: [],                 // 많이 찾는 옵션
            buildingOptions: [],                // 건물 옵션
            interiorOptions: [],                // 내부 옵션 (현재 미사용)
            minPrice: null,                     // 최소 월세 (엔)
            maxPrice: null,                     // 최대 월세 (엔)
            buildingAgeYears: [],               // 건물 축년 수 필터 (1990, 2000, 2010, 2020)
            sortOrder: 'price-asc'             // 정렬 순서
        };
    }

    /**
     * 프로퍼티 데이터 설정
     * @param {Array} propertyData - 필터링할 프로퍼티 데이터
     */
    setPropertyData(propertyData) {
        this.propertyData = propertyData || [];
    }

    /**
     * 필터 초기화
     */
    init() {
        // Filter button click handlers - 모달 열기/닫기 토글
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            const filterType = btn.dataset.filter;
            
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // 모바일에서 검색창이 열려있으면 닫기
                const searchInput = document.getElementById('searchInput');
                const filterSearch = searchInput?.closest('.filter-search');
                if (searchInput && filterSearch && document.activeElement === searchInput) {
                    searchInput.blur();
                }
                
                const filterType = btn.dataset.filter;
                
                const modalId = this.getModalId(filterType);
                const modal = document.getElementById(modalId);
                
                // 이미 열려있는 모달이면 닫기, 아니면 열기
                if (modal && modal.classList.contains('active')) {
                    this.closeAllModals();
                } else {
                    this.openFilterModal(filterType);
                }
            });
        });
        
        // Confirm buttons - 모달 닫기 및 필터 적용
        document.querySelectorAll('.btn-confirm').forEach(btn => {
            btn.addEventListener('click', () => {
                this.updateFilterState();
                this.closeAllModals();
                // 필터 적용 시 항상 onFilterChange 호출하여 지도/패널 리로드 (propertyData 무시)
                if (this.onFilterChange) {
                    this.onFilterChange([]);
                }
            });
        });
        
        // Reset buttons - 필터 초기화
        document.querySelectorAll('.btn-reset').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.filter-modal');
                if (modal) {
                    this.resetModalFilters(modal);
                }
            });
        });
        
        // Toggle all buttons
        document.querySelectorAll('.toggle-all-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const group = e.currentTarget.dataset.group;
                const checkboxes = document.querySelectorAll(`input[name="${group}"]`);
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                
                checkboxes.forEach(cb => {
                    cb.checked = !allChecked;
                });
                
                e.currentTarget.classList.toggle('active', !allChecked);
                this.updateFilterState();
            });
        });
        
        // Checkbox change events
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                // visaTypeModal 내부의 체크박스는 단일 선택만 가능
                const visaTypeModal = document.getElementById('visaTypeModal');
                if (visaTypeModal && visaTypeModal.contains(checkbox)) {
                    if (checkbox.checked) {
                        // 다른 모든 체크박스 해제
                        visaTypeModal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            if (cb !== checkbox) {
                                cb.checked = false;
                            }
                        });
                    }
                }
                
                // roomTypeModal 내부의 체크박스는 단일 선택만 가능
                const roomTypeModal = document.getElementById('roomTypeModal');
                if (roomTypeModal && roomTypeModal.contains(checkbox)) {
                    if (checkbox.checked) {
                        // 다른 모든 체크박스 해제
                        roomTypeModal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                            if (cb !== checkbox) {
                                cb.checked = false;
                            }
                        });
                    }
                }
                
                this.updateFilterState();
                
                // Update toggle all button state
                const group = checkbox.name;
                const toggleBtn = document.querySelector(`.toggle-all-btn[data-group="${group}"]`);
                if (toggleBtn) {
                    const checkboxes = document.querySelectorAll(`input[name="${group}"]`);
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    toggleBtn.classList.toggle('active', allChecked);
                }
                
                // 필터 변경 시 즉시 렌더링 (API 재호출)
                this.triggerFilterChange();
            });
        });
        
        // Reset filters button
        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters());
        }
        
        // Filter refresh button (새로고침 버튼)
        const filterRefreshBtn = document.getElementById('filter-refresh');
        if (filterRefreshBtn) {
            filterRefreshBtn.addEventListener('click', () => {
                // 모든 모달 닫기
                this.closeAllModals();
                // 모든 필터 초기화
                this.resetFilters();
                // 검색 입력창도 초기화
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = '';
                    searchInput.blur();
                }
            });
        }
        
        // Apply filters button
        const applyBtn = document.getElementById('applyFilters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyFilters());
        }
        
        // Sort order change (가격 정렬 드롭다운)
        const sortOrderBtn = document.getElementById('sortOrderBtn');
        const sortDropdown = document.getElementById('sortDropdown');
        const sortPriceText = document.querySelector('.sort-price-text');
        
        if (sortOrderBtn && sortDropdown) {
            // 초기 상태 설정 (오름차순)
            this.filterState.sortOrder = 'event-asc';
            if (sortPriceText) {
                sortPriceText.textContent = '特価';
            }
            
            // 버튼 클릭 시 드롭다운 토글
            sortOrderBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sortOrderBtn.classList.toggle('active');
                sortDropdown.classList.toggle('active');
            });
            
            // 드롭다운 옵션 클릭
            sortDropdown.querySelectorAll('li').forEach(li => {
                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = li.dataset.value;
                    this.filterState.sortOrder = value;
                    
                    // 선택된 항목 표시
                    sortDropdown.querySelectorAll('li').forEach(item => {
                        item.classList.remove('selected');
                    });
                    li.classList.add('selected');
                    
                    // 버튼 텍스트 업데이트
                    if (sortPriceText) {
                        sortPriceText.textContent = li.textContent;
                    }
                    
                    // 드롭다운 닫기
                    sortOrderBtn.classList.remove('active');
                    sortDropdown.classList.remove('active');
                    
                    // 필터 적용
                    this.applyFilters();
                });
            });
            
            // 외부 클릭 시 드롭다운 닫기
            document.addEventListener('click', (e) => {
                if (!sortOrderBtn.contains(e.target) && !sortDropdown.contains(e.target)) {
                    sortOrderBtn.classList.remove('active');
                    sortDropdown.classList.remove('active');
                }
            });
            
            // 초기 선택 항목 표시
            const initialItem = sortDropdown.querySelector('li[data-value="event-asc"]');
            if (initialItem) {
                initialItem.classList.add('selected');
            }
        }

        // Price selectors 초기화
        this.initializePriceSelectors();
        
        // Building age filter 초기화
        this.initializeBuildingAgeFilter();
        
        // 외부 클릭 시 모달 닫기
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.filter-btn') && !e.target.closest('.filter-modal')) {
                const activeModal = document.querySelector('.filter-modal.active');
                if (activeModal && !activeModal.contains(e.target)) {
                    this.closeAllModals();
                }
            }
        });
    }

    /**
     * 필터 타입에 따른 모달 ID 반환
     * @param {string} filterType - 필터 타입
     * @returns {string} 모달 ID
     */
    getModalId(filterType) {
        const modalMap = {
            'visaType': 'visaTypeModal',
            'roomType': 'roomTypeModal',
            'price': 'priceModal',
            'buildingType': 'buildingTypeModal',
            'options': 'optionsModal'
        };
        return modalMap[filterType] || '';
    }

    /**
     * 필터 모달 열기
     * @param {string} filterType - 필터 타입 (roomType, price, buildingType, options)
     */
    openFilterModal(filterType) {
        // 모든 모달 닫기
        this.closeAllModals();
        
        // 필터 타입에 따른 모달 ID 매핑
        const modalMap = {
            'visaType': 'visaTypeModal',
            'roomType': 'roomTypeModal',
            'price': 'priceModal',
            'buildingType': 'buildingTypeModal',
            'options': 'optionsModal'
        };
        
        const modalId = modalMap[filterType];
        if (!modalId) {
            console.warn(`Unknown filter type: ${filterType}`);
            return;
        }
        
        const modal = document.getElementById(modalId);
        const filterBtn = document.querySelector(`.filter-btn[data-filter="${filterType}"]`);
        
        if (!modal) {
            console.error(`Modal not found: ${modalId}`);
            return;
        }
        
        if (!filterBtn) {
            console.error(`Filter button not found: data-filter="${filterType}"`);
            return;
        }
        
        // 모바일 감지 (838px 이하) - CSS 미디어쿼리와 일치
        const isMobile = window.innerWidth <= 838;
        
        // 필터 바 컨테이너를 기준으로 위치 계산
        const filterBarContainer = filterBtn.closest('.filter-bar-container');
        const buttonRect = filterBtn.getBoundingClientRect();
        const containerRect = filterBarContainer?.getBoundingClientRect();
        
        if (filterBarContainer) {
            // 모바일이 아닐 때만 filter-bar-container에 추가
            if (!isMobile && modal.parentElement !== filterBarContainer) {
                filterBarContainer.appendChild(modal);
            }
            
            if (isMobile) {
                // 모바일: position fixed로 화면 기준 위치 계산
                const filterBarRect = document.querySelector('.filter-bar')?.getBoundingClientRect();
                const padding = 16; // spacing-lg 값
                
                // 모달을 body에 추가 (모바일에서만)
                if (modal.parentElement !== document.body) {
                    document.body.appendChild(modal);
                }
                
                // 버튼의 화면 기준 위치
                const buttonBottom = buttonRect.bottom;
                
                // 모달 위치 설정 (화면 기준) - 인라인 스타일로 설정
                modal.style.position = 'fixed';
                modal.style.top = `${buttonBottom + 4}px`;
                modal.style.left = `${padding}px`;
                modal.style.width = `calc(100vw - ${padding * 2}px)`;
                modal.style.maxWidth = `calc(100vw - ${padding * 2}px)`;
                modal.style.zIndex = '2000'; // var(--z-modal) 값
            } else {
                // 데스크탑: 기존 로직 유지
                // 버튼의 상대적 위치 계산
                const buttonLeft = buttonRect.left - containerRect.left;
                const buttonBottom = buttonRect.bottom - containerRect.top;
                
                // 모달 위치 설정
                modal.style.left = `${buttonLeft}px`;
                modal.style.top = `${buttonBottom + 4}px`;
                
                // 화면 경계 체크 및 조정
                setTimeout(() => {
                    const modalRect = modal.getBoundingClientRect();
                    const viewportWidth = window.innerWidth;
                    const padding = 20; // spacing-xl 값
                    
                    // 오른쪽 경계 체크
                    if (modalRect.right > viewportWidth - padding) {
                        const overflow = modalRect.right - (viewportWidth - padding);
                        modal.style.left = `${buttonLeft - overflow}px`;
                    }
                    
                    // 왼쪽 경계 체크
                    if (modalRect.left < padding) {
                        modal.style.left = `${padding}px`;
                    }
                }, 0);
            }
        }
        
        // 모달 활성화
        modal.classList.add('active');
        
        // 필터 버튼 활성화
        filterBtn.classList.add('active');
    }

    /**
     * 모든 모달 닫기
     */
    closeAllModals() {
        // 모든 모달 닫기
        document.querySelectorAll('.filter-modal').forEach(modal => {
            modal.classList.remove('active');
        });
        
        // 모든 필터 버튼 비활성화
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    /**
     * 특정 모달의 필터 초기화
     * @param {HTMLElement} modal - 초기화할 모달 요소
     */
    resetModalFilters(modal) {
        // 모달 내의 모든 체크박스 해제
        modal.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // 모달 내의 모든 토글 버튼 비활성화
        modal.querySelectorAll('.toggle-all-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 가격 선택기 초기화
        modal.querySelectorAll('.custom-select').forEach(select => {
            const button = select.querySelector('.select-button');
            const text = button?.querySelector('.select-text');
            if (text) {
                text.textContent = '제한 없음';
            }
            const dropdown = select.querySelector('.select-dropdown');
            if (dropdown) {
                dropdown.querySelectorAll('li').forEach(li => {
                    li.classList.remove('selected');
                });
            }
        });
        
        // 건물 축년 수 필터 초기화 (buildingTypeModal 내부인 경우)
        if (modal.id === 'buildingTypeModal') {
            const agePoints = modal.querySelectorAll('.age-point');
            agePoints.forEach(point => point.classList.remove('active'));
            const allAgePoint = modal.querySelector('.age-point[data-year="all"]');
            if (allAgePoint) allAgePoint.classList.add('active');
            this.filterState.buildingAgeYears = [];
            this.updateBuildingAgeDisplay();
            this.updateBuildingAgeSlider();
        }
        
        this.updateFilterState();
    }

    /**
     * 필터 상태 업데이트
     * collectFormData()를 사용하여 DOM에서 직접 값을 읽어서 filterState 업데이트
     */
    updateFilterState() {
        // DOM에서 직접 데이터 수집
        const formData = this.collectFormData();
        
        // filterState 업데이트
        this.filterState.visaType = formData.visaType;
        this.filterState.roomTypes = formData.roomTypes;
        this.filterState.buildingTypes = formData.structureTypes;
        this.filterState.popularOptions = formData.popularOptions;
        this.filterState.buildingOptions = formData.buildingOptions;
        this.filterState.minPrice = formData.minPrice;
        this.filterState.maxPrice = formData.maxPrice;
        this.filterState.sortOrder = formData.sortOrder;
        
        // Building age years는 이미 updateBuildingAgeDisplay에서 업데이트됨
        // (initializeBuildingAgeFilter에서 처리)
    }

    /**
     * 필터 리셋
     */
    resetFilters() {
        // 검색 쿼리는 SearchManager에서 독립적으로 처리됨
        
        // Uncheck all checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Reset toggle all buttons
        document.querySelectorAll('.toggle-all-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Reset price selectors
        document.querySelectorAll('.custom-select').forEach(select => {
            const button = select.querySelector('.select-button');
            const text = button?.querySelector('.select-text');
            if (text) {
                text.textContent = '제한 없음';
            }
            // 드롭다운의 선택된 항목도 초기화
            const dropdown = select.querySelector('.select-dropdown');
            if (dropdown) {
                dropdown.querySelectorAll('li').forEach(li => {
                    li.classList.remove('selected');
                });
                // 첫 번째 항목(제한 없음)을 선택 상태로
                const firstItem = dropdown.querySelector('li[data-value=""]');
                if (firstItem) {
                    firstItem.classList.add('selected');
                }
            }
        });
        
        // Reset building age filter
        document.querySelectorAll('.age-point').forEach(point => {
            point.classList.remove('active');
        });
        const allAgePoint = document.querySelector('.age-point[data-year="all"]');
        if (allAgePoint) allAgePoint.classList.add('active');
        this.filterState.buildingAgeYears = [];
        this.updateBuildingAgeDisplay();
        this.updateBuildingAgeSlider();
        
        this.filterState.minPrice = null;
        this.filterState.maxPrice = null;
        this.filterState.visaType = null;
        this.filterState.roomTypes = [];
        this.filterState.buildingTypes = [];
        this.filterState.popularOptions = [];
        this.filterState.buildingOptions = [];
        this.filterState.interiorOptions = [];
        this.filterState.buildingAgeYears = [];
        this.filterState.sortOrder = 'price-asc';
        
        // Apply filters
        this.applyFilters();
    }

    /**
     * 필터 적용
     * @param {Array} propertyData - 필터링할 프로퍼티 데이터
     * @returns {Array} 필터링된 프로퍼티 배열
     */
    applyFilters(propertyData = []) {
        
        // Filter properties
        // 주의: 검색 쿼리는 SearchManager에서 독립적으로 처리됨
        let filteredProperties = propertyData.filter(property => {
            // Visa type (단일 선택)
            if (this.filterState.visaType) {
                // property.visaType 필드 확인
                if (property.visaType !== this.filterState.visaType) {
                    return false;
                }
            }
            
            // Room types
            if (this.filterState.roomTypes.length > 0) {
                if (!this.filterState.roomTypes.includes(property.type)) return false;
            }
            
            // Building types (structureType)
            if (this.filterState.buildingTypes.length > 0) {
                if (!this.filterState.buildingTypes.includes(property.buildingType)) return false;
            }
            
            // Options (any match)
            const allOptions = [
                ...this.filterState.popularOptions,
                ...this.filterState.buildingOptions,
                ...this.filterState.interiorOptions
            ];
            
            if (allOptions.length > 0) {
                const hasOption = allOptions.some(option => 
                    property.options?.includes(option)
                );
                if (!hasOption) return false;
            }
            
            // Price range
            if (this.filterState.minPrice && property.price < this.filterState.minPrice) return false;
            if (this.filterState.maxPrice && property.price > this.filterState.maxPrice) return false;
            
            // Building age years
            if (this.filterState.buildingAgeYears.length > 0) {
                // property에 constructionYear 또는 builtYear 필드가 있다고 가정
                const propertyYear = property.constructionYear || property.builtYear || property.year;
                if (propertyYear) {
                    const minSelectedYear = Math.min(...this.filterState.buildingAgeYears);
                    if (propertyYear < minSelectedYear) return false;
                } else {
                    // 연도 정보가 없으면 필터링에서 제외 (또는 false 반환)
                    // return false; // 연도 정보가 없으면 제외
                }
            }
            
            return true;
        });
        
        // Sort properties
        filteredProperties = this.sortProperties(filteredProperties);
        
        // 콜백 호출
        if (this.onFilterChange) {
            this.onFilterChange(filteredProperties);
        }
        return filteredProperties;
    }

    /**
     * 프로퍼티 정렬
     * @param {Array} properties - 정렬할 프로퍼티 배열
     * @returns {Array} 정렬된 프로퍼티 배열
     */
    sortProperties(properties) {
        const sorted = [...properties];
        
        switch (this.filterState.sortOrder) {
            case 'price-asc':
                sorted.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                sorted.sort((a, b) => b.price - a.price);
                break;
            default:
                // 기본값: 오름차순
                sorted.sort((a, b) => a.price - b.price);
                break;
        }
        
        return sorted;
    }

    /**
     * 필터 상태 반환
     * @returns {Object} 필터 상태 객체
     */
    getFilterState() {
        return { ...this.filterState };
    }

    /**
     * 필터 변경 트리거 (즉시 렌더링)
     * 필터가 변경될 때마다 호출하여 API를 다시 호출하도록 함
     */
    triggerFilterChange() {
        // 필터 상태 업데이트
        this.updateFilterState();
        
        // onFilterChange 콜백 호출 (빈 배열 전달, 실제 렌더링은 콜백 내부에서 처리)
        if (this.onFilterChange) {
            this.onFilterChange([]);
        }
    }

    /**
     * DOM에서 직접 폼 데이터 수집 (houber.js 로직 참고)
     * @returns {Object} 수집된 폼 데이터
     */
    collectFormData() {
        const formData = {
            // 비자 선택 (단일 선택)
            visaType: null,
            
            // 가격 범위
            minPrice: null,
            maxPrice: null,
            
            // 방 타입
            roomTypes: [],
            
            // 건물 구조 타입
            structureTypes: [],
            
            // 건물 축년 수 (최소 연도만 전송)
            minConstructionYear: null,
            
            // 많이 찾는 옵션
            popularOptions: [],
            
            // 건물 옵션
            buildingOptions: [],
            
            // 정렬
            sortOrder: 'price-asc'
        };

        // 비자 선택 수집 (단일 선택)
        const checkedVisaType = document.querySelector('input[name="visaType"]:checked');
        if (checkedVisaType) {
            formData.visaType = checkedVisaType.value;
        }

        // 가격 범위 수집
        const minPriceSelect = document.getElementById('minPriceSelect');
        const maxPriceSelect = document.getElementById('maxPriceSelect');
        
        if (minPriceSelect) {
            const minPriceLi = minPriceSelect.querySelector('.select-dropdown li.selected');
            if (minPriceLi && minPriceLi.dataset.value) {
                formData.minPrice = parseInt(minPriceLi.dataset.value);
            } else {
                // selected 클래스가 없을 경우 select-text에서 값 추출 시도
                const minPriceText = minPriceSelect.querySelector('.select-text')?.textContent;
                if (minPriceText && minPriceText !== '制限なし') {
                    const allOptions = minPriceSelect.querySelectorAll('.select-dropdown li');
                    for (const li of allOptions) {
                        if (li.textContent.trim() === minPriceText.trim()) {
                            formData.minPrice = parseInt(li.dataset.value);
                            break;
                        }
                    }
                }
            }
        }
        
        if (maxPriceSelect) {
            const maxPriceLi = maxPriceSelect.querySelector('.select-dropdown li.selected');
            if (maxPriceLi && maxPriceLi.dataset.value) {
                formData.maxPrice = parseInt(maxPriceLi.dataset.value);
            } else {
                // selected 클래스가 없을 경우 select-text에서 값 추출 시도
                const maxPriceText = maxPriceSelect.querySelector('.select-text')?.textContent;
                if (maxPriceText && maxPriceText !== '制限なし') {
                    const allOptions = maxPriceSelect.querySelectorAll('.select-dropdown li');
                    for (const li of allOptions) {
                        if (li.textContent.trim() === maxPriceText.trim()) {
                            formData.maxPrice = parseInt(li.dataset.value);
                            break;
                        }
                    }
                }
            }
        }

        // 방 타입 수집
        const roomTypeCheckboxes = document.querySelectorAll('input[name="roomType"]:checked');
        roomTypeCheckboxes.forEach(cb => {
            formData.roomTypes.push(cb.value);
        });

        // 건물 구조 타입 수집
        const structureTypeCheckboxes = document.querySelectorAll('input[name="structureType"]:checked');
        structureTypeCheckboxes.forEach(cb => {
            formData.structureTypes.push(cb.value);
        });

        // 건물 축년 수 수집 (최소 연도만)
        const activeAgePoints = document.querySelectorAll('.age-point.active:not([data-year="all"])');
        const buildingAgeYears = [];
        activeAgePoints.forEach(point => {
            const year = parseInt(point.dataset.year);
            if (year) {
                buildingAgeYears.push(year);
            }
        });
        if (buildingAgeYears.length > 0) {
            formData.minConstructionYear = Math.min(...buildingAgeYears);
        }

        // 많이 찾는 옵션 수집
        const popularOptionsCheckboxes = document.querySelectorAll('input[name="popularOptions"]:checked');
        popularOptionsCheckboxes.forEach(cb => {
            formData.popularOptions.push(parseInt(cb.value));
        });

        // 건물 옵션 수집
        const buildingOptionsCheckboxes = document.querySelectorAll('input[name="buildingOptions"]:checked');
        buildingOptionsCheckboxes.forEach(cb => {
            formData.buildingOptions.push(parseInt(cb.value));
        });

        // 정렬 수집
        const sortOrderBtn = document.getElementById('sortOrderBtn');
        const sortDropdown = document.getElementById('sortDropdown');
        if (sortDropdown) {
            const selectedItem = sortDropdown.querySelector('li.selected');
            if (selectedItem && selectedItem.dataset.value) {
                formData.sortOrder = selectedItem.dataset.value;
            }
        }

        return formData;
    }

    /**
     * 백엔드 전송용 파라미터 정리 (빈 값 제거) - houber.js 로직 참고
     * @param {Object} formData - collectFormData()에서 수집한 데이터
     * @returns {Object} 백엔드 전송용 파라미터 객체
     */
    prepareBackendParams(formData) {
        const params = {};
        
        // 비자 선택 (숫자로 변환: '1', '2', '3')
        if (formData.visaType) {
            params.visaType = parseInt(formData.visaType);
        }
        
        // 가격 범위
        if (formData.minPrice !== null && formData.minPrice !== undefined) {
            params.minPrice = formData.minPrice;
        }
        
        if (formData.maxPrice !== null && formData.maxPrice !== undefined) {
            params.maxPrice = formData.maxPrice;
        }
        
        // 방 타입
        if (formData.roomTypes.length > 0) {
            params.roomTypes = formData.roomTypes;
        }
        
        // 건물 구조 타입
        if (formData.structureTypes.length > 0) {
            params.structureTypes = formData.structureTypes;
        }
        
        // 건물 축년 수
        if (formData.minConstructionYear !== null && formData.minConstructionYear !== undefined) {
            params.minConstructionYear = formData.minConstructionYear;
        }
        
        // 많이 찾는 옵션
        if (formData.popularOptions.length > 0) {
            params.popularOptions = formData.popularOptions;
        }
        
        // 건물 옵션
        if (formData.buildingOptions.length > 0) {
            params.buildingOptions = formData.buildingOptions;
        }
        
        // 정렬
        if (formData.sortOrder) {
            params.sortOrder = formData.sortOrder;
        }
        
        return params;
    }

    /**
     * API 요청용 파라미터 객체 생성
     * 빈 값이나 null인 필터는 제외하고 반환
     * 검색 쿼리는 제외됨 (독립적으로 처리)
     * @returns {Object} API 요청 파라미터 객체
     */
    getFilterParams() {
        // DOM에서 직접 데이터 수집
        const formData = this.collectFormData();
        
        // 백엔드 전송용 파라미터 준비 (빈 값 제거)
        return this.prepareBackendParams(formData);
    }

    /**
     * API 요청용 쿼리 스트링 생성
     * 검색 쿼리는 제외됨 (독립적으로 처리)
     * @returns {string} 쿼리 스트링 (예: "?roomTypes=1K&roomTypes=1DK&minPrice=50000")
     */
    getFilterQueryString() {
        const params = this.getFilterParams();
        const queryParts = [];
        
        for (const [key, value] of Object.entries(params)) {
            if (Array.isArray(value)) {
                // 배열인 경우 각 값을 별도 파라미터로 추가
                // 예: roomTypes=1K&roomTypes=1DK (표준 방식, 성능 문제 없음)
                value.forEach(v => {
                    queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
                });
            } else {
                queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            }
        }
        
        return queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    }

    /**
     * 가격 선택자 초기화
     */
    initializePriceSelectors() {
        const minPriceSelect = document.getElementById('minPriceSelect');
        const maxPriceSelect = document.getElementById('maxPriceSelect');
        
        if (minPriceSelect) {
            this.initCustomSelect(minPriceSelect, value => {
                this.filterState.minPrice = value ? parseInt(value) : null;
                // 가격 필터 변경 시 즉시 렌더링
                this.triggerFilterChange();
            });
        }
        
        if (maxPriceSelect) {
            this.initCustomSelect(maxPriceSelect, value => {
                this.filterState.maxPrice = value ? parseInt(value) : null;
                // 가격 필터 변경 시 즉시 렌더링
                this.triggerFilterChange();
            });
        }
    }

    /**
     * 커스텀 셀렉트 초기화
     * @param {HTMLElement} selectElement - 셀렉트 요소
     * @param {Function} onChange - 변경 시 호출될 함수
     */
    initCustomSelect(selectElement, onChange) {
        const button = selectElement.querySelector('.select-button');
        const dropdown = selectElement.querySelector('.select-dropdown');
        const text = button?.querySelector('.select-text');
        
        if (!button || !dropdown || !text) return;
        
        // 드롭다운 위치 업데이트 함수
        const updateDropdownPosition = () => {
            if (!dropdown.classList.contains('active')) return;
            
            const buttonRect = button.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const padding = 20;
            
            // 기본 위치: 버튼 바로 아래
            let top = buttonRect.bottom + 4;
            let left = buttonRect.left;
            let width = buttonRect.width;
            
            // 오른쪽 경계 체크
            if (left + width > viewportWidth - padding) {
                left = Math.max(padding, viewportWidth - width - padding);
            }
            
            // 왼쪽 경계 체크
            if (left < padding) {
                left = padding;
            }
            
            // 아래쪽 경계 체크
            const estimatedHeight = Math.min(250, dropdown.scrollHeight);
            if (top + estimatedHeight > viewportHeight - padding) {
                const spaceAbove = buttonRect.top;
                const spaceBelow = viewportHeight - buttonRect.bottom;
                
                if (spaceAbove > spaceBelow && spaceAbove > estimatedHeight + padding) {
                    // 위쪽에 공간이 충분하면 위로 표시
                    top = buttonRect.top - estimatedHeight - 4;
                } else {
                    // 위쪽 공간이 부족하면 최대 높이 제한
                    dropdown.style.maxHeight = `${viewportHeight - buttonRect.bottom - padding - 4}px`;
                }
            }
            
            // 위치 적용
            dropdown.style.top = `${top}px`;
            dropdown.style.left = `${left}px`;
            dropdown.style.width = `${width}px`;
        };
        
        // Toggle dropdown
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Close other dropdowns
            document.querySelectorAll('.custom-select').forEach(select => {
                if (select !== selectElement) {
                    select.querySelector('.select-button')?.classList.remove('active');
                    select.querySelector('.select-dropdown')?.classList.remove('active');
                }
            });
            
            button.classList.toggle('active');
            
            if (button.classList.contains('active')) {
                // 드롭다운을 body로 이동 (모달 밖으로)
                if (dropdown.parentElement !== document.body) {
                    document.body.appendChild(dropdown);
                }
                
                // 초기 스타일 설정
                dropdown.style.position = 'fixed';
                dropdown.style.zIndex = '3000';
                
                // 드롭다운 표시
                dropdown.classList.add('active');
                
                // 위치 계산 및 적용
                requestAnimationFrame(() => {
                    updateDropdownPosition();
                });
            } else {
                dropdown.classList.remove('active');
                // 드롭다운을 원래 위치로 복원
                if (dropdown.parentElement === document.body) {
                    selectElement.appendChild(dropdown);
                }
            }
        });
        
        // Select option
        dropdown.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', function() {
                const value = this.dataset.value;
                const displayText = this.textContent;
                
                text.textContent = displayText;
                
                // Update selected state
                dropdown.querySelectorAll('li').forEach(item => {
                    item.classList.remove('selected');
                });
                this.classList.add('selected');
                
                // Close dropdown
                button.classList.remove('active');
                dropdown.classList.remove('active');
                
                // 드롭다운을 원래 위치로 복원
                if (dropdown.parentElement === document.body) {
                    selectElement.appendChild(dropdown);
                }
                
                // Callback
                if (onChange) onChange(value);
            });
        });
        
        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!selectElement.contains(e.target) && !dropdown.contains(e.target)) {
                button.classList.remove('active');
                dropdown.classList.remove('active');
                // 드롭다운을 원래 위치로 복원
                if (dropdown.parentElement === document.body) {
                    selectElement.appendChild(dropdown);
                }
            }
        });
        
        // 윈도우 리사이즈 및 스크롤 시 위치 업데이트
        const handleUpdate = () => {
            if (dropdown.classList.contains('active')) {
                updateDropdownPosition();
            }
        };
        
        window.addEventListener('resize', handleUpdate);
        window.addEventListener('scroll', handleUpdate, true);
        
        // 모달 스크롤 시에도 위치 업데이트
        const modal = selectElement.closest('.filter-modal');
        if (modal) {
            const modalContent = modal.querySelector('.filter-modal-content');
            if (modalContent) {
                modalContent.addEventListener('scroll', handleUpdate);
            }
        }
    }

    /**
     * 건물 축년 수 필터 초기화 (houber.js 로직 참고)
     */
    initializeBuildingAgeFilter() {
        const agePoints = document.querySelectorAll('.age-point');
        const ageFilterDisplay = document.getElementById('ageFilterDisplay');
        const ageSliderLine = document.getElementById('ageSliderLine');
        
        if (!agePoints.length || !ageSliderLine) {
            console.warn('건물 축년 수 필터 초기화 실패: 요소를 찾을 수 없습니다.');
            return;
        }
        
        // 초기 상태 설정 - 전체 버튼 활성화
        const allPoint = document.querySelector('.age-point[data-year="all"]');
        if (allPoint) {
            allPoint.classList.add('active');
        }
        this.filterState.buildingAgeYears = [];
        this.updateBuildingAgeDisplay();
        
        // 초기 업데이트 (약간의 지연을 두어 레이아웃이 완전히 로드된 후 실행)
        setTimeout(() => {
            this.updateBuildingAgeSlider();
        }, 100);
        
        // 리사이즈 시 선 위치 업데이트
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateBuildingAgeSlider();
            }, 100);
        });
        
        agePoints.forEach(point => {
            point.addEventListener('click', (e) => {
                e.stopPropagation();
                const year = point.dataset.year;
                const clickedIndex = parseInt(point.dataset.index);
                
                if (year === 'all') {
                    // 전체를 클릭하면 모든 연도 해제
                    this.filterState.buildingAgeYears = [];
                    agePoints.forEach(p => {
                        p.classList.remove('active');
                    });
                    // 전체 버튼만 활성화
                    point.classList.add('active');
                } else {
                    // 전체 버튼 해제
                    const allPoint = document.querySelector('.age-point[data-year="all"]');
                    if (allPoint) {
                        allPoint.classList.remove('active');
                    }
                    
                    // 클릭한 버튼의 좌측은 모두 off, 우측(자신 포함)은 모두 on
                    const selectedYears = [];
                    agePoints.forEach(p => {
                        const pIndex = parseInt(p.dataset.index);
                        if (pIndex < clickedIndex) {
                            // 좌측: 모두 off
                            p.classList.remove('active');
                        } else if (pIndex >= clickedIndex && p.dataset.year !== 'all') {
                            // 우측(자신 포함): 모두 on (전체 버튼 제외)
                            p.classList.add('active');
                            const yearNum = parseInt(p.dataset.year);
                            if (yearNum) {
                                selectedYears.push(yearNum);
                            }
                        }
                    });
                    
                    // filterState 업데이트
                    this.filterState.buildingAgeYears = selectedYears.sort((a, b) => a - b);
                }
                
                this.updateBuildingAgeDisplay();
                this.updateBuildingAgeSlider();
                this.updateFilterState();
                
                // 건물 축년 수 필터 변경 시 즉시 렌더링
                this.triggerFilterChange();
            });
        });
    }

    /**
     * 건물 축년 수 필터 표시 텍스트 업데이트
     */
    updateBuildingAgeDisplay() {
        const ageFilterDisplay = document.getElementById('ageFilterDisplay');
        if (!ageFilterDisplay) return;
        
        const years = this.filterState.buildingAgeYears;
        
        if (years.length === 0) {
            ageFilterDisplay.textContent = '전체';
        } else {
            const minYear = Math.min(...years);
            ageFilterDisplay.textContent = `${minYear}년 이상`;
        }
    }

    /**
     * 건물 축년 수 슬라이더 라인 업데이트 (houber.js 로직 참고)
     */
    updateBuildingAgeSlider() {
        const ageSliderLine = document.getElementById('ageSliderLine');
        const agePoints = document.querySelectorAll('.age-point');
        
        if (!ageSliderLine || agePoints.length === 0) return;
        
        // 활성화된 버튼들 중에서 'all' 제외한 연도 버튼들 찾기
        const activeYearPoints = Array.from(agePoints).filter(p => 
            p.classList.contains('active') && p.dataset.year !== 'all'
        );
        
        if (activeYearPoints.length === 0) {
            // 활성화된 연도 버튼이 없으면 선 숨김
            ageSliderLine.style.width = '0%';
            ageSliderLine.style.left = '0%';
            return;
        }
        
        // 트랙의 실제 위치와 너비 가져오기
        const track = ageSliderLine.parentElement;
        const trackRect = track.getBoundingClientRect();
        const trackWidth = trackRect.width;
        
        // 첫 번째와 마지막 활성화된 버튼 찾기
        const sortedActivePoints = activeYearPoints.sort((a, b) => {
            return parseInt(a.dataset.index) - parseInt(b.dataset.index);
        });
        
        const firstButton = sortedActivePoints[0];
        const lastButton = sortedActivePoints[sortedActivePoints.length - 1];
        
        // 각 버튼의 중심점 위치 계산
        const firstButtonRect = firstButton.getBoundingClientRect();
        const lastButtonRect = lastButton.getBoundingClientRect();
        
        const firstButtonCenter = firstButtonRect.left + firstButtonRect.width / 2;
        const lastButtonCenter = lastButtonRect.left + lastButtonRect.width / 2;
        
        // 트랙 기준으로 상대 위치 계산
        const trackLeft = trackRect.left;
        const lineStart = firstButtonCenter - trackLeft;
        const lineEnd = lastButtonCenter - trackLeft;
        
        // 퍼센트로 변환
        const leftPercent = (lineStart / trackWidth) * 100;
        const widthPercent = ((lineEnd - lineStart) / trackWidth) * 100;
        
        ageSliderLine.style.left = `${leftPercent}%`;
        ageSliderLine.style.width = `${widthPercent}%`;
    }
}

