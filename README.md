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
- 내부 결제 모듈: payments-core

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

필수 값 (payments-core 모듈 기준)

- `PAYMENT_STRIPE_SECRET_KEY`
- `PAYMENT_STRIPE_PUBLISHABLE_KEY`
- `PAYMENT_STRIPE_WEBHOOK_SECRET`
- `PAYMENT_STRIPE_API_VERSION` (선택)

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
- Swagger: http://localhost:3000/api/docs

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

## payments-core 모듈화

현재 결제 연동은 `src/payments-core`에 모듈화되어 있습니다.

- Stripe 클라이언트/웹훅 시크릿/퍼블리시 키는 `PaymentsCoreModule.forRootFromEnv()`에서 주입됩니다.
- 프로젝트마다 환경변수만 다르게 주입하면 동일 모듈을 그대로 사용할 수 있습니다.

### 사용 예시

```ts
import { Module } from '@nestjs/common';
import { PaymentsCoreModule } from './payments-core/payments-core.module';

@Module({
  imports: [PaymentsCoreModule.forRootFromEnv()],
})
export class AppModule {}
```

### 주문 어댑터(확장 포인트)

결제 모듈을 다른 도메인에 붙일 때는 주문 도메인과의 연결 지점이 필요합니다.

- 결제 성공 시: 주문 상태 업데이트, 재고 차감, 알림 발송
- 결제 실패/취소 시: 주문 상태 롤백

현재는 `OrdersService`가 이 역할을 담당하며, 다른 프로젝트에서는 아래와 같은 형태로 어댑터를 구성하는 것을 권장합니다.

```ts
export interface OrderPort {
  findByCode(orderCode: string): Promise<Order>;
  markPaid(orderCode: string, paymentIntentId: string): Promise<void>;
  markCancelled(orderCode: string): Promise<void>;
  markRefunded(orderCode: string): Promise<void>;
}
```

- 결제 모듈은 `OrderPort`만 의존
- 실제 도메인 구현체를 주입

### npm 패키지로 확장

`payments-core`는 내부 모듈 형태로 분리되어 있으므로, 다음 단계를 통해 별도 패키지로 확장 가능합니다.

- `src/payments-core`를 별도 패키지로 분리
- `forRoot(config)` 기반 API 유지
- 조직 내 다른 서비스에서 `npm install`로 사용

## 운영 안정화

- `DB_SYNCHRONIZE`를 운영에서는 `false`로 설정
- `DB_LOGGING`으로 SQL 로깅 제어

## 배포 (Docker)

```bash
docker compose -f docker-compose.prod.yml up --build
```

- 앱 컨테이너: http://localhost:3000
- DB 포트: 3307

## 개발 참고

- `synchronize: true`로 설정되어 있어 실행 시 자동으로 테이블이 생성됩니다.
- Stripe 결제 승인 결과는 Webhook 이벤트로 최종 반영됩니다.
- 운영 환경에서는 마이그레이션 기반으로 스키마 관리가 필요합니다.
