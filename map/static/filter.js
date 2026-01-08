function initializeFilters() {
    // Toggle all buttons
    document.querySelectorAll('.toggle-all-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.dataset.group;
            const checkboxes = document.querySelectorAll(`input[name="${group}"]`);
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            
            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
            });
            
            this.classList.toggle('active', !allChecked);
            updateFilterState();
        });
    });
    
    // Checkbox change events
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateFilterState();
            
            // Update toggle all button state
            const group = this.name;
            const toggleBtn = document.querySelector(`.toggle-all-btn[data-group="${group}"]`);
            if (toggleBtn) {
                const checkboxes = document.querySelectorAll(`input[name="${group}"]`);
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                toggleBtn.classList.toggle('active', allChecked);
            }
        });
    });
    
    // Reset filters button
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
    
    // Apply filters button
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    
    // Sort order change
    document.getElementById('sortOrder').addEventListener('change', function() {
        filterState.sortOrder = this.value;
        applyFilters();
    });
}

function updateFilterState() {
    // Room types
    filterState.roomTypes = Array.from(
        document.querySelectorAll('input[name="roomType"]:checked')
    ).map(cb => cb.value);
    
    // Building types
    filterState.buildingTypes = Array.from(
        document.querySelectorAll('input[name="buildingType"]:checked')
    ).map(cb => cb.value);
    
    // Popular options
    filterState.popularOptions = Array.from(
        document.querySelectorAll('input[name="popularOptions"]:checked')
    ).map(cb => cb.value);
    
    // Building options
    filterState.buildingOptions = Array.from(
        document.querySelectorAll('input[name="buildingOptions"]:checked')
    ).map(cb => cb.value);
    
    // Interior options
    filterState.interiorOptions = Array.from(
        document.querySelectorAll('input[name="interiorOptions"]:checked')
    ).map(cb => cb.value);
}

function resetFilters() {
    // Clear search
    document.getElementById('searchInput').value = '';
    filterState.searchQuery = '';
    
    // Uncheck all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    // Reset toggle all buttons
    document.querySelectorAll('.toggle-all-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Reset price selectors
    document.querySelectorAll('.custom-select').forEach(select => {
        const button = select.querySelector('.select-button');
        const text = button.querySelector('.select-text');
        text.textContent = '제한 없음';
    });
    
    filterState.minPrice = null;
    filterState.maxPrice = null;
    filterState.roomTypes = [];
    filterState.buildingTypes = [];
    filterState.popularOptions = [];
    filterState.buildingOptions = [];
    filterState.interiorOptions = [];
    
    // Apply filters
    applyFilters();
}

function applyFilters() {
    console.log('Applying filters:', filterState);
    
    // Filter properties
    filteredProperties = propertyData.filter(property => {
        // Search query
        if (filterState.searchQuery) {
            const query = filterState.searchQuery.toLowerCase();
            const matchesName = property.name.toLowerCase().includes(query);
            const matchesLocation = property.location.toLowerCase().includes(query);
            if (!matchesName && !matchesLocation) return false;
        }
        
        // Room types
        if (filterState.roomTypes.length > 0) {
            if (!filterState.roomTypes.includes(property.type)) return false;
        }
        
        // Building types
        if (filterState.buildingTypes.length > 0) {
            if (!filterState.buildingTypes.includes(property.buildingType)) return false;
        }
        
        // Options (any match)
        const allOptions = [
            ...filterState.popularOptions,
            ...filterState.buildingOptions,
            ...filterState.interiorOptions
        ];
        
        if (allOptions.length > 0) {
            const hasOption = allOptions.some(option => 
                property.options.includes(option)
            );
            if (!hasOption) return false;
        }
        
        // Price range
        if (filterState.minPrice && property.price < filterState.minPrice) return false;
        if (filterState.maxPrice && property.price > filterState.maxPrice) return false;
        
        return true;
    });
    
    // Sort properties
    sortProperties();
    
    // Update UI
    currentPage = 1;
    updatePropertyCount();
    renderPropertyCards();
    
    // Update map markers
    if (typeof google !== 'undefined' && map) {
        addMarkers(filteredProperties);
    }
    
    // Close mobile filter panel
    closeMobileFilter();
    
    console.log(`Filtered to ${filteredProperties.length} properties`);
}

function sortProperties() {
    switch (filterState.sortOrder) {
        case 'price-asc':
            filteredProperties.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProperties.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            filteredProperties.sort((a, b) => b.id - a.id);
            break;
        case 'popular':
            // Random sort for demo
            filteredProperties.sort(() => Math.random() - 0.5);
            break;
    }
}

// ========================================
// Price Selectors
// ========================================
function initializePriceSelectors() {
    const minPriceSelect = document.getElementById('minPriceSelect');
    const maxPriceSelect = document.getElementById('maxPriceSelect');
    
    initCustomSelect(minPriceSelect, value => {
        filterState.minPrice = value ? parseInt(value) : null;
    });
    
    initCustomSelect(maxPriceSelect, value => {
        filterState.maxPrice = value ? parseInt(value) : null;
    });
}

function initCustomSelect(selectElement, onChange) {
    const button = selectElement.querySelector('.select-button');
    const dropdown = selectElement.querySelector('.select-dropdown');
    const text = button.querySelector('.select-text');
    
    // Toggle dropdown
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Close other dropdowns
        document.querySelectorAll('.custom-select').forEach(select => {
            if (select !== selectElement) {
                select.querySelector('.select-button').classList.remove('active');
                select.querySelector('.select-dropdown').classList.remove('active');
            }
        });
        
        button.classList.toggle('active');
        dropdown.classList.toggle('active');
    });
    
    // Select option
    dropdown.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', function() {
            const value = this.dataset.value;
            const displayText = this.textContent;
            
            text.textContent = displayText;
            
            // Update selected state
            dropdown.querySelectorAll('li').forEach(item => {
                item.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // Close dropdown
            button.classList.remove('active');
            dropdown.classList.remove('active');
            
            // Callback
            if (onChange) onChange(value);
        });
    });
    
    // Close on outside click
    document.addEventListener('click', function(e) {
        if (!selectElement.contains(e.target)) {
            button.classList.remove('active');
            dropdown.classList.remove('active');
        }
    });
}