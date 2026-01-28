
// ============================================
// API 설정
// ============================================

const API_BASE_URL = 'http://localhost:40011';

// ============================================
// API 함수
// ============================================

// 이벤트 목록 조회
async function fetchEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/aders/hot-deal/list`);

        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }

        const events = await response.json();
        return events;
    } catch (error) {
        console.error('이벤트 목록 조회 API 오류:', error);
        throw error;
    }
}
async function fetchEventDetail(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/aders/hot-deal/${eventId}`);
        if (!response.ok) {
            throw new Error(`서버 오류: ${response.status}`);
        }
        const event = await response.json();
        return event;
    } catch (error) {
        console.error('이벤트 상세 조회 API 오류:', error);
        throw error;
    }
}

async function createEvent(eventData) {
    // FormData 생성
    const formData = new FormData();

    // 기본 필드 추가
    formData.append('name', eventData.title);
    formData.append('description', eventData.description);

    // 날짜를 LocalDateTime 형식으로 변환 (YYYY-MM-DDTHH:mm:ss)
    // datetime-local input은 YYYY-MM-DDTHH:mm 형식으로 반환
    // 분과 초는 00:00으로 고정
    const startDateTime = eventData.startDate.includes('T')
        ? eventData.startDate + ':00'
        : eventData.startDate + 'T00:00:00';
    const endDateTime = eventData.endDate.includes('T')
        ? eventData.endDate + ':00'
        : eventData.endDate + 'T00:00:00';

    formData.append('strDate', startDateTime);
    formData.append('finDate', endDateTime);

    // 상태 (기본적으로 활성화) - 문자열로 전송 (Spring이 자동 변환)
    formData.append('status', 'true');

    // 이미지 파일 추가
    if (eventData.imageFile instanceof File) {
        formData.append('image', eventData.imageFile);
    }

    // buildingIds 추가
    if (eventData.buildings && eventData.buildings.length > 0) {
        eventData.buildings.forEach((building, index) => {
            formData.append(`buildingIds[${index}].originalId`, building.id);
            formData.append(`buildingIds[${index}].producer`, building.producer);
        });
    }

    // 디버깅: FormData 내용 확인
    console.log('=== FormData 전송 내용 ===');
    for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
    }

    try {
        // FormData를 사용하면 Content-Type이 자동으로 multipart/form-data로 설정됨
        // 명시적으로 헤더를 설정하지 않아야 브라우저가 boundary를 자동으로 추가함
        const response = await fetch(`${API_BASE_URL}/aders/hot-deal`, {
            method: 'POST',
            body: formData
            // Content-Type 헤더를 명시적으로 설정하지 않음
            // 브라우저가 자동으로 multipart/form-data와 boundary를 설정함
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`서버 오류: ${response.status} - ${errorText}`);
        }

        // 200 응답 처리 - 바디가 있으면 파싱, 없으면 null 반환
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (text && text.trim()) {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return null;
                }
            }
        }
        // 바디가 없거나 JSON이 아닌 경우 null 반환
        return null;
    } catch (error) {
        console.error('이벤트 생성 API 오류:', error);
        throw error;
    }
}

async function updateEvent(eventId, eventData) {
    // FormData 생성
    const formData = new FormData();

    // ID 추가
    formData.append('id', eventId);

    // 기본 필드 추가
    formData.append('name', eventData.title);
    formData.append('description', eventData.description);

    // 날짜를 LocalDateTime 형식으로 변환 (YYYY-MM-DDTHH:mm:ss)
    // datetime-local input은 YYYY-MM-DDTHH:mm 형식으로 반환
    // 분과 초는 00:00으로 고정
    const startDateTime = eventData.startDate.includes('T')
        ? eventData.startDate + ':00'
        : eventData.startDate + 'T00:00:00';
    const endDateTime = eventData.endDate.includes('T')
        ? eventData.endDate + ':00'
        : eventData.endDate + 'T00:00:00';

    formData.append('strDate', startDateTime);
    formData.append('finDate', endDateTime);

    // 상태는 기존 상태 유지 (수정 시에는 변경하지 않음)
    // 필요시 폼에서 가져올 수 있음
    // formData.append('status', 'true');

    // 이미지 파일 추가 (새로운 파일이 있으면 추가, 없으면 FormData에 추가하지 않음)
    // FormData에 추가하지 않으면 Spring이 null로 처리하여 기존 이미지 유지
    if (eventData.imageFile instanceof File) {
        formData.append('image', eventData.imageFile);
    }
    // 이미지가 없으면 FormData에 추가하지 않음 (서버가 기존 이미지 유지 처리)

    // buildingIds 추가
    if (eventData.buildings && eventData.buildings.length > 0) {
        eventData.buildings.forEach((building, index) => {
            formData.append(`buildingIds[${index}].originalId`, building.id);
            formData.append(`buildingIds[${index}].producer`, building.producer);
        });
    }

    // 디버깅: FormData 내용 확인
    console.log('=== FormData 수정 전송 내용 ===');
    for (let pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`);
    }

    try {
        // FormData를 사용하면 Content-Type이 자동으로 multipart/form-data로 설정됨
        // 명시적으로 헤더를 설정하지 않아야 브라우저가 boundary를 자동으로 추가함
        const response = await fetch(`${API_BASE_URL}/aders/hot-deal`, {
            method: 'PATCH',
            body: formData
            // Content-Type 헤더를 명시적으로 설정하지 않음
            // 브라우저가 자동으로 multipart/form-data와 boundary를 설정함
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`서버 오류: ${response.status} - ${errorText}`);
        }

        // 200 응답 처리 - 바디가 있으면 파싱, 없으면 null 반환
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const text = await response.text();
            if (text && text.trim()) {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return null;
                }
            }
        }
        // 바디가 없거나 JSON이 아닌 경우 null 반환
        return null;
    } catch (error) {
        console.error('이벤트 수정 API 오류:', error);
        throw error;
    }
}

async function endEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/aders/hot-deal/${eventId}/status?status=false`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`서버 오류: ${response.status} - ${errorText}`);
        }

        // 200 응답이면 성공 (바디 없음)
        return null;
    } catch (error) {
        console.error('이벤트 중지 API 오류:', error);
        throw error;
    }
}

async function resumeEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/aders/hot-deal/${eventId}/status?status=true`, {
            method: 'PATCH'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`서버 오류: ${response.status} - ${errorText}`);
        }

        // 200 응답이면 성공 (바디 없음)
        return null;
    } catch (error) {
        console.error('이벤트 시작 API 오류:', error);
        throw error;
    }
}

async function deleteEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/aders/hot-deal/${eventId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`서버 오류: ${response.status} - ${errorText}`);
        }

        // 200 응답이면 성공 (바디 없음)
        return null;
    } catch (error) {
        console.error('이벤트 시작 API 오류:', error);
        throw error;
    }
}

// ============================================
// 건물 검색 기능 (실제 API 사용)
// ============================================

let selectedBuildings = [];
let searchResults = [];
let searchTimeout = null;
let selectedSearchIndex = -1;

async function searchBuildings(query) {
    if (!query || query.trim().length === 0) {
        return [];
    }

    try {
        const url = `${API_BASE_URL}/map/rent/search?q=${encodeURIComponent(query)}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`검색 요청 실패: ${response.status}`);
        }

        const results = await response.json();
        return results;
    } catch (error) {
        console.error('건물 검색 오류:', error);
        return [];
    }
}

function debounce(func, wait) {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(searchTimeout);
            func(...args);
        };
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(later, wait);
    };
}

// ============================================
// UI 상태 관리
// ============================================

const modal = document.getElementById('eventModal');
const eventForm = document.getElementById('eventForm');
const eventsTableContainer = document.getElementById('eventsTableContainer');
const eventsTableBody = document.getElementById('eventsTableBody');
const emptyState = document.getElementById('emptyState');
const buildingSearch = document.getElementById('buildingSearch');
const buildingDropdown = document.getElementById('buildingDropdown');
const buildingSelected = document.getElementById('buildingSelected');
const buildingSelectedText = document.getElementById('buildingSelectedText');
const imagePreview = document.getElementById('imagePreview');
const previewImage = document.getElementById('previewImage');
const eventImage = document.getElementById('eventImage');
let currentEventId = null;

// ============================================
// 이벤트 목록 렌더링
// ============================================

function renderEvents(events) {
    if (!events || events.length === 0) {
        eventsTableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    eventsTableContainer.style.display = 'block';
    emptyState.style.display = 'none';

    eventsTableBody.innerHTML = events.map(event => `
        <tr class="event-row ${!event.status ? 'event-inactive' : ''}">
            <td class="event-table-id">${event.id}</td>
            <td class="event-table-title">
                ${!event.status ? '<span class="event-status-badge inactive">중지됌</span>' : '<span class="event-status-badge active">진행중</span>'}
                ${escapeHtml(event.name)}
            </td>
            <td class="event-table-image">
                <img src="${event.imageUrl || ''}" alt="${escapeHtml(event.name)}" class="event-table-thumbnail" onerror="this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='">
            </td>
            <td class="event-table-period">
                ${formatDate(event.strDate)} ~ <br> ${formatDate(event.finDate)}
            </td>
            <td class="event-table-actions">
                <div class="event-actions-group">
                    <button class="btn-secondary" onclick="handleEditEvent('${event.id}')">수정</button>
                    ${event.status
            ? `<button class="btn-warning" onclick="handleEndEvent('${event.id}')">중지</button>`
            : `<button class="btn-success" onclick="handleResumeEvent('${event.id}')">시작</button>`
        }
                    <button class="btn-danger" onclick="handleDeleteEvent('${event.id}')">삭제</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';

    try {
        // LocalDateTime 형식 (YYYY-MM-DDTHH:mm:ss) 처리
        let date;
        if (dateString.includes('T')) {
            // ISO 형식이면 그대로 파싱
            date = new Date(dateString);
        } else {
            // 날짜만 있으면 파싱
            date = new Date(dateString);
        }

        // 유효한 날짜인지 확인
        if (isNaN(date.getTime())) {
            return '';
        }

        // 시간까지만 표시 (년/월/일/시)
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('날짜 파싱 오류:', error, dateString);
        return '';
    }
}

// ============================================
// 모달 관리
// ============================================

function openModal(eventId = null) {
    currentEventId = eventId;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const eventImageInput = document.getElementById('eventImage');
    
    if (eventId) {
        // 수정 모드 - 이미지는 선택사항
        document.getElementById('modalTitle').textContent = '이벤트 수정';
        eventImageInput.removeAttribute('required');
    } else {
        // 추가 모드 - 이미지는 필수
        document.getElementById('modalTitle').textContent = '이벤트 추가';
        eventImageInput.setAttribute('required', 'required');
        eventForm.reset();
        resetForm();
    }
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    resetForm();
}

function resetForm() {
    eventForm.reset();
    imagePreview.classList.remove('active');
    buildingSelected.classList.remove('active');
    selectedBuildings = [];
    buildingSearch.value = '';
    buildingSearch.disabled = false;
    buildingDropdown.classList.remove('active');
    selectedSearchIndex = -1;
    renderSelectedBuildings();
    clearFormErrors();
}

// 날짜시간 입력의 분을 00으로 강제 설정
function enforceMinuteToZero(inputId) {
    const dateInput = document.getElementById(inputId);
    if (dateInput) {
        // datetime-local 형식에서 분을 00으로 설정
        let value = dateInput.value;
        if (value && value.includes('T')) {
            const [datePart, timePart] = value.split('T');
            if (timePart) {
                const parts = timePart.split(':');
                const hour = parts[0] || '00';
                const minute = parts[1] || '00';
                // 분이 00이 아니면 강제로 00으로 설정
                if (minute !== '00') {
                    dateInput.value = `${datePart}T${hour.padStart(2, '0')}:00`;
                    // 값이 변경되었음을 알리기 위해 이벤트 발생
                    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    }
}

// 종료일시의 분과 초를 00:00으로 강제 설정 (하위 호환성)
function enforceEndDateTimeFormat() {
    enforceMinuteToZero('eventEndDate');
}

// ============================================
// 건물 검색 UI
// ============================================

function isBuildingSelected(building) {
    return selectedBuildings.some(b => b.id === building.id && b.producer === building.producer);
}

async function performSearch() {
    const query = buildingSearch.value.trim();

    if (!query) {
        buildingDropdown.classList.remove('active');
        return;
    }

    // 로딩 상태 표시
    buildingDropdown.innerHTML = '<div class="form-search-loading">검색 중...</div>';
    buildingDropdown.classList.add('active');

    const results = await searchBuildings(query);
    searchResults = results;

    if (results.length === 0) {
        buildingDropdown.innerHTML = '<div class="form-search-no-results">검색 결과가 없습니다.</div>';
        buildingDropdown.classList.add('active');
        return;
    }

    buildingDropdown.innerHTML = results.map((result, index) => {
        const isSelected = isBuildingSelected(result);
        return `
        <div class="form-search-item ${isSelected ? 'selected-disabled' : ''}" data-index="${index}" tabindex="0">
            <div class="form-search-item-icon">🏢</div>
            <div class="form-search-item-content">
                <div class="form-search-item-name">
                    ${escapeHtml(result.name)}
                    ${isSelected ? '<span class="form-search-item-badge">이미 선택됨</span>' : ''}
                </div>
                <div class="form-search-item-meta">ID: ${result.id} | Producer: ${result.producer}</div>
            </div>
        </div>
    `;
    }).join('');

    buildingDropdown.classList.add('active');
    selectedSearchIndex = -1;

    // 검색 결과 클릭 이벤트
    buildingDropdown.querySelectorAll('.form-search-item').forEach((item, index) => {
        const result = results[index];
        if (!isBuildingSelected(result)) {
            item.addEventListener('click', () => {
                selectBuilding(result);
            });
        } else {
            item.style.cursor = 'not-allowed';
        }
    });
}

// 입력 중 자동 검색 (debounce 적용)
const debouncedSearch = debounce(async (query) => {
    await performSearch();
}, 300);

buildingSearch.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length === 0) {
        buildingDropdown.classList.remove('active');
        return;
    }
    debouncedSearch(query);
});

buildingSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedSearchIndex >= 0 && searchResults[selectedSearchIndex]) {
            const result = searchResults[selectedSearchIndex];
            if (!isBuildingSelected(result)) {
                // 선택된 항목이 있으면 선택
                selectBuilding(result);
            }
        } else {
            // 검색 실행
            clearTimeout(searchTimeout);
            performSearch();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (searchResults.length > 0) {
            selectedSearchIndex = Math.min(selectedSearchIndex + 1, searchResults.length - 1);
            updateSelectedSearchItem();
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (searchResults.length > 0) {
            selectedSearchIndex = Math.max(selectedSearchIndex - 1, -1);
            updateSelectedSearchItem();
        }
    } else if (e.key === 'Escape') {
        buildingDropdown.classList.remove('active');
        selectedSearchIndex = -1;
    }
});

function updateSelectedSearchItem() {
    const items = buildingDropdown.querySelectorAll('.form-search-item');
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedSearchIndex);
        if (index === selectedSearchIndex) {
            item.scrollIntoView({ block: 'nearest' });
        }
    });
}

document.addEventListener('click', (e) => {
    if (!buildingSearch.contains(e.target) && !buildingDropdown.contains(e.target)) {
        buildingDropdown.classList.remove('active');
    }
});

function selectBuilding(building) {
    // 중복 체크
    if (isBuildingSelected(building)) {
        return;
    }

    selectedBuildings.push(building);
    buildingSearch.value = '';
    buildingDropdown.classList.remove('active');
    selectedSearchIndex = -1;
    renderSelectedBuildings();
    hideFormError('buildingError');
    buildingSearch.focus();
}

function removeBuilding(buildingId, producer) {
    selectedBuildings = selectedBuildings.filter(b => !(b.id === buildingId && b.producer === producer));
    renderSelectedBuildings();
    // 검색 결과가 열려있으면 다시 렌더링
    if (buildingDropdown.classList.contains('active') && buildingSearch.value.trim()) {
        performSearch();
    }
}

function renderSelectedBuildings() {
    if (selectedBuildings.length === 0) {
        buildingSelected.classList.remove('active');
        return;
    }

    buildingSelected.classList.add('active');
    buildingSelectedText.innerHTML = selectedBuildings.map((building, index) => `
        <div class="form-search-selected-item">
            <div class="form-search-selected-item-content">
                <div class="form-search-selected-name">${escapeHtml(building.name)}</div>
                <div class="form-search-selected-info">ID: ${building.id} | Producer: ${building.producer}</div>
            </div>
            <button type="button" class="form-search-selected-item-remove" onclick="removeBuildingFromList(${building.id}, '${building.producer}')" title="제거">×</button>
        </div>
    `).join('');
}

window.removeBuildingFromList = function (buildingId, producer) {
    removeBuilding(buildingId, producer);
};

// ============================================
// 이미지 업로드 및 미리보기
// ============================================

eventImage.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.type !== 'image/png') {
            showFormError('imageError', 'PNG 파일만 업로드 가능합니다.');
            eventImage.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            previewImage.src = e.target.result;
            imagePreview.classList.add('active');
            hideFormError('imageError');
        };
        reader.readAsDataURL(file);
    }
});

// ============================================
// 폼 유효성 검사
// ============================================

function validateForm() {
    let isValid = true;

    // 제목 검사
    const title = document.getElementById('eventTitle').value.trim();
    if (!title) {
        showFormError('titleError');
        isValid = false;
    } else {
        hideFormError('titleError');
    }

    // 설명 검사
    const description = document.getElementById('eventDescription').value.trim();
    if (!description) {
        showFormError('descriptionError');
        isValid = false;
    } else {
        hideFormError('descriptionError');
    }

    // 시작일시 검사
    const startDate = document.getElementById('eventStartDate').value;
    if (!startDate) {
        showFormError('startDateError');
        isValid = false;
    } else {
        hideFormError('startDateError');
    }

    // 종료일시 검사
    const endDate = document.getElementById('eventEndDate').value;
    if (!endDate) {
        showFormError('endDateError');
        isValid = false;
    } else {
        hideFormError('endDateError');
    }

    // 날짜 범위 검사
    if (startDate && endDate) {
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        if (startDateTime >= endDateTime) {
            showFormError('endDateError', '종료일시는 시작일시보다 이후여야 합니다.');
            isValid = false;
        }
    }

    // 이미지 검사 (수정 모드에서는 선택사항)
    if (!currentEventId) {
        // 추가 모드에서는 이미지 필수
        if (!eventImage.files || eventImage.files.length === 0) {
            showFormError('imageError');
            isValid = false;
        } else {
            hideFormError('imageError');
        }
    } else {
        // 수정 모드에서는 이미지 선택사항 (이미지가 없으면 기존 이미지 유지)
        hideFormError('imageError');
    }

    // 건물 검사
    if (selectedBuildings.length === 0) {
        showFormError('buildingError');
        isValid = false;
    } else {
        hideFormError('buildingError');
    }

    return isValid;
}

function showFormError(errorId, message = null) {
    const errorElement = document.getElementById(errorId);
    errorElement.classList.add('active');
    if (message) {
        errorElement.textContent = message;
    }
}

function hideFormError(errorId) {
    const errorElement = document.getElementById(errorId);
    errorElement.classList.remove('active');
}

function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(error => {
        error.classList.remove('active');
    });
}

// ============================================
// 폼 제출 처리
// ============================================

// 시작일시와 종료일시 변경 시 분을 00으로 강제 설정
const startDateInput = document.getElementById('eventStartDate');
const endDateInput = document.getElementById('eventEndDate');

// 분을 00으로 고정하는 함수 (더 강력한 버전)
function setupMinuteEnforcement(input) {
    if (!input) return;
    
    // 모든 이벤트에 대해 분을 00으로 강제 설정
    const enforce = () => {
        // 짧은 지연을 두어 브라우저 UI 업데이트 후 실행
        setTimeout(() => enforceMinuteToZero(input.id), 50);
    };
    
    // 다양한 이벤트에 리스너 추가
    input.addEventListener('change', enforce);
    input.addEventListener('blur', enforce);
    input.addEventListener('input', enforce);
    input.addEventListener('keyup', enforce);
    input.addEventListener('keydown', enforce);
    input.addEventListener('click', enforce);
    input.addEventListener('focusout', enforce);
    
    // 모달이 열려있을 때 주기적으로 체크 (분 선택 방지)
    let checkInterval = null;
    input.addEventListener('focus', () => {
        checkInterval = setInterval(() => {
            enforceMinuteToZero(input.id);
        }, 100); // 100ms마다 체크
    });
    
    input.addEventListener('blur', () => {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
    });
}

if (startDateInput) {
    setupMinuteEnforcement(startDateInput);
}

if (endDateInput) {
    setupMinuteEnforcement(endDateInput);
}

eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 시작일시와 종료일시의 분을 00으로 강제 설정
    enforceMinuteToZero('eventStartDate');
    enforceMinuteToZero('eventEndDate');

    if (!validateForm()) {
        return;
    }

    const file = eventImage.files[0];

    try {
        if (currentEventId) {
            // 수정 모드 - 실제 API 호출
            // 이미지 파일이 없으면 null로 보냄 (서버가 기존 이미지 유지 처리)
            const eventData = {
                title: document.getElementById('eventTitle').value.trim(),
                description: document.getElementById('eventDescription').value.trim(),
                startDate: document.getElementById('eventStartDate').value,
                endDate: document.getElementById('eventEndDate').value,
                imageFile: file || null, // 파일이 없으면 null
                buildings: selectedBuildings.map(b => ({
                    id: b.id,
                    producer: b.producer,
                    name: b.name
                }))
            };
            await updateEvent(currentEventId, eventData);
        } else {
            // 생성 모드 - 실제 API 호출
            if (!file) {
                alert('이미지를 선택해주세요.');
                return;
            }

            await createEvent({
                title: document.getElementById('eventTitle').value.trim(),
                description: document.getElementById('eventDescription').value.trim(),
                startDate: document.getElementById('eventStartDate').value,
                endDate: document.getElementById('eventEndDate').value,
                imageFile: file,
                buildings: selectedBuildings
            });
        }
        closeModal();
        loadEvents();
    } catch (error) {
        console.error('이벤트 저장 오류:', error);
        alert(currentEventId ? '이벤트 수정 중 오류가 발생했습니다.' : '이벤트 생성 중 오류가 발생했습니다.');
    }
});

async function getExistingImageAsBlob(eventId) {
    // API에서 이벤트 상세 정보를 가져와서 이미지 URL을 사용
    try {
        const event = await fetchEventDetail(eventId);
        if (event && event.imageUrl) {
            const response = await fetch(event.imageUrl);
            return await response.blob();
        }
    } catch (error) {
        console.error('기존 이미지 가져오기 오류:', error);
    }
    return null;
}

// ============================================
// 이벤트 수정
// ============================================

window.handleEditEvent = async function (eventId) {
    try {
        const event = await fetchEventDetail(eventId);

        if (!event) {
            alert('이벤트를 찾을 수 없습니다.');
            return;
        }

        // 모달 열기 및 데이터 채우기
        openModal(eventId);

        // 폼에 데이터 채우기
        document.getElementById('eventTitle').value = event.name || '';
        document.getElementById('eventDescription').value = event.description || '';

        // 날짜 형식 변환 (YYYY-MM-DDTHH:mm:ss → YYYY-MM-DDTHH:mm)
        const formatForDateTimeLocal = (dateStr) => {
            if (!dateStr) return '';
            if (dateStr.includes('T')) {
                // 이미 datetime 형식이면 분과 초 제거
                const [datePart, timePart] = dateStr.split('T');
                if (timePart) {
                    const [hour, minute] = timePart.split(':');
                    return `${datePart}T${hour.padStart(2, '0')}:${minute || '00'}`;
                }
                return dateStr;
            }
            // 날짜만 있으면 00:00으로 설정
            return dateStr + 'T00:00';
        };

        document.getElementById('eventStartDate').value = formatForDateTimeLocal(event.strDate);
        document.getElementById('eventEndDate').value = formatForDateTimeLocal(event.finDate);

        // 이미지 미리보기
        if (event.imageUrl) {
            previewImage.src = event.imageUrl;
            imagePreview.classList.add('active');
        }

        // 건물 선택 - eventBuildingResponses에서 건물 정보 가져오기
        if (event.eventBuildingResponses && event.eventBuildingResponses.length > 0) {
            selectedBuildings = event.eventBuildingResponses.map(building => ({
                id: building.originalId || building.id,
                producer: building.producer,
                name: building.name || building.buildingName || ''
            }));
        } else {
            selectedBuildings = [];
        }
        renderSelectedBuildings();
    } catch (error) {
        console.error('이벤트 수정 오류:', error);
        alert('이벤트 정보를 불러오는 중 오류가 발생했습니다.');
    }
};

// ============================================
// 이벤트 종료
// ============================================

window.handleEndEvent = async function (eventId) {
    if (!confirm('이 이벤트를 중지하시겠습니까?')) {
        return;
    }

    try {
        await endEvent(eventId);
        loadEvents();
    } catch (error) {
        console.error('이벤트 중지 오류:', error);
        alert('이벤트 중지 중 오류가 발생했습니다.');
    }
};

// ============================================
// 이벤트 재개
// ============================================

window.handleResumeEvent = async function (eventId) {
    if (!confirm('이 이벤트를 시작하시겠습니까?')) {
        return;
    }

    try {
        await resumeEvent(eventId);
        loadEvents();
    } catch (error) {
        console.error('이벤트 시작 오류:', error);
        alert('이벤트 시작 중 오류가 발생했습니다.');
    }
};

// ============================================
// 이벤트 삭제
// ============================================

window.handleDeleteEvent = async function (eventId) {
    if (!confirm('정말 이 이벤트를 삭제하시겠습니까?')) {
        return;
    }

    try {
        await deleteEvent(eventId);
        loadEvents();
    } catch (error) {
        console.error('이벤트 삭제 오류:', error);
        alert('이벤트 삭제 중 오류가 발생했습니다.');
    }
};

// ============================================
// 이벤트 목록 로드
// ============================================

async function loadEvents() {
    try {
        const events = await fetchEvents();
        renderEvents(events);
    } catch (error) {
        console.error('이벤트 로드 오류:', error);
        alert('이벤트 목록을 불러오는 중 오류가 발생했습니다.');
    }
}

// ============================================
// 모달 이벤트 리스너
// ============================================

document.getElementById('addEventBtn').addEventListener('click', () => {
    openModal();
});

document.getElementById('closeModalBtn').addEventListener('click', () => {
    closeModal();
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    closeModal();
});

// ============================================
// 초기화
// ============================================

loadEvents();
