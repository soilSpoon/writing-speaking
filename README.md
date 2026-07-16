# 억울함 → 문서

> **"억울함을 검색하면, 완성된 공식 문서가 나오는 자판기."**
> 상황을 고르고 → 한 번 말하고 → 틀린 것만 탭한다. 내용증명·이의신청서 같은 법률·행정 문서를 대신 써준다.

Google AI for Social Good 해커톤 프로젝트. 설계 배경은 [PROJECT.md](./PROJECT.md) 참고.

## 실행

```bash
npm install
cp .env.example .env   # GEMINI_API_KEY 채우기 (없으면 로컬 시뮬레이터로 폴백)
npm run dev
```

| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (Gemini 프록시 포함) |
| `npm run build` | 타입체크 + 프로덕션 빌드 |
| `npm test` | 유닛 테스트 (Vitest) |
| `npm run lint` | Oxlint |

## Gemini API 키 처리

키는 **브라우저에 절대 노출되지 않는다.** 모든 Gemini 호출은 서버 프록시 `/api/gemini`를 거치며, 프록시가 서버 측 `GEMINI_API_KEY`를 주입해 Google로 전달한다.

- `GEMINI_API_KEY` — `VITE_` 접두사 **없음** → 클라이언트 번들에 포함되지 않음
- 로컬: `server/devProxy.ts` (Vite 미들웨어 플러그인)
- 배포(Vercel): `api/gemini.ts` (서버리스 함수). Vercel 대시보드 env var에 `GEMINI_API_KEY` 등록
- 서버에 키가 없거나 호출 실패 시 → 로컬 휴리스틱 시뮬레이터로 자동 폴백

## 기술 스택

React 19 · TypeScript · Vite · Vitest · Playwright(e2e) · Google Gemini
