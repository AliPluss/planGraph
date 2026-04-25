import type { Template } from '../types';

const landingPage: Template = {
  id: 'landing-page',
  kind: 'landing-page',
  name: { en: 'Landing Page', ar: 'صفحة الهبوط' },
  description: {
    en: 'High-converting landing page with hero, features, pricing, and SEO optimization. Built with Next.js or Astro.',
    ar: 'صفحة هبوط عالية التحويل مع قسم بطولي وميزات وتسعير وتحسين لمحركات البحث. مبنية بـ Next.js أو Astro.',
  },
  defaultStack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'Framer Motion'],
  protectedFiles: [
    '.env', '.env.local', 'secrets/**', '.git/**',
  ],
  baseSteps: [
    {
      id: '01_project_setup',
      title: { en: 'Project setup', ar: 'إعداد المشروع' },
      type: 'setup',
      goal: {
        en: 'Bootstrap a Next.js project optimised for a landing page: static export or ISR, no unnecessary API routes, fast build times.',
        ar: 'إنشاء مشروع Next.js مُحسَّن لصفحة هبوط: تصدير ثابت أو ISR، بدون مسارات API غير ضرورية، أوقات بناء سريعة.',
      },
      recommendedLibraries: [
        { name: 'next', purpose: 'Framework with static export support', required: true },
        { name: 'typescript', purpose: 'Type safety', required: true },
        { name: 'tailwindcss', purpose: 'Utility-first styling', required: true },
        { name: 'sharp', purpose: 'Image optimisation for next/image', required: true },
      ],
      successCriteria: {
        en: [
          '`npm run dev` boots without errors on localhost:3000',
          '`npm run build && npm run export` produces a static dist/ folder',
          'TypeScript strict mode enabled',
          'Lighthouse performance score ≥ 90 on the bare setup',
        ],
        ar: [
          'يعمل `npm run dev` بدون أخطاء على localhost:3000',
          'يُنتج `npm run build && npm run export` مجلد dist/ ثابتًا',
          'وضع TypeScript الصارم مُفعَّل',
          'نتيجة أداء Lighthouse ≥ 90 على الإعداد الجرداء',
        ],
      },
      restrictions: {
        en: [
          'Do not add a database or auth in this step.',
          'Do not use CSS-in-JS solutions — Tailwind only.',
        ],
        ar: [
          'لا تضف قاعدة بيانات أو مصادقة في هذه الخطوة.',
          'لا تستخدم حلول CSS-in-JS — Tailwind فقط.',
        ],
      },
      dependsOn: [],
    },
    {
      id: '02_design_tokens',
      title: { en: 'Design tokens', ar: 'رموز التصميم' },
      type: 'setup',
      goal: {
        en: 'Define brand color palette, typography scale (font family, sizes, weights), spacing, and shadow tokens in tailwind.config.',
        ar: 'تعريف لوحة ألوان العلامة التجارية ومقياس الطباعة (عائلة الخط والأحجام والأوزان) والتباعد ورموز الظل في tailwind.config.',
      },
      recommendedLibraries: [
        { name: 'tailwindcss', purpose: 'Design token system via config', required: true },
        { name: '@fontsource/*', purpose: 'Self-hosted font loading', required: false, alternative: 'next/font/google' },
      ],
      successCriteria: {
        en: [
          'Brand colors defined in tailwind.config as custom tokens',
          'Two fonts configured: heading (display) and body (text)',
          'Heading hierarchy (h1–h4) applied consistently across all sections',
          'Spacing scale uses 4 px grid increments (no arbitrary values)',
        ],
        ar: [
          'ألوان العلامة التجارية مُعرَّفة في tailwind.config كرموز مخصصة',
          'خطان مُكوَّنان: عنوان (عرض) ونص أساسي',
          'تسلسل العنوان (h1–h4) مطبَّق باستمرار عبر جميع الأقسام',
          'مقياس التباعد يستخدم زيادات شبكة 4 بكسل (لا قيم اعتباطية)',
        ],
      },
      restrictions: {
        en: [
          'Do not use inline styles or Tailwind arbitrary values for brand colors.',
          'Do not load fonts from third-party CDNs — self-host or use next/font.',
        ],
        ar: [
          'لا تستخدم أنماطًا مضمَّنة أو قيم Tailwind الاعتباطية لألوان العلامة التجارية.',
          'لا تحمّل الخطوط من شبكات CDN خارجية — استضفها ذاتيًا أو استخدم next/font.',
        ],
      },
      dependsOn: ['01_project_setup'],
    },
    {
      id: '03_hero_section',
      title: { en: 'Hero section', ar: 'القسم البطولي' },
      type: 'implementation',
      goal: {
        en: 'Build an above-the-fold hero with headline, subheading, primary CTA button, and hero image/illustration. Should load in under 1 LCP second.',
        ar: 'بناء قسم بطولي فوق الطي مع عنوان رئيسي وعنوان فرعي وزر CTA أساسي وصورة/رسم توضيحي بطولي. يجب أن يتحمل في أقل من ثانية LCP واحدة.',
      },
      recommendedLibraries: [
        { name: 'framer-motion', purpose: 'Entry animations on hero elements', required: false },
        { name: 'next/image', purpose: 'Optimised hero image', required: true },
      ],
      successCriteria: {
        en: [
          'Hero renders above the fold on 375 px, 768 px, and 1440 px viewports',
          'CTA button has clear, action-oriented text (not just "Learn more")',
          'Hero image is served as WebP with correct intrinsic dimensions',
          'LCP element identified and preloaded with <link rel="preload">',
          'No layout shift (CLS = 0) during hero load',
        ],
        ar: [
          'يُصيَّر القسم البطولي فوق الطي على منافذ عرض 375 بكسل و768 بكسل و1440 بكسل',
          'نص زر CTA واضح وموجَّه نحو الإجراء (وليس فقط "اعرف المزيد")',
          'تُقدَّم صورة القسم البطولي بتنسيق WebP مع الأبعاد الجوهرية الصحيحة',
          'عنصر LCP مُحدَّد ومُحمَّل مسبقًا بـ <link rel="preload">',
          'لا تحول تخطيط (CLS = 0) أثناء تحميل القسم البطولي',
        ],
      },
      restrictions: {
        en: [
          'Do not use autoplay videos in the hero — they hurt Core Web Vitals.',
          'Do not use GIF format for animations — use WebP animated or video.',
        ],
        ar: [
          'لا تستخدم مقاطع فيديو ذات تشغيل تلقائي في القسم البطولي — تضر بـ Core Web Vitals.',
          'لا تستخدم تنسيق GIF للرسوم المتحركة — استخدم WebP المتحرك أو الفيديو.',
        ],
      },
      dependsOn: ['02_design_tokens'],
    },
    {
      id: '04_features_section',
      title: { en: 'Features section', ar: 'قسم الميزات' },
      type: 'implementation',
      goal: {
        en: 'Build a features/benefits grid showcasing 3–6 key value propositions with icons, titles, and descriptions.',
        ar: 'بناء شبكة ميزات/فوائد تعرض 3–6 عروض قيمة رئيسية مع أيقونات وعناوين وأوصاف.',
      },
      recommendedLibraries: [
        { name: 'lucide-react', purpose: 'Feature icons', required: true },
        { name: 'framer-motion', purpose: 'Scroll-triggered entrance animations', required: false },
      ],
      successCriteria: {
        en: [
          'Feature cards use icon + title + 2-sentence description pattern',
          'Grid is responsive: 1 col mobile, 2 col tablet, 3 col desktop',
          'Feature copy focuses on outcomes (benefits), not just capabilities',
          'Section has a clear H2 heading for SEO and document structure',
        ],
        ar: [
          'تستخدم بطاقات الميزات نمط أيقونة + عنوان + وصف بجملتين',
          'الشبكة متجاوبة: عمود واحد للموبايل، عمودان للتابلت، 3 أعمدة لسطح المكتب',
          'نص الميزة يركز على النتائج (الفوائد)، وليس فقط القدرات',
          'القسم له عنوان H2 واضح لـ SEO وهيكل المستند',
        ],
      },
      restrictions: {
        en: [
          'Do not use more than 6 features — more dilutes the message.',
          'Do not use generic stock icons — pick icons that relate to the actual feature.',
        ],
        ar: [
          'لا تستخدم أكثر من 6 ميزات — المزيد يخفف الرسالة.',
          'لا تستخدم أيقونات مخزون عامة — اختر أيقونات تتعلق بالميزة الفعلية.',
        ],
      },
      dependsOn: ['03_hero_section'],
    },
    {
      id: '05_accessibility',
      title: { en: 'Accessibility audit', ar: 'تدقيق إمكانية الوصول' },
      type: 'verification',
      goal: {
        en: 'Audit and fix accessibility issues: colour contrast, focus management, ARIA labels, keyboard navigation, and screen reader testing.',
        ar: 'تدقيق وإصلاح مشكلات إمكانية الوصول: تباين الألوان وإدارة التركيز وتسميات ARIA والتنقل بلوحة المفاتيح واختبار قارئ الشاشة.',
      },
      recommendedLibraries: [
        { name: 'axe-core', purpose: 'Automated accessibility testing', required: true },
        { name: '@axe-core/react', purpose: 'Runtime a11y checks in development', required: false },
      ],
      successCriteria: {
        en: [
          'All text meets WCAG AA contrast ratio (4.5:1 for body, 3:1 for large text)',
          'Every interactive element reachable by Tab key',
          'Focus indicator visible on all focusable elements',
          'Images have descriptive alt text (or alt="" for decorative)',
          'axe-core reports zero critical violations',
        ],
        ar: [
          'جميع النصوص تلبي نسبة التباين WCAG AA (4.5:1 للنص الأساسي، 3:1 للنص الكبير)',
          'كل عنصر تفاعلي قابل للوصول بمفتاح Tab',
          'مؤشر التركيز مرئي على جميع العناصر القابلة للتركيز',
          'الصور لها نص بديل وصفي (أو alt="" للصور الزخرفية)',
          'يُبلّغ axe-core بصفر انتهاكات حرجة',
        ],
      },
      restrictions: {
        en: [
          'Do not use colour alone to convey meaning.',
          'Do not remove focus outlines without providing a visible alternative.',
        ],
        ar: [
          'لا تستخدم اللون وحده لنقل المعنى.',
          'لا تزل حدود التركيز بدون توفير بديل مرئي.',
        ],
      },
      dependsOn: ['04_features_section'],
    },
    {
      id: '08_cta_footer',
      title: { en: 'CTA & footer', ar: 'CTA والتذييل' },
      type: 'implementation',
      goal: {
        en: 'Add a final CTA section with email capture or sign-up link, and a footer with navigation, social links, and legal links.',
        ar: 'إضافة قسم CTA نهائي مع التقاط البريد الإلكتروني أو رابط التسجيل، وتذييل مع التنقل وروابط الشبكات الاجتماعية والروابط القانونية.',
      },
      recommendedLibraries: [
        { name: 'react-hook-form', purpose: 'Email capture form state', required: false },
        { name: 'zod', purpose: 'Email validation', required: false },
      ],
      successCriteria: {
        en: [
          'Email capture validates the address before submission',
          'Footer links include Privacy Policy, Terms of Service',
          'Social links open in new tab with rel="noopener noreferrer"',
          'Footer renders correctly on mobile without horizontal overflow',
          'Copyright year auto-updates from JavaScript Date',
        ],
        ar: [
          'التقاط البريد الإلكتروني يتحقق من العنوان قبل الإرسال',
          'روابط التذييل تتضمن سياسة الخصوصية وشروط الخدمة',
          'تفتح روابط الشبكات الاجتماعية في تبويب جديد مع rel="noopener noreferrer"',
          'يُصيَّر التذييل بشكل صحيح على الموبايل بدون فيض أفقي',
          'يتحدث عام حقوق النشر تلقائيًا من JavaScript Date',
        ],
      },
      restrictions: {
        en: [
          'Do not use dark patterns in the CTA (pre-checked opt-ins, misleading copy).',
        ],
        ar: [
          'لا تستخدم الأنماط المظلمة في CTA (موافقات مُحدَّدة مسبقًا، نص مضلل).',
        ],
      },
      dependsOn: ['04_features_section'],
    },
    {
      id: '09_seo_optimization',
      title: { en: 'SEO optimization', ar: 'تحسين محركات البحث' },
      type: 'implementation',
      goal: {
        en: 'Implement meta tags, Open Graph, Twitter Cards, JSON-LD schema.org markup, sitemap.xml, and robots.txt.',
        ar: 'تنفيذ وسوم meta وOpen Graph وTwitter Cards وترميز JSON-LD schema.org وsitemap.xml وrobots.txt.',
      },
      recommendedLibraries: [
        { name: 'next/head', purpose: 'Head tag management (or Next.js metadata API)', required: true },
        { name: 'next-sitemap', purpose: 'Automatic sitemap generation', required: true },
      ],
      successCriteria: {
        en: [
          'Title tag is unique, under 60 characters',
          'Meta description under 160 characters and compelling',
          'Open Graph image 1200×630 px in WebP format',
          'JSON-LD WebPage or Product schema present',
          'sitemap.xml accessible at /sitemap.xml',
          'robots.txt allows all crawlers',
        ],
        ar: [
          'وسم العنوان فريد وأقل من 60 حرفًا',
          'وصف Meta أقل من 160 حرفًا ومقنع',
          'صورة Open Graph بحجم 1200×630 بكسل بتنسيق WebP',
          'مخطط JSON-LD WebPage أو Product موجود',
          'sitemap.xml قابل للوصول على /sitemap.xml',
          'يسمح robots.txt لجميع الزاحفين',
        ],
      },
      restrictions: {
        en: [
          'Do not keyword-stuff the title or description — write for humans first.',
          'Do not use noindex on the main page.',
        ],
        ar: [
          'لا تحشو الكلمات المفتاحية في العنوان أو الوصف — اكتب للبشر أولاً.',
          'لا تستخدم noindex على الصفحة الرئيسية.',
        ],
      },
      dependsOn: ['08_cta_footer'],
    },
    {
      id: '11_deployment',
      title: { en: 'Deployment', ar: 'النشر' },
      type: 'delivery',
      goal: {
        en: 'Deploy to Vercel or Netlify. Configure custom domain, HTTPS, caching headers, and a basic redirects file.',
        ar: 'النشر على Vercel أو Netlify. تكوين النطاق المخصص وHTTPS ورؤوس التخزين المؤقت وملف إعادة توجيه أساسي.',
      },
      recommendedLibraries: [
        { name: 'vercel', purpose: 'Zero-config deployment with edge network', required: false, alternative: 'Netlify' },
      ],
      successCriteria: {
        en: [
          'Site reachable via HTTPS on the custom domain',
          'Lighthouse scores: Performance ≥ 90, Accessibility ≥ 90, SEO ≥ 90',
          'HTTP → HTTPS redirect configured',
          'www → apex redirect (or vice versa) configured',
          'Build succeeds in CI without warnings',
        ],
        ar: [
          'الموقع قابل للوصول عبر HTTPS على النطاق المخصص',
          'نتائج Lighthouse: الأداء ≥ 90، إمكانية الوصول ≥ 90، SEO ≥ 90',
          'إعادة توجيه HTTP → HTTPS مُكوَّنة',
          'إعادة توجيه www → apex (أو العكس) مُكوَّنة',
          'البناء يعمل في CI بدون تحذيرات',
        ],
      },
      restrictions: {
        en: [
          'Do not deploy from the main branch directly — use a deployment preview workflow.',
        ],
        ar: [
          'لا تنشر مباشرةً من الفرع الرئيسي — استخدم سير عمل معاينة النشر.',
        ],
      },
      dependsOn: ['09_seo_optimization'],
    },
  ],
  conditionalSteps: [
    {
      id: '05_pricing_section',
      title: { en: 'Pricing section', ar: 'قسم التسعير' },
      type: 'implementation',
      goal: {
        en: 'Build a pricing table with plan comparison, highlighted recommended plan, and a billing toggle (monthly/annual).',
        ar: 'بناء جدول تسعير مع مقارنة الخطط وخطة موصى بها مُبرَّزة ومبدّل فوترة (شهري/سنوي).',
      },
      includeWhen: (f) => f.includes('pricing'),
      recommendedLibraries: [
        { name: 'lucide-react', purpose: 'Checkmark and feature icons', required: true },
      ],
      successCriteria: {
        en: [
          'Pricing cards show plan name, price, feature list, and CTA',
          'Billing toggle animates between monthly and annual prices',
          'Recommended plan visually distinct (highlighted border, badge)',
          'Pricing section accessible: screen readers can navigate plans',
        ],
        ar: [
          'تُظهر بطاقات التسعير اسم الخطة والسعر وقائمة الميزات وCTA',
          'يُحرِّك مبدّل الفوترة بين الأسعار الشهرية والسنوية',
          'الخطة الموصى بها مميزة بصريًا (حدود بارزة وشارة)',
          'قسم التسعير قابل للوصول: يمكن لقارئات الشاشة التنقل في الخطط',
        ],
      },
      restrictions: {
        en: [
          'Do not use deceptive pricing tactics (hiding fees, fake strike-through prices).',
        ],
        ar: [
          'لا تستخدم أساليب تسعير خادعة (إخفاء الرسوم، أسعار مُشطَّبة مزيفة).',
        ],
      },
      dependsOn: ['04_features_section'],
    },
    {
      id: '06_testimonials',
      title: { en: 'Testimonials', ar: 'الشهادات' },
      type: 'implementation',
      goal: {
        en: 'Add a social proof section with customer quotes, names, titles, and avatar images. Optional: star ratings.',
        ar: 'إضافة قسم دليل اجتماعي مع اقتباسات العملاء والأسماء والمسميات الوظيفية وصور الأفاتار. اختياري: تقييمات النجوم.',
      },
      includeWhen: (f) => f.includes('testimonials'),
      recommendedLibraries: [
        { name: 'next/image', purpose: 'Optimised avatar images', required: true },
        { name: 'embla-carousel-react', purpose: 'Testimonial carousel on mobile', required: false },
      ],
      successCriteria: {
        en: [
          'At least 3 testimonials with real-looking names and roles',
          'Avatars are 64×64 px WebP images with alt text',
          'Carousel or grid adapts to viewport width',
          'Testimonial text is concise (under 150 words each)',
        ],
        ar: [
          '3 شهادات على الأقل بأسماء وأدوار تبدو حقيقية',
          'الأفاتار صور WebP بحجم 64×64 بكسل مع نص بديل',
          'دوّامة أو شبكة تتكيف مع عرض منفذ العرض',
          'نص الشهادة موجز (أقل من 150 كلمة لكل منها)',
        ],
      },
      restrictions: {
        en: [
          'Do not fabricate testimonials — use placeholders that are clearly fictional.',
        ],
        ar: [
          'لا تخترع الشهادات — استخدم عناصر نائبة خيالية بوضوح.',
        ],
      },
      dependsOn: ['04_features_section'],
    },
    {
      id: '07_faq_section',
      title: { en: 'FAQ section', ar: 'قسم الأسئلة الشائعة' },
      type: 'implementation',
      goal: {
        en: 'Build an FAQ accordion with 5–8 common questions. Implement smooth expand/collapse animation.',
        ar: 'بناء أكورديون أسئلة شائعة مع 5–8 أسئلة شائعة. تنفيذ رسوم متحركة سلسة للتوسيع/الطي.',
      },
      includeWhen: (f) => f.includes('faq'),
      recommendedLibraries: [
        { name: '@radix-ui/react-accordion', purpose: 'Accessible accordion primitive', required: true },
      ],
      successCriteria: {
        en: [
          'Each FAQ item has a question (button) and answer (panel)',
          'Accordion is keyboard navigable',
          'Open state persists across viewport resizes',
          'FAQ schema (JSON-LD) added for Google rich results',
        ],
        ar: [
          'كل عنصر أسئلة شائعة له سؤال (زر) وجواب (لوحة)',
          'الأكورديون قابل للتنقل بلوحة المفاتيح',
          'تستمر حالة الفتح عبر تغييرات حجم منفذ العرض',
          'مخطط FAQ (JSON-LD) مُضاف للنتائج الغنية من Google',
        ],
      },
      restrictions: {
        en: [
          'Do not use native <details>/<summary> — use an accessible library for consistent styling.',
        ],
        ar: [
          'لا تستخدم <details>/<summary> الأصلية — استخدم مكتبة قابلة للوصول لتصميم متسق.',
        ],
      },
      dependsOn: ['04_features_section'],
    },
    {
      id: '10_analytics',
      title: { en: 'Analytics', ar: 'التحليلات' },
      type: 'integration',
      goal: {
        en: 'Integrate privacy-friendly analytics (Plausible or PostHog). Track page views, CTA clicks, and form submissions.',
        ar: 'دمج تحليلات صديقة للخصوصية (Plausible أو PostHog). تتبع مشاهدات الصفحة ونقرات CTA وإرسالات النموذج.',
      },
      includeWhen: (f) => f.includes('analytics'),
      recommendedLibraries: [
        { name: 'plausible-tracker', purpose: 'Privacy-first analytics (no cookie banner needed)', required: false, alternative: 'posthog-js' },
        { name: '@vercel/analytics', purpose: 'Web vitals + page view tracking', required: false },
      ],
      successCriteria: {
        en: [
          'Page views tracked on each navigation',
          'CTA button clicks tracked as custom events',
          'Email form submission tracked as conversion event',
          'Analytics script deferred and non-blocking',
          'No personal data sent without GDPR compliance (use Plausible/Fathom)',
        ],
        ar: [
          'مشاهدات الصفحة مُتتبَّعة عند كل تنقل',
          'نقرات زر CTA مُتتبَّعة كأحداث مخصصة',
          'إرسال نموذج البريد الإلكتروني مُتتبَّع كحدث تحويل',
          'سكريبت التحليلات مؤجَّل وغير مُعيق',
          'لا تُرسَل بيانات شخصية بدون الامتثال لـ GDPR (استخدم Plausible/Fathom)',
        ],
      },
      restrictions: {
        en: [
          'Do not use Google Analytics without a cookie consent banner — it is required by GDPR.',
          'Do not track PII (emails, names) in analytics events.',
        ],
        ar: [
          'لا تستخدم Google Analytics بدون لافتة موافقة ملفات تعريف الارتباط — مطلوبة بموجب GDPR.',
          'لا تتبع PII (رسائل البريد الإلكتروني، الأسماء) في أحداث التحليلات.',
        ],
      },
      dependsOn: ['08_cta_footer'],
    },
  ],
};

export default landingPage;
