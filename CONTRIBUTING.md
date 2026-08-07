# MCM Memory Tag Git Flow 협업 규칙

이 문서는 AI 중심의 바이브코딩에서 작업 중복과 Git 충돌을 줄이기 위한 팀 공통 규칙입니다. 저장소에서 코드를 수정하는 AI는 먼저 [AGENTS.md](AGENTS.md)를 읽고 따라야 합니다.

## 0. AI 협업 운영 원칙

- 기본 작업 단위는 **Issue 1개 = 담당자 1명 = AI 작업 1개 = 브랜치 1개**입니다.
- 여러 AI를 동시에 사용하면 반드시 각자 별도의 Git worktree에서 실행합니다.
- Issue에 수정 허용 파일과 수정 금지 파일을 적은 뒤 AI 작업을 시작합니다.
- 공통 파일, DB 스키마, 패키지 잠금 파일은 지정된 AI 한 명만 수정합니다.
- AI는 범위 밖 변경이 필요할 때 임의로 확장하지 않고 사람에게 먼저 보고합니다.
- 사람은 작업 배분과 병합 순서를 결정하고, AI는 구현과 검증을 담당합니다.
- 같은 기능을 나눌 때는 DB → API → UI 순서로 작은 PR을 병합합니다.

AI에게 요청할 때는 목표만 전달하지 말고 Issue, 브랜치, 허용 파일, 금지 파일, 완료 조건을 함께 제공합니다. 복사해서 사용할 수 있는 프롬프트 양식은 `AGENTS.md` 마지막에 있습니다.

## 1. 브랜치

| 브랜치 | 용도 | 직접 push |
| --- | --- | --- |
| `main` | 언제든 배포 가능한 안정 버전 | 금지 |
| `develop` | 다음 버전의 통합 브랜치 | 금지 |
| `feature/<이슈>-<설명>` | 기능, UI, 리팩터링 | 본인 브랜치만 |
| `fix/<이슈>-<설명>` | 일반 버그 수정 | 본인 브랜치만 |
| `release/<버전>` | 출시 직전 검증 | 담당자만 |
| `hotfix/<이슈>-<설명>` | main의 긴급 수정 | 담당자만 |

브랜치 이름은 소문자 영문과 하이픈을 사용합니다.

```text
feature/32-login-validation
fix/41-mobile-header
release/1.0.0
```

## 2. 작업 시작

1. 모든 작업은 GitHub Issue를 먼저 만듭니다.
2. Issue에 목적, 완료 조건, 담당자, 수정 예정 파일을 적습니다.
3. 같은 Issue를 여러 명이 동시에 구현하지 않습니다.
4. 수정 파일이 다른 작업과 겹치면 코딩 전에 범위를 나눕니다.
5. 최신 `develop`에서 브랜치를 만듭니다.

```powershell
git switch develop
git pull --ff-only origin develop
git switch -c feature/32-login-validation
```

한 브랜치는 하나의 Issue만 처리합니다.

## 3. 파일 담당과 충돌 방지

Issue에 담당 영역을 표시합니다.

- 화면/컴포넌트: `app/`
- 인증 API: `app/api/auth/`, `lib/auth.ts`
- 데이터베이스: `lib/db.ts`, `db/`, `drizzle/`
- 스타일: `app/globals.css`
- 패키지/빌드: `package.json`, `package-lock.json`, 설정 파일
- 문서/환경 변수: `README.md`, `.env.example`

다음 파일은 한 시점에 한 명만 수정합니다.

- `app/MemoryTagApp.tsx`
- `app/globals.css`
- `package.json`, `package-lock.json`
- `drizzle/meta/_journal.json`

공통 파일은 작업 전에 팀 채널에 알리고 담당자 한 명이 변경합니다. 자동 포맷팅, 전체 import 정렬, 줄바꿈 일괄 변경은 기능 PR과 분리합니다.

## 4. 브랜치 동기화

PR을 열기 직전에 최신 `develop`을 반영하고 검증합니다.

```powershell
git fetch origin
git rebase origin/develop
npm run lint
npm run build
git push --force-with-lease origin feature/32-login-validation
```

- rebase는 본인만 사용하는 `feature/*`, `fix/*`에서만 합니다.
- `main`, `develop`, 공유 브랜치에는 rebase와 강제 push를 금지합니다.
- 필요할 때도 `--force`가 아닌 `--force-with-lease`만 사용합니다.
- 충돌은 해당 변경을 만든 담당자들이 함께 해결합니다.

## 5. 커밋

```text
type(scope): 요약
```

`feat`, `fix`, `refactor`, `style`, `test`, `docs`, `chore`, `db` 중 하나를 사용합니다.

```text
feat(auth): 아이디 중복 확인 추가
fix(home): 모바일 메뉴 겹침 수정
db(auth): 세션 만료 인덱스 추가
```

한 커밋에는 한 가지 의도만 담고 관련 없는 포맷 변경이나 임시 코드를 섞지 않습니다.

## 6. Pull Request

기능 PR의 대상은 `develop`입니다. `main`으로 직접 PR을 만들지 않습니다.

PR 본문에 다음을 적습니다.

- `Closes #이슈번호`
- 변경 목적과 주요 수정 파일
- 검증 명령과 결과
- UI 변경 전/후 화면
- DB 또는 환경 변수 변경 여부
- 리뷰어가 집중해서 볼 부분

가능하면 변경 파일 10개 이하 또는 핵심 변경 400줄 이하로 유지합니다. 큰 기능은 DB, API, UI PR로 나누고 의존 순서대로 병합합니다.

병합에는 승인 1명 이상, 리뷰 해결, 최신 `develop` 반영, 린트와 빌드 성공이 필요합니다. 기능 PR은 **Squash merge**하고 병합 후 브랜치를 삭제합니다.

## 7. PostgreSQL과 마이그레이션

- 병합된 마이그레이션은 수정하거나 삭제하지 않습니다.
- 스키마 변경마다 새 SQL 파일을 추가합니다.
- 한 PR의 마이그레이션 생성 담당자는 한 명만 둡니다.
- `db/schema.ts`, SQL, Drizzle 메타데이터를 같은 PR에서 맞춥니다.
- 데이터 손실 가능성이 있는 변경은 별도 PR로 만들고 복구 방법을 적습니다.
- 개발자는 각자 개인 DB 또는 개인 스키마를 사용합니다.
- 공용 DB 마이그레이션은 지정 담당자 한 명만 실행합니다.

```text
0002_add_profile_table.sql
0003_add_session_index.sql
```

## 8. 환경 변수와 비밀정보

- `.env`는 절대 커밋하지 않습니다.
- DB 비밀번호, 쿠키, API 키를 코드, Issue, PR, 화면 캡처에 넣지 않습니다.
- 새 변수가 필요하면 값 없이 `.env.example`의 이름과 설명만 추가합니다.
- 비밀값을 push했다면 즉시 해당 값을 폐기하고 재발급합니다.

```powershell
git status --short
git diff --cached
```

## 9. 패키지

- 의존성을 바꾸는 담당자만 `package.json`과 `package-lock.json`을 수정합니다.
- 패키지 PR이 겹치면 하나를 먼저 병합한 후 다음 작업자가 최신 `develop`에서 다시 설치합니다.
- lock 파일 충돌을 손으로 부분 병합하지 않습니다. 최종 `package.json`을 기준으로 `npm install`을 실행해 다시 생성합니다.
- 기능 PR에 이유 없는 전체 패키지 업데이트를 포함하지 않습니다.

## 10. Release와 Hotfix

`release/*`는 `develop`에서 만들며 버그, 버전, 문서만 수정합니다. 검증 후 `main`과 `develop` 양쪽에 병합하고 태그를 만듭니다.

`hotfix/*`는 최신 `main`에서 만들고 수정 후 `main`과 `develop` 양쪽에 병합합니다.

## 11. PR 전 체크리스트

```powershell
npm run lint
npm run build
git diff --check
git status --short
```

- 최신 `develop` 반영
- 비밀정보와 디버그 코드 제거
- DB/환경 변수 변경 문서화
- PR 범위 밖 변경 제거

핵심 원칙은 **같은 파일을 동시에 수정하지 않고, 작업 범위를 먼저 선언하며, 작은 PR을 자주 병합하는 것**입니다.
