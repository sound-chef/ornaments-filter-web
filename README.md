# 악상기호 필터 웹 애플리케이션

한국 전통 음악의 악상기호를 검색하고 필터링할 수 있는 웹 애플리케이션입니다.

## 🚀 기능

- **검색 기능**: 악상기호 이름으로 실시간 검색
- **필터 기능**: 악기별, 카테고리별 필터링
- **자동 XML 생성**: Resources/Ornaments 폴더 구조를 기반으로 자동 XML 생성
- **GitHub Pages 배포**: main 브랜치 푸시 시 자동 배포

## 📁 프로젝트 구조

```
├── .github/workflows/deploy.yml  # GitHub Actions 워크플로우
├── Resources/
│   ├── Ornaments/               # 악상기호 이미지 폴더
│   └── ornaments.xml            # 자동 생성되는 XML 파일
├── generate_xml.py              # XML 자동 생성 스크립트
├── index.html                   # 메인 애플리케이션
├── test-improved.html          # 테스트 페이지
├── data-parser.js              # 데이터 파싱 로직
├── search-engine.js            # 검색 엔진
├── app.js                      # 메인 애플리케이션 로직
└── styles.css                  # 스타일시트
```

## 🔧 사용법

### 로컬 개발
```bash
# XML 생성
python3 generate_xml.py

# 웹 서버 실행
python3 -m http.server 8000
```

### 자동 배포
- `main` 브랜치에 푸시하면 자동으로 XML이 생성되고 GitHub Pages에 배포됩니다
- `Resources/Ornaments` 폴더에 새로운 PNG 파일을 추가하면 자동으로 XML이 업데이트됩니다

## 🎯 지원하는 악기

- **장구**: 구음
- **가야금**: 주법, 빠르기(한배)
- **대금**: 부호, 장식음(꾸밈음), 빠르기(한배), 주법
- **아쟁**: 주법, 빠르기(한배)
- **피리**: 주법, 빠르기(한배), 장식(꾸밈음), 음정(가락), 당피리:세피리
- **해금**: 주법, 빠르기(한배)

## 📝 개발 정보

- **언어**: HTML, CSS, JavaScript, Python
- **배포**: GitHub Pages
- **자동화**: GitHub Actions
- **데이터**: XML 기반

## 🔄 워크플로우

1. `Resources/Ornaments` 폴더에 새로운 PNG 파일 추가
2. `main` 브랜치에 푸시
3. GitHub Actions가 자동으로 XML 생성
4. GitHub Pages에 자동 배포