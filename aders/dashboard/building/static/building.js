/**
 * 건물 관리 - 리스트 페이지
 * 검색 시 결과만 아래 검색결과 영역(표)에 즉시 반영
 *
 * API
 * - GET /aders/building/search?q={q}[&producer={producer}]
 *
 * 응답
 * - List<ManageSearchResultDto>
 *   { producer, id, agentName, name, address, isAllowForeign, isAllowWorkingHoliday }
 *
 * 요구사항
 * - producer / id는 화면에 노출하지 않고, data-*로만 보관
 */

const API_BASE_URL = 'https://www.houberapp.com';
// 타이핑 도중 실시간 호출 방지(입력 멈춘 뒤 검색)
const DEBOUNCE_MS = 700;

const searchInput = document.getElementById('buildingSearch');
const buildingList = document.getElementById('buildingList');
const emptyState = document.getElementById('emptyState');
const filterButtons = document.querySelectorAll('.filter-btn[data-producer]');
const isForToggle = document.getElementById('isFor');
const isWhToggle = document.getElementById('isWh');
const isAgentToggle = document.getElementById('isAgent');

let searchTimeout = null;
let selectedProducer = ''; // '' | Producer 값 (data-producer)

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

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getDetailUrlFrom(producer, id) {
    return `/aders/dashboard/building/detail.html?producer=${encodeURIComponent(
        producer
    )}&id=${encodeURIComponent(id)}`;
}

function getBool(el) {
    return !!(el && el.checked);
}

function updateSearchPlaceholder() {
    if (!searchInput) return;
    if (getBool(isAgentToggle)) {
        searchInput.placeholder = '관리회사명으로 검색';
    } else {
        searchInput.placeholder = '건물명으로 검색';
    }
}

async function searchBuildings(query, producer, isFor, isWh, isAgent) {
    if (!query || query.trim().length === 0) return [];
    try {
        const params = new URLSearchParams();
        params.set('q', query.trim());
        if (producer && String(producer).trim().length > 0) {
            params.set('producer', String(producer).trim());
        }
        // 백엔드가 required=true 이므로 항상 보냄
        params.set('isFor', String(!!isFor));
        params.set('isWh', String(!!isWh));
        params.set('isAgent', String(!!isAgent));

        const url = `${API_BASE_URL}/aders/building/search?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('검색 요청 실패: ' + response.status);
        }
        const results = await response.json();
        return Array.isArray(results) ? results : [];
    } catch (error) {
        console.error('건물 검색 오류:', error);
        return [];
    }
}

function showLoading() {
    if (!buildingList) return;
    buildingList.innerHTML = '<div class="search-loading">검색 중...</div>';
    buildingList.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';
}

function renderResultsTable(results) {
    if (!buildingList) return;
    buildingList.style.display = 'block';

    if (!results || results.length === 0) {
        buildingList.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    const rows = results
        .map(function (b) {
            const producer = b && b.producer != null ? String(b.producer) : '';
            const id = b && b.id != null ? String(b.id) : '';

            const agentName = b && b.agentName != null ? String(b.agentName) : '-';
            const name = b && b.name != null ? String(b.name) : '-';
            const address = b && b.address != null ? String(b.address) : '-';

            const allowForeign = !!(b && b.isAllowForeign);
            const allowWh = !!(b && b.isAllowWorkingHoliday);

            return `
                <tr class="manage-row" data-producer="${escapeHtml(producer)}" data-id="${escapeHtml(id)}" tabindex="0">
                    <td class="manage-td manage-td-agent">${escapeHtml(agentName)}</td>
                    <td class="manage-td manage-td-name">${escapeHtml(name)}</td>
                    <td class="manage-td manage-td-address">${escapeHtml(address)}</td>
                    <td class="manage-td manage-td-flag">
                        <span class="flag-pill ${allowForeign ? 'flag-yes' : 'flag-no'}">${allowForeign ? '가능' : '불가'}</span>
                    </td>
                    <td class="manage-td manage-td-flag">
                        <span class="flag-pill ${allowWh ? 'flag-yes' : 'flag-no'}">${allowWh ? '가능' : '불가'}</span>
                    </td>
                </tr>
            `;
        })
        .join('');

    buildingList.innerHTML = `
        <div class="manage-table-wrap">
            <table class="manage-table">
                <thead>
                    <tr>
                        <th class="manage-th">관리회사</th>
                        <th class="manage-th">건물명</th>
                        <th class="manage-th">주소</th>
                        <th class="manage-th">외국인</th>
                        <th class="manage-th">워홀</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}

function setProducerActive(value) {
    selectedProducer = value;
    if (filterButtons && filterButtons.length) {
        filterButtons.forEach(function (btn) {
            const v = btn.getAttribute('data-producer') || '';
            const active = v === selectedProducer;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }
}

async function onSearchInput() {
    const query = searchInput ? searchInput.value.trim() : '';
    if (!query) {
        if (buildingList) {
            buildingList.innerHTML = '';
            buildingList.style.display = 'none';
        }
        if (emptyState) emptyState.style.display = 'none';
        return;
    }

    showLoading();
    const results = await searchBuildings(
        query,
        selectedProducer,
        getBool(isForToggle),
        getBool(isWhToggle),
        getBool(isAgentToggle)
    );
    renderResultsTable(results);
}

if (searchInput) {
    searchInput.addEventListener(
        'input',
        debounce(function () {
            onSearchInput();
        }, DEBOUNCE_MS)
    );
}

if (filterButtons && filterButtons.length) {
    filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const value = btn.getAttribute('data-producer') || '';
            setProducerActive(value);
            if (searchInput && searchInput.value.trim().length > 0) {
                onSearchInput();
            }
        });
    });
}

// 토글 변경 시에도 재검색 (q는 필수라서 입력이 있을 때만)
function onToggleChange() {
    updateSearchPlaceholder();
    if (searchInput && searchInput.value.trim().length > 0) {
        onSearchInput();
    }
}

if (isForToggle) isForToggle.addEventListener('change', onToggleChange);
if (isWhToggle) isWhToggle.addEventListener('change', onToggleChange);
if (isAgentToggle) isAgentToggle.addEventListener('change', onToggleChange);

updateSearchPlaceholder();

if (buildingList) {
    buildingList.addEventListener('click', function (e) {
        const tr = e.target && e.target.closest ? e.target.closest('tr.manage-row') : null;
        if (!tr) return;

        const id = tr.getAttribute('data-id') || '';
        const producer = tr.getAttribute('data-producer') || '';
        if (!id || !producer) return;

        window.open(getDetailUrlFrom(producer, id), "_blank", "noopener,noreferrer");
    });

    buildingList.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const tr = e.target && e.target.closest ? e.target.closest('tr.manage-row') : null;
        if (!tr) return;
        e.preventDefault();

        const id = tr.getAttribute('data-id') || '';
        const producer = tr.getAttribute('data-producer') || '';
        if (!id || !producer) return;

        window.open(getDetailUrlFrom(producer, id), "_blank", "noopener,noreferrer");
    });
}
