# jangsh1015.github.io

장석훈(Seokhoon Jang)의 개인 공식 홈페이지.

- 아마추어무선 **DS2YTO** — QRP 5W 이하 · FT8 교신, Icom IC-705 · IC-2730A · ID-51E
- **별빛교신** — 우주·물리·인생 사색 연재 (카카오스토리)
- **Projects** — 파이브앤하프 4쿠션 시뮬레이터 · 2호차 셔틀 시간표 · 전기차 충전 기록부
- **Gallery** — 카카오스토리에 남긴 소소한 일상 사진 6장 (썸네일 그리드 + 라이트박스, `assets/gallery/`)
- **Music** — 오늘의 노래 두 곡. ① 이찬원 〈시절인연 (時節因緣)〉 — 공식 뮤직비디오(1theK, `fV8tu-tPcJE`) ② 써드베이스 〈진동 (Shaken)〉 — 공식 뮤직비디오(Third Base 써드베이스(KGospel), `rqDl9qvEhAI`). 둘 다 youtube-nocookie iframe으로 재생하고 [유튜브에서 듣기] 링크를 함께 둔다. 음원 파일은 올리지 않는다.
- **Guestbook** — 로그인 없이 이름과 한 줄 인사를 남기는 방명록. 구글 폼(`1zWZqn0TNoftHei2ebAIAf4FCpseYKjh0wwnPtOVKJYc`) → 구글 시트(`1PtLuugdixAKFkT1HCwXosylA6wCm_LeGIvl2k9o0Ml0`, 링크 공개 읽기·gviz JSONP) → 페이지 최신 12건

방명록 관리: 구글 드라이브의 `장석훈 홈페이지 방명록(응답)` 시트에서 해당 행을 지우면 홈페이지에서도 사라집니다.

정적 페이지입니다. `index.html`을 고치고 `main`에 푸시하면 GitHub Pages가 바로 반영합니다.

## 첫 화면·공유 미리보기

- **Hero** — 대표 사진(`assets/portrait.jpg`)을 궤도 링·전파 링으로 감싼 원형 프레임, 이름 `장석훈` + 콜사인 `DS2YTO`, 한 줄 소개, 바로가기 타일 5개(아마추어무선·별빛교신·직접 만든 웹앱·음악·방명록), `#radio` 등 앵커로 이동. 모바일 390px부터 5개 타일이 2열로 떨어집니다.
- **OG / Twitter Card** — `og-image.png`(1200×630, 저장소 루트)를 카카오톡·메신저 미리보기 이미지로 사용. 이미지를 새로 만들면 `index.html`의 `og:image`·`twitter:image` 쿼리(`?v=1`)를 올려 캐시를 피합니다. 카카오톡은 페이지 단위로도 미리보기를 캐시하므로, 예전 카드가 보이면 [카카오 OG 캐시 초기화](https://developers.kakao.com/tool/clear/og)에서 URL을 넣어 지운 뒤 다시 공유합니다.
- 카드 디자인 원본(HTML)은 워크스페이스 `scratch/og-card.html`에 있고, 1200×630으로 렌더해 `og-image.png`로 저장합니다.

Program & Idea by Seokhoon Jang
