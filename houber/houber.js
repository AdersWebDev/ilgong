// 전체선택 기능
function selectAllRegions() {
    alert('전체 지역이 선택되었습니다.');
}

// Custom Select에서 선택된 값 가져오기
function getCustomSelectValue(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return null;
    
    const selectedLi = select.querySelector('.select-dropdown li.selected');
    if (selectedLi && selectedLi.dataset.value) {
        const value = selectedLi.dataset.value;
        return value === '' ? null : parseInt(value);
    }
    
    // selected 클래스가 없을 경우 select-text에서 값 추출
    const selectText = select.querySelector('.select-text')?.textContent;
    if (selectText && selectText !== '제한 없음') {
        const allOptions = select.querySelectorAll('.select-dropdown li');
        for (const li of allOptions) {
            if (li.textContent.trim() === selectText.trim() && li.dataset.value) {
                const value = li.dataset.value;
                return value === '' ? null : parseInt(value);
            }
        }
    }
    
    return null;
}

// 체크박스 그룹에서 선택된 값들 가져오기
function getCheckedValues(name) {
    const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

// 건물 축년 수 수집 (활성화된 연도 중 최소값)
function getMinConstructionYear() {
    const activeAgePoints = document.querySelectorAll('.age-point.active:not([data-year="all"])');
    if (activeAgePoints.length === 0) return null;
    
    const years = Array.from(activeAgePoints)
        .map(point => parseInt(point.dataset.year))
        .filter(year => !isNaN(year));
    
    return years.length > 0 ? Math.min(...years) : null;
}

// 폼 데이터 수집
function collectFormData() {
    const formData = {
        // 필수 필드
        email: document.getElementById('email')?.value.trim() || '',
        visaType: document.getElementById('propertyLocation')?.value || '',
        
        // 가격 범위
        minPrice: getCustomSelectValue('minPriceSelect'),
        maxPrice: getCustomSelectValue('maxPriceSelect'),
        
        // 방 타입
        roomTypes: getCheckedValues('roomType'),
        
        // 건물 구조 타입
        structureTypes: getCheckedValues('structureType'),
        
        // 건물 축년 수
        minConstructionYear: getMinConstructionYear(),
        
        // 희망 지역
        locationTypes: getCheckedValues('locationType'),
        
        // 역까지 최대 소요 시간
        maxWalkingTime: getCustomSelectValue('walkingTimeSelect'),
        
        // 많이 찾는 옵션
        popularOptions: getCheckedValues('popularOptions'),
        
        // 건물 옵션
        buildingOptions: getCheckedValues('buildingOptions')
    };
    
    return formData;
}

// 백엔드 전송용 파라미터 생성 (빈 값 제거)
function prepareBackendParams(formData) {
    const params = {};
    
    // 필수 필드
    if (formData.email) {
        params.email = formData.email;
    }
    
    // 비자 종류 - 숫자형으로 변환
    if (formData.visaType) {
        params.visaType = parseInt(formData.visaType);
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
    
    // 희망 지역 - 숫자형 배열로 변환
    if (formData.locationTypes.length > 0) {
        params.locationTypes = formData.locationTypes.map(val => parseInt(val));
    }
    
    // 역까지 최대 소요 시간
    if (formData.maxWalkingTime !== null) {
        params.maxWalkingTime = formData.maxWalkingTime;
    }
    
    // 많이 찾는 옵션 - 숫자형 배열로 변환
    if (formData.popularOptions.length > 0) {
        params.popularOptions = formData.popularOptions.map(val => parseInt(val));
    }
    
    // 건물 옵션 - 숫자형 배열로 변환
    if (formData.buildingOptions.length > 0) {
        params.buildingOptions = formData.buildingOptions.map(val => parseInt(val));
    }
    
    return params;
}

// 백엔드로 데이터 전송
async function sendToBackend(params) {
    const API_ENDPOINT = 'http://localhost:40011/agent/houber';
    
    console.log('=== 백엔드 전송 ===');
    console.log('엔드포인트:', API_ENDPOINT);
    console.log('전송 파라미터:', JSON.stringify(params, null, 2));
    console.log('전송 방법: POST');
    console.log('Content-Type: application/json');
    
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
        console.log('=== 백엔드 응답 ===');
        console.log(JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error('백엔드 전송 오류:', error);
        throw error;
    }
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

// 이메일 필드 검증
function validateEmail(showErrorOnEmpty = false) {
    const emailField = document.getElementById('email');
    const emailAsterisk = document.getElementById('emailAsterisk');
    if (!emailField) return false;
    
    const email = emailField.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // 클래스 제거 (초기 상태로 복원)
    emailField.classList.remove('error', 'valid');
    if (emailAsterisk) {
        emailAsterisk.classList.remove('error', 'valid');
    }
    
    // 빈 값 처리
    if (!email) {
        if (showErrorOnEmpty) {
            emailField.classList.add('error');
            if (emailAsterisk) {
                emailAsterisk.classList.add('error');
            }
        }
        return false;
    }
    
    // 이메일 형식 검증
    if (!emailRegex.test(email)) {
        emailField.classList.add('error');
        if (emailAsterisk) {
            emailAsterisk.classList.add('error');
        }
        return false;
    }
    
    // 검증 성공
    emailField.classList.add('valid');
    if (emailAsterisk) {
        emailAsterisk.classList.add('valid');
    }
    return true;
}

// 비자 종류 필드 검증
function validateVisaType(showErrorOnEmpty = false) {
    const visaField = document.getElementById('propertyLocation');
    const visaAsterisk = document.getElementById('visaAsterisk');
    if (!visaField) return false;
    
    const value = visaField.value;
    
    // 클래스 제거 (초기 상태로 복원)
    visaField.classList.remove('error', 'valid');
    if (visaAsterisk) {
        visaAsterisk.classList.remove('error', 'valid');
    }
    
    // 빈 값 처리
    if (!value || value === '') {
        if (showErrorOnEmpty) {
            visaField.classList.add('error');
            if (visaAsterisk) {
                visaAsterisk.classList.add('error');
            }
        }
        return false;
    }
    
    // 검증 성공
    visaField.classList.add('valid');
    if (visaAsterisk) {
        visaAsterisk.classList.add('valid');
    }
    return true;
}

// 폼 검증
function validateForm() {
    const email = document.getElementById('email').value.trim();
    const propertyLocation = document.getElementById('propertyLocation').value;
    
    let isValid = true;

    // 이메일 검증 (제출 시에는 빈 값일 때도 에러 표시)
    if (!validateEmail(true)) {
        isValid = false;
        if (!email) {
            alert('이메일을 입력해주세요.');
        } else {
            alert('올바른 이메일 형식을 입력해주세요.');
        }
    }

    // 비자 종류 검증 (제출 시에는 빈 값일 때도 에러 표시)
    if (!validateVisaType(true)) {
        isValid = false;
        if (!propertyLocation || propertyLocation === '') {
            alert('비자 종류를 선택해주세요.');
        }
    }

    // 개인정보 수집 이용 동의 검증
    const privacyAgreement = document.getElementById('privacyAgreement');
    const privacyAgreementSection = document.getElementById('privacyAgreementSection');
    const privacyValidationMessage = document.getElementById('privacyValidationMessage');
    const privacyCheckboxLabel = privacyAgreement?.closest('.privacy-checkbox-label');
    
    if (!privacyAgreement || !privacyAgreement.checked) {
        isValid = false;
        
        // 체크박스에 에러 클래스 추가
        if (privacyCheckboxLabel) {
            privacyCheckboxLabel.classList.add('error');
        }
        
        // 해당 섹션으로 스크롤
        if (privacyAgreementSection) {
            privacyAgreementSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // 약간의 지연 후 포커스 효과
            setTimeout(() => {
                privacyAgreementSection.style.outline = '2px solid #dc3545';
                privacyAgreementSection.style.outlineOffset = '4px';
                privacyAgreementSection.style.borderRadius = '4px';
                
                // 3초 후 outline 제거
                setTimeout(() => {
                    privacyAgreementSection.style.outline = '';
                    privacyAgreementSection.style.outlineOffset = '';
                }, 3000);
            }, 100);
        }
        
        // 검증 메시지 표시
        if (privacyValidationMessage) {
            privacyValidationMessage.style.display = 'block';
        }
        
        // 체크박스에 포커스 (접근성)
        if (privacyAgreement) {
            privacyAgreement.focus();
        }
    } else {
        // 체크되어 있으면 에러 클래스 제거
        if (privacyCheckboxLabel) {
            privacyCheckboxLabel.classList.remove('error');
        }
        // 체크되어 있으면 메시지 숨기기
        if (privacyValidationMessage) {
            privacyValidationMessage.style.display = 'none';
        }
        if (privacyAgreementSection) {
            privacyAgreementSection.style.outline = '';
            privacyAgreementSection.style.outlineOffset = '';
        }
    }

    return isValid;
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
    
    // 초기 상태 설정 - 전체 버튼 활성화
    const allPoint = document.querySelector('.age-point[data-year="all"]');
    if (allPoint) {
        allPoint.classList.add('active');
    }
    updateBuildingAgeSlider();
    
    agePoints.forEach(point => {
        point.addEventListener('click', (e) => {
            e.stopPropagation();
            const clickedIndex = parseInt(point.dataset.index);
            const clickedYear = point.dataset.year;
            
            // "전체" 버튼 클릭 시 모든 버튼 off
            if (clickedYear === 'all') {
                agePoints.forEach(p => {
                    p.classList.remove('active');
                });
                point.classList.add('active');
            } else {
                // "전체" 버튼 off
                const allPoint = document.querySelector('.age-point[data-year="all"]');
                if (allPoint) {
                    allPoint.classList.remove('active');
                }
                
                // 클릭한 버튼 기준으로 좌측은 off, 우측은 on
                agePoints.forEach((p, idx) => {
                    if (idx < clickedIndex) {
                        // 좌측: off
                        p.classList.remove('active');
                    } else if (idx >= clickedIndex) {
                        // 우측(클릭한 버튼 포함): on
                        p.classList.add('active');
                    }
                });
            }
            
            updateBuildingAgeSlider();
        });
    });
    
    function updateBuildingAgeSlider() {
        if (!ageSliderLine) return;
        
        // 활성화된 연도 버튼 찾기 (전체 제외)
        const activeYearPoints = Array.from(agePoints).filter(p => {
            return p.classList.contains('active') && p.dataset.year !== 'all';
        });
        
        if (activeYearPoints.length === 0) {
            ageSliderLine.style.width = '0%';
            ageSliderLine.style.left = '0%';
            return;
        }
        
        // 연도 순서에 따라 정렬
        const yearOrder = ['1990', '2000', '2010', '2020'];
        activeYearPoints.sort((a, b) => {
            const indexA = yearOrder.indexOf(a.dataset.year);
            const indexB = yearOrder.indexOf(b.dataset.year);
            return indexA - indexB;
        });
        
        if (activeYearPoints.length === 0) {
            ageSliderLine.style.width = '0%';
            ageSliderLine.style.left = '0%';
            return;
        }
        
        // 첫 번째와 마지막 활성화된 점의 실제 위치 가져오기
        const firstPoint = activeYearPoints[0];
        const lastPoint = activeYearPoints[activeYearPoints.length - 1];
        
        const track = ageSliderLine.parentElement;
        const trackRect = track.getBoundingClientRect();
        const firstPointRect = firstPoint.getBoundingClientRect();
        const lastPointRect = lastPoint.getBoundingClientRect();
        
        // 점의 중심 위치 계산 (점의 너비가 24px이므로 중심은 12px)
        const pointCenterOffset = 12; // 24px / 2
        const firstPointCenter = firstPointRect.left - trackRect.left + pointCenterOffset;
        const lastPointCenter = lastPointRect.left - trackRect.left + pointCenterOffset;
        
        // 라인의 시작 위치와 너비 계산
        const left = firstPointCenter;
        const width = lastPointCenter - firstPointCenter;
        
        ageSliderLine.style.left = `${left}px`;
        ageSliderLine.style.width = `${width}px`;
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
    // const savedData = localStorage.getItem('housingFormData');
    // if (savedData) {
    //     console.log('저장된 데이터:', JSON.parse(savedData));
    // }

    // 체크박스 그룹 설정
    setupCheckboxGroups();
    
    // 필터 초기화
    initializePriceSelectors();
    initializeWalkingTimeSelector();
    initializeToggleAllButtons();
    initializeBuildingAgeFilter();

    // 개인정보 처리방침 상세보기 링크
    const privacyDetailLink = document.getElementById('privacyDetailLink');
    const privacyModal = document.getElementById('privacyModal');
    const privacyModalCloseBtn = document.getElementById('privacyModalCloseBtn');
    const privacyBackdrop = privacyModal?.querySelector('.modal-backdrop');
    
    function showPrivacyModal() {
        if (privacyModal) {
            privacyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hidePrivacyModal() {
        if (privacyModal) {
            privacyModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }
    
    if (privacyDetailLink) {
        privacyDetailLink.addEventListener('click', function(e) {
            e.preventDefault();
            showPrivacyModal();
        });
    }
    
    if (privacyModalCloseBtn) {
        privacyModalCloseBtn.addEventListener('click', function() {
            hidePrivacyModal();
        });
    }
    
    if (privacyBackdrop) {
        privacyBackdrop.addEventListener('click', function() {
            hidePrivacyModal();
        });
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && privacyModal && privacyModal.classList.contains('active')) {
            hidePrivacyModal();
        }
    });

    // 개인정보 수집 이용 동의 체크박스 이벤트
    const privacyAgreement = document.getElementById('privacyAgreement');
    const privacyValidationMessage = document.getElementById('privacyValidationMessage');
    const privacyAgreementSection = document.getElementById('privacyAgreementSection');
    const privacyCheckboxLabel = privacyAgreement?.closest('.privacy-checkbox-label');
    
    if (privacyAgreement) {
        privacyAgreement.addEventListener('change', function() {
            if (this.checked) {
                // 체크되면 에러 클래스 제거
                if (privacyCheckboxLabel) {
                    privacyCheckboxLabel.classList.remove('error');
                }
                // 체크되면 메시지 숨기기
                if (privacyValidationMessage) {
                    privacyValidationMessage.style.display = 'none';
                }
                if (privacyAgreementSection) {
                    privacyAgreementSection.style.outline = '';
                    privacyAgreementSection.style.outlineOffset = '';
                }
            }
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

    // 이메일 필드 실시간 검증
    const emailField = document.getElementById('email');
    const emailAsterisk = document.getElementById('emailAsterisk');
    if (emailField) {
        // input 이벤트: 입력 중 실시간 검증 (값이 있을 때만)
        emailField.addEventListener('input', function() {
            if (this.value.trim()) {
                validateEmail();
            } else {
                // 빈 값이면 클래스 제거하여 기본 상태로
                this.classList.remove('error', 'valid');
                if (emailAsterisk) {
                    emailAsterisk.classList.remove('error', 'valid');
                }
            }
        });
        
        // blur 이벤트: 포커스 잃을 때 검증
        emailField.addEventListener('blur', function() {
            validateEmail();
        });
    }
    
    // 비자 종류 필드 실시간 검증
    const visaField = document.getElementById('propertyLocation');
    if (visaField) {
        // change 이벤트: 선택 변경 시 검증
        visaField.addEventListener('change', function() {
            validateVisaType();
        });
    }
});
