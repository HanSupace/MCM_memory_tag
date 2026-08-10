# MCM Memory Tag

MCM 전시 경험을 기록하고 개인화된 콘텐츠를 보여주는 웹 애플리케이션입니다.

## 준비 사항

- Node.js 22.13 이상
- PostgreSQL 데이터베이스

## 환경 변수 설정

프로젝트 루트에서 `.env.example`을 `.env`로 복사한 뒤 실제 PostgreSQL 정보를 입력합니다.

```powershell
Copy-Item .env.example .env
```

기본 형식:

```dotenv
DATABASE_URL=postgresql://사용자:비밀번호@호스트:5432/데이터베이스명
DATABASE_SSL=false
PGPOOL_MAX=5
```

`.env`는 Git에서 제외되며 `.env.example`만 팀원과 공유됩니다.

## 실행

```powershell
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 인증 동작

- 아이디: 3~20자의 한글, 영문, 숫자, 밑줄
- 비밀번호: 8~72자
- 아이디는 대소문자를 구분하지 않고 중복을 차단합니다.
- 비밀번호는 bcrypt로 해시되어 저장됩니다.
- 로그인 세션은 PostgreSQL과 HttpOnly 쿠키로 관리됩니다.

서버가 처음 인증 요청을 받을 때 필요한 테이블을 자동 생성합니다. 수동으로 준비하려면 `db/migrations/0001_postgresql_auth.sql`을 PostgreSQL에서 실행하면 됩니다.

## 빌드

```powershell
npm run build
```

## 협업

브랜치 운영, PR, 데이터베이스 마이그레이션 및 충돌 방지 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md)를 따릅니다.

## AI 작업 시작 프롬프트

이 저장소를 처음 clone한 뒤 Claude Code, Codex 등 AI 코딩 도구로 작업을 시작할 때, 아래 프롬프트를 그대로 복사해서 AI에게 전달하세요. AI가 저장소 규칙과 현재 이슈 현황을 스스로 파악한 뒤, 착수 가능한 이슈를 요약해서 보고합니다.

```
너는 지금 처음 이 저장소(MCM_memory_tag)를 클론해온 상태고, 프로젝트에 대해 아무것도 모른다고 가정해. 아래 순서대로 진행해줘. 아직 코드는 한 줄도 고치지 마.

1. 다음 문서를 순서대로 읽고 이 저장소의 협업 규칙을 파악해:
   - AGENTS.md (AI 작업 규칙 — 반드시 최우선으로 따라야 함)
   - CONTRIBUTING.md (Git Flow, 브랜치 전략, PR 규칙)
   - README.md (프로젝트 개요, 실행 방법)
   - db/SCHEMA.md (DB 테이블 구조)
   - Manyfast 프로젝트 "제목 없음memory" (PRD, 요구사항, 와이어프레임, 유저플로우 원본) — Manyfast MCP가 연결되어 있지 않으면 직접 연동하려 하지 말고, 나에게 연동이 필요하다고 먼저 알려줘.

2. 현재 git 상태를 확인해:
   - git status --short --branch
   - 지금 main에 있다면 develop으로 전환하고 최신화해 (git fetch origin && git switch develop && git pull --ff-only origin develop)
   - main과 develop에는 절대 직접 커밋하지 마

3. GitHub 이슈 현황을 확인해:
   - gh issue list --state open 으로 열린 이슈 전체를 가져와
   - 마일스톤(Phase 0 / Phase 1)과 라벨(blocked 등)을 기준으로 "지금 바로 착수 가능한 이슈"와 "아직 blocked인 이슈"를 구분해서 정리해
   - 각 이슈 본문의 "선행 조건", "허용 파일", "DB 변경" 항목을 확인해

4. 위 내용을 다 파악한 뒤, 다음을 요약해서 나에게 보고해:
   - 지금 착수 가능한 이슈 목록 (번호, 제목, 요구 영역)
   - 아직 blocked인 이슈와 그 이유
   - 내가 어떤 이슈를 맡으면 좋을지 추천 (내 역할/관심 분야를 알려주면 그에 맞춰서)

5. 내가 이슈 번호를 정해주면, 그때부터 AGENTS.md 맨 아래에 있는 "AI에게 작업을 요청하는 권장 형식"에 맞춰서:
   - 화면(UI/UX) 관련 이슈라면, 작업 시작 전에 Manyfast의 와이어프레임에서 해당 화면(예: "개인 전시회장 화면", "작품 상세 화면")을 찾아서 레이아웃과 구성 요소를 참고해. 화면 이름은 이슈 제목과 대체로 대응돼.
   - 최신 develop에서 feature/<이슈번호>-<설명> 브랜치를 만들고
   - 해당 이슈의 "허용 파일"만 수정하고
   - 작업 시작 전에 목표/수정예정파일/수정하지않을파일/DB·환경변수·패키지 변경여부/검증방법을 먼저 선언한 뒤 진행해줘

지금은 1~4단계만 수행하고, 5단계(실제 코드 작업)는 내가 이슈를 정해줄 때까지 시작하지 마.
```
