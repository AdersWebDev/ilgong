/**
 * Timer Module
 * 업데이트 시간 표시 및 상대 시간 계산
 */

const DiscountTimer = {
    updateTimeElement: null,
    updateInterval: null,
    updatedAt: null,

    /**
     * 초기화
     * @param {string} updatedAt - ISO 8601 형식의 업데이트 시간
     */
    init(updatedAt = null) {
        this.updateTimeElement = document.getElementById('unitUpdateTime');
        this.updatedAt = updatedAt;

        if (!this.updateTimeElement) return;

        // 초기 업데이트 시간 표시
        this.updateRelativeTime();

        // 1분마다 상대 시간 업데이트
        this.updateInterval = setInterval(() => {
            this.updateRelativeTime();
        }, 60000); // 1분마다 업데이트
    },

    /**
     * 상대 시간 계산 및 표시
     */
    updateRelativeTime() {

        if (!this.updateTimeElement || !this.updatedAt) {
            if (this.updateTimeElement) {
                this.updateTimeElement.innerHTML = '<span class="clock-svg"></span>업데이트 정보 없음';
            }
            return;
        }

        try {
            // 1) 마이크로초(6자리) -> 밀리초(3자리)로 정규화
            //    2026-...04.012565  ->  2026-...04.012
            let s = String(this.updatedAt).trim();
            s = s.replace(/(\.\d{3})\d+/, '$1');

            // 2) 타임존 없으면(서버가 JST로 준다고 가정 시) +09:00 붙여서 명확화
            //    이미 Z 또는 +hh:mm / -hh:mm 있으면 그대로 둠
            if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) {
                s += '+09:00';
            }

            const updateDate = new Date(s);
            const now = new Date();

            const updateMs = updateDate.getTime();
            const nowMs = now.getTime();
            let diffMs = nowMs - updateMs;

            // 3) 파싱 실패면 결측 처리
            if (Number.isNaN(diffMs)) {
                this.updateTimeElement.innerHTML = '<span class="clock-svg"></span>업데이트 정보 없음';
                return;
            }

            // 4) "조금 미래"는 클럭 스큐로 보고 0으로 클램프
            //    (예: 5초 이내 미래는 방금 업데이트로 간주)
            if (diffMs < 0) {
                if (diffMs > -5000) diffMs = 0;
                else {
                    this.updateTimeElement.innerHTML = '<span class="clock-svg"></span>업데이트 정보 없음';
                    return;
                }
            }

            const diffMinutes = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            let relativeTime = '';

            if (diffMinutes < 1) relativeTime = '방금 전';
            else if (diffMinutes < 60) relativeTime = `${diffMinutes}분 전`;
            else if (diffHours < 24) relativeTime = `${diffHours}시간 전`;
            else if (diffDays < 7) relativeTime = `${diffDays}일 전`;
            else {
                const year = updateDate.getFullYear();
                const month = String(updateDate.getMonth() + 1).padStart(2, '0');
                const day = String(updateDate.getDate()).padStart(2, '0');
                relativeTime = `${year}-${month}-${day}`;
            }

            this.updateTimeElement.innerHTML = `<span class="clock-svg"></span>${relativeTime} 업데이트`;
        } catch (error) {
            console.error('시간 계산 오류:', error);
            this.updateTimeElement.innerHTML = '<span class="clock-svg"></span>업데이트 정보 없음';
        }
    },

    /**
     * 업데이트 시간 설정
     * @param {string} updatedAt - ISO 8601 형식의 업데이트 시간
     */
    setUpdatedAt(updatedAt) {
        this.updatedAt = updatedAt;
        this.updateRelativeTime();
    },

    /**
     * 타이머 정지
     */
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
};

