import type { Template } from '../types';

const nextjsSaas: Template = {
  id: 'nextjs-saas',
  kind: 'web-app',
  name: { en: 'Next.js SaaS App', ar: 'تطبيق SaaS بـ Next.js' },
  description: {
    en: 'Full-stack SaaS application with auth, database, billing, and admin panel.',
    ar: 'تطبيق SaaS متكامل مع المصادقة وقاعدة البيانات والفوترة ولوحة الإدارة.',
  },
  defaultStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Prisma', 'PostgreSQL', 'NextAuth.js'],
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
        en: 'Bootstrap a Next.js 14+ project with TypeScript, Tailwind CSS, ESLint, and Prettier. Establish folder structure and base configuration.',
        ar: 'إنشاء مشروع Next.js 14+ مع TypeScript وTailwind CSS وESLint وPrettier. إعداد هيكل المجلدات والإعدادات الأساسية.',
      },
      recommendedLibraries: [
        { name: 'next', purpose: 'Framework', required: true },
        { name: 'typescript', purpose: 'Type safety', required: true },
        { name: 'tailwindcss', purpose: 'Utility-first styling', required: true },
        { name: 'eslint', purpose: 'Code quality', required: true },
        { name: 'prettier', purpose: 'Code formatting', required: true },
      ],
      successCriteria: {
        en: [
          '`npm run dev` boots without errors on localhost:3000',
          'TypeScript strict mode is enabled in tsconfig.json',
          'ESLint passes with zero warnings on a fresh project',
          'Tailwind CSS renders utility classes in the browser',
          '.env.local is listed in .gitignore',
        ],
        ar: [
          'يعمل `npm run dev` بدون أخطاء على localhost:3000',
          'وضع TypeScript الصارم مُفعَّل في tsconfig.json',
          'ESLint يمر بدون تحذيرات على المشروع الجديد',
          'يُصيِّر Tailwind CSS فئات الأدوات في المتصفح',
          'مُدرج .env.local في .gitignore',
        ],
      },
      restrictions: {
        en: [
          'Do not add any business logic or UI components yet.',
          'Do not install database drivers or auth packages in this step.',
        ],
        ar: [
          'لا تضف أي منطق أعمال أو مكونات واجهة مستخدم بعد.',
          'لا تثبت برامج تشغيل قاعدة البيانات أو حزم المصادقة في هذه الخطوة.',
        ],
      },
      dependsOn: [],
    },
    {
      id: '02_design_system',
      title: { en: 'Design system', ar: 'نظام التصميم' },
      type: 'setup',
      goal: {
        en: 'Install and configure shadcn/ui. Define color tokens, typography scale, and spacing. Create base layout primitives (Container, Stack, Grid).',
        ar: 'تثبيت وإعداد shadcn/ui. تعريف رموز الألوان ومقياس الطباعة والتباعد. إنشاء عناصر التخطيط الأساسية.',
      },
      recommendedLibraries: [
        { name: 'shadcn/ui', purpose: 'Accessible component primitives', required: true },
        { name: 'lucide-react', purpose: 'Icon set', required: true },
        { name: 'class-variance-authority', purpose: 'Variant-based component styling', required: true },
        { name: 'clsx', purpose: 'Conditional class names', required: true },
        { name: 'tailwind-merge', purpose: 'Merge Tailwind classes without conflicts', required: true },
      ],
      successCriteria: {
        en: [
          'shadcn/ui CLI initialised; at least Button, Card, Input, Dialog added',
          'CSS custom properties for color tokens defined in globals.css',
          'Dark mode toggle works via next-themes',
          'Typography scale documented in a Storybook story or README section',
        ],
        ar: [
          'تم تهيئة واجهة سطر أوامر shadcn/ui؛ تمت إضافة Button وCard وInput وDialog على الأقل',
          'خصائص CSS المخصصة لرموز الألوان مُعرَّفة في globals.css',
          'يعمل مبدّل الوضع المظلم عبر next-themes',
          'مقياس الطباعة موثق في قصة Storybook أو قسم README',
        ],
      },
      restrictions: {
        en: [
          'Do not build any feature-specific UI here — only the design system primitives.',
          'Do not pin shadcn component versions manually; use the CLI to stay in sync.',
        ],
        ar: [
          'لا تبني أي واجهة مستخدم خاصة بميزات هنا — فقط عناصر نظام التصميم الأساسية.',
          'لا تثبّت إصدارات مكونات shadcn يدويًا؛ استخدم واجهة سطر الأوامر للبقاء متزامنًا.',
        ],
      },
      dependsOn: ['01_project_setup'],
    },
    {
      id: '05_main_layout',
      title: { en: 'Main layout', ar: 'التخطيط الرئيسي' },
      type: 'implementation',
      goal: {
        en: 'Build the application shell: top navigation, sidebar (if applicable), footer, and route-based breadcrumbs. Ensure mobile responsiveness.',
        ar: 'بناء غلاف التطبيق: التنقل العلوي والشريط الجانبي (إن وجد) والتذييل والمسارات التنقلية القائمة على المسار. ضمان التجاوب مع الأجهزة المحمولة.',
      },
      recommendedLibraries: [
        { name: 'next/navigation', purpose: 'Router hooks for active link detection', required: true },
        { name: 'next-themes', purpose: 'Theme switching', required: true },
      ],
      successCriteria: {
        en: [
          'Navigation links highlight the active route',
          'Layout renders correctly on 375 px (mobile), 768 px (tablet), 1440 px (desktop)',
          'Keyboard navigation through nav items works without a mouse',
          'Page title updates on route change via Next.js metadata API',
        ],
        ar: [
          'تُبرز روابط التنقل المسار النشط',
          'يُصيِّر التخطيط بشكل صحيح على 375 بكسل (موبايل) و768 بكسل (تابلت) و1440 بكسل (سطح المكتب)',
          'يعمل التنقل بلوحة المفاتيح عبر عناصر القائمة بدون ماوس',
          'يتحدث عنوان الصفحة عند تغيير المسار عبر واجهة برمجة تطبيقات بيانات التعريف في Next.js',
        ],
      },
      restrictions: {
        en: [
          'Do not hard-code route paths — use constants from a central routes file.',
          'Do not add feature-specific content inside the layout component.',
        ],
        ar: [
          'لا تُرمِّز مسارات المسار بشكل ثابت — استخدم الثوابت من ملف مسارات مركزي.',
          'لا تضف محتوى خاصًا بالميزات داخل مكون التخطيط.',
        ],
      },
      dependsOn: ['02_design_system'],
    },
    {
      id: '06_core_feature',
      title: { en: 'Core feature', ar: 'الميزة الأساسية' },
      type: 'implementation',
      goal: {
        en: 'Implement the primary value-delivering feature of the SaaS. This is the heart of the product — the thing users pay for.',
        ar: 'تنفيذ الميزة الأساسية التي تُقدِّم القيمة في تطبيق SaaS. هذا هو جوهر المنتج — الشيء الذي يدفع المستخدمون مقابله.',
      },
      recommendedLibraries: [
        { name: 'zod', purpose: 'Runtime validation for user inputs', required: true },
        { name: 'react-hook-form', purpose: 'Form state management', required: true },
        { name: '@tanstack/react-query', purpose: 'Server-state synchronisation', required: true },
      ],
      successCriteria: {
        en: [
          'Happy path: user can complete the core workflow end-to-end',
          'All user inputs are validated with Zod schemas',
          'Error states are displayed with actionable messages',
          'Loading states use skeleton loaders, not spinners',
          'Feature is accessible (ARIA roles, keyboard operation)',
        ],
        ar: [
          'المسار السعيد: يمكن للمستخدم إتمام سير العمل الأساسي من البداية إلى النهاية',
          'يتم التحقق من صحة جميع مدخلات المستخدم بمخططات Zod',
          'تُعرض حالات الخطأ برسائل قابلة للتنفيذ',
          'تستخدم حالات التحميل هياكل عظمية بدلاً من المؤشرات الدوارة',
          'الميزة قابلة للوصول (أدوار ARIA، التشغيل بلوحة المفاتيح)',
        ],
      },
      restrictions: {
        en: [
          'Do not add billing checks here — those belong in a middleware guard.',
          'Do not skip loading and error states even for MVP.',
        ],
        ar: [
          'لا تضف فحوصات الفوترة هنا — تلك تنتمي إلى حارس الوسيط.',
          'لا تتخطى حالات التحميل والأخطاء حتى في النسخة الأولية.',
        ],
      },
      dependsOn: ['05_main_layout'],
    },
    {
      id: '07_api_routes',
      title: { en: 'API routes', ar: 'مسارات API' },
      type: 'implementation',
      goal: {
        en: 'Implement Next.js Route Handlers for all data mutations and queries. Validate inputs with Zod, return typed JSON responses.',
        ar: 'تنفيذ معالجات مسارات Next.js لجميع تحولات البيانات والاستعلامات. التحقق من صحة المدخلات بـ Zod وإرجاع استجابات JSON مكتوبة.',
      },
      recommendedLibraries: [
        { name: 'zod', purpose: 'Input validation', required: true },
        { name: 'next-safe-action', purpose: 'Type-safe server actions', required: false, alternative: 'native Route Handlers' },
      ],
      successCriteria: {
        en: [
          'All mutations use POST/PUT/PATCH/DELETE — no side effects on GET',
          'Every route validates its request body with Zod before touching the DB',
          'HTTP status codes are semantically correct (201 for create, 404 for missing, 422 for validation)',
          'API responses follow a consistent shape: { data?, error?, meta? }',
        ],
        ar: [
          'تستخدم جميع التحولات POST/PUT/PATCH/DELETE — لا آثار جانبية على GET',
          'كل مسار يتحقق من صحة نص الطلب باستخدام Zod قبل لمس قاعدة البيانات',
          'رموز حالة HTTP صحيحة دلاليًا (201 للإنشاء، 404 للمفقود، 422 للتحقق)',
          'تتبع استجابات API شكلًا متسقًا: { data?, error?, meta? }',
        ],
      },
      restrictions: {
        en: [
          'Do not call the database directly from client components — always go through a Route Handler or server action.',
          'Do not expose internal database IDs — use UUIDs or slugs.',
        ],
        ar: [
          'لا تستدعي قاعدة البيانات مباشرةً من مكونات العميل — اذهب دائمًا عبر معالج مسار أو إجراء خادم.',
          'لا تكشف معرفات قاعدة البيانات الداخلية — استخدم UUIDs أو slugs.',
        ],
      },
      dependsOn: ['06_core_feature'],
    },
    {
      id: '09_error_monitoring',
      title: { en: 'Error monitoring', ar: 'مراقبة الأخطاء' },
      type: 'integration',
      goal: {
        en: 'Integrate Sentry for error tracking. Capture frontend exceptions, server-side errors, and API route failures with source maps.',
        ar: 'دمج Sentry لتتبع الأخطاء. التقاط استثناءات الواجهة الأمامية وأخطاء جانب الخادم وإخفاقات مسارات API مع خرائط المصدر.',
      },
      recommendedLibraries: [
        { name: '@sentry/nextjs', purpose: 'Full-stack error and performance monitoring', required: true },
      ],
      successCriteria: {
        en: [
          'Sentry SDK initialised in sentry.client.config.ts and sentry.server.config.ts',
          'Source maps uploaded to Sentry on every production build',
          'Unhandled promise rejections captured automatically',
          'Custom error boundary wraps the root layout and reports to Sentry',
          'Sentry DSN stored in environment variable, not hardcoded',
        ],
        ar: [
          'Sentry SDK مُهيَّأ في sentry.client.config.ts وsentry.server.config.ts',
          'يتم رفع خرائط المصدر إلى Sentry عند كل بنية إنتاج',
          'رفض الوعود غير المعالجة يُلتقَط تلقائيًا',
          'حدود الخطأ المخصصة تلتف حول التخطيط الجذر وتُبلّغ عنها إلى Sentry',
          'DSN الخاص بـ Sentry مخزَّن في متغير البيئة، وليس مُرمَّزًا',
        ],
      },
      restrictions: {
        en: [
          'Do not log PII (emails, names, tokens) in Sentry breadcrumbs.',
          'Do not enable performance tracing at 100% sample rate in production — use 0.1 or lower.',
        ],
        ar: [
          'لا تسجل PII (رسائل البريد الإلكتروني والأسماء والرموز) في مسارات فتات الخبز في Sentry.',
          'لا تُفعّل تتبع الأداء بمعدل أخذ عينات 100% في الإنتاج — استخدم 0.1 أو أقل.',
        ],
      },
      dependsOn: ['07_api_routes'],
    },
    {
      id: '10_testing',
      title: { en: 'Testing', ar: 'الاختبار' },
      type: 'verification',
      goal: {
        en: 'Write unit tests for utility functions and integration tests for API routes. Achieve meaningful coverage on the critical path.',
        ar: 'كتابة اختبارات الوحدة للوظائف المساعدة واختبارات التكامل لمسارات API. تحقيق تغطية ذات مغزى على المسار الحرج.',
      },
      recommendedLibraries: [
        { name: 'vitest', purpose: 'Fast unit test runner', required: true },
        { name: '@testing-library/react', purpose: 'Component integration tests', required: true },
        { name: 'msw', purpose: 'API mocking for integration tests', required: true },
        { name: 'playwright', purpose: 'End-to-end browser tests', required: false, alternative: 'cypress' },
      ],
      successCriteria: {
        en: [
          'All unit tests pass in CI',
          'Integration tests cover happy path and at least one error path for each API route',
          'No secrets or real credentials used in test fixtures',
          'Test run completes in under 60 seconds locally',
        ],
        ar: [
          'تجتاز جميع اختبارات الوحدة في CI',
          'تغطي اختبارات التكامل المسار السعيد وسارٌ خطأ واحد على الأقل لكل مسار API',
          'لا تُستخدم أسرار أو بيانات اعتماد حقيقية في تركيبات الاختبار',
          'يكتمل تشغيل الاختبار في أقل من 60 ثانية محليًا',
        ],
      },
      restrictions: {
        en: [
          'Do not mock the database in integration tests — use a test database or in-memory SQLite.',
          'Do not ship code with skipped tests — fix or delete them.',
        ],
        ar: [
          'لا تُوهِم قاعدة البيانات في اختبارات التكامل — استخدم قاعدة بيانات اختبار أو SQLite في الذاكرة.',
          'لا ترسل كودًا مع اختبارات متخطاة — أصلحها أو احذفها.',
        ],
      },
      dependsOn: ['07_api_routes'],
    },
    {
      id: '11_deployment',
      title: { en: 'Deployment', ar: 'النشر' },
      type: 'delivery',
      goal: {
        en: 'Prepare production build, configure environment variables, write deployment documentation, and perform a first production deploy.',
        ar: 'إعداد بنية الإنتاج وتكوين متغيرات البيئة وكتابة وثائق النشر وإجراء أول نشر للإنتاج.',
      },
      recommendedLibraries: [
        { name: 'vercel', purpose: 'Zero-config deployment', required: false, alternative: 'Fly.io / Railway' },
        { name: '@vercel/analytics', purpose: 'Web vitals + usage analytics', required: false },
      ],
      successCriteria: {
        en: [
          '`npm run build` succeeds with zero TypeScript errors',
          'All environment variables are documented in .env.example',
          'Production deployment is reachable and returns HTTP 200 on the health endpoint',
          'Database migrations are applied without manual intervention',
        ],
        ar: [
          'يعمل `npm run build` بنجاح بدون أخطاء TypeScript',
          'جميع متغيرات البيئة موثقة في .env.example',
          'نشر الإنتاج قابل للوصول ويُرجع HTTP 200 على نقطة نهاية الصحة',
          'يتم تطبيق ترحيلات قاعدة البيانات بدون تدخل يدوي',
        ],
      },
      restrictions: {
        en: [
          'Do not commit .env or .env.local to the repository.',
          'Do not use the development database for the production deployment.',
        ],
        ar: [
          'لا تُلزِم .env أو .env.local في المستودع.',
          'لا تستخدم قاعدة بيانات التطوير لنشر الإنتاج.',
        ],
      },
      dependsOn: ['10_testing'],
    },
  ],
  conditionalSteps: [
    {
      id: '03_database_schema',
      title: { en: 'Database schema', ar: 'مخطط قاعدة البيانات' },
      type: 'setup',
      goal: {
        en: 'Define Prisma schema for all entities. Write initial migration. Seed script for development data.',
        ar: 'تعريف مخطط Prisma لجميع الكيانات. كتابة الترحيل الأولي. سكريبت البذر لبيانات التطوير.',
      },
      includeWhen: (f) => f.includes('database'),
      recommendedLibraries: [
        { name: 'prisma', purpose: 'ORM + migrations', required: true },
        { name: '@prisma/client', purpose: 'Type-safe query client', required: true },
        { name: 'pg', purpose: 'PostgreSQL driver', required: false, alternative: 'mysql2 / better-sqlite3' },
      ],
      successCriteria: {
        en: [
          'Prisma schema has all models with correct relations and field types',
          '`prisma migrate dev` runs without errors',
          '`prisma db seed` inserts test records',
          'Prisma Studio shows seeded data',
          'All model IDs use UUIDs (cuid2 or uuid)',
        ],
        ar: [
          'مخطط Prisma يحتوي على جميع النماذج مع العلاقات الصحيحة وأنواع الحقول',
          'يعمل `prisma migrate dev` بدون أخطاء',
          'يُدرج `prisma db seed` سجلات اختبار',
          'يُظهر Prisma Studio البيانات المزروعة',
          'تستخدم جميع معرفات النماذج UUIDs (cuid2 أو uuid)',
        ],
      },
      restrictions: {
        en: [
          'Do not manually edit migration files after they are created.',
          'Do not store passwords in plaintext — always hash before persisting.',
        ],
        ar: [
          'لا تعدّل ملفات الترحيل يدويًا بعد إنشائها.',
          'لا تخزن كلمات المرور بنص عادي — قم دائمًا بتجزئتها قبل الحفظ.',
        ],
      },
      dependsOn: ['01_project_setup'],
    },
    {
      id: '04_authentication',
      title: { en: 'Authentication', ar: 'المصادقة' },
      type: 'implementation',
      goal: {
        en: 'Implement authentication with NextAuth.js v5. Support email/password and at least one OAuth provider. Protect all authenticated routes via middleware.',
        ar: 'تنفيذ المصادقة باستخدام NextAuth.js v5. دعم البريد الإلكتروني/كلمة المرور وموفر OAuth واحد على الأقل. حماية جميع المسارات المصادق عليها عبر الوسيط.',
      },
      includeWhen: (f) => f.includes('auth'),
      recommendedLibraries: [
        { name: 'next-auth', purpose: 'Authentication framework', required: true },
        { name: 'bcryptjs', purpose: 'Password hashing', required: true },
        { name: '@auth/prisma-adapter', purpose: 'Prisma session store', required: false },
      ],
      successCriteria: {
        en: [
          'Sign-up, sign-in, and sign-out flows work end-to-end',
          'Protected routes redirect unauthenticated users to /login',
          'JWT tokens refresh silently on expiry',
          'Email verification sent on new account creation',
          'Password reset flow is functional',
        ],
        ar: [
          'تعمل تدفقات الاشتراك وتسجيل الدخول وتسجيل الخروج من البداية إلى النهاية',
          'تعيد المسارات المحمية توجيه المستخدمين غير المصادق عليهم إلى /login',
          'تتجدد رموز JWT بصمت عند انتهاء الصلاحية',
          'يُرسل التحقق من البريد الإلكتروني عند إنشاء حساب جديد',
          'تدفق إعادة تعيين كلمة المرور يعمل',
        ],
      },
      restrictions: {
        en: [
          'Do not store session tokens in localStorage — use httpOnly cookies.',
          'Do not skip email verification for production builds.',
        ],
        ar: [
          'لا تخزن رموز الجلسة في localStorage — استخدم ملفات تعريف الارتباط httpOnly.',
          'لا تتخطى التحقق من البريد الإلكتروني لبنيات الإنتاج.',
        ],
      },
      dependsOn: ['03_database_schema'],
    },
    {
      id: '08_admin_panel',
      title: { en: 'Admin panel', ar: 'لوحة الإدارة' },
      type: 'implementation',
      goal: {
        en: 'Build a password-protected admin dashboard with user management, usage metrics, and basic moderation tools.',
        ar: 'بناء لوحة إدارة محمية بكلمة مرور مع إدارة المستخدمين ومقاييس الاستخدام وأدوات الإشراف الأساسية.',
      },
      includeWhen: (f) => f.includes('admin'),
      recommendedLibraries: [
        { name: '@tanstack/react-table', purpose: 'Data tables with sorting/filtering', required: true },
        { name: 'recharts', purpose: 'Usage metric charts', required: false, alternative: 'chart.js' },
      ],
      successCriteria: {
        en: [
          'Admin routes are inaccessible to non-admin users (role check server-side)',
          'User list with search, filter, and pagination',
          'Admin can suspend/activate user accounts',
          'Key metrics dashboard (DAU, new signups, revenue) visible',
        ],
        ar: [
          'مسارات الإدارة غير قابلة للوصول للمستخدمين غير الإداريين (فحص الدور من جانب الخادم)',
          'قائمة المستخدمين مع البحث والتصفية وترقيم الصفحات',
          'يمكن للمسؤول تعليق/تفعيل حسابات المستخدمين',
          'لوحة المقاييس الرئيسية (DAU، الاشتراكات الجديدة، الإيرادات) مرئية',
        ],
      },
      restrictions: {
        en: [
          'Admin panel must be server-rendered — no client-side role checks as the sole guard.',
          'Do not expose raw database queries via admin API endpoints.',
        ],
        ar: [
          'يجب أن تكون لوحة الإدارة مُصيَّرة من جانب الخادم — لا فحوصات دور من جانب العميل كحارس وحيد.',
          'لا تكشف استعلامات قاعدة البيانات الخام عبر نقاط نهاية API الإدارية.',
        ],
      },
      dependsOn: ['04_authentication', '07_api_routes'],
    },
    {
      id: '09_payments',
      title: { en: 'Payments', ar: 'المدفوعات' },
      type: 'integration',
      goal: {
        en: 'Integrate Stripe for subscription billing: checkout, customer portal, webhook handler for lifecycle events.',
        ar: 'دمج Stripe للفوترة بالاشتراك: الدفع وبوابة العميل ومعالج webhook لأحداث دورة الحياة.',
      },
      includeWhen: (f) => f.includes('payments'),
      recommendedLibraries: [
        { name: 'stripe', purpose: 'Billing API client', required: true },
        { name: '@stripe/stripe-js', purpose: 'Browser-side Stripe SDK', required: true },
        { name: '@stripe/react-stripe-js', purpose: 'React components for payment elements', required: true },
      ],
      successCriteria: {
        en: [
          'Stripe Checkout session creates successfully with correct price ID',
          'Webhook handler verifies Stripe signatures before processing events',
          'Subscription status synced to database on: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted',
          'Customer portal link generated and functional',
          'Test mode payments work end-to-end with Stripe test cards',
        ],
        ar: [
          'تنشأ جلسة Stripe Checkout بنجاح بمعرف السعر الصحيح',
          'معالج webhook يتحقق من توقيعات Stripe قبل معالجة الأحداث',
          'حالة الاشتراك متزامنة مع قاعدة البيانات على: checkout.session.completed، customer.subscription.updated، customer.subscription.deleted',
          'رابط بوابة العميل مُنشأ وفعال',
          'تعمل مدفوعات وضع الاختبار من البداية إلى النهاية مع بطاقات اختبار Stripe',
        ],
      },
      restrictions: {
        en: [
          'Never log full card numbers or raw Stripe webhook payloads.',
          'Do not handle billing logic client-side — all Stripe operations must be server-side.',
          'Do not store Stripe secret keys in the frontend bundle.',
        ],
        ar: [
          'لا تسجل أرقام البطاقات الكاملة أو حمولات webhook الخام من Stripe.',
          'لا تعالج منطق الفوترة من جانب العميل — يجب أن تكون جميع عمليات Stripe من جانب الخادم.',
          'لا تخزن مفاتيح Stripe السرية في حزمة الواجهة الأمامية.',
        ],
      },
      dependsOn: ['04_authentication', '07_api_routes'],
    },
  ],
};

export default nextjsSaas;
