class UIRenderer {
    static setSidebarMessage(message) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        const locationList = document.getElementById('locationList');
        
        if (locationList) {
            locationList.innerHTML = '';
        }
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
            loadingIndicator.textContent = message;
        }
    }

    static clearSidebarMessage() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
            loadingIndicator.textContent = '';
        }
    }

    static updateMapStatus(message) {
        const statusElement = document.getElementById('mapStatus');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    static renderDetailItems(item) {
        const locationList = document.getElementById('locationList');
        if (!locationList) return;
        
        UIRenderer.clearSidebarMessage();
        locationList.innerHTML = '';

        const linkUrl = `${Constants.DETAIL_ROUTE_PREFIX}/${item.buildingId}`;
        const card = document.createElement('a');
        card.className = 'sidebar-card';
        card.href = linkUrl;
        card.dataset.id = item.buildingId || '';
        card.innerHTML = `
            <div class="item-img" style="background-image:url('${item.photo || ''}')" aria-label="${item.buildingName || ''}"></div>
            <div class="item-des">
                <h3>${item.buildingName || '제목 없음'}</h3>
                <p>월세: ${Utils.formatCurrency(Number(item.rentFee))}</p>
                <p>관리비: ${Utils.formatCurrency(Number(item.manageFee))}</p>
            </div>
        `;
        locationList.appendChild(card);
    }

    static renderStatusTag(status) {
        if (!status) return '<span class="status-tag" data-status="unknown">상태 미정</span>';
        return `<span class="status-tag" data-status="${status}">${status}</span>`;
    }

    static renderAmenityIcons(item) {
        return [
            item.freeInternet ? `<span class="icon" title="무료 인터넷">${UIRenderer.ICONS.internet}</span>` : '',
            item.morePeople ? `<span class="icon" title="다인 입주 가능">${UIRenderer.ICONS.group}</span>` : '',
            item.petsAllowed ? `<span class="icon" title="반려동물 가능">${UIRenderer.ICONS.pet}</span>` : ''
        ].join('');
    }

    static ICONS = {
        internet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M480-120q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM254-346l-84-86q59-59 138.5-93.5T480-560q92 0 171.5 35T790-430l-84 84q-44-44-102-69t-124-25q-66 0-124 25t-102 69ZM84-516 0-600q92-94 215-147t265-53q142 0 265 53t215 147l-84 84q-77-77-178.5-120.5T480-680q-116 0-217.5 43.5T84-516Z"/></svg>`,
        group: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M500-482q29-32 44.5-73t15.5-85q0-44-15.5-85T500-798q60 8 100 53t40 105q0 60-40 105t-100 53Zm220 322v-120q0-36-16-68.5T662-406q51 18 94.5 46.5T800-280v120h-80Zm80-280v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Zm-480-40q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM0-160v-112q0-34 17.5-62.5T64-378q62-31 126-46.5T320-440q66 0 130 15.5T576-378q29 15 46.5 43.5T640-272v112H0Zm320-400q33 0 56.5-23.5T400-640q0-33-23.5-56.5T320-720q-33 0-56.5 23.5T240-640q0 33 23.5 56.5T320-560ZM80-240h480v-32q0-11-5.5-20T540-306q-54-27-109-40.5T320-360q-56 0-111 13.5T100-306q-9 5-14.5 14T80-272v32Zm240-400Zm0 400Z"/></svg>`,
        pet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="16" height="16" fill="currentColor"><path d="M180-475q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Zm180-160q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Zm240 0q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Zm180 160q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM266-75q-45 0-75.5-34.5T160-191q0-52 35.5-91t70.5-77q29-31 50-67.5t50-68.5q22-26 51-43t63-17q34 0 63 16t51 42q28 32 49.5 69t50.5 69q35 38 70.5 77t35.5 91q0 47-30.5 81.5T694-75q-54 0-107-9t-107-9q-54 0-107 9t-107 9Z"/></svg>`
    };
}

