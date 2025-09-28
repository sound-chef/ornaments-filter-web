/**
 * 메인 애플리케이션 클래스
 */
class OrnamentsApp {
    constructor() {
        this.currentResults = [];
        this.selectedOrnament = null;
        this.isInitialized = false;
        this.debounceTimer = null;
        
        // 카테고리-악기 호환성 매핑
        this.categoryInstrumentCompatibility = {
            '빠르기(한배)': ['가야금', '대금', '아쟁', '피리', '해금'], // 장구 제외
            '구음': ['장구'],
            '주법': ['가야금', '대금', '아쟁', '피리', '해금'],
            '부호': ['대금'],
            '장식음(꾸밈음)': ['대금'],
            '장식(꾸밈음)': ['피리'],
            '음정(가락)': ['피리'],
            '당피리:세피리': ['피리']
        };
        
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
            
            // 초기 UI 섹션 설정 (검색어가 없는 상태)
            this.toggleUISections('');
            
            // 초기 Name 섹션 설정 (선택된 항목이 없는 상태)
            this.updateNameSection();
            
            // 초기 악기 버튼 상태 설정
            this.updateInstrumentButtonStates();
            
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
                // 비활성화된 버튼은 클릭 무시
                if (e.target.disabled || e.target.classList.contains('disabled')) {
                    return;
                }
                
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
            button.textContent = instrument.korean; // 악기명은 그대로 사용
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
            // 카테고리명에서 "_악상기호" 제거하여 표시
            button.textContent = window.dataParser.cleanFilterName(category);
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
        
        // UI 섹션 가시성 제어
        this.toggleUISections(query);
        
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
     * Name 섹션 업데이트
     */
    updateNameSection() {
        const nameIcon = document.getElementById('nameIcon');
        const nameIconFallback = document.getElementById('nameIconFallback');
        const nameDescription = document.querySelector('.name-description');
        
        if (!nameIcon || !nameIconFallback || !nameDescription) return;
        
        if (this.selectedOrnament) {
            // 선택된 항목이 있을 때 - 이미지 표시
            const imagePath = this.getImagePath(this.selectedOrnament);
            
            // 이미지 로딩 시도
            nameIcon.src = imagePath;
            nameIcon.alt = this.selectedOrnament.name;
            
            // 이미지 로딩 성공 시
            nameIcon.onload = () => {
                nameIcon.style.display = 'block';
                nameIconFallback.style.display = 'none';
            };
            
            // 이미지 로딩 실패 시
            nameIcon.onerror = () => {
                nameIcon.style.display = 'none';
                nameIconFallback.style.display = 'flex';
                nameIconFallback.textContent = '🎵';
            };
            
            nameDescription.textContent = this.selectedOrnament.name;
        } else {
            // 선택된 항목이 없을 때 - 아이콘 숨김
            nameIcon.style.display = 'none';
            nameIconFallback.style.display = 'none';
            nameDescription.textContent = '선택된 악상기호가 없습니다.';
        }
    }

    /**
     * UI 섹션 가시성 제어
     */
    toggleUISections(query) {
        const hasSearchQuery = query && query.trim() !== '';
        
        // Name 섹션 - 항상 표시
        const nameSection = document.querySelector('.name-section');
        if (nameSection) {
            nameSection.style.display = 'block';
        }
        
        // Results 섹션 - 항상 표시
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
        
        // Categories 필터 - 검색어가 없을 때만 표시
        const categoriesSection = document.querySelector('[data-section="categories"]').closest('.filter-section');
        if (categoriesSection) {
            categoriesSection.style.display = hasSearchQuery ? 'none' : 'block';
        }
        
        // Instruments 필터 - 검색어가 없을 때만 표시
        const instrumentsSection = document.querySelector('[data-section="instruments"]').closest('.filter-section');
        if (instrumentsSection) {
            instrumentsSection.style.display = hasSearchQuery ? 'none' : 'block';
        }
        
        // Type 필터 - 검색어가 없을 때만 표시
        const typeSection = document.querySelector('[data-section="type"]').closest('.filter-section');
        if (typeSection) {
            typeSection.style.display = hasSearchQuery ? 'none' : 'block';
        }
        
        console.log('UI 섹션 가시성 제어:', hasSearchQuery ? '검색 모드' : '필터 모드');
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
     * 악기 버튼 활성화/비활성화 제어
     */
    updateInstrumentButtonStates() {
        const activeCategories = this.getActiveCategories();
        const instrumentButtons = document.querySelectorAll('[data-filter="instruments"]');
        
        instrumentButtons.forEach(button => {
            const instrumentName = button.getAttribute('data-value');
            let shouldDisable = false;
            
            // 활성화된 카테고리가 있고, 해당 카테고리와 호환되지 않는 악기인 경우
            if (activeCategories.length > 0) {
                shouldDisable = !this.isInstrumentCompatibleWithCategories(instrumentName, activeCategories);
            }
            
            if (shouldDisable) {
                button.disabled = true;
                button.classList.add('disabled');
                button.style.opacity = '0.5';
                button.style.cursor = 'not-allowed';
            } else {
                button.disabled = false;
                button.classList.remove('disabled');
                button.style.opacity = '1';
                button.style.cursor = 'pointer';
            }
        });
    }

    /**
     * 활성화된 카테고리 목록 가져오기
     */
    getActiveCategories() {
        const activeCategoryButtons = document.querySelectorAll('[data-filter="categories"].active');
        return Array.from(activeCategoryButtons).map(button => button.getAttribute('data-value'));
    }

    /**
     * 악기가 선택된 카테고리들과 호환되는지 확인
     */
    isInstrumentCompatibleWithCategories(instrumentName, categories) {
        return categories.some(category => {
            const compatibleInstruments = this.categoryInstrumentCompatibility[category];
            return compatibleInstruments && compatibleInstruments.includes(instrumentName);
        });
    }

    /**
     * 필터 적용
     */
    applyFilters() {
        const filters = this.getCurrentFilters();
        const searchQuery = document.getElementById('searchInput').value;
        
        console.log('필터 적용:', filters);
        console.log('검색어:', searchQuery);
        
        // 악기 버튼 상태 업데이트
        this.updateInstrumentButtonStates();
        
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
            // 결과가 없으면 선택된 항목도 없음
            this.selectedOrnament = null;
            this.updateNameSection();
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
        
        // Name 섹션 업데이트
        this.updateNameSection();
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
            let relativePath = ornament.imagePath.replace(/^.*\/Resources\//, 'Resources/');
            
            // GitHub Pages 호환성을 위해 추가 처리
            relativePath = this.normalizePathForEnvironment(relativePath);
            
            console.log('XML 경로 변환:', ornament.imagePath, '->', relativePath);
            return relativePath;
        }
        
        // 기본 이미지 경로 생성
        const basePath = 'Resources/Ornaments';
        const instrumentPath = this.getInstrumentPath(ornament.instrumentName);
        const categoryPath = this.getCategoryPath(ornament.categoryName, ornament.instrumentName);
        let fullPath = `${basePath}/${instrumentPath}/${categoryPath}/${ornament.filename}`;
        
        // 환경에 맞는 경로 정규화
        fullPath = this.normalizePathForEnvironment(fullPath);
        
        console.log('생성된 경로:', fullPath);
        return fullPath;
    }

    /**
     * 환경에 맞는 경로 정규화
     */
    normalizePathForEnvironment(path) {
        const currentPath = window.location.pathname;
        const hostname = window.location.hostname;
        
        // GitHub Pages 환경 감지
        const isGitHubPages = hostname.includes('github.io') || 
                             currentPath.includes('/ornaments-filter-web/') || 
                             currentPath.includes('/ornaments-filter-web');
        
        if (isGitHubPages) {
            // GitHub Pages에서는 repository name을 base path로 사용
            const basePath = '/ornaments-filter-web/';
            
            // 이미 base path가 포함되어 있지 않은 경우에만 추가
            if (!path.startsWith(basePath) && !path.startsWith('/ornaments-filter-web')) {
                return basePath + path;
            }
        }
        
        // 로컬 개발 환경에서는 상대 경로 그대로 사용
        return path;
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
    getCategoryPath(categoryName, instrumentName) {
        // XML 카테고리명에서 접미사 제거
        const cleaned = (categoryName || '')
            .replace(/_악상기호/g, '')
            .trim();

        // 악기별 실제 폴더 매핑
        const perInstrumentCategoryMap = {
            '장구': {
                '구음': '1_구음',
                '악상기호': '1_구음'
            },
            '가야금': {
                '주법': '1_주법',
                '빠르기(한배)': '2_빠르기(한배)'
            },
            '대금': {
                '부호': '1_부호',
                '장식음(꾸밈음)': '2_장식음(꾸밈음)',
                '빠르기(한배)': '3_빠르기(한배)',
                '주법': '4_주법'
            },
            '아쟁': {
                '주법': '1_주법',
                '빠르기(한배)': '2_빠르기(한배)'
            },
            '피리': {
                '주법': '1_주법',
                '빠르기(한배)': '2_빠르기(한배)',
                '장식(꾸밈음)': '3_장식(꾸밈음)',
                '음정(가락)': '4_음정(가락)',
                '당피리:세피리': '5_당피리:세피리'
            },
            '해금': {
                '주법': '1_주법',
                '빠르기(한배)': '2_빠르기(한배)'
            }
        };

        const mapForInstrument = perInstrumentCategoryMap[instrumentName] || {};
        const resolved = mapForInstrument[cleaned] || cleaned;
        console.log('카테고리 경로 매핑:', instrumentName, categoryName, '->', resolved);
        return resolved;
    }

    /**
     * 악상기호 선택
     */
    selectOrnament(ornament) {
        console.log('악상기호 선택:', ornament);
        
        // 선택된 항목 저장
        this.selectedOrnament = ornament;
        
        // VST 브리지를 통해 선택
        window.vstBridge.selectOrnament(ornament);
        
        // 선택된 항목 강조
        this.highlightSelectedItem(ornament.id);
        
        // Name 섹션 업데이트
        this.updateNameSection();
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