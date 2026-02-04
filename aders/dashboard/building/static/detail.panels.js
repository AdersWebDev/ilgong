/**
 * detail.panels.js
 * - 상단 좌/우 네비 버튼 + 3패널(종합평가/상세/자료검수) 전환
 * - 자료검수는 풀스크린 클래스 토글
 */
(() => {
  const detailPanels = document.getElementById('detailPanels');
  const detailPanelPrev = document.getElementById('detailPanelPrev');
  const detailPanelNext = document.getElementById('detailPanelNext');
  const detailPanelNavTitle = document.getElementById('detailPanelNavTitle');

  let currentPanel = 1;
  if (detailPanels) {
    const initial = Number(detailPanels.getAttribute('data-panel'));
    if (!Number.isNaN(initial)) currentPanel = Math.max(0, Math.min(2, initial));
  }

  function updatePanelNavUi() {
    if (detailPanels) detailPanels.setAttribute('data-panel', String(currentPanel));

    if (detailPanelPrev) detailPanelPrev.disabled = currentPanel === 0;
    if (detailPanelNext) detailPanelNext.disabled = currentPanel === 2;

    if (detailPanelNavTitle) {
      detailPanelNavTitle.textContent =
        currentPanel === 0 ? '건물 종합평가' : currentPanel === 1 ? '건물 상세' : '자료 검수';
    }

    // 자료 검수(팩트) 패널은 풀스크린 모드
    document.body.classList.toggle('is-fact-fullscreen', currentPanel === 2);
    document.body.style.overflow = currentPanel === 2 ? 'hidden' : '';
  }

  function setPanel(panelIndex) {
    const next = Math.max(0, Math.min(2, Number(panelIndex) || 0));
    if (currentPanel === next) return;
    currentPanel = next;
    updatePanelNavUi();

    // 자료검수 진입 시 fact 로드 트리거
    if (currentPanel === 2 && window.BuildingDetailFact && typeof window.BuildingDetailFact.ensureLoaded === 'function') {
      window.BuildingDetailFact.ensureLoaded();
    }
  }

  function getPanel() {
    return currentPanel;
  }

  if (detailPanelPrev) {
    detailPanelPrev.addEventListener('click', () => setPanel(getPanel() - 1));
  }
  if (detailPanelNext) {
    detailPanelNext.addEventListener('click', () => setPanel(getPanel() + 1));
  }

  updatePanelNavUi();

  window.BuildingDetailPanels = { setPanel, getPanel, updatePanelNavUi };
})();

