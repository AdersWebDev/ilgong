/**
 * detail.building.js
 * - 건물 상세(폼/사진/설비/가림처리/저장 placeholder)
 * - 의존: window.BuildingDetailShared
 */
(() => {
    const S = window.BuildingDetailShared;
    if (!S) return;
    const U = window.BuildingFormUtils;
    if (!U) return;
    const PhotoApi = window.BuildingPhotoApi;
    if (!PhotoApi) return;

    const { BUILDING_FACILITIES, parsePhotoMulti, state, escapeHtml } = S;

    const buildingForm = document.getElementById('buildingForm');
    const listPhotoPreview = document.getElementById('listPhotoPreview');
    const listPhoto = document.getElementById('listPhoto');
    const listPhotoInput = document.getElementById('listPhotoInput');
    const listPhotoCard = document.getElementById('listPhotoCard');
    const buildingPhotoList = document.getElementById('buildingPhotoList');
    const buildingPhotoAdd = document.getElementById('buildingPhotoAdd');
    const buildingPhotoInput = document.getElementById('buildingPhotoInput');
    const cancelBtn = document.getElementById('cancelBtn');
    const buildingClassification = document.getElementById('buildingClassification');

    // 저장 전 변경점 모달
    const saveDiffModal = document.getElementById('saveDiffModal');
    const saveDiffBody = document.getElementById('saveDiffBody');
    const saveDiffSubtitle = document.getElementById('saveDiffSubtitle');
    const saveDiffCloseBtn = document.getElementById('saveDiffCloseBtn');
    const saveDiffCancelBtn = document.getElementById('saveDiffCancelBtn');
    const saveDiffConfirmBtn = document.getElementById('saveDiffConfirmBtn');

    // 저장 요청 중 전역 락
    let isRequestLocked = false;
    let requestLockEl = null;
    let releaseBeforeUnload = null;
    let keydownBlocker = null;

    function setRequestLock(on, message) {
        isRequestLocked = !!on;

        if (isRequestLocked) {
            if (!requestLockEl) {
                requestLockEl = document.createElement('div');
                requestLockEl.id = 'requestLockOverlay';
                requestLockEl.className = 'request-lock-overlay';
                requestLockEl.innerHTML = `
                    <div class="request-lock-card" role="alert" aria-live="assertive">
                        <div class="request-lock-spinner" aria-hidden="true"></div>
                        <div class="request-lock-title">저장 중입니다</div>
                        <div class="request-lock-subtitle" id="requestLockSubtitle"></div>
                    </div>
                `;
                document.body.appendChild(requestLockEl);
            }

            const subtitle = requestLockEl.querySelector('#requestLockSubtitle');
            if (subtitle) subtitle.textContent = message || '응답이 올 때까지 잠시만 기다려 주세요.';

            requestLockEl.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.body.setAttribute('aria-busy', 'true');

            // 페이지 이탈 방지(브라우저가 메시지는 무시할 수 있음)
            const beforeUnloadHandler = (e) => {
                e.preventDefault();
                e.returnValue = '';
                return '';
            };
            window.addEventListener('beforeunload', beforeUnloadHandler);
            releaseBeforeUnload = () => window.removeEventListener('beforeunload', beforeUnloadHandler);

            // 키보드 입력/ESC 등 차단
            keydownBlocker = (e) => {
                e.preventDefault();
                e.stopPropagation();
            };
            document.addEventListener('keydown', keydownBlocker, true);
        } else {
            if (requestLockEl) requestLockEl.style.display = 'none';
            document.body.style.overflow = '';
            document.body.removeAttribute('aria-busy');

            if (releaseBeforeUnload) releaseBeforeUnload();
            releaseBeforeUnload = null;

            if (keydownBlocker) document.removeEventListener('keydown', keydownBlocker, true);
            keydownBlocker = null;
        }
    }

    function validateBasicSectionRequired() {
        if (!buildingForm) return true;

        const nameEl = document.getElementById('buildingName');
        const addressEl = document.getElementById('address');
        const dateEl = document.getElementById('constructionDate');
        const structureEl = document.getElementById('structure');
        const latEl = document.getElementById('lat');
        const lngEl = document.getElementById('lng');

        const setTrimRequired = (el, label) => {
            if (!el) return;
            const v = (el.value || '').trim();
            if (!v) {
                el.setCustomValidity(`${label}은(는) 필수입니다.`);
            } else {
                el.setCustomValidity('');
                // 저장 전에 공백만 입력된 케이스 방지
                if (el.value !== v) el.value = v;
            }
        };

        setTrimRequired(nameEl, '건물명');
        setTrimRequired(addressEl, '주소');

        if (dateEl) {
            const d = U.normalizeLocalDateString(dateEl.value);
            dateEl.setCustomValidity(d ? '' : '건축일은 필수입니다. (YYYY-MM-DD)');
        }

        if (structureEl) {
            const st = U.normalizeStructureEnum(structureEl.value);
            structureEl.setCustomValidity(st ? '' : '구조는 필수입니다.');
        }

        if (latEl) {
            latEl.setCustomValidity(U.toNumberOrNull(latEl.value) == null ? '위도는 필수입니다.' : '');
        }
        if (lngEl) {
            lngEl.setCustomValidity(U.toNumberOrNull(lngEl.value) == null ? '경도는 필수입니다.' : '');
        }

        return buildingForm.reportValidity();
    }

    function resolveBaseDomain() {
        // 우선순위: 최초 상세 응답(raw) > Shared API_BASE_URL > location.origin
        const rawBase =
            (state.raw && (state.raw.base_domain || state.raw.baseDomain || state.raw.baseUrl || state.raw.baseURL)) || '';
        return (rawBase && String(rawBase).trim()) || (S.API_BASE_URL && String(S.API_BASE_URL).trim()) || window.location.origin;
    }

    /** 서버로 보낼 값: 경로만 (예: /building/xxx.png). 표시는 도메인 + /content/original + 경로. */
    function setListPhotoDisplay(urlOrPath) {
        const u = (urlOrPath && String(urlOrPath).trim()) || '';
        if (listPhoto) listPhoto.value = u;
        if (listPhotoPreview) {
            if (u) {
                const fullUrl = u.startsWith('http') ? u : (S3_PHOTO_BASE_URL + PHOTO_DISPLAY_PREFIX + (u.startsWith('/') ? u : '/' + u));
                listPhotoPreview.style.backgroundImage = 'url(' + fullUrl + ')';
                listPhotoPreview.textContent = '';
            } else {
                listPhotoPreview.style.backgroundImage = '';
                listPhotoPreview.textContent = '';
            }
        }
    }

    function bindBasicInfo(data) {
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value == null ? '' : String(value);
        };
        set('buildingName', data.buildingName);
        set('address', data.address);
        set('constructionDate', U.normalizeLocalDateString(data.constructionDate));
        set('structure', U.normalizeStructureEnum(data.structure));

        // 위/경도
        const latVal = data.lat ?? data.latitude ?? '';
        const lngVal = data.lng ?? data.lon ?? data.longitude ?? '';
        set('lat', latVal);
        set('lng', lngVal);

        set('trans1', data.trans1);
        set('trans2', data.trans2);
        set('trans3', data.trans3);
        setListPhotoDisplay(data.photo);
    }

    /**
     * 현재 대표 사진 값이 URL인지 photoId인지 판별.
     * 루트 도메인에 "realnetpro"가 포함되면 URL, 아니면 photoId.
     */
    function isCurrentListPhotoId() {
        const val = (listPhoto && listPhoto.value ? listPhoto.value : (state.raw && state.raw.photo ? state.raw.photo : '')).trim();
        if (!val) return false;
        if (!/^https?:\/\//i.test(val)) return true;
        try {
            const host = new URL(val).hostname || '';
            return host.indexOf('realnetpro') === -1;
        } catch (_e) {
            return true;
        }
    }

    function getCurrentListPhotoValue() {
        return (listPhoto && listPhoto.value ? listPhoto.value : (state.raw && state.raw.photo ? state.raw.photo : '')).trim();
    }

    /**
     * keyOriginal로 표시용 URL 구성. base + keyOriginal (선행 슬래시 정규화).
     */
    const S3_PHOTO_BASE_URL = 'https://ilgong.s3.ap-northeast-3.amazonaws.com';
    /** 표시 시 base 뒤에 붙는 prefix. 저장/전송 값에는 포함하지 않음. */
    const PHOTO_DISPLAY_PREFIX = '/content/original';

    async function uploadListPhotoFile(file) {
        if (!file || !state.id) {
            alert('건물 정보를 먼저 불러온 후 업로드해 주세요.');
            return;
        }
        const baseUrl = resolveBaseDomain();
        const hintEl = listPhotoCard ? listPhotoCard.querySelector('.list-photo-card-hint') : null;
        const inputEl = listPhotoInput;
        const setUploading = (on) => {
            if (hintEl) hintEl.textContent = on ? '업로드 중…' : '이미지 첨부';
            if (inputEl) inputEl.disabled = !!on;
        };

        setUploading(true);
        try {
            const currentVal = getCurrentListPhotoValue();
            if (currentVal && isCurrentListPhotoId()) {
                await PhotoApi.deletePhoto(baseUrl, currentVal);
            }

            const result = await PhotoApi.uploadByPresign(file, {
                baseUrl,
                buildingId: state.id,
                filename: file.name || 'image',
                contentType: file.type || 'image/jpeg',
                size: file.size
            });
            const pathOnly = result.pathOnly;
            setListPhotoDisplay(pathOnly);
            if (state.raw) state.raw.photo = pathOnly;
        } catch (err) {
            console.error(err);
            alert(err && err.message ? err.message : '대표 사진 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
            if (inputEl) inputEl.value = '';
        }
    }

    if (listPhotoInput) {
        if (listPhotoCard) {
            listPhotoCard.addEventListener('click', (e) => {
                if (e.target === listPhotoInput) return;
                e.preventDefault();
                e.stopPropagation();
                alert('주의! 사진 변경은 돌이킬 수 없습니다');
                listPhotoInput.click();
            });
        }
        listPhotoInput.addEventListener('change', (e) => {
            const file = e.target && e.target.files && e.target.files[0];
            if (!file) return;
            const name = (file.name || '').toLowerCase();
            const isImage = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || (file.type === 'image/jpeg') || (file.type === 'image/png');
            if (!isImage) {
                alert('jpg, jpeg, png만 가능합니다');
                e.target.value = '';
                return;
            }
            uploadListPhotoFile(file);
        });
    }

    function renderBuildingFacilities(data) {
        const container = document.getElementById('buildingFacilities');
        if (!container) return;
        container.innerHTML = Object.entries(BUILDING_FACILITIES)
            .map(
                ([key, label]) => `
        <label class="facility-item">
            <input type="checkbox" name="buildingFacility_${key}" data-key="${key}" ${data[key] ? 'checked' : ''}>
            <span>${label}</span>
        </label>
    `
            )
            .join('');
    }

    function setClassifyButtonState(key, on) {
        if (!buildingClassification) return;
        const btn = buildingClassification.querySelector(`.classify-btn[data-key="${key}"]`);
        if (!btn) return;
        const active = !!on;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.dataset.value = active ? 'true' : 'false';
    }

    function getClassifyValue(key) {
        if (!buildingClassification) return false;
        const btn = buildingClassification.querySelector(`.classify-btn[data-key="${key}"]`);
        if (!btn) return false;
        return btn.getAttribute('aria-pressed') === 'true';
    }

    function renderClassification(data) {
        if (!buildingClassification) return;
        const toBool = (v) => v === true || v === 'true' || v === 1 || v === '1';
        const root = data || {};
        const room0 = root.ilgongRooms && root.ilgongRooms[0] ? root.ilgongRooms[0] : {};
        setClassifyButtonState('allowForeigner', toBool(root.allowForeigner ?? room0.allowForeigner));
        setClassifyButtonState('allowWorkingHoliday', toBool(root.allowWorkingHoliday ?? room0.allowWorkingHoliday));
    }

    if (buildingClassification) {
        buildingClassification.querySelectorAll('.classify-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                const next = btn.getAttribute('aria-pressed') !== 'true';
                setClassifyButtonState(key, next);
            });
        });
    }

    function renderBuildingPhotos(photos) {
        state.buildingPhotos = photos && photos.length ? [...photos] : [];
        if (!buildingPhotoList) return;
        buildingPhotoList.innerHTML = state.buildingPhotos
            .map(
                (p, i) => `
        <div class="photo-item" data-index="${i}">
            <img src="${p.path}" alt="건물 사진 ${i + 1}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2290%22><rect fill=%22%23eee%22 width=%22120%22 height=%2290%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22>No image</text></svg>'">
        </div>
    `
            )
            .join('');
    }

    const ilgongPhotoListEl = document.getElementById('ilgongPhotoList');
    const ilgongPhotoAdd = document.getElementById('ilgongPhotoAdd');
    const ilgongPhotoInput = document.getElementById('ilgongPhotoInput');

    function renderIlgongPhotoList() {
        const list = state.ilgongPhotoList || [];
        if (!ilgongPhotoListEl) return;
        ilgongPhotoListEl.innerHTML = list
            .map((item, i) => {
                const path = typeof item === 'string' ? item : (item && item.path) || '';
                const displayUrl = path.startsWith('http') ? path : S3_PHOTO_BASE_URL + PHOTO_DISPLAY_PREFIX + (path.startsWith('/') ? path : '/' + path);
                return `
        <div class="photo-item ilgong-photo-draggable" data-ilgong-index="${i}" draggable="true" role="button" tabindex="0" aria-label="순서 변경 가능">
            <img src="${displayUrl}" alt="건물 사진 ${i + 1}" draggable="false" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2290%22><rect fill=%22%23eee%22 width=%22120%22 height=%2290%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%23999%22 text-anchor=%22middle%22 dy=%22.3em%22>No image</text></svg>'">
            <div class="photo-item-actions"><button type="button" class="btn-remove ilgong-photo-remove" data-ilgong-index="${i}">삭제</button></div>
        </div>
    `;
            })
            .join('');
        ilgongPhotoListEl.querySelectorAll('.ilgong-photo-remove').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const i = parseInt(btn.dataset.ilgongIndex, 10);
                const item = state.ilgongPhotoList[i];
                const path = typeof item === 'string' ? item : (item && item.path) || '';
                const id = (typeof item === 'object' && item && item.photoId) || path;
                if (!id) return;
                const baseUrl = resolveBaseDomain();
                try {
                    await PhotoApi.deletePhoto(baseUrl, id);
                    state.ilgongPhotoList.splice(i, 1);
                    renderIlgongPhotoList();
                } catch (err) {
                    console.error(err);
                    alert(err && err.message ? err.message : '삭제에 실패했습니다.');
                }
            });
        });
    }

    function setupIlgongPhotoListDrag() {
        if (!ilgongPhotoListEl) return;
        let draggedIndex = null;

        ilgongPhotoListEl.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.ilgong-photo-draggable');
            if (!item) return;
            const i = parseInt(item.dataset.ilgongIndex, 10);
            if (Number.isNaN(i)) return;
            draggedIndex = i;
            item.classList.add('ilgong-photo-dragging');
            e.dataTransfer.setData('text/plain', String(i));
            e.dataTransfer.effectAllowed = 'move';
        });

        ilgongPhotoListEl.addEventListener('dragend', (e) => {
            const item = e.target.closest('.ilgong-photo-draggable');
            if (item) item.classList.remove('ilgong-photo-dragging');
            ilgongPhotoListEl.querySelectorAll('.ilgong-photo-drag-over').forEach((el) => el.classList.remove('ilgong-photo-drag-over'));
            draggedIndex = null;
        });

        ilgongPhotoListEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const item = e.target.closest('.ilgong-photo-draggable');
            if (!item || draggedIndex == null) return;
            ilgongPhotoListEl.querySelectorAll('.ilgong-photo-drag-over').forEach((el) => el.classList.remove('ilgong-photo-drag-over'));
            item.classList.add('ilgong-photo-drag-over');
        });

        ilgongPhotoListEl.addEventListener('dragleave', (e) => {
            if (!ilgongPhotoListEl.contains(e.relatedTarget)) {
                ilgongPhotoListEl.querySelectorAll('.ilgong-photo-drag-over').forEach((el) => el.classList.remove('ilgong-photo-drag-over'));
            }
        });

        ilgongPhotoListEl.addEventListener('drop', (e) => {
            e.preventDefault();
            ilgongPhotoListEl.querySelectorAll('.ilgong-photo-drag-over').forEach((el) => el.classList.remove('ilgong-photo-drag-over'));
            const item = e.target.closest('.ilgong-photo-draggable');
            if (!item || draggedIndex == null) return;
            const toIndex = parseInt(item.dataset.ilgongIndex, 10);
            if (Number.isNaN(toIndex) || draggedIndex === toIndex) return;
            const arr = state.ilgongPhotoList;
            const [removed] = arr.splice(draggedIndex, 1);
            arr.splice(toIndex, 0, removed);
            renderIlgongPhotoList();
        });
    }

    async function uploadIlgongPhotoFile(file) {
        if (!file || !state.id) {
            alert('건물 정보를 먼저 불러온 후 업로드해 주세요.');
            return;
        }
        const baseUrl = resolveBaseDomain();
        try {
            const result = await PhotoApi.uploadByPresign(file, {
                baseUrl,
                buildingId: state.id,
                filename: file.name || 'image.jpg',
                contentType: file.type || 'image/jpeg',
                size: file.size
            });
            state.ilgongPhotoList.push({ path: result.pathOnly, photoId: result.photoId });
            renderIlgongPhotoList();
        } catch (err) {
            console.error(err);
            alert(err && err.message ? err.message : '건물 사진 업로드 중 오류가 발생했습니다.');
        }
    }

    function setupIlgongPhotoListAdd() {
        if (!ilgongPhotoAdd || !ilgongPhotoInput) return;
        ilgongPhotoAdd.addEventListener('click', () => ilgongPhotoInput.click());
        ilgongPhotoInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (!files || !files.length) return;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const name = (file.name || '').toLowerCase();
                const isJpg = name.endsWith('.jpg') || name.endsWith('.jpeg') || (file.type === 'image/jpeg');
                if (!isJpg) {
                    alert('jpg 확장자만 가능합니다');
                    e.target.value = '';
                    return;
                }
            }
            (async () => {
                for (let i = 0; i < files.length; i++) {
                    await uploadIlgongPhotoFile(files[i]);
                }
            })();
            e.target.value = '';
        });
    }

    function setupBuildingPhotoAdd() {
        if (!buildingPhotoAdd || !buildingPhotoInput) return;
        buildingPhotoAdd.addEventListener('click', () => buildingPhotoInput.click());
        buildingPhotoInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (!files || !files.length) return;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = () => {
                    state.buildingPhotos.push({ type: 'building', path: reader.result });
                    renderBuildingPhotos(state.buildingPhotos);
                };
                reader.readAsDataURL(file);
            }
            buildingPhotoInput.value = '';
        });
    }

    function collectPayload() {
        const form = buildingForm;
        if (!form) return {};

        const get = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : '';
        };

        const buildingFacilities = {};
        Object.keys(BUILDING_FACILITIES).forEach((key) => {
            const el = form.querySelector(`input[name="buildingFacility_${key}"]`);
            buildingFacilities[key] = el ? el.checked : false;
        });

        return {
            producer: state.producer,
            id: state.id,
            buildingName: get('buildingName'),
            address: get('address'),
            constructionDate: get('constructionDate'),
            structure: get('structure'),
            lat: get('lat'),
            lng: get('lng'),
            allowForeigner: getClassifyValue('allowForeigner'),
            allowWorkingHoliday: getClassifyValue('allowWorkingHoliday'),
            trans1: get('trans1'),
            trans2: get('trans2'),
            trans3: get('trans3'),
            photo: get('listPhoto') || '',
            buildingFacilities
        };
    }

    const BUILDING_FIELD_LABELS = {
        buildingName: '건물명',
        address: '주소',
        constructionDate: '건축일',
        structure: '구조',
        lat: '위도',
        lng: '경도',
        allowForeigner: '외국인 가능',
        allowWorkingHoliday: '워홀 가능',
        trans1: '교통 1',
        trans2: '교통 2',
        trans3: '교통 3',
        photo: '대표 사진'
    };

    function snapshotFromRaw(raw) {
        const buildingFacilities = {};
        Object.keys(BUILDING_FACILITIES).forEach((k) => {
            buildingFacilities[k] = raw ? U.toBoolLoose(raw[k]) : false;
        });

        const room0 = raw && raw.ilgongRooms && raw.ilgongRooms[0] ? raw.ilgongRooms[0] : null;

        const ilgongPhotoList = Array.isArray(raw.ilgongPhotoList)
            ? raw.ilgongPhotoList.map((p) => (typeof p === 'string' ? p : (p && p.path) || ''))
            : [];
        const rooms = (raw.ilgongRooms || []).map((r, i) => ({
            roomName: (r && (r.roomName || r.number)) || `${i + 1}호`,
            ilgongRoomPhotoList: Array.isArray(r.ilgongRoomPhotoList) ? r.ilgongRoomPhotoList.map((p) => (typeof p === 'string' ? p : (p && p.path) || '')) : []
        }));
        return {
            building: {
                buildingName: raw.buildingName,
                address: raw.address,
                constructionDate: U.normalizeLocalDateString(raw.constructionDate),
                structure: U.normalizeStructureEnum(raw.structure),
                lat: raw.lat,
                lng: raw.lng,
                allowForeigner: U.toBoolLoose(raw.allowForeigner ?? (room0 ? room0.allowForeigner : undefined)),
                allowWorkingHoliday: U.toBoolLoose(raw.allowWorkingHoliday ?? (room0 ? room0.allowWorkingHoliday : undefined)),
                trans1: raw.trans1,
                trans2: raw.trans2,
                trans3: raw.trans3,
                photo: (raw.photo && String(raw.photo).trim()) || '',
                buildingFacilities
            },
            ilgongPhotoList,
            rooms
        };
    }

    function snapshotFromForm() {
        const payload = collectPayload();
        const ilgongPhotoList = (state.ilgongPhotoList || []).map((x) =>
            typeof x === 'string' ? x : (x && x.path) || ''
        );
        const rawRooms = (state.raw && state.raw.ilgongRooms) || [];
        const rooms = (state.ilgongRoomPhotoList || []).map((list, i) => {
            const r = rawRooms[i];
            const roomName = (r && (r.roomName || r.number)) || `${i + 1}호`;
            return {
                roomName,
                ilgongRoomPhotoList: (list || []).map((x) => (typeof x === 'string' ? x : (x && x.path) || ''))
            };
        });

        return {
            building: {
                buildingName: payload.buildingName,
                address: payload.address,
                constructionDate: U.normalizeLocalDateString(payload.constructionDate),
                structure: U.normalizeStructureEnum(payload.structure),
                lat: payload.lat,
                lng: payload.lng,
                allowForeigner: payload.allowForeigner === true,
                allowWorkingHoliday: payload.allowWorkingHoliday === true,
                trans1: payload.trans1,
                trans2: payload.trans2,
                trans3: payload.trans3,
                photo: (payload.photo && String(payload.photo).trim()) || '',
                buildingFacilities: payload.buildingFacilities || {}
            },
            ilgongPhotoList,
            rooms
        };
    }

    function buildDiff(baseline, current) {
        const groups = [];
        const changes = [];

        function pushChange(groupId, groupTitle, label, beforeVal, afterVal) {
            changes.push({ groupId, groupTitle, label, beforeVal, afterVal });
        }

        // building fields
        const b0 = baseline.building;
        const b1 = current.building;
        const basicKeys = ['buildingName', 'address', 'constructionDate', 'structure', 'lat', 'lng'];
        const transKeys = ['trans1', 'trans2', 'trans3'];
        const classifyKeys = ['allowForeigner', 'allowWorkingHoliday'];

        basicKeys.forEach((k) => {
            if (U.normalizeValue(b0[k]) !== U.normalizeValue(b1[k])) {
                pushChange('b.basic', '건물 · 기본', BUILDING_FIELD_LABELS[k], b0[k], b1[k]);
            }
        });
        transKeys.forEach((k) => {
            if (U.normalizeValue(b0[k]) !== U.normalizeValue(b1[k])) {
                pushChange('b.transit', '건물 · 교통', BUILDING_FIELD_LABELS[k], b0[k], b1[k]);
            }
        });
        classifyKeys.forEach((k) => {
            if (U.normalizeValue(b0[k]) !== U.normalizeValue(b1[k])) {
                pushChange('b.classify', '건물 · 분류/공개', BUILDING_FIELD_LABELS[k], b0[k], b1[k]);
            }
        });
        if (U.normalizeValue(b0.photo) !== U.normalizeValue(b1.photo)) {
            pushChange('b.photo', '건물 · 대표 사진', BUILDING_FIELD_LABELS.photo, b0.photo, b1.photo);
        }

        const list0 = Array.isArray(baseline.ilgongPhotoList) ? baseline.ilgongPhotoList : [];
        const list1 = Array.isArray(current.ilgongPhotoList) ? current.ilgongPhotoList : [];
        const list0Str = JSON.stringify(list0);
        const list1Str = JSON.stringify(list1);
        if (list0Str !== list1Str) {
            pushChange('b.ilgongPhotoList', '건물 · 건물 사진', '건물 사진', list0.length + '장', list1.length + '장');
        }

        const rooms0 = baseline.rooms || [];
        const rooms1 = current.rooms || [];
        const maxRooms = Math.max(rooms0.length, rooms1.length);
        for (let i = 0; i < maxRooms; i++) {
            const list0 = (rooms0[i] && rooms0[i].ilgongRoomPhotoList) || [];
            const list1 = (rooms1[i] && rooms1[i].ilgongRoomPhotoList) || [];
            if (JSON.stringify(list0) !== JSON.stringify(list1)) {
                const roomName = (rooms0[i] && rooms0[i].roomName) || (rooms1[i] && rooms1[i].roomName) || `${i + 1}호`;
                pushChange('rooms.ilgongRoomPhotoList', '호실 · 호실 사진', roomName, `기존 ${list0.length}장`, `저장 시 ${list1.length}장`);
            }
        }

        // facilities diff (only changed keys)
        Object.keys(BUILDING_FACILITIES).forEach((k) => {
            const v0 = !!b0.buildingFacilities[k];
            const v1 = !!b1.buildingFacilities[k];
            if (v0 !== v1) {
                pushChange('b.fac', '건물 · 설비', BUILDING_FACILITIES[k], v0, v1);
            }
        });

        // group
        const groupMap = new Map();
        changes.forEach((c) => {
            if (!groupMap.has(c.groupId)) {
                groupMap.set(c.groupId, { title: c.groupTitle, items: [] });
            }
            groupMap.get(c.groupId).items.push(c);
        });

        // preserve insertion order (changes order)
        const seen = new Set();
        changes.forEach((c) => {
            if (seen.has(c.groupId)) return;
            seen.add(c.groupId);
            groups.push(groupMap.get(c.groupId));
        });

        return { groups, count: changes.length };
    }

    function formatForDiff(label, rawValue) {
        const s = U.normalizeValue(rawValue);
        if (label === '구조') return U.STRUCTURE_ENUM_LABEL[s] || s;
        return s;
    }

    function renderDiffModal(diff) {
        if (!saveDiffBody || !saveDiffSubtitle || !saveDiffConfirmBtn) return;

        saveDiffSubtitle.textContent = `변경 사항 ${diff.count}개`;
        saveDiffConfirmBtn.disabled = diff.count === 0;

        if (diff.count === 0) {
            saveDiffBody.innerHTML = '<div class="diff-empty">변경 사항이 없습니다.</div>';
            return;
        }

        saveDiffBody.innerHTML = diff.groups
            .map((g) => {
                const itemsHtml = g.items
                    .map((it) => {
                        const beforeText = formatForDiff(it.label, it.beforeVal);
                        const afterText = formatForDiff(it.label, it.afterVal);
                        return `
                            <div class="diff-item">
                                <div class="diff-item-label">${it.label}</div>
                                <pre class="diff-line diff-removed">- ${escapeHtml(beforeText)}</pre>
                                <pre class="diff-line diff-added">+ ${escapeHtml(afterText)}</pre>
                            </div>
                        `;
                    })
                    .join('');
                return `
                    <div class="diff-group">
                        <div class="diff-group-title">${escapeHtml(g.title)}</div>
                        ${itemsHtml}
                    </div>
                `;
            })
            .join('');
    }

    function openDiffModal() {
        if (!saveDiffModal) return;
        saveDiffModal.style.display = 'block';
        saveDiffModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeDiffModal() {
        if (isRequestLocked) return;
        if (!saveDiffModal) return;
        saveDiffModal.style.display = 'none';
        saveDiffModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function applyEditsToRaw(raw) {
        const base = U.cloneJson(raw || {});
        const form = buildingForm;
        if (!form) return base;

        const snapshot = snapshotFromForm();

        // 건물(루트 키 그대로)
        base.buildingName = snapshot.building.buildingName;
        base.address = snapshot.building.address;
        base.constructionDate = U.normalizeLocalDateString(snapshot.building.constructionDate);
        base.structure = U.normalizeStructureEnum(snapshot.building.structure);

        // lat/lng는 number로 유지 (빈값이면 null)
        base.lat = U.toNumberOrNull(snapshot.building.lat);
        base.lng = U.toNumberOrNull(snapshot.building.lng);

        base.trans1 = snapshot.building.trans1;
        base.trans2 = snapshot.building.trans2;
        base.trans3 = snapshot.building.trans3;
        base.photo = (snapshot.building.photo && String(snapshot.building.photo).trim()) || '';

        base.ilgongPhotoList = (state.ilgongPhotoList || []).map((x) =>
            typeof x === 'string' ? x : (x && x.path) || ''
        );

        if (Array.isArray(base.ilgongRooms) && Array.isArray(state.ilgongRoomPhotoList)) {
            base.ilgongRooms = base.ilgongRooms.map((room, i) => {
                const rr = U.cloneJson(room);
                rr.ilgongRoomPhotoList = (state.ilgongRoomPhotoList[i] || []).map((x) =>
                    typeof x === 'string' ? x : (x && x.path) || ''
                );
                return rr;
            });
        }

        // 분류 플래그
        base.allowForeigner = snapshot.building.allowForeigner === true;
        base.allowWorkingHoliday = snapshot.building.allowWorkingHoliday === true;

        // 건물 설비는 루트에 boolean으로 존재
        Object.keys(BUILDING_FACILITIES).forEach((k) => {
            base[k] = snapshot.building.buildingFacilities && snapshot.building.buildingFacilities[k] === true;
        });

        return base;
    }

    function stripImagesForBackend(raw) {
        const out = U.cloneJson(raw || {});
        // 대표 사진(photo)은 payload에 포함해 전송 → DB 반영

        if (Array.isArray(out.ilgongRooms)) {
            out.ilgongRooms = out.ilgongRooms.map((r) => {
                const rr = U.cloneJson(r);
                if (rr && Object.prototype.hasOwnProperty.call(rr, 'layoutfile')) delete rr.layoutfile;
                if (rr && Object.prototype.hasOwnProperty.call(rr, 'photoMulti')) delete rr.photoMulti;
                return rr;
            });
        }

        // 내부 UI용 필드 정리
        if (Object.prototype.hasOwnProperty.call(out, 'buildingPhotos')) delete out.buildingPhotos;
        if (Object.prototype.hasOwnProperty.call(out, 'roomPhotos')) delete out.roomPhotos;
        return out;
    }

    let baselineSnapshot = null;
    let pendingCurrentSnapshot = null;

    /** 저장 시 감지되는 변동사항이 있으면 true */
    function hasUnsavedChanges() {
        if (!baselineSnapshot) return false;
        const current = snapshotFromForm();
        const diff = buildDiff(baselineSnapshot, current);
        return diff.count > 0;
    }

    function onBuildingLoaded(raw) {
        bindBasicInfo(raw);
        renderClassification(raw);
        renderBuildingFacilities(raw);

        let buildingPhotos = [];
        if (raw.ilgongRooms && raw.ilgongRooms.length > 0 && raw.ilgongRooms[0].photoMulti) {
            buildingPhotos = parsePhotoMulti(raw.ilgongRooms[0].photoMulti, 'building');
        }
        renderBuildingPhotos(buildingPhotos);
        state.ilgongPhotoList = Array.isArray(raw.ilgongPhotoList)
            ? raw.ilgongPhotoList.map((p) => ({ path: typeof p === 'string' ? p : (p && p.path) || '', photoId: undefined }))
            : [];
        renderIlgongPhotoList();
        setupBuildingPhotoAdd();
        setupIlgongPhotoListAdd();
        setupIlgongPhotoListDrag();

        // 호실 렌더
        if (window.BuildingDetailRooms && typeof window.BuildingDetailRooms.onRoomsLoaded === 'function') {
            window.BuildingDetailRooms.onRoomsLoaded(raw);
        }

        // baseline 저장(사진 제외)
        baselineSnapshot = snapshotFromRaw(raw);
    }

    if (buildingForm) {
        buildingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('[건물 저장] 폼 submit 발생');
            if (!validateBasicSectionRequired()) {
                console.log('[건물 저장] 검증 실패 - 필수 항목을 확인하세요.');
                return;
            }
            if (!baselineSnapshot) {
                console.log('[건물 저장] baselineSnapshot 없음');
                alert('초기 데이터를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
                return;
            }

            const currentSnapshot = snapshotFromForm();
            const diff = buildDiff(baselineSnapshot, currentSnapshot);
            console.log('[건물 저장] 변경 사항 수:', diff.count, '| ilgongPhotoList baseline:', baselineSnapshot.ilgongPhotoList?.length, '→ current:', currentSnapshot.ilgongPhotoList?.length);
            pendingCurrentSnapshot = currentSnapshot;
            renderDiffModal(diff);
            openDiffModal();
        });
    }

    // modal close handlers
    function bindModalClose(el) {
        if (!el) return;
        el.addEventListener('click', () => closeDiffModal());
    }
    bindModalClose(saveDiffCloseBtn);
    bindModalClose(saveDiffCancelBtn);

    if (saveDiffModal) {
        saveDiffModal.addEventListener('click', (e) => {
            const t = e.target;
            if (t && t.getAttribute && t.getAttribute('data-close') === 'true') {
                closeDiffModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (isRequestLocked) return;
        if (e.key === 'Escape' && saveDiffModal && saveDiffModal.style.display === 'block') {
            closeDiffModal();
        }
    });

    if (saveDiffConfirmBtn) {
        saveDiffConfirmBtn.addEventListener('click', async () => {
            console.log('[건물 저장] 최종 저장 버튼 클릭');
            if (!pendingCurrentSnapshot) {
                console.log('[건물 저장] pendingCurrentSnapshot 없음 - 클릭 무시');
                return;
            }
            const btn = saveDiffConfirmBtn;
            const prevText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '저장 중...';
            if (!validateBasicSectionRequired()) {
                btn.disabled = false;
                btn.textContent = prevText;
                return;
            }
            setRequestLock(true, '저장 요청을 보내는 중입니다.');

            try {
                const nextRaw = applyEditsToRaw(state.raw);
                const backendPayload = stripImagesForBackend(nextRaw);

                console.log('[건물 저장] 서버로 보낼 ilgongPhotoList:', backendPayload.ilgongPhotoList);

                const url = `${resolveBaseDomain()}/aders/building/detail`;
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(backendPayload)
                });

                if (!res.ok) {
                    let msg = `저장 실패: ${res.status}`;
                    try {
                        const t = await res.text();
                        if (t) msg += `\n${t}`;
                    } catch (_e) {
                        // ignore
                    }
                    throw new Error(msg);
                }

                // 서버가 최신 바디를 내려주면 그걸 기준으로 갱신
                let savedRaw = null;
                try {
                    savedRaw = await res.json();
                } catch (_e) {
                    savedRaw = null;
                }

                state.raw = savedRaw || nextRaw;
                state.ilgongPhotoList = Array.isArray(state.raw.ilgongPhotoList)
                    ? state.raw.ilgongPhotoList.map((p) => ({
                          path: typeof p === 'string' ? p : (p && p.path) || '',
                          photoId: undefined
                      }))
                    : [];
                state.ilgongRoomPhotoList = Array.isArray(state.raw.ilgongRooms)
                    ? state.raw.ilgongRooms.map((r) =>
                          Array.isArray(r.ilgongRoomPhotoList)
                              ? r.ilgongRoomPhotoList.map((p) => ({ path: typeof p === 'string' ? p : (p && p.path) || '', photoId: undefined }))
                              : []
                      )
                    : [];
                baselineSnapshot = snapshotFromRaw(state.raw);
                pendingCurrentSnapshot = null;
                closeDiffModal();
                if (window.BuildingDetailRooms && typeof window.BuildingDetailRooms.onRoomsLoaded === 'function') {
                    window.BuildingDetailRooms.onRoomsLoaded(state.raw);
                }
                alert('저장 완료');
            } catch (err) {
                console.error(err);
                alert(err && err.message ? err.message : '저장 중 오류가 발생했습니다.');
            } finally {
                setRequestLock(false);
                btn.disabled = false;
                btn.textContent = prevText;
            }
        });
    }

    const floatingCancelBtn = document.getElementById('floatingCancelBtn');

    function goToList() {
        if (hasUnsavedChanges() && !confirm('저장하지 않고 나가시겠습니까?\n변경 사항이 저장되지 않습니다.')) {
            return;
        }
        window.location.href = '/aders/dashboard/building';
    }
    if (cancelBtn) cancelBtn.addEventListener('click', goToList);
    if (floatingCancelBtn) floatingCancelBtn.addEventListener('click', goToList);

    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    window.BuildingDetailBuilding = { onBuildingLoaded };
})();

