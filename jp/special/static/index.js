(function () {
    'use strict';

    var INTRO_DURATION = 3000; // 3초
    var totalSlides = 3;

    var section = document.getElementById('directIntro');
    var items = section && section.querySelectorAll('.intro-item');
    var forwardBar = document.getElementById('introForwardBar');
    var prevBtn = section && section.querySelector('.intro-icon.prev');
    var nextBtn = section && section.querySelector('.intro-icon.next');

    if (!section || !items || !items.length || !forwardBar) return;

    var currentIndex = 0;
    var timer = null;

    function setSlide(index) {
        currentIndex = (index + totalSlides) % totalSlides;
        section.setAttribute('class', section.getAttribute('class').replace(/\bintro-slide-\d\b/, 'intro-slide-' + currentIndex));
        for (var i = 0; i < items.length; i++) {
            items[i].classList.toggle('active', i === currentIndex);
        }
    }

    function restartBarAnimation() {
        forwardBar.classList.remove('intro-fill');
        forwardBar.offsetHeight; // reflow
        forwardBar.classList.add('intro-fill');
    }

    function goNext() {
        setSlide(currentIndex + 1);
        restartBarAnimation();
        resetTimer();
    }

    function goPrev() {
        setSlide(currentIndex - 1);
        restartBarAnimation();
        resetTimer();
    }

    function resetTimer() {
        if (timer) clearTimeout(timer);
        timer = setTimeout(goNext, INTRO_DURATION);
    }

    function init() {
        setSlide(0);
        forwardBar.classList.add('intro-fill');
        resetTimer();
    }

    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);

    init();
})();

(function () {
    var el = document.getElementById('property-recent-date');
    if (el) {
        var d = new Date();
        el.textContent = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
    }
})();

/**
 * property-card-list: 데스크탑에서 마우스 드래그로 좌우 스크롤
 */
(function () {
    var list = document.querySelector('.property-card-list');
    if (!list) return;

    var isDown = false;
    var startX;
    var scrollLeft;

    list.addEventListener('mousedown', function (e) {
        isDown = true;
        list.classList.add('grabbing');
        startX = e.pageX - list.offsetLeft;
        scrollLeft = list.scrollLeft;
    });

    list.addEventListener('mouseleave', function () {
        isDown = false;
        list.classList.remove('grabbing');
    });

    list.addEventListener('mouseup', function () {
        isDown = false;
        list.classList.remove('grabbing');
    });

    list.addEventListener('mousemove', function (e) {
        if (!isDown) return;
        e.preventDefault();
        var x = e.pageX - list.offsetLeft;
        var walk = (x - startX) * 1.2; // 스크롤 속도
        list.scrollLeft = scrollLeft - walk;
    });
})();
