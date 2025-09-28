/**
 * 검색 엔진 및 퍼지 검색 (Korean-aware patched version)
 * - 개선 사항
 *   1) 진짜 한글 정규화: NFKD 분해 + 불필요 문자 제거
 *   2) 초성(choseong) 인덱싱 & 초성 질의 지원
 *   3) Partial Ratio(슬라이딩 윈도우) 도입으로 긴 본문 대비 짧은 질의 개선
 *   4) 필드 가중치 & 동적 임계값(threshold) 적용
 *   5) 안전한 정규식 이스케이프 유지
 *
 * 사용 방법
 * - calculateSimilarity(레벤슈타인) 구현은 기존 것을 그대로 사용합니다.
 */
class SearchEngine {
    constructor() {
        this.searchHistory = this.loadSearchHistory();
        this.currentFilters = {
            instruments: [],
            categories: [],
            types: []
        };
        // 간단 LRU 캐시 (최근 200개까지)
        this._scoreCache = new Map();
        this._scoreCacheMax = 200;
    }

    /* =========================
     * ① 한글 정규화 & 초성 유틸
     * ========================= */

    normalizeKorean(text) {
        if (!text) return '';
        return text
            .toLowerCase()
            .replace(/\s+/g, '')
            .normalize('NFKD')                 // 분해 정규화
            .replace(/[\u0300-\u036f]/g, '')   // 결합 분음 부호 제거(라틴 악센트 등)
            .replace(/[^\p{L}\p{N}ㄱ-ㅎㅏ-ㅣ가-힣]/gu, ''); // 문자/숫자/한글만
    }

    // 초성 테이블
    static CHO = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];

    toChoseong(str) {
        if (!str) return '';
        let out = '';
        for (const ch of str) {
            const code = ch.charCodeAt(0);
            // 한글 완성형 범위
            if (code >= 0xAC00 && code <= 0xD7A3) {
                const syllableIndex = code - 0xAC00;
                const choIndex = Math.floor(syllableIndex / (21 * 28));
                out += SearchEngine.CHO[choIndex];
            } else if (/[ㄱ-ㅎ]/.test(ch)) {
                // 이미 초성 문자
                out += ch;
            }
        }
        return out;
    }

    isChoseongQuery(q) {
        return /^[ㄱ-ㅎ]+$/.test(q);
    }

    /* =========================
     * ② Partial Ratio (슬라이딩 윈도우)
     * ========================= */
    partialRatio(needle, haystack) {
        const n = needle.length;
        const m = haystack.length;
        if (n === 0) return 1;
        if (m === 0 || m < n) return 0;

        let best = 0;
        // 간단 캐시 키
        const key = `PR|${needle}|${haystack}`;
        const cached = this._scoreCache.get(key);
        if (cached !== undefined) return cached;

        for (let i = 0; i <= m - n; i++) {
            const window = haystack.slice(i, i + n);
            const s = this.calculateSimilarity(needle, window); // 기존 레벤슈타인 기반 유사도
            if (s > best) best = s;
            if (best === 1) break;
        }

        // LRU 캐시 유지
        if (!this._scoreCache.has(key)) {
            this._scoreCache.set(key, best);
            if (this._scoreCache.size > this._scoreCacheMax) {
                const firstKey = this._scoreCache.keys().next().value;
                this._scoreCache.delete(firstKey);
            }
        }
        return best;
    }

    /* =========================
     * ③ 필드별 점수 산출 (가중합)
     * ========================= */
    computeFieldScore(queryNorm, fieldRaw) {
        if (!fieldRaw) return 0;

        const fieldNorm = this.normalizeKorean(fieldRaw);

        // 정확한 부분 포함은 1.0
        if (fieldNorm.includes(queryNorm)) {
            return 1.0;
        }

        // Partial Ratio & Levenshtein 둘 중 큰 값
        const pr = this.partialRatio(queryNorm, fieldNorm);
        const lev = this.calculateSimilarity(queryNorm, fieldNorm);
        return Math.max(pr, lev);
    }

    computeChoseongScore(queryChosung, fieldRaw) {
        if (!fieldRaw) return 0;
        const fieldChosung = this.toChoseong(fieldRaw);
        if (!fieldChosung) return 0;

        // 정확 포함 우선
        if (fieldChosung.includes(queryChosung)) return 1.0;

        // 초성에도 레벤슈타인/부분비교 적용
        const pr = this.partialRatio(queryChosung, fieldChosung);
        const lev = this.calculateSimilarity(queryChosung, fieldChosung);
        return Math.max(pr, lev);
    }

    dynamicThreshold(query) {
        const n = (query || '').trim().length;
        if (n <= 2) return 0.9;
        if (n <= 4) return 0.7;
        return 0.6; // 기본값
    }

    /* =========================
     * ④ Korean-aware fuzzySearch
     * ========================= */
    fuzzySearch(query, data, threshold) {
        if (!query || query.trim() === '') {
            return data;
        }

        const raw = query.trim();
        const isChosung = this.isChoseongQuery(raw);
        const qNorm = isChosung ? '' : this.normalizeKorean(raw);
        const qCho = isChosung ? raw : this.toChoseong(raw);

        const useThreshold = threshold ?? this.dynamicThreshold(raw);

        const FIELD_WEIGHTS = {
            name: 1.0,
            instrumentName: 0.85,
            categoryName: 0.7,
            description: 0.45,
        };

        const results = [];

        for (const item of data) {
            const fields = {
                name: item.name || '',
                description: item.description || '',
                instrumentName: item.instrumentName || '',
                categoryName: item.categoryName || ''
            };

            // 각 필드 점수 계산
            let bestScore = 0;

            for (const [fname, fval] of Object.entries(fields)) {
                const w = FIELD_WEIGHTS[fname] ?? 0.5;
                let s = 0;

                if (isChosung) {
                    s = this.computeChoseongScore(qCho, fval);
                } else {
                    s = this.computeFieldScore(qNorm, fval);
                }

                // 필드 가중치 적용
                const weighted = s * w;
                if (weighted > bestScore) bestScore = weighted;
                if (bestScore >= 1.0) break; // 조기종료
            }

            if (bestScore >= useThreshold) {
                results.push({
                    ...item,
                    relevanceScore: Number(bestScore.toFixed(6))
                });
            }
        }

        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    /* ===== 기존 구현들 (필요 부분만 재수록/수정) ===== */

    // 레벤슈타인 기반 유사도 (원본 구현 그대로 사용)
    calculateSimilarity(str1, str2) {
        const len1 = str1.length;
        const len2 = str2.length;

        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;

        const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

        for (let i = 0; i <= len1; i++) matrix[0][i] = i;
        for (let j = 0; j <= len2; j++) matrix[j][0] = j;

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

    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    highlightSearchTerm(text, searchTerm) {
        if (!searchTerm || !text) return text;
        const regex = new RegExp(`(${this.escapeRegExp(searchTerm)})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }

    // ===== 히스토리/필터/통계/제안 등은 기존 로직 유지 =====
    addToSearchHistory(query) {
        if (!query || query.trim() === '') return;
        const trimmedQuery = query.trim();
        this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);
        this.searchHistory.unshift(trimmedQuery);
        if (this.searchHistory.length > 10) {
            this.searchHistory = this.searchHistory.slice(0, 10);
        }
        this.saveSearchHistory();
    }

    loadSearchHistory() {
        try {
            const history = localStorage.getItem('ornaments_search_history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('검색 히스토리 로드 실패:', error);
            return [];
        }
    }

    saveSearchHistory() {
        try {
            localStorage.setItem('ornaments_search_history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.error('검색 히스토리 저장 실패:', error);
        }
    }

    getSearchHistory() {
        return [...this.searchHistory];
    }

    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }

    setFilters(filters) {
        this.currentFilters = { ...filters };
    }

    getCurrentFilters() {
        return { ...this.currentFilters };
    }

    clearFilters() {
        this.currentFilters = {
            instruments: [],
            categories: [],
            types: []
        };
    }

    partialSearch(query, data) {
        if (!query || query.trim() === '') return data;
        const searchTerm = query.toLowerCase().trim();
        return data.filter(item => {
            const searchFields = [
                item.name,
                item.description,
                item.instrumentName,
                item.categoryName
            ].filter(Boolean).map(s => s.toLowerCase());
            return searchFields.some(f => f.includes(searchTerm));
        });
    }

    getSuggestions(query, maxSuggestions = 5) {
        if (!query || query.trim() === '') {
            return this.getSearchHistory().slice(0, maxSuggestions);
        }
        const searchTerm = query.toLowerCase().trim();
        const suggestions = new Set();

        // 히스토리
        this.searchHistory.forEach(h => {
            if (h.toLowerCase().includes(searchTerm)) suggestions.add(h);
        });

        // 데이터 이름
        const allOrnaments = window.dataParser.getAllOrnaments();
        allOrnaments.forEach(o => {
            if (o.name && o.name.toLowerCase().includes(searchTerm)) {
                suggestions.add(o.name);
            }
        });

        return Array.from(suggestions).slice(0, maxSuggestions);
    }

    getSearchStats(results) {
        const stats = { total: results.length, byInstrument: {}, byCategory: {} };
        results.forEach(o => {
            const ins = o.instrumentName;
            const cat = o.categoryName;
            stats.byInstrument[ins] = (stats.byInstrument[ins] || 0) + 1;
            stats.byCategory[cat] = (stats.byCategory[cat] || 0) + 1;
        });
        return stats;
    }

    advancedSearch(options) {
        let results = window.dataParser.getAllOrnaments();
        if (options.exactMatch) {
            results = results.filter(o => o.name === options.query || o.description === options.query);
        }
        if (options.caseSensitive) {
            const q = options.query;
            results = results.filter(o => o.name?.includes(q) || o.description?.includes(q));
        }
        if (options.useRegex) {
            try {
                const regex = new RegExp(options.query, options.caseSensitive ? 'g' : 'gi');
                results = results.filter(o => regex.test(o.name || '') || regex.test(o.description || ''));
            } catch (e) {
                console.error('정규식 검색 오류:', e);
            }
        }
        return results;
    }

    performSearch(query, filters = null) {
        let results = window.dataParser.getAllOrnaments();
        const activeFilters = filters || this.currentFilters;
        if (activeFilters) {
            results = window.dataParser.filterOrnaments(activeFilters);
        }
        if (query && query.trim() !== '') {
            results = this.fuzzySearch(query, results); // ← 개선된 fuzzySearch 사용
        }
        return results;
    }
}

// 전역 인스턴스 교체
window.searchEngine = new SearchEngine();