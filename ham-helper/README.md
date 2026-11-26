# DS2YTO 햄 전파 도우미

춘천 PM37에서 쓰는 아마추어무선 오프라인 도우미 웹앱입니다.
`https://jangsh1015.github.io/ham-helper/`

## 담긴 것

- **UTC · KST 시계** — 두 시각을 크게 동시에. 기기 시간대와 무관하게 UTC+9로 계산합니다.
- **FT8 15초 주기** — `00/15/30/45` 슬롯 카운트다운, Even/Odd 표시. 15초 주기는 FT8 교신의 기본 단위입니다.
- **지금 시간대 추천 밴드** — 춘천(37.85N 127.74E)의 태양 고도를 계산해 낮·황혼·밤을 나눕니다.
- **그리드 거리 · 방위각** — Maidenhead 2·4·6자리를 위경도로 바꿔 대권 거리, 단거리/장거리 방위, 16방위, 나침반 표시.
- **콜사인 국가 검색** — 내장 DXCC 접두사 약 230개(범위 확장 포함). 최장 접두사 우선 매칭. 국가·대륙·CQ Zone·ITU Zone.
- **FT8 주파수** — 160m~2m 표준 다이얼 주파수. 누르면 복사됩니다.
- **QRP 포터블 체크리스트** — 체크 상태는 기기에 저장됩니다.
- **전리층 그림 3장** — 주파수별 반사, 낮과 밤 비교, 4층 고도 단면.
- **그레이 라인 도파관 시뮬레이터** — 주간/야간/그레이 라인 3모드 캔버스 애니메이션.

## 구조

순수 HTML/CSS/JS. 프레임워크·외부 CDN·추적 없음. `sw.js`가 모든 자산을 캐시해
인터넷 없이 열립니다. 홈 화면에 추가하면 앱처럼 뜹니다(`manifest.json`).

```
index.html  style.css  app.js  sw.js  manifest.json
icon.svg  icon-192.png  icon-512.png  apple-touch-icon.png
ionosphere.jpg  ionosphere-daynight.jpg  ionosphere-layers.jpg
```

캐시를 갱신할 때는 `sw.js`의 `CACHE` 이름(`ham-helper-v1`)을 올려 주세요.
