/**
 * detail.js (bootstrap)
 * - 실제 로직은 detail.shared / detail.panels / detail.building / detail.fact / detail.overall 로 분리
 */
(() => {
  const S = window.BuildingDetailShared;
  if (!S) return;

  const { API_BASE_URL, state, getUrlParams, showLoading, showError, showContent } = S;

  const buildingTitle = document.getElementById('buildingTitle');

  async function fetchDetail(producer, id) {
    const url = `${API_BASE_URL}/aders/building/rent/detail/${producer}/${id}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('상세 조회 실패: ' + res.status);
    return res.json();
  }

  function init() {
    const params = getUrlParams();
    if (!params) {
      showError('producer와 id가 필요합니다. 목록에서 건물을 선택해 주세요.');
      const detailError = document.getElementById('detailError');
      if (detailError) {
        const link = document.createElement('a');
        link.href = '/aders/dashboard/building';
        link.textContent = '목록으로';
        link.className = 'back-link';
        link.style.marginTop = '1rem';
        detailError.appendChild(document.createElement('br'));
        detailError.appendChild(link);
      }
      return;
    }

    state.producer = params.producer;
    state.id = params.id;

    // 패널 네비 초기화는 detail.panels.js에서 처리

    showLoading(true);
    fetchDetail(params.producer, params.id)
      .then((raw) => {
        state.raw = raw;
        showContent();
        if (buildingTitle) buildingTitle.textContent = raw.buildingName || '건물 상세';

        if (window.BuildingDetailBuilding && typeof window.BuildingDetailBuilding.onBuildingLoaded === 'function') {
          window.BuildingDetailBuilding.onBuildingLoaded(raw);
        }
      })
      .catch((err) => {
        console.error(err);
        showError(err.message || '데이터를 불러오지 못했습니다.');
      });
  }

  init();
})();
