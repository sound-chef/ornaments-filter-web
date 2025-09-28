/**
 * XML 데이터 파서 및 데이터 관리 클래스
 */
class DataParser {
    constructor() {
        this.ornamentsData = [];
        this.instruments = [];
        this.categories = [];
        this.isLoaded = false;
    }

    /**
     * XML 데이터를 로드하고 파싱
     */
    async loadData() {
        try {
            const response = await fetch('Resources/ornaments.xml');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            this.parseXMLData(xmlDoc);
            this.isLoaded = true;
            
            console.log('데이터 로드 완료:', {
                instruments: this.instruments.length,
                categories: this.categories.length,
                ornaments: this.ornamentsData.length
            });
            
            return true;
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            this.showError('데이터를 로드할 수 없습니다. XML 파일을 확인해주세요.');
            return false;
        }
    }

    /**
     * XML 데이터 파싱
     */
    parseXMLData(xmlDoc) {
        const instruments = xmlDoc.querySelectorAll('instrument');
        
        instruments.forEach(instrument => {
            const instrumentData = {
                id: instrument.getAttribute('id'),
                name: instrument.getAttribute('name'),
                korean: instrument.getAttribute('korean'),
                categories: []
            };

            const categories = instrument.querySelectorAll('category');
            categories.forEach(category => {
                const categoryData = {
                    id: category.getAttribute('id'),
                    name: category.getAttribute('name'),
                    korean: category.getAttribute('korean'),
                    ornaments: []
                };

                const ornaments = category.querySelectorAll('ornament');
                ornaments.forEach(ornament => {
                    const ornamentData = {
                        id: ornament.querySelector('id')?.textContent,
                        name: ornament.querySelector('name')?.textContent,
                        filename: ornament.querySelector('filename')?.textContent,
                        description: ornament.querySelector('description')?.textContent,
                        autoalign: ornament.querySelector('autoalign')?.textContent === 'true',
                        rightColumnOnly: ornament.querySelector('rightColumnOnly')?.textContent === 'true',
                        imagePath: ornament.querySelector('imagePath')?.textContent,
                        instrumentId: instrumentData.id,
                        instrumentName: instrumentData.korean,
                        categoryId: categoryData.id,
                        categoryName: categoryData.korean
                    };

                    categoryData.ornaments.push(ornamentData);
                    this.ornamentsData.push(ornamentData);
                });

                instrumentData.categories.push(categoryData);
            });

            this.instruments.push(instrumentData);
        });

        // 카테고리 추출
        this.extractCategories();
    }

    /**
     * 고유 카테고리 추출
     */
    extractCategories() {
        const categorySet = new Set();
        this.ornamentsData.forEach(ornament => {
            categorySet.add(ornament.categoryName);
        });
        this.categories = Array.from(categorySet);
    }

    /**
     * 모든 악상기호 데이터 반환
     */
    getAllOrnaments() {
        return this.ornamentsData;
    }

    /**
     * 악기별 데이터 반환
     */
    getOrnamentsByInstrument(instrumentName) {
        return this.ornamentsData.filter(ornament => 
            ornament.instrumentName === instrumentName
        );
    }

    /**
     * 카테고리별 데이터 반환
     */
    getOrnamentsByCategory(categoryName) {
        return this.ornamentsData.filter(ornament => 
            ornament.categoryName === categoryName
        );
    }

    /**
     * ID로 특정 악상기호 찾기
     */
    getOrnamentById(id) {
        return this.ornamentsData.find(ornament => ornament.id === id);
    }

    /**
     * 검색어로 악상기호 검색
     */
    searchOrnaments(query) {
        if (!query || query.trim() === '') {
            return this.ornamentsData;
        }

        const searchTerm = query.toLowerCase().trim();
        
        return this.ornamentsData.filter(ornament => {
            const name = ornament.name?.toLowerCase() || '';
            const description = ornament.description?.toLowerCase() || '';
            const instrumentName = ornament.instrumentName?.toLowerCase() || '';
            const categoryName = ornament.categoryName?.toLowerCase() || '';
            
            return name.includes(searchTerm) ||
                   description.includes(searchTerm) ||
                   instrumentName.includes(searchTerm) ||
                   categoryName.includes(searchTerm);
        });
    }

    /**
     * 필터 조건에 따른 데이터 필터링
     */
    filterOrnaments(filters) {
        let filteredData = [...this.ornamentsData];

        // 악기 필터
        if (filters.instruments && filters.instruments.length > 0) {
            filteredData = filteredData.filter(ornament => 
                filters.instruments.includes(ornament.instrumentName)
            );
        }

        // 카테고리 필터
        if (filters.categories && filters.categories.length > 0) {
            filteredData = filteredData.filter(ornament => 
                filters.categories.includes(ornament.categoryName)
            );
        }

        // 타입 필터 (앞꾸밈음/뒷꾸밈음)
        if (filters.types && filters.types.length > 0) {
            filteredData = filteredData.filter(ornament => {
                // 타입 분류 로직 (실제 데이터에 따라 조정 필요)
                const isFrontOrnament = ornament.name.includes('앞') || 
                                       ornament.description.includes('앞꾸밈');
                const isBackOrnament = ornament.name.includes('뒷') || 
                                      ornament.description.includes('뒷꾸밈');
                
                return filters.types.some(type => {
                    if (type === '앞꾸밈음') return isFrontOrnament;
                    if (type === '뒷꾸밈음') return isBackOrnament;
                    return true;
                });
            });
        }

        return filteredData;
    }

    /**
     * 악기 목록 반환
     */
    getInstruments() {
        return this.instruments.map(instrument => ({
            id: instrument.id,
            name: instrument.name,
            korean: instrument.korean
        }));
    }

    /**
     * 카테고리 목록 반환
     */
    getCategories() {
        return this.categories;
    }

    /**
     * 통계 정보 반환
     */
    getStatistics() {
        const stats = {
            totalOrnaments: this.ornamentsData.length,
            totalInstruments: this.instruments.length,
            totalCategories: this.categories.length,
            instruments: {}
        };

        this.instruments.forEach(instrument => {
            const count = this.ornamentsData.filter(ornament => 
                ornament.instrumentName === instrument.korean
            ).length;
            
            stats.instruments[instrument.korean] = count;
        });

        return stats;
    }

    /**
     * 에러 표시
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #dc3545;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 1001;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        `;
        errorDiv.textContent = message;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    /**
     * 데이터 로드 상태 확인
     */
    isDataLoaded() {
        return this.isLoaded;
    }
}

// 전역 인스턴스 생성
window.dataParser = new DataParser();
