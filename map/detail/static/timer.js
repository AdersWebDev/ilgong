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
            // updatedAt이 없으면 기본 메시지 표시
            if (this.updateTimeElement) {
                this.updateTimeElement.innerHTML = '<span class="clock-svg"></span>업데이트 시간 정보 없음';
            }
            return;
        }
        
        try {
            const updateDate = new Date(this.updatedAt);
            const now = new Date();
            const diffMs = now - updateDate;
            
            if (isNaN(diffMs) || diffMs < 0) {
                this.updateTimeElement.innerHTML = '<span class="clock-svg"></span>업데이트 시간 정보 없음';
                return;
            }
            
            const diffMinutes = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);
            
            let relativeTime = '';
            
            if (diffMinutes < 1) {
                relativeTime = '방금 전';
            } else if (diffMinutes < 60) {
                relativeTime = `${diffMinutes}분 전`;
            } else if (diffHours < 24) {
                relativeTime = `${diffHours}시간 전`;
            } else if (diffDays < 7) {
                relativeTime = `${diffDays}일 전`;
            } else {
                // 7일 이상이면 날짜 표시
                const year = updateDate.getFullYear();
                const month = String(updateDate.getMonth() + 1).padStart(2, '0');
                const day = String(updateDate.getDate()).padStart(2, '0');
                relativeTime = `${year}-${month}-${day}`;
            }
            
            this.updateTimeElement.innerHTML = `<span class="clock-svg"></span>${relativeTime} 업데이트`;
        } catch (error) {
            console.error('시간 계산 오류:', error);
            if (this.updateTimeElement) {
                this.updateTimeElement.innerHTML = '<span class="clock-svg"></span>업데이트 시간 정보 없음';
            }
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

