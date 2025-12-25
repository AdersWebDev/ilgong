
// ========================================
// Mobile Navigation Toggle
// ========================================
function initMobileNav() {
    const hamburger = document.getElementById('hamburger');
    const mainNav = document.getElementById('mainNav');
    
    if (!hamburger || !mainNav) {
        return;
    }

    // 이미 초기화되었는지 확인
    if (hamburger.dataset.initialized === 'true') {
        return;
    }
    hamburger.dataset.initialized = 'true';

    function toggleMobileNav(e) {
        e.preventDefault();
        e.stopPropagation();
        
        hamburger.classList.toggle('active');
        mainNav.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (mainNav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    // Close mobile menu when clicking nav links
    function closeMobileNav() {
        if (window.innerWidth <= 1023) {
            hamburger.classList.remove('active');
            mainNav.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Event Listeners
    hamburger.addEventListener('click', toggleMobileNav);

    // Close menu when clicking nav items
    const navItems = document.querySelectorAll('.nav-menu a');
    navItems.forEach(item => {
        item.addEventListener('click', closeMobileNav);
    });

    // Close menu when window is resized to desktop
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (window.innerWidth > 1023) {
                hamburger.classList.remove('active');
                mainNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        }, 100);
    });
}

// DOM이 로드된 후 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
} else {
    initMobileNav();
}

// 라우터가 페이지를 로드할 때도 초기화
window.addEventListener('pageLoaded', () => {
    setTimeout(initMobileNav, 100);
});