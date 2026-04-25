import type { Template } from '../types';

const browserExtension: Template = {
  id: 'browser-extension',
  kind: 'browser-extension',
  name: { en: 'Browser Extension', ar: 'إضافة المتصفح' },
  description: {
    en: 'Cross-browser extension with popup UI, background service worker, and content script injection.',
    ar: 'إضافة متصفح متعددة المنصات مع واجهة مستخدم منبثقة وعامل خدمة خلفي وحقن سكريبت المحتوى.',
  },
  defaultStack: ['TypeScript', 'React', 'WXT', 'Tailwind CSS', 'Vite'],
  protectedFiles: [
    '.env', '.env.local', 'secrets/**', '.git/**',
    'dist/**', 'web-ext-artifacts/**',
  ],
  baseSteps: [
    {
      id: '01_project_setup',
      title: { en: 'Project setup', ar: 'إعداد المشروع' },
      type: 'setup',
      goal: {
        en: 'Bootstrap a browser extension project using WXT (Web Extension Tools) with TypeScript and React. Configure manifest.json for Chrome and Firefox targets.',
        ar: 'إنشاء مشروع إضافة متصفح باستخدام WXT مع TypeScript وReact. تكوين manifest.json لأهداف Chrome وFirefox.',
      },
      recommendedLibraries: [
        { name: 'wxt', purpose: 'Extension build framework', required: true },
        { name: 'react', purpose: 'Popup/options UI', required: true },
        { name: 'typescript', purpose: 'Type safety across all extension contexts', required: true },
        { name: 'tailwindcss', purpose: 'Popup styling', required: true },
      ],
      successCriteria: {
        en: [
          '`npm run dev` opens Chrome with the extension loaded in developer mode',
          'manifest.json declares correct permissions and version',
          'TypeScript compiles without errors',
          'Hot reload works during development without manual extension reload',
        ],
        ar: [
          'يفتح `npm run dev` Chrome مع تحميل الإضافة في وضع المطور',
          'يُعلن manifest.json عن الأذونات والإصدار الصحيح',
          'يُترجم TypeScript بدون أخطاء',
          'يعمل Hot reload أثناء التطوير بدون إعادة تحميل يدوية للإضافة',
        ],
      },
      restrictions: {
        en: [
          'Do not use Manifest V2 — target Manifest V3 for all new extensions.',
          'Do not add broad host permissions (<all_urls>) without justification.',
        ],
        ar: [
          'لا تستخدم Manifest V2 — استهدف Manifest V3 لجميع الإضافات الجديدة.',
          'لا تضف أذونات مضيف واسعة (<all_urls>) بدون مسوّغ.',
        ],
      },
      dependsOn: [],
    },
    {
      id: '02_popup_ui',
      title: { en: 'Popup UI', ar: 'واجهة مستخدم النافذة المنبثقة' },
      type: 'implementation',
      goal: {
        en: 'Build the extension popup with React. Design should be clean, minimal, and fit within the standard 400×600 px popup constraints.',
        ar: 'بناء نافذة الإضافة المنبثقة باستخدام React. يجب أن يكون التصميم نظيفًا وبسيطًا ويناسب قيود النافذة المنبثقة القياسية 400×600 بكسل.',
      },
      recommendedLibraries: [
        { name: 'shadcn/ui', purpose: 'Accessible UI primitives', required: false, alternative: 'radix-ui/react-*' },
        { name: 'lucide-react', purpose: 'Icon set', required: true },
        { name: 'clsx', purpose: 'Conditional class names', required: true },
      ],
      successCriteria: {
        en: [
          'Popup renders in under 300 ms on initial open',
          'All interactive elements are keyboard-accessible',
          'UI is legible at browser default font size (16 px)',
          'Popup works in both light and dark browser themes',
          'No horizontal scroll at any point',
        ],
        ar: [
          'تُصيَّر النافذة المنبثقة في أقل من 300 مللي ثانية عند الفتح الأولي',
          'جميع العناصر التفاعلية قابلة للوصول بلوحة المفاتيح',
          'واجهة المستخدم مقروءة بحجم خط المتصفح الافتراضي (16 بكسل)',
          'تعمل النافذة المنبثقة في كلٍّ من ثيمات المتصفح الفاتح والمظلم',
          'لا تمرير أفقي في أي وقت',
        ],
      },
      restrictions: {
        en: [
          'Do not use inline styles — use Tailwind utilities only.',
          'Do not use alert() or confirm() — use in-popup notification patterns.',
        ],
        ar: [
          'لا تستخدم أنماطًا مضمَّنة — استخدم أدوات Tailwind فقط.',
          'لا تستخدم alert() أو confirm() — استخدم أنماط إشعارات داخل النافذة المنبثقة.',
        ],
      },
      dependsOn: ['01_project_setup'],
    },
    {
      id: '03_background_service',
      title: { en: 'Background service worker', ar: 'عامل خدمة الخلفية' },
      type: 'implementation',
      goal: {
        en: 'Implement the Manifest V3 background service worker. Handle extension lifecycle events, message passing, and alarm-based scheduling.',
        ar: 'تنفيذ عامل خدمة خلفية Manifest V3. معالجة أحداث دورة حياة الإضافة وتمرير الرسائل والجدولة القائمة على التنبيه.',
      },
      recommendedLibraries: [
        { name: 'webextension-polyfill', purpose: 'Cross-browser API compatibility', required: true },
      ],
      successCriteria: {
        en: [
          'Service worker registers and stays active without being killed prematurely',
          'Message passing between popup and service worker works bidirectionally',
          'Extension lifecycle events (onInstalled, onStartup) handled correctly',
          'chrome.alarms used instead of setInterval for recurring tasks',
        ],
        ar: [
          'يسجّل عامل الخدمة ويبقى نشطًا بدون أن يُوقَف مبكرًا',
          'يعمل تمرير الرسائل بين النافذة المنبثقة وعامل الخدمة بشكل ثنائي الاتجاه',
          'تُعالَج أحداث دورة حياة الإضافة (onInstalled، onStartup) بشكل صحيح',
          'يُستخدم chrome.alarms بدلاً من setInterval للمهام المتكررة',
        ],
      },
      restrictions: {
        en: [
          'Do not use persistent background pages — Manifest V3 requires service workers.',
          'Do not rely on global variables for state — service workers can be terminated at any time.',
        ],
        ar: [
          'لا تستخدم صفحات خلفية دائمة — يتطلب Manifest V3 عمال خدمة.',
          'لا تعتمد على المتغيرات العالمية للحالة — يمكن إنهاء عمال الخدمة في أي وقت.',
        ],
      },
      dependsOn: ['01_project_setup'],
    },
    {
      id: '05_storage',
      title: { en: 'Extension storage', ar: 'تخزين الإضافة' },
      type: 'implementation',
      goal: {
        en: 'Implement a typed storage layer using chrome.storage.sync and chrome.storage.local. Provide React hooks for reading/writing stored values.',
        ar: 'تنفيذ طبقة تخزين مكتوبة باستخدام chrome.storage.sync وchrome.storage.local. توفير hooks React لقراءة/كتابة القيم المخزنة.',
      },
      recommendedLibraries: [
        { name: 'webextension-polyfill', purpose: 'Promisified storage API', required: true },
        { name: 'zod', purpose: 'Validate stored data on read', required: true },
      ],
      successCriteria: {
        en: [
          'Storage schema is typed with TypeScript interfaces',
          'Data persists across extension reloads and browser restarts',
          'Storage changes are reactive (useStorage hook re-renders on change)',
          'chrome.storage.sync stays within the 100 KB quota',
        ],
        ar: [
          'مخطط التخزين مكتوب بواجهات TypeScript',
          'تستمر البيانات عبر إعادة تحميل الإضافة وإعادة تشغيل المتصفح',
          'تغييرات التخزين تفاعلية (يُعيد useStorage التصيير عند التغيير)',
          'يبقى chrome.storage.sync ضمن حصة 100 كيلوبايت',
        ],
      },
      restrictions: {
        en: [
          'Do not store sensitive data (passwords, tokens) in chrome.storage — use the credential management API or a secure enclave.',
          'Do not store more than 512 bytes per key in chrome.storage.sync.',
        ],
        ar: [
          'لا تخزن بيانات حساسة (كلمات المرور، الرموز) في chrome.storage — استخدم API إدارة بيانات الاعتماد أو enclave آمن.',
          'لا تخزن أكثر من 512 بايت لكل مفتاح في chrome.storage.sync.',
        ],
      },
      dependsOn: ['03_background_service'],
    },
    {
      id: '07_permissions',
      title: { en: 'Permission audit', ar: 'تدقيق الأذونات' },
      type: 'implementation',
      goal: {
        en: 'Review all declared permissions in manifest.json. Remove unnecessary ones. Add optional permissions for features not needed on install.',
        ar: 'مراجعة جميع الأذونات المُعلنة في manifest.json. إزالة الأذونات غير الضرورية. إضافة أذونات اختيارية للميزات غير المطلوبة عند التثبيت.',
      },
      recommendedLibraries: [
        { name: 'chrome-types', purpose: 'TypeScript types for Chrome extension APIs', required: true },
      ],
      successCriteria: {
        en: [
          'Manifest has only the minimum required permissions',
          'Optional permissions requested at runtime with user-facing justification',
          'Chrome extension store permission review passes',
          'No activeTab + broad host permission combination',
        ],
        ar: [
          'يحتوي المانيفست على الحد الأدنى من الأذونات المطلوبة',
          'الأذونات الاختيارية مطلوبة في وقت التشغيل مع مبرر للمستخدم',
          'يجتاز مراجعة إذن متجر إضافات Chrome',
          'لا يوجد مزيج من activeTab + إذن مضيف واسع',
        ],
      },
      restrictions: {
        en: [
          'Do not request permissions "just in case" — only declare what is actively used.',
        ],
        ar: [
          'لا تطلب أذونات "للاحتياط" — أعلن فقط ما يُستخدم فعليًا.',
        ],
      },
      dependsOn: ['05_storage'],
    },
    {
      id: '07b_error_handling',
      title: { en: 'Error handling', ar: 'معالجة الأخطاء' },
      type: 'implementation',
      goal: {
        en: 'Implement consistent error handling across all extension contexts: popup, background, and content script. Show user-friendly error states in the popup.',
        ar: 'تنفيذ معالجة أخطاء متسقة عبر جميع سياقات الإضافة: النافذة المنبثقة والخلفية وسكريبت المحتوى. عرض حالات أخطاء سهلة الاستخدام في النافذة المنبثقة.',
      },
      recommendedLibraries: [
        { name: 'webextension-polyfill', purpose: 'Consistent runtime.lastError handling', required: true },
      ],
      successCriteria: {
        en: [
          'All chrome API calls wrapped to catch and log errors',
          'Popup shows an error banner instead of a blank screen on failure',
          'Background errors written to chrome.storage.local for debugging',
          'User-facing errors never expose internal stack traces',
        ],
        ar: [
          'جميع استدعاءات chrome API مُغلَّفة للتقاط الأخطاء وتسجيلها',
          'تُظهر النافذة المنبثقة لافتة خطأ بدلاً من شاشة فارغة عند الفشل',
          'أخطاء الخلفية مكتوبة في chrome.storage.local للتصحيح',
          'الأخطاء الموجهة للمستخدم لا تكشف أبدًا عن تتبعات المكدس الداخلية',
        ],
      },
      restrictions: {
        en: [
          'Do not use alert() for errors — update the popup UI state instead.',
        ],
        ar: [
          'لا تستخدم alert() للأخطاء — قم بتحديث حالة واجهة مستخدم النافذة المنبثقة بدلاً من ذلك.',
        ],
      },
      dependsOn: ['07_permissions'],
    },
    {
      id: '08_testing',
      title: { en: 'Testing', ar: 'الاختبار' },
      type: 'verification',
      goal: {
        en: 'Write unit tests for business logic and integration tests for storage and message passing. Test in both Chrome and Firefox.',
        ar: 'كتابة اختبارات الوحدة لمنطق الأعمال واختبارات التكامل للتخزين وتمرير الرسائل. الاختبار في Chrome وFirefox.',
      },
      recommendedLibraries: [
        { name: 'vitest', purpose: 'Unit test runner compatible with Vite', required: true },
        { name: '@vitest/coverage-v8', purpose: 'Code coverage', required: false },
        { name: 'jest-webextension-mock', purpose: 'Mock browser extension APIs', required: true },
      ],
      successCriteria: {
        en: [
          'All unit tests pass',
          'Storage read/write round-trip tested',
          'Message passing between contexts tested',
          'Extension loads without errors in Chrome and Firefox',
        ],
        ar: [
          'تجتاز جميع اختبارات الوحدة',
          'اختبار دورة القراءة/الكتابة للتخزين',
          'اختبار تمرير الرسائل بين السياقات',
          'تُحمَّل الإضافة بدون أخطاء في Chrome وFirefox',
        ],
      },
      restrictions: {
        en: [
          'Do not use real browser API calls in unit tests — mock them.',
        ],
        ar: [
          'لا تستخدم استدعاءات API المتصفح الحقيقية في اختبارات الوحدة — قم بمحاكاتها.',
        ],
      },
      dependsOn: ['07_permissions'],
    },
    {
      id: '09_build_and_package',
      title: { en: 'Build and package', ar: 'البناء والتعبئة' },
      type: 'delivery',
      goal: {
        en: 'Create a production build, generate a ZIP for Chrome Web Store and Firefox AMO. Document the submission process.',
        ar: 'إنشاء بنية إنتاج وإنشاء ZIP لمتجر Chrome على الويب وFirefox AMO. توثيق عملية التقديم.',
      },
      recommendedLibraries: [
        { name: 'web-ext', purpose: 'Firefox extension build/lint/sign tool', required: false },
      ],
      successCriteria: {
        en: [
          'Production ZIP under 10 MB',
          'No source maps included in the production bundle',
          'Extension icon provided at 16, 32, 48, 128 px',
          'Store listing assets (screenshots, description) prepared',
        ],
        ar: [
          'ZIP الإنتاج أقل من 10 ميغابايت',
          'لا توجد خرائط مصدر مدرجة في حزمة الإنتاج',
          'أيقونة الإضافة متوفرة بأحجام 16 و32 و48 و128 بكسل',
          'أصول قائمة المتجر (لقطات الشاشة، الوصف) مُعَدَّة',
        ],
      },
      restrictions: {
        en: [
          'Do not include node_modules or .git in the submission ZIP.',
          'Do not obfuscate code — Chrome Web Store rejects obfuscated submissions.',
        ],
        ar: [
          'لا تدرج node_modules أو .git في ZIP التقديم.',
          'لا تُبهِم الكود — يرفض Chrome Web Store التقديمات المُبهمة.',
        ],
      },
      dependsOn: ['08_testing'],
    },
  ],
  conditionalSteps: [
    {
      id: '04_content_script',
      title: { en: 'Content script', ar: 'سكريبت المحتوى' },
      type: 'implementation',
      goal: {
        en: 'Implement a content script that injects into web pages. Use isolated world to avoid conflicts with page scripts.',
        ar: 'تنفيذ سكريبت محتوى يُحقن في صفحات الويب. استخدام العالم المعزول لتجنب التعارضات مع سكريبتات الصفحة.',
      },
      includeWhen: (f) => f.includes('content-script'),
      recommendedLibraries: [
        { name: 'webextension-polyfill', purpose: 'Consistent API across browsers', required: true },
      ],
      successCriteria: {
        en: [
          'Content script injected only on matching URLs',
          'No interference with the host page JavaScript',
          'Message passing to background worker functional',
          'MutationObserver cleans up on page unload',
        ],
        ar: [
          'سكريبت المحتوى يُحقن فقط على عناوين URL المطابقة',
          'لا تدخل مع JavaScript للصفحة المضيفة',
          'تمرير الرسائل إلى عامل الخلفية يعمل',
          'يُنظِّف MutationObserver عند إلغاء تحميل الصفحة',
        ],
      },
      restrictions: {
        en: [
          'Do not inject content scripts on chrome:// or about:// pages.',
          'Do not use document.write() in content scripts.',
        ],
        ar: [
          'لا تحقن سكريبتات المحتوى في صفحات chrome:// أو about://.',
          'لا تستخدم document.write() في سكريبتات المحتوى.',
        ],
      },
      dependsOn: ['03_background_service'],
    },
    {
      id: '06_options_page',
      title: { en: 'Options page', ar: 'صفحة الخيارات' },
      type: 'implementation',
      goal: {
        en: 'Build a full-page React options/settings UI accessible via chrome://extensions or the extension context menu.',
        ar: 'بناء واجهة مستخدم React كاملة للخيارات/الإعدادات قابلة للوصول عبر chrome://extensions أو قائمة سياق الإضافة.',
      },
      includeWhen: (f) => f.includes('options'),
      recommendedLibraries: [
        { name: 'react-hook-form', purpose: 'Settings form state', required: true },
        { name: 'zod', purpose: 'Settings validation', required: true },
      ],
      successCriteria: {
        en: [
          'Options page accessible from extension management page',
          'Settings persist to chrome.storage on save',
          'Reset to defaults button clears storage',
          'Form validates before saving',
        ],
        ar: [
          'صفحة الخيارات قابلة للوصول من صفحة إدارة الإضافة',
          'تُحفَظ الإعدادات في chrome.storage عند الحفظ',
          'زر إعادة التعيين إلى الإعدادات الافتراضية يمسح التخزين',
          'يتحقق النموذج قبل الحفظ',
        ],
      },
      restrictions: {
        en: [
          'Do not duplicate popup settings in the options page — one source of truth.',
        ],
        ar: [
          'لا تكرر إعدادات النافذة المنبثقة في صفحة الخيارات — مصدر حقيقة واحد.',
        ],
      },
      dependsOn: ['05_storage'],
    },
  ],
};

export default browserExtension;
