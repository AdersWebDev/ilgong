function initializePropertyList() {
    const container = document.getElementById('propertyList');
    
    // Infinite scroll
    container.addEventListener('scroll', debounce(function() {
        const scrollPosition = container.scrollTop + container.clientHeight;
        const scrollHeight = container.scrollHeight;
        
        if (scrollPosition >= scrollHeight - 100) {
            loadMoreProperties();
        }
    }, 200));
}

function renderPropertyCards() {
    const container = document.getElementById('propertyList');
    const startIndex = 0;
    const endIndex = currentPage * PROPERTIES_PER_PAGE;
    const propertiesToShow = filteredProperties.slice(startIndex, endIndex);
    
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
        <div class="property-card" data-id="${property.id}">
            <div class="property-card-image">
                <img src="${property.image}" alt="${property.name}" loading="lazy">
                <div class="property-card-carousel">
                    <span class="carousel-dot active"></span>
                    <span class="carousel-dot"></span>
                    <span class="carousel-dot"></span>
                </div>
            </div>
            <div class="property-card-content">
                <div class="property-price">¥ ${property.price.toLocaleString()} +</div>
                <div class="property-info">
                    <span>${property.type}</span>
                    <span class="property-info-separator"></span>
                    <span>${property.rooms}</span>
                    <span class="property-info-separator"></span>
                    <span>${property.location}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    // Add click events
    container.querySelectorAll('.property-card').forEach(card => {
        card.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            const property = propertyData.find(p => p.id === id);
            if (property) {
                // Show on map
                if (typeof google !== 'undefined' && map) {
                    map.setCenter({ lat: property.lat, lng: property.lng });
                    map.setZoom(15);
                    showPropertyInfo(property);
                }
                
                // For mobile, close property list
                if (window.innerWidth <= 1023) {
                    document.querySelector('.property-list-panel').classList.remove('active');
                }
            }
        });
    });
}

function loadMoreProperties() {
    const maxPages = Math.ceil(filteredProperties.length / PROPERTIES_PER_PAGE);
    
    if (currentPage < maxPages) {
        currentPage++;
        renderPropertyCards();
        console.log(`Loaded page ${currentPage} of ${maxPages}`);
    }
}

function updatePropertyCount() {
    const countElement = document.getElementById('propertyCount');
    countElement.textContent = `${filteredProperties.length.toLocaleString()} 건`;
}