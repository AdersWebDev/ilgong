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
        
        this.renderUnits();
        this.renderRecommended();
        this.bindEvents();
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
        
        // 스크롤 이벤트로 페이지네이션 업데이트 (공실 목록만)
        if (carousel === this.unitCarousel) {
            carousel.addEventListener('scroll', () => {
                this.updateUnitPagination();
            }, { passive: true });
        }
    },
    
    /**
     * 공실 목록 페이지네이션 업데이트
     */
    updateUnitPagination() {
        if (!this.unitCarousel || this.units.length === 0) return;
        
        const totalPages = Math.ceil(this.units.length / 5);
        const pagination = document.getElementById('unitPagination');
        if (pagination) {
            pagination.textContent = `${this.currentUnitPage + 1}/${totalPages}`;
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
     * 공실 목록 렌더링 (페이지별)
     */
    renderUnitsByPage() {
        if (!this.unitCarousel || this.units.length === 0) return;
        
        // this.unitCarousel.innerHTML = '';
        // const itemsPerPage = 5;
        // const startIndex = this.currentUnitPage * itemsPerPage;
        // const endIndex = startIndex + itemsPerPage;
        // const unitsToShow = this.units.slice(startIndex, endIndex);
        
        // unitsToShow.forEach((unit) => {
        //     const card = document.createElement('div');
        //     card.className = 'unit-card';
            
        //     // 상태 태그 클래스 결정
        //     const statusClass = unit.status === 'expected' ? 'expected' : 'vacant';
        //     const statusText = unit.status === 'expected' ? '공실예정' : '공실';
        //     const photoCount = unit.photos ? unit.photos.length : 8;
            
        //     // 방향 정보
        //     const direction = unit.direction || '';
        //     const directionText = direction ? `${direction} | ` : '';
            
        //     card.innerHTML = `
        //         <div class="unit-card-left">
        //             <img src="${unit.floorPlan}" alt="${unit.number} 평면도" class="unit-floor-plan">
        //             <div class="unit-number">${unit.number}</div>
        //             <span class="unit-status-tag ${statusClass}">${statusText}</span>
        //             <div class="unit-photo-info">
        //                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        //                     <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        //                     <path d="M8.5 13C9.88071 13 11 11.8807 11 10.5C11 9.11929 9.88071 8 8.5 8C7.11929 8 6 9.11929 6 10.5C6 11.8807 7.11929 13 8.5 13Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        //                     <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        //                 </svg>
        //                 <span>사진 ${photoCount}장</span>
        //             </div>
        //         </div>
        //         <div class="unit-card-middle">
        //             <div class="unit-basic-info">${directionText}${unit.type} | ${unit.area}㎡</div>
        //             ${unit.moveOutDate ? `<div class="unit-move-out-date">퇴실예정일 ${unit.moveOutDate}</div>` : ''}
        //             <div class="unit-move-in-date">입주가능일 ${unit.moveInDate}~</div>
        //         </div>
        //         <div class="unit-card-right">
        //             <div class="unit-price-item">
        //                 <span class="unit-price-label">월세</span>
        //                 <span class="unit-price-value">${unit.rent.toLocaleString()}엔</span>
        //             </div>
        //             <div class="unit-price-item">
        //                 <span class="unit-price-label">관리비</span>
        //                 <span class="unit-price-value">${unit.commonFee.toLocaleString()}엔</span>
        //             </div>
        //             <div class="unit-price-item">
        //                 <span class="unit-price-label">시키킹</span>
        //                 <span class="unit-price-value">${unit.keyMoney === 0 ? '없음' : unit.keyMoney.toLocaleString() + '엔'}</span>
        //             </div>
        //             <div class="unit-price-item">
        //                 <span class="unit-price-label">레이킹</span>
        //                 <span class="unit-price-value">${unit.gratuity || 70000}엔</span>
        //             </div>
        //         </div>
        //     `;
            
        //     this.unitCarousel.appendChild(card);
        // });
        
        // this.updateUnitPagination();
    },
    
    /**
     * 호실별 사진 갤러리 열기
     * @param {Object} unit - 호실 정보
     */
    openUnitGallery(unit) {
        if (!unit || !unit.photos || unit.photos.length === 0) return;
        
        // 호실별 사진으로 갤러리 초기화
        PropertyGallery.init(unit.photos);
        PropertyGallery.openModal();
        
        // 모달 제목에 호실 번호 표시 (선택사항)
        // const modalTitle = document.querySelector('.gallery-modal-title');
        // if (modalTitle) {
        //     modalTitle.textContent = `${unit.number} 사진`;
        // }
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
                if (this.currentUnitPage > 0) {
                    this.currentUnitPage--;
                    this.renderUnitsByPage();
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.units.length / 5);
                if (this.currentUnitPage < totalPages - 1) {
                    this.currentUnitPage++;
                    this.renderUnitsByPage();
                }
            });
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                // 갱신하기 버튼 클릭 시 처리
                this.updateRefreshTime();
                // 데이터 재로드 (실제로는 API 호출)
                console.log('Refresh units');
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
        const updateTimeElement = document.getElementById('unitUpdateTime');
        if (updateTimeElement) {
            updateTimeElement.textContent = '방금 전 업데이트';
            // 1분 후부터 시간 표시 시작 (실제로는 서버 시간 기준)
            setTimeout(() => {
                updateTimeElement.textContent = '1분 전 업데이트';
            }, 60000);
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

