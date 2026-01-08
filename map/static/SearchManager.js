/**
 * 검색 관리 클래스
 * 
 * 검색 입력 및 자동완성 기능 담당
 */
class SearchManager {
    /**
     * @param {Array} autocompleteData - 자동완성 데이터 배열
     * @param {Function} onSearch - 검색 시 호출될 콜백 함수
     */
    constructor(autocompleteData = [], onSearch = null) {
        this.autocompleteData = autocompleteData;
        this.onSearch = onSearch;
        this.selectedIndex = -1;
    }

    /**
     * 검색 기능 초기화
     */
    init() {
        const searchInput = document.getElementById('searchInput');
        const autocompleteDropdown = document.getElementById('autocompleteDropdown');
        
        if (!searchInput || !autocompleteDropdown) return;
        
        // Input event
        searchInput.addEventListener('input', this.debounce((e) => {
            const query = e.target.value.trim();
            
            if (this.onSearch) {
                this.onSearch(query);
            }
            
            if (query.length > 0) {
                const suggestions = this.autocompleteData.filter(item => 
                    item.toLowerCase().includes(query.toLowerCase())
                );
                
                this.showAutocompleteSuggestions(suggestions, autocompleteDropdown);
            } else {
                this.hideAutocompleteSuggestions(autocompleteDropdown);
            }
        }, 300));
        
        // Keyboard navigation
        searchInput.addEventListener('keydown', (e) => {
            const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelectedItem(items, this.selectedIndex);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelectedItem(items, this.selectedIndex);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    searchInput.value = items[this.selectedIndex].textContent;
                    this.hideAutocompleteSuggestions(autocompleteDropdown);
                    if (this.onSearch) {
                        this.onSearch(searchInput.value);
                    }
                }
            } else if (e.key === 'Escape') {
                this.hideAutocompleteSuggestions(autocompleteDropdown);
            }
        });
        
        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
                this.hideAutocompleteSuggestions(autocompleteDropdown);
            }
        });
    }

    /**
     * 자동완성 제안 표시
     * @param {Array} suggestions - 제안 목록
     * @param {HTMLElement} dropdown - 드롭다운 요소
     */
    showAutocompleteSuggestions(suggestions, dropdown) {
        if (suggestions.length === 0) {
            this.hideAutocompleteSuggestions(dropdown);
            return;
        }
        
        dropdown.innerHTML = suggestions.map(item => `
            <div class="autocomplete-item">${item}</div>
        `).join('');
        
        dropdown.classList.add('active');
        
        // Add click events
        dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', () => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = item.textContent;
                }
                this.hideAutocompleteSuggestions(dropdown);
                if (this.onSearch) {
                    this.onSearch(item.textContent);
                }
            });
        });
    }

    /**
     * 자동완성 제안 숨기기
     * @param {HTMLElement} dropdown - 드롭다운 요소
     */
    hideAutocompleteSuggestions(dropdown) {
        dropdown.classList.remove('active');
        this.selectedIndex = -1;
    }

    /**
     * 선택된 항목 업데이트
     * @param {NodeList} items - 항목 목록
     * @param {number} index - 선택된 인덱스
     */
    updateSelectedItem(items, index) {
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === index);
        });
        
        if (index >= 0 && items[index]) {
            items[index].scrollIntoView({ block: 'nearest' });
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

