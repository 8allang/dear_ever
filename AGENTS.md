# 작업 규칙

- 이 프로젝트는 GitHub Pages용 순수 HTML/CSS/JavaScript 청첩장이다. 서버·DB를 도입하지 않는다.
- 현재 테스트 중에는 index.html과 edit.html을 file://로 직접 열어도 동작하도록 유지한다.
- 사용자의 명시적 요청: **매번 git push 전에 “index.html을 직접 열 수 있는 테스트 기능을 막을까요?”라고 확인한다.** 답변 없이 직접 열기 기능을 끄거나 푸시하지 않는다. 푸시 요청 자체가 없으면 이 질문 때문에 진행 중인 로컬 작업을 멈추지 않는다.
- HTML은 templates/와 JS/CSS 원본을 scripts/build-html.mjs로 묶어 생성한다. 원본 수정 후 `node scripts/build-html.mjs`를 실행해 index.html 및 edit.html을 갱신한다.
- 직접 열기용 기본 데이터에는 가상의 샘플만 포함한다. 실제 invitation.json을 HTML에 삽입하지 않는다.

- 디자인 템플릿은 AI가 `designs/`에 추가하고 등록한다. 사용자 편집 HTML에는 등록된 템플릿 선택·적용만 제공하며, 사용자 제작·편집·파일 업로드 기능을 넣지 않는다. `designs/README.md`를 따른다.
