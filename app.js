/**
 * 메인 애플리케이션 클래스
 */
class OrnamentsApp {
    constructor() {
        this.currentResults = [];
        this.isInitialized = false;
        this.debounceTimer = null;
        
        this.init();
    }

    /**
     * 애플리케이션 초기화
     */
    async init() {
        console.log('악상기호 필터 애플리케이션 초기화 중...');
        
        try {
            // 로딩 오버레이 표시
            this.showLoading();
            
            // 데이터 로드
            const dataLoaded = await window.dataParser.loadData();
            if (!dataLoaded) {
                throw new Error('데이터 로드를 실패했습니다.');
            }
            
            // UI 초기화
            this.initializeUI();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 초기 데이터 표시
            this.displayResults(window.dataParser.getAllOrnaments());
            
            // 로딩 오버레이 숨김
            this.hideLoading();
            
            this.isInitialized = true;
            console.log('애플리케이션 초기화 완료');
            
        } catch (error) {
            console.error('초기화 실패:', error);
            this.hideLoading();
            this.showError('애플리케이션 초기화에 실패했습니다.');
        }
    }

    /**
     * UI 초기화
     */
    initializeUI() {
        // 탭 네비게이션 설정
        this.setupTabNavigation();
        
        // 필터 섹션 설정
        this.setupFilterSections();
        
        // 동적 필터 버튼 생성
        this.generateFilterButtons();
        
        // 검색 입력 설정
        this.setupSearchInput();
        
        // 결과 섹션 설정
        this.setupResultsSection();
    }

    /**
     * 탭 네비게이션 설정
     */
    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });
    }

    /**
     * 탭 전환
     */
    switchTab(tabName) {
        // 모든 탭 버튼에서 active 클래스 제거
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 선택된 탭에 active 클래스 추가
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }
        
        console.log('탭 전환:', tabName);
    }

    /**
     * 필터 섹션 설정
     */
    setupFilterSections() {
        // 필터 헤더 클릭 이벤트
        document.querySelectorAll('.filter-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const section = e.currentTarget.getAttribute('data-section');
                this.toggleFilterSection(section);
            });
        });
        
        // 필터 버튼 클릭 이벤트 (동적으로 생성된 버튼들)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-button')) {
                const filterType = e.target.getAttribute('data-filter');
                const filterValue = e.target.getAttribute('data-value');
                this.toggleFilter(filterType, filterValue);
            }
        });
    }

    /**
     * 동적 필터 버튼 생성
     */
    generateFilterButtons() {
        // 악기 필터 버튼 생성
        this.generateInstrumentFilters();
        
        // 카테고리 필터 버튼 생성
        this.generateCategoryFilters();
    }

    /**
     * 악기 필터 버튼 생성
     */
    generateInstrumentFilters() {
        const instrumentsFilter = document.getElementById('instrumentsFilter');
        if (!instrumentsFilter) return;

        // 기존 버튼들 제거
        instrumentsFilter.innerHTML = '';

        const instruments = window.dataParser.getInstruments();
        instruments.forEach(instrument => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.setAttribute('data-filter', 'instruments');
            button.setAttribute('data-value', instrument.korean);
            button.textContent = instrument.korean;
            instrumentsFilter.appendChild(button);
        });
    }

    /**
     * 카테고리 필터 버튼 생성
     */
    generateCategoryFilters() {
        const categoriesFilter = document.getElementById('categoriesFilter');
        if (!categoriesFilter) return;

        // 기존 버튼들 제거
        categoriesFilter.innerHTML = '';

        const categories = window.dataParser.getCategories();
        categories.forEach(category => {
            const button = document.createElement('button');
            button.className = 'filter-button';
            button.setAttribute('data-filter', 'categories');
            button.setAttribute('data-value', category);
            button.textContent = category;
            categoriesFilter.appendChild(button);
        });
    }

    /**
     * 필터 섹션 토글
     */
    toggleFilterSection(sectionName) {
        const header = document.querySelector(`[data-section="${sectionName}"]`);
        const content = document.getElementById(`${sectionName}Filter`);
        
        if (header && content) {
            const isCollapsed = header.classList.contains('collapsed');
            
            if (isCollapsed) {
                header.classList.remove('collapsed');
                content.classList.remove('collapsed');
            } else {
                header.classList.add('collapsed');
                content.classList.add('collapsed');
            }
        }
    }

    /**
     * 필터 토글
     */
    toggleFilter(filterType, filterValue) {
        console.log('필터 토글:', filterType, filterValue);
        
        const button = document.querySelector(`[data-filter="${filterType}"][data-value="${filterValue}"]`);
        if (!button) {
            console.error('필터 버튼을 찾을 수 없습니다:', filterType, filterValue);
            return;
        }
        
        const isActive = button.classList.contains('active');
        console.log('현재 상태:', isActive ? '활성' : '비활성');
        
        if (isActive) {
            button.classList.remove('active');
            console.log('필터 비활성화');
        } else {
            button.classList.add('active');
            console.log('필터 활성화');
        }
        
        // 필터 적용
        this.applyFilters();
    }

    /**
     * 검색 입력 설정
     */
    setupSearchInput() {
        const searchInput = document.getElementById('searchInput');
        
        if (searchInput) {
            // 실시간 검색 (디바운싱)
            searchInput.addEventListener('input', (e) => {
                clearTimeout(this.debounceTimer);
                this.debounceTimer = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });
            
            // 엔터 키 검색
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }
    }

    /**
     * 결과 섹션 설정
     */
    setupResultsSection() {
        const resultsHeader = document.querySelector('.results-header');
        if (resultsHeader) {
            resultsHeader.addEventListener('click', () => {
                this.toggleFilterSection('results');
            });
        }
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // VST 브리지 이벤트
        window.vstBridge.onOrnamentSelected((ornament) => {
            console.log('VST에서 악상기호 선택됨:', ornament);
        });
        
        window.vstBridge.onFilterChanged((filters) => {
            console.log('VST에서 필터 변경됨:', filters);
        });
        
        // 윈도우 리사이즈 이벤트
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    /**
     * 검색 수행
     */
    performSearch(query) {
        if (!this.isInitialized) return;
        
        console.log('검색 수행:', query);
        
        // 검색 히스토리에 추가
        if (query && query.trim() !== '') {
            window.searchEngine.addToSearchHistory(query);
        }
        
        // 현재 필터 상태 가져오기
        const filters = this.getCurrentFilters();
        
        // 검색 수행
        const results = window.searchEngine.performSearch(query, filters);
        
        // 결과 표시
        this.displayResults(results);
        
        // VST에 검색어 동기화
        if (window.vstBridge.isVSTEnvironment) {
            window.vstBridge.syncSearchFromVST(query);
        }
    }

    /**
     * 현재 필터 상태 가져오기
     */
    getCurrentFilters() {
        const filters = {
            instruments: [],
            categories: [],
            types: []
        };
        
        // 활성화된 필터 버튼들 찾기
        const activeButtons = document.querySelectorAll('.filter-button.active');
        console.log('활성화된 필터 버튼 개수:', activeButtons.length);
        
        activeButtons.forEach(button => {
            const filterType = button.getAttribute('data-filter');
            const filterValue = button.getAttribute('data-value');
            
            console.log('필터 버튼:', filterType, filterValue);
            
            if (filterType === 'instruments') {
                filters.instruments.push(filterValue);
            } else if (filterType === 'categories') {
                filters.categories.push(filterValue);
            } else if (filterType === 'type') {
                filters.types.push(filterValue);
            }
        });
        
        console.log('현재 필터 상태:', filters);
        return filters;
    }

    /**
     * 필터 적용
     */
    applyFilters() {
        const filters = this.getCurrentFilters();
        const searchQuery = document.getElementById('searchInput').value;
        
        console.log('필터 적용:', filters);
        console.log('검색어:', searchQuery);
        
        // 검색 수행
        const results = window.searchEngine.performSearch(searchQuery, filters);
        
        console.log('필터링된 결과 개수:', results.length);
        
        // 결과 표시
        this.displayResults(results);
        
        // VST에 필터 동기화
        if (window.vstBridge.isVSTEnvironment) {
            window.vstBridge.syncFiltersFromVST(filters);
        }
    }

    /**
     * 결과 표시
     */
    displayResults(results) {
        this.currentResults = results;
        
        const resultsContainer = document.getElementById('resultsContainer');
        const resultCount = document.getElementById('resultCount');
        
        if (!resultsContainer) return;
        
        // 결과 개수 업데이트
        if (resultCount) {
            resultCount.textContent = results.length;
        }
        
        // 결과가 없는 경우
        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-results">
                    <div class="icon">🔍</div>
                    <p>검색 결과가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        // 결과 그리드 생성
        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';
        
        results.forEach(ornament => {
            const resultItem = this.createResultItem(ornament);
            resultsGrid.appendChild(resultItem);
        });
        
        // 기존 결과 제거 후 새 결과 추가
        resultsContainer.innerHTML = '';
        resultsContainer.appendChild(resultsGrid);
    }

    /**
     * 결과 아이템 생성
     */
    createResultItem(ornament) {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.setAttribute('data-ornament-id', ornament.id);
        
        // 이미지 (있는 경우)
        const img = document.createElement('img');
        const imagePath = this.getImagePath(ornament);
        img.src = imagePath;
        img.alt = ornament.name;
        
        // 이미지 로딩 성공 시
        img.onload = () => {
            console.log('이미지 로딩 성공:', imagePath);
        };
        
        // 이미지 로딩 실패 시
        img.onerror = () => {
            console.warn('이미지 로딩 실패:', imagePath);
            // 이미지 로딩 실패 시 기본 아이콘 표시
            img.style.display = 'none';
            const fallbackIcon = document.createElement('div');
            fallbackIcon.className = 'fallback-icon';
            fallbackIcon.textContent = '🎵';
            fallbackIcon.style.cssText = `
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                background-color: #f8f9fa;
                border-radius: 4px;
            `;
            item.insertBefore(fallbackIcon, name);
        };
        
        // 이름
        const name = document.createElement('div');
        name.className = 'name';
        name.textContent = ornament.name;
        
        // 클릭 이벤트
        item.addEventListener('click', () => {
            this.selectOrnament(ornament);
        });
        
        item.appendChild(img);
        item.appendChild(name);
        
        return item;
    }

    /**
     * 이미지 경로 생성
     */
    getImagePath(ornament) {
        // XML의 imagePath가 절대 경로이므로 상대 경로로 변환
        if (ornament.imagePath) {
            // 절대 경로에서 상대 경로로 변환
            const relativePath = ornament.imagePath.replace(/^.*\/Resources\//, 'Resources/');
            console.log('XML 경로 변환:', ornament.imagePath, '->', relativePath);
            return relativePath;
        }
        
        // 기본 이미지 경로 생성
        const basePath = 'Resources/Ornaments';
        const instrumentPath = this.getInstrumentPath(ornament.instrumentName);
        const categoryPath = this.getCategoryPath(ornament.categoryName);
        const fullPath = `${basePath}/${instrumentPath}/${categoryPath}/${ornament.filename}`;
        
        console.log('생성된 경로:', fullPath);
        return fullPath;
    }

    /**
     * 악기 경로 생성
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
        console.log('악기 경로 매핑:', instrumentName, '->', path);
        return path;
    }

    /**
     * 카테고리 경로 생성
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
        console.log('카테고리 경로 매핑:', categoryName, '->', path);
        return path;
    }

    /**
     * 악상기호 선택
     */
    selectOrnament(ornament) {
        console.log('악상기호 선택:', ornament);
        
        // VST 브리지를 통해 선택
        window.vstBridge.selectOrnament(ornament);
        
        // 선택된 항목 강조
        this.highlightSelectedItem(ornament.id);
    }

    /**
     * 선택된 항목 강조
     */
    highlightSelectedItem(ornamentId) {
        // 모든 결과 항목에서 선택 상태 제거
        document.querySelectorAll('.result-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 선택된 항목 강조
        const selectedItem = document.querySelector(`[data-ornament-id="${ornamentId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }

    /**
     * 윈도우 리사이즈 처리
     */
    handleResize() {
        // 반응형 레이아웃 조정
        const container = document.querySelector('.app-container');
        if (container) {
            const width = window.innerWidth;
            if (width < 768) {
                container.classList.add('mobile');
            } else {
                container.classList.remove('mobile');
            }
        }
    }

    /**
     * 로딩 표시
     */
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * 로딩 숨김
     */
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * 에러 표시
     */
    showError(message) {
        console.error('애플리케이션 오류:', message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'app-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #dc3545;
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 1002;
            text-align: center;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h3>오류</h3>
            <p>${message}</p>
            <button onclick="this.parentNode.remove()" style="
                background: white;
                color: #dc3545;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 10px;
            ">확인</button>
        `;
        
        document.body.appendChild(errorDiv);
    }

    /**
     * 애플리케이션 상태 반환
     */
    getAppState() {
        return {
            isInitialized: this.isInitialized,
            currentResults: this.currentResults.length,
            selectedOrnament: window.vstBridge.getCurrentSelection(),
            vstState: window.vstBridge.getVSTState()
        };
    }
}

// DOM 로드 완료 후 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 로드 완료, 애플리케이션 시작');
    window.ornamentsApp = new OrnamentsApp();
});

// 전역 함수들 (VST에서 호출 가능)
window.ornamentsAPI = {
    getAppState: () => window.ornamentsApp?.getAppState(),
    selectOrnament: (ornament) => window.ornamentsApp?.selectOrnament(ornament),
    performSearch: (query) => window.ornamentsApp?.performSearch(query),
    applyFilters: (filters) => window.ornamentsApp?.applyFilters()
};
