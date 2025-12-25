/**
 * 메인 애플리케이션 진입점
 * 라우터와 난수화 시스템 초기화 및 통합 관리
 * 
 * @author 일공 개발팀
 * @version 1.0
 */
(function() {
    'use strict';

    let routerInitialized = false;
    let obfuscatorInitialized = false;
    let mutationObserver = null;

    // DOM 로드 후 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        // 1. 난수화 시스템 초기화 (라우터보다 먼저)
        initObfuscator();

        // 2. 라우터 초기화
        initRouter();

        // 3. 동적 요소 모니터링
        initMutationObserver();

        // 4. 페이지 로드 이벤트 리스너
        window.addEventListener('pageLoaded', handlePageLoaded);
    }

    /**
     * 난수화 시스템 초기화
     */
    function initObfuscator() {
        if (typeof ClassObfuscator !== 'undefined' && !obfuscatorInitialized) {
            window.classObfuscator = new ClassObfuscator();
            obfuscatorInitialized = true;
        }
    }

    /**
     * 라우터 초기화
     */
    function initRouter() {
        if (typeof Router !== 'undefined' && !routerInitialized) {
            // Router는 자동으로 초기화되지만, 명시적으로 확인
            if (!window.router) {
                window.router = new Router();
            }
            routerInitialized = true;
        }
    }

    /**
     * MutationObserver로 동적으로 추가되는 요소도 난수화
     */
    function initMutationObserver() {
        if (window.MutationObserver && window.classObfuscator) {
            mutationObserver = new MutationObserver(mutations => {
                let shouldObfuscate = false;

                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.className || node.querySelectorAll) {
                                shouldObfuscate = true;
                            }
                        }
                    });
                });

                if (shouldObfuscate && window.classObfuscator) {
                    // 디바운스 처리
                    clearTimeout(window.obfuscationTimeout);
                    window.obfuscationTimeout = setTimeout(() => {
                        window.classObfuscator.applyObfuscation();
                    }, 100);
                }
            });

            mutationObserver.observe(document.body || document.documentElement, {
                childList: true,
                subtree: true
            });
        }
    }

    /**
     * 페이지 로드 완료 후 처리
     */
    function handlePageLoaded(event) {
        const { file, path, queryParams } = event.detail;

        // 페이지 로드 후 난수화 재적용
        if (window.classObfuscator) {
            setTimeout(() => {
                window.classObfuscator.init();
            }, 50);
        }

        // 페이지별 초기화 스크립트 실행
        if (path === '/map') {
            // 지도 페이지 초기화
            if (typeof initMap === 'function') {
                // Google Maps API가 로드될 때까지 대기
                waitForGoogleMaps();
            }
        } else if (path === '/detail') {
            // detail 페이지 초기화
            // detail.js의 initializeDetailPage가 pageLoaded 이벤트를 통해 호출됨
            // 추가 초기화가 필요하면 여기에 작성
        }
    }

    /**
     * Google Maps API 로드 대기
     */
    function waitForGoogleMaps() {
        if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
            if (typeof initMap === 'function') {
                initMap();
            }
        } else {
            setTimeout(waitForGoogleMaps, 100);
        }
    }

    // 전역 에러 핸들러
    window.addEventListener('error', (event) => {
        console.error('애플리케이션 오류:', event.error);
    });

    // 전역 이벤트: 라우터 준비 완료
    window.addEventListener('routerReady', () => {
        console.log('라우터 시스템 준비 완료');
    });

})();
