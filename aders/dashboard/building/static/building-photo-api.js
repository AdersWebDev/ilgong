/**
 * building-photo-api.js
 * - presign → S3 PUT → complete(폴링) / DELETE /aders/content
 * - 의존: window.BuildingFormUtils (keyToPhotoPath)
 */
(function () {
    'use strict';

    var U = window.BuildingFormUtils;
    if (!U) return;

    var keyToPhotoPath = U.keyToPhotoPath;

    /**
     * Presign 업로드 한 흐름. 완료 시 pathOnly 반환.
     * @param {File} file
     * @param {{ baseUrl: string, buildingId: string|number, filename?: string, contentType?: string, size?: number }} opts
     * @returns {Promise<{ pathOnly: string, photoId: string }>}
     */
    function uploadByPresign(file, opts) {
        var baseUrl = (opts && opts.baseUrl) || '';
        var buildingId = opts && opts.buildingId;
        if (!baseUrl || buildingId == null) {
            return Promise.reject(new Error('baseUrl와 buildingId가 필요합니다.'));
        }

        var filename = (opts && opts.filename) || (file && file.name) || 'image.jpg';
        var contentType = (opts && opts.contentType) || (file && file.type) || 'image/jpeg';
        var size = (opts && opts.size) != null ? opts.size : (file && file.size);

        return fetch(baseUrl + '/aders/photo/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                buildingId: buildingId,
                filename: filename,
                contentType: contentType,
                size: size
            })
        })
            .then(function (res) {
                if (!res.ok) return res.text().then(function (t) { throw new Error(t || 'presign 실패: ' + res.status); });
                return res.json();
            })
            .then(function (presign) {
                var photoId = presign.photoId;
                var keyOriginal = presign.keyOriginal;
                var uploadUrl = presign.uploadUrl;
                if (!uploadUrl) throw new Error('presign 응답에 uploadUrl이 없습니다.');

                return fetch(uploadUrl, { method: 'PUT', body: file }).then(function (putRes) {
                    if (!putRes.ok) throw new Error('S3 업로드 실패: ' + putRes.status);
                    return { photoId: photoId, keyOriginal: keyOriginal };
                });
            })
            .then(function (_ref) {
                var photoId = _ref.photoId;
                var keyOriginal = _ref.keyOriginal;

                return fetch(baseUrl + '/aders/presign/complete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ photoId: photoId })
                }).then(function (res) {
                    if (!res.ok) throw new Error('complete 요청 실패: ' + res.status);
                    return res.json();
                }).then(function (complete) {
                    var status = (complete && complete.status) ? String(complete.status) : '';

                    if (status === 'READY') {
                        var pathOnly = keyToPhotoPath(complete.keyOriginal || keyOriginal);
                        return { pathOnly: pathOnly, photoId: photoId };
                    }
                    if (status === 'FAILED') {
                        throw new Error('사진 처리에 실패했습니다.');
                    }
                    if (status === 'UPLOADING') {
                        return pollComplete(baseUrl, photoId, keyOriginal, 0, 20);
                    }
                    throw new Error('알 수 없는 응답 상태: ' + status);
                });
            });
    }

    function pollComplete(baseUrl, photoId, keyOriginal, pollCount, maxPoll) {
        if (pollCount >= maxPoll) {
            return Promise.reject(new Error('처리 시간이 지연되고 있습니다. 잠시 후 새로고침해 확인해 주세요.'));
        }
        return new Promise(function (r) { setTimeout(r, 1500); }).then(function () {
            return fetch(baseUrl + '/aders/presign/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photoId: photoId })
            });
        }).then(function (res) {
            if (!res.ok) throw new Error('complete 요청 실패: ' + res.status);
            return res.json();
        }).then(function (d) {
            var status = (d && d.status) ? String(d.status) : '';
            if (status === 'READY') {
                var pathOnly = keyToPhotoPath(d.keyOriginal);
                return { pathOnly: pathOnly, photoId: photoId };
            }
            if (status === 'FAILED') throw new Error('사진 처리에 실패했습니다.');
            return pollComplete(baseUrl, photoId, keyOriginal, pollCount + 1, maxPoll);
        });
    }

    /**
     * @param {string} baseUrl
     * @param {string} photoId
     * @returns {Promise<void>}
     */
    function deletePhoto(baseUrl, photoId) {
        if (!baseUrl || !photoId) return Promise.reject(new Error('baseUrl와 photoId가 필요합니다.'));
        var url = baseUrl + '/aders/content?photoId=' + encodeURIComponent(photoId);
        return fetch(url, { method: 'DELETE' }).then(function (res) {
            if (!res.ok) throw new Error('삭제 실패: ' + res.status);
        });
    }

    window.BuildingPhotoApi = {
        uploadByPresign: uploadByPresign,
        deletePhoto: deletePhoto
    };
})();
