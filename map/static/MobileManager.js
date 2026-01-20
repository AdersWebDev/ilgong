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
        const propertyPanelFlaoting = document.getElementById('property-panel-flaoting');

        // Mobile filter toggle
        if (mobileFilterToggle) {
            mobileFilterToggle.addEventListener('click', () => {
                if (filterPanel) {
                    filterPanel.classList.add('active');
                }
            });
        }
        if (propertyPanelFlaoting) {
            propertyPanelFlaoting.addEventListener('click', () => {
                if (propertyListPanel.classList.contains('active')) {
                    propertyListPanel.classList.remove('active')
                    propertyPanelFlaoting.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="15" viewBox="0 0 18 15" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd"
                        d="M1.28571 2.5C1.99579 2.5 2.57143 1.94035 2.57143 1.25C2.57143 0.55965 1.99579 0 1.28571 0C0.57564 0 0 0.55965 0 1.25C0 1.94035 0.57564 2.5 1.28571 2.5ZM6.10714 0.625C5.57459 0.625 5.14286 1.04474 5.14286 1.5625C5.14286 2.08026 5.57459 2.5 6.10714 2.5H17.0357C17.5683 2.5 18 2.08026 18 1.5625C18 1.04474 17.5683 0.625 17.0357 0.625H6.10714ZM6.10714 6.875C5.57459 6.875 5.14286 7.29474 5.14286 7.8125C5.14286 8.33026 5.57459 8.75 6.10714 8.75H17.0357C17.5683 8.75 18 8.33026 18 7.8125C18 7.29474 17.5683 6.875 17.0357 6.875H6.10714ZM6.10714 13.125C5.57459 13.125 5.14286 13.5448 5.14286 14.0625C5.14286 14.5802 5.57459 15 6.10714 15H17.0357C17.5683 15 18 14.5802 18 14.0625C18 13.5448 17.5683 13.125 17.0357 13.125H6.10714ZM2.57143 7.5C2.57143 8.19035 1.99579 8.75 1.28571 8.75C0.57564 8.75 0 8.19035 0 7.5C0 6.80965 0.57564 6.25 1.28571 6.25C1.99579 6.25 2.57143 6.80965 2.57143 7.5ZM1.28571 15C1.99579 15 2.57143 14.4404 2.57143 13.75C2.57143 13.0596 1.99579 12.5 1.28571 12.5C0.57564 12.5 0 13.0596 0 13.75C0 14.4404 0.57564 15 1.28571 15Z"
                        fill="white" />
                </svg>
                맨션 보기
                    `
                } else {
                    propertyListPanel.classList.add('active')
                    propertyPanelFlaoting.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="17" viewBox="0 0 15 17" fill="none">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M11.58 3.34358C12.1158 3.86728 12.541 4.48904 12.831 5.17337C13.1211 5.85768 13.2703 6.59115 13.2703 7.33188C13.2703 8.0726 13.1211 8.80606 12.831 9.49039C12.541 10.1747 12.1158 10.7965 11.58 11.3202L7.5 15.3062L3.42 11.319C2.88421 10.7953 2.45919 10.1735 2.16923 9.4892C1.87926 8.80489 1.73001 8.07144 1.73001 7.33075C1.73001 6.59005 1.87926 5.85661 2.16923 5.1723C2.45919 4.48798 2.88421 3.86619 3.42 3.34245C3.9558 2.81869 4.59188 2.40323 5.29192 2.11978C5.99197 1.83632 6.74228 1.69044 7.5 1.69044C8.25773 1.69044 9.00803 1.83632 9.70808 2.11978C10.4081 2.40323 11.0442 2.81869 11.58 3.34245V3.34358ZM12.8031 12.5158C13.852 11.4905 14.5664 10.1841 14.8559 8.76196C15.1453 7.33978 14.9968 5.86563 14.4292 4.52596C13.8615 3.18628 12.9002 2.04123 11.6669 1.23561C10.4334 0.429997 8.98338 0 7.5 0C6.01661 0 4.56654 0.429997 3.33316 1.23561C2.09978 2.04123 1.13849 3.18628 0.570842 4.52596C0.00320754 5.86563 -0.145281 7.33978 0.144161 8.76196C0.433604 10.1841 1.14797 11.4905 2.19692 12.5158L6.27577 16.5041C6.4365 16.6613 6.62734 16.786 6.83741 16.8711C7.04747 16.9562 7.27262 17 7.5 17C7.72739 17 7.95254 16.9562 8.16259 16.8711C8.37265 16.786 8.5635 16.6613 8.72423 16.5041L12.8031 12.5158ZM7.5 9.5877C8.11204 9.5877 8.69901 9.35003 9.13179 8.92698C9.56456 8.50394 9.80769 7.93016 9.80769 7.33188C9.80769 6.73359 9.56456 6.15982 9.13179 5.73676C8.69901 5.31371 8.11204 5.07605 7.5 5.07605C6.88796 5.07605 6.30099 5.31371 5.86822 5.73676C5.43544 6.15982 5.19231 6.73359 5.19231 7.33188C5.19231 7.93016 5.43544 8.50394 5.86822 8.92698C6.30099 9.35003 6.88796 9.5877 7.5 9.5877Z" fill="white"/>
                    </svg>
                    지도로 보기
                    `
                }
            })
        }

        // Filter close button
        if (filterCloseBtn) {
            filterCloseBtn.addEventListener('click', () => {
                if (filterPanel) {
                    filterPanel.classList.remove('active');
                }
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

