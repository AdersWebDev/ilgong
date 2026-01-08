const API_ENDPOINT = 'https://www.houberapp.com';
// 폼 데이터 수집 및 백엔드 전송용 파라미터 생성
function collectFormData() {
    // #region agent log


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
    // #endregion
    roomTypeCheckboxes.forEach(cb => {
        formData.roomTypes.push(cb.value);
    });

    // 건물 구조 타입 수집
    const structureTypeCheckboxes = document.querySelectorAll('input[name="structureType"]:checked');
    // #region agent log
    // #endregion
    structureTypeCheckboxes.forEach(cb => {
        formData.structureTypes.push(cb.value);
    });

    // 건물 축년 수 수집 (최소 연도만)
    const activeAgePoints = document.querySelectorAll('.age-point.active:not([data-year="all"])');
    // #region agent log
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
    // #endregion
    locationTypeCheckboxes.forEach(cb => {
        formData.locationTypes.push(cb.value);
    });

    // 많이 찾는 옵션 수집
    const popularOptionsCheckboxes = document.querySelectorAll('input[name="popularOptions"]:checked');
    // #region agent log
    // #endregion
    popularOptionsCheckboxes.forEach(cb => {
        formData.popularOptions.push(cb.value);
    });

    // 건물 옵션 수집
    const buildingOptionsCheckboxes = document.querySelectorAll('input[name="buildingOptions"]:checked');
    // #region agent log
    // #endregion
    buildingOptionsCheckboxes.forEach(cb => {
        formData.buildingOptions.push(cb.value);
    });

    // 역까지 최대 소요 시간 수집
    const walkingTimeSelect = document.getElementById('walkingTimeSelect');
    // #region agent log
    const walkingTimeText = walkingTimeSelect?.querySelector('.select-text')?.textContent || 'not found';
    const walkingTimeSelected = walkingTimeSelect?.querySelector('.select-dropdown li.selected');
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
    
    // 희망 지역
    if (formData.locationTypes.length > 0) {
        params.locationTypes = formData.locationTypes.map(loc => parseInt(loc));
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



// 백엔드로 데이터 전송
async function sendToBackend(params) {
    const emailInput = document.getElementById('email');
    const email = emailInput ? emailInput.value.trim() : '';
    
    // 모달 먼저 표시
    const modal = document.getElementById('searchStatusModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    // 60까지 진행시키는 시뮬레이션
    const flowSequence = [5, 10, 20, 30, 60];
    
    // 진행 애니메이션 실행
    for (let i = 0; i < flowSequence.length; i++) {
        const flow = flowSequence[i];
        updateStatusModal({
            status: 'processing',
            flow: flow,
            progress: flow,
            message: getStatusMessageByFlow(flow),
            details: '',
            email: email
        });
        if (i < flowSequence.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800)); // 각 단계마다 0.8초
        }
    }
    
    // 백엔드 요청 전송 (60까지 진행한 후)
    try {
        const response = await fetch(API_ENDPOINT + '/agent/houber', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params)
        });
        
        if (!response.ok) {
            // 에러 발생 시 모달 닫기
            hideStatusModal();
            
            // 제출 버튼 다시 활성화
            const submitBtn = document.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = '검색 요청하기';
            }
            
            if (response.status === 400) {
                alert('메일 주소로 발송이 실패했습니다. 주소를 다시 확인해주세요');
            } else if (response.status === 404) {
                alert('현재 조건에 맞는 건물을 찾을 수 없어요.');
            }
             else {
                alert('요청 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
            return;
        }
        
        // 성공 시 응답에서 건물 개수 추출 (숫자만 바디로 넘어옴)
        const responseText = await response.text();
        const buildingCount = parseInt(responseText) || 0;
        
        // 성공 시 나머지 진행 (70, 80, 100)
        const successFlowSequence = [70, 80, 100];
        for (let i = 0; i < successFlowSequence.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 간격
            const flow = successFlowSequence[i];
            updateStatusModal({
                status: flow === 100 ? 'completed' : 'processing',
                flow: flow,
                progress: flow,
                message: getStatusMessageByFlow(flow, buildingCount),
                details: flow === 80 ? getStatusDetailsByFlow(flow, email) : '',
                email: email
            });
        }
        
    } catch (error) {
        // 네트워크 오류 등
        hideStatusModal();
        console.error('백엔드 전송 오류:', error);
        
        // 제출 버튼 다시 활성화
        const submitBtn = document.querySelector('.submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = '검색 요청하기';
        }
        
        alert('요청 전송 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
    }
}

// ========================================
// 검색 상태 확인 (폴링) - 더 이상 사용하지 않음
// ========================================

// Flow 넘버에 따른 메시지 반환
function getStatusMessageByFlow(flow, count) {
    const flowMessages = {
        'start': '검색 요청을 발송했어요! 조건에 대한 10개의 건물을 보내드릴게요',
        5: '프로세스 신청 대기 중',
        10: '프로세스 시작 중 ...',
        20: '요청사항 분석 중 ...',
        30: '데이터베이스 추합 중...',
        60: '실제 공실 갱신 중...',
        70: '예쁘게 포장 중',
        80: '건물 {}개를 찾았어요',
        100: '건물 {}개를 찾았어요,<br> 도착까지 약간의 시간이 소요될 수 있습니다',
        '-1': '에러 발생 요청을 강제 종료합니다'
    };
    
    let message = flowMessages[flow] || flowMessages[flow.toString()] || '처리 중...';
    
    // 숫자가 필요한 메시지(80, 100)에 count 값 치환
    if ((flow === 80 || flow === 100) && count !== undefined && count !== null) {
        message = message.replace('{}', count);
    }
    
    return message;
}

// Flow 넘버에 따른 상세 정보 반환
function getStatusDetailsByFlow(flow, email) {
    if (flow === 80 && email) {
        return `발송메일: ${email}`;
    }
    return '';
}

// 폴링 관련 함수들 - 더 이상 사용하지 않음

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
function showStatusModal() {
    // 이 함수는 더 이상 사용하지 않음 (sendToBackend에서 직접 처리)
    // 호환성을 위해 유지하지만 실제로는 아무 동작도 하지 않음
}

function hideStatusModal() {
    const modal = document.getElementById('searchStatusModal');
    if (!modal) return;
    
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
    const message = statusData.message || '처리 중...';
    // HTML 태그가 포함된 경우 innerHTML 사용, 아니면 textContent 사용
    if (message.includes('<br>') || message.includes('<br/>') || message.includes('<br />')) {
        statusMessage.innerHTML = message;
    } else {
        statusMessage.textContent = message;
    }
    
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
        const completedMessage = statusData.message || getStatusMessageByFlow(100);
        if (completedMessage.includes('<br>') || completedMessage.includes('<br/>') || completedMessage.includes('<br />')) {
            statusMessage.innerHTML = completedMessage;
        } else {
            statusMessage.textContent = completedMessage;
        }
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

// 에러 표시 제거 함수
function clearErrors() {
    const emailInput = document.getElementById('email');
    const propertyLocationSelect = document.getElementById('propertyLocation');
    const privacyAgreement = document.getElementById('privacyAgreement');

    if (emailInput) {
        emailInput.style.borderColor = '';
    }
    if (propertyLocationSelect) {
        propertyLocationSelect.style.borderColor = '';
    }
    if (privacyAgreement) {
        const privacyLabel = privacyAgreement.closest('.privacy-checkbox-label');
        const checkboxCustom = privacyAgreement.nextElementSibling;
        if (privacyLabel) {
            privacyLabel.style.animation = '';
        }
        if (checkboxCustom && checkboxCustom.classList.contains('checkbox-custom')) {
            checkboxCustom.style.borderColor = '';
        }
    }
}

// 필드로 스크롤 이동 및 에러 표시
function showFieldError(element, message) {
    if (!element) {
        console.error('showFieldError: element is null or undefined');
        return;
    }
    
    // 기존 에러 제거
    clearErrors();
    
    // 직접 border-color를 빨간색으로 설정
    if (element.id === 'email') {
        element.style.borderColor = '#dc3545';
    } else if (element.id === 'propertyLocation') {
        element.style.borderColor = '#dc3545';
    } else if (element.id === 'privacyAgreement') {
        const checkboxCustom = element.nextElementSibling; // checkbox-custom은 체크박스 바로 다음 형제
        if (checkboxCustom && checkboxCustom.classList.contains('checkbox-custom')) {
            checkboxCustom.style.borderColor = '#dc3545';
        }
    }
    
    // 해당 필드로 스크롤 이동
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // 2초 후 에러 제거
    setTimeout(() => {
        clearErrors();
    }, 3000);
    
    // 알림 표시
    // if (message) {
    //     alert(message);
    // }
}

// 폼 검증
function validateForm() {
    const emailInput = document.getElementById('email');
    if (!emailInput) {
        console.error('Email input not found');
        return false;
    }
    const email = emailInput.value.trim();
    
    const propertyLocationSelect = document.getElementById('propertyLocation');
    if (!propertyLocationSelect) {
        console.error('Property location select not found');
        return false;
    }
    const propertyLocation = propertyLocationSelect.value;

    if (!email) {
        showFieldError(emailInput, '이메일을 입력해주세요.');
        return false;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showFieldError(emailInput, '올바른 이메일 형식을 입력해주세요.');
        return false;
    }

    if (!propertyLocation || propertyLocation === '') {
        showFieldError(propertyLocationSelect, '비자 종류를 선택해주세요.');
        return false;
    }

    // 개인정보 수집 이용 동의 검증
    const privacyAgreement = document.getElementById('privacyAgreement');
    if (!privacyAgreement) {
        console.error('Privacy agreement checkbox not found');
        return false;
    }
    if (!privacyAgreement.checked) {
        showFieldError(privacyAgreement, '개인정보 수집 이용 동의에 체크해주세요.');
        return false;
    }

    // 모든 검증 통과 시 에러 제거
    clearErrors();
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
    
    // 백엔드로 데이터 전송
    await sendToBackend(backendParams);
        
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 필드 입력/변경 시 에러 상태 제거
    const emailInput = document.getElementById('email');
    const propertyLocationSelect = document.getElementById('propertyLocation');
    const privacyAgreement = document.getElementById('privacyAgreement');

    if (emailInput) {
        emailInput.addEventListener('input', function() {
            this.style.borderColor = '';
            this.style.animation = '';
        });
    }

    if (propertyLocationSelect) {
        propertyLocationSelect.addEventListener('change', function() {
            this.style.borderColor = '';
            this.style.animation = '';
        });
    }

    if (privacyAgreement) {
        privacyAgreement.addEventListener('change', function() {
            const privacyLabel = this.closest('.privacy-checkbox-label');
            const checkboxCustom = this.nextElementSibling;
            if (privacyLabel) {
                privacyLabel.style.animation = '';
            }
            if (checkboxCustom && checkboxCustom.classList.contains('checkbox-custom')) {
                checkboxCustom.style.borderColor = '';
            }
        });
    }

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
    
    // 초기 업데이트 (약간의 지연을 두어 레이아웃이 완전히 로드된 후 실행)
    setTimeout(() => {
        updateBuildingAgeSlider();
    }, 100);
    
    // 리사이즈 시 선 위치 업데이트
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateBuildingAgeSlider();
        }, 100);
    });
    
    agePoints.forEach(point => {
        point.addEventListener('click', (e) => {
            e.stopPropagation();
            const year = point.dataset.year;
            const clickedIndex = parseInt(point.dataset.index);
            
            if (year === 'all') {
                // 전체를 클릭하면 모든 연도 해제
                agePoints.forEach(p => {
                    p.classList.remove('active');
                });
                // 전체 버튼만 활성화
                point.classList.add('active');
            } else {
                // 전체 버튼 해제
                const allPoint = document.querySelector('.age-point[data-year="all"]');
                if (allPoint) {
                    allPoint.classList.remove('active');
                }
                
                // 클릭한 버튼의 좌측은 모두 off, 우측(자신 포함)은 모두 on
                agePoints.forEach(p => {
                    const pIndex = parseInt(p.dataset.index);
                    if (pIndex < clickedIndex) {
                        // 좌측: 모두 off
                        p.classList.remove('active');
                    } else if (pIndex >= clickedIndex && p.dataset.year !== 'all') {
                        // 우측(자신 포함): 모두 on (전체 버튼 제외)
                        p.classList.add('active');
                    }
                });
            }
            
            updateBuildingAgeSlider();
        });
    });
    
    function updateBuildingAgeSlider() {
        if (!ageSliderLine) return;
        
        // 활성화된 버튼들 중에서 'all' 제외한 연도 버튼들 찾기
        const activeYearPoints = Array.from(agePoints).filter(p => 
            p.classList.contains('active') && p.dataset.year !== 'all'
        );
        
        if (activeYearPoints.length === 0) {
            // 활성화된 연도 버튼이 없으면 선 숨김
            ageSliderLine.style.width = '0%';
            ageSliderLine.style.left = '0%';
            return;
        }
        
        // 트랙의 실제 위치와 너비 가져오기
        const track = ageSliderLine.parentElement;
        const trackRect = track.getBoundingClientRect();
        const trackWidth = trackRect.width;
        
        // 첫 번째와 마지막 활성화된 버튼 찾기
        const sortedActivePoints = activeYearPoints.sort((a, b) => {
            return parseInt(a.dataset.index) - parseInt(b.dataset.index);
        });
        
        const firstButton = sortedActivePoints[0];
        const lastButton = sortedActivePoints[sortedActivePoints.length - 1];
        
        // 각 버튼의 중심점 위치 계산
        const firstButtonRect = firstButton.getBoundingClientRect();
        const lastButtonRect = lastButton.getBoundingClientRect();
        
        const firstButtonCenter = firstButtonRect.left + firstButtonRect.width / 2;
        const lastButtonCenter = lastButtonRect.left + lastButtonRect.width / 2;
        
        // 트랙 기준으로 상대 위치 계산
        const trackLeft = trackRect.left;
        const lineStart = firstButtonCenter - trackLeft;
        const lineEnd = lastButtonCenter - trackLeft;
        
        // 퍼센트로 변환
        const leftPercent = (lineStart / trackWidth) * 100;
        const widthPercent = ((lineEnd - lineStart) / trackWidth) * 100;
        
        ageSliderLine.style.left = `${leftPercent}%`;
        ageSliderLine.style.width = `${widthPercent}%`;
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

    // 개인정보 처리방침 모달 열기/닫기 함수
    function showPrivacyModal() {
        const privacyModal = document.getElementById('privacyModal');
        if (privacyModal) {
            privacyModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function hidePrivacyModal() {
        const privacyModal = document.getElementById('privacyModal');
        if (privacyModal) {
            privacyModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // 개인정보 처리방침 상세보기 링크
    const privacyDetailLink = document.getElementById('privacyDetailLink');
    if (privacyDetailLink) {
        privacyDetailLink.addEventListener('click', function(e) {
            e.preventDefault();
            showPrivacyModal();
        });
    }

    // 모달 닫기 버튼
    const privacyModalCloseBtn = document.getElementById('privacyModalCloseBtn');
    if (privacyModalCloseBtn) {
        privacyModalCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hidePrivacyModal();
        });
    }

    // 모달 밖 클릭 시 닫기
    if (privacyModal) {
        const modalContent = privacyModal.querySelector('.modal-content');
        if (modalContent) {
            // modal-content 클릭 시 이벤트 전파 방지
            modalContent.addEventListener('click', function(e) {
                e.stopPropagation();
            });
        }
        // 모달 배경(backdrop) 클릭 시 닫기
        privacyModal.addEventListener('click', function(e) {
            if (e.target === privacyModal || e.target.classList.contains('modal-backdrop')) {
                hidePrivacyModal();
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
