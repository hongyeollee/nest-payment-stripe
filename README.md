# NestJS MVC Stripe Demo

Stripe Payment Element 기반으로 장바구니 → 주문 생성 → 결제 승인 → 완료/환불까지 확인하는 NestJS MVC 예제입니다.

## 주요 기능

- 상품 카탈로그/장바구니(MVC 뷰)
- 주문 생성 API
- Stripe Payment Intent 생성 및 승인 처리
- Stripe Webhook 수신 및 결제 상태 업데이트
- 환불/취소 API
- MySQL(TypeORM) 기반 도메인 저장

## 기술 스택

- NestJS 11 + Express MVC
- EJS + express-ejs-layouts
- TypeORM + MySQL
- Stripe SDK (Payment Element)

## 사전 준비

- Node.js 20+
- Docker (MySQL 로컬 실행용)
- Stripe 계정 및 테스트 키

## 설치

```bash
npm install
```

## 환경 변수

`.env.example`을 복사해 `.env`를 만든 뒤 값을 채워주세요.

```bash
cp .env.example .env
```

필수 값

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

## 로컬 DB 실행

```bash
docker compose up -d
```

## 실행

```bash
npm run start:dev
```

접속 URL

- 스토어: http://localhost:3000/shop

## 결제 테스트

- 테스트 카드: 4242 4242 4242 4242
- 만료일: 아무 미래 날짜
- CVC/우편번호: 아무 값

## 웹훅 로컬 테스트

Stripe CLI 설치 후 아래 명령을 실행합니다.

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

출력되는 `whsec_...` 값을 `.env`의 `STRIPE_WEBHOOK_SECRET`에 넣어주세요.

## 주요 경로

- MVC 뷰: `src/views/shop/index.ejs`, `src/views/shop/confirmation.ejs`
- 주문 API: `POST /api/orders`
- 결제 Intent: `POST /api/payments/intent`
- 환불: `POST /api/payments/refund`
- 웹훅: `POST /api/payments/webhook`

## 개발 참고

- `synchronize: true`로 설정되어 있어 실행 시 자동으로 테이블이 생성됩니다.
- Stripe 결제 승인 결과는 Webhook 이벤트로 최종 반영됩니다.
