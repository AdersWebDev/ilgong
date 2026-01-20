// function initializeMobileMenu() {
//     const filterPanel = document.getElementById('filterPanel');
//     const propertyListPanel = document.querySelector('.property-list-panel');
//     const mobileFilterToggle = document.getElementById('mobileFilterToggle');
//     const filterCloseBtn = document.querySelector('.filter-close-btn');
//     const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    
//     // Mobile filter toggle
//     if (mobileFilterToggle) {
//         mobileFilterToggle.addEventListener('click', function() {
//             filterPanel.classList.add('active');
//         });
//     }
    
//     // Filter close button
//     if (filterCloseBtn) {
//         filterCloseBtn.addEventListener('click', function() {
//             filterPanel.classList.remove('active');
//         });
//     }
    
//     // Toggle property list on mobile
//     const propertyListHeader = document.querySelector('.property-list-header');
//     if (propertyListHeader && window.innerWidth <= 1023) {
//         propertyListHeader.addEventListener('click', function() {
//             propertyListPanel.classList.toggle('active');
//         });
//     }
// }

// function closeMobileFilter() {
//     if (window.innerWidth <= 1023) {
//         const filterPanel = document.getElementById('filterPanel');
//         filterPanel.classList.remove('active');
//     }
// }
