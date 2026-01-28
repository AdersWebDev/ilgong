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

/**
 * Time Deal (Hot Deal) Countdown Timer
 * - finDate 기준 남은 시간을 HH:MM:SS로 표시
 * - 24시간을 넘어가는 표기는 하지 않기 위해 diff를 24시간으로 클램프(모듈로)
 * - finDate <= now 이면 이벤트 오류로 판단하고 시작하지 않음
 */
const TimeDealTimer = {
    intervalId: null,
    remainingSeconds: null,

    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.remainingSeconds = null;
    },

    /**
     * @param {string} finDate - LocalDateTime 문자열
     * @param {(hh:number, mm:number, ss:number, formatted:string)=>void} onTick
     * @returns {boolean} 시작 성공 여부
     */
    init(finDate, onTick) {
        this.destroy();

        const remainingSeconds = this.calculateRemainingSeconds(finDate);
        if (remainingSeconds === null) return false;

        this.remainingSeconds = remainingSeconds;
        onTick(...this.secondsToHms(this.remainingSeconds));

        this.intervalId = setInterval(() => {
            if (this.remainingSeconds === null) return;
            this.remainingSeconds -= 1;

            if (this.remainingSeconds < 0) {
                this.destroy();
                return;
            }

            onTick(...this.secondsToHms(this.remainingSeconds));
        }, 1000);

        return true;
    },

    /**
     * finDate - now 를 계산해 초 단위 반환
     * - diff <= 0 이면 null
     * - diff >= 24h 이면 diff를 24h 미만으로 클램프
     */
    calculateRemainingSeconds(finDate) {
        if (!finDate) return null;

        const finDateObj = this.parseLocalDateTime(finDate);
        if (!finDateObj) return null;

        const now = new Date();
        let diffMs = finDateObj.getTime() - now.getTime();

        if (Number.isNaN(diffMs)) return null;

        // finDate가 현재보다 과거면 이벤트 오류
        if (diffMs <= 0) return null;

        const DAY_MS = 24 * 60 * 60 * 1000;
        // 24시간 초과 표기 방지 (예: 47h30m -> 23h30m)
        if (diffMs >= DAY_MS) {
            diffMs = diffMs % DAY_MS;
            // 모듈로 결과가 0이면 (정확히 24h 배수) 24h 대신 0으로 표기되는데,
            // "24시간을 넘어가는 표기" 방지가 목적이므로 그대로 둠.
        }

        return Math.floor(diffMs / 1000);
    },

    /**
     * DiscountTimer와 동일한 규칙으로 LocalDateTime을 Date로 파싱
     * - 마이크로초(6자리) -> 밀리초(3자리) 정규화
     * - 타임존 없으면 +09:00 부여
     * @param {string} input
     * @returns {Date|null}
     */
    parseLocalDateTime(input) {
        try {
            let s = String(input).trim();
            s = s.replace(/(\.\d{3})\d+/, '$1');
            if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) {
                s += '+09:00';
            }
            const d = new Date(s);
            if (Number.isNaN(d.getTime())) return null;
            return d;
        } catch {
            return null;
        }
    },

    /**
     * @param {number} totalSeconds
     * @returns {[number, number, number, string]} hh, mm, ss, formatted
     */
    secondsToHms(totalSeconds) {
        const safe = Math.max(0, Number(totalSeconds) || 0);
        const hh = Math.floor(safe / 3600);
        const mm = Math.floor((safe % 3600) / 60);
        const ss = safe % 60;

        const pad = (n) => String(n).padStart(2, '0');
        const formatted = `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
        return [hh, mm, ss, formatted];
    }
};

