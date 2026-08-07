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
