function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const autocompleteDropdown = document.getElementById('autocompleteDropdown');
    let selectedIndex = -1;
    
    // Input event
    searchInput.addEventListener('input', debounce(function(e) {
        const query = e.target.value.trim();
        filterState.searchQuery = query;
        
        if (query.length > 0) {
            const suggestions = AUTOCOMPLETE_DATA.filter(item => 
                item.toLowerCase().includes(query.toLowerCase())
            );
            
            showAutocompleteSuggestions(suggestions);
        } else {
            hideAutocompleteSuggestions();
        }
    }, 300));
    
    // Keyboard navigation
    searchInput.addEventListener('keydown', function(e) {
        const items = autocompleteDropdown.querySelectorAll('.autocomplete-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
            updateSelectedItem(items, selectedIndex);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, -1);
            updateSelectedItem(items, selectedIndex);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && items[selectedIndex]) {
                searchInput.value = items[selectedIndex].textContent;
                hideAutocompleteSuggestions();
                applyFilters();
            }
        } else if (e.key === 'Escape') {
            hideAutocompleteSuggestions();
        }
    });
    
    // Click outside to close
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
            hideAutocompleteSuggestions();
        }
    });
    
    function showAutocompleteSuggestions(suggestions) {
        if (suggestions.length === 0) {
            hideAutocompleteSuggestions();
            return;
        }
        
        autocompleteDropdown.innerHTML = suggestions.map(item => `
            <div class="autocomplete-item">${item}</div>
        `).join('');
        
        autocompleteDropdown.classList.add('active');
        
        // Add click events
        autocompleteDropdown.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('click', function() {
                searchInput.value = this.textContent;
                filterState.searchQuery = this.textContent;
                hideAutocompleteSuggestions();
                applyFilters();
            });
        });
    }
    
    function hideAutocompleteSuggestions() {
        autocompleteDropdown.classList.remove('active');
        selectedIndex = -1;
    }
    
    function updateSelectedItem(items, index) {
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === index);
        });
        
        if (index >= 0 && items[index]) {
            items[index].scrollIntoView({ block: 'nearest' });
        }
    }
}
