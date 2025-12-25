/**
 * 클래스명 난수화 시스템
 * HTML 클래스명을 난수화하여 분석을 어렵게 만듦
 * 
 * @author 일공 개발팀
 * @version 1.0
 */
class ClassObfuscator {
    constructor() {
        this.classMap = new Map(); // 원본 -> 난수화된 클래스명
        this.reverseMap = new Map(); // 난수화된 클래스명 -> 원본
        this.obfuscated = false;
        this.init();
    }

    /**
     * 초기화 - 기존 클래스명 수집 및 난수화
     */
    init() {
        // 이미 난수화되었으면 스킵
        if (this.obfuscated) return;

        // 모든 요소의 클래스명 수집
        const classSet = this.collectAllClasses();

        // 클래스명 난수화
        classSet.forEach(originalClass => {
            if (!originalClass.startsWith('_obf_') && originalClass.length > 0) {
                const obfuscated = this.generateObfuscatedName();
                this.classMap.set(originalClass, obfuscated);
                this.reverseMap.set(obfuscated, originalClass);
            }
        });

        // DOM에 적용
        this.applyObfuscation();
        
        // CSS 스타일시트 난수화
        this.obfuscateStylesheets();
        
        this.obfuscated = true;
    }

    /**
     * 모든 클래스명 수집
     */
    collectAllClasses() {
        const classSet = new Set();
        const allElements = document.querySelectorAll('*');

        allElements.forEach(el => {
            if (el.className) {
                if (typeof el.className === 'string') {
                    el.className.split(/\s+/).forEach(cls => {
                        if (cls && cls.trim().length > 0) {
                            classSet.add(cls.trim());
                        }
                    });
                } else if (el.className.baseVal) {
                    // SVG 요소 처리
                    const classes = el.className.baseVal.split(/\s+/);
                    classes.forEach(cls => {
                        if (cls && cls.trim().length > 0) {
                            classSet.add(cls.trim());
                        }
                    });
                }
            }
        });

        return classSet;
    }

    /**
     * 난수화된 클래스명 생성
     */
    generateObfuscatedName() {
        const prefix = '_obf_';
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = prefix;
        
        // 16자리 난수 생성
        for (let i = 0; i < 16; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // 중복 체크
        if (this.reverseMap.has(result)) {
            return this.generateObfuscatedName();
        }
        
        return result;
    }

    /**
     * DOM에 난수화 적용
     */
    applyObfuscation() {
        const allElements = document.querySelectorAll('*');
        
        allElements.forEach(el => {
            if (el.className) {
                if (typeof el.className === 'string') {
                    const classes = el.className.split(/\s+/).filter(c => c);
                    const obfuscatedClasses = classes.map(cls => {
                        if (cls.startsWith('_obf_')) return cls;
                        return this.classMap.get(cls) || cls;
                    });
                    el.className = obfuscatedClasses.join(' ');
                } else if (el.className.baseVal) {
                    // SVG 요소 처리
                    const classes = el.className.baseVal.split(/\s+/).filter(c => c);
                    const obfuscatedClasses = classes.map(cls => {
                        if (cls.startsWith('_obf_')) return cls;
                        return this.classMap.get(cls) || cls;
                    });
                    el.className.baseVal = obfuscatedClasses.join(' ');
                }
            }
        });
    }

    /**
     * CSS 스타일시트 난수화
     */
    obfuscateStylesheets() {
        // 동적으로 추가된 스타일시트 처리
        const styleSheets = Array.from(document.styleSheets);
        
        styleSheets.forEach(sheet => {
            try {
                const rules = Array.from(sheet.cssRules || sheet.rules || []);
                rules.forEach(rule => {
                    if (rule.selectorText) {
                        const newSelector = this.obfuscateSelector(rule.selectorText);
                        if (newSelector !== rule.selectorText) {
                            // 동적으로 새 스타일 생성
                            this.createObfuscatedStyle(newSelector, rule);
                        }
                    }
                });
            } catch (e) {
                // CORS 오류 등 무시 (외부 스타일시트)
            }
        });
    }

    /**
     * CSS 셀렉터 난수화
     */
    obfuscateSelector(selector) {
        return selector.split(',').map(sel => {
            return sel.trim().split(/\s+/).map(part => {
                // 클래스 셀렉터만 난수화
                if (part.includes('.')) {
                    return part.replace(/\.([a-zA-Z0-9_-]+)/g, (match, className) => {
                        const obfuscated = this.classMap.get(className);
                        return obfuscated ? '.' + obfuscated : match;
                    });
                }
                return part;
            }).join(' ');
        }).join(', ');
    }

    /**
     * 난수화된 스타일 생성
     */
    createObfuscatedStyle(selector, originalRule) {
        const style = document.createElement('style');
        let cssText = '';
        
        if (originalRule.style) {
            cssText = originalRule.style.cssText;
        }
        
        style.textContent = `${selector} { ${cssText} }`;
        style.setAttribute('data-obfuscated', 'true');
        document.head.appendChild(style);
    }

    /**
     * 동적으로 추가된 요소에 난수화 적용
     */
    obfuscateElement(element) {
        if (element.className) {
            if (typeof element.className === 'string') {
                const classes = element.className.split(/\s+/).filter(c => c);
                const obfuscatedClasses = classes.map(cls => {
                    if (cls.startsWith('_obf_')) return cls;
                    // 새 클래스명이면 맵에 추가
                    if (!this.classMap.has(cls)) {
                        const obfuscated = this.generateObfuscatedName();
                        this.classMap.set(cls, obfuscated);
                        this.reverseMap.set(obfuscated, cls);
                    }
                    return this.classMap.get(cls) || cls;
                });
                element.className = obfuscatedClasses.join(' ');
            }
        }

        // 자식 요소도 재귀적으로 처리
        const children = element.querySelectorAll('*');
        children.forEach(child => {
            if (child.className) {
                if (typeof child.className === 'string') {
                    const classes = child.className.split(/\s+/).filter(c => c);
                    const obfuscatedClasses = classes.map(cls => {
                        if (cls.startsWith('_obf_')) return cls;
                        if (!this.classMap.has(cls)) {
                            const obfuscated = this.generateObfuscatedName();
                            this.classMap.set(cls, obfuscated);
                            this.reverseMap.set(obfuscated, cls);
                        }
                        return this.classMap.get(cls) || cls;
                    });
                    child.className = obfuscatedClasses.join(' ');
                }
            }
        });
    }

    /**
     * 원본 클래스명으로 변환 (디버깅용, 프로덕션에서는 제거 권장)
     */
    getOriginalClass(obfuscated) {
        return this.reverseMap.get(obfuscated);
    }

    /**
     * 난수화 맵 초기화 (재난수화용)
     */
    reset() {
        this.classMap.clear();
        this.reverseMap.clear();
        this.obfuscated = false;
    }
}

// 전역 난수화 인스턴스
window.classObfuscator = new ClassObfuscator();
