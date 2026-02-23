/**
 * detail.fact.js
 * - 자료 검수(팩트) 영역: 로드/탭/승인/반려 + PDF/이미지 뷰어
 * - 의존: window.BuildingDetailShared, (선택) window.BuildingDetailPanels
 */
(() => {
    const S = window.BuildingDetailShared;
    if (!S) return;

    const { API_BASE_URL, state } = S;

    const factDocumentViewer = document.getElementById('factDocumentViewer');
    const factBuildingName = document.getElementById('factBuildingName');
    const factManagementCompany = document.getElementById('factManagementCompany');
    const factHint = document.getElementById('factHint');
    const factInitialCostTab = document.getElementById('factInitialCostTab');
    const factSpecialTermsTab = document.getElementById('factSpecialTermsTab');
    const factContentTextArea = document.getElementById('factContentTextArea');
    const factRejectButton = document.getElementById('factRejectButton');
    const factApproveButton = document.getElementById('factApproveButton');
    const factCloseButton = document.getElementById('factCloseButton');

    let factState = {
        loadedKey: '',
        producer: '',
        buildingId: null,
        managementCompany: '',
        factFileUrl: '',
        initialCost: '',
        specialTerms: '',
        activeTab: 'initialCost',
        loading: false
    };

    function setFactHint(text, show) {
        if (!factHint) return;
        factHint.textContent = text || '';
        factHint.style.display = show ? 'block' : 'none';
    }

    function setFactDisabled(disabled) {
        if (factContentTextArea) factContentTextArea.disabled = disabled;
        if (factRejectButton) factRejectButton.disabled = disabled;
        if (factApproveButton) factApproveButton.disabled = disabled;
    }

    function setFactHeader(buildingNameText, managementCompanyText) {
        if (factBuildingName) factBuildingName.textContent = buildingNameText || '건물명';
        if (factManagementCompany) factManagementCompany.textContent = managementCompanyText || '관리회사명';
    }

    function loadFactDocument(url) {
        if (!factDocumentViewer) return;
        factDocumentViewer.innerHTML = '';

        const u = (url || '').trim();
        if (!u) {
            factDocumentViewer.innerHTML = '<div class="fact-placeholder">문서가 없습니다.</div>';
            return;
        }

        function withPdfViewerParams(pdfUrl) {
            const hasHash = pdfUrl.includes('#');
            const base = hasHash ? pdfUrl.split('#')[0] : pdfUrl;
            const hash = hasHash ? pdfUrl.split('#').slice(1).join('#') : '';

            const params = [];
            const lowerHash = hash.toLowerCase();
            if (!lowerHash.includes('navpanes=')) params.push('navpanes=0');
            if (!lowerHash.includes('pagemode=')) params.push('pagemode=none');
            if (!lowerHash.includes('zoom=')) params.push('zoom=page-width');

            if (params.length === 0) return pdfUrl;
            const nextHash = [hash, params.join('&')].filter(Boolean).join('&');
            return `${base}#${nextHash}`;
        }

        const ext = u.split('.').pop().toLowerCase().split('?')[0];
        if (ext === 'pdf') {
            const iframe = document.createElement('iframe');
            iframe.src = withPdfViewerParams(u);
            iframe.title = '팩트 문서';
            factDocumentViewer.appendChild(iframe);
            return;
        }
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            const img = document.createElement('img');
            img.src = u;
            img.alt = '팩트 문서 이미지';
            factDocumentViewer.appendChild(img);
            return;
        }

        factDocumentViewer.innerHTML = '<div class="fact-placeholder">지원하지 않는 파일 형식입니다.</div>';
    }

    function updateFactTabUi() {
        const isInit = factState.activeTab === 'initialCost';
        if (factInitialCostTab) {
            factInitialCostTab.classList.toggle('active', isInit);
            factInitialCostTab.setAttribute('aria-selected', isInit ? 'true' : 'false');
        }
        if (factSpecialTermsTab) {
            factSpecialTermsTab.classList.toggle('active', !isInit);
            factSpecialTermsTab.setAttribute('aria-selected', !isInit ? 'true' : 'false');
        }
        if (factContentTextArea) {
            factContentTextArea.value = isInit ? (factState.initialCost || '') : (factState.specialTerms || '');
        }
    }

    function persistFactTextarea() {
        if (!factContentTextArea) return;
        if (factState.activeTab === 'initialCost') {
            factState.initialCost = factContentTextArea.value;
        } else {
            factState.specialTerms = factContentTextArea.value;
        }
    }

    function setFactTab(tabName) {
        const next = tabName === 'specialTerms' ? 'specialTerms' : 'initialCost';
        if (next === factState.activeTab) return;
        persistFactTextarea();
        factState.activeTab = next;
        updateFactTabUi();
    }

    async function ensureLoaded(force) {
        if (!state.producer || !state.id) {
            setFactHeader('건물명', '관리회사명');
            setFactDisabled(true);
            setFactHint('producer와 id가 필요합니다. 목록에서 건물을 선택해 주세요.', true);
            return;
        }

        const key = `${state.producer}::${state.id}`;
        if (!force && factState.loadedKey === key) {
            setFactDisabled(false);
            setFactHint('', false);
            return;
        }

        factState.loadedKey = '';
        factState.loading = true;
        setFactDisabled(true);
        setFactHint('데이터를 불러오는 중...', true);

        try {
            const url = `${API_BASE_URL}/aders/fact/detail?producer=${encodeURIComponent(
                state.producer
            )}&buildingId=${encodeURIComponent(String(state.id))}`;

            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 400) {
                    alert('너무 비싼 건물입니다');
                    if (window.BuildingDetailPanels) window.BuildingDetailPanels.setPanel(1);
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const buildingNameText = data.buildingName || '';
            const managementCompanyText =
                data.managementCompany ||
                data.managementName ||
                data.agentName ||
                data.roomName ||
                '';
            const factFileUrl = data.factFileUrl || data.factFile || data.fileUrl || '';

            const initialCost = data.initCostRow || data.initialCost || '';
            const specialTerms = data.specialTerms || '';

            factState = {
                ...factState,
                loadedKey: key,
                producer: data.producer || state.producer,
                buildingId: data.buildingId != null ? Number(data.buildingId) : state.id,
                managementCompany: String(managementCompanyText || '').trim(),
                factFileUrl: String(factFileUrl || '').trim(),
                initialCost: String(initialCost || ''),
                specialTerms: String(specialTerms || ''),
                activeTab: 'initialCost',
                loading: false
            };

            setFactHeader(buildingNameText || '건물명', factState.managementCompany || '관리회사명');
            loadFactDocument(factState.factFileUrl);
            updateFactTabUi();

            setFactDisabled(false);
            setFactHint('', false);
        } catch (error) {
            console.error('팩트 데이터 로드 오류:', error);
            factState.loading = false;
            setFactDisabled(true);
            setFactHint(
                '데이터를 불러오는 중 오류가 발생했습니다: ' + (error && error.message ? error.message : ''),
                true
            );
            alert('데이터를 불러오는 중 오류가 발생했습니다: ' + (error && error.message ? error.message : ''));
        }
    }

    async function handleApprove() {
        if (!state.producer || !state.id) return;
        if (!confirm('저장 및 승인하시겠습니까?')) return;

        try {
            persistFactTextarea();
            setFactDisabled(true);
            if (factApproveButton) factApproveButton.textContent = '처리 중...';

            const apiUrl = `${API_BASE_URL}/aders/fact/detail/approve`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    producer: state.producer,
                    buildingId: state.id,
                    initialCost: factState.initialCost,
                    specialTerms: factState.specialTerms
                })
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            alert('승인 처리되었습니다.');
            if (factApproveButton) factApproveButton.textContent = '저장 및 승인';
            setFactDisabled(false);
            if (window.BuildingDetailPanels) window.BuildingDetailPanels.setPanel(1);
        } catch (error) {
            console.error('승인 처리 오류:', error);
            if (factApproveButton) factApproveButton.textContent = '저장 및 승인';
            setFactDisabled(false);
            alert('승인 처리 중 오류가 발생했습니다: ' + (error && error.message ? error.message : ''));
        }
    }

    async function handleReject() {
        if (!state.producer || !state.id) return;
        if (!confirm('반려 처리하시겠습니까?')) return;

        try {
            setFactDisabled(true);
            const apiUrl = `${API_BASE_URL}/aders/fact/detail/reject/${encodeURIComponent(
                state.producer
            )}/${encodeURIComponent(String(state.id))}`;
            const response = await fetch(apiUrl, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            alert('반려 처리되었습니다.');
            setFactDisabled(false);
            if (window.BuildingDetailPanels) window.BuildingDetailPanels.setPanel(1);
        } catch (error) {
            console.error('반려 처리 오류:', error);
            setFactDisabled(false);
            alert('반려 처리 중 오류가 발생했습니다: ' + (error && error.message ? error.message : ''));
        }
    }

    if (factCloseButton) {
        factCloseButton.addEventListener('click', () => {
            if (window.BuildingDetailPanels) window.BuildingDetailPanels.setPanel(1);
        });
    }
    if (factInitialCostTab) {
        factInitialCostTab.addEventListener('click', () => setFactTab('initialCost'));
    }
    if (factSpecialTermsTab) {
        factSpecialTermsTab.addEventListener('click', () => setFactTab('specialTerms'));
    }
    if (factApproveButton) {
        factApproveButton.addEventListener('click', () => handleApprove());
    }
    if (factRejectButton) {
        factRejectButton.addEventListener('click', () => handleReject());
    }

    setFactHeader('건물명', '관리회사명');
    setFactHint('', false);
    setFactDisabled(true);

    window.BuildingDetailFact = {
        ensureLoaded: () => ensureLoaded(false),
        ensureLoadedForce: () => ensureLoaded(true)
    };
})();

