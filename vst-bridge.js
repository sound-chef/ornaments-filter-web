/**
 * VST 플러그인과의 통신을 위한 브리지 클래스
 */
class VSTBridge {
    constructor() {
        this.isVSTEnvironment = this.detectVSTEnvironment();
        this.selectedOrnament = null;
        this.eventListeners = new Map();
        this.setupVSTCommunication();
    }

    /**
     * VST 환경 감지
     */
    detectVSTEnvironment() {
        // WebView 환경에서 실행 중인지 확인
        return window.navigator.userAgent.includes('WebView') || 
               window.navigator.userAgent.includes('JUCE') ||
               typeof window.vstAPI !== 'undefined';
    }

    /**
     * VST 통신 설정
     */
    setupVSTCommunication() {
        if (this.isVSTEnvironment) {
            console.log('VST 환경에서 실행 중입니다.');
            this.setupVSTAPI();
        } else {
            console.log('웹 브라우저 환경에서 실행 중입니다.');
            this.setupWebAPI();
        }
    }

    /**
     * VST API 설정
     */
    setupVSTAPI() {
        // VST에서 제공하는 API가 있는 경우
        if (typeof window.vstAPI !== 'undefined') {
            this.vstAPI = window.vstAPI;
        } else {
            // VST API 시뮬레이션 (개발용)
            this.vstAPI = {
                selectOrnament: (ornament) => this.simulateVSTSelection(ornament),
                getCurrentSelection: () => this.getCurrentSelection(),
                onOrnamentSelected: (callback) => this.onOrnamentSelected(callback),
                onFilterChanged: (callback) => this.onFilterChanged(callback)
            };
        }
    }

    /**
     * 웹 API 설정 (개발/테스트용)
     */
    setupWebAPI() {
        this.vstAPI = {
            selectOrnament: (ornament) => this.simulateVSTSelection(ornament),
            getCurrentSelection: () => this.getCurrentSelection(),
            onOrnamentSelected: (callback) => this.onOrnamentSelected(callback),
            onFilterChanged: (callback) => this.onFilterChanged(callback)
        };
    }

    /**
     * 악상기호 선택 처리
     */
    selectOrnament(ornament) {
        if (!ornament) {
            console.warn('선택할 악상기호가 없습니다.');
            return;
        }

        this.selectedOrnament = ornament;
        
        // VST API 호출
        if (this.vstAPI && this.vstAPI.selectOrnament) {
            try {
                this.vstAPI.selectOrnament(ornament);
                console.log('악상기호 선택됨:', ornament.name);
                
                // 이벤트 발생
                this.emit('ornamentSelected', ornament);
                
                // UI 업데이트
                this.updateSelectionUI(ornament);
                
            } catch (error) {
                console.error('VST 통신 오류:', error);
                this.showError('VST와의 통신에 실패했습니다.');
            }
        }
    }

    /**
     * 현재 선택된 악상기호 반환
     */
    getCurrentSelection() {
        return this.selectedOrnament;
    }

    /**
     * VST 선택 시뮬레이션 (개발용)
     */
    simulateVSTSelection(ornament) {
        console.log('VST 시뮬레이션 - 악상기호 선택:', {
            id: ornament.id,
            name: ornament.name,
            instrument: ornament.instrumentName,
            category: ornament.categoryName
        });
        
        // 실제 VST에서는 여기서 플러그인에 데이터를 전달
        return true;
    }

    /**
     * 선택 UI 업데이트
     */
    updateSelectionUI(ornament) {
        // 모든 결과 항목에서 선택 상태 제거
        document.querySelectorAll('.result-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 선택된 항목 강조
        const selectedItem = document.querySelector(`[data-ornament-id="${ornament.id}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
        
        // 선택된 악상기호 정보 표시
        this.showSelectedOrnamentInfo(ornament);
    }

    /**
     * 선택된 악상기호 정보 표시
     */
    showSelectedOrnamentInfo(ornament) {
        const infoContainer = document.querySelector('.name-content');
        if (infoContainer) {
            const icon = infoContainer.querySelector('.name-icon');
            const description = infoContainer.querySelector('.name-description');
            
            if (icon) {
                // 기존 텍스트 아이콘 제거
                icon.textContent = '';
                icon.innerHTML = '';
                
                // 악상기호 이미지 생성
                const img = document.createElement('img');
                img.src = this.getImagePath(ornament);
                img.alt = ornament.name;
                img.style.cssText = `
                    width: 64px;
                    height: 64px;
                    object-fit: contain;
                    background-color: transparent;
                    image-rendering: -webkit-optimize-contrast;
                    image-rendering: crisp-edges;
                `;
                
                // 이미지 로딩 성공 시
                img.onload = () => {
                    console.log('선택된 악상기호 이미지 로딩 성공:', img.src);
                };
                
                // 이미지 로딩 실패 시
                img.onerror = () => {
                    console.warn('선택된 악상기호 이미지 로딩 실패:', img.src);
                    // 실패 시 기본 아이콘 표시
                    icon.textContent = '🎵';
                    icon.style.cssText = `
                        width: 64px;
                        height: 64px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 32px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                        border: 1px solid #dee2e6;
                    `;
                };
                
                icon.appendChild(img);
            }
            
            if (description) {
                description.textContent = `${ornament.name} - ${ornament.description}`;
            }
        }
    }

    /**
     * 필터 변경 이벤트 처리
     */
    onFilterChanged(callback) {
        this.addEventListener('filterChanged', callback);
    }

    /**
     * 악상기호 선택 이벤트 처리
     */
    onOrnamentSelected(callback) {
        this.addEventListener('ornamentSelected', callback);
    }

    /**
     * 이벤트 리스너 추가
     */
    addEventListener(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    /**
     * 이벤트 발생
     */
    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`이벤트 콜백 오류 (${event}):`, error);
                }
            });
        }
    }

    /**
     * VST에서 필터 상태 동기화
     */
    syncFiltersFromVST(filters) {
        console.log('VST에서 필터 동기화:', filters);
        
        // 필터 UI 업데이트
        this.updateFilterUI(filters);
        
        // 이벤트 발생
        this.emit('filterChanged', filters);
    }

    /**
     * 필터 UI 업데이트
     */
    updateFilterUI(filters) {
        // 악기 필터 업데이트
        if (filters.instruments) {
            document.querySelectorAll('[data-filter="instruments"]').forEach(button => {
                const value = button.getAttribute('data-value');
                button.classList.toggle('active', filters.instruments.includes(value));
            });
        }
        
        // 카테고리 필터 업데이트
        if (filters.categories) {
            document.querySelectorAll('[data-filter="categories"]').forEach(button => {
                const value = button.getAttribute('data-value');
                button.classList.toggle('active', filters.categories.includes(value));
            });
        }
        
        // 타입 필터 업데이트
        if (filters.types) {
            document.querySelectorAll('[data-filter="type"]').forEach(button => {
                const value = button.getAttribute('data-value');
                button.classList.toggle('active', filters.types.includes(value));
            });
        }
    }

    /**
     * VST에서 검색어 동기화
     */
    syncSearchFromVST(searchTerm) {
        console.log('VST에서 검색어 동기화:', searchTerm);
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = searchTerm;
            // 검색 이벤트 발생
            searchInput.dispatchEvent(new Event('input'));
        }
    }

    /**
     * VST 상태 정보 반환
     */
    getVSTState() {
        return {
            isVSTEnvironment: this.isVSTEnvironment,
            selectedOrnament: this.selectedOrnament,
            hasVSTAPI: typeof this.vstAPI !== 'undefined'
        };
    }

    /**
     * 에러 표시
     */
    showError(message) {
        console.error('VST Bridge Error:', message);
        
        // 사용자에게 에러 표시
        const errorDiv = document.createElement('div');
        errorDiv.className = 'vst-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            background-color: #dc3545;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 1001;
            font-size: 14px;
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }

    /**
     * VST 통신 테스트
     */
    testVSTCommunication() {
        if (this.isVSTEnvironment) {
            console.log('VST 통신 테스트 시작...');
            
            const testOrnament = {
                id: 'test',
                name: '테스트 악상기호',
                description: 'VST 통신 테스트용',
                instrumentName: '테스트 악기',
                categoryName: '테스트 카테고리'
            };
            
            this.selectOrnament(testOrnament);
            
            return true;
        } else {
            console.log('VST 환경이 아닙니다. 통신 테스트를 건너뜁니다.');
            return false;
        }
    }

    /**
     * VST 설정 저장
     */
    saveVSTSettings(settings) {
        try {
            localStorage.setItem('vst_settings', JSON.stringify(settings));
            console.log('VST 설정 저장됨:', settings);
        } catch (error) {
            console.error('VST 설정 저장 실패:', error);
        }
    }

    /**
     * VST 설정 로드
     */
    loadVSTSettings() {
        try {
            const settings = localStorage.getItem('vst_settings');
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('VST 설정 로드 실패:', error);
            return {};
        }
    }

    /**
     * 이미지 경로 생성 (VST 브리지용)
     */
    getImagePath(ornament) {
        // XML의 imagePath가 절대 경로이므로 상대 경로로 변환
        if (ornament.imagePath) {
            // 절대 경로에서 상대 경로로 변환
            const relativePath = ornament.imagePath.replace(/^.*\/Resources\//, 'Resources/');
            console.log('VST 브리지 - XML 경로 변환:', ornament.imagePath, '->', relativePath);
            return relativePath;
        }
        
        // 기본 이미지 경로 생성
        const basePath = 'Resources/Ornaments';
        const instrumentPath = this.getInstrumentPath(ornament.instrumentName);
        const categoryPath = this.getCategoryPath(ornament.categoryName);
        const fullPath = `${basePath}/${instrumentPath}/${categoryPath}/${ornament.filename}`;
        
        console.log('VST 브리지 - 생성된 경로:', fullPath);
        return fullPath;
    }

    /**
     * 악기 경로 생성 (VST 브리지용)
     */
    getInstrumentPath(instrumentName) {
        const instrumentMap = {
            '장구': '1_장구',
            '가야금': '2_가야금', 
            '대금': '3_대금',
            '아쟁': '4_아쟁',
            '피리': '5_피리',
            '해금': '6_해금',
            '당피리,세피리': '5_피리'  // 당피리/세피리는 피리 폴더에 있음
        };
        
        const path = instrumentMap[instrumentName] || instrumentName;
        console.log('VST 브리지 - 악기 경로 매핑:', instrumentName, '->', path);
        return path;
    }

    /**
     * 카테고리 경로 생성 (VST 브리지용)
     */
    getCategoryPath(categoryName) {
        const categoryMap = {
            '주법_악상기호': '1_주법_악상기호',
            '빠르기(한배)_악상기호': '2_빠르기(한배)_악상기호',
            '장식음(꾸밈음)_악상기호': '2_장식음(꾸밈음)_악상기호',
            '부호_악상기호': '1_부호_악상기호',
            '빠르기(한배)_악상기호': '3_빠르기(한배)_악상기호',
            '주법_악상기호': '4_주법_악상기호',
            '음정(가락)_악상기호': '4_음정(가락)_악상기호',
            '장식(꾸밈음)_악상기호': '3_장식(꾸밈음)_악상기호',
            '당피리:세피리_악상기호': '5_당피리:세피리_악상기호'
        };
        
        const path = categoryMap[categoryName] || categoryName;
        console.log('VST 브리지 - 카테고리 경로 매핑:', categoryName, '->', path);
        return path;
    }
}

// 전역 인스턴스 생성
window.vstBridge = new VSTBridge();

// VST API를 전역으로 노출 (VST에서 사용할 수 있도록)
window.vstAPI = {
    selectOrnament: (ornament) => window.vstBridge.selectOrnament(ornament),
    getCurrentSelection: () => window.vstBridge.getCurrentSelection(),
    syncFilters: (filters) => window.vstBridge.syncFiltersFromVST(filters),
    syncSearch: (searchTerm) => window.vstBridge.syncSearchFromVST(searchTerm),
    getState: () => window.vstBridge.getVSTState(),
    test: () => window.vstBridge.testVSTCommunication()
};
