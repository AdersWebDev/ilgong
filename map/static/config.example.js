/**
 * 환경 설정 파일 예제
 * 
 * 이 파일을 복사하여 config.js로 이름을 변경하고,
 * 실제 API 키 값을 설정하세요.
 * 
 * config.js는 .gitignore에 포함되어 있으므로 Git에 커밋되지 않습니다.
 */

// Google Maps API 키
// 실제 API 키로 교체하세요.
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

// 설정 객체를 전역으로 노출
window.APP_CONFIG = {
    GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY
};

