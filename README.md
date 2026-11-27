# jangsh1015.github.io

장석훈(Seokhoon Jang)의 개인 공식 홈페이지.

- 아마추어무선 **DS2YTO** — QRP 5W 이하 · FT8 교신, Icom IC-705 · IC-2730A · ID-51E
- **별빛교신** — 우주·물리·인생 사색 연재 (카카오스토리)
- **Projects** — FT8CN KR 안드로이드 APK 배포(맨 첫 카드, `0.93-kr13 · 한국어·다국어 에디션` 배지 · 한국어/영어/중국어 자동 전환 안내 · 태블릿 모드 안내 상자 · **v0.93-kr14 테스트 중(업데이트 예정) 안내 상자** · **IC-705 무선(Wi-Fi) 연결 순서 참고사항** · 다운로드 버튼·소스 코드 링크·전체 릴리스 보기, 원작 BG7YOZ/N0BOY + 수정·배포 DS2YTO 표기) · 파이브앤하프 4쿠션 시뮬레이터 · 2호차 셔틀 시간표 · 전기차 충전 기록부 · DS2YTO 무전 도구함(`/ds2yto-tools/` — 그레이 라인·전파 거리·안테나 길이와 맥스웰 방정식, 공개) · DS2YTO 햄 전파 도우미 · CW 연습기
- **APK 파일** — `FT8CN_KR.apk`(22,351,298바이트, v0.93-kr13, 패키지 `com.bg7yoz.ft8cn.kr`)는 `jangsh1015/charge-Public-` 저장소의 Release `v0.93-kr13` 자산으로 올려 두었습니다. 주소: `https://github.com/jangsh1015/charge-Public-/releases/download/v0.93-kr13/FT8CN_KR.apk`. 같은 APK 하나에 한국어·영어·중국어 UI가 들어 있어 기기 언어를 따라 자동으로 바뀌고, 태블릿 가로 화면도 자동 인식해 3분할·2열·2분할로 펼쳐지므로 태블릿용 파일은 따로 두지 않습니다. 0.93-kr12에서 교신 목록을 5색으로 나누고(나를 부른 수신 노랑·내 CQ 송신 호박·내 교신 송신 빨강·남의 CQ 초록) 워터폴 신호를 25~30% 밝혔으며, kr13에서 워터폴 위에 송신 중 실시간 SWR 표(1.5 이하 초록·2.0까지 호박·그 위 빨강, 송신 뒤 직전 값 유지)와 원터치 TUNE(ICOM 오토튠) 단추를 넣었습니다. 소개 영상은 v0.93-kr14 테스트 촬영분 `assets/ft8cn-kr-demo-kr14.mp4`(1분 37초, 18.3MB)와 포스터 `assets/ft8cn-kr-poster-kr14.jpg`이며, 카드 위에 `v0.93-kr14 테스트 중 — 업데이트 예정` 안내 상자(태블릿 가로 화면·USB 유선 특화, 실시간 Po·ALC, PWR 원터치 출력 조절, TUNE 튜너 자동 켜기)를 두어 다운로드 버전(kr13)과 영상이 다르다는 점을 밝힙니다. 첫 화면 영상 단추도 같은 kr14 테스트 영상을 열며 아래에 "지금 내려받는 APK는 v0.93-kr13" 한 줄을 붙였습니다. kr11 영상(`assets/ft8cn-kr-demo-kr11.mp4`, 46초)과 예전 kr7 영상(`assets/ft8cn-kr-demo.mp4`)은 지우지 않고 그대로 두었습니다. 새 버전을 올릴 때는 Release 자산을 교체하고 홈페이지의 버전·용량 문구를 함께 고칩니다.
- **Gallery** — 카카오스토리에 남긴 소소한 일상 사진 6장 (썸네일 그리드 + 라이트박스, `assets/gallery/`)
- **Music** — 오늘의 노래 두 곡. ① 이찬원 〈시절인연 (時節因緣)〉 — 공식 뮤직비디오(1theK, `fV8tu-tPcJE`) ② 써드베이스 〈진동 (Shaken)〉 — 공식 뮤직비디오(Third Base 써드베이스(KGospel), `rqDl9qvEhAI`). 둘 다 youtube-nocookie iframe으로 재생하고 [유튜브에서 듣기] 링크를 함께 둔다. 음원 파일은 올리지 않는다.
- **방문자 카운터(비공개)** — 화면에는 아무 표시도 없이 조용히 방문 수를 기록합니다. 확인은 주소 끝에 `?stats`를 붙이거나(`https://jangsh1015.github.io/?stats`) 푸터의 `© 2026`을 5번 연속 탭하면 누적·오늘·최근 7일이 작은 창으로 뜹니다. 같은 브라우저 세션에서는 한 번만 기록합니다(`sessionStorage`). 값은 구글 Apps Script 웹 앱(`홈페이지 방문자 카운터 API`, `doGet?a=hit`·`?a=get`)이 스크립트 속성에 보관합니다. 카운터를 0으로 되돌리려면 그 프로젝트 편집기에서 `resetCounter`를 실행합니다.

정적 페이지입니다. `index.html`을 고치고 `main`에 푸시하면 GitHub Pages가 바로 반영합니다.

## 첫 화면·공유 미리보기

- **Hero** — 대표 사진(`assets/portrait.jpg`)을 궤도 링·전파 링으로 감싼 원형 프레임, 이름 `장석훈` + 콜사인 `DS2YTO`, 한 줄 소개, **FT8CN KR APK 다운로드 배너(`.hero-app`, 소개 바로 아래·바로가기 타일 위)**, 바로가기 타일 4개(아마추어무선·별빛교신·직접 만든 웹앱·음악), `#radio` 등 앵커로 이동. 모바일 390px부터 4개 타일이 2열로 떨어지고 다운로드 버튼은 배너 폭 전체로 넓어집니다.
- **OG / Twitter Card** — `og-image.png`(1200×630, 저장소 루트)를 카카오톡·메신저 미리보기 이미지로 사용. 이미지를 새로 만들면 `index.html`의 `og:image`·`twitter:image` 쿼리(`?v=1`)를 올려 캐시를 피합니다. 카카오톡은 페이지 단위로도 미리보기를 캐시하므로, 예전 카드가 보이면 [카카오 OG 캐시 초기화](https://developers.kakao.com/tool/clear/og)에서 URL을 넣어 지운 뒤 다시 공유합니다.
- 카드 디자인 원본(HTML)은 워크스페이스 `scratch/og-card.html`에 있고, 1200×630으로 렌더해 `og-image.png`로 저장합니다.

Program & Idea by Seokhoon Jang
