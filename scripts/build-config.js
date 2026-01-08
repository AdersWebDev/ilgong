/**
 * Vercel 빌드 시 config.js 파일 생성 스크립트
 * 
 * 환경 변수 GOOGLE_MAPS_API_KEY에서 API 키를 읽어서
 * map/static/config.js 파일을 생성합니다.
 */

const fs = require('fs');
const path = require('path');

// 환경 변수에서 API 키 가져오기
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

if (!apiKey) {
    console.warn('⚠️  GOOGLE_MAPS_API_KEY 환경 변수가 설정되지 않았습니다.');
    console.warn('   로컬 개발을 위해 config.example.js를 config.js로 복사하세요.');
    
    // 로컬 개발을 위해 example 파일을 복사
    const examplePath = path.join(__dirname, '../map/static/config.example.js');
    const configPath = path.join(__dirname, '../map/static/config.js');
    
    if (fs.existsSync(examplePath) && !fs.existsSync(configPath)) {
        fs.copyFileSync(examplePath, configPath);
        console.log('✅ config.example.js를 config.js로 복사했습니다.');
    }
    process.exit(0);
}

// config.js 파일 내용 생성
const configContent = `/**
 * 환경 설정 파일 (자동 생성)
 * 
 * 이 파일은 빌드 시 자동으로 생성됩니다.
 * Vercel 환경 변수 GOOGLE_MAPS_API_KEY에서 값을 가져옵니다.
 * 
 * ⚠️ 이 파일을 수동으로 수정하지 마세요. 빌드 시 덮어씌워집니다.
 */

// Google Maps API 키 (Vercel 환경 변수에서 주입됨)
const GOOGLE_MAPS_API_KEY = '${apiKey}';

// 설정 객체를 전역으로 노출
window.APP_CONFIG = {
    GOOGLE_MAPS_API_KEY: GOOGLE_MAPS_API_KEY
};
`;

// config.js 파일 생성
const configPath = path.join(__dirname, '../map/static/config.js');
fs.writeFileSync(configPath, configContent, 'utf8');

console.log('✅ config.js 파일이 생성되었습니다.');
console.log(`   API 키: ${apiKey.substring(0, 10)}...`);

