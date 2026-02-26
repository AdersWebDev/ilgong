/**
 * add.js
 * - 건물 추가(il) 전용: 폼 렌더·검증·수집·POST·성공 시 il 전용 상세로 이동
 * - 의존: BuildingFormUtils, BuildingPhotoApi
 */
(function () {
    'use strict';

    var U = window.BuildingFormUtils;
    if (!U) return;
    var PhotoApi = window.BuildingPhotoApi;
    if (!PhotoApi) return;

    // var API_BASE_URL = 'https://www.houberapp.com';
    var API_BASE_URL = 'http://localhost:40011';
    var S3_PHOTO_BASE_URL = 'https://ilgong.s3.ap-northeast-3.amazonaws.com';
    var PHOTO_DISPLAY_PREFIX = '/content/original';

    /** 사진/파일 저장 (presign 없이 File 객체만 보관, 등록 시점에 업로드) */
    var buildingListPhotoFile = null;
    var buildingIlgongPhotoFiles = [];
    var roomIlgongPhotoFiles = {};
    var roomLayoutFiles = {};
    var roomFactFiles = {};

    var BUILDING_FACILITIES = {
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

    var ROOM_STATUS_OPTIONS = [
        { value: '空室', label: '공실' },
        { value: '入居中', label: '입주중' },
        { value: 'その他', label: '기타' }
    ];

    /** 호실 추가 시 전부 필수(호실 내부 요소) */
    var ROOM_FIELD_CONFIG = [
        { key: 'roomName', label: '호실명', type: 'text' },
        { key: 'status', label: '상태', type: 'select' },
        { key: 'estateCategory', label: '건물용도', type: 'text', placeholder: '예: [住居用] マンション' },
        { key: 'layoutfile', label: '도면 사진', type: 'url' },
        { key: 'roomType', label: '룸타입', type: 'text', placeholder: '1K, 1DK 등' },
        { key: 'squareMeter', label: '면적(㎡)', type: 'number' },
        { key: 'roomDirection', label: '방향', type: 'text' },
        { key: 'rentalCost', label: '월세', type: 'number' },
        { key: 'feeCommon', label: '공과금', type: 'number' },
        { key: 'deposit', label: '시키킹', type: 'text' },
        { key: 'recompense', label: '레이킹', type: 'text' },
        { key: 'enableEnterDate', label: '입주가능일', type: 'text' },
        { key: 'factFileUrl', label: '자료파일', type: 'url' },
    ];

    /** 호실 설비 (건물 설비와 동일하게 key -> 한글 라벨) */
    var ROOM_FACILITIES = {
        highSpeedInternet: '고속인터넷',
        electricStove: '전기레인지',
        allowForeigner: '외국인 가능',
        freeInternet: '무료 인터넷',
        withFriend: '2인 입주 가능',
        allowPet: '반려동물 가능',
        airConditioner: '에어컨',
        allElectric: '올전기',
        bathroomDryer: '욕실 건조',
        bathroomSeparation: '욕실 분리',
        bidet: '비데',
        canInstalledGasStove: '가스 설치 가능',
        canInternet: '인터넷 설치 가능',
        dedicatedLine: '전용선',
        gasStove: '가스레인지',
        induction: '인덕션',
        lofted: '로프트',
        shoebox: '신발장',
        switchLighting: '스위치 조명',
        systemKitchen: '시스템 키친',
        washingMachineInstallable: '세탁기 설치 가능',
        wiFi: 'Wi-Fi'
    };
    var ROOM_BOOLEAN_KEYS = Object.keys(ROOM_FACILITIES);

    var form = document.getElementById('addBuildingForm');
    var roomBlocks = document.getElementById('roomBlocks');
    var addRoomBtn = document.getElementById('addRoomBtn');
    var addRoomError = document.getElementById('addRoomError');
    var addSubmitBtn = document.getElementById('addSubmitBtn');
    var buildingClassification = document.getElementById('buildingClassification');

    var roomIndex = 0;

    function getEl(id) {
        return document.getElementById(id);
    }

    function isImageFile(file) {
        if (!file || !file.name) return false;
        var name = (file.name || '').toLowerCase();
        var t = (file.type || '').toLowerCase();
        return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') ||
            t === 'image/jpeg' || t === 'image/png';
    }

    function isPdfFile(file) {
        if (!file || !file.name) return false;
        var name = (file.name || '').toLowerCase();
        return name.endsWith('.pdf') || (file.type || '').toLowerCase() === 'application/pdf';
    }

    function setClassifyButtonState(key, on) {
        if (!buildingClassification) return;
        var btn = buildingClassification.querySelector('.classify-btn[data-key="' + key + '"]');
        if (!btn) return;
        var active = !!on;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        btn.dataset.value = active ? 'true' : 'false';
    }

    function getClassifyValue(key) {
        if (!buildingClassification) return false;
        var btn = buildingClassification.querySelector('.classify-btn[data-key="' + key + '"]');
        if (!btn) return false;
        return btn.getAttribute('aria-pressed') === 'true';
    }

    function renderBuildingFacilities() {
        var container = document.getElementById('buildingFacilities');
        if (!container) return;
        container.innerHTML = Object.keys(BUILDING_FACILITIES)
            .map(function (key) {
                return (
                    '<label class="facility-item">' +
                    '<input type="checkbox" name="buildingFacility_' + key + '" data-key="' + key + '">' +
                    '<span>' + BUILDING_FACILITIES[key] + '</span>' +
                    '</label>'
                );
            })
            .join('');
    }

    function bindClassificationButtons() {
        if (!buildingClassification) return;
        buildingClassification.querySelectorAll('.classify-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var key = btn.dataset.key;
                var next = btn.getAttribute('aria-pressed') !== 'true';
                setClassifyButtonState(key, next);
            });
        });
    }

    var buildingPhotoUrls = [];
    function renderBuildingIlgongPhotoList() {
        var listEl = getEl('ilgongPhotoList');
        if (!listEl) return;
        buildingPhotoUrls.forEach(function (url) { URL.revokeObjectURL(url); });
        buildingPhotoUrls = [];
        listEl.innerHTML = buildingIlgongPhotoFiles
            .map(function (file, i) {
                var url = file instanceof File ? URL.createObjectURL(file) : '';
                if (url) buildingPhotoUrls.push(url);
                return (
                    '<div class="photo-item ilgong-photo-draggable" data-ilgong-index="' + i + '" draggable="true" role="button" tabindex="0">' +
                    '<img src="' + escapeHtml(url) + '" alt="건물 사진 ' + (i + 1) + '" draggable="false" onerror="this.style.background=\'#eee\'">' +
                    '<div class="photo-item-actions"><button type="button" class="btn-remove ilgong-photo-remove" data-ilgong-index="' + i + '">삭제</button></div>' +
                    '</div>'
                );
            })
            .join('');
        listEl.querySelectorAll('.ilgong-photo-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var i = parseInt(btn.dataset.ilgongIndex, 10);
                if (Number.isNaN(i)) return;
                buildingIlgongPhotoFiles.splice(i, 1);
                renderBuildingIlgongPhotoList();
            });
        });
    }

    function setupBuildingPhotoDrag() {
        var listEl = getEl('ilgongPhotoList');
        if (!listEl) return;
        var draggedIndex = null;

        listEl.addEventListener('dragstart', function (e) {
            var item = e.target.closest('.ilgong-photo-draggable');
            if (!item) return;
            var i = parseInt(item.dataset.ilgongIndex, 10);
            if (Number.isNaN(i)) return;
            draggedIndex = i;
            item.classList.add('ilgong-photo-dragging');
            e.dataTransfer.setData('text/plain', String(i));
            e.dataTransfer.effectAllowed = 'move';
        });

        listEl.addEventListener('dragend', function (e) {
            var item = e.target.closest('.ilgong-photo-draggable');
            if (item) item.classList.remove('ilgong-photo-dragging');
            listEl.querySelectorAll('.ilgong-photo-drag-over').forEach(function (el) { el.classList.remove('ilgong-photo-drag-over'); });
            draggedIndex = null;
        });

        listEl.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation(); // wrap이 dropEffect를 copy로 덮어쓰지 않도록
            e.dataTransfer.dropEffect = 'move';
            var item = e.target.closest('.ilgong-photo-draggable');
            if (!item || draggedIndex == null) return;
            listEl.querySelectorAll('.ilgong-photo-drag-over').forEach(function (el) { el.classList.remove('ilgong-photo-drag-over'); });
            item.classList.add('ilgong-photo-drag-over');
        });

        listEl.addEventListener('dragleave', function (e) {
            if (!listEl.contains(e.relatedTarget)) {
                listEl.querySelectorAll('.ilgong-photo-drag-over').forEach(function (el) { el.classList.remove('ilgong-photo-drag-over'); });
            }
        });

        listEl.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            listEl.querySelectorAll('.ilgong-photo-drag-over').forEach(function (el) { el.classList.remove('ilgong-photo-drag-over'); });
            var item = e.target.closest('.ilgong-photo-draggable');
            if (!item || draggedIndex == null) return;
            var toIndex = parseInt(item.dataset.ilgongIndex, 10);
            if (Number.isNaN(toIndex) || draggedIndex === toIndex) return;
            var removed = buildingIlgongPhotoFiles.splice(draggedIndex, 1)[0];
            buildingIlgongPhotoFiles.splice(toIndex, 0, removed);
            renderBuildingIlgongPhotoList();
        });
    }

    function bindListPhoto() {
        var listPhotoInput = getEl('listPhotoInput');
        var listPhotoPreview = getEl('listPhotoPreview');
        var listPhotoCard = getEl('listPhotoCard');
        if (!listPhotoInput) return;

        function setListPhotoPreview(file) {
            if (!listPhotoPreview) return;
            if (!file) {
                listPhotoPreview.style.backgroundImage = '';
                listPhotoPreview.textContent = '';
                return;
            }
            var reader = new FileReader();
            reader.onload = function (ev) {
                listPhotoPreview.style.backgroundImage = 'url(' + ev.target.result + ')';
                listPhotoPreview.textContent = '';
            };
            reader.readAsDataURL(file);
        }

        if (listPhotoCard) {
            listPhotoCard.addEventListener('click', function (e) {
                if (e.target === listPhotoInput) return;
                e.preventDefault();
                listPhotoInput.click();
            });
            listPhotoCard.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                listPhotoCard.classList.add('photo-drop-zone-active');
            });
            listPhotoCard.addEventListener('dragleave', function (e) {
                if (!listPhotoCard.contains(e.relatedTarget)) listPhotoCard.classList.remove('photo-drop-zone-active');
            });
            listPhotoCard.addEventListener('drop', function (e) {
                e.preventDefault();
                listPhotoCard.classList.remove('photo-drop-zone-active');
                var files = e.dataTransfer.files;
                if (!files || !files.length) return;
                var file = files[0];
                if (isImageFile(file)) {
                    buildingListPhotoFile = file;
                    setListPhotoPreview(file);
                } else {
                    alert('jpg, jpeg, png만 가능합니다.');
                }
            });
        }

        listPhotoInput.addEventListener('change', function (e) {
            var file = e.target && e.target.files && e.target.files[0];
            if (!file) return;
            if (!isImageFile(file)) {
                alert('jpg, jpeg, png만 가능합니다.');
                e.target.value = '';
                return;
            }
            buildingListPhotoFile = file;
            setListPhotoPreview(file);
            e.target.value = '';
        });
    }

    function bindBuildingPhotos() {
        var wrap = document.querySelector('.ilgong-photo-list-wrap');
        var addEl = getEl('ilgongPhotoAdd');
        var inputEl = getEl('ilgongPhotoInput');
        if (!inputEl) return;
        if (addEl) {
            addEl.addEventListener('click', function () { inputEl.click(); });
        }
        inputEl.addEventListener('change', function (e) {
            var files = e.target.files;
            if (!files || !files.length) return;
            for (var i = 0; i < files.length; i++) {
                if (!isImageFile(files[i])) {
                    alert('jpg, jpeg, png만 가능합니다.');
                    e.target.value = '';
                    return;
                }
            }
            for (var i = 0; i < files.length; i++) {
                buildingIlgongPhotoFiles.push(files[i]);
            }
            renderBuildingIlgongPhotoList();
            e.target.value = '';
        });
        if (wrap) {
            wrap.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                wrap.classList.add('photo-drop-zone-active');
            });
            wrap.addEventListener('dragleave', function (e) {
                if (!wrap.contains(e.relatedTarget)) wrap.classList.remove('photo-drop-zone-active');
            });
            wrap.addEventListener('drop', function (e) {
                e.preventDefault();
                wrap.classList.remove('photo-drop-zone-active');
                var files = e.dataTransfer.files;
                if (!files || !files.length) return;
                for (var i = 0; i < files.length; i++) {
                    if (isImageFile(files[i])) buildingIlgongPhotoFiles.push(files[i]);
                }
                renderBuildingIlgongPhotoList();
            });
        }
        setupBuildingPhotoDrag();
    }

    function getRoomInput(block, key) {
        if (!block) return null;
        if (key === 'status') return block.querySelector('.room-status');
        if (ROOM_BOOLEAN_KEYS.indexOf(key) !== -1) return block.querySelector('.room-bool[data-key="' + key + '"]');
        return block.querySelector('.room-input[data-key="' + key + '"]');
    }

    function escapeHtml(text) {
        if (text == null) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    var roomPhotoUrls = {};
    function renderAddRoomPhotoList(block, roomIdx) {
        var list = roomIlgongPhotoFiles[roomIdx] || [];
        var listEl = block.querySelector('.ilgong-room-photo-list[data-room="' + roomIdx + '"]');
        if (!listEl) return;
        if (roomPhotoUrls[roomIdx]) {
            roomPhotoUrls[roomIdx].forEach(function (url) { URL.revokeObjectURL(url); });
        }
        roomPhotoUrls[roomIdx] = [];
        listEl.innerHTML = list
            .map(function (file, i) {
                var url = typeof file === 'object' && file instanceof File ? URL.createObjectURL(file) : '';
                if (url) roomPhotoUrls[roomIdx].push(url);
                return (
                    '<div class="photo-item ilgong-room-photo-draggable" data-room="' + roomIdx + '" data-ilgong-index="' + i + '" draggable="true" role="button" tabindex="0">' +
                    '<img src="' + escapeHtml(url) + '" alt="호실 사진 ' + (i + 1) + '" draggable="false" onerror="this.style.background=\'#eee\'">' +
                    '<div class="photo-item-actions"><button type="button" class="btn-remove ilgong-room-photo-remove" data-room="' + roomIdx + '" data-ilgong-index="' + i + '">삭제</button></div>' +
                    '</div>'
                );
            })
            .join('');

        listEl.querySelectorAll('.ilgong-room-photo-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var ri = parseInt(btn.dataset.room, 10);
                var i = parseInt(btn.dataset.ilgongIndex, 10);
                var arr = roomIlgongPhotoFiles[ri];
                if (!arr) return;
                arr.splice(i, 1);
                renderAddRoomPhotoList(block, ri);
            });
        });
    }

    function setupAddRoomPhotoDrag(block, roomIdx) {
        var listEl = block.querySelector('.ilgong-room-photo-list[data-room="' + roomIdx + '"]');
        if (!listEl) return;
        var draggedIndex = null;

        listEl.addEventListener('dragstart', function (e) {
            var item = e.target.closest('.ilgong-room-photo-draggable');
            if (!item) return;
            var i = parseInt(item.dataset.ilgongIndex, 10);
            if (Number.isNaN(i)) return;
            draggedIndex = i;
            item.classList.add('ilgong-room-photo-dragging');
            e.dataTransfer.setData('text/plain', String(i));
            e.dataTransfer.effectAllowed = 'move';
        });

        listEl.addEventListener('dragend', function (e) {
            var item = e.target.closest('.ilgong-room-photo-draggable');
            if (item) item.classList.remove('ilgong-room-photo-dragging');
            listEl.querySelectorAll('.ilgong-room-photo-drag-over').forEach(function (el) { el.classList.remove('ilgong-room-photo-drag-over'); });
            draggedIndex = null;
        });

        listEl.addEventListener('dragover', function (e) {
            e.preventDefault();
            e.stopPropagation(); // 부모 드롭존이 dropEffect를 덮어쓰지 않도록
            e.dataTransfer.dropEffect = 'move';
            var item = e.target.closest('.ilgong-room-photo-draggable');
            if (!item || draggedIndex == null) return;
            listEl.querySelectorAll('.ilgong-room-photo-drag-over').forEach(function (el) { el.classList.remove('ilgong-room-photo-drag-over'); });
            item.classList.add('ilgong-room-photo-drag-over');
        });

        listEl.addEventListener('dragleave', function (e) {
            if (!listEl.contains(e.relatedTarget)) {
                listEl.querySelectorAll('.ilgong-room-photo-drag-over').forEach(function (el) { el.classList.remove('ilgong-room-photo-drag-over'); });
            }
        });

        listEl.addEventListener('drop', function (e) {
            e.preventDefault();
            e.stopPropagation();
            listEl.querySelectorAll('.ilgong-room-photo-drag-over').forEach(function (el) { el.classList.remove('ilgong-room-photo-drag-over'); });
            var item = e.target.closest('.ilgong-room-photo-draggable');
            if (!item || draggedIndex == null) return;
            var toIndex = parseInt(item.dataset.ilgongIndex, 10);
            if (Number.isNaN(toIndex) || draggedIndex === toIndex) return;
            var arr = roomIlgongPhotoFiles[roomIdx] || [];
            var removed = arr.splice(draggedIndex, 1)[0];
            arr.splice(toIndex, 0, removed);
            renderAddRoomPhotoList(block, roomIdx);
        });
    }

    function findRoomFieldConfig(key) {
        for (var i = 0; i < ROOM_FIELD_CONFIG.length; i++) {
            if (ROOM_FIELD_CONFIG[i].key === key) return ROOM_FIELD_CONFIG[i];
        }
        return null;
    }

    function buildRoomFieldHtml(idx, key, parts) {
        var f = findRoomFieldConfig(key);
        if (!f) return;
        var label = f.label + ' <span class="required">*</span>';
        var ph = (f.placeholder || '') ? ' placeholder="' + f.placeholder.replace(/"/g, '&quot;') + '"' : '';
        if (f.key === 'roomName') {
            parts.push('<div class="form-group"><label class="form-label">' + label + '</label>');
            parts.push('<input type="text" class="form-input room-input room-name" data-key="roomName" data-room-index="' + idx + '" required placeholder="예: 1203">');
        } else if (f.key === 'status') {
            parts.push('<div class="form-group"><label class="form-label">' + label + '</label>');
            parts.push('<select class="form-input room-status" data-room-index="' + idx + '">');
            ROOM_STATUS_OPTIONS.forEach(function (o) {
                parts.push('<option value="' + o.value.replace(/"/g, '&quot;') + '">' + o.label + '</option>');
            });
            parts.push('</select>');
        } else {
            var type = (f.type === 'number') ? 'number' : (f.type === 'url') ? 'url' : 'text';
            var step = f.type === 'number' ? ' step="any"' : '';
            parts.push('<div class="form-group"><label class="form-label">' + label + '</label>');
            parts.push('<input type="' + type + '" class="form-input room-input" data-key="' + f.key + '" data-room-index="' + idx + '"' + ph + step + '>');
        }
        parts.push('</div>');
    }

    function addOneRoomBlock() {
        var idx = roomIndex++;
        var block = document.createElement('div');
        block.className = 'room-block';
        block.dataset.roomIndex = String(idx);

        var parts = [
            '<div class="room-block-header">',
            '<input type="text" class="form-input room-input room-name room-block-title-input" data-key="roomName" data-room-index="' + idx + '" required placeholder="호실명 (예: 1203)" aria-label="호실명">',
            '<button type="button" class="btn-remove room-block-remove" data-room-index="' + idx + '">삭제</button>',
            '</div>',
            '<div class="room-grid">'
        ];

        // 좌상단: 상태 ~ 룸타입/면적
        parts.push('<div class="room-grid-cell room-grid-tl">');
        ['status', 'estateCategory', 'roomType', 'squareMeter','roomDirection','enableEnterDate'].forEach(function (key) {
            buildRoomFieldHtml(idx, key, parts);
        });
        parts.push('</div>');

        // 우상단: 룸타입 ~ 공과금(원)
        parts.push('<div class="room-grid-cell room-grid-tr">');
        parts.push('<div class="room-block-facilities">');
        parts.push('<div class="detail-subtitle">호실 설비</div>');
        parts.push('<div class="facility-grid room-facility-grid">');
        ROOM_BOOLEAN_KEYS.forEach(function (key) {
            var label = ROOM_FACILITIES[key];
            parts.push('<label class="facility-item">');
            parts.push('<input type="checkbox" class="room-bool" data-key="' + key + '" data-room-index="' + idx + '">');
            parts.push('<span>' + label + '</span>');
            parts.push('</label>');
        });
        parts.push('</div></div>');
        parts.push('</div>'); // room-grid-cell

        // 좌하단: 방향/비용/계약 정보
        parts.push('<div class="room-grid-cell room-grid-bl">');
        ['rentalCost', 'feeCommon','deposit', 'recompense' ].forEach(function (key) {
            buildRoomFieldHtml(idx, key, parts);
        });
        parts.push('</div>');

        // 우하단: 도면사진 / 자료파일 (정사각형 카드 + flex row)
        parts.push('<div class="room-grid-cell room-grid-br">');
        parts.push('<div class="room-files">');

        // 도면 사진 카드
        parts.push('<button type="button" class="room-file-card room-file-card-layout" data-room-index="' + idx + '">');
        parts.push('<div class="room-file-card-inner">');
        parts.push('<div class="room-file-card-title">도면 사진</div>');
        parts.push('<div class="room-file-card-preview room-file-card-preview-image" data-room-index="' + idx + '" data-kind="layoutfile"></div>');
        parts.push('<div class="room-file-card-hint">이미지 첨부</div>');
        parts.push('</div>');
        parts.push('</button>');
        parts.push('<input type="file" class="room-file-input room-input" data-key="layoutfile" data-room-index="' + idx + '" accept=".jpg,.jpeg,.png,image/*">');

        // 자료파일 카드
        parts.push('<button type="button" class="room-file-card room-file-card-fact" data-room-index="' + idx + '">');
        parts.push('<div class="room-file-card-inner">');
        parts.push('<div class="room-file-card-title">자료파일</div>');
        parts.push('<div class="room-file-card-preview room-file-card-preview-file" data-room-index="' + idx + '" data-kind="factFileUrl">PDF</div>');
        parts.push('<div class="room-file-card-hint">PDF 첨부</div>');
        parts.push('</div>');
        parts.push('</button>');
        parts.push('<input type="file" class="room-file-input room-input" data-key="factFileUrl" data-room-index="' + idx + '" accept=".pdf,application/pdf">');

        parts.push('</div>'); // room-files
        parts.push('</div>'); // room-grid-cell
        // 호실 사진 (복수) - 건물 상세 호실 사진과 동일
        parts.push('<div class="room-room-photos">');
        parts.push('<div class="detail-subtitle">호실 사진 (드래그로 순서변경)</div>');
        parts.push('<div class="photo-list ilgong-room-photo-list" data-room="' + idx + '"></div>');
        parts.push('<div class="photo-add room-photo-add-ilgong" data-room="' + idx + '" title="사진 추가">');
        parts.push('<input type="file" class="room-photo-input-ilgong" data-room="' + idx + '" accept=".jpg,.jpeg,.png,image/jpeg,image/png" multiple>');
        parts.push('+ 추가');
        parts.push('</div>');
        parts.push('</div>');
        parts.push('</div>'); // room-grid

        block.innerHTML = parts.join('');
        roomBlocks.appendChild(block);

        roomIlgongPhotoFiles[idx] = [];
        roomLayoutFiles[idx] = null;
        roomFactFiles[idx] = null;
        renderAddRoomPhotoList(block, idx);
        setupAddRoomPhotoDrag(block, idx);

        var roomPhotosWrap = block.querySelector('.room-room-photos');
        if (roomPhotosWrap) {
            roomPhotosWrap.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                roomPhotosWrap.classList.add('photo-drop-zone-active');
            });
            roomPhotosWrap.addEventListener('dragleave', function (e) {
                if (!roomPhotosWrap.contains(e.relatedTarget)) roomPhotosWrap.classList.remove('photo-drop-zone-active');
            });
            roomPhotosWrap.addEventListener('drop', function (e) {
                e.preventDefault();
                roomPhotosWrap.classList.remove('photo-drop-zone-active');
                var files = e.dataTransfer.files;
                if (!files || !files.length) return;
                if (!roomIlgongPhotoFiles[idx]) roomIlgongPhotoFiles[idx] = [];
                for (var fi = 0; fi < files.length; fi++) {
                    if (isImageFile(files[fi])) roomIlgongPhotoFiles[idx].push(files[fi]);
                }
                renderAddRoomPhotoList(block, idx);
            });
        }

        block.querySelectorAll('.room-photo-add-ilgong').forEach(function (addEl) {
            var ri = parseInt(addEl.dataset.room, 10);
            addEl.addEventListener('click', function () {
                var input = block.querySelector('.room-photo-input-ilgong[data-room="' + ri + '"]');
                if (input) input.click();
            });
        });

        block.querySelectorAll('.room-photo-input-ilgong').forEach(function (input) {
            input.addEventListener('change', function (e) {
                var ri = parseInt(input.dataset.room, 10);
                var files = e.target.files;
                if (!files || !files.length) return;
                for (var fi = 0; fi < files.length; fi++) {
                    if (!isImageFile(files[fi])) {
                        alert('jpg, jpeg, png만 가능합니다.');
                        e.target.value = '';
                        return;
                    }
                }
                if (!roomIlgongPhotoFiles[ri]) roomIlgongPhotoFiles[ri] = [];
                for (var fi = 0; fi < files.length; fi++) {
                    roomIlgongPhotoFiles[ri].push(files[fi]);
                }
                renderAddRoomPhotoList(block, ri);
                e.target.value = '';
            });
        });

        block.querySelectorAll('.room-block-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var ri = parseInt(btn.dataset.roomIndex, 10);
                var el = roomBlocks.querySelector('.room-block[data-room-index="' + ri + '"]');
                if (el) {
                    if (roomPhotoUrls[ri]) {
                        roomPhotoUrls[ri].forEach(function (url) { URL.revokeObjectURL(url); });
                        delete roomPhotoUrls[ri];
                    }
                    delete roomIlgongPhotoFiles[ri];
                    delete roomLayoutFiles[ri];
                    delete roomFactFiles[ri];
                    el.remove();
                }
            });
        });

        // 파일 카드 클릭 → 숨겨진 input 클릭
        block.querySelectorAll('.room-file-card').forEach(function (card) {
            card.addEventListener('click', function () {
                var idxAttr = card.getAttribute('data-room-index');
                var key = card.classList.contains('room-file-card-layout') ? 'layoutfile' : 'factFileUrl';
                var input = block.querySelector('.room-file-input[data-key="' + key + '"][data-room-index="' + idxAttr + '"]');
                if (input) input.click();
            });
        });

        // 도면사진 카드 드래그앤드롭
        block.querySelectorAll('.room-file-card-layout').forEach(function (card) {
            var roomIdx = card.getAttribute('data-room-index');
            var ri = parseInt(roomIdx, 10);
            card.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                card.classList.add('photo-drop-zone-active');
            });
            card.addEventListener('dragleave', function (e) {
                if (!card.contains(e.relatedTarget)) card.classList.remove('photo-drop-zone-active');
            });
            card.addEventListener('drop', function (e) {
                e.preventDefault();
                card.classList.remove('photo-drop-zone-active');
                var files = e.dataTransfer.files;
                if (!files || !files.length) return;
                var file = files[0];
                if (!isImageFile(file)) {
                    alert('도면 사진은 jpg, jpeg, png만 가능합니다.');
                    return;
                }
                roomLayoutFiles[ri] = file;
                var preview = block.querySelector('.room-file-card-preview-image[data-room-index="' + roomIdx + '"]');
                if (preview) {
                    var reader = new FileReader();
                    reader.onload = function (ev) {
                        preview.style.backgroundImage = 'url(' + ev.target.result + ')';
                        preview.textContent = '';
                    };
                    reader.readAsDataURL(file);
                }
            });
        });

        // 자료파일 카드 드래그앤드롭
        block.querySelectorAll('.room-file-card-fact').forEach(function (card) {
            var roomIdx = card.getAttribute('data-room-index');
            var ri = parseInt(roomIdx, 10);
            card.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                card.classList.add('photo-drop-zone-active');
            });
            card.addEventListener('dragleave', function (e) {
                if (!card.contains(e.relatedTarget)) card.classList.remove('photo-drop-zone-active');
            });
            card.addEventListener('drop', function (e) {
                e.preventDefault();
                card.classList.remove('photo-drop-zone-active');
                var files = e.dataTransfer.files;
                if (!files || !files.length) return;
                var file = files[0];
                if (!isPdfFile(file)) {
                    alert('자료파일은 PDF만 가능합니다.');
                    return;
                }
                roomFactFiles[ri] = file;
                var previewFile = block.querySelector('.room-file-card-preview-file[data-room-index="' + roomIdx + '"]');
                if (previewFile) previewFile.textContent = file.name || 'PDF 파일';
            });
        });

        // 파일 선택 시 File 저장 + 프리뷰/파일명 표시
        block.querySelectorAll('.room-file-input').forEach(function (input) {
            input.addEventListener('change', function () {
                var files = input.files;
                var file = files && files[0];
                var kind = input.getAttribute('data-key');
                var roomIdx = input.getAttribute('data-room-index');
                if (!file) return;
                var ri = parseInt(roomIdx, 10);

                if (kind === 'layoutfile') {
                    if (!isImageFile(file)) {
                        alert('도면 사진은 jpg, jpeg, png만 가능합니다.');
                        input.value = '';
                        return;
                    }
                    roomLayoutFiles[ri] = file;
                    var preview = block.querySelector('.room-file-card-preview-image[data-room-index="' + roomIdx + '"]');
                    if (preview) {
                        var reader = new FileReader();
                        reader.onload = function (ev) {
                            preview.style.backgroundImage = 'url(' + ev.target.result + ')';
                            preview.textContent = '';
                        };
                        reader.readAsDataURL(file);
                    }
                } else if (kind === 'factFileUrl') {
                    if (!isPdfFile(file)) {
                        alert('자료파일은 PDF만 가능합니다.');
                        input.value = '';
                        return;
                    }
                    roomFactFiles[ri] = file;
                    var previewFile = block.querySelector('.room-file-card-preview-file[data-room-index="' + roomIdx + '"]');
                    if (previewFile) previewFile.textContent = file.name || 'PDF 파일';
                }
                input.value = '';
            });
        });
    }

    function showRoomError(msg) {
        if (!addRoomError) return;
        addRoomError.textContent = msg || '';
        addRoomError.style.display = msg ? 'block' : 'none';
    }

    function validateForm() {
        showRoomError('');
        if (!form) return false;

        var nameEl = getEl('buildingName');
        var addressEl = getEl('address');
        var dateEl = getEl('constructionDate');
        var structureEl = getEl('structure');
        var latEl = getEl('lat');
        var lngEl = getEl('lng');

        var setTrimRequired = function (el, label) {
            if (!el) return;
            var v = (el.value || '').trim();
            if (!v) {
                el.setCustomValidity(label + '은(는) 필수입니다.');
            } else {
                el.setCustomValidity('');
                if (el.value !== v) el.value = v;
            }
        };

        setTrimRequired(nameEl, '건물명');
        setTrimRequired(addressEl, '주소');
        setTrimRequired(getEl('prefCode'), '도도부현');
        setTrimRequired(getEl('cityCode'), '시구군');
        if (dateEl) {
            var d = U.normalizeLocalDateString(dateEl.value);
            dateEl.setCustomValidity(d ? '' : '건축일은 필수입니다. (YYYY-MM-DD)');
        }
        if (structureEl) {
            var st = U.normalizeStructureEnum(structureEl.value);
            structureEl.setCustomValidity(st ? '' : '구조는 필수입니다.');
        }
        if (latEl) {
            latEl.setCustomValidity(U.toNumberOrNull(latEl.value) == null ? '위도는 필수입니다.' : '');
        }
        if (lngEl) {
            lngEl.setCustomValidity(U.toNumberOrNull(lngEl.value) == null ? '경도는 필수입니다.' : '');
        }

        /** 호실이 있으면 해당 호실 내부 요소 전부 필수 (layoutfile, factFileUrl 제외: 생성 후 업로드) */
        var blocks = roomBlocks ? roomBlocks.querySelectorAll('.room-block') : [];
        for (var b = 0; b < blocks.length; b++) {
            var block = blocks[b];
            for (var f = 0; f < ROOM_FIELD_CONFIG.length; f++) {
                var cfg = ROOM_FIELD_CONFIG[f];
                if (cfg.key === 'layoutfile' || cfg.key === 'factFileUrl') continue;
                var el = getRoomInput(block, cfg.key);
                if (!el) continue;
                var val = el.value != null ? String(el.value).trim() : '';
                if (cfg.key === 'status') val = el.value || '';
                if (!val) {
                    el.setCustomValidity(cfg.label + '을(를) 입력해 주세요.');
                } else {
                    el.setCustomValidity('');
                }
                if (cfg.type === 'number' && val && U.toNumberOrNull(val) == null) {
                    el.setCustomValidity(cfg.label + '에는 숫자를 입력해 주세요.');
                }
            }
        }

        return form.reportValidity();
    }

    function collectPayload() {
        if (!form) return null;

        var get = function (id) {
            var el = getEl(id);
            return el ? el.value : '';
        };

        var buildingFacilities = {};
        Object.keys(BUILDING_FACILITIES).forEach(function (key) {
            var el = form.querySelector('input[name="buildingFacility_' + key + '"]');
            buildingFacilities[key] = el ? el.checked : false;
        });

        var rooms = [];
        var blocks = roomBlocks ? roomBlocks.querySelectorAll('.room-block') : [];
        for (var i = 0; i < blocks.length; i++) {
            var block = blocks[i];
            var roomIdx = block.dataset.roomIndex;
            var room = {
                ilgongRoomPhotoList: [],
                layoutfile: null,
                factFileUrl: null
            };
            ROOM_FIELD_CONFIG.forEach(function (cfg) {
                if (cfg.key === 'layoutfile' || cfg.key === 'factFileUrl') return;
                var el = getRoomInput(block, cfg.key);
                if (!el) return;
                var val = (el.value != null ? String(el.value).trim() : '') || null;
                if (cfg.key === 'status') val = (el.value && String(el.value).trim()) || null;
                if (cfg.type === 'number' && val != null) {
                    var num = U.toNumberOrNull(val);
                    room[cfg.key] = num != null ? num : val;
                } else {
                    room[cfg.key] = val;
                }
            });
            ROOM_BOOLEAN_KEYS.forEach(function (key) {
                var el = getRoomInput(block, key);
                room[key] = el ? !!el.checked : false;
            });
            rooms.push(room);
        }

        return {
            producer: 'il',
            buildingName: get('buildingName'),
            address: get('address'),
            prefCode: (get('prefCode') || '').trim() || null,
            cityCode: (get('cityCode') || '').trim() || null,
            constructionDate: U.normalizeLocalDateString(get('constructionDate')),
            structure: U.normalizeStructureEnum(get('structure')),
            lat: U.toNumberOrNull(get('lat')),
            lng: U.toNumberOrNull(get('lng')),
            allowForeigner: getClassifyValue('allowForeigner'),
            allowWorkingHoliday: getClassifyValue('allowWorkingHoliday'),
            trans1: get('trans1'),
            trans2: get('trans2'),
            trans3: get('trans3'),
            photo: null,
            ilgongPhotoList: [],
            buildingFacilities: buildingFacilities,
            ilgongRooms: rooms
        };
    }

    function setSubmitLock(locked) {
        if (addSubmitBtn) addSubmitBtn.disabled = !!locked;
    }

    function countTotalFiles() {
        var n = 0;
        if (buildingListPhotoFile) n += 1;
        n += buildingIlgongPhotoFiles.length;
        var blocks = roomBlocks ? roomBlocks.querySelectorAll('.room-block') : [];
        for (var i = 0; i < blocks.length; i++) {
            var roomIdx = blocks[i].dataset.roomIndex;
            n += (roomIlgongPhotoFiles[roomIdx] || []).length;
            if (roomLayoutFiles[roomIdx]) n += 1;
            if (roomFactFiles[roomIdx]) n += 1;
        }
        return n;
    }

    function showUploadProgress(current, total) {
        var overlay = getEl('addUploadOverlay');
        var textEl = getEl('addUploadProgressText');
        if (overlay) overlay.style.display = total > 0 ? 'flex' : 'none';
        if (textEl) textEl.textContent = '파일 업로드 중 ' + current + '/' + total;
    }

    function hideUploadProgress() {
        var overlay = getEl('addUploadOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    function uploadPhotoAfterCreation(buildingId, file, photoType, roomIdx) {
        return PhotoApi.uploadByPresign(file, {
            baseUrl: API_BASE_URL,
            buildingId: buildingId,
            filename: file.name || 'image.jpg',
            contentType: file.type || 'image/jpeg',
            size: file.size
        }).then(function (result) { return result; });
    }

    function uploadFactFileAfterCreation(buildingId, roomIdx, file) {
        return PhotoApi.uploadByPresign(file, {
            baseUrl: API_BASE_URL,
            buildingId: buildingId,
            filename: file.name || 'file.pdf',
            contentType: file.type || 'application/pdf',
            size: file.size
        }).then(function (result) { return result; });
    }

    function onSubmit(e) {
        e.preventDefault();
        if (!validateForm()) return;

        var payload = collectPayload();
        if (!payload) return;

        setSubmitLock(true);
        fetch(API_BASE_URL + '/aders/building/il', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(function (res) {
                if (!res.ok) {
                    return res.text().then(function (t) {
                        throw new Error(t || '등록 실패: ' + res.status);
                    });
                }
                return res.json();
            })
            .then(function (data) {
                var buildingId = (data && (data.id != null ? data.id : data.buildingId)) || (data && data.building && data.building.id);
                if (buildingId == null) {
                    setSubmitLock(false);
                    window.location.href = '/aders/dashboard/building/detail-il.html';
                    return;
                }
                buildingId = Number(buildingId);
                var total = countTotalFiles();
                if (total === 0) {
                    window.location.href = '/aders/dashboard/building/detail-il.html?id=' + encodeURIComponent(String(buildingId));
                    return;
                }
                showUploadProgress(0, total);
                var current = 0;
                var next = function () {
                    if (current >= total) {
                        hideUploadProgress();
                        setSubmitLock(false);
                        window.location.href = '/aders/dashboard/building/detail-il.html?id=' + encodeURIComponent(String(buildingId));
                        return;
                    }
                };

                var queue = [];
                if (buildingListPhotoFile) {
                    queue.push({ file: buildingListPhotoFile, type: 'list' });
                }
                buildingIlgongPhotoFiles.forEach(function (f) {
                    queue.push({ file: f, type: 'building' });
                });
                var blocks = roomBlocks ? roomBlocks.querySelectorAll('.room-block') : [];
                blocks.forEach(function (block) {
                    var roomIdx = block.dataset.roomIndex;
                    (roomIlgongPhotoFiles[roomIdx] || []).forEach(function (f) {
                        queue.push({ file: f, type: 'room', roomIdx: roomIdx });
                    });
                    if (roomLayoutFiles[roomIdx]) {
                        queue.push({ file: roomLayoutFiles[roomIdx], type: 'layout', roomIdx: roomIdx });
                    }
                    if (roomFactFiles[roomIdx]) {
                        queue.push({ file: roomFactFiles[roomIdx], type: 'fact', roomIdx: roomIdx });
                    }
                });

                function runQueue(index) {
                    if (index >= queue.length) {
                        next();
                        return;
                    }
                    var item = queue[index];
                    var p = item.type === 'fact'
                        ? uploadFactFileAfterCreation(buildingId, item.roomIdx, item.file)
                        : uploadPhotoAfterCreation(buildingId, item.file, item.type, item.roomIdx);
                    p.then(function () {
                        current += 1;
                        showUploadProgress(current, total);
                        runQueue(index + 1);
                    }).catch(function (err) {
                        console.error(err);
                        current += 1;
                        showUploadProgress(current, total);
                        runQueue(index + 1);
                    });
                }
                runQueue(0);
            })
            .catch(function (err) {
                setSubmitLock(false);
                hideUploadProgress();
                alert(err && err.message ? err.message : '등록 중 오류가 발생했습니다.');
            });
    }

    if (addRoomBtn) {
        addRoomBtn.addEventListener('click', function () {
            addOneRoomBlock();
        });
    }

    if (form) {
        form.addEventListener('submit', onSubmit);
    }

    renderBuildingFacilities();
    bindClassificationButtons();
    bindListPhoto();
    bindBuildingPhotos();
})();
