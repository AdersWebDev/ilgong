class SearchManager {
    constructor(autocompleteData = [], onSearch = null, onResultClick = null) {
        this.autocompleteData = autocompleteData;
        this.onSearch = onSearch;
        this.onResultClick = onResultClick;
        this.selectedIndex = -1;
        this.searchResults = [];
    }

    /**
     * 검색 기능 초기화
     */
    init() {
        const searchInput = document.getElementById('searchInput');
        const autocompleteDropdown = document.getElementById('autocompleteDropdown');
        
        if (!searchInput || !autocompleteDropdown) return;
        
        searchInput.addEventListener('input', this.debounce(async (e) => {
            const query = e.target.value.trim();
            
            if (query.length === 0) {
                this.hideAutocompleteSuggestions(autocompleteDropdown);
                this.searchResults = [];
                return;
            }
            
            try {
                const results = await this.searchFromBackend(query);
                this.searchResults = results;
                
                if (this.onSearch) {
                    this.onSearch(query);
                }
                
                if (results.length > 0) {
                    this.showSearchResults(results, autocompleteDropdown);
                } else {
                    this.showNoResults(autocompleteDropdown);
                }
            } catch (error) {
                console.error('검색 오류:', error);
                this.showSearchError(autocompleteDropdown);
            }
        }, 300));
        
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
                    const selectedItem = items[this.selectedIndex];
                    const resultIndex = parseInt(selectedItem.dataset.index);
                    
                    if (resultIndex >= 0 && this.searchResults[resultIndex]) {
                        const result = this.searchResults[resultIndex];
                        searchInput.value = result.name;
                        this.hideAutocompleteSuggestions(autocompleteDropdown);
                        if (this.onResultClick) {
                            this.onResultClick(result.lat, result.lng);
                        }
                    }
                }
            } else if (e.key === 'Escape') {
                this.hideAutocompleteSuggestions(autocompleteDropdown);
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
                this.hideAutocompleteSuggestions(autocompleteDropdown);
            }
        });
    }

    async searchFromBackend(query) {
        const url = `${Constants.SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`검색 요청 실패: ${response.status}`);
        }
        
        const results = await response.json();
        return results;
    }

    showSearchResults(results, dropdown) {
        if (results.length === 0) {
            this.hideAutocompleteSuggestions(dropdown);
            return;
        }
        
        dropdown.innerHTML = results.map((result, index) => `
            <div class="autocomplete-item" data-index="${index}">
                ${result.name}
            </div>
        `).join('');
        
        dropdown.classList.add('active');
        
        // 모바일에서 autocomplete 위치 조정
        this.adjustAutocompletePosition(dropdown);
        
        dropdown.querySelectorAll('.autocomplete-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                const result = results[index];
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = result.name;
                }
                this.hideAutocompleteSuggestions(dropdown);
                if (this.onResultClick) {
                    this.onResultClick(result.lat, result.lng);
                }
            });
        });
    }
    
    adjustAutocompletePosition(dropdown) {
        const isMobile = window.innerWidth <= 838;
        if (!isMobile) return;
        
        const searchInput = document.getElementById('searchInput');
        const filterSearch = searchInput?.closest('.filter-search');
        
        if (searchInput && filterSearch) {
            const inputRect = searchInput.getBoundingClientRect();
            const filterBarRect = document.querySelector('.filter-bar')?.getBoundingClientRect();
            const padding = 16; // spacing-lg
            
            dropdown.style.position = 'fixed';
            dropdown.style.top = `${inputRect.bottom + 4}px`;
            dropdown.style.left = `${Math.max(padding, inputRect.left)}px`;
            dropdown.style.width = `${Math.min(inputRect.width, window.innerWidth - padding * 2)}px`;
            dropdown.style.maxWidth = `${Math.min(inputRect.width, window.innerWidth - padding * 2)}px`;
        }
    }

    showNoResults(dropdown) {
        dropdown.innerHTML = `
            <div class="autocomplete-item autocomplete-no-results">
                검색 결과가 없습니다.
            </div>
        `;
        dropdown.classList.add('active');
        // 모바일에서 autocomplete 위치 조정
        this.adjustAutocompletePosition(dropdown);
    }

    showSearchError(dropdown) {
        dropdown.innerHTML = `
            <div class="autocomplete-item autocomplete-error">
                검색 중 오류가 발생했습니다.
            </div>
        `;
        dropdown.classList.add('active');
        // 모바일에서 autocomplete 위치 조정
        this.adjustAutocompletePosition(dropdown);
    }

    hideAutocompleteSuggestions(dropdown) {
        dropdown.classList.remove('active');
        this.selectedIndex = -1;
    }

    updateSelectedItem(items, index) {
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === index);
        });
        
        if (index >= 0 && items[index]) {
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }

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

