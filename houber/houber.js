// 전체선택 기능
function selectAllRegions() {
    alert('전체 지역이 선택되었습니다.');
}

// 폼 데이터 수집 및 백엔드 전송용 파라미터 생성
function collectFormData() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fe271648-e152-4df7-81d5-741f73daf5dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'houber.js:7',message:'collectFormData called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const formData = {
        // 기본 정보
        email: document.getElementById('email').value.trim(),
        visaType: document.getElementById('propertyLocation').value,
        
        // 가격 범위
        minPrice: null,
        maxPrice: null,
        
        // 방 타입
        roomTypes: [],
        
        // 건물 구조 타입
        structureTypes: [],
        
        // 건물 축년 수 (최소 연도만 전송)
        minConstructionYear: null,
        
        // 희망 지역
        locationTypes: [],
        
        // 많이 찾는 옵션
        popularOptions: [],
        
        // 건물 옵션
        buildingOptions: [],
        
        // 역까지 최대 소요 시간
        maxWalkingTime: null
    };

    // 가격 범위 수집
    const minPriceSelect = document.getElementById('minPriceSelect');
    const maxPriceSelect = document.getElementById('maxPriceSelect');
    
    // #region agent log
    const minPriceText = minPriceSelect?.querySelector('.select-text')?.textContent || 'not found';
    const maxPriceText = maxPriceSelect?.querySelector('.select-text')?.textContent || 'not found';
    const minPriceSelected = minPriceSelect?.querySelector('.select-dropdown li.selected');
    const maxPriceSelected = maxPriceSelect?.querySelector('.select-dropdown li.selected');
    fetch('http://127.0.0.1:7242/ingest/fe271648-e152-4df7-81d5-741f73daf5dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'houber.js:44',message:'Price select state',data:{minPriceText,maxPriceText,minPriceSelected:!!minPriceSelected,maxPriceSelected:!!maxPriceSelected,minPriceValue:minPriceSelected?.dataset.value,maxPriceValue:maxPriceSelected?.dataset.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    if (minPriceSelect) {
        const minPriceLi = minPriceSelect.querySelector('.select-dropdown li.selected');
        if (minPriceLi && minPriceLi.dataset.value) {
            formData.minPrice = parseInt(minPriceLi.dataset.value);
        } else {
            // selected 클래스가 없을 경우 select-text에서 값 추출 시도
            const minPriceText = minPriceSelect.querySelector('.select-text')?.textContent;
            if (minPriceText && minPriceText !== '제한 없음') {
                const allOptions = minPriceSelect.querySelectorAll('.select-dropdown li');
                for (const li of allOptions) {
                    if (li.textContent.trim() === minPriceText.trim()) {
                        formData.minPrice = parseInt(li.dataset.value);
                        break;
                    }
                }
            }
        }
    }
    
    if (maxPriceSelect) {
        const maxPriceLi = maxPriceSelect.querySelector('.select-dropdown li.selected');
        if (maxPriceLi && maxPriceLi.dataset.value) {
            formData.maxPrice = parseInt(maxPriceLi.dataset.value);
        } else {
            // selected 클래스가 없을 경우 select-text에서 값 추출 시도
            const maxPriceText = maxPriceSelect.querySelector('.select-text')?.textContent;
            if (maxPriceText && maxPriceText !== '제한 없음') {
                const allOptions = maxPriceSelect.querySelectorAll('.select-dropdown li');
                for (const li of allOptions) {
                    if (li.textContent.trim() === maxPriceText.trim()) {
                        formData.maxPrice = parseInt(li.dataset.value);
                        break;
                    }
                }
            }
        }
    }

    // 방 타입 수집
    const roomTypeCheckboxes = document.querySelectorAll('input[name="roomType"]:checked');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fe271648-e152-4df7-81d5-741f73daf5dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'houber.js:78',message:'Room types collection',data:{checkedCount:roomTypeCheckboxes.length,values:Array.from(roomTypeCheckboxes).map(cb=>cb.value)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    roomTypeCheckboxes.forEach(cb => {
        formData.roomTypes.push(cb.value);
    });

    // 건물 구조 타입 수집
    const structureTypeCheckboxes = document.querySelectorAll('input[name="structureType"]:checked');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fe271648-e152-4df7-81d5-741f73daf5dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'houber.js:87',message:'Structure types collection',data:{checkedCount:structureTypeCheckboxes.length,values:Array.from(structureTypeCheckboxes).map(cb=>cb.value)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    structureTypeCheckboxes.forEach(cb => {
        formData.structureTypes.push(cb.value);
    });

    // 건물 축년 수 수집 (최소 연도만)
    const activeAgePoints = document.querySelectorAll('.age-point.active:not([data-year="all"])');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fe271648-e152-4df7-81d5-741f73daf5dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'houber.js:95',message:'Building age points',data:{activeCount:activeAgePoints.length,years:Array.from(activeAgePoints).map(p=>p.dataset.year)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    const buildingAgeYears = [];
    activeAgePoints.forEach(point => {
        const year = parseInt(point.dataset.year);
        if (year) {
            buildingAgeYears.push(year);
        }
    });
    if (buildingAgeYears.length > 0) {
        formData.minConstructionYear = Math.min(...buildingAgeYears);
    }

    // 희망 지역 수집
    const locationTypeCheckboxes = document.querySelectorAll('input[name="locationType"]:checked');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fe271648-e152-4df7-81d5-741f73daf5dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'houber.js:110',message:'Location types collection',data:{checkedCount:locationTypeCheckboxes.length,values:Array.from(locationTypeCheckboxes).map(cb=>cb.value)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    locationTypeCheckboxes.forEach(cb => {
        formData.locationTypes.push(cb.value);
    });

    // 많이 찾는 옵션 수집
    const popularOptionsCheckboxes = document.querySelectorAll('input[name="popularOptions"]:checked');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fe271648-e152-4df7-81d5-741f73daf5dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'houber.js:118',message:'Popular options collection',data:{checkedCount:popularOptionsCheckboxes.length,values:Array.from(popularOptionsCheckboxes).map(cb=>cb.value)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    popularOptionsCheckboxes.forEach(cb => {
        formData.popularOptions.push(cb.value);
    });

    // 건물 옵션 수집
    const buildingOptionsCheckboxes = document.querySelectorAll('input[name="buildingOptions"]:checked');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fe271648-e152-4df7-81d5-741f73daf5dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'houber.js:126',message:'Building options collection',data:{checkedCount:buildingOptionsCheckboxes.length,values:Array.from(buildingOptionsCheckboxes).map(cb=>cb.value)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    buildingOptionsCheckboxes.forEach(cb => {
        formData.buildingOptions.push(cb.value);
    });

    // 역까지 최대 소요 시간 수집
    const walkingTimeSelect = document.getElementById('walkingTimeSelect');
    // #region agent log
    const walkingTimeText = walkingTimeSelect?.querySelector('.select-text')?.textContent || 'not found';
    const walkingTimeSelected = walkingTimeSelect?.querySelector('.select-dropdown li.selected');
    fetch('http://127.0.0.1:7242/ingest/fe271648-e152-4df7-81d5-741f73daf5dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'houber.js:135',message:'Walking time select state',data:{walkingTimeText,walkingTimeSelected:!!walkingTimeSelected,walkingTimeValue:walkingTimeSelected?.dataset.value},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (walkingTimeSelect) {
        const walkingTimeLi = walkingTimeSelect.querySelector('.select-dropdown li.selected');
        if (walkingTimeLi && walkingTimeLi.dataset.value) {
            formData.maxWalkingTime = parseInt(walkingTimeLi.dataset.value);
        } else {
            // selected 클래스가 없을 경우 select-text에서 값 추출 시도
            const walkingTimeText = walkingTimeSelect.querySelector('.select-text')?.textContent;
            if (walkingTimeText && walkingTimeText !== '제한 없음') {
                const allOptions = walkingTimeSelect.querySelectorAll('.select-dropdown li');
                for (const li of allOptions) {
                    if (li.textContent.trim() === walkingTimeText.trim()) {
                        formData.maxWalkingTime = parseInt(li.dataset.value);
                        break;
                    }
                }
            }
        }
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/fe271648-e152-4df7-81d5-741f73daf5dc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'houber.js:152',message:'collectFormData result',data:{formData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    return formData;
}

// 백엔드 전송용 파라미터 정리 (빈 값 제거)
function prepareBackendParams(formData) {
    const params = {};
    
    // 필수 필드
    if (formData.email) {
        params.email = formData.email;
    }
    
    if (formData.visaType && formData.visaType !== '선택 필수') {
        params.visaType = formData.visaType;
    }
    
    // 가격 범위
    if (formData.minPrice !== null) {
        params.minPrice = formData.minPrice;
    }
    
    if (formData.maxPrice !== null) {
        params.maxPrice = formData.maxPrice;
    }
    
    // 방 타입
    if (formData.roomTypes.length > 0) {
        params.roomTypes = formData.roomTypes;
    }
    
    // 건물 구조 타입
    if (formData.structureTypes.length > 0) {
        params.structureTypes = formData.structureTypes;
    }
    
    // 건물 축년 수
    if (formData.minConstructionYear !== null) {
        params.minConstructionYear = formData.minConstructionYear;
    }
    
    // 희망 지역
    if (formData.locationTypes.length > 0) {
        params.locationTypes = formData.locationTypes;
    }
    
    // 많이 찾는 옵션
    if (formData.popularOptions.length > 0) {
        params.popularOptions = formData.popularOptions;
    }
    
    // 건물 옵션
    if (formData.buildingOptions.length > 0) {
        params.buildingOptions = formData.buildingOptions;
    }
    
    // 역까지 최대 소요 시간
    if (formData.maxWalkingTime !== null && formData.maxWalkingTime !== undefined) {
        params.maxWalkingTime = formData.maxWalkingTime;
    }
    
    return params;
}

// 백엔드로 데이터 전송 시뮬레이션
async function sendToBackend(params) {
    // 실제 백엔드 엔드포인트 (준비되면 사용)
    const API_ENDPOINT = '/api/housing/search';
    
    console.log('=== 백엔드 전송 시뮬레이션 ===');
    console.log('엔드포인트:', API_ENDPOINT);
    console.log('전송 파라미터:', JSON.stringify(params, null, 2));
    console.log('전송 방법: POST');
    console.log('Content-Type: application/json');
    
    // 실제 전송 코드 (주석 처리 - 백엔드 준비되면 활성화)
    /*
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('백엔드 전송 오류:', error);
        throw error;
    }
    */
    
    // 시뮬레이션: 성공 응답 (requestId 반환)
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockResponse = {
                success: true,
                message: '검색 요청이 성공적으로 전송되었습니다.',
                requestId: `req_${Date.now()}`,
                timestamp: new Date().toISOString()
            };
            console.log('=== 백엔드 응답 (시뮬레이션) ===');
            console.log(JSON.stringify(mockResponse, null, 2));
            resolve(mockResponse);
        }, 500); // 0.5초 지연으로 실제 전송처럼 보이게
    });
}

// ========================================
// 검색 상태 확인 (폴링)
// ========================================
let pollingInterval = null;
let pollingRequestId = null;
let currentProgress = 0; // 현재 진행률 추적

// 검색 상태 확인 API 호출
async function checkSearchStatus(requestId) {
    const STATUS_ENDPOINT = `/api/housing/search/status/${requestId}`;
    
    console.log('=== 상태 확인 요청 ===');
    console.log('엔드포인트:', STATUS_ENDPOINT);
    console.log('Request ID:', requestId);
    
    // 실제 API 호출 코드 (백엔드 준비되면 활성화)
    /*
    try {
        const response = await fetch(STATUS_ENDPOINT, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        // 백엔드 응답 형식 예상: { flow: 10, email: "user@example.com", ... }
        return {
            requestId: requestId,
            flow: data.flow, // 백엔드에서 받은 flow 넘버
            email: data.email, // 이메일 (80일 때 표시용)
            status: data.flow === 100 ? 'completed' : (data.flow === -1 ? 'failed' : 'processing'),
            progress: data.flow === -1 ? 0 : Math.max(0, Math.min(100, data.flow)),
            message: getStatusMessageByFlow(data.flow),
            details: getStatusDetailsByFlow(data.flow, data.email),
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('상태 확인 오류:', error);
        throw error;
    }
    */
    
    // 시뮬레이션: 상태 응답 (테스트용 - flow 넘버 시뮬레이션)
    return new Promise((resolve) => {
        setTimeout(() => {
            // 테스트용: flow 넘버를 순차적으로 증가
            const flowSequence = [5, 10, 20, 30, 60, 41, 70, 80, 100];
            let currentIndex = -1;
            
            // 현재 진행 중인 flow 찾기
            if (currentProgress === 0) {
                currentIndex = -1; // 시작
            } else {
                currentIndex = flowSequence.indexOf(currentProgress);
            }
            
            // 다음 flow로 진행
            const nextIndex = currentIndex < flowSequence.length - 1 ? currentIndex + 1 : flowSequence.length - 1;
            currentProgress = flowSequence[nextIndex];
            
            // 완료 조건: 100 도달
            const isCompleted = currentProgress === 100;
            const isError = currentProgress === -1;
            
            // 이메일 가져오기 (80일 때 표시용)
            const emailInput = document.getElementById('email');
            const email = emailInput ? emailInput.value.trim() : '';
            
            const mockResponse = {
                requestId: requestId,
                flow: currentProgress,
                email: email,
                status: isCompleted ? 'completed' : (isError ? 'failed' : 'processing'),
                progress: isError ? 0 : Math.max(0, Math.min(100, currentProgress)),
                message: getStatusMessageByFlow(currentProgress),
                details: getStatusDetailsByFlow(currentProgress, email),
                timestamp: new Date().toISOString()
            };
            
            console.log('=== 상태 확인 응답 (시뮬레이션) ===');
            console.log(JSON.stringify(mockResponse, null, 2));
            resolve(mockResponse);
        }, 300); // 0.3초 지연
    });
}

// Flow 넘버에 따른 메시지 반환
function getStatusMessageByFlow(flow) {
    const flowMessages = {
        'start': '검색 요청을 발송했어요! 조건에 대한 10개의 건물을 보내드릴게요',
        5: '프로세스 신청 대기 중',
        10: '프로세스 시작됌',
        20: '요청사항 분석 중 ...',
        30: '데이터베이스 추합 중...',
        41: '정확도 미달로 재검색중',
        60: '결과 값 정확도 분석중',
        70: '예쁘게 포장 중',
        80: '산출 완료 메일로 전송을 준비합니다',
        100: '발송완료 메일을 확인해주세요',
        '-1': '에러 발생 요청을 강제 종료합니다'
    };
    
    return flowMessages[flow] || flowMessages[flow.toString()] || '처리 중...';
}

// Flow 넘버에 따른 상세 정보 반환
function getStatusDetailsByFlow(flow, email) {
    if (flow === 80 && email) {
        return `발송메일: ${email}`;
    }
    return '';
}

// 폴링 시작
function startPolling(requestId) {
    pollingRequestId = requestId;
    currentProgress = 0; // flow 초기화
    
    // 시작 메시지 표시
    const emailInput = document.getElementById('email');
    const email = emailInput ? emailInput.value.trim() : '';
    updateStatusModal({
        status: 'processing',
        flow: 'start',
        progress: 0,
        message: getStatusMessageByFlow('start'),
        details: '',
        email: email
    });
    
    // 2초 후 첫 번째 상태 확인 시작
    setTimeout(() => {
        checkStatusOnce();
        
        // 2초마다 상태 확인
        pollingInterval = setInterval(() => {
            checkStatusOnce();
        }, 2000);
    }, 2000);
}

// 폴링 중지
function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
    pollingRequestId = null;
    currentProgress = 0; // 진행률 초기화
}

// 상태 확인 한 번 실행
async function checkStatusOnce() {
    if (!pollingRequestId) return;
    
    try {
        const statusData = await checkSearchStatus(pollingRequestId);
        updateStatusModal(statusData);
        
        // 완료 또는 실패 시 폴링 중지
        if (statusData.status === 'completed' || statusData.status === 'failed') {
            stopPolling();
        }
    } catch (error) {
        console.error('상태 확인 오류:', error);
        updateStatusModal({
            status: 'error',
            flow: -1,
            message: getStatusMessageByFlow(-1),
            progress: 0,
            details: '상태 확인 중 오류가 발생했습니다.'
        });
        stopPolling();
    }
}

// ========================================
// 확인 모달 제어
// ========================================
function showConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    
    // 모달 표시
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // 스크롤 방지
}

function hideConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (!modal) return;
    
    // 모달 숨김
    modal.classList.remove('active');
    document.body.style.overflow = ''; // 스크롤 복원
}

// ========================================
// 모달 제어
// ========================================
function showStatusModal(requestId) {
    const modal = document.getElementById('searchStatusModal');
    if (!modal) return;
    
    // 모달 표시
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // 스크롤 방지
    
    // 폴링 시작 (시작 메시지는 startPolling에서 처리)
    startPolling(requestId);
}

function hideStatusModal() {
    const modal = document.getElementById('searchStatusModal');
    if (!modal) return;
    
    // 폴링 중지
    stopPolling();
    
    // 모달 숨김
    modal.classList.remove('active');
    document.body.style.overflow = ''; // 스크롤 복원
}

function updateStatusModal(statusData) {
    const statusMessage = document.getElementById('statusMessage');
    const statusDetails = document.getElementById('statusDetails');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const modalFooter = document.getElementById('modalFooter');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modal = document.getElementById('searchStatusModal');
    
    if (!statusMessage || !statusDetails || !progressFill || !progressText) return;
    
    // 메시지 업데이트 (flow에 따른 메시지)
    statusMessage.textContent = statusData.message || '처리 중...';
    
    // 상세 정보 업데이트
    if (statusData.details) {
        statusDetails.textContent = statusData.details;
        statusDetails.style.display = 'block';
    } else {
        statusDetails.style.display = 'none';
    }
    
    // 진행률 업데이트 (flow 값을 퍼센트로 변환)
    const progress = statusData.progress || 0;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
    
    // 완료 또는 실패 시
    if (statusData.status === 'completed' || statusData.flow === 100) {
        statusMessage.textContent = statusData.message || getStatusMessageByFlow(100);
        if (statusData.details) {
            statusDetails.textContent = statusData.details;
        } else {
            statusDetails.textContent = '메일을 확인해주세요.';
        }
        statusDetails.style.display = 'block';
        modalFooter.style.display = 'flex';
        modal?.classList.add('completed');
    } else if (statusData.status === 'failed' || statusData.status === 'error' || statusData.flow === -1) {
        statusMessage.textContent = statusData.message || getStatusMessageByFlow(-1);
        statusDetails.textContent = statusData.details || '다시 시도해주세요.';
        statusDetails.style.display = 'block';
        modalFooter.style.display = 'flex';
        modal?.classList.add('error');
    } else {
        modalFooter.style.display = 'none';
        modal?.classList.remove('completed', 'error');
    }
}

// 폼 검증
function validateForm() {
    const email = document.getElementById('email').value.trim();
    const propertyLocation = document.getElementById('propertyLocation').value;

    if (!email) {
        alert('이메일을 입력해주세요.');
        return false;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('올바른 이메일 형식을 입력해주세요.');
        return false;
    }

    if (!propertyLocation || propertyLocation === '선택 필수') {
        alert('비자 종류를 선택해주세요.');
        return false;
    }

    // 개인정보 수집 이용 동의 검증
    const privacyAgreement = document.getElementById('privacyAgreement');
    if (!privacyAgreement || !privacyAgreement.checked) {
        alert('개인정보 수집 이용 동의에 체크해주세요.');
        return false;
    }

    return true;
}

// 실제 검색 요청 처리 함수
async function processSearchRequest() {
    // 폼 데이터 수집
    const formData = collectFormData();
    
    // 백엔드 전송용 파라미터 준비 (빈 값 제거)
    const backendParams = prepareBackendParams(formData);
    
    console.log('=== 폼 데이터 수집 완료 ===');
    console.log('원본 데이터:', formData);
    console.log('백엔드 전송용 파라미터:', backendParams);
    
    // 확인 모달 닫기
    hideConfirmModal();
    
    try {
        // 백엔드로 데이터 전송 시뮬레이션
        const response = await sendToBackend(backendParams);
        
        // 데이터를 localStorage에 저장 (백업용)
        localStorage.setItem('housingFormData', JSON.stringify(formData));
        localStorage.setItem('lastSearchRequest', JSON.stringify({
            params: backendParams,
            timestamp: new Date().toISOString(),
            requestId: response.requestId
        }));
        
        // 상태 모달 표시 및 폴링 시작
        showStatusModal(response.requestId);
        
    } catch (error) {
        console.error('전송 오류:', error);
        alert('검색 요청 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
        
        // 제출 버튼 활성화
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '검색 요청하기';
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 폼 제출 처리
    const housingForm = document.getElementById('housingForm');
    if (housingForm) {
        housingForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!validateForm()) {
                return;
            }

            // 제출 버튼 비활성화 (중복 제출 방지)
            const submitBtn = this.querySelector('.submit-btn');
            submitBtn.disabled = true;
            
            // 확인 모달 표시
            showConfirmModal();
        });
    }

    // 서비스 선택 버튼
    const serviceSelectBtn = document.querySelector('.service-select-btn');
    if (serviceSelectBtn) {
        serviceSelectBtn.addEventListener('click', function() {
            alert('렌탈서비스 및 기타서비스 선택 창이 열립니다.');
        });
    }

    // 알림 버튼
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            const isActive = this.classList.toggle('active');
            
            if (isActive) {
                this.style.backgroundColor = '#0074E4';
                this.style.color = '#ffffff';
                alert('신규 매물 알림이 활성화되었습니다.');
            } else {
                this.style.backgroundColor = '#f5f5f5';
                this.style.color = '#333';
                alert('신규 매물 알림이 비활성화되었습니다.');
            }
        });
    }
});

// 체크박스 "전체" 선택 시 다른 옵션 자동 체크/해제
function setupCheckboxGroups() {
    const groups = ['area', 'tradeType'];

    groups.forEach(groupName => {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        const allCheckbox = Array.from(checkboxes).find(cb => cb.value === 'all');

        if (allCheckbox) {
            allCheckbox.addEventListener('change', function() {
                checkboxes.forEach(cb => {
                    if (cb !== allCheckbox) {
                        cb.checked = this.checked;
                    }
                });
            });

            // 다른 체크박스들 클릭 시 "전체" 체크 해제
            checkboxes.forEach(cb => {
                if (cb !== allCheckbox) {
                    cb.addEventListener('change', function() {
                        if (!this.checked) {
                            allCheckbox.checked = false;
                        } else {
                            // 모든 개별 항목이 체크되면 "전체"도 체크
                            const otherCheckboxes = Array.from(checkboxes).filter(c => c !== allCheckbox);
                            const allChecked = otherCheckboxes.every(c => c.checked);
                            allCheckbox.checked = allChecked;
                        }
                    });
                }
            });
        }
    });
}

// ========================================
// Custom Select (Price Range & Walking Time)
// ========================================
function initializePriceSelectors() {
    const minPriceSelect = document.getElementById('minPriceSelect');
    const maxPriceSelect = document.getElementById('maxPriceSelect');
    
    if (minPriceSelect) {
        initCustomSelect(minPriceSelect);
    }
    
    if (maxPriceSelect) {
        initCustomSelect(maxPriceSelect);
    }
}

function initializeWalkingTimeSelector() {
    const walkingTimeSelect = document.getElementById('walkingTimeSelect');
    
    if (walkingTimeSelect) {
        initCustomSelect(walkingTimeSelect);
    }
}

function initCustomSelect(selectElement) {
    const button = selectElement.querySelector('.select-button');
    const dropdown = selectElement.querySelector('.select-dropdown');
    const text = button.querySelector('.select-text');
    
    // Toggle dropdown
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        
        // Close other dropdowns
        document.querySelectorAll('.custom-select').forEach(select => {
            if (select !== selectElement) {
                select.querySelector('.select-button').classList.remove('active');
                select.querySelector('.select-dropdown').classList.remove('active');
            }
        });
        
        button.classList.toggle('active');
        dropdown.classList.toggle('active');
    });
    
    // Select option
    dropdown.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', function() {
            const value = this.dataset.value;
            const displayText = this.textContent;
            
            text.textContent = displayText;
            
            // Update selected state
            dropdown.querySelectorAll('li').forEach(item => {
                item.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // Close dropdown
            button.classList.remove('active');
            dropdown.classList.remove('active');
        });
    });
    
    // Close on outside click
    document.addEventListener('click', function(e) {
        if (!selectElement.contains(e.target)) {
            button.classList.remove('active');
            dropdown.classList.remove('active');
        }
    });
}

// ========================================
// Toggle All Buttons
// ========================================
function initializeToggleAllButtons() {
    document.querySelectorAll('.toggle-all-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const group = this.dataset.group;
            const checkboxes = document.querySelectorAll(`input[name="${group}"]`);
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            
            checkboxes.forEach(cb => {
                cb.checked = !allChecked;
            });
            
            this.classList.toggle('active', !allChecked);
        });
    });
    
    // Update toggle all button state when checkboxes change
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const group = this.name;
            const toggleBtn = document.querySelector(`.toggle-all-btn[data-group="${group}"]`);
            if (toggleBtn) {
                const checkboxes = document.querySelectorAll(`input[name="${group}"]`);
                const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                toggleBtn.classList.toggle('active', allChecked);
            }
        });
    });
}

// ========================================
// Building Age Filter (Age Slider)
// ========================================
function initializeBuildingAgeFilter() {
    const agePoints = document.querySelectorAll('.age-point');
    const ageSliderLine = document.getElementById('ageSliderLine');
    
    if (!agePoints.length || !ageSliderLine) {
        console.warn('건물 축년 수 필터 초기화 실패: 요소를 찾을 수 없습니다.');
        return;
    }
    
    // 연도 순서 (인덱스 순서)
    const yearOrder = ['all', '1990', '2000', '2010', '2020'];
    let buildingAgeYears = [];
    
    // 초기 상태 설정 - 전체 버튼 활성화
    const allPoint = document.querySelector('.age-point[data-year="all"]');
    if (allPoint) {
        allPoint.classList.add('active');
    }
    updateBuildingAgeSlider();
    
    agePoints.forEach(point => {
        point.addEventListener('click', (e) => {
            e.stopPropagation();
            const year = point.dataset.year;
            const index = parseInt(point.dataset.index);
            
            if (year === 'all') {
                // 전체를 클릭하면 모든 연도 해제
                buildingAgeYears = [];
                agePoints.forEach(p => {
                    if (p.dataset.year !== 'all') {
                        p.classList.remove('active');
                    }
                });
                // 전체 버튼 활성화
                point.classList.add('active');
            } else {
                const yearNum = parseInt(year);
                const isActive = point.classList.contains('active');
                
                if (isActive) {
                    // 이미 선택된 연도를 다시 클릭하면 해당 연도와 그 이상의 모든 연도 해제
                    const yearsToRemove = [];
                    for (let i = index; i < yearOrder.length; i++) {
                        if (yearOrder[i] !== 'all') {
                            const y = parseInt(yearOrder[i]);
                            yearsToRemove.push(y);
                            const correspondingPoint = document.querySelector(`.age-point[data-year="${yearOrder[i]}"]`);
                            if (correspondingPoint) {
                                correspondingPoint.classList.remove('active');
                            }
                        }
                    }
                    buildingAgeYears = buildingAgeYears.filter(y => !yearsToRemove.includes(y));
                } else {
                    // 선택되지 않은 연도를 클릭할 때
                    if (buildingAgeYears.length > 0) {
                        // 이미 선택된 연도가 있으면, 가장 작은 연도부터 클릭한 연도까지 모두 선택
                        const minSelectedYear = Math.min(...buildingAgeYears);
                        const minSelectedIndex = yearOrder.indexOf(minSelectedYear.toString());
                        
                        const selectedYears = [];
                        for (let i = minSelectedIndex; i <= index; i++) {
                            if (yearOrder[i] !== 'all') {
                                const y = parseInt(yearOrder[i]);
                                selectedYears.push(y);
                                const correspondingPoint = document.querySelector(`.age-point[data-year="${yearOrder[i]}"]`);
                                if (correspondingPoint) {
                                    correspondingPoint.classList.add('active');
                                }
                            }
                        }
                        buildingAgeYears = [...new Set([...buildingAgeYears, ...selectedYears])].sort((a, b) => a - b);
                    } else {
                        // 선택된 연도가 없으면, 클릭한 연도 이상의 모든 연도 선택
                        point.classList.add('active');
                        
                        const selectedYears = [];
                        for (let i = index; i < yearOrder.length; i++) {
                            if (yearOrder[i] !== 'all') {
                                const y = parseInt(yearOrder[i]);
                                selectedYears.push(y);
                                const correspondingPoint = document.querySelector(`.age-point[data-year="${yearOrder[i]}"]`);
                                if (correspondingPoint) {
                                    correspondingPoint.classList.add('active');
                                }
                            }
                        }
                        buildingAgeYears = [...new Set([...buildingAgeYears, ...selectedYears])].sort((a, b) => a - b);
                    }
                }
            }
            
            // 전체 버튼 상태 업데이트
            const allPoint = document.querySelector('.age-point[data-year="all"]');
            if (buildingAgeYears.length === 0) {
                if (allPoint) allPoint.classList.add('active');
            } else {
                if (allPoint) allPoint.classList.remove('active');
            }
            
            updateBuildingAgeSlider();
        });
    });
    
    function updateBuildingAgeSlider() {
        if (!ageSliderLine) return;
        
        if (buildingAgeYears.length === 0) {
            ageSliderLine.style.width = '0%';
            ageSliderLine.style.left = '0%';
            return;
        }
        
        const yearOrder = ['1990', '2000', '2010', '2020'];
        const minYear = Math.min(...buildingAgeYears).toString();
        const maxYear = Math.max(...buildingAgeYears).toString();
        
        const minIndex = yearOrder.indexOf(minYear);
        const maxIndex = yearOrder.indexOf(maxYear);
        
        if (minIndex >= 0 && maxIndex >= 0) {
            const totalPoints = yearOrder.length;
            const leftPercent = (minIndex / (totalPoints - 1)) * 100;
            const widthPercent = ((maxIndex - minIndex) / (totalPoints - 1)) * 100;
            
            ageSliderLine.style.left = `${leftPercent}%`;
            ageSliderLine.style.width = `${widthPercent}%`;
        } else {
            // 인덱스를 찾을 수 없는 경우 기본값 설정
            ageSliderLine.style.width = '0%';
            ageSliderLine.style.left = '0%';
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 폼 제출 처리
    const housingForm = document.getElementById('housingForm');
    if (housingForm) {
        housingForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!validateForm()) {
                return;
            }

            // 제출 버튼 비활성화 (중복 제출 방지)
            const submitBtn = this.querySelector('.submit-btn');
            submitBtn.disabled = true;
            
            // 확인 모달 표시
            showConfirmModal();
        });
    }

    // 서비스 선택 버튼
    const serviceSelectBtn = document.querySelector('.service-select-btn');
    if (serviceSelectBtn) {
        serviceSelectBtn.addEventListener('click', function() {
            alert('렌탈서비스 및 기타서비스 선택 창이 열립니다.');
        });
    }

    // 알림 버튼
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            const isActive = this.classList.toggle('active');
            
            if (isActive) {
                this.style.backgroundColor = '#0074E4';
                this.style.color = '#ffffff';
                alert('신규 매물 알림이 활성화되었습니다.');
            } else {
                this.style.backgroundColor = '#f5f5f5';
                this.style.color = '#333';
                alert('신규 매물 알림이 비활성화되었습니다.');
            }
        });
    }

    // 확인 모달 버튼 이벤트
    const confirmOkBtn = document.getElementById('confirmOkBtn');
    const confirmCancelBtn = document.getElementById('confirmCancelBtn');
    const confirmModal = document.getElementById('confirmModal');
    const confirmBackdrop = confirmModal?.querySelector('.modal-backdrop');
    
    if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', function() {
            // 진행 버튼 클릭 시 실제 검색 요청 처리
            processSearchRequest();
        });
    }
    
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', function() {
            // 취소 버튼 클릭 시 모달 닫기 및 버튼 활성화
            hideConfirmModal();
            
            const submitBtn = document.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '검색 요청하기';
            }
        });
    }
    
    // 확인 모달 백드롭 클릭 시 닫기
    if (confirmBackdrop) {
        confirmBackdrop.addEventListener('click', function() {
            hideConfirmModal();
            
            const submitBtn = document.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '검색 요청하기';
            }
        });
    }
    
    // 상태 모달 닫기 버튼 이벤트
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const statusModal = document.getElementById('searchStatusModal');
    const statusBackdrop = statusModal?.querySelector('.modal-backdrop');
    
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', function() {
            hideStatusModal();
            
            // 제출 버튼 활성화
            const submitBtn = document.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '검색 요청하기';
            }
        });
    }
    
    // 상태 모달 백드롭 클릭 시 모달 닫기 (완료/실패 시에만)
    if (statusBackdrop) {
        statusBackdrop.addEventListener('click', function() {
            const modal = document.getElementById('searchStatusModal');
            if (modal && (modal.classList.contains('completed') || modal.classList.contains('error'))) {
                hideStatusModal();
                
                // 제출 버튼 활성화
                const submitBtn = document.querySelector('.submit-btn');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '검색 요청하기';
                }
            }
        });
    }
    // 저장된 데이터 불러오기 (선택사항)
    const savedData = localStorage.getItem('housingFormData');
    if (savedData) {
        console.log('저장된 데이터:', JSON.parse(savedData));
    }

    // 체크박스 그룹 설정
    setupCheckboxGroups();
    
    // 필터 초기화
    initializePriceSelectors();
    initializeWalkingTimeSelector();
    initializeToggleAllButtons();
    initializeBuildingAgeFilter();

    // 개인정보 처리방침 상세보기 링크
    const privacyDetailLink = document.getElementById('privacyDetailLink');
    if (privacyDetailLink) {
        privacyDetailLink.addEventListener('click', function(e) {
            e.preventDefault();
            // TODO: 개인정보 처리방침 모달 또는 페이지로 이동
            alert('개인정보 처리방침 상세 내용을 표시합니다.');
        });
    }

    // 입력 필드 자동 저장 (선택사항)
    const autoSaveFields = ['email'];
    autoSaveFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', function() {
                const tempData = {
                    fieldId: fieldId,
                    value: this.value,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem(`temp_${fieldId}`, JSON.stringify(tempData));
            });

            // 저장된 값 복원
            const tempData = localStorage.getItem(`temp_${fieldId}`);
            if (tempData) {
                const parsed = JSON.parse(tempData);
                field.value = parsed.value;
            }
        }
    });

    // 폼 유효성 검사 실시간 피드백
    const emailField = document.getElementById('email');
    if (emailField) {
        emailField.addEventListener('input', function() {
            if (this.value && !this.value.includes('@')) {
                this.setCustomValidity('올바른 이메일 형식을 입력해주세요.');
            } else {
                this.setCustomValidity('');
            }
        });
    }
});
