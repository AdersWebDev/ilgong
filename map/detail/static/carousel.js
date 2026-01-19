/**
 * Carousel Module
 * 공실 목록 및 추천 맨션 카로셀 (가로 스크롤)
 */

const PropertyCarousel = {
    unitCarousel: null,
    recommendedCarousel: null,
    units: [],
    recommended: [],
    currentUnitPage: 0,
    lastUpdatedAt: null, // 마지막 업데이트 시간 저장
    isMobile: false, // 모바일 여부
    
    /**
     * 초기화
     * @param {Array} units - 공실 목록
     * @param {Array} recommended - 추천 맨션 목록
     */
    init(units = [], recommended = []) {
        this.units = units;
        this.recommended = recommended;
        this.unitCarousel = document.getElementById('unitCarousel');
        this.recommendedCarousel = document.getElementById('recommendedCarousel');
        
        // 현재 페이지를 0으로 초기화
        this.currentUnitPage = 0;
        
        // 모바일 여부 확인
        this.checkMobile();
        
        // 초기 마지막 업데이트 시간 설정 (초기화 시 받은 updatedAt)
        this.setLastUpdatedAt();
        
        this.renderUnits();
        this.renderRecommended();
        this.bindEvents();
        
        // 화면 크기 변경 감지
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.checkMobile();
            // 모바일/데스크탑 전환 시 다시 렌더링
            if (wasMobile !== this.isMobile) {
                this.currentUnitPage = 0; // 첫 페이지로 리셋
                this.renderUnits();
            }
        });
        
        // 1분마다 갱신 버튼 상태 확인
        setInterval(() => {
            this.updateRefreshButtonState();
        }, 60000); // 1분마다
    },
    
    /**
     * 모바일 여부 확인 (1005px 기준)
     */
    checkMobile() {
        this.isMobile = window.innerWidth <= 1005;
    },
    
    /**
     * 마지막 업데이트 시간 설정 (초기화 또는 갱신 시 호출)
     * @param {string} updatedAt - ISO 8601 형식의 업데이트 시간 (없으면 PropertyDetail에서 가져옴)
     */
    setLastUpdatedAt(updatedAt = null) {
        if (updatedAt) {
            this.lastUpdatedAt = new Date(updatedAt);
        } else if (PropertyDetail && PropertyDetail.propertyData && PropertyDetail.propertyData.property) {
            const propertyUpdatedAt = PropertyDetail.propertyData.property.updatedAt;
            if (propertyUpdatedAt && propertyUpdatedAt !== ' - ') {
                this.lastUpdatedAt = new Date(propertyUpdatedAt);
            }
        }
    },
    
    /**
     * 공실 목록 렌더링
     */
    renderUnits() {
        this.renderUnitsByPage();
    },
    
    /**
     * 추천 맨션 렌더링
     */
    renderRecommended() {
        if (!this.recommendedCarousel || this.recommended.length === 0) return;
        
        this.recommendedCarousel.innerHTML = '';
        
        this.recommended.forEach((property) => {
            const card = document.createElement('div');
            card.className = 'recommended-card';
            card.innerHTML = `
                <img src="${property.image}" alt="${property.name}" class="recommended-card-img">
                <div class="recommended-card-info">
                    <div class="recommended-card-price">¥${property.price.toLocaleString()}+</div>
                    <div class="recommended-card-area">${property.area}㎡</div>
                </div>
            `;
            
            card.addEventListener('click', () => {
                // 추천 맨션 클릭 시 상세 페이지로 이동 (향후 구현)
                console.log('Navigate to property:', property.id);
            });
            
            this.recommendedCarousel.appendChild(card);
        });
        
        this.setupCarouselScroll(this.recommendedCarousel);
    },
    
    /**
     * 카로셀 스크롤 설정
     * @param {HTMLElement} carousel - 카로셀 요소
     */
    setupCarouselScroll(carousel) {
        if (!carousel) return;
        
        // 스냅 스크롤 적용
        carousel.style.scrollBehavior = 'smooth';
        
        // Intersection Observer로 현재 보이는 카드 감지 (선택사항)
        const observerOptions = {
            root: carousel,
            rootMargin: '0px',
            threshold: 0.5
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 현재 보이는 카드에 대한 처리 (필요시)
                }
            });
        }, observerOptions);
        
        const cards = carousel.querySelectorAll('.unit-card, .recommended-card');
        cards.forEach(card => observer.observe(card));
        
        // 공실 목록은 페이지네이션 버튼으로만 제어 (스크롤 이벤트 제거)
        // 페이지네이션은 버튼 클릭 시에만 업데이트됨
    },
    
    /**
     * 공실 목록 페이지네이션 업데이트
     */
    updateUnitPagination() {
        if (!this.unitCarousel || this.units.length === 0) {
            // 데이터가 없으면 기본값 표시
            const pagination = document.getElementById('unitPagination');
            if (pagination) {
                pagination.textContent = '0 / 0';
            }
            return;
        }
        
        const itemsPerPage = 5;
        const totalPages = Math.ceil(this.units.length / itemsPerPage);
        
        // 페이지네이션 텍스트 업데이트
        const pagination = document.getElementById('unitPagination');
        if (pagination) {
            pagination.textContent = `${this.currentUnitPage + 1} / ${totalPages}`;
        }
        
        // 페이지네이션 버튼 활성화/비활성화
        const prevBtn = document.getElementById('unitPaginationPrev');
        const nextBtn = document.getElementById('unitPaginationNext');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentUnitPage === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentUnitPage >= totalPages - 1;
        }
    },
    
    /**
     * 공실 목록 렌더링 (모바일: 전체 표시 + 가로 스크롤, 데스크탑: 페이지별 5개)
     */
    renderUnitsByPage() {
        if (!this.unitCarousel || this.units.length === 0) {
            // 데이터가 없으면 기존 하드코딩된 카드들 유지
            return;
        }
        
        this.unitCarousel.innerHTML = '';
        
        // 모바일: 모든 호실 표시 (가로 스크롤 카로셀)
        // 데스크탑: 페이지별 5개만 표시
        let unitsToRender = [];
        
        if (this.isMobile) {
            // 모바일: 모든 호실 표시
            unitsToRender = this.units;
        } else {
            // 데스크탑: 페이지당 5개만 표시
            const itemsPerPage = 5;
            const startIndex = this.currentUnitPage * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, this.units.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                unitsToRender.push(this.units[i]);
            }
        }
        
        // 호실 카드 렌더링
        unitsToRender.forEach((unit) => {
            const card = document.createElement('div');
            // status가 closed일 때 closed 클래스 추가
            card.className = unit.status === 'closed' ? 'unit-card closed' : 'unit-card';
            
            // 상태 태그 클래스 및 텍스트 (api.js에서 이미 포맷팅됨)
            const statusClass = unit.status || 'available';
            const statusText = unit.statusText || '공실';
            
            // 사진 개수
            const photoCount = unit.photos ? unit.photos.length : 0;
            
            // 입주가능일 (api.js에서 이미 포맷팅됨)
            const moveInDateText = unit.moveInDate || '-';
            
            // 가격 정보 (이미 normalizePrice로 포맷팅됨)
            const depositValue = unit.deposit && unit.deposit !== '0엔' ? unit.deposit : '없음';
            const gratuityValue = unit.gratuity || '없음';
            
            card.innerHTML = `
                <div class="room left">
                    <img src="${unit.floorPlan || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'}" 
                         alt="${unit.number || ''} 평면도" 
                         class="unit-floor-plan"
                         onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E'">
                    <div class="unit-name">
                        <div class="unit-number">
                            ${unit.number || ''} <span class="unit-status-tag ${statusClass}">${statusText}</span>
                        </div>
                        <div class="unit-photo-info">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M8.5 13C9.88071 13 11 11.8807 11 10.5C11 9.11929 9.88071 8 8.5 8C7.11929 8 6 9.11929 6 10.5C6 11.8807 7.11929 13 8.5 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <span>사진 ${photoCount}장</span>
                        </div>
                    </div>
                </div>
                <div class="room middle">
                    <div class="unit-basic-info">
                        <span>${unit.direction || ''}</span>
                        ${unit.direction ? '<span class="colum-divider"></span>' : ''}
                        <span>${unit.type || ''}</span>
                        ${unit.type ? '<span class="colum-divider"></span>' : ''}
                        <span>${unit.area ? unit.area : ''}㎡</span>
                    </div>
                    <div class="unit-more-info">
                        <div>입주가능일</div>
                        <div class="unit-move-in-date">${moveInDateText}</div>
                    </div>
                </div>
                <div class="room right">
                    <div class="room-right-wrapper">
                        <div class="unit-more-info">
                            <div>월세</div>
                            <div class="unit-price-value">${unit.rent ? unit.rent.toLocaleString('ko-KR') + '엔' : '문의'}</div>
                        </div>
                        <div class="unit-more-info">
                            <div>관리비</div>
                            <div class="unit-price-value">${unit.commonFee ? unit.commonFee + '엔' : '문의 필요'}</div>
                        </div>
                        <div class="unit-more-info">
                            <div>시키킹</div>
                            <div class="unit-price-value">${depositValue}</div>
                        </div>
                        <div class="unit-more-info">
                            <div>레이킹</div>
                            <div class="unit-price-value">${gratuityValue}</div>
                        </div>
                    </div>
                </div>
            `;
            
            // 평면도 이미지 클릭 시 해당 방의 사진 갤러리 열기
            const floorPlanImg = card.querySelector('.unit-floor-plan');
            if (floorPlanImg && unit.photos && unit.photos.length > 0) {
                floorPlanImg.style.cursor = 'pointer';
                floorPlanImg.addEventListener('click', () => {
                    this.openUnitGallery(unit);
                });
            }
            
            this.unitCarousel.appendChild(card);
        });
        const paginationContainer = document.querySelector('.unit-pagination');
        // 페이지네이션 정보 업데이트 (데스크탑만)
        if (!this.isMobile) {
            this.updateUnitPagination();
            paginationContainer.style.display = 'flex';
        } else {
            // 모바일: 페이지네이션 숨김
            paginationContainer.style.display = 'none';

        }
        
        // 카로셀 스크롤 설정
        this.setupCarouselScroll(this.unitCarousel);
    },
    
    /**
     * 호실별 사진 갤러리 열기
     * @param {Object} unit - 호실 정보
     */
    openUnitGallery(unit) {
        if (!unit || !unit.photos || unit.photos.length === 0) return;
        
        // 호실 사진으로 모달만 열기 (메인 갤러리는 건드리지 않음)
        PropertyGallery.openModalWithImages(unit.photos);
    },
    
    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 페이지네이션 버튼 이벤트
        const prevBtn = document.getElementById('unitPaginationPrev');
        const nextBtn = document.getElementById('unitPaginationNext');
        const refreshBtn = document.getElementById('unitRefreshBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                // 모바일에서는 페이지네이션 버튼 비활성화
                if (this.isMobile) return;
                
                if (this.currentUnitPage > 0) {
                    this.currentUnitPage--;
                    this.renderUnitsByPage();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                // 모바일에서는 페이지네이션 버튼 비활성화
                if (this.isMobile) return;
                
                const totalPages = Math.ceil(this.units.length / 5);
                if (this.currentUnitPage < totalPages - 1) {
                    this.currentUnitPage++;
                    this.renderUnitsByPage();
                }
            });
        }
        
        if (refreshBtn) {
            // 초기 갱신 버튼 상태 확인
            this.updateRefreshButtonState();
            
            refreshBtn.addEventListener('click', async () => {
                // 30분 제한 확인
                if (!this.canRefresh()) {
                    const minutesLeft = this.getMinutesUntilRefresh();
                    alert(`${minutesLeft}분 후에 갱신할 수 있습니다.`);
                    return;
                }
                
                // 갱신하기 버튼 클릭 시 refresh API 호출
                try {
                    const urlParams = PropertyAPI.extractUrlParams();
                    if (!urlParams) {
                        console.error('URL 파라미터를 찾을 수 없습니다.');
                        return;
                    }
                    
                    // 버튼 비활성화 (중복 클릭 방지)
                    refreshBtn.disabled = true;
                    const originalText = refreshBtn.innerHTML;
                    refreshBtn.innerHTML = '<span class="update-svg"></span>갱신 중...';
                    
                    // refresh API 호출
                    const refreshData = await PropertyAPI.refreshProperty(urlParams.producer, urlParams.id);
                    
                    // 호실 목록 갱신 및 첫 페이지로 리셋
                    this.units = refreshData.units;
                    this.currentUnitPage = 0; // 갱신 시 첫 페이지로 리셋
                    this.checkMobile(); // 모바일 여부 재확인
                    this.renderUnits();
                    
                    // PropertyDetail 데이터도 업데이트
                    if (PropertyDetail && PropertyDetail.propertyData) {
                        PropertyDetail.propertyData.units = refreshData.units;
                        PropertyDetail.propertyData.property.updatedAt = refreshData.updatedAt;
                    }
                    
                    // 업데이트 시간 갱신 및 마지막 업데이트 시간 저장 (갱신 시 받은 updatedAt)
                    DiscountTimer.setUpdatedAt(refreshData.updatedAt);
                    this.setLastUpdatedAt(refreshData.updatedAt);
                    
                    // 갱신 버튼 상태 업데이트
                    this.updateRefreshButtonState();
                    
                    // 버튼 복원
                    refreshBtn.disabled = false;
                    refreshBtn.innerHTML = originalText;
                    
                } catch (error) {
                    console.error('갱신 실패:', error);
                    alert('데이터 갱신에 실패했습니다.');
                    
                    // 에러 발생 시에도 버튼 복원
                    refreshBtn.disabled = false;
                    const refreshBtnElement = document.getElementById('unitRefreshBtn');
                    if (refreshBtnElement) {
                        refreshBtnElement.innerHTML = '<span class="update-svg"></span>갱신하기';
                    }
                }
            });
        }
        
        // 추천 맨션 좌우 스와이프 지원
        if (this.recommendedCarousel) {
            this.bindSwipeEvents(this.recommendedCarousel);
        }
    },
    
    /**
     * 업데이트 시간 갱신
     */
    updateRefreshTime() {
        // DiscountTimer를 사용하여 업데이트 시간 표시
        if (PropertyDetail && PropertyDetail.propertyData && PropertyDetail.propertyData.property) {
            const updatedAt = PropertyDetail.propertyData.property.updatedAt;
            DiscountTimer.setUpdatedAt(updatedAt);
            // 마지막 업데이트 시간 저장 (갱신 기준 시간)
            this.setLastUpdatedAt(updatedAt);
        }
    },
    
    /**
     * 갱신 가능 여부 확인 (30분 제한)
     * 현재 시간과 마지막 업데이트 시간(초기화 또는 갱신 시 받은 시간)을 비교
     * @returns {boolean} 갱신 가능 여부
     */
    canRefresh() {
        if (!this.lastUpdatedAt) {
            // 마지막 업데이트 시간이 없으면 갱신 가능
            return true;
        }
        
        const now = new Date();
        const diffMs = now - this.lastUpdatedAt;
        const diffMinutes = diffMs / (1000 * 60);
        
        // 30분 이상 지났으면 갱신 가능
        return diffMinutes >= 30;
    },
    
    /**
     * 갱신 가능까지 남은 시간(분) 계산
     * @returns {number} 남은 시간(분)
     */
    getMinutesUntilRefresh() {
        if (!this.lastUpdatedAt) {
            return 0;
        }
        
        const now = new Date();
        const diffMs = now - this.lastUpdatedAt;
        const diffMinutes = diffMs / (1000 * 60);
        const minutesLeft = Math.ceil(30 - diffMinutes);
        
        return minutesLeft > 0 ? minutesLeft : 0;
    },
    
    /**
     * 갱신 버튼 상태 업데이트 (30분 제한 적용)
     * 현재 시간과 마지막 업데이트 시간을 비교하여 버튼 활성/비활성화
     */
    updateRefreshButtonState() {
        const refreshBtn = document.getElementById('unitRefreshBtn');
        if (!refreshBtn) return;
        
        // 마지막 업데이트 시간이 없으면 설정 시도
        if (!this.lastUpdatedAt) {
            this.setLastUpdatedAt();
        }
        
        // 현재 시간과 마지막 업데이트 시간 비교
        if (this.canRefresh()) {
            refreshBtn.disabled = false;
            refreshBtn.style.opacity = '1';
            refreshBtn.style.cursor = 'pointer';
        } else {
            refreshBtn.disabled = true;
            refreshBtn.style.opacity = '0.5';
            refreshBtn.style.cursor = 'not-allowed';
        }
    },
    
    /**
     * 터치 스와이프 이벤트 바인딩
     * @param {HTMLElement} element - 대상 요소
     */
    bindSwipeEvents(element) {
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50;
        
        element.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        element.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].clientX;
            const swipeDistance = touchStartX - touchEndX;
            
            if (Math.abs(swipeDistance) < minSwipeDistance) {
                return;
            }
            
            // 스와이프 방향에 따라 스크롤
            const scrollAmount = element.offsetWidth * 0.8;
            
            if (swipeDistance > 0) {
                // 오른쪽으로 스와이프 (다음)
                element.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            } else {
                // 왼쪽으로 스와이프 (이전)
                element.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                });
            }
        }, { passive: true });
    }
};

