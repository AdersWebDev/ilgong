// domain 변수 정의
const apiDomain = 'https://www.houberapp.com/';

// 전역 상태 관리
let itemsList = []; // 리스트 아이템 배열 저장
let currentItemIndex = -1; // 현재 선택된 아이템 인덱스
let currentParams = null; // 현재 producer/agent 파라미터 저장

// 상세 뷰 전역 변수
let activeTab = 'initialCost';
let factData = {
    initialCost: '',
    specialTerms: ''
};
let currentDetailData = {
    producer: null,
    buildingId: null
};

// URL에서 직접 쿼리 파라미터 추출
function getUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const producer = urlParams.get('producer');
    const agent = urlParams.get('agent');
    
    if (producer && agent) {
        return { producer, agent };
    }
    
    return null;
}

// 백엔드에서 리스트 데이터 로드
async function loadData() {
    const params = getUrlParams();
    
    if (!params) {
        showError('URL 파라미터가 올바르지 않습니다. producer와 agent 파라미터가 필요합니다.');
        hideLoading();
        return;
    }
    
    currentParams = params;
    console.log('추출된 파라미터:', params);

    try {
        showLoading();

        // 백엔드 API 호출
        const apiUrl = apiDomain + `/aders/fact/list?producer=${params.producer}&agent=${params.agent}`;
        console.log('API 호출:', apiUrl);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('받은 데이터:', data);

        // 데이터 렌더링
        renderData(data);

    } catch (error) {
        console.error('데이터 로드 오류:', error);
        showError('데이터를 불러오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
        hideLoading();
    }
}

// 데이터 렌더링
function renderData(data) {
    const contentDiv = document.getElementById('content');
    const tableBody = document.getElementById('tableBody');
    
    // 데이터가 배열인지 확인
    const items = Array.isArray(data) ? data : (data.items || []);
    
    // 전역 변수에 저장
    itemsList = items;
    
    if (items.length === 0) {
        showError('데이터가 없습니다.');
        return;
    }

    // 테이블 body 초기화
    tableBody.innerHTML = '';

    // 각 항목을 테이블 행으로 추가
    items.forEach((item, index) => {
        const row = document.createElement('tr');
        
        // 클릭 가능하도록 스타일 추가
        row.style.cursor = 'pointer';
        
        // 번호
        const numCell = document.createElement('td');
        numCell.textContent = index + 1;
        row.appendChild(numCell);

        // 건물명
        const buildingNameCell = document.createElement('td');
        buildingNameCell.textContent = item.buildingName || item.건물명 || '?-?';
        row.appendChild(buildingNameCell);

        // ischeck
        const ischeckCell = document.createElement('td');
        if (item.checked) {
            ischeckCell.innerHTML = '<span class="status-badge status-check"></span>';
        } else {
            ischeckCell.innerHTML = '<span class="status-badge status-uncheck"></span>';
        }
        row.appendChild(ischeckCell);

        // ispass
        const ispassCell = document.createElement('td');
        if (item.passed) {
            ispassCell.innerHTML = '<span class="status-badge status-pass"></span>';
        } else {
            ispassCell.innerHTML = '<span class="status-badge status-reject"></span>';
        }
        row.appendChild(ispassCell);

        // 업데이트 날짜
        const updateCell = document.createElement('td');
        updateCell.textContent = item.updatedAt || '-';
        row.appendChild(updateCell);

        // 행 클릭 이벤트: 상세 뷰 표시
        row.addEventListener('click', (e) => {
            // 링크나 버튼 클릭이 아닌 경우에만 처리
            if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
                return;
            }
            
            const urlParams = getUrlParams();
            if (!urlParams) {
                showError('URL 파라미터가 올바르지 않습니다.');
                return;
            }
            
            // 상세 뷰 표시
            currentItemIndex = index;
            const item = itemsList[index];
            const producer = item.producer || urlParams.producer;
            const buildingId = item.buildingId || '';
            
            if (!buildingId) {
                showError('건물 ID가 없습니다.');
                return;
            }
            
            showDetailView(producer, buildingId);
        });

        tableBody.appendChild(row);
    });

    // 콘텐츠 표시
    contentDiv.style.display = 'block';
}

// 상세 뷰 표시
function showDetailView(producer, buildingId) {
    // 리스트 숨기기
    document.getElementById('content').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    
    // 상세 뷰 표시
    const detailView = document.getElementById('detailView');
    detailView.style.display = 'flex';
    
    // 현재 상세 데이터 저장
    currentDetailData = { producer, buildingId };
    
    // 상세 데이터 로드
    loadDetailData(producer, buildingId);
}

// 상세 뷰 숨기고 리스트 표시 (리스트 갱신 포함)
function showListView() {
    // 상세 뷰 숨기기
    document.getElementById('detailView').style.display = 'none';
    
    // 리스트 표시
    document.getElementById('content').style.display = 'block';
    
    // 리스트 데이터 갱신
    loadData();
    
    // 인덱스 초기화
    currentItemIndex = -1;
}

// 상세 데이터 로드
async function loadDetailData(producer, buildingId) {
    try {
        showDetailLoading();

        // 백엔드 API 호출
        const apiUrl = `${apiDomain}/aders/fact/detail?producer=${producer}&buildingId=${buildingId}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 데이터 적용
        renderDetailData(data);

    } catch (error) {
        console.error('상세 데이터 로드 오류:', error);
        showDetailError('데이터를 불러오는 중 오류가 발생했습니다: ' + error.message);
    } finally {
        hideDetailLoading();
    }
}

// 상세 데이터 렌더링
function renderDetailData(data) {
    // 건물명과 관리회사명 표시
    document.getElementById('buildingName').textContent = data.buildingName || '?';
    document.getElementById('managementCompany').textContent = data.roomName +'호' || '?';
    
    // 초기 상세비용과 특약조건 저장
    factData = {
        initialCost: data.initCostRow || '',
        specialTerms: data.specialTerms || ''
    };

    // 문서 로드 (PDF 또는 이미지)
    if (data.factFileUrl) {
        loadDocument(data.factFileUrl);
    } else {
        const viewer = document.getElementById('documentViewer');
        viewer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">문서가 없습니다.</p>';
    }

    // 초기 탭 내용 로드
    activeTab = 'initialCost';
    updateTextArea();
    
    // 탭 버튼 초기화
    document.getElementById('initialCostTab').classList.add('active');
    document.getElementById('specialTermsTab').classList.remove('active');
}

// 문서 로드 (PDF 또는 이미지)
function loadDocument(url) {
    if (!url || url === '') {
        showDetailError('문서가 없습니다');
        return;
    }
    
    const viewer = document.getElementById('documentViewer');
    if (!viewer) {
        console.error('documentViewer 요소를 찾을 수 없습니다.');
        return;
    }
    
    viewer.innerHTML = '';

    // 파일 확장자 확인
    const extension = url.split('.').pop().toLowerCase().split('?')[0]; // 쿼리 파라미터 제거

    if (extension === 'pdf') {
        // PDF인 경우 iframe 사용
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        viewer.appendChild(iframe);
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        // 이미지인 경우 img 태그 사용
        const img = document.createElement('img');
        img.src = url;
        img.alt = '문서 이미지';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        viewer.appendChild(img);
    } else {
        viewer.innerHTML = '<p style="color: #666; text-align: center;">지원하지 않는 파일 형식입니다.</p>';
    }
}

// 탭 전환
function switchTab(tabName) {
    // 같은 탭이면 스킵
    if (activeTab === tabName) {
        return;
    }

    // 현재 텍스트 영역의 내용을 저장 (activeTab 변경 전에!)
    updateFactData();

    // activeTab 변경
    activeTab = tabName;

    // 모든 탭 버튼에서 active 클래스 제거
    const allTabs = document.querySelectorAll('.tab-button');
    allTabs.forEach(btn => {
        btn.classList.remove('active');
    });

    // 선택된 탭에 active 클래스 추가
    const initialCostTab = document.getElementById('initialCostTab');
    const specialTermsTab = document.getElementById('specialTermsTab');

    if (tabName === 'initialCost') {
        initialCostTab.classList.add('active');
    } else if (tabName === 'specialTerms') {
        specialTermsTab.classList.add('active');
    }

    // 텍스트 영역 업데이트
    updateTextArea();
}

// 텍스트 영역 업데이트
function updateTextArea() {
    const textArea = document.getElementById('contentTextArea');
    
    if (!textArea) {
        console.error('contentTextArea 요소를 찾을 수 없습니다.');
        return;
    }
    
    let value = '';
    if (activeTab === 'initialCost') {
        value = factData.initialCost || '';
    } else if (activeTab === 'specialTerms') {
        value = factData.specialTerms || '';
    }
    
    // 값이 다를 때만 업데이트 (무한 루프 방지)
    if (textArea.value !== value) {
        textArea.value = value;
    }
}

// 텍스트 영역 변경 시 factData 업데이트
function updateFactData() {
    const textArea = document.getElementById('contentTextArea');
    if (!textArea) return;
    
    const currentValue = textArea.value;

    if (activeTab === 'initialCost') {
        factData.initialCost = currentValue;
    } else {
        factData.specialTerms = currentValue;
    }
}

// 반려 처리
async function handleReject() {
    if (!confirm('반려하시겠습니까?')) {
        return;
    }

    try {
        showDetailLoading();

        // 현재 텍스트 영역의 내용 저장
        updateFactData();

        // 백엔드로 반려 요청 전송
        const apiUrl = `${apiDomain}/aders/fact/detail/reject/${currentDetailData.producer}/${currentDetailData.buildingId}`;
        const response = await fetch(apiUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        alert('반려 처리되었습니다.');
        
        // 다음 항목으로 이동
        moveToNextItem();

    } catch (error) {
        console.error('반려 처리 오류:', error);
        alert('반려 처리 중 오류가 발생했습니다: ' + error.message);
    } finally {
        hideDetailLoading();
    }
}

// 승인 처리
async function handleApprove() {
    if (!confirm('승인하시겠습니까?')) {
        return;
    }

    try {
        showDetailLoading();

        // 현재 텍스트 영역의 내용 저장
        updateFactData();

        // 백엔드로 승인 요청 전송
        const apiUrl = `${apiDomain}/aders/fact/detail/approve`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                producer: currentDetailData.producer,
                buildingId: currentDetailData.buildingId,
                initialCost: factData.initialCost,
                specialTerms: factData.specialTerms
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        alert('승인 처리되었습니다.');
        
        // 다음 항목으로 이동
        moveToNextItem();

    } catch (error) {
        console.error('승인 처리 오류:', error);
        alert('승인 처리 중 오류가 발생했습니다: ' + error.message);
    } finally {
        hideDetailLoading();
    }
}

// 다음 항목 이동 로직
function moveToNextItem() {
    currentItemIndex++;
    
    // 다음 항목이 있는지 확인
    if (currentItemIndex < itemsList.length) {
        const nextItem = itemsList[currentItemIndex];
        const producer = nextItem.producer || currentParams.producer;
        const buildingId = nextItem.buildingId || '';
        
        if (buildingId) {
            // 다음 항목의 상세 데이터 로드
            showDetailView(producer, buildingId);
        } else {
            // buildingId가 없으면 리스트 뷰로 전환
            showListView();
        }
    } else {
        // 다음 항목이 없으면 리스트 뷰로 전환
        showListView();
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 창 닫기 버튼
    const closeButton = document.getElementById('closeDetailButton');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            showListView();
        });
    }
    
    // 탭 버튼
    const initialCostTab = document.getElementById('initialCostTab');
    const specialTermsTab = document.getElementById('specialTermsTab');

    if (initialCostTab) {
        initialCostTab.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('initialCost');
        });
    }

    if (specialTermsTab) {
        specialTermsTab.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('specialTerms');
        });
    }

    // 반려 버튼
    const rejectButton = document.getElementById('rejectButton');
    if (rejectButton) {
        rejectButton.addEventListener('click', () => {
            handleReject();
        });
    }

    // 승인 버튼
    const approveButton = document.getElementById('approveButton');
    if (approveButton) {
        approveButton.addEventListener('click', () => {
            handleApprove();
        });
    }

    // 텍스트 영역 변경 시 데이터 업데이트 (디바운스 적용)
    const textArea = document.getElementById('contentTextArea');
    if (textArea) {
        let updateTimeout = null;
        textArea.addEventListener('input', () => {
            // 디바운스: 빠른 입력 시 마지막 입력만 처리
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                updateFactData();
            }, 100);
        });
    }
}

// 리스트 로딩 표시
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('content').style.display = 'none';
}

// 리스트 로딩 숨김
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 리스트 에러 표시
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    document.getElementById('content').style.display = 'none';
}

// 상세 뷰 로딩 표시
function showDetailLoading() {
    const buttons = document.querySelectorAll('.action-button');
    buttons.forEach(btn => {
        btn.disabled = true;
        btn.style.opacity = '0.6';
        btn.style.cursor = 'not-allowed';
    });
}

// 상세 뷰 로딩 숨김
function hideDetailLoading() {
    const buttons = document.querySelectorAll('.action-button');
    buttons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    });
}

// 상세 뷰 에러 표시
function showDetailError(message) {
    const viewer = document.getElementById('documentViewer');
    viewer.innerHTML = `<p style="color: #dc3545; text-align: center; padding: 20px;">${message}</p>`;
}

// 페이지 초기화 함수
function initializePage() {
    // 쿼리 파라미터 확인
    const urlParams = new URLSearchParams(window.location.search);
    const producer = urlParams.get('producer');
    const agent = urlParams.get('agent');
    
    // 쿼리 파라미터가 없으면 초기화하지 않음
    if (!producer || !agent) {
        showError('URL 파라미터가 올바르지 않습니다. producer와 agent 파라미터가 필요합니다.');
        return;
    }
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 데이터 로드
    loadData();
}

// 페이지 로드 시 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
