import type { Template } from '../types';

const restApi: Template = {
  id: 'rest-api',
  kind: 'rest-api',
  name: { en: 'REST API (Node.js)', ar: 'REST API بـ Node.js' },
  description: {
    en: 'Production-ready REST API with authentication, validation, database ORM, and OpenAPI documentation.',
    ar: 'REST API جاهز للإنتاج مع المصادقة والتحقق و ORM لقاعدة البيانات وتوثيق OpenAPI.',
  },
  defaultStack: ['Node.js', 'TypeScript', 'Hono', 'Prisma', 'PostgreSQL', 'Zod'],
  protectedFiles: [
    '.env', '.env.local', '.env.production',
    'prisma/migrations/**', '*.pem', '*.key',
    'secrets/**', '.git/**',
  ],
  baseSteps: [
    {
      id: '01_project_setup',
      title: { en: 'Project setup', ar: 'إعداد المشروع' },
      type: 'setup',
      goal: {
        en: 'Bootstrap a Node.js TypeScript API project using Hono (or Express). Configure tsup for bundling, nodemon for dev, and ESLint + Prettier.',
        ar: 'إنشاء مشروع API Node.js TypeScript باستخدام Hono (أو Express). تكوين tsup للتجميع وnodemon للتطوير وESLint + Prettier.',
      },
      recommendedLibraries: [
        { name: 'hono', purpose: 'Lightweight, edge-compatible web framework', required: true, alternative: 'express + @types/express' },
        { name: 'typescript', purpose: 'Type safety', required: true },
        { name: 'tsup', purpose: 'TypeScript bundler', required: true },
        { name: 'tsx', purpose: 'Run TypeScript directly in dev', required: true },
        { name: 'dotenv', purpose: 'Environment variable loading', required: true },
      ],
      successCriteria: {
        en: [
          '`npm run dev` starts the server on port 3000 with auto-reload',
          '`npm run build` produces a clean dist/ folder',
          'TypeScript strict mode enabled',
          'GET /health returns { status: "ok", timestamp: ISO-string }',
          '.env.example documents all required variables',
        ],
        ar: [
          'يبدأ `npm run dev` الخادم على المنفذ 3000 مع إعادة التحميل التلقائي',
          'يُنتج `npm run build` مجلد dist/ نظيفًا',
          'وضع TypeScript الصارم مُفعَّل',
          'يُرجع GET /health { status: "ok", timestamp: سلسلة-ISO }',
          'يوثق .env.example جميع المتغيرات المطلوبة',
        ],
      },
      restrictions: {
        en: [
          'Do not add any business routes in this step — only the server skeleton.',
          'Do not disable TypeScript strict mode.',
        ],
        ar: [
          'لا تضف أي مسارات أعمال في هذه الخطوة — فقط هيكل الخادم.',
          'لا تعطّل وضع TypeScript الصارم.',
        ],
      },
      dependsOn: [],
    },
    {
      id: '03_middleware',
      title: { en: 'Middleware stack', ar: 'حزمة الوسيط' },
      type: 'setup',
      goal: {
        en: 'Configure request pipeline: CORS, Helmet security headers, request logging, global error handler, and request ID injection.',
        ar: 'تكوين خط أنابيب الطلب: CORS ورؤوس أمان Helmet وتسجيل الطلبات ومعالج الأخطاء العالمي وحقن معرف الطلب.',
      },
      recommendedLibraries: [
        { name: 'hono/cors', purpose: 'CORS middleware', required: true },
        { name: 'hono/logger', purpose: 'Request logging', required: true },
        { name: 'pino', purpose: 'Structured JSON logging', required: true },
        { name: 'pino-pretty', purpose: 'Human-readable dev logs', required: false },
      ],
      successCriteria: {
        en: [
          'CORS origins configurable via environment variable',
          'Every request has a unique X-Request-ID header',
          'Unhandled errors return { error: message, requestId } with a 500 status',
          'Request logs include method, path, status, and duration in JSON',
        ],
        ar: [
          'أصول CORS قابلة للتكوين عبر متغير البيئة',
          'كل طلب له رأس X-Request-ID فريد',
          'تُرجع الأخطاء غير المعالجة { error: رسالة، requestId } بحالة 500',
          'سجلات الطلب تتضمن الطريقة والمسار والحالة والمدة بتنسيق JSON',
        ],
      },
      restrictions: {
        en: [
          'Do not log request bodies in production — they may contain PII.',
          'Do not silence errors in the global handler — always log the stack trace.',
        ],
        ar: [
          'لا تسجل نصوص الطلبات في الإنتاج — قد تحتوي على PII.',
          'لا تكتم الأخطاء في المعالج العالمي — سجّل دائمًا تتبع المكدس.',
        ],
      },
      dependsOn: ['01_project_setup'],
    },
    {
      id: '05_core_routes',
      title: { en: 'Core API routes', ar: 'مسارات API الأساسية' },
      type: 'implementation',
      goal: {
        en: 'Implement the primary resource endpoints (CRUD operations). Structure with route files, controller functions, and a service layer.',
        ar: 'تنفيذ نقاط نهاية الموارد الأساسية (عمليات CRUD). الهيكلة مع ملفات المسارات ووظائف التحكم وطبقة الخدمة.',
      },
      recommendedLibraries: [
        { name: 'zod', purpose: 'Request/response validation', required: true },
        { name: '@hono/zod-validator', purpose: 'Hono middleware for Zod validation', required: true },
      ],
      successCriteria: {
        en: [
          'List endpoint returns paginated results with meta.total, meta.page, meta.perPage',
          'Create endpoint returns 201 with the created resource',
          'Update uses PATCH semantics (partial updates)',
          'Delete returns 204 on success, 404 if not found',
          'All routes documented inline with JSDoc for OpenAPI generation',
        ],
        ar: [
          'تُرجع نقطة نهاية القائمة نتائج مُقسَّمة مع meta.total وmeta.page وmeta.perPage',
          'تُرجع نقطة نهاية الإنشاء 201 مع المورد المُنشأ',
          'يستخدم التحديث دلالات PATCH (التحديثات الجزئية)',
          'يُرجع الحذف 204 عند النجاح، 404 إذا لم يُوجَد',
          'جميع المسارات موثقة بـ JSDoc لإنشاء OpenAPI',
        ],
      },
      restrictions: {
        en: [
          'Do not put business logic in route handlers — use a service layer.',
          'Do not return database row objects directly — transform to API response shapes.',
        ],
        ar: [
          'لا تضع منطق الأعمال في معالجات المسارات — استخدم طبقة الخدمة.',
          'لا تُرجع كائنات صفوف قاعدة البيانات مباشرةً — حوّلها إلى أشكال استجابة API.',
        ],
      },
      dependsOn: ['03_middleware'],
    },
    {
      id: '06_validation',
      title: { en: 'Input validation', ar: 'التحقق من المدخلات' },
      type: 'implementation',
      goal: {
        en: 'Define Zod schemas for all request bodies, query parameters, and path params. Centralise schemas in a schemas/ folder for reuse.',
        ar: 'تعريف مخططات Zod لجميع نصوص الطلبات ومعاملات الاستعلام ومعاملات المسار. مركزة المخططات في مجلد schemas/ لإعادة الاستخدام.',
      },
      recommendedLibraries: [
        { name: 'zod', purpose: 'Schema validation and TypeScript type inference', required: true },
      ],
      successCriteria: {
        en: [
          'Invalid requests return 422 with a structured errors array',
          'Schema types are inferred and reused in service layer (no duplication)',
          'Query param coercion handled (strings → numbers, comma-separated → arrays)',
          'All schemas exported from a single schemas/index.ts barrel',
        ],
        ar: [
          'تُرجع الطلبات غير الصالحة 422 مع مصفوفة أخطاء منظمة',
          'أنواع المخطط مُستنتَجة ومُعاد استخدامها في طبقة الخدمة (لا ازدواجية)',
          'يُعالَج إكراه معاملات الاستعلام (سلاسل نصية → أرقام، مفصولة بفواصل → مصفوفات)',
          'جميع المخططات مُصدَّرة من برميل schemas/index.ts واحد',
        ],
      },
      restrictions: {
        en: [
          'Do not validate in the controller — middleware should handle it before the handler runs.',
        ],
        ar: [
          'لا تتحقق في المتحكم — يجب أن يعالجه الوسيط قبل تشغيل المعالج.',
        ],
      },
      dependsOn: ['05_core_routes'],
    },
    {
      id: '08_documentation',
      title: { en: 'API documentation', ar: 'توثيق API' },
      type: 'implementation',
      goal: {
        en: 'Generate an OpenAPI 3.1 spec from route definitions and serve Scalar or Swagger UI at /docs.',
        ar: 'إنشاء مواصفة OpenAPI 3.1 من تعريفات المسار وخدمة Scalar أو Swagger UI على /docs.',
      },
      recommendedLibraries: [
        { name: '@hono/zod-openapi', purpose: 'Generate OpenAPI spec from Zod schemas + Hono routes', required: true },
        { name: '@scalar/hono-api-reference', purpose: 'Beautiful API docs UI', required: false, alternative: 'swagger-ui' },
      ],
      successCriteria: {
        en: [
          '/docs renders interactive API documentation',
          '/openapi.json returns a valid OpenAPI 3.1 document',
          'All endpoints have summary, description, and example responses',
          'Authentication scheme documented in securitySchemes',
        ],
        ar: [
          'تُصيِّر /docs توثيق API تفاعليًا',
          'تُرجع /openapi.json وثيقة OpenAPI 3.1 صالحة',
          'جميع نقاط النهاية لها ملخص ووصف واستجابات مثال',
          'مخطط المصادقة موثق في securitySchemes',
        ],
      },
      restrictions: {
        en: [
          'Do not expose /docs in production without auth protection.',
        ],
        ar: [
          'لا تكشف /docs في الإنتاج بدون حماية مصادقة.',
        ],
      },
      dependsOn: ['06_validation'],
    },
    {
      id: '08b_error_monitoring',
      title: { en: 'Error monitoring', ar: 'مراقبة الأخطاء' },
      type: 'integration',
      goal: {
        en: 'Integrate Sentry for server-side error tracking. Capture unhandled rejections, slow requests, and database errors.',
        ar: 'دمج Sentry لتتبع الأخطاء من جانب الخادم. التقاط الرفضات غير المعالجة والطلبات البطيئة وأخطاء قاعدة البيانات.',
      },
      recommendedLibraries: [
        { name: '@sentry/node', purpose: 'Server-side error and performance monitoring', required: true },
        { name: '@sentry/profiling-node', purpose: 'CPU profiling for slow requests', required: false },
      ],
      successCriteria: {
        en: [
          'Sentry DSN loaded from environment variable',
          'Every unhandled promise rejection captured and reported',
          'Request IDs included in Sentry breadcrumbs for correlation',
          'Slow DB queries (>500 ms) flagged as performance issues',
          'Sentry alerts configured for error spike threshold',
        ],
        ar: [
          'DSN الخاص بـ Sentry مُحمَّل من متغير البيئة',
          'كل رفض وعد غير معالج يُلتقَط ويُبلَّغ عنه',
          'معرفات الطلبات مُدرجة في مسارات فتات الخبز في Sentry للربط',
          'استعلامات DB البطيئة (>500 مللي ثانية) مُوسَّمة كمشكلات أداء',
          'تنبيهات Sentry مُكوَّنة لعتبة ارتفاع الأخطاء',
        ],
      },
      restrictions: {
        en: [
          'Do not capture request bodies in Sentry — they may contain PII.',
        ],
        ar: [
          'لا تلتقط نصوص الطلبات في Sentry — قد تحتوي على PII.',
        ],
      },
      dependsOn: ['08_documentation'],
    },
    {
      id: '09_testing',
      title: { en: 'Testing', ar: 'الاختبار' },
      type: 'verification',
      goal: {
        en: 'Write integration tests for every route using Hono test client. Test happy paths and error scenarios.',
        ar: 'كتابة اختبارات التكامل لكل مسار باستخدام عميل اختبار Hono. اختبار المسارات السعيدة وسيناريوهات الخطأ.',
      },
      recommendedLibraries: [
        { name: 'vitest', purpose: 'Fast test runner', required: true },
        { name: '@hono/testing', purpose: 'In-process Hono test client', required: true },
        { name: 'prisma-mock', purpose: 'Mock Prisma client in unit tests', required: false },
      ],
      successCriteria: {
        en: [
          'All CRUD routes tested (create, read list, read single, update, delete)',
          'Validation errors tested: missing fields, wrong types, out-of-range values',
          '401/403 tested on protected routes',
          'Tests run in under 30 seconds',
        ],
        ar: [
          'اختبار جميع مسارات CRUD (إنشاء، قراءة قائمة، قراءة مفردة، تحديث، حذف)',
          'اختبار أخطاء التحقق: الحقول المفقودة والأنواع الخاطئة والقيم خارج النطاق',
          'اختبار 401/403 على المسارات المحمية',
          'تعمل الاختبارات في أقل من 30 ثانية',
        ],
      },
      restrictions: {
        en: [
          'Do not use real external services in tests — mock all third-party calls.',
        ],
        ar: [
          'لا تستخدم خدمات خارجية حقيقية في الاختبارات — قم بمحاكاة جميع استدعاءات الطرف الثالث.',
        ],
      },
      dependsOn: ['08_documentation'],
    },
    {
      id: '10_deployment',
      title: { en: 'Deployment', ar: 'النشر' },
      type: 'delivery',
      goal: {
        en: 'Write a Dockerfile, configure health checks, document environment variables, and prepare for cloud deployment.',
        ar: 'كتابة Dockerfile وتكوين فحوصات الصحة وتوثيق متغيرات البيئة والتحضير للنشر السحابي.',
      },
      recommendedLibraries: [
        { name: 'docker', purpose: 'Container packaging', required: false },
      ],
      successCriteria: {
        en: [
          'Dockerfile produces a minimal image under 200 MB',
          'GET /health returns 200 (used by load balancer)',
          'All environment variables documented in .env.example',
          'Graceful shutdown handles SIGTERM: drains requests and closes DB connections',
          'Database migration runs automatically on startup',
        ],
        ar: [
          'يُنتج Dockerfile صورة بحجم أقل من 200 ميغابايت',
          'يُرجع GET /health 200 (يُستخدم من قِبَل موازن التحميل)',
          'جميع متغيرات البيئة موثقة في .env.example',
          'يتعامل الإغلاق الأنيق مع SIGTERM: يُفرغ الطلبات ويُغلق اتصالات قاعدة البيانات',
          'يعمل ترحيل قاعدة البيانات تلقائيًا عند بدء التشغيل',
        ],
      },
      restrictions: {
        en: [
          'Do not run the app as root inside Docker.',
          'Do not hardcode the PORT — read from process.env.PORT.',
        ],
        ar: [
          'لا تشغّل التطبيق كـ root داخل Docker.',
          'لا تُرمِّز PORT بشكل ثابت — اقرأ من process.env.PORT.',
        ],
      },
      dependsOn: ['09_testing'],
    },
  ],
  conditionalSteps: [
    {
      id: '02_database_schema',
      title: { en: 'Database schema', ar: 'مخطط قاعدة البيانات' },
      type: 'setup',
      goal: {
        en: 'Define Prisma schema for all resources. Write and apply the initial migration. Add a seed script for development data.',
        ar: 'تعريف مخطط Prisma لجميع الموارد. كتابة الترحيل الأولي وتطبيقه. إضافة سكريبت بذر لبيانات التطوير.',
      },
      includeWhen: (f) => f.includes('database'),
      recommendedLibraries: [
        { name: 'prisma', purpose: 'ORM + migration tool', required: true },
        { name: '@prisma/client', purpose: 'Type-safe DB client', required: true },
      ],
      successCriteria: {
        en: [
          'All resource models defined in schema.prisma',
          '`prisma migrate dev` applies without errors',
          'Foreign key relations enforced at the database level',
          'Indexes on all filterable and sortable fields',
        ],
        ar: [
          'جميع نماذج الموارد مُعرَّفة في schema.prisma',
          'يُطبَّق `prisma migrate dev` بدون أخطاء',
          'علاقات المفاتيح الأجنبية مُفرَّضة على مستوى قاعدة البيانات',
          'فهارس على جميع الحقول القابلة للتصفية والفرز',
        ],
      },
      restrictions: {
        en: [
          'Do not use raw SQL strings inside the application code — use Prisma client methods.',
        ],
        ar: [
          'لا تستخدم سلاسل SQL الخام داخل كود التطبيق — استخدم أساليب Prisma client.',
        ],
      },
      dependsOn: ['01_project_setup'],
    },
    {
      id: '04_authentication',
      title: { en: 'Authentication', ar: 'المصادقة' },
      type: 'implementation',
      goal: {
        en: 'Implement JWT-based authentication. Provide /auth/register, /auth/login, /auth/refresh endpoints. Protect routes with an auth middleware.',
        ar: 'تنفيذ المصادقة القائمة على JWT. توفير نقاط نهاية /auth/register و/auth/login و/auth/refresh. حماية المسارات بوسيط مصادقة.',
      },
      includeWhen: (f) => f.includes('auth'),
      recommendedLibraries: [
        { name: 'hono/jwt', purpose: 'JWT sign/verify middleware', required: true },
        { name: 'bcryptjs', purpose: 'Password hashing', required: true },
        { name: 'nanoid', purpose: 'Refresh token generation', required: true },
      ],
      successCriteria: {
        en: [
          '/auth/login returns accessToken (15 min) + refreshToken (7 days)',
          '/auth/refresh rotates the refresh token (old one invalidated)',
          'Protected routes return 401 with missing token, 403 with invalid/expired token',
          'Passwords stored as bcrypt hashes (cost factor ≥ 12)',
          'Refresh tokens stored hashed in DB, not plaintext',
        ],
        ar: [
          'تُرجع /auth/login accessToken (15 دقيقة) + refreshToken (7 أيام)',
          'تُدوِّر /auth/refresh رمز التحديث (الرمز القديم مُبطَل)',
          'تُرجع المسارات المحمية 401 مع رمز مفقود، 403 مع رمز غير صالح/منتهي الصلاحية',
          'كلمات المرور مخزنة كتجزئات bcrypt (عامل التكلفة ≥ 12)',
          'رموز التحديث مخزنة مُجزَّأة في قاعدة البيانات، وليس كنص عادي',
        ],
      },
      restrictions: {
        en: [
          'Do not put the JWT secret in code — use process.env.JWT_SECRET.',
          'Do not use HS256 for production JWTs — prefer RS256 with a key pair.',
        ],
        ar: [
          'لا تضع سر JWT في الكود — استخدم process.env.JWT_SECRET.',
          'لا تستخدم HS256 لـ JWT الإنتاج — يُفضَّل RS256 مع زوج مفاتيح.',
        ],
      },
      dependsOn: ['02_database_schema'],
    },
    {
      id: '07_rate_limiting',
      title: { en: 'Rate limiting & CORS', ar: 'تحديد المعدل و CORS' },
      type: 'implementation',
      goal: {
        en: 'Apply per-IP rate limiting and fine-grained CORS policy. Add a circuit breaker for downstream services.',
        ar: 'تطبيق تحديد المعدل لكل IP وسياسة CORS دقيقة. إضافة قاطع دائرة للخدمات الداخلية.',
      },
      includeWhen: (f) => f.includes('rate-limiting'),
      recommendedLibraries: [
        { name: '@hono/rate-limiter', purpose: 'Rate limiting middleware', required: true },
        { name: 'ioredis', purpose: 'Redis-backed rate limit store for multi-instance deployments', required: false },
      ],
      successCriteria: {
        en: [
          'Rate limit headers (X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After) on every response',
          'Auth endpoints limited to 10 attempts / 15 minutes per IP',
          'CORS origin allowlist configured from environment variable',
          'Preflight OPTIONS requests respond with correct headers',
        ],
        ar: [
          'رؤوس حد المعدل (X-RateLimit-Limit وX-RateLimit-Remaining وRetry-After) على كل استجابة',
          'نقاط نهاية المصادقة محدودة بـ 10 محاولات / 15 دقيقة لكل IP',
          'قائمة السماح بأصول CORS مُكوَّنة من متغير البيئة',
          'تستجيب طلبات OPTIONS التمهيدية بالرؤوس الصحيحة',
        ],
      },
      restrictions: {
        en: [
          'Do not use in-memory rate limit store in multi-instance deployments — use Redis.',
        ],
        ar: [
          'لا تستخدم مخزن حد المعدل في الذاكرة في عمليات النشر متعددة الأمثلة — استخدم Redis.',
        ],
      },
      dependsOn: ['03_middleware'],
    },
  ],
};

export default restApi;
