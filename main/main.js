// ========================================
// Language Selector Dropdown
// ========================================
function initLangSelector() {
    const selector = document.querySelector('[data-lang-selector]');
    if (!selector) return;

    const btn = selector.querySelector('.lang-btn');
    const dropdown = selector.querySelector('.lang-dropdown');
    if (!btn || !dropdown) return;

    function open() {
        selector.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
    }

    function close() {
        selector.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    }

    function toggle(e) {
        e.preventDefault();
        e.stopPropagation();
        selector.classList.toggle('open');
        const expanded = selector.classList.contains('open');
        btn.setAttribute('aria-expanded', expanded);
    }

    btn.addEventListener('click', toggle);

    // 바깥 클릭 시 닫기
    document.addEventListener('click', function (e) {
        if (!selector.contains(e.target)) close();
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') close();
    });
}

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

    // 메뉴바 밖 클릭·드래그 시 닫기 (모바일일 때만)
    const handleOutsideMobileNav = (e) => {
        if (window.innerWidth > 1023) return;
        if (!mainNav.classList.contains('active')) return;
        if (mainNav.contains(e.target) || hamburger.contains(e.target)) return;
        closeMobileNav();
    };
    document.addEventListener('click', handleOutsideMobileNav);
    document.addEventListener('pointerdown', handleOutsideMobileNav);

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
    document.addEventListener('DOMContentLoaded', function () {
        initMobileNav();
        initLangSelector();
    });
} else {
    initMobileNav();
    initLangSelector();
}

// 라우터가 페이지를 로드할 때도 초기화
window.addEventListener('pageLoaded', () => {
    setTimeout(() => {
        initMobileNav();
        initLangSelector();
    }, 100);
});