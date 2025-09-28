/**
 * 검색 엔진 및 퍼지 검색 구현
 */
class SearchEngine {
    constructor() {
        this.searchHistory = this.loadSearchHistory();
        this.currentFilters = {
            instruments: [],
            categories: [],
            types: []
        };
    }

    /**
     * 퍼지 검색 구현 (Levenshtein 거리 기반)
     */
    fuzzySearch(query, data, threshold = 0.6) {
        if (!query || query.trim() === '') {
            return data;
        }

        const searchTerm = query.toLowerCase().trim();
        const results = [];

        data.forEach(item => {
            const searchFields = [
                item.name,
                item.description,
                item.instrumentName,
                item.categoryName
            ].filter(field => field).map(field => field.toLowerCase());

            let bestScore = 0;
            
            searchFields.forEach(field => {
                // 정확한 매칭 우선
                if (field.includes(searchTerm)) {
                    bestScore = Math.max(bestScore, 1.0);
                }
                
                // 부분 매칭 점수 계산
                const partialScore = this.calculateSimilarity(searchTerm, field);
                bestScore = Math.max(bestScore, partialScore);
            });

            if (bestScore >= threshold) {
                results.push({
                    ...item,
                    relevanceScore: bestScore
                });
            }
        });

        // 관련도 순으로 정렬
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /**
     * 한글 정규화 (초성, 중성, 종성 분리)
     */
    normalizeKorean(text) {
        if (!text) return '';
        
        return text
            .replace(/\s+/g, '') // 공백 제거
            .toLowerCase();
    }

    /**
     * Levenshtein 거리 기반 유사도 계산
     */
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;

        const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

        for (let i = 0; i <= len1; i++) {
            matrix[0][i] = i;
        }

        for (let j = 0; j <= len2; j++) {
            matrix[j][0] = j;
        }

        for (let j = 1; j <= len2; j++) {
            for (let i = 1; i <= len1; i++) {
                const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,      // deletion
                    matrix[j - 1][i] + 1,      // insertion
                    matrix[j - 1][i - 1] + cost // substitution
                );
            }
        }

        const distance = matrix[len2][len1];
        const maxLen = Math.max(len1, len2);
        
        return maxLen === 0 ? 1 : (maxLen - distance) / maxLen;
    }

    /**
     * 부분 일치 검색
     */
    partialSearch(query, data) {
        if (!query || query.trim() === '') {
            return data;
        }

        const searchTerm = query.toLowerCase().trim();
        
        return data.filter(item => {
            const searchFields = [
                item.name,
                item.description,
                item.instrumentName,
                item.categoryName
            ].filter(field => field).map(field => field.toLowerCase());

            return searchFields.some(field => {
                return field.includes(searchTerm);
            });
        });
    }

    /**
     * 검색어 하이라이트
     */
    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || !text) return text;
        
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    /**
     * 정규식 특수문자 이스케이프
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * 검색 히스토리 관리
     */
    addToSearchHistory(query) {
        if (!query || query.trim() === '') return;
        
        const trimmedQuery = query.trim();
        
        // 중복 제거
        this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);
        
        // 맨 앞에 추가
        this.searchHistory.unshift(trimmedQuery);
        
        // 최대 10개까지만 저장
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }
        
        this.saveSearchHistory();
    }

    /**
     * 검색 히스토리 로드
     */
    loadSearchHistory() {
        try {
            const history = localStorage.getItem('ornaments_search_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('검색 히스토리 로드 실패:', error);
            return [];
        }
    }

    /**
     * 검색 히스토리 저장
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('ornaments_search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('검색 히스토리 저장 실패:', error);
        }
    }

    /**
     * 검색 히스토리 반환
     */
    getSearchHistory() {
        return [...this.searchHistory];
    }

    /**
     * 검색 히스토리 초기화
     */
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    /**
     * 필터 설정
     */
    setFilters(filters) {
        this.currentFilters = { ...filters };
    }

    /**
     * 현재 필터 반환
     */
    getCurrentFilters() {
        return { ...this.currentFilters };
    }

    /**
     * 필터 초기화
     */
    clearFilters() {
        this.currentFilters = {
            instruments: [],
            categories: [],
            types: []
        };
    }

    /**
     * 통합 검색 (검색어 + 필터)
     */
    performSearch(query, filters = null) {
        console.log('SearchEngine.performSearch 호출:', { query, filters });
        
        let results = window.dataParser.getAllOrnaments();
        console.log('전체 데이터 개수:', results.length);
        
        // 필터 적용
        const activeFilters = filters || this.currentFilters;
        if (activeFilters) {
            console.log('필터 적용 전:', results.length);
            results = window.dataParser.filterOrnaments(activeFilters);
            console.log('필터 적용 후:', results.length);
        }
        
        // 검색어 적용
        if (query && query.trim() !== '') {
            console.log('검색어 적용 전:', results.length);
            results = this.fuzzySearch(query, results);
            console.log('검색어 적용 후:', results.length);
        }
        
        console.log('최종 결과 개수:', results.length);
        return results;
    }

    /**
     * 자동완성 제안
     */
    getSuggestions(query, maxSuggestions = 5) {
        if (!query || query.trim() === '') {
            return this.getSearchHistory().slice(0, maxSuggestions);
        }

        const searchTerm = query.toLowerCase().trim();
        const suggestions = new Set();
        
        // 검색 히스토리에서 매칭
        this.searchHistory.forEach(historyItem => {
            if (historyItem.toLowerCase().includes(searchTerm)) {
                suggestions.add(historyItem);
            }
        });
        
        // 데이터에서 매칭되는 이름들
        const allOrnaments = window.dataParser.getAllOrnaments();
        allOrnaments.forEach(ornament => {
            if (ornament.name && ornament.name.toLowerCase().includes(searchTerm)) {
                suggestions.add(ornament.name);
            }
        });
        
        return Array.from(suggestions).slice(0, maxSuggestions);
    }

    /**
     * 검색 결과 통계
     */
    getSearchStats(results) {
        const stats = {
            total: results.length,
            byInstrument: {},
            byCategory: {}
        };
        
        results.forEach(ornament => {
            // 악기별 통계
            const instrument = ornament.instrumentName;
            stats.byInstrument[instrument] = (stats.byInstrument[instrument] || 0) + 1;
            
            // 카테고리별 통계
            const category = ornament.categoryName;
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        });
        
        return stats;
    }

    /**
     * 고급 검색 옵션
     */
    advancedSearch(options) {
        let results = window.dataParser.getAllOrnaments();
        
        // 정확한 매칭
        if (options.exactMatch) {
            results = results.filter(ornament => 
                ornament.name === options.query ||
                ornament.description === options.query
            );
        }
        
        // 대소문자 구분
        if (options.caseSensitive) {
            const query = options.query;
            results = results.filter(ornament => 
                ornament.name.includes(query) ||
                ornament.description.includes(query)
            );
        }
        
        // 정규식 검색
        if (options.useRegex) {
            try {
                const regex = new RegExp(options.query, options.caseSensitive ? 'g' : 'gi');
                results = results.filter(ornament => 
                    regex.test(ornament.name) ||
                    regex.test(ornament.description)
                );
            } catch (error) {
                console.error('정규식 검색 오류:', error);
            }
        }
        
        return results;
    }
}

// 전역 인스턴스 생성
window.searchEngine = new SearchEngine();
