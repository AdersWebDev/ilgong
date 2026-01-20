/**
 * Gallery Module
 * 이미지 갤러리 및 모달 기능 (터치 스와이프 지원)
 */

const PropertyGallery = {
    images: [],
    buildingImages: [], // 건물 사진 저장 (호실 갤러리 후 복원용)
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
     * @param {boolean} isBuilding - 건물 사진인지 여부 (true면 buildingImages에 저장)
     */
    init(images = [], isBuilding = false) {
        this.images = images.length > 0 ? images : [];

        // 건물 사진이면 원본 저장(호실 갤러리 후 복원용)
        if (isBuilding) {
            this.buildingImages = [...this.images];

            // ✅ 11장 미만이면 호실 사진으로 채우기 (this.roomImages 가 있다고 가정)
            if (this.images.length < 11 && Array.isArray(this.roomImages) && this.roomImages.length > 0) {
                const seen = new Set();
                const merged = [];

                // 1) 건물 사진 먼저
                for (const url of this.images) {
                    if (!url) continue;
                    if (seen.has(url)) continue;
                    seen.add(url);
                    merged.push(url);
                    if (merged.length >= 11) break;
                }

                // 2) 부족하면 호실 사진으로 채우기
                if (merged.length < 11) {
                    for (const url of this.roomImages) {
                        if (!url) continue;
                        if (seen.has(url)) continue;
                        seen.add(url);
                        merged.push(url);
                        if (merged.length >= 11) break;
                    }
                }

                this.images = merged.slice(0, 11);
            }
        }

        this.mainImage = document.getElementById('mainGalleryImage');
        this.thumbnailContainer = document.getElementById('galleryThumbnails');
        this.modal = document.getElementById('galleryModal');
        this.modalMainImage = document.getElementById('modalMainImage');

        if (this.images.length === 0) {
            if (this.mainImage) {
                this.mainImage.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E';
            }
            return;
        }
        // 첫 번째 이미지를 메인 이미지로 설정
        if (this.mainImage && this.images.length > 0) {
            this.mainImage.src = this.images[0];
            this.mainImage.onerror = () => {
                this.mainImage.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3EImage Load Error%3C/text%3E%3C/svg%3E';
            };
            this.mainImage.addEventListener('click', (e) => {
                // 네비게이션 버튼이나 다른 버튼 클릭 시 무시
                const clickedElement = e.target;

                // 버튼이나 버튼 내부 요소 클릭 시 무시
                if (clickedElement.closest('.gallery-nav-btn') ||
                    clickedElement.closest('.gallery-view-more-btn') ||
                    clickedElement.closest('.gallery-pagination') ||
                    clickedElement.tagName === 'BUTTON') {
                    return;
                }

                // 이미지 자체를 클릭한 경우에만 모달 열기
                if (clickedElement === this.mainImage) {
                    this.currentIndex = 0;
                    this.openModal();
                }
            });
        }

        this.currentIndex = 0;
        this.renderThumbnails();
        this.bindEvents();
        this.updatePagination();
    },

    /**
     * 건물 사진으로 복원 (건물 갤러리 열 때 사용)
     */
    restoreBuildingImages() {
        if (this.buildingImages.length > 0) {
            this.images = [...this.buildingImages];
            this.currentIndex = 0;

            // 첫 번째 이미지를 메인 이미지로 설정
            if (this.mainImage && this.images.length > 0) {
                this.mainImage.src = this.images[0];
                this.mainImage.onerror = () => {
                    this.mainImage.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3EImage Load Error%3C/text%3E%3C/svg%3E';
                };
            }

            this.renderThumbnails();
            this.updatePagination();
        }
    },

    /**
     * 썸네일 렌더링 (첫 번째 이미지 제외하고 나머지만 표시)
     */
    renderThumbnails() {
        if (!this.thumbnailContainer) return;

        this.thumbnailContainer.innerHTML = '';

        // 첫 번째 이미지(인덱스 0)를 제외하고 나머지만 썸네일로 표시
        this.images.forEach((image, index) => {
            // 첫 번째 이미지는 썸네일에 표시하지 않음
            if (index === 0) return;

            const thumbnail = document.createElement('div');
            thumbnail.className = 'gallery-thumbnail';
            thumbnail.innerHTML = `<img src="${image}" alt="썸네일 ${index}">`;
            // 썸네일 클릭 시 모달로 해당 이미지 보기 (메인 이미지는 변경하지 않음)
            thumbnail.addEventListener('click', () => {
                this.currentIndex = index;
                this.openModal();
            });
            this.thumbnailContainer.appendChild(thumbnail);
        });
    },

    /**
     * 메인 이미지 업데이트 (네비게이션 버튼용 - 첫 번째 이미지로 고정)
     */
    updateMainImage() {
        if (!this.mainImage || this.images.length === 0) return;

        // 메인 이미지는 항상 첫 번째 이미지로 유지
        const imageUrl = this.images[0];
        this.mainImage.src = imageUrl;

        // 이미지 로드 에러 처리
        this.mainImage.onerror = () => {
            this.mainImage.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3EImage Load Error%3C/text%3E%3C/svg%3E';
        };

        this.updatePagination();
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
     * 썸네일 활성 상태 업데이트 (모달에서 사용)
     */
    updateThumbnailActive() {
        const thumbnails = this.thumbnailContainer?.querySelectorAll('.gallery-thumbnail');
        if (!thumbnails) return;

        // 썸네일 인덱스는 원본 배열에서 1부터 시작 (0번은 메인 이미지)
        thumbnails.forEach((thumb, thumbIndex) => {
            const actualIndex = thumbIndex + 1; // 썸네일 인덱스는 원본 배열에서 +1
            if (actualIndex === this.currentIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    },

    /**
     * 특정 이미지로 이동 (모달 내부 네비게이션용)
     * @param {number} index - 이미지 인덱스
     */
    goToImage(index) {
        if (index < 0 || index >= this.images.length) return;

        this.currentIndex = index;

        // 모달이 열려있으면 모달 이미지만 업데이트 (메인 이미지는 변경하지 않음)
        if (this.modal?.classList.contains('active')) {
            this.updateModalImage();
            this.updateThumbnailActive();
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

        const imageUrl = this.images[this.currentIndex];
        this.modalMainImage.src = imageUrl;

        // 이미지 로드 에러 처리
        this.modalMainImage.onerror = () => {
            this.modalMainImage.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22400%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3EImage Load Error%3C/text%3E%3C/svg%3E';
        };

        this.updatePagination();
    },

    /**
     * 모달 열기 (현재 images 사용)
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
     * 특정 이미지로 모달 열기 (호실 갤러리용 - 메인 갤러리는 변경하지 않음)
     * @param {Array} images - 표시할 이미지 배열
     */
    openModalWithImages(images) {
        if (!this.modal || !images || images.length === 0) return;

        // 임시로 images를 저장하고 모달에만 표시
        const originalImages = this.images;
        const originalIndex = this.currentIndex;

        this.images = images;
        this.currentIndex = 0;
        this.updateModalImage();
        this.updatePagination();

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // 모달 닫을 때 원래 images로 복원
        const restoreOnClose = () => {
            this.images = originalImages;
            this.currentIndex = originalIndex;
            this.updateMainImage();
            this.updateThumbnailActive();
        };

        // ESC 키로 닫기
        this.handleEscapeKey = (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                restoreOnClose();
            }
        };
        document.addEventListener('keydown', this.handleEscapeKey);

        // 모달 닫기 버튼 클릭 시 복원
        const modalCloseBtn = this.modal?.querySelector('.gallery-modal-close');
        if (modalCloseBtn) {
            const originalCloseHandler = modalCloseBtn.onclick;
            modalCloseBtn.onclick = () => {
                this.closeModal();
                restoreOnClose();
                if (originalCloseHandler) {
                    modalCloseBtn.onclick = originalCloseHandler;
                }
            };
        }

        // 모달 배경 클릭 시 복원
        if (this.modal) {
            const originalModalClick = this.modal.onclick;
            this.modal.onclick = (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                    restoreOnClose();
                    if (originalModalClick) {
                        this.modal.onclick = originalModalClick;
                    }
                }
            };
        }
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
        // 메인 이미지 네비게이션 버튼 (모바일 전용 - 모달 열기)
        const prevBtn = document.querySelector('.gallery-main .prev');
        const nextBtn = document.querySelector('.gallery-main .next');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 모달 열고 이전 이미지로 이동
                if (this.images.length > 0) {
                    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
                    this.openModal();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 모달 열고 다음 이미지로 이동
                if (this.images.length > 0) {
                    this.currentIndex = (this.currentIndex + 1) % this.images.length;
                    this.openModal();
                }
            });
        }

        // 모달 열기 버튼 (모바일) - 건물 갤러리
        const viewMoreBtn = document.getElementById('viewMorePhotosBtn');
        if (viewMoreBtn) {
            viewMoreBtn.addEventListener('click', () => {
                // 건물 사진으로 복원 후 모달 열기 (첫 번째 이미지부터 시작)
                this.restoreBuildingImages();
                this.currentIndex = 0;
                this.openModal();
            });
        }

        // 모달 열기 버튼 (데스크탑) - 건물 갤러리
        const viewMoreBtnDesktop = document.getElementById('viewMorePhotosBtnDesktop');
        if (viewMoreBtnDesktop) {
            viewMoreBtnDesktop.addEventListener('click', () => {
                // 건물 사진으로 복원 후 모달 열기 (첫 번째 이미지부터 시작)
                this.restoreBuildingImages();
                this.currentIndex = 0;
                this.openModal();
            });
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
                // 모달이 열려있으면 모달 내에서만 네비게이션
                if (this.modal?.classList.contains('active')) {
                    this.prevImage();
                    this.updateModalImage();
                } else {
                    this.prevImage();
                }
            });
        }

        if (modalNextBtn) {
            modalNextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 모달이 열려있으면 모달 내에서만 네비게이션
                if (this.modal?.classList.contains('active')) {
                    this.nextImage();
                    this.updateModalImage();
                } else {
                    this.nextImage();
                }
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

        // 터치 스와이프 이벤트 (메인 이미지 스와이프 시 모달 열기)
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

        if (isModal) {
            // 모달 내부에서는 이미지 네비게이션
            if (swipeDistance > 0) {
                // 오른쪽으로 스와이프 (다음 이미지)
                this.nextImage();
            } else {
                // 왼쪽으로 스와이프 (이전 이미지)
                this.prevImage();
            }
            this.updateModalImage();
        } else {
            // 메인 이미지 스와이프 시 모달 열고 해당 방향으로 이동
            if (this.images.length > 0) {
                if (swipeDistance > 0) {
                    // 오른쪽으로 스와이프 (다음 이미지)
                    this.currentIndex = (this.currentIndex + 1) % this.images.length;
                } else {
                    // 왼쪽으로 스와이프 (이전 이미지)
                    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
                }
                this.openModal();
            }
        }
    }
};

