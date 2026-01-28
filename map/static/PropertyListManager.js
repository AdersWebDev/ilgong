/**
 * 프로퍼티 리스트 관리 클래스
 * 
 * 프로퍼티 카드 렌더링 및 무한 스크롤 관리
 */
class PropertyListManager {
    /**
     * @param {number} propertiesPerPage - 페이지당 프로퍼티 수
     * @param {Function} onPropertyClick - 프로퍼티 클릭 시 호출될 콜백 함수
     * @param {DataLoader} dataLoader - 데이터 로더 인스턴스 (선택사항)
     * @param {Function} onResultClick - 카드 클릭 시 호출될 콜백 함수 (location)
     */
    constructor(propertiesPerPage = 10, onPropertyClick = null, dataLoader = null, onResultClick = null) {
        this.propertiesPerPage = propertiesPerPage;
        this.onPropertyClick = onPropertyClick;
        this.dataLoader = dataLoader;
        this.onResultClick = onResultClick;
        this.currentPage = 1;
        this.filteredProperties = [];
    }

    /**
     * 프로퍼티 리스트 초기화
     */
    init() {
        const container = document.getElementById('propertyList');
        if (!container) return;
        
        // Infinite scroll
        container.addEventListener('scroll', this.debounce(() => {
            const scrollPosition = container.scrollTop + container.clientHeight;
            const scrollHeight = container.scrollHeight;
            
            if (scrollPosition >= scrollHeight - 100) {
                this.loadMoreProperties();
            }
        }, 200));
    }

    /**
     * 필터링된 프로퍼티 설정
     * @param {Array} properties - 프로퍼티 배열
     */
    setFilteredProperties(properties) {
        this.filteredProperties = properties;
        this.currentPage = 1;
        this.renderPropertyCards();
        this.updatePropertyCount();
    }

    /**
     * 프로퍼티 카드 렌더링
     */
    renderPropertyCards() {
        const container = document.getElementById('propertyList');
        if (!container) return;
        
        const startIndex = 0;
        const endIndex = this.currentPage * this.propertiesPerPage;
        const propertiesToShow = this.filteredProperties.slice(startIndex, endIndex);
        
        if (propertiesToShow.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666; grid-column: span 2;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 16px;">검색 결과가 없습니다.</p>
                    <p style="font-size: 14px; margin-top: 8px;">필터 조건을 변경해보세요.</p>
                </div>
            `;
            return;
        }
        container.innerHTML = propertiesToShow.map(property => `
            <div class="property-card" 
                 data-lat="${property.lat}" 
                 data-lng="${property.lng}"
                 data-producer="${property.producer || ''}"
                 data-id="${property.id || ''}">
                ${property.eventId ? `
                    <div class="property-card-event">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="22" viewBox="0 0 24 22" fill="none">
                            <path d="M16 3C17.1046 3 18.1458 3.20982 19.1212 3.63068C20.092 4.04959 20.9393 4.61923 21.66 5.33996C22.3808 6.0607 22.9504 6.90799 23.3693 7.87879C23.7902 8.85421 24 9.89542 24 11C24 11.3581 23.9802 11.7102 23.9403 12.0559C23.9001 12.4046 23.8326 12.7468 23.7386 13.0824L23.6184 13.5142L23.3229 13.1761C23.159 12.9889 22.9683 12.831 22.7509 12.7017C22.5376 12.5749 22.3034 12.488 22.0464 12.4413L21.804 12.3968L21.8523 12.1553C21.8894 11.9695 21.917 11.7796 21.9356 11.5871C21.9542 11.3948 21.964 11.1991 21.964 11C21.964 9.33041 21.3871 7.92495 20.2311 6.76894C19.0751 5.61293 17.6696 5.03598 16 5.03598C14.3304 5.03598 12.9249 5.61293 11.7689 6.76894C10.6129 7.92495 10.036 9.33041 10.036 11C10.036 12.6696 10.6129 14.0751 11.7689 15.2311C12.9249 16.3871 14.3304 16.964 16 16.964C16.6352 16.964 17.2402 16.8705 17.8163 16.6847C18.3955 16.4978 18.9269 16.2366 19.411 15.9015L19.6089 15.7642L19.7472 15.9612C19.8868 16.1589 20.0596 16.3343 20.2661 16.4877C20.4732 16.6416 20.6942 16.7597 20.929 16.8419L21.3409 16.9858L21 17.2595C20.3192 17.8067 19.5554 18.2337 18.7102 18.5398C17.8611 18.8473 16.9571 19 16 19C14.8954 19 13.8542 18.7902 12.8788 18.3693C11.908 17.9504 11.0607 17.3808 10.34 16.66C9.61923 15.9393 9.04959 15.092 8.63068 14.1212C8.20982 13.1458 8 12.1046 8 11C8 9.89542 8.20982 8.85421 8.63068 7.87879C9.04959 6.90799 9.61923 6.0607 10.34 5.33996C11.0607 4.61923 11.908 4.04959 12.8788 3.63068C13.8542 3.20982 14.8954 3 16 3ZM21.6241 13.4725C21.958 13.4725 22.2498 13.5908 22.4839 13.8248C22.718 14.0589 22.8361 14.3507 22.8362 14.6847C22.8362 15.0187 22.7181 15.3104 22.4839 15.5445C22.2498 15.7787 21.9581 15.8968 21.6241 15.8968C21.2901 15.8967 20.9983 15.7786 20.7642 15.5445C20.5302 15.3104 20.4119 15.0186 20.4119 14.6847C20.412 14.3507 20.5301 14.0589 20.7642 13.8248C20.9983 13.5907 21.2901 13.4726 21.6241 13.4725ZM17.018 10.589L19.9886 13.5597L18.5597 14.9886L14.982 11.411V6.87879H17.018V10.589Z" fill="white"/>
                            <path d="M5.99512 16.9541L1.6377 17.001L1.59766 14.8271L5.95508 14.7812L5.99512 16.9541ZM5.98242 12.165L0.0351562 12.2373L0 10.0635L5.94727 9.99219L5.98242 12.165ZM6.00293 7.17285L2.64648 7.20898L2.60645 5.03516L5.96289 5L6.00293 7.17285Z" fill="white"/>
                        </svg>
                        <span class="property-card-event-text">특가 진행중</span>
                    </div>
                ` : ''}
                <div class="property-card-image">
                    <img src="${property.thumbnail || ''}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22260%22 height=%22160%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22260%22 height=%22160%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E';">
                    <div class="property-card-carousel">
                        <span class="carousel-dot active"></span>
                        <span class="carousel-dot active"></span>
                        <span class="carousel-dot active"></span>
                    </div>
                </div>
                <div class="property-card-content">
                    <div class="property-price">¥ ${property.minRentalFee.toLocaleString()} +</div>
                    <div class="property-info"> ${property.address || ''}</div>
                </div>
            </div>
        `).join('');
        
        // Add click events
        container.querySelectorAll('.property-card').forEach(card => {
            card.addEventListener('click', () => {
                const lat = Number(card.dataset.lat);
                const lng = Number(card.dataset.lng);
                const producer = card.dataset.producer;
                const id = card.dataset.id;
                
                if (this.onResultClick) {
                    this.onResultClick({
                        lat,
                        lng,
                        producer: producer || undefined,
                        id: id || undefined
                    });
                }
            });
        });
    }

    /**
     * 더 많은 프로퍼티 로드
     */
    loadMoreProperties() {
        const maxPages = Math.ceil(this.filteredProperties.length / this.propertiesPerPage);
        
        if (this.currentPage < maxPages) {
            this.currentPage++;
            this.renderPropertyCards();
            console.log(`Loaded page ${this.currentPage} of ${maxPages}`);
        }
    }

    /**
     * 프로퍼티 개수 업데이트
     */
    updatePropertyCount() {
        const countElement = document.getElementById('propertyCount');
        if (countElement) {
            countElement.textContent = `${this.filteredProperties.length.toLocaleString()} 건`;
        }
    }

    /**
     * 디바운스 함수
     * @param {Function} func - 실행할 함수
     * @param {number} wait - 대기 시간 (ms)
     * @returns {Function} 디바운스된 함수
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

