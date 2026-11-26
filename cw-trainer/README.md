# DS2YTO 모르스 부호(CW) 연습기

춘천 PM37에서 쓰는 아마추어무선 CW 연습 웹앱입니다.
`https://jangsh1015.github.io/cw-trainer/`

## 담긴 것

- **① 송신 · 재생** — 문장을 적고 사이드톤으로 송신. 재생 중인 글자와 그 부호(· —)를 한 요소씩 하이라이트. 햄 실전 프리셋 4종, 반복 재생, 복사.
- **② 전건 타건** — 스트레이트 키(누르는 동안 소리)와 아이앰빅 2버튼(·/—, 양쪽 동시에 누르면 교대). 점 길이를 치는 속도에 맞춰 스스로 배우고, 간격으로 글자·단어를 갈라 알파벳·숫자로 실시간 해독합니다. 측정된 점 길이와 환산 WPM을 함께 보여 줍니다.
- **③ 청취 퀴즈** — 알파벳·숫자, 햄 약어(CQ/DE/QTH/RST/73/K/BK/TU), 실전 QSO 콜사인 받아쓰기. 4지선다 또는 직접 입력, 정답률·연속 기록은 기기에 저장.
- **④ 모르스 부호표** — A–Z, 0–9, 기호, 프로사인(AR·SK·BT 등). 칸을 누르면 그 부호가 바로 울립니다.
- **Farnsworth 간격** — 글자는 18~25 WPM으로 또렷하게, 글자·단어 사이 간격만 늘려 실효 10~15 WPM으로. CW 학습의 정통 방식입니다.
- **QRN 밴드 잡음** — 저역 위주 노이즈에 아주 느린 페이딩을 섞어 40m/20m HF에서 CW를 듣는 현장감. 기본 OFF.
- **속도·음높이** — 10~30 WPM, 500~900 Hz 공용 슬라이더. 5 ms 어택/릴리스 램프로 틱 소리 없는 사인파.

## 구조

순수 HTML/CSS/JS. 프레임워크·외부 CDN·추적 없음. `sw.js`가 모든 자산을 캐시해
인터넷 없이 열립니다. 홈 화면에 추가하면 앱처럼 뜹니다(`manifest.webmanifest`).
소리는 Web Audio API로 만들고, iOS Safari 정책에 맞춰 첫 터치에서 `AudioContext.resume()`을 겁니다.

```
index.html  style.css  app.js  sw.js  manifest.webmanifest
icon.svg  icon-192.png  icon-512.png  apple-touch-icon.png
```

캐시를 갱신할 때는 `sw.js`의 `CACHE` 이름(`cw-trainer-v1`)과
`index.html`의 `?v=` 쿼리를 함께 올려 주세요.
