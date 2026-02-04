/**
 * detail.shared.js
 * - 공통 상태/유틸/API 설정
 * - 다른 detail.*.js에서 window.BuildingDetailShared로 접근
 */
(() => {
  // const API_BASE_URL = 'https://www.houberapp.com';
  const API_BASE_URL = 'http://localhost:40011';

  const BUILDING_FACILITIES = {
    dedicatedGarbagePatch: '전용 쓰레기장',
    intercom: '인터폰',
    autoRock: '오토록',
    deliveryBox: '택배함',
    securityCamera: '방범 카메라',
    bicycleStorage: '자전거보관소',
    elevator: '엘리베이터',
    petFootWashroom: '반려동물 발 세척장',
    freeInternet: '무료 인터넷',
    withFriend: '2인입주 가능',
    allowPet: '반려동물 가능'
  };

  function parsePhotoMulti(photoMulti, filterType) {
    if (!photoMulti || typeof photoMulti !== 'string') return [];
    try {
      const photos = JSON.parse(photoMulti);
      if (!Array.isArray(photos)) return [];
      let list = photos;
      if (filterType) list = photos.filter((p) => p.type === filterType);
      return list.map((p) => ({ type: p.type || 'room', path: p.path || '' }));
    } catch (_e) {
      return [];
    }
  }

  function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const producer = params.get('producer');
    const id = params.get('id');
    if (!producer || !id) return null;
    return { producer, id: parseInt(id, 10) };
  }

  const state = {
    producer: '',
    id: '',
    raw: null,
    buildingPhotos: [],
    ilgongPhotoList: [],
    roomPhotos: [],
    ilgongRoomPhotoList: []
  };

  const detailLoading = document.getElementById('detailLoading');
  const detailError = document.getElementById('detailError');
  const detailContent = document.getElementById('detailContent');

  function showLoading(show) {
    if (!detailLoading) return;
    detailLoading.style.display = show ? 'block' : 'none';
  }

  function showError(msg) {
    if (detailLoading) detailLoading.style.display = 'none';
    if (detailContent) detailContent.style.display = 'none';
    if (detailError) {
      detailError.style.display = 'block';
      detailError.textContent = msg || '오류가 발생했습니다.';
    }
  }

  function showContent() {
    if (detailLoading) detailLoading.style.display = 'none';
    if (detailError) detailError.style.display = 'none';
    if (detailContent) detailContent.style.display = 'block';
  }

  window.BuildingDetailShared = {
    API_BASE_URL,
    BUILDING_FACILITIES,
    state,
    parsePhotoMulti,
    escapeHtml,
    getUrlParams,
    showLoading,
    showError,
    showContent
  };
})();

