/**
 * 매물 상세 - 이미지 갤러리
 * - 메인 이미지: 좌우 버튼으로 이전/다음
 * - 썸네일 클릭: 해당 이미지를 메인에 표시
 * - 썸네일 리스트: < > 버튼으로 5개씩 스크롤
 */
(function () {
    var mainImage = document.querySelector('.detail-image-wrapper .detail-main-image');
    var counterEl = document.querySelector('.detail-image-wrapper .detail-img-counter');
    var thumbnailsContainer = document.querySelector('.detail-thumbnails');
    var mainPrevBtn = document.querySelector('.detail-image-wrapper .detail-img-nav.prev');
    var mainNextBtn = document.querySelector('.detail-image-wrapper .detail-img-nav.next');
    var listPrevBtn = document.querySelector('.detail-verified-nav .detail-img-nav.prev');
    var listNextBtn = document.querySelector('.detail-verified-nav .detail-img-nav.next');

    if (!mainImage || !thumbnailsContainer) return;

    var thumbnails = [].slice.call(thumbnailsContainer.querySelectorAll('img'));
    var total = thumbnails.length;
    var currentIndex = 0;

    var THUMBNAIL_WIDTH = 124;
    var THUMBNAIL_GAP = 6.56;
    var SCROLL_STEP = 5;

    function goToIndex(index) {
        if (index < 0 || index >= total) return;
        currentIndex = index;
        mainImage.src = thumbnails[currentIndex].src;
        counterEl.textContent = (currentIndex + 1) + ' / ' + total;

        thumbnails.forEach(function (img, i) {
            img.classList.toggle('active', i === currentIndex);
        });
    }

    function prevImage() {
        goToIndex(currentIndex - 1);
    }

    function nextImage() {
        goToIndex(currentIndex + 1);
    }

    function scrollThumbnails(direction) {
        if (!thumbnailsContainer) return;
        var scrollAmount = (THUMBNAIL_WIDTH + THUMBNAIL_GAP) * SCROLL_STEP;
        thumbnailsContainer.scrollBy({
            left: direction === 'prev' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }

    if (mainPrevBtn) mainPrevBtn.addEventListener('click', prevImage);
    if (mainNextBtn) mainNextBtn.addEventListener('click', nextImage);
    if (listPrevBtn) listPrevBtn.addEventListener('click', function () { scrollThumbnails('prev'); });
    if (listNextBtn) listNextBtn.addEventListener('click', function () { scrollThumbnails('next'); });

    thumbnails.forEach(function (img, index) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function () {
            goToIndex(index);
        });
    });

    goToIndex(0);
})();

/**
 * info-navigation: 스크롤 시 상단 고정, 현재 섹션에 해당하는 링크 active
 */
(function () {
    var nav = document.querySelector('.info-navigation');
    if (!nav) return;

    var links = nav.querySelectorAll('.info-navigation-item a');
    var sectionIds = ['more-info', 'initial-cost', 'special-conditions', 'surrounding-info'];
    var sectionEls = [];
    for (var i = 0; i < sectionIds.length; i++) {
        var el = document.getElementById(sectionIds[i]);
        if (el) sectionEls.push({ id: sectionIds[i], el: el });
    }
    if (sectionEls.length === 0) return;

    function setActive(id) {
        links.forEach(function (a) {
            var href = a.getAttribute('href') || '';
            var linkId = href.replace('#', '');
            a.classList.toggle('active', linkId === id);
        });
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var id = entry.target.id;
            if (id) setActive(id);
        });
    }, {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    });

    sectionEls.forEach(function (s) { observer.observe(s.el); });
    setActive(sectionIds[0]);
})();

/**
 * 구글 지도 (Maps JavaScript API)
 * Vercel /api/maps-key 에서 키를 가져와, 핀 하나 꼽힌 지도 표시
 */
(function () {
    var mapWrap = document.querySelector('.surrounding-map-wrap');
    if (!mapWrap) return;

    window.initSurroundingMap = function () {
        var mapEl = document.getElementById('surroundingMap');
        if (!mapEl || typeof google === 'undefined') return;

        var lat = parseFloat(mapWrap.getAttribute('data-lat'));
        var lng = parseFloat(mapWrap.getAttribute('data-lng'));
        if (isNaN(lat) || isNaN(lng)) return;

        var center = { lat: lat, lng: lng };
        var map = new google.maps.Map(mapEl, {
            center: center,
            zoom: 15,
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true
        });
        new google.maps.Marker({ position: center, map: map });
    };

    (async function () {
        try {
            var response = await fetch('/api/maps-key');
            if (!response.ok) throw new Error('API 키를 가져오는데 실패했습니다.');
            var data = await response.json();
            var apiKey = data.apiKey;
            if (!apiKey) throw new Error('API 키가 설정되지 않았습니다.');

            var script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=' + apiKey + '&callback=initSurroundingMap';
            script.async = true;
            script.defer = true;
            script.onerror = function () { console.error('Google Maps API 로드 실패'); };
            document.head.appendChild(script);
        } catch (err) {
            console.error('Google Maps API 키 로드 오류:', err);
        }
    })();
})();
