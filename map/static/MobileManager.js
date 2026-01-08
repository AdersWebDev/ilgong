/**
 * 모바일 UI 관리 클래스
 * 
 * 모바일 환경에서의 UI 제어 담당
 */
class MobileManager {
    /**
     * 모바일 메뉴 초기화
     */
    init() {
        const filterPanel = document.getElementById('filterPanel');
        const propertyListPanel = document.querySelector('.property-list-panel');
        const mobileFilterToggle = document.getElementById('mobileFilterToggle');
        const filterCloseBtn = document.querySelector('.filter-close-btn');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        
        // Mobile filter toggle
        if (mobileFilterToggle) {
            mobileFilterToggle.addEventListener('click', () => {
                if (filterPanel) {
                    filterPanel.classList.add('active');
                }
            });
        }
        
        // Filter close button
        if (filterCloseBtn) {
            filterCloseBtn.addEventListener('click', () => {
                if (filterPanel) {
                    filterPanel.classList.remove('active');
                }
            });
        }
        
        // Mobile menu toggle (header)
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => {
                alert('모바일 메뉴 (준비 중)');
            });
        }
        
        // Toggle property list on mobile
        const propertyListHeader = document.querySelector('.property-list-header');
        if (propertyListHeader && window.innerWidth <= 1023) {
            propertyListHeader.addEventListener('click', () => {
                if (propertyListPanel) {
                    propertyListPanel.classList.toggle('active');
                }
            });
        }

        // Window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Re-render if layout changes significantly
                if (window.innerWidth > 1023) {
                    if (filterPanel) {
                        filterPanel.classList.remove('active');
                    }
                    if (propertyListPanel) {
                        propertyListPanel.classList.remove('active');
                    }
                }
            }, 250);
        });
    }

    /**
     * 모바일 필터 패널 닫기
     */
    closeMobileFilter() {
        if (window.innerWidth <= 1023) {
            const filterPanel = document.getElementById('filterPanel');
            if (filterPanel) {
                filterPanel.classList.remove('active');
            }
        }
    }
}

