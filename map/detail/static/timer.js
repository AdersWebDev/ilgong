/**
 * Timer Module
 * 할인 타이머 관리 (랜덤 시간 생성)
 */

const DiscountTimer = {
    timerElement: null,
    timerInterval: null,
    
    /**
     * 초기화
     */
    init() {
        this.timerElement = document.getElementById('discountTimer');
        if (!this.timerElement) return;
        
        // 랜덤 시간 생성 (12:00:00 ~ 23:59:59)
        const randomHours = Math.floor(Math.random() * 12) + 12;
        const randomMinutes = Math.floor(Math.random() * 60);
        const randomSeconds = Math.floor(Math.random() * 60);
        
        this.startTimer(randomHours, randomMinutes, randomSeconds);
    },
    
    /**
     * 타이머 시작
     * @param {number} hours - 시간
     * @param {number} minutes - 분
     * @param {number} seconds - 초
     */
    startTimer(hours, minutes, seconds) {
        let totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        const updateTimer = () => {
            if (totalSeconds <= 0) {
                // 시간이 끝나면 새로운 랜덤 시간으로 재시작
                this.restartWithRandomTime();
                return;
            }
            
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            const s = totalSeconds % 60;
            
            this.displayTime(h, m, s);
            
            totalSeconds--;
        };
        
        // 즉시 한 번 실행
        updateTimer();
        
        // 1초마다 업데이트
        this.timerInterval = setInterval(updateTimer, 1000);
    },
    
    /**
     * 시간 표시
     * @param {number} hours - 시간
     * @param {number} minutes - 분
     * @param {number} seconds - 초
     */
    displayTime(hours, minutes, seconds) {
        if (!this.timerElement) return;
        
        const h = String(hours).padStart(2, '0');
        const m = String(minutes).padStart(2, '0');
        const s = String(seconds).padStart(2, '0');
        
        this.timerElement.textContent = `${h}:${m}:${s}`;
    },
    
    /**
     * 새로운 랜덤 시간으로 재시작
     */
    restartWithRandomTime() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        const randomHours = Math.floor(Math.random() * 12) + 12;
        const randomMinutes = Math.floor(Math.random() * 60);
        const randomSeconds = Math.floor(Math.random() * 60);
        
        this.startTimer(randomHours, randomMinutes, randomSeconds);
    },
    
    /**
     * 타이머 정지
     */
    destroy() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
};

