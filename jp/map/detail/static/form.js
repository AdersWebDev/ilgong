/**
 * Form Module
 * 문의 폼 유효성 검사
 */

const ContactForm = {
    form: null,
    nameInput: null,
    messageInput: null,
    privacyCheckbox: null,
    
    /**
     * 초기화
     */
    init() {
        this.form = document.getElementById('contactForm');
        this.nameInput = document.getElementById('contactName');
        this.messageInput = document.getElementById('contactMessage');
        this.privacyCheckbox = document.getElementById('privacyAgreement');
        
        if (!this.form) return;
        
        this.bindEvents();
    },
    
    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }
        
        // 실시간 유효성 검사
        if (this.nameInput) {
            this.nameInput.addEventListener('blur', () => {
                this.validateName();
            });
        }
        
        if (this.messageInput) {
            this.messageInput.addEventListener('blur', () => {
                this.validateMessage();
            });
        }
        
        if (this.privacyCheckbox) {
            this.privacyCheckbox.addEventListener('change', () => {
                this.clearError('privacyError');
            });
        }
    },
    
    /**
     * 폼 제출 처리
     */
    async handleSubmit() {
        const isValid = this.validateForm();
        
        if (!isValid) {
            return;
        }
        
        const formData = {
            name: this.nameInput?.value.trim() || '',
            message: this.messageInput?.value.trim() || '',
            privacyAgreed: this.privacyCheckbox?.checked || false
        };
        
        try {
            // API 호출
            const response = await PropertyAPI.submitInquiry(formData);
            
            if (response.success) {
                this.showSuccess();
                this.resetForm();
            } else {
                this.showError('문의 전송에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('Form submission error:', error);
            this.showError('오류가 발생했습니다. 다시 시도해주세요.');
        }
    },
    
    /**
     * 폼 유효성 검사
     * @returns {boolean} 유효성 검사 통과 여부
     */
    validateForm() {
        const nameValid = this.validateName();
        const messageValid = this.validateMessage();
        const privacyValid = this.validatePrivacy();
        
        return nameValid && messageValid && privacyValid;
    },
    
    /**
     * 이름 유효성 검사
     * @returns {boolean} 유효성 검사 통과 여부
     */
    validateName() {
        if (!this.nameInput) return false;
        
        const name = this.nameInput.value.trim();
        
        if (!name) {
            this.showError('nameError', '이름을 입력해주세요');
            this.highlightInput(this.nameInput, true);
            return false;
        }
        
        if (name.length < 2) {
            this.showError('nameError', '이름은 2글자 이상 입력해주세요');
            this.highlightInput(this.nameInput, true);
            return false;
        }
        
        this.clearError('nameError');
        this.highlightInput(this.nameInput, false);
        return true;
    },
    
    /**
     * 문의내용 유효성 검사
     * @returns {boolean} 유효성 검사 통과 여부
     */
    validateMessage() {
        if (!this.messageInput) return false;
        
        const message = this.messageInput.value.trim();
        
        if (!message) {
            this.showError('messageError', '문의내용을 입력해주세요');
            this.highlightInput(this.messageInput, true);
            return false;
        }
        
        if (message.length < 10) {
            this.showError('messageError', '문의내용은 10글자 이상 입력해주세요');
            this.highlightInput(this.messageInput, true);
            return false;
        }
        
        this.clearError('messageError');
        this.highlightInput(this.messageInput, false);
        return true;
    },
    
    /**
     * 개인정보 동의 유효성 검사
     * @returns {boolean} 유효성 검사 통과 여부
     */
    validatePrivacy() {
        if (!this.privacyCheckbox) return false;
        
        if (!this.privacyCheckbox.checked) {
            this.showError('privacyError', '개인정보 수집 및 이용에 동의해주세요');
            return false;
        }
        
        this.clearError('privacyError');
        return true;
    },
    
    /**
     * 에러 메시지 표시
     * @param {string} errorId - 에러 요소 ID
     * @param {string} message - 에러 메시지
     */
    showError(errorId, message = '') {
        const errorElement = document.getElementById(errorId);
        if (!errorElement) return;
        
        if (message) {
            errorElement.textContent = message;
        }
        errorElement.classList.add('show');
    },
    
    /**
     * 에러 메시지 숨김
     * @param {string} errorId - 에러 요소 ID
     */
    clearError(errorId) {
        const errorElement = document.getElementById(errorId);
        if (!errorElement) return;
        
        errorElement.classList.remove('show');
        errorElement.textContent = '';
    },
    
    /**
     * 입력 필드 하이라이트
     * @param {HTMLElement} input - 입력 요소
     * @param {boolean} hasError - 에러 여부
     */
    highlightInput(input, hasError) {
        if (!input) return;
        
        if (hasError) {
            input.style.borderColor = '#FF4444';
        } else {
            input.style.borderColor = '';
        }
    },
    
    /**
     * 성공 메시지 표시
     */
    showSuccess() {
        // 간단한 알림 (향후 모달로 변경 가능)
        alert('문의가 성공적으로 전송되었습니다.');
        
        // 또는 커스텀 알림 컴포넌트 사용
        // this.showCustomNotification('문의가 성공적으로 전송되었습니다.', 'success');
    },
    
    /**
     * 폼 초기화
     */
    resetForm() {
        if (this.nameInput) {
            this.nameInput.value = '';
            this.highlightInput(this.nameInput, false);
        }
        
        if (this.messageInput) {
            this.messageInput.value = '';
            this.highlightInput(this.messageInput, false);
        }
        
        if (this.privacyCheckbox) {
            this.privacyCheckbox.checked = false;
        }
        
        // 모든 에러 메시지 숨김
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(error => {
            error.classList.remove('show');
            error.textContent = '';
        });
    }
};

