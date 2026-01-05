// Agent Script Modal Management

// API base URL
const scriptApiBase = 'https://www.houberapp.com';

// Modal state
let modalData = {
    producer: null,
    agentId: null,
    managementName: null,
    initCostScript: '',
    specialTermsScript: ''
};

// URL에서 쿼리 파라미터 추출 (fact-list.js와 동일한 패턴)
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const producer = urlParams.get('producer');
    const agent = urlParams.get('agent');
    
    if (producer && agent) {
        return { producer, agent };
    }
    
    return null;
}

// 모달 표시
function showModal() {
    const modal = document.getElementById('agentScriptModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
    }
}

// 모달 숨기기
function hideModal() {
    const modal = document.getElementById('agentScriptModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // 스크롤 복원
    }
}

// 모달 초기화 (데이터 리셋)
function resetModal() {
    modalData = {
        producer: null,
        agentId: null,
        managementName: null,
        initCostScript: '',
        specialTermsScript: ''
    };
    
    const initCostTextarea = document.getElementById('initCostScriptTextarea');
    const specialTermsTextarea = document.getElementById('specialTermsScriptTextarea');
    const managementNameSpan = document.getElementById('modalManagementName');
    
    if (initCostTextarea) {
        initCostTextarea.value = '';
    }
    if (specialTermsTextarea) {
        specialTermsTextarea.value = '';
    }
    if (managementNameSpan) {
        managementNameSpan.textContent = '관리회사명';
    }
    
    const modal = document.getElementById('agentScriptModal');
    if (modal) {
        modal.setAttribute('data-producer', '');
        modal.setAttribute('data-agent-id', '');
    }
}

// 모달 닫기 및 초기화
function closeModal() {
    resetModal();
    hideModal();
}

// 스크립트 데이터 로드
async function loadScriptData(producer, agent) {
    try {
        // 로딩 상태 표시 (모달은 이미 열려있음)
        const initCostTextarea = document.getElementById('initCostScriptTextarea');
        const specialTermsTextarea = document.getElementById('specialTermsScriptTextarea');
        
        if (initCostTextarea) {
            initCostTextarea.value = '데이터를 불러오는 중...';
            initCostTextarea.disabled = true;
        }
        if (specialTermsTextarea) {
            specialTermsTextarea.value = '데이터를 불러오는 중...';
            specialTermsTextarea.disabled = true;
        }
        
        // API 호출
        const apiUrl = `${scriptApiBase}/aders/fact/script?producer=${encodeURIComponent(producer)}&agent=${encodeURIComponent(agent)}`;
        console.log('스크립트 데이터 로드:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('받은 스크립트 데이터:', data);
        
        // 데이터 저장
        modalData = {
            producer: data.producer || producer,
            agentId: data.agentId || parseInt(agent),
            managementName: data.managementName || '',
            initCostScript: data.initCostScript || '',
            specialTermsScript: data.specialTermsScript || ''
        };
        
        // 모달에 데이터 속성 저장
        const modal = document.getElementById('agentScriptModal');
        if (modal) {
            modal.setAttribute('data-producer', modalData.producer);
            modal.setAttribute('data-agent-id', modalData.agentId.toString());
        }
        
        // UI 업데이트
        if (initCostTextarea) {
            initCostTextarea.value = modalData.initCostScript;
            initCostTextarea.disabled = false;
        }
        if (specialTermsTextarea) {
            specialTermsTextarea.value = modalData.specialTermsScript;
            specialTermsTextarea.disabled = false;
        }
        
        const managementNameSpan = document.getElementById('modalManagementName');
        if (managementNameSpan) {
            managementNameSpan.textContent = modalData.managementName || '관리회사명';
        }
        
    } catch (error) {
        console.error('스크립트 데이터 로드 오류:', error);
        
        // 에러 메시지 표시
        const initCostTextarea = document.getElementById('initCostScriptTextarea');
        const specialTermsTextarea = document.getElementById('specialTermsScriptTextarea');
        
        const errorMessage = '데이터를 불러오는 중 오류가 발생했습니다: ' + error.message;
        
        if (initCostTextarea) {
            initCostTextarea.value = errorMessage;
            initCostTextarea.disabled = true;
        }
        if (specialTermsTextarea) {
            specialTermsTextarea.value = errorMessage;
            specialTermsTextarea.disabled = true;
        }
        
        alert(errorMessage);
    }
}

// 스크립트 데이터 저장
async function saveScriptData() {
    const saveButton = document.getElementById('modalSaveButton');
    
    try {
        // 현재 텍스트 영역의 값 가져오기
        const initCostTextarea = document.getElementById('initCostScriptTextarea');
        const specialTermsTextarea = document.getElementById('specialTermsScriptTextarea');
        
        if (!initCostTextarea || !specialTermsTextarea) {
            throw new Error('텍스트 영역을 찾을 수 없습니다.');
        }
        
        // 저장할 데이터 준비
        const saveData = {
            producer: modalData.producer,
            managementName: modalData.managementName,
            agentId: modalData.agentId,
            initCostScript: initCostTextarea.value,
            specialTermsScript: specialTermsTextarea.value
        };
        
        // 필수 데이터 확인
        if (!saveData.producer || !saveData.agentId) {
            throw new Error('필수 데이터가 없습니다. 페이지를 새로고침하고 다시 시도해주세요.');
        }
        
        // 저장 버튼 비활성화
        if (saveButton) {
            saveButton.disabled = true;
            saveButton.textContent = '저장 중...';
        }
        
        // API 호출
        const apiUrl = `${scriptApiBase}/aders/fact/script`;
        console.log('스크립트 데이터 저장:', apiUrl, saveData);
        
        const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(saveData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // PATCH 응답은 본문이 없고 상태 코드만 반환됨
        console.log('저장 완료, 상태 코드:', response.status);
        
        // 저장 버튼 다시 활성화
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = '저장하기';
        }
        
        alert('저장되었습니다.');
        
        // 모달 닫기
        closeModal();
        
    } catch (error) {
        console.error('스크립트 데이터 저장 오류:', error);
        
        // 저장 버튼 다시 활성화
        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = '저장하기';
        }
        
        alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
}

// 모달 열기 핸들러
async function openModalHandler() {
    // URL 파라미터 추출
    const params = getUrlParams();
    
    if (!params) {
        alert('URL 파라미터가 올바르지 않습니다. producer와 agent 파라미터가 필요합니다.');
        return;
    }
    
    // 모달 표시
    showModal();
    
    // 데이터 로드
    await loadScriptData(params.producer, params.agent);
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // Genspark 스크립트 편집 버튼 클릭
    const agentScriptButton = document.querySelector('.agent-script');
    if (agentScriptButton) {
        agentScriptButton.addEventListener('click', openModalHandler);
    }
    
    // 모달 닫기 버튼
    const closeButton = document.getElementById('modalCloseButton');
    if (closeButton) {
        closeButton.addEventListener('click', closeModal);
    }
    
    // 취소 버튼
    const cancelButton = document.getElementById('modalCancelButton');
    if (cancelButton) {
        cancelButton.addEventListener('click', closeModal);
    }
    
    // 저장 버튼
    const saveButton = document.getElementById('modalSaveButton');
    if (saveButton) {
        saveButton.addEventListener('click', saveScriptData);
    }
    
    // 모달 배경 클릭 시 닫기
    const modal = document.getElementById('agentScriptModal');
    if (modal) {
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', closeModal);
        }
    }
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('agentScriptModal');
            if (modal && modal.style.display === 'flex') {
                closeModal();
            }
        }
    });
}

// 페이지 초기화
function initializeAgentScript() {
    setupEventListeners();
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAgentScript);
} else {
    initializeAgentScript();
}

