/**
 * detail.rooms.js
 * - 호실 목록(아코디언) 렌더/편집/사진 관리
 * - 의존: window.BuildingDetailShared
 */
(() => {
    const S = window.BuildingDetailShared;
    if (!S) return;

    const { state, parsePhotoMulti, escapeHtml } = S;

    const roomAccordion = document.getElementById('roomAccordion');
    if (!roomAccordion) {
        window.BuildingDetailRooms = {
            onRoomsLoaded: () => {}
        };
        return;
    }

    const S3_PHOTO_BASE_URL = 'https://ilgong.s3.ap-northeast-3.amazonaws.com';
    const PHOTO_DISPLAY_PREFIX = '/content/original';

    function keyToPhotoPath(keyOriginal) {
        if (!keyOriginal || !String(keyOriginal).trim()) return '';
        let key = String(keyOriginal).trim().replace(/^\//, '').replace(/^content\/original\/?/i, '');
        return key ? '/' + key : '';
    }

    function resolveBaseDomain() {
        const rawBase = (state.raw && (state.raw.base_domain || state.raw.baseDomain || state.raw.baseUrl || state.raw.baseURL)) || '';
        return (rawBase && String(rawBase).trim()) || (S.API_BASE_URL && String(S.API_BASE_URL).trim()) || window.location.origin;
    }

    state.roomPhotos = [];
    state.ilgongRoomPhotoList = [];

    function buildRoomPhotosState(rooms) {
        state.roomPhotos = (rooms || []).map((r) => {
            const list = [];
            list.push(...parsePhotoMulti(r.photoMulti, 'room'));
            return list;
        });
        state.ilgongRoomPhotoList = (rooms || []).map((r) =>
            Array.isArray(r.ilgongRoomPhotoList)
                ? (r.ilgongRoomPhotoList || []).map((p) => ({ path: typeof p === 'string' ? p : (p && p.path) || '', photoId: undefined }))
                : []
        );
    }

    function renderIlgongRoomPhotoList(roomIndex) {
        const list = state.ilgongRoomPhotoList[roomIndex] || [];
        const listEl = roomAccordion.querySelector(`.ilgong-room-photo-list[data-room="${roomIndex}"]`);
        if (!listEl) return;
        listEl.innerHTML = list
            .map((item, i) => {
                const path = typeof item === 'string' ? item : (item && item.path) || '';
                const displayUrl = path.startsWith('http') ? path : S3_PHOTO_BASE_URL + PHOTO_DISPLAY_PREFIX + (path.startsWith('/') ? path : '/' + path);
                return `
        <div class="photo-item ilgong-room-photo-draggable" data-room="${roomIndex}" data-ilgong-index="${i}" draggable="true" role="button" tabindex="0">
            <img src="${escapeHtml(displayUrl)}" alt="호실 사진 ${i + 1}" draggable="false" onerror="this.style.background='#eee'">
            <div class="photo-item-actions"><button type="button" class="btn-remove ilgong-room-photo-remove" data-room="${roomIndex}" data-ilgong-index="${i}">삭제</button></div>
        </div>
    `;
            })
            .join('');

        listEl.querySelectorAll('.ilgong-room-photo-remove').forEach((btn) => {
            btn.addEventListener('click', async () => {
                const ri = parseInt(btn.dataset.room, 10);
                const i = parseInt(btn.dataset.ilgongIndex, 10);
                const item = (state.ilgongRoomPhotoList[ri] || [])[i];
                const path = typeof item === 'string' ? item : (item && item.path) || '';
                const id = (typeof item === 'object' && item && item.photoId) || path;
                if (!id) return;
                const baseUrl = resolveBaseDomain();
                try {
                    const res = await fetch(`${baseUrl}/aders/content?photoId=${encodeURIComponent(id)}`, { method: 'DELETE' });
                    if (!res.ok) throw new Error(`삭제 실패: ${res.status}`);
                    state.ilgongRoomPhotoList[ri].splice(i, 1);
                    renderIlgongRoomPhotoList(ri);
                } catch (err) {
                    console.error(err);
                    alert(err && err.message ? err.message : '삭제에 실패했습니다.');
                }
            });
        });
    }

    function setupRoomPhotoDrag(roomIndex) {
        const listEl = roomAccordion.querySelector(`.ilgong-room-photo-list[data-room="${roomIndex}"]`);
        if (!listEl) return;
        let draggedIndex = null;

        listEl.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.ilgong-room-photo-draggable');
            if (!item) return;
            const i = parseInt(item.dataset.ilgongIndex, 10);
            if (Number.isNaN(i)) return;
            draggedIndex = i;
            item.classList.add('ilgong-room-photo-dragging');
            e.dataTransfer.setData('text/plain', String(i));
            e.dataTransfer.effectAllowed = 'move';
        });

        listEl.addEventListener('dragend', (e) => {
            const item = e.target.closest('.ilgong-room-photo-draggable');
            if (item) item.classList.remove('ilgong-room-photo-dragging');
            listEl.querySelectorAll('.ilgong-room-photo-drag-over').forEach((el) => el.classList.remove('ilgong-room-photo-drag-over'));
            draggedIndex = null;
        });

        listEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const item = e.target.closest('.ilgong-room-photo-draggable');
            if (!item || draggedIndex == null) return;
            listEl.querySelectorAll('.ilgong-room-photo-drag-over').forEach((el) => el.classList.remove('ilgong-room-photo-drag-over'));
            item.classList.add('ilgong-room-photo-drag-over');
        });

        listEl.addEventListener('dragleave', (e) => {
            if (!listEl.contains(e.relatedTarget)) {
                listEl.querySelectorAll('.ilgong-room-photo-drag-over').forEach((el) => el.classList.remove('ilgong-room-photo-drag-over'));
            }
        });

        listEl.addEventListener('drop', (e) => {
            e.preventDefault();
            listEl.querySelectorAll('.ilgong-room-photo-drag-over').forEach((el) => el.classList.remove('ilgong-room-photo-drag-over'));
            const item = e.target.closest('.ilgong-room-photo-draggable');
            if (!item || draggedIndex == null) return;
            const toIndex = parseInt(item.dataset.ilgongIndex, 10);
            if (Number.isNaN(toIndex) || draggedIndex === toIndex) return;
            const arr = state.ilgongRoomPhotoList[roomIndex] || [];
            const [removed] = arr.splice(draggedIndex, 1);
            arr.splice(toIndex, 0, removed);
            renderIlgongRoomPhotoList(roomIndex);
            setupRoomPhotoDrag(roomIndex);
        });
    }

    async function uploadRoomPhotoFile(roomIndex, file) {
        if (!file || !state.id) {
            alert('건물 정보를 먼저 불러온 후 업로드해 주세요.');
            return;
        }
        const baseUrl = resolveBaseDomain();
        try {
            const presignRes = await fetch(`${baseUrl}/aders/photo/presign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buildingId: state.id,
                    filename: file.name || 'image.jpg',
                    contentType: file.type || 'image/jpeg',
                    size: file.size
                })
            });
            if (!presignRes.ok) {
                const t = await presignRes.text();
                throw new Error(t || `presign 실패: ${presignRes.status}`);
            }
            const presign = await presignRes.json();
            const { photoId, keyOriginal, uploadUrl } = presign;
            if (!uploadUrl) throw new Error('presign 응답에 uploadUrl이 없습니다.');

            const putRes = await fetch(uploadUrl, { method: 'PUT', body: file });
            if (!putRes.ok) throw new Error(`S3 업로드 실패: ${putRes.status}`);

            const completeRes = await fetch(`${baseUrl}/aders/presign/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoId })
            });
            if (!completeRes.ok) throw new Error(`complete 요청 실패: ${completeRes.status}`);
            const complete = await completeRes.json();
            let status = complete && complete.status ? String(complete.status) : '';

            if (status === 'UPLOADING') {
                for (let pollCount = 0; pollCount < 20; pollCount++) {
                    await new Promise((r) => setTimeout(r, 1500));
                    const r = await fetch(`${baseUrl}/aders/presign/complete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ photoId })
                    });
                    if (!r.ok) break;
                    const d = await r.json();
                    status = d && d.status ? String(d.status) : '';
                    if (status === 'READY') {
                        const pathOnly = keyToPhotoPath(d.keyOriginal);
                        if (!state.ilgongRoomPhotoList[roomIndex]) state.ilgongRoomPhotoList[roomIndex] = [];
                        state.ilgongRoomPhotoList[roomIndex].push({ path: pathOnly, photoId });
                        renderIlgongRoomPhotoList(roomIndex);
                        setupRoomPhotoDrag(roomIndex);
                        return;
                    }
                    if (status === 'FAILED') {
                        alert('사진 처리에 실패했습니다.');
                        return;
                    }
                }
                alert('처리 시간이 지연되고 있습니다. 잠시 후 새로고침해 확인해 주세요.');
                return;
            }
            if (status === 'READY') {
                const pathOnly = keyToPhotoPath(complete.keyOriginal || keyOriginal);
                if (!state.ilgongRoomPhotoList[roomIndex]) state.ilgongRoomPhotoList[roomIndex] = [];
                state.ilgongRoomPhotoList[roomIndex].push({ path: pathOnly, photoId });
                renderIlgongRoomPhotoList(roomIndex);
                setupRoomPhotoDrag(roomIndex);
                return;
            }
            if (status === 'FAILED') {
                alert('사진 처리에 실패했습니다. 다시 시도해 주세요.');
                return;
            }
            alert('알 수 없는 응답 상태: ' + status);
        } catch (err) {
            console.error(err);
            alert(err && err.message ? err.message : '호실 사진 업로드 중 오류가 발생했습니다.');
        }
    }

    function renderRoomAccordion(rooms) {
        const roomList = rooms || [];
        buildRoomPhotosState(roomList);

        const items = roomList
            .map((room, roomIndex) => {
                const roomName = room.roomName || room.number || `${roomIndex + 1}호`;
                const statusText = room.status ? escapeHtml(room.status) : '';

                const photos = state.roomPhotos[roomIndex] || [];
                const photosHtml = photos
                    .map(
                        (p, pi) => `
                    <div class="photo-item" data-room="${roomIndex}" data-photo-index="${pi}">
                        <img src="${escapeHtml(p.path)}" alt="호실 사진" onerror="this.style.background='#eee'">
                    </div>
                `
                    )
                    .join('');

                return `
                <div class="room-accordion-item" data-room="${roomIndex}">
                    <div class="room-accordion-head" data-room="${roomIndex}" aria-expanded="false">
                        <span class="room-accordion-title">${escapeHtml(roomName)}${statusText ? ' <span class="room-accordion-status">' + statusText + '</span>' : ''}</span>
                        <span class="room-accordion-chevron">▼</span>
                    </div>
                    <div class="room-accordion-body" data-room="${roomIndex}">
                        <div class="room-below-photos">
                            <div class="detail-subtitle">호실 사진 (드래그로 순서변경)</div>
                            <div class="photo-list ilgong-room-photo-list" data-room="${roomIndex}"></div>
                            <div class="photo-add room-photo-add-ilgong" data-room="${roomIndex}" title="사진 추가">
                                <input type="file" class="room-photo-input-ilgong" data-room="${roomIndex}" accept=".jpg,.jpeg,image/jpeg" multiple>
                                + 추가
                            </div>
                            <div class="room-below-photos-label">호실 사진 (변경불가)</div>
                            <div class="photo-list photo-list-readonly room-photo-list" data-room="${roomIndex}" aria-label="기존 호실 사진 (읽기 전용)">${photosHtml}</div>
                        </div>
                    </div>
                </div>
            `;
            })
            .join('');

        roomAccordion.innerHTML = `<div class="room-accordion-wrap">${items}</div>`;

        roomAccordion.querySelectorAll('.room-accordion-head').forEach((head) => {
            head.addEventListener('click', () => {
                const roomIndex = head.dataset.room;
                const body = roomAccordion.querySelector(`.room-accordion-body[data-room="${roomIndex}"]`);
                if (!body) return;
                body.classList.toggle('open');
                head.setAttribute('aria-expanded', body.classList.contains('open'));
                const chevron = head.querySelector('.room-accordion-chevron');
                if (chevron) chevron.textContent = body.classList.contains('open') ? '▲' : '▼';
            });
        });

        roomList.forEach((_, roomIndex) => {
            renderIlgongRoomPhotoList(roomIndex);
            setupRoomPhotoDrag(roomIndex);
        });

        roomAccordion.querySelectorAll('.room-photo-add-ilgong').forEach((addEl) => {
            const roomIndex = parseInt(addEl.dataset.room, 10);
            addEl.addEventListener('click', () => {
                const input = roomAccordion.querySelector(`.room-photo-input-ilgong[data-room="${roomIndex}"]`);
                if (input) input.click();
            });
        });

        roomAccordion.querySelectorAll('.room-photo-input-ilgong').forEach((input) => {
            input.addEventListener('change', (e) => {
                const roomIndex = parseInt(input.dataset.room, 10);
                const files = e.target.files;
                if (!files || !files.length) return;
                for (let i = 0; i < files.length; i++) {
                    const name = (files[i].name || '').toLowerCase();
                    const isJpg = name.endsWith('.jpg') || name.endsWith('.jpeg') || (files[i].type === 'image/jpeg');
                    if (!isJpg) {
                        alert('jpg 확장자만 가능합니다');
                        e.target.value = '';
                        return;
                    }
                }
                (async () => {
                    for (let i = 0; i < files.length; i++) {
                        await uploadRoomPhotoFile(roomIndex, files[i]);
                    }
                })();
                e.target.value = '';
            });
        });
    }

    function onRoomsLoaded(raw) {
        const rooms = (raw && raw.ilgongRooms) ? raw.ilgongRooms : [];
        renderRoomAccordion(rooms);
    }

    window.BuildingDetailRooms = {
        onRoomsLoaded
    };
})();
