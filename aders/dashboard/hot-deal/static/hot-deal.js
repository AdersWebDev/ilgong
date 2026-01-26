
// ============================================
// 가상 API 함수 및 더미데이터
// ============================================

// 더미데이터 저장소 (in-memory)
let eventsData = [
    {
        id: '1',
        title: '신규 입주 특가 이벤트',
        description: '신규 입주자를 위한 특별 할인 이벤트입니다. 첫 달 월세 50% 할인!',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        imageFile: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        buildings: [
            { id: 192075, producer: 're', name: '도쿄 타워 맨션' }
        ],
        isActive: true
    },
    {
        id: '2',
        title: '봄맞이 이벤트',
        description: '봄을 맞이하여 진행하는 특별 이벤트입니다. 다양한 혜택을 확인하세요.',
        startDate: '2024-03-01',
        endDate: '2024-03-31',
        imageFile: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        buildings: [
            { id: 194841, producer: 're', name: '시부야 스카이 아파트' },
            { id: 213467, producer: 're', name: '오사카 센터 빌딩' }
        ],
        isActive: false
    }
];

// 가상 API 함수들
async function fetchEvents() {
    // 실제 API로 교체 시: return fetch('/api/events').then(res => res.json());
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([...eventsData]);
        }, 300);
    });
}

async function createEvent(eventData) {
    // 실제 API로 교체 시: return fetch('/api/events', { method: 'POST', body: JSON.stringify(eventData) }).then(res => res.json());
    return new Promise((resolve) => {
        setTimeout(() => {
            const newEvent = {
                ...eventData,
                id: Date.now().toString(),
                isActive: true // 기본적으로 활성화 상태로 생성
            };
            eventsData.push(newEvent);
            resolve(newEvent);
        }, 300);
    });
}

async function updateEvent(eventId, eventData) {
    // 실제 API로 교체 시: return fetch(`/api/events/${eventId}`, { method: 'PUT', body: JSON.stringify(eventData) }).then(res => res.json());
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = eventsData.findIndex(e => e.id === eventId);
            if (index !== -1) {
                eventsData[index] = {
                    ...eventData,
                    id: eventId
                };
                resolve(eventsData[index]);
            } else {
                reject(new Error('이벤트를 찾을 수 없습니다.'));
            }
        }, 300);
    });
}

async function endEvent(eventId) {
    // 실제 API로 교체 시: return fetch(`/api/events/${eventId}/end`, { method: 'POST' }).then(res => res.json());
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = eventsData.findIndex(e => e.id === eventId);
            if (index !== -1) {
                eventsData[index].isActive = false;
                resolve(eventsData[index]);
            } else {
                reject(new Error('이벤트를 찾을 수 없습니다.'));
            }
        }, 300);
    });
}

async function resumeEvent(eventId) {
    // 실제 API로 교체 시: return fetch(`/api/events/${eventId}/resume`, { method: 'POST' }).then(res => res.json());
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const index = eventsData.findIndex(e => e.id === eventId);
            if (index !== -1) {
                eventsData[index].isActive = true;
                resolve(eventsData[index]);
            } else {
                reject(new Error('이벤트를 찾을 수 없습니다.'));
            }
        }, 300);
    });
}

async function deleteEvent(eventId) {
    // 실제 API로 교체 시: return fetch(`/api/events/${eventId}`, { method: 'DELETE' }).then(res => res.json());
    return new Promise((resolve) => {
        setTimeout(() => {
            eventsData = eventsData.filter(event => event.id !== eventId);
            resolve({ success: true });
        }, 300);
    });
}

// ============================================
// 건물 검색 기능 (실제 API 사용)
// ============================================

const SEARCH_ENDPOINT = 'https://www.houberapp.com/map/rent/search';
let selectedBuildings = [];
let searchResults = [];
let searchTimeout = null;
let selectedSearchIndex = -1;

async function searchBuildings(query) {
    if (!query || query.trim().length === 0) {
        return [];
    }

    try {
        const url = `${SEARCH_ENDPOINT}?q=${encodeURIComponent(query)}`;
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
    if (events.length === 0) {
        eventsTableContainer.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    eventsTableContainer.style.display = 'block';
    emptyState.style.display = 'none';

    eventsTableBody.innerHTML = events.map(event => `
        <tr class="event-row ${!event.isActive ? 'event-inactive' : ''}">
            <td class="event-table-id">${event.id}</td>
            <td class="event-table-title">
                ${escapeHtml(event.title)}
                ${!event.isActive ? '<span class="event-status-badge inactive">종료됨</span>' : '<span class="event-status-badge active">진행중</span>'}
            </td>
            <td class="event-table-image">
                <img src="${event.imageFile}" alt="${escapeHtml(event.title)}" class="event-table-thumbnail" onerror="this.src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='">
            </td>
            <td class="event-table-period">
                ${formatDate(event.startDate)} ~ <br> ${formatDate(event.endDate)}
            </td>
            <td class="event-table-actions">
                <div class="event-actions-group">
                    <button class="btn-secondary" onclick="handleEditEvent('${event.id}')">수정</button>
                    ${event.isActive 
                        ? `<button class="btn-warning" onclick="handleEndEvent('${event.id}')">종료</button>`
                        : `<button class="btn-success" onclick="handleResumeEvent('${event.id}')">재개</button>`
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
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ============================================
// 모달 관리
// ============================================

function openModal(eventId = null) {
    currentEventId = eventId;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    if (eventId) {
        // 수정 모드 (현재는 추가만 지원)
        document.getElementById('modalTitle').textContent = '이벤트 수정';
    } else {
        // 추가 모드
        document.getElementById('modalTitle').textContent = '이벤트 추가';
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

window.removeBuildingFromList = function(buildingId, producer) {
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

    // 시작일 검사
    const startDate = document.getElementById('eventStartDate').value;
    if (!startDate) {
        showFormError('startDateError');
        isValid = false;
    } else {
        hideFormError('startDateError');
    }

    // 종료일 검사
    const endDate = document.getElementById('eventEndDate').value;
    if (!endDate) {
        showFormError('endDateError');
        isValid = false;
    } else {
        hideFormError('endDateError');
    }

    // 날짜 범위 검사
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        showFormError('endDateError', '종료일은 시작일보다 이후여야 합니다.');
        isValid = false;
    }

    // 이미지 검사
    if (!eventImage.files || eventImage.files.length === 0) {
        showFormError('imageError');
        isValid = false;
    } else {
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

eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const file = eventImage.files[0];
    
    const processEventData = async (imageFile) => {
        const eventData = {
            title: document.getElementById('eventTitle').value.trim(),
            description: document.getElementById('eventDescription').value.trim(),
            startDate: document.getElementById('eventStartDate').value,
            endDate: document.getElementById('eventEndDate').value,
            imageFile: imageFile,
            buildings: selectedBuildings.map(b => ({
                id: b.id,
                producer: b.producer,
                name: b.name
            }))
        };

        try {
            if (currentEventId) {
                // 수정 모드
                await updateEvent(currentEventId, eventData);
            } else {
                // 생성 모드
                await createEvent(eventData);
            }
            closeModal();
            loadEvents();
        } catch (error) {
            console.error('이벤트 저장 오류:', error);
            alert(currentEventId ? '이벤트 수정 중 오류가 발생했습니다.' : '이벤트 생성 중 오류가 발생했습니다.');
        }
    };

    if (file) {
        // 새 이미지가 선택된 경우
        const reader = new FileReader();
        reader.onload = (e) => {
            processEventData(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        // 수정 모드이고 이미지가 변경되지 않은 경우 기존 이미지 사용
        const existingEvent = eventsData.find(e => e.id === currentEventId);
        const imageFile = existingEvent ? existingEvent.imageFile : '';
        processEventData(imageFile);
    }
});

// ============================================
// 이벤트 수정
// ============================================

window.handleEditEvent = async function(eventId) {
    const events = await fetchEvents();
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
        alert('이벤트를 찾을 수 없습니다.');
        return;
    }
    
    // 모달 열기 및 데이터 채우기
    openModal(eventId);
    
    // 폼에 데이터 채우기
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDescription').value = event.description;
    document.getElementById('eventStartDate').value = event.startDate;
    document.getElementById('eventEndDate').value = event.endDate;
    
    // 이미지 미리보기
    if (event.imageFile) {
        previewImage.src = event.imageFile;
        imagePreview.classList.add('active');
    }
    
    // 건물 선택
    if (event.buildings && event.buildings.length > 0) {
        selectedBuildings = event.buildings.map(b => ({
            id: b.id,
            producer: b.producer,
            name: b.name
        }));
        renderSelectedBuildings();
    }
};

// ============================================
// 이벤트 종료
// ============================================

window.handleEndEvent = async function(eventId) {
    if (!confirm('이 이벤트를 종료하시겠습니까?')) {
        return;
    }

    try {
        await endEvent(eventId);
        loadEvents();
    } catch (error) {
        console.error('이벤트 종료 오류:', error);
        alert('이벤트 종료 중 오류가 발생했습니다.');
    }
};

// ============================================
// 이벤트 재개
// ============================================

window.handleResumeEvent = async function(eventId) {
    if (!confirm('이 이벤트를 재개하시겠습니까?')) {
        return;
    }

    try {
        await resumeEvent(eventId);
        loadEvents();
    } catch (error) {
        console.error('이벤트 재개 오류:', error);
        alert('이벤트 재개 중 오류가 발생했습니다.');
    }
};

// ============================================
// 이벤트 삭제
// ============================================

window.handleDeleteEvent = async function(eventId) {
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
