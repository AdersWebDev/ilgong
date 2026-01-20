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
     */
    constructor(propertiesPerPage = 10, onPropertyClick = null, dataLoader = null) {
        this.propertiesPerPage = propertiesPerPage;
        this.onPropertyClick = onPropertyClick;
        this.dataLoader = dataLoader;
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
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 16px;">검색 결과가 없습니다.</p>
                    <p style="font-size: 14px; margin-top: 8px;">필터 조건을 변경해보세요.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = propertiesToShow.map(property => `
            <div class="property-card" data-producer="${property.producer}" data-id="${property.id}">
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
                card.classList.add('history');
                const producer = card.dataset.producer;
                const id = card.dataset.id;
                
                // producer와 id가 모두 있어야 detail 페이지로 이동
                if (!id || !producer) {
                    console.warn('Producer or ID is missing:', { producer, id });
                    return;
                }

                // detail 페이지를 새 창으로 열기 (query parameter 형식 - 테스트용: /rent/detail?producer={producer}&id={id})
                window.open(`/map/detail/index.html?producer=${producer}&id=${id}`, '_blank');
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

