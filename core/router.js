/**
 * History API 기반 라우터
 * .html 확장자 없이 깔끔한 URL 제공
 * 
 * @author 일공 개발팀
 * @version 1.0
 */
class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.loadedPages = new Set(); // 로드된 페이지 캐시
        this.init();
    }

    init() {
        // 라우트 정의
        this.routes.set('/', { 
            file: 'index.html', 
            title: '일공 - 일본 부동산 찾기',
            description: '일본 집 찾기, 클릭 한번으로 끝내기 - 일공 부동산',
            scripts: ['main/main.js']
        });
        this.routes.set('/agent/houber', { 
            file: 'houber/index.html', 
            title: '임대매물 찾기 - 일공',
            description: '일본 임대 부동산을 쉽게 검색하세요. 원하는 조건의 매물을 찾아보세요.',
            scripts: ['houber/houber.js']
        });
        // this.routes.set('/map', { 
        //     file: 'map.html', 
        //     title: '일본 부동산 검색 - 임대매물 찾기 | 일공',
        //     description: '일본 임대 부동산을 지도에서 쉽게 검색하세요. 원하는 조건의 매물을 찾아보세요.',
        //     scripts: [
        //         'map/Constants.js',
        //         'map/Utils.js',
        //         'map/ClusterManager.js',
        //         'map/UIRenderer.js',
        //         'map/DataLoader.js',
        //         'map/MarkerManager.js',
        //         'map/MapManager.js',
        //         'map/FilterManager.js',
        //         'map/SearchManager.js',
        //         'map/PropertyListManager.js',
        //         'map/MobileManager.js',
        //         'map/map.js'
        //     ]
        // });
        // this.routes.set('/detail', { 
        //     file: 'detail.html', 
        //     title: '매물 상세보기 - 일공',
        //     description: '일본 부동산 매물 상세 정보',
        //     scripts: ['detail/detail.js']
        // });
        // this.routes.set('/list', { 
        //     file: 'real-estate-list/real-estate-list.html', 
        //     title: '부동산 리스트 - 일공',
        //     description: '한국어 OK! 일본에 공식 등록된 일본 현지의 부동산 선배에 계공합니다',
        //     scripts: []
        // });

        // 이벤트 리스너 등록
        window.addEventListener('popstate', () => this.handleRoute());
        document.addEventListener('click', (e) => this.handleLinkClick(e));

        // 초기 라우트 처리
        this.handleRoute();
    }

    /**
     * 현재 경로 파싱
     */
    getCurrentPath() {
        let path = window.location.pathname;
        
        // 루트 경로 처리
        if (path === '/' || path === '/index.html' || path === '/index') {
            return '/';
        }
        
        // .html 확장자 제거
        if (path.endsWith('.html')) {
            path = path.replace(/\.html$/, '');
        }
        
        // 경로 정규화
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        return path || '/';
    }

    /**
     * 쿼리 파라미터 파싱
     */
    getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params.entries()) {
            result[key] = value;
        }
        return result;
    }

    /**
     * 세션 확인
     */
    async checkSession() {
        try {
            const response = await fetch('https://aderspro.com/auth/keep-alive', {
                method: 'GET',
                credentials: 'include', // 쿠키 포함
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('세션 확인 오류:', error);
            return false;
        }
    }

    /**
     * aders 경로 접근 권한 확인
     */
    async checkAdersAccess(path) {
        // aders/login은 접근 허용
        if (path === '/aders/login' || path.startsWith('/aders/login/')) {
            return true;
        }
        
        // aders/* 경로는 세션 확인 필요
        if (path.startsWith('/aders/')) {
            const hasSession = await this.checkSession();
            if (!hasSession) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * 라우트 처리
     */
    async handleRoute() {
        const path = this.getCurrentPath();
        const queryParams = this.getQueryParams();
        const queryString = window.location.search;
        
        // aders 경로 접근 권한 확인
        const hasAccess = await this.checkAdersAccess(path);
        if (!hasAccess) {
            // 404 처리
            console.warn(`Access denied for ${path}, returning 404`);
            this.show404();
            return;
        }
        
        const route = this.routes.get(path);

        // aders/* 경로는 라우터에 등록되어 있지 않아도 직접 파일 로드
        if (!route && path.startsWith('/aders/')) {
            // aders 경로는 이미 세션 확인을 통과했으므로 파일 직접 로드
            try {
                // 경로를 파일 경로로 변환 (예: /aders/dashboard -> aders/dashboard/index.html)
                const filePath = path === '/aders/login' 
                    ? 'aders/login/index.html' 
                    : `aders${path.replace('/aders', '')}/index.html`;
                
                await this.loadPage(filePath);
                this.currentRoute = path + queryString;
                
                // URL 업데이트
                const fullPath = queryString ? path + queryString : path;
                if (window.location.pathname + window.location.search !== fullPath) {
                    window.history.pushState({ path, query: queryString }, '', fullPath);
                }
                
                window.scrollTo(0, 0);
                
                window.dispatchEvent(new CustomEvent('pageLoaded', { 
                    detail: { 
                        file: filePath, 
                        path: path,
                        queryParams: queryParams
                    } 
                }));
                
                return;
            } catch (error) {
                console.error('aders 페이지 로드 오류:', error);
                this.show404();
                return;
            }
        }

        if (!route) {
            // 404 처리 - 기본 페이지로 리다이렉트
            console.warn(`Route not found: ${path}, redirecting to home`);
            this.navigate('/');
            return;
        }

        // 같은 라우트면 스킵 (쿼리 파라미터가 없거나 같을 때)
        const routeKey = path + queryString;
        if (this.currentRoute === routeKey) {
            return;
        }

        this.currentRoute = routeKey;

        try {
            // 페이지 로드
            await this.loadPage(route.file);
            
            // 메타 정보 업데이트
            this.updateMeta(route);
            
            // URL 업데이트 (History API 사용, 쿼리 파라미터 포함)
            const fullPath = queryString ? path + queryString : path;
            if (window.location.pathname + window.location.search !== fullPath) {
                window.history.pushState({ path, query: queryString }, '', fullPath);
            }

            // 스크롤 상단으로
            window.scrollTo(0, 0);

            // 페이지 로드 완료 이벤트 (쿼리 파라미터 포함)
            window.dispatchEvent(new CustomEvent('pageLoaded', { 
                detail: { 
                    file: route.file, 
                    path: path,
                    queryParams: queryParams
                } 
            }));

        } catch (error) {
            console.error('라우트 처리 오류:', error);
        }
    }

    /**
     * 메타 정보 업데이트
     */
    updateMeta(route) {
        document.title = route.title;
        
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && route.description) {
            metaDescription.setAttribute('content', route.description);
        }
    }

    /**
     * 페이지 동적 로드
     */
    async loadPage(file) {
        try {
            // 절대 경로로 변환 (루트 기준)
            const filePath = file.startsWith('/') ? file : '/' + file;
            
            // aders 경로 접근 권한 확인 (login 제외)
            if (filePath.startsWith('/aders/') && !filePath.startsWith('/aders/login')) {
                const hasAccess = await this.checkAdersAccess(filePath.replace(/\.html$/, '').replace(/\/index$/, ''));
                if (!hasAccess) {
                    throw new Error(`Access denied: ${filePath}`);
                }
            }
            
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load ${filePath}: ${response.status}`);
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // 파일의 디렉토리 경로 계산 (상대 경로 변환용)
            const fileDir = filePath.substring(0, filePath.lastIndexOf('/') + 1);

            // body 내용 교체
            await this.replaceBodyContent(doc);

            // head의 스타일시트 동적 로드
            this.loadStylesheets(doc, fileDir);

            // 스크립트 동적 로드
            await this.loadScripts(doc, fileDir);

            // 페이지 로드 완료 이벤트
            window.dispatchEvent(new CustomEvent('pageLoaded', { detail: { file, path: this.currentRoute } }));

        } catch (error) {
            console.error('페이지 로드 오류:', error);
            throw error;
        }
    }

    /**
     * Body 내용 교체
     */
    async replaceBodyContent(doc) {
        const newBody = doc.body;
        const currentBody = document.body;
        const appContainer = document.getElementById('app');

        // 임시 컨테이너에 새 내용 파싱
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newBody.innerHTML;

        // 기존 내용 제거 (core 스크립트 제외)
        if (appContainer) {
            // app 컨테이너가 있으면 그 안에만 교체
            appContainer.innerHTML = '';
            // 새 내용 추가
            Array.from(tempDiv.children).forEach(child => {
                appContainer.appendChild(child.cloneNode(true));
            });
        } else {
            // app 컨테이너가 없으면 body 직접 교체
            const coreScripts = [];
            Array.from(currentBody.children).forEach(child => {
                const isCoreScript = child.tagName === 'SCRIPT' && 
                    child.src && 
                    (child.src.includes('core/') || child.src.includes('router.js') || child.src.includes('obfuscator.js') || child.src.includes('app.js'));
                if (isCoreScript) {
                    coreScripts.push(child);
                } else {
                    child.remove();
                }
            });

            // 새 내용 추가
            Array.from(tempDiv.children).forEach(child => {
                if (child.tagName !== 'SCRIPT') {
                    currentBody.appendChild(child.cloneNode(true));
                }
            });

            // core 스크립트는 유지
            coreScripts.forEach(script => {
                if (!currentBody.contains(script)) {
                    currentBody.appendChild(script);
                }
            });
        }
    }

    /**
     * 스타일시트 동적 로드
     */
    loadStylesheets(doc, baseDir = '/') {
        const styles = Array.from(doc.querySelectorAll('link[rel="stylesheet"]'));
        const loadedHrefs = new Set(
            Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => link.href)
        );

        styles.forEach(link => {
            let href = link.href || link.getAttribute('href');
            if (href && !loadedHrefs.has(href) && !href.includes('fonts.googleapis.com') && !href.includes('cdn.jsdelivr.net')) {
                // 상대 경로를 절대 경로로 변환 (파일의 디렉토리 기준)
                if (href && !href.startsWith('http') && !href.startsWith('//') && !href.startsWith('/')) {
                    href = baseDir + href;
                } else if (href && href.startsWith('/')) {
                    // 이미 절대 경로이면 그대로 사용
                }
                const newLink = document.createElement('link');
                newLink.rel = 'stylesheet';
                newLink.href = href;
                document.head.appendChild(newLink);
                loadedHrefs.add(href);
            }
        });
    }

    /**
     * 스크립트 동적 로드
     */
    async loadScripts(doc, baseDir = '/') {
        // 외부 스크립트 로드
        const externalScripts = Array.from(doc.querySelectorAll('script[src]'));
        const loadedScripts = new Set(
            Array.from(document.querySelectorAll('script[src]')).map(script => script.src)
        );

        for (const script of externalScripts) {
            let src = script.src || script.getAttribute('src');
            if (src && !loadedScripts.has(src) && !src.includes('core/')) {
                // 상대 경로를 절대 경로로 변환 (파일의 디렉토리 기준)
                if (src && !src.startsWith('http') && !src.startsWith('//') && !src.startsWith('/')) {
                    src = baseDir + src;
                } else if (src && src.startsWith('/')) {
                    // 이미 절대 경로이면 그대로 사용
                }
                await this.loadScript(src, script.async, script.defer);
                loadedScripts.add(src);
            }
        }

        // 인라인 스크립트 실행
        const inlineScripts = Array.from(doc.querySelectorAll('script:not([src])'));
        inlineScripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
        });
    }

    /**
     * 개별 스크립트 로드
     */
    loadScript(src, async = true, defer = false) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = async;
            script.defer = defer;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    /**
     * 링크 클릭 처리
     */
    handleLinkClick(e) {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        
        // 외부 링크나 특수 링크는 무시
        if (href.startsWith('http') || 
            href.startsWith('//') || 
            href.startsWith('#') || 
            href.startsWith('mailto:') || 
            href.startsWith('tel:') ||
            href.startsWith('javascript:')) {
            return;
        }

        // .html 확장자 제거 및 경로 정규화
        let path = href.replace(/\.html$/, '');
        if (!path.startsWith('/')) {
            // 상대 경로를 절대 경로로 변환
            const currentPath = this.getCurrentPath();
            const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
            path = basePath + path;
        }

        // 경로 정규화
        path = path.split('/').filter(p => p).join('/');
        if (!path.startsWith('/')) {
            path = '/' + path;
        }

        // 라우트가 존재하는지 확인
        if (this.routes.has(path)) {
            e.preventDefault();
            this.navigate(path);
        } else if (path !== this.getCurrentPath()) {
            // 라우트가 없어도 네비게이션 시도 (404 처리됨)
            e.preventDefault();
            this.navigate(path);
        }
    }

    /**
     * 프로그래밍 방식 네비게이션
     */
    navigate(path) {
        // 쿼리 파라미터 분리
        const [basePath, queryString] = path.split('?');
        const fullPath = queryString ? `${basePath}?${queryString}` : basePath;
        
        // 현재 경로와 비교 (currentRoute는 path + queryString 형태)
        const currentPath = this.getCurrentPath();
        const currentQuery = window.location.search;
        if (basePath === currentPath && (queryString || '') === currentQuery) {
            return;
        }
        
        window.history.pushState({ path: basePath, query: queryString || '' }, '', fullPath);
        this.handleRoute();
    }

    /**
     * 현재 라우트 반환
     */
    getCurrentRoute() {
        return this.currentRoute;
    }

    /**
     * 404 페이지 표시
     */
    show404() {
        document.body.innerHTML = `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>404 - 페이지를 찾을 수 없습니다</title>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        background: #f5f5f5;
                    }
                    .error-container {
                        text-align: center;
                        padding: 2rem;
                    }
                    h1 {
                        font-size: 6rem;
                        margin: 0;
                        color: #333;
                    }
                    h2 {
                        font-size: 1.5rem;
                        margin: 1rem 0;
                        color: #666;
                    }
                    p {
                        color: #999;
                        margin: 1rem 0;
                    }
                </style>
            </head>
            <body>
                <div class="error-container">
                    <h1>404</h1>
                    <h2>페이지를 찾을 수 없습니다</h2>
                    <p>요청하신 페이지를 찾을 수 없습니다.</p>
                </div>
            </body>
            </html>
        `;
    }
}

// 전역 라우터 인스턴스
window.router = new Router();
