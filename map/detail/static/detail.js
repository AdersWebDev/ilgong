/**
 * Detail Page Main Module
 * 메인 초기화 및 이벤트 바인딩
 */

const PropertyDetail = {
    producer: null,
    propertyId: null,
    propertyData: null,

    /**
     * 초기화
     */
    async init() {
        // URL에서 producer와 id 추출 (예: /rent/detail?producer=re&id=186341)
        const urlParams = PropertyAPI.extractUrlParams();
        if (!urlParams) {
            this.showError('잘못된 URL입니다. producer와 id가 필요합니다.');
            return;
        }

        this.producer = urlParams.producer;
        this.propertyId = urlParams.id;

        try {
            // 기본 데이터 로드 (초기 비용 문서 제외)
            await this.loadData();

            // 모듈 초기화
            this.initModules();

            // 이벤트 바인딩
            this.bindEvents();

            // 페이지 로딩 완료 후 초기 비용 문서 로드
            if (document.readyState === 'complete') {
                await this.loadInitCostDocument();
            } else {
                window.addEventListener('load', () => {
                    this.loadInitCostDocument();
                });
            }
        } catch (error) {
            this.showError('데이터를 불러오는 중 오류가 발생했습니다.');
            this.hideLoadingOverlay();
        }
    },

    /**
     * 데이터 로드
     */
    async loadData() {
        // 단일 API 호출로 모든 데이터 가져오기
        const data = await PropertyAPI.getPropertyDetailWithUnits(this.producer, this.propertyId);

        // 초기 비용과 추천 맨션은 API에 없으므로 null로 설정 (기존 placeholder 유지)
        this.propertyData = {
            listPhoto: data.property.listPhoto,
            property: data.property,
            units: data.units,
            initialCosts: null,
            recommended: null,
            initCostDocument: null // 페이지 로딩 완료 후 로드
        };
    },

    /**
     * 초기 비용 문서 로드 (페이지 로딩 완료 후)
     */
    async loadInitCostDocument() {
        try {
            // 로딩 오버레이 표시
            this.showLoadingOverlay();

            // 초기 비용 문서 데이터 가져오기 (건물 단위)
            const initCostDocument = await PropertyAPI.getInitCostDocument(this.producer, this.propertyId);

            // 데이터 저장
            if (this.propertyData) {
                this.propertyData.initCostDocument = initCostDocument;
            } else {
                this.propertyData = {
                    initCostDocument: initCostDocument
                };
            }

            // 초기 비용 문서 렌더링
            this.renderInitCostData(initCostDocument);
        } catch (error) {
            console.error('초기 비용 문서 로드 오류:', error);
            // 에러 발생 시 null 상태로 렌더링
            this.renderInitCostData(null);
        } finally {
            // 로딩 오버레이 숨기기
            this.hideLoadingOverlay();
        }
    },

    /**
     * 로딩 오버레이 표시
     */
    showLoadingOverlay() {
        const overlay = document.getElementById('initCostLoadingOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    },

    /**
     * 로딩 오버레이 숨기기
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('initCostLoadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    /**
     * 모듈 초기화
     */
    initModules() {
        const { property, listPhoto, units, initialCosts, recommended } = this.propertyData;

        // 부동산 정보 렌더링
        this.renderPropertyInfo(property);
        
        if (!property.images || property.images.length === 0) {
            property.images = [listPhoto];
        }
        property.images = this.fillPropertyImages(property.images || [], units, 11);
        // 이미지 갤러리 초기화 (건물 사진으로 저장)
        PropertyGallery.init(property.images || [], listPhoto, true);

        // 공실 목록 및 추천 맨션 카로셀 초기화
        PropertyCarousel.init(units || [], recommended || [], property.updatedAt);

        // 초기 비용 렌더링
        this.renderInitialCosts(initialCosts);

        // 초기 비용 문서는 페이지 로딩 완료 후 loadInitCostDocument()에서 렌더링

        // 업데이트 시간 타이머 초기화
        DiscountTimer.init(property.updatedAt);

        // 문의 폼 초기화
        ContactForm.init();
    },
    fillPropertyImages(baseImages = [], units = [], targetCount = 11) {
        const result = [];
        const seen = new Set();

        const pushIfNew = (url) => {
            if (!url) return false;
            if (seen.has(url)) return false;
            seen.add(url);
            result.push(url);
            return result.length >= targetCount;
        };

        // 1) 기존 property.images
        for (const url of baseImages) {
            if (pushIfNew(url)) return result;
        }

        // 2) 부족하면 units.photos에서 채움
        for (const unit of (units || [])) {
            for (const url of (unit?.photos || [])) {
                // 옵션) 레이아웃(평면도) 빼고 싶으면 아래 한 줄 켜
                if (url.includes('/layout/')) continue;

                if (pushIfNew(url)) return result;
            }
        }

        return result;
    },
    /**
     * 부동산 정보 렌더링
     * @param {Object} property - 부동산 정보
     */
    renderPropertyInfo(property) {
        // 가격 정보 (최소 월세 표시)
        const propertyStats = document.querySelector('.property-stats');
        if (propertyStats) {
            const priceElement = propertyStats.querySelector('h2');
            const priceUnit = propertyStats.querySelector('span[style*="font-size: 18px"]');
            const priceTag = propertyStats.querySelector('.feature-tag');

            if (priceElement && property.rent) {
                priceElement.textContent = `${property.rent.toLocaleString('ko-KR')}+`;
            }
            if (priceUnit) {
                priceUnit.textContent = '엔';
            }
            if (priceTag) {
                priceTag.textContent = '월세';
            }
        }

        // 부동산명
        const infoRows = document.querySelectorAll('.info-row');
        if (infoRows.length > 0 && property.name) {
            const nameRow = Array.from(infoRows).find(row =>
                row.querySelector('.info-label.house') ||
                row.textContent.includes('맨션명')
            );
            if (nameRow) {
                const nameValue = nameRow.querySelector('.info-value');
                if (nameValue) {
                    nameValue.textContent = property.name;
                }
            }
        }

        // 주소
        if (infoRows.length > 1 && property.address) {
            const addressRow = Array.from(infoRows).find(row =>
                row.textContent.includes('주소')
            );
            if (addressRow) {
                const addressValue = addressRow.querySelector('.info-value');
                if (addressValue) {
                    addressValue.textContent = property.address;
                }
            }
        }

        // 건축일 및 구조 정보
        const infoCards = document.querySelectorAll('.info-card');
        if (infoCards.length >= 2) {
            if (property.constructionDate) {
                const constructionCard = infoCards[0];
                const constructionValue = constructionCard?.querySelector('.info-value');
                if (constructionValue) {
                    // 날짜 포맷팅 (예: "2008-09-01" → "2008年9月")
                    const date = new Date(property.constructionDate);
                    if (!isNaN(date.getTime())) {
                        const year = date.getFullYear();
                        const month = date.getMonth() + 1;
                        constructionValue.textContent = `${year}年${month}月`;
                    } else {
                        constructionValue.textContent = property.constructionDate;
                    }
                }
            }

            if (property.structure) {
                const structureCard = infoCards[1];
                const structureValue = structureCard?.querySelector('.info-value');
                if (structureValue) {
                    structureValue.textContent = property.structure;
                }
            }
        }

        // 건물 설비
        const buildingFacilitiesContainer = document.getElementById('buildingFacilities');
        if (buildingFacilitiesContainer && property.buildingFacilities) {
            buildingFacilitiesContainer.innerHTML = '';

            property.buildingFacilities.forEach((facility, idx) => {
                const tag = document.createElement('span');
                tag.className = 'property-feature-tag';
                tag.textContent = facility;
                buildingFacilitiesContainer.appendChild(tag);

                // 마지막 요소가 아니면 divider 추가
                if (idx !== property.buildingFacilities.length - 1) {
                    const divider = document.createElement('span');
                    divider.className = 'divider';
                    buildingFacilitiesContainer.appendChild(divider);
                }
            });
        }

        // 호실 설비 옵션 (첫 번째 방의 설비 사용)
        const roomEquipmentContainer = document.getElementById('roomEquipment');
        if (roomEquipmentContainer && this.propertyData.units && this.propertyData.units.length > 0) {
            const firstRoom = this.propertyData.units[0];
            if (firstRoom.roomEquipment && firstRoom.roomEquipment.length > 0) {
                roomEquipmentContainer.innerHTML = '';
                firstRoom.roomEquipment.forEach((equipment, idx) => {
                    const tag = document.createElement('div');
                    tag.className = 'property-feature-tag';
                    tag.textContent = equipment;
                    roomEquipmentContainer.appendChild(tag);

                    // 마지막 요소가 아니면 divider 추가
                    if (idx !== firstRoom.roomEquipment.length - 1) {
                        const divider = document.createElement('span');
                        divider.className = 'divider';
                        roomEquipmentContainer.appendChild(divider);
                    }
                });
            }
        }

        // 업데이트 시간 표시
        const updateTimeElement = document.getElementById('propertyUpdateTime');
        if (updateTimeElement && property.updatedAt) {
            const updateDate = new Date(property.updatedAt);
            if (!isNaN(updateDate.getTime())) {
                const year = updateDate.getFullYear();
                const month = String(updateDate.getMonth() + 1).padStart(2, '0');
                const day = String(updateDate.getDate()).padStart(2, '0');
                updateTimeElement.textContent = `${year}-${month}-${day}`;
            } else {
                updateTimeElement.textContent = property.updatedAt;
            }
        }

        // 전철역 정보 렌더링
        const subwayList = document.getElementById('subwayList');
        if (subwayList) {
            // 기존 하드코딩된 항목 제거
            subwayList.innerHTML = '';

            // trans1, trans2, trans3 필터링 (null/empty 제거)
            const transList = [];
            if (property.trans1 && typeof property.trans1 === 'string' && property.trans1.trim() !== '') {
                transList.push(property.trans1.trim());
            }
            if (property.trans2 && typeof property.trans2 === 'string' && property.trans2.trim() !== '') {
                transList.push(property.trans2.trim());
            }
            if (property.trans3 && typeof property.trans3 === 'string' && property.trans3.trim() !== '') {
                transList.push(property.trans3.trim());
            }

            // 각 trans 문자열에 대해 리스트 아이템 생성
            transList.forEach(trans => {
                const subwayClass = PropertyAPI.getSubwayClass(trans);
                const li = document.createElement('li');
                li.className = `subway-svg ${subwayClass}`.trim();
                li.textContent = trans;
                subwayList.appendChild(li);
            });
        }
    },

    /**
     * 초기 비용 문서 데이터 렌더링
     * @param {Object} initCostData - 초기 비용 문서 데이터 {roomName, initCostRow, specialTerms}
     */
    renderInitCostData(initCostData) {
        // null 체크 (null, undefined, 또는 빈 문자열)
        const hasInitCostRow = initCostData && initCostData.initCostRow !== null && initCostData.initCostRow !== undefined && initCostData.initCostRow !== '';
        const hasSpecialTerms = initCostData && initCostData.specialTerms !== null && initCostData.specialTerms !== undefined && initCostData.specialTerms !== '';
        const hasData = hasInitCostRow && hasSpecialTerms;

        // init-num spans 찾기
        const initNumSpans = document.querySelectorAll('.init-num');

        // initCostRow 컨테이너
        const initCostRowContainer = document.getElementById('initCostRowContainer');
        // specialTerms 컨테이너
        const specialTermsContainer = document.getElementById('specialTermsContainer');

        if (hasData) {
            // Case 1: 정상 데이터 - textarea로 표시
            // init-num 표시 및 roomName 업데이트
            initNumSpans.forEach(span => {
                if (initCostData.roomName) {
                    span.textContent = `*${initCostData.roomName}호실 기준`;
                }
                span.style.display = 'inline';
            });

            // initCostRow 렌더링
            if (initCostRowContainer) {
                const textarea = document.createElement('textarea');
                textarea.className = 'init-cost-textarea data';
                textarea.readOnly = true;
                textarea.value = initCostData.initCostRow || '';
                initCostRowContainer.innerHTML = '';
                initCostRowContainer.appendChild(textarea);
                // textarea 높이 자동 조정
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';

                const warningText = document.createElement('p');
                warningText.style.fontSize = '16px';
                warningText.style.color = '#F06265';
                warningText.style.margin = '20px 0 30px 0';
                warningText.style.textAlign = 'left';
                warningText.style.fontWeight = 'bold';
                warningText.innerHTML = ```
                ※ 고객님이 안심하고 결정하실 수 있도록, 일본어 부동산 자료를 보기 쉽게 정리한 내용입니다.<br>
일본 부동산은 변동이 잦아 최종 공실/조건/비용은 중개회사 확인이 반드시 필요합니다.<br>
확인 후 진행하시면 불필요한 리스크를 줄이고 안전하게 진행하실 수 있습니다.```;
                initCostRowContainer.appendChild(warningText);
            }

            // specialTerms 렌더링
            if (specialTermsContainer) {
                // 기존 placeholder 제거
                const placeholderDiv = specialTermsContainer.querySelector('.init-cost-textarea.null');
                if (placeholderDiv) {
                    placeholderDiv.remove();
                }

                // 기존 textarea 찾기 또는 생성
                let textarea = specialTermsContainer.querySelector('textarea.init-cost-textarea.data');
                if (!textarea) {
                    textarea = document.createElement('textarea');
                    textarea.className = 'init-cost-textarea data';
                    textarea.readOnly = true;
                    specialTermsContainer.appendChild(textarea);
                }

                textarea.value = initCostData.specialTerms || '';
                textarea.style.display = 'block';
                // textarea 높이 자동 조정
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';

                const warningText = document.createElement('p');
                warningText.style.fontSize = '16px';
                warningText.style.color = '#F06265';
                warningText.style.margin = '20px 0 30px 0';
                warningText.style.textAlign = 'left';
                warningText.style.fontWeight = 'bold';
                warningText.innerHTML = ```
                ※ 고객님이 안심하고 결정하실 수 있도록, 일본어 부동산 자료를 보기 쉽게 정리한 내용입니다.<br>
일본 부동산은 변동이 잦아 최종 공실/조건/비용은 중개회사 확인이 반드시 필요합니다.<br>
확인 후 진행하시면 불필요한 리스크를 줄이고 안전하게 진행하실 수 있습니다.```;
                specialTermsContainer.appendChild(warningText);
            }
        } else {
            // Case 2/3: null 데이터 - placeholder 표시
            // init-num 숨기기
            initNumSpans.forEach(span => {
                span.style.display = 'none';
            });

            // initCostRow placeholder 표시
            if (initCostRowContainer) {
                initCostRowContainer.innerHTML = `
                    <div class="init-cost-textarea null" readonly>
                        <div>
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="24" viewBox="0 0 28 24" fill="none">
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M22.9517 4.70737C23.6309 3.99858 24.7321 3.99858 25.4114 4.70737L26.4906 5.83347C27.1698 6.54225 27.1698 7.69143 26.4906 8.40022L17.9334 17.3295C17.7243 17.5476 17.4655 17.7065 17.1813 17.7912L13.9502 18.7545C13.6899 18.8322 13.4098 18.7564 13.2184 18.5566C13.0269 18.3569 12.9543 18.0646 13.0287 17.793L13.9519 14.4214C14.0331 14.1249 14.1854 13.8547 14.3944 13.6366L22.9517 4.70737ZM24.3572 5.80741C24.2601 5.70615 24.1028 5.70615 24.0058 5.80741L22.7509 7.11684L24.1815 8.60961L25.4364 7.30018C25.5334 7.19893 25.5334 7.03476 25.4364 6.93351L24.3572 5.80741ZM23.1273 9.70964L21.6967 8.21687L15.4486 14.7367C15.4187 14.7678 15.397 14.8064 15.3854 14.8488L14.8308 16.8741L16.7717 16.2954C16.8123 16.2833 16.8493 16.2606 16.8792 16.2294L23.1273 9.70964Z"
                                    fill="#17171B" stroke="#17171B" stroke-width="0.5" />
                                <path fill-rule="evenodd" clip-rule="evenodd"
                                    d="M6.25 1C5.55965 1 5 1.55166 5 2.23214V7.16071C5 7.8412 5.55965 8.39286 6.25 8.39286H13.75C14.4403 8.39286 15 7.8412 15 7.16071V2.23214C15 1.55166 14.4403 1 13.75 1H6.25ZM7.5 5.92857V3.46429H12.5V5.92857H7.5Z"
                                    fill="#17171B" />
                                <path
                                    d="M3.16533 3.47867C3.51102 4.0677 3.30682 4.82144 2.70923 5.16218C2.58143 5.23504 2.5 5.36823 2.5 5.5187V21.1258C2.5 21.3527 2.68655 21.5365 2.91667 21.5365H17.0833C17.3135 21.5365 17.5 21.3527 17.5 21.1258V20.2508C17.5 19.5605 18.0596 19.0008 18.75 19.0008C19.4404 19.0008 20 19.5605 20 20.2508V21.1258C20 22.7136 18.6942 24.0008 17.0833 24.0008H2.91667C1.30583 24.0008 0 22.7136 0 21.1258V5.5187C0 4.453 0.5889 3.52432 1.45743 3.02908C2.055 2.68834 2.81967 2.88962 3.16533 3.47867Z"
                                    fill="#17171B" />
                                <path
                                    d="M18.5425 3.02908C19.4112 3.52432 20 4.453 20 5.5187V6.50083L17.5 9.00083V8.00083V5.5187C17.5 5.36823 17.4185 5.23504 17.2908 5.16218C16.6932 4.82144 16.489 4.0677 16.8347 3.47867C17.1803 2.88962 17.945 2.68834 18.5425 3.02908Z"
                                    fill="#17171B" />
                            </svg>
                        </div>
                        <h3>준비 중인 정보입니다...(;-;)</h3>
                        <p>해당 건물은 작성 중이며 곧 업데이트 될 예정입니다.<br>
                            자세한 내용이 필요하시다면 <b>부동산</b> 또는 <b>일본공간</b>에 문의해주세요!</p>
                    </div>
                `;
            }

            // specialTerms placeholder 표시
            if (specialTermsContainer) {
                // 기존 textarea 숨기기
                const existingTextarea = specialTermsContainer.querySelector('textarea.init-cost-textarea.data');
                if (existingTextarea) {
                    existingTextarea.style.display = 'none';
                }
                // placeholder div가 없으면 추가
                if (!specialTermsContainer.querySelector('.init-cost-textarea.null')) {
                    specialTermsContainer.innerHTML = `
                        <div class="init-cost-textarea null" readonly>
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="24" viewBox="0 0 28 24" fill="none">
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                        d="M22.9517 4.70737C23.6309 3.99858 24.7321 3.99858 25.4114 4.70737L26.4906 5.83347C27.1698 6.54225 27.1698 7.69143 26.4906 8.40022L17.9334 17.3295C17.7243 17.5476 17.4655 17.7065 17.1813 17.7912L13.9502 18.7545C13.6899 18.8322 13.4098 18.7564 13.2184 18.5566C13.0269 18.3569 12.9543 18.0646 13.0287 17.793L13.9519 14.4214C14.0331 14.1249 14.1854 13.8547 14.3944 13.6366L22.9517 4.70737ZM24.3572 5.80741C24.2601 5.70615 24.1028 5.70615 24.0058 5.80741L22.7509 7.11684L24.1815 8.60961L25.4364 7.30018C25.5334 7.19893 25.5334 7.03476 25.4364 6.93351L24.3572 5.80741ZM23.1273 9.70964L21.6967 8.21687L15.4486 14.7367C15.4187 14.7678 15.397 14.8064 15.3854 14.8488L14.8308 16.8741L16.7717 16.2954C16.8123 16.2833 16.8493 16.2606 16.8792 16.2294L23.1273 9.70964Z"
                                        fill="#17171B" stroke="#17171B" stroke-width="0.5" />
                                    <path fill-rule="evenodd" clip-rule="evenodd"
                                        d="M6.25 1C5.55965 1 5 1.55166 5 2.23214V7.16071C5 7.8412 5.55965 8.39286 6.25 8.39286H13.75C14.4403 8.39286 15 7.8412 15 7.16071V2.23214C15 1.55166 14.4403 1 13.75 1H6.25ZM7.5 5.92857V3.46429H12.5V5.92857H7.5Z"
                                        fill="#17171B" />
                                    <path
                                        d="M3.16533 3.47867C3.51102 4.0677 3.30682 4.82144 2.70923 5.16218C2.58143 5.23504 2.5 5.36823 2.5 5.5187V21.1258C2.5 21.3527 2.68655 21.5365 2.91667 21.5365H17.0833C17.3135 21.5365 17.5 21.3527 17.5 21.1258V20.2508C17.5 19.5605 18.0596 19.0008 18.75 19.0008C19.4404 19.0008 20 19.5605 20 20.2508V21.1258C20 22.7136 18.6942 24.0008 17.0833 24.0008H2.91667C1.30583 24.0008 0 22.7136 0 21.1258V5.5187C0 4.453 0.5889 3.52432 1.45743 3.02908C2.055 2.68834 2.81967 2.88962 3.16533 3.47867Z"
                                        fill="#17171B" />
                                    <path
                                        d="M18.5425 3.02908C19.4112 3.52432 20 4.453 20 5.5187V6.50083L17.5 9.00083V8.00083V5.5187C17.5 5.36823 17.4185 5.23504 17.2908 5.16218C16.6932 4.82144 16.489 4.0677 16.8347 3.47867C17.1803 2.88962 17.945 2.68834 18.5425 3.02908Z"
                                        fill="#17171B" />
                                </svg>
                            </div>
                            <h3>준비 중인 정보입니다...(;-;)</h3>
                            <p>해당 건물은 작성 중이며 곧 업데이트 될 예정입니다.<br>
                                자세한 내용이 필요하시다면 <b>부동산</b> 또는 <b>일본공간</b>에 문의해주세요!</p>
                        </div>
                    `;
                }
            }
        }
    },


    /**
     * 초기 비용 렌더링
     * @param {Object} costs - 초기 비용 정보
     */
    renderInitialCosts(costs) {
        if (!costs) return;

        // 총 초기비용
        const totalElement = document.getElementById('totalInitialCost');
        if (totalElement) {
            totalElement.textContent = `¥${costs.total?.toLocaleString() || '0'}`;
        }

        // 비용 항목
        const costItemsContainer = document.getElementById('costItems');
        if (costItemsContainer) {
            costItemsContainer.innerHTML = '';

            const costItems = [
                { label: '광열비', value: costs.utilities || 0 },
                { label: '보증금', value: costs.deposit || 0, note: '(계약 시 1회)' },
                { label: '하우스 클리닝 비용', value: costs.cleaningFee || 0 },
                { label: '중개수수료', value: costs.brokerageFee || 0 }
            ];

            costItems.forEach(item => {
                const costItem = document.createElement('div');
                costItem.className = 'cost-item';
                costItem.innerHTML = `
                    <span class="cost-label">${item.label}${item.note ? ' ' + item.note : ''}</span>
                    <span class="cost-value">¥${item.value.toLocaleString()}</span>
                `;
                costItemsContainer.appendChild(costItem);
            });

            // 초기 예상 총액
            const estimatedTotal = document.querySelector('.estimated-total-value');
            if (estimatedTotal && costs.estimatedTotal) {
                estimatedTotal.textContent = `¥${costs.estimatedTotal.toLocaleString()}`;
            }
        }
    },

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 뒤로가기 버튼
        const backBtn = document.querySelector('.back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = '/map/';
                }
            });
        }

        // 더보기 메뉴 버튼 (향후 구현)
        const moreMenuBtn = document.querySelector('.more-menu-btn');
        if (moreMenuBtn) {
            moreMenuBtn.addEventListener('click', () => {
                // 메뉴 열기 (향후 구현)
                console.log('More menu clicked');
            });
        }

        // 예약하기 버튼 (향후 구현)
        const reserveBtn = document.querySelector('.unit-reserve-btn');
        if (reserveBtn) {
            reserveBtn.addEventListener('click', () => {
                // 예약 페이지로 이동 (향후 구현)
                console.log('Reserve clicked');
            });
        }

        // 할인 배너 버튼
        const discountBtn = document.querySelector('.discount-btn');
        if (discountBtn) {
            discountBtn.addEventListener('click', () => {
                // 예약 페이지로 이동 또는 스크롤 (향후 구현)
                const unitSection = document.querySelector('.unit-list-section');
                if (unitSection) {
                    unitSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    },

    /**
     * 에러 메시지 표시
     * @param {string} message - 에러 메시지
     */
    showError(message) {
        // 에러 메시지를 페이지에 표시
        const container = document.querySelector('.detail-container');
        if (container) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2 style="color: #FF4444; margin-bottom: 20px;">오류가 발생했습니다</h2>
                    <p style="color: #666; margin-bottom: 20px;">${message}</p>
                    <button onclick="window.history.back()" style="padding: 10px 20px; background: #17171B; color: white; border: none; cursor: pointer; border-radius: 4px;">
                        이전 페이지로 돌아가기
                    </button>
                </div>
            `;
        } else {
            alert(message);
        }
    },

    /**
     * 호실 갱신 로딩 오버레이 표시
     */
    showUnitRefreshLoading() {
        const overlay = document.getElementById('unitRefreshLoadingOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    },

    /**
     * 호실 갱신 로딩 오버레이 숨김
     */
    hideUnitRefreshLoading() {
        const overlay = document.getElementById('unitRefreshLoadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    },

    /**
     * 페이지 로드 완료 시 호실 자동 갱신
     * unitUpdateTime을 확인하여 30분 이상 차이나면 갱신, 그렇지 않으면 갱신하지 않음
     */
    async autoRefreshUnits() {
        try {
            // unitUpdateTime 확인 (초기 로드된 updatedAt)
            const initialUpdatedAt = this.propertyData?.property?.updatedAt;
            if (!initialUpdatedAt || initialUpdatedAt === ' - ') {
                console.warn('초기 업데이트 시간이 없어 자동 갱신을 건너뜁니다.');
                // 갱신 버튼 비활성화
                if (PropertyCarousel) {
                    PropertyCarousel.updateRefreshButtonState();
                }
                return;
            }

            // 현재 시간과 초기 업데이트 시간 비교
            const initialUpdateDate = new Date(initialUpdatedAt);
            const now = new Date();
            const diffMs = now - initialUpdateDate;
            const diffMinutes = diffMs / (1000 * 60);

            // 30분 미만이면 갱신하지 않음
            if (diffMinutes < 30) {
                // 갱신 버튼 비활성화
                if (PropertyCarousel) {
                    PropertyCarousel.setLastUpdatedAt(initialUpdatedAt);
                    PropertyCarousel.updateRefreshButtonState();
                }
                return;
            }

            // 30분 이상 차이나면 갱신 실행
            const urlParams = PropertyAPI.extractUrlParams();
            if (!urlParams) {
                console.warn('URL 파라미터를 찾을 수 없어 자동 갱신을 건너뜁니다.');
                return;
            }

            // 로딩바 표시
            this.showUnitRefreshLoading();

            // 최대 7초 타임아웃 설정
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('갱신 시간 초과')), 15000);
            });

            // refresh API 호출
            const refreshPromise = PropertyAPI.refreshProperty(urlParams.producer, urlParams.id);

            // 타임아웃과 API 호출 중 먼저 완료되는 것 사용
            const refreshData = await Promise.race([refreshPromise, timeoutPromise]);

            // 호실 목록 갱신
            if (PropertyCarousel && PropertyCarousel.units !== undefined) {
                PropertyCarousel.units = refreshData.units;
                PropertyCarousel.currentUnitPage = 0; // 자동 갱신 시 첫 페이지로 리셋
                PropertyCarousel.renderUnits();

                // 마지막 업데이트 시간 저장
                PropertyCarousel.setLastUpdatedAt(refreshData.updatedAt);

                // 갱신 버튼 상태 업데이트
                PropertyCarousel.updateRefreshButtonState();
            }

            // PropertyDetail 데이터도 업데이트
            if (this.propertyData) {
                this.propertyData.units = refreshData.units;
                this.propertyData.property.updatedAt = refreshData.updatedAt;
            }

            // 업데이트 시간 갱신
            DiscountTimer.setUpdatedAt(refreshData.updatedAt);

        } catch (error) {
            // 자동 갱신 실패는 조용히 처리 (사용자에게 알림하지 않음)
            // 실패 시에도 초기 시간으로 갱신 버튼 상태 설정
            console.warn('호실 자동 갱신에 실패했습니다:', error);
            if (PropertyCarousel && this.propertyData?.property?.updatedAt) {
                console.log('자동 갱신 실패, 기존 업데이트 시간으로 갱신 버튼 상태 설정:', this.propertyData.property.updatedAt);
                PropertyCarousel.setLastUpdatedAt(this.propertyData.property.updatedAt);
                PropertyCarousel.updateRefreshButtonState();
            }
        } finally {
            // 로딩바 숨김
            this.hideUnitRefreshLoading();
        }
    }
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', async () => {
    // 모바일 네비게이션 초기화가 완료될 때까지 약간의 지연
    setTimeout(async () => {
        await PropertyDetail.init();

        // 초기화 완료 후 호실 자동 갱신 (최대 15초)
        PropertyDetail.autoRefreshUnits();
        
        // 모바일 네비게이션 재초기화 (detail 페이지에서 햄버거 메뉴가 보이도록)
        if (typeof initMobileNav === 'function') {
            initMobileNav();
        }
    }, 100);
});

