/**
 * Gallery Module
 * 이미지 갤러리 및 모달 기능 (터치 스와이프 지원)
 */

const PropertyGallery = {
    images: [],
    currentIndex: 0,
    mainImage: null,
    thumbnailContainer: null,
    modal: null,
    modalMainImage: null,
    touchStartX: 0,
    touchEndX: 0,
    minSwipeDistance: 50,
    
    /**
     * 초기화
     * @param {Array} images - 이미지 배열
     */
    init(images = []) {
        this.images = images.length > 0 ? images : [];
        this.mainImage = document.getElementById('mainGalleryImage');
        this.thumbnailContainer = document.getElementById('galleryThumbnails');
        this.modal = document.getElementById('galleryModal');
        this.modalMainImage = document.getElementById('modalMainImage');
        
        if (this.images.length === 0) return;
        
        this.currentIndex = 0;
        this.renderThumbnails();
        this.bindEvents();
        this.updateMainImage();
    },
    
    /**
     * 썸네일 렌더링
     */
    renderThumbnails() {
        if (!this.thumbnailContainer) return;
        
        this.thumbnailContainer.innerHTML = '';
        
        this.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = `gallery-thumbnail ${index === this.currentIndex ? 'active' : ''}`;
            thumbnail.innerHTML = `<img src="${image}" alt="썸네일 ${index + 1}">`;
            thumbnail.addEventListener('click', () => this.goToImage(index));
            this.thumbnailContainer.appendChild(thumbnail);
        });
    },
    
    /**
     * 메인 이미지 업데이트
     */
    updateMainImage() {
        if (!this.mainImage || this.images.length === 0) return;
        
        this.mainImage.src = this.images[this.currentIndex];
        this.updatePagination();
        this.updateThumbnailActive();
    },
    
    /**
     * 페이지네이션 업데이트
     */
    updatePagination() {
        const pagination = document.getElementById('galleryPagination');
        if (pagination) {
            pagination.textContent = `${this.currentIndex + 1}/${this.images.length}`;
        }
        
        const modalPagination = document.getElementById('modalPagination');
        if (modalPagination) {
            modalPagination.textContent = `${this.currentIndex + 1}/${this.images.length}`;
        }
    },
    
    /**
     * 썸네일 활성 상태 업데이트
     */
    updateThumbnailActive() {
        const thumbnails = this.thumbnailContainer?.querySelectorAll('.gallery-thumbnail');
        if (!thumbnails) return;
        
        thumbnails.forEach((thumb, index) => {
            if (index === this.currentIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    },
    
    /**
     * 특정 이미지로 이동
     * @param {number} index - 이미지 인덱스
     */
    goToImage(index) {
        if (index < 0 || index >= this.images.length) return;
        
        this.currentIndex = index;
        this.updateMainImage();
        
        // 모달이 열려있으면 모달 이미지도 업데이트
        if (this.modal?.classList.contains('active')) {
            this.updateModalImage();
        }
    },
    
    /**
     * 다음 이미지
     */
    nextImage() {
        const nextIndex = (this.currentIndex + 1) % this.images.length;
        this.goToImage(nextIndex);
    },
    
    /**
     * 이전 이미지
     */
    prevImage() {
        const prevIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.goToImage(prevIndex);
    },
    
    /**
     * 모달 이미지 업데이트
     */
    updateModalImage() {
        if (!this.modalMainImage || this.images.length === 0) return;
        
        this.modalMainImage.src = this.images[this.currentIndex];
        this.updatePagination();
    },
    
    /**
     * 모달 열기
     */
    openModal() {
        if (!this.modal || this.images.length === 0) return;
        
        this.updateModalImage();
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // ESC 키로 닫기
        this.handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        };
        document.addEventListener('keydown', this.handleEscapeKey);
    },
    
    /**
     * 모달 닫기
     */
    closeModal() {
        if (!this.modal) return;
        
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        if (this.handleEscapeKey) {
            document.removeEventListener('keydown', this.handleEscapeKey);
            this.handleEscapeKey = null;
        }
    },
    
    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 메인 이미지 네비게이션 버튼
        const prevBtn = document.querySelector('.gallery-main .prev');
        const nextBtn = document.querySelector('.gallery-main .next');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prevImage();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextImage();
            });
        }
        
        // 모달 열기 버튼 (모바일)
        const viewMoreBtn = document.getElementById('viewMorePhotosBtn');
        if (viewMoreBtn) {
            viewMoreBtn.addEventListener('click', () => this.openModal());
        }
        
        // 모달 열기 버튼 (데스크탑)
        const viewMoreBtnDesktop = document.getElementById('viewMorePhotosBtnDesktop');
        if (viewMoreBtnDesktop) {
            viewMoreBtnDesktop.addEventListener('click', () => this.openModal());
        }
        
        // 모달 닫기 버튼
        const modalCloseBtn = this.modal?.querySelector('.gallery-modal-close');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.closeModal());
        }
        
        // 모달 네비게이션 버튼
        const modalPrevBtn = this.modal?.querySelector('.gallery-modal-nav.prev');
        const modalNextBtn = this.modal?.querySelector('.gallery-modal-nav.next');
        
        if (modalPrevBtn) {
            modalPrevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.prevImage();
                this.updateModalImage();
            });
        }
        
        if (modalNextBtn) {
            modalNextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextImage();
                this.updateModalImage();
            });
        }
        
        // 모달 배경 클릭 시 닫기 (데스크탑)
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal || e.target.closest('.gallery-modal-content')) {
                    // 모달 내용 영역 클릭은 무시 (이미지나 버튼 클릭이 아닌 경우만)
                    if (e.target === this.modal) {
                        this.closeModal();
                    }
                }
            });
        }
        
        // 터치 스와이프 이벤트
        if (this.mainImage) {
            this.bindSwipeEvents(this.mainImage, false);
        }
        
        if (this.modalMainImage) {
            this.bindSwipeEvents(this.modalMainImage, true);
        }
    },
    
    /**
     * 터치 스와이프 이벤트 바인딩
     * @param {HTMLElement} element - 대상 요소
     * @param {boolean} isModal - 모달 내부 여부
     */
    bindSwipeEvents(element, isModal = false) {
        element.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });
        
        element.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].clientX;
            this.handleSwipe(isModal);
        }, { passive: true });
    },
    
    /**
     * 스와이프 처리
     * @param {boolean} isModal - 모달 내부 여부
     */
    handleSwipe(isModal = false) {
        const swipeDistance = this.touchStartX - this.touchEndX;
        
        if (Math.abs(swipeDistance) < this.minSwipeDistance) {
            return;
        }
        
        if (swipeDistance > 0) {
            // 오른쪽으로 스와이프 (다음 이미지)
            this.nextImage();
        } else {
            // 왼쪽으로 스와이프 (이전 이미지)
            this.prevImage();
        }
        
        if (isModal) {
            this.updateModalImage();
        }
    }
};

