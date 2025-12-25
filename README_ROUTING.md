# 라우팅 및 보안 시스템 가이드

## 개요

이 프로젝트는 순수 JavaScript로 구현된 SPA(Single Page Application) 라우팅 시스템과 클래스명 난수화 보안 시스템을 포함합니다.

## 주요 기능

### 1. 라우팅 시스템 (`core/router.js`)

- **History API 기반**: `.html` 확장자 없이 깔끔한 URL 제공
- **동적 페이지 로딩**: 페이지 전환 시 전체 새로고침 없이 콘텐츠만 교체
- **자동 링크 처리**: 모든 내부 링크를 자동으로 라우터로 처리

#### 사용 가능한 라우트

- `/` - 메인 페이지 (index.html)
- `/map` - 지도 페이지 (map.html)
- `/detail` - 상세 페이지 (detail.html)
- `/list` - 리스트 페이지 (real-estate-list.html)

#### 프로그래밍 방식 네비게이션

```javascript
// 라우터 인스턴스 사용
window.router.navigate('/map');

// 또는 직접 URL 변경 (자동으로 라우터가 처리)
window.location.href = '/map';
```

### 2. 클래스명 난수화 시스템 (`core/obfuscator.js`)

- **자동 난수화**: 모든 HTML 클래스명을 `_obf_` 접두사로 시작하는 난수화된 이름으로 변환
- **동적 요소 지원**: JavaScript로 추가된 요소도 자동으로 난수화
- **CSS 자동 변환**: 스타일시트의 클래스 셀렉터도 자동으로 변환

#### 난수화 예시

```html
<!-- 원본 -->
<div class="header container">...</div>

<!-- 난수화 후 -->
<div class="_obf_aB3cD4eF5gH6iJ7kL8mN9oP0qR1sT2uV3wX4yZ5aB6cD7eF8">...</div>
```

### 3. 서버 설정 (`.htaccess`)

- **URL 리라이트**: `.html` 확장자 자동 제거
- **보안 헤더**: XSS 보호, 클릭재킹 방지 등
- **캐시 최적화**: 정적 리소스 캐싱 설정

## 설치 및 설정

### 1. 파일 구조

```
ilgong-final/
├── core/
│   ├── router.js          # 라우터 시스템
│   ├── obfuscator.js      # 클래스명 난수화
│   └── app.js             # 메인 앱 진입점
├── .htaccess              # Apache 서버 설정
├── index.html             # SPA 진입점
└── ...
```

### 2. 서버 요구사항

- **Apache 서버**: `mod_rewrite` 모듈 필요
- **또는 Node.js 서버**: Express 등으로 유사한 리라이트 규칙 설정

### 3. 초기화

`index.html`에 다음 스크립트가 포함되어 있어야 합니다:

```html
<script src="core/obfuscator.js"></script>
<script src="core/router.js"></script>
<script src="core/app.js"></script>
```

## 사용 방법

### 링크 작성

```html
<!-- 올바른 방법 -->
<a href="/map">임대매물 찾기</a>
<a href="/detail">상세보기</a>

<!-- 잘못된 방법 (자동으로 변환되지만 권장하지 않음) -->
<a href="map.html">임대매물 찾기</a>
```

### 버튼 클릭으로 네비게이션

```javascript
// JavaScript에서
if (window.router) {
    window.router.navigate('/map');
}
```

### 동적 요소에 난수화 적용

```javascript
// 새 요소 추가 시 자동으로 난수화됨
const newElement = document.createElement('div');
newElement.className = 'my-class';
document.body.appendChild(newElement);
// 자동으로 난수화된 클래스명으로 변환됨
```

## 보안 기능

### 1. 클래스명 난수화

- HTML 구조 분석 어려움
- 자동화된 스크래핑 방지
- 코드 역공학 어려움

### 2. 서버 보안 헤더

- XSS 보호
- 클릭재킹 방지
- 콘텐츠 타입 스니핑 방지

## 문제 해결

### 라우터가 작동하지 않는 경우

1. `.htaccess` 파일이 서버에 업로드되었는지 확인
2. Apache `mod_rewrite` 모듈이 활성화되었는지 확인
3. 브라우저 콘솔에서 오류 확인

### 난수화가 적용되지 않는 경우

1. `core/obfuscator.js`가 로드되었는지 확인
2. 브라우저 콘솔에서 `window.classObfuscator` 확인
3. 동적 요소는 MutationObserver가 자동 처리

### 페이지 로드 후 스크립트가 실행되지 않는 경우

1. `core/app.js`의 `handlePageLoaded` 이벤트 확인
2. 페이지별 초기화 스크립트가 올바르게 로드되는지 확인
3. Google Maps API 등 외부 스크립트는 별도 처리 필요

## 개발 모드

개발 중에는 난수화를 비활성화할 수 있습니다:

```javascript
// core/app.js에서
// initObfuscator() 함수 호출을 주석 처리
```

## 주의사항

1. **CSS 파일**: 난수화된 클래스명에 맞춰 CSS도 수정 필요 (자동 변환 시도하지만 완벽하지 않을 수 있음)
2. **JavaScript 셀렉터**: `querySelector` 등에서 원본 클래스명 대신 난수화된 이름 사용 필요
3. **디버깅**: 개발자 도구에서 난수화된 클래스명으로 표시됨

## 라이선스

일공 프로젝트 내부 사용
