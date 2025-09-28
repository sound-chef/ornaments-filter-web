# 한국 전통 음악 악상기호 필터링 시스템

한국 전통 음악의 다양한 악상기호(시김새)를 효율적으로 검색하고 필터링할 수 있는 웹 애플리케이션입니다.

## 🎵 주요 기능

### 🔍 **Faceted Navigation (면적 네비게이션)**
- **카테고리별 필터링**: 주법, 빠르기, 꾸밈음, 음높이, 음세기, 음표현, 표기
- **악기별 필터링**: 장구, 가야금, 대금, 아쟁, 피리, 해금, 당피리/세피리
- **타입별 필터링**: 앞꾸밈음, 뒷꾸밈음
- **다중 선택 지원**: 여러 필터를 동시에 적용 가능

### 🏗️ **Hierarchical Navigation (계층적 네비게이션)**
- **3단계 계층 구조**: 악기 → 카테고리 → 개별 악상기호
- **드릴다운 탐색**: 상위 카테고리에서 하위 항목으로 점진적 탐색
- **브레드크럼 네비게이션**: 현재 위치 표시 및 이전 단계로 이동

### 🔎 **Fuzzy Search (퍼지 검색)**
- **한글 검색 지원**: 한국어 악상기호명 검색
- **오타 허용**: Levenshtein 거리 기반 유사도 매칭
- **부분 일치**: 키워드의 일부만 입력해도 검색 가능
- **실시간 검색**: 타이핑과 동시에 결과 업데이트
- **검색어 하이라이트**: 매칭된 부분 강조 표시

### 📱 **반응형 웹 디자인**
- **모바일 우선 설계**: 모바일 환경에서 최적화
- **적응형 레이아웃**: 화면 크기에 따른 동적 레이아웃 조정
- **터치 친화적 UI**: 모바일 터치 인터페이스 지원

## 🚀 빠른 시작

### 1. 로컬 개발 서버 실행

#### Python 사용 (권장)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

#### Node.js 사용
```bash
# npm 패키지 설치
npm install

# 개발 서버 실행
npm run start-node

# 또는 Live Server 사용
npm run dev
```

### 2. 브라우저에서 접속
```
http://localhost:8000
```

## 📁 프로젝트 구조

```
ornaments-filter-web/
├── index.html              # 메인 HTML 파일
├── styles.css              # CSS 스타일시트
├── app.js                  # 메인 애플리케이션 로직
├── data-parser.js          # XML 데이터 파서
├── search-engine.js        # 검색 엔진 및 퍼지 검색
├── vst-bridge.js           # VST 통신 인터페이스
├── package.json            # Node.js 패키지 설정
├── README.md               # 프로젝트 문서
├── ornaments.md            # 요구사항 정의서
└── Resources/
    ├── ornaments.xml       # 악상기호 데이터
    └── Ornaments/          # 악상기호 이미지들
        ├── 1_장구/
        ├── 2_가야금/
        ├── 3_대금/
        ├── 4_아쟁/
        ├── 5_피리/
        └── 6_해금/
```

## 🎯 VST 통합

### JUCE WebView 통합
```cpp
// JUCE에서 WebView 컴포넌트 사용
class OrnamentsFilterComponent : public juce::Component
{
public:
    OrnamentsFilterComponent()
    {
        webView = std::make_unique<juce::WebViewComponent>();
        addAndMakeVisible(webView.get());
        
        // 로컬 HTML 파일 로드
        webView->loadURL("file:///path/to/ornaments-filter/index.html");
    }
    
private:
    std::unique_ptr<juce::WebViewComponent> webView;
};
```

### VST API 사용
```javascript
// VST와의 통신
window.vstAPI.selectOrnament(ornament);
window.vstAPI.syncFilters(filters);
window.vstAPI.syncSearch(searchTerm);
```

## 🛠️ 개발 환경

### 요구사항
- **웹 서버**: Python 3.x 또는 Node.js 14+
- **브라우저**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **해상도**: 320px ~ 1920px

### 권장 개발 도구
- **에디터**: VS Code, WebStorm
- **브라우저**: Chrome DevTools
- **버전 관리**: Git

## 📊 데이터 구조

### XML 스키마
```xml
<ornaments>
  <instrument id="1" name="가야금" korean="가야금">
    <category id="1" name="빠르기(한배)_악상기호" korean="빠르기(한배)_악상기호">
      <ornament>
        <id>1</id>
        <name>덧길이</name>
        <filename>6_덧길이.png</filename>
        <description>덧길이 시김새</description>
        <autoalign>false</autoalign>
        <rightColumnOnly>false</rightColumnOnly>
        <imagePath>/path/to/image.png</imagePath>
      </ornament>
    </category>
  </instrument>
</ornaments>
```

### 지원 악기
- **장구** (Janggu)
- **가야금** (Gayageum)
- **대금** (Daegeum)
- **아쟁** (Ajaeng)
- **피리** (Piri)
- **해금** (Haegeum)
- **당피리/세피리** (Dangpiri/Sepiri)

## 🎨 UI 컴포넌트

### 레이아웃 구조
```
┌─────────────────────────────────────────┐
│ [Setting] [Articulation] [Global]      │
├─────────────────────────────────────────┤
│ 🔍 [검색창] Place Holder                 │
├─────────────────────────────────────────┤
│ Name                                    │
│ [아이콘] 북편과 채편을 동시 연주한다.     │
├─────────────────────────────────────────┤
│ Categories ▼                            │
│ [주법] [빠르기(한배)] [꾸밈음] [음높이]   │
├─────────────────────────────────────────┤
│ Instruments ▼                           │
│ [장구] [대금] [아쟁] [피리] [해금]       │
├─────────────────────────────────────────┤
│ Type ▼                                  │
│ [앞꾸밈음] [뒷꾸밈음]                    │
├─────────────────────────────────────────┤
│ Result (146) ▼                          │
│ [덩(떵)] [기덕] [쿵] [작은 덩]          │
└─────────────────────────────────────────┘
```

## 🔧 API 참조

### 전역 API
```javascript
// 애플리케이션 상태 확인
window.ornamentsAPI.getAppState();

// 악상기호 선택
window.ornamentsAPI.selectOrnament(ornament);

// 검색 수행
window.ornamentsAPI.performSearch(query);

// 필터 적용
window.ornamentsAPI.applyFilters(filters);
```

### VST API
```javascript
// VST와의 통신
window.vstAPI.selectOrnament(ornament);
window.vstAPI.getCurrentSelection();
window.vstAPI.syncFilters(filters);
window.vstAPI.syncSearch(searchTerm);
window.vstAPI.getState();
```

## 🐛 문제 해결

### 일반적인 문제들

1. **XML 로드 실패**
   - `Resources/ornaments.xml` 파일 경로 확인
   - CORS 정책 확인 (로컬 서버 사용)

2. **이미지 로드 실패**
   - `Resources/Ornaments/` 폴더 구조 확인
   - 이미지 파일명과 경로 일치 확인

3. **VST 통신 실패**
   - VST 환경 감지 확인
   - WebView 설정 확인

### 디버깅
```javascript
// 콘솔에서 상태 확인
console.log(window.ornamentsApp.getAppState());
console.log(window.vstBridge.getVSTState());

// VST 통신 테스트
window.vstAPI.test();
```

## 📝 라이선스

MIT License

## 🤝 기여하기

1. 프로젝트 포크
2. 기능 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 푸시 (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📞 지원

문제가 발생하거나 질문이 있으시면 이슈를 생성해주세요.

---

**개발팀** | **2024년**
