import type { Question, ProjectKind } from './types';

export const commonQuestions: Question[] = [
  {
    id: 'q_kind',
    text: {
      en: 'What kind of project is this?',
      ar: 'ما نوع هذا المشروع؟',
    },
    hint: {
      en: "We detected a type from your idea, but you can change it here.",
      ar: 'استشعرنا نوعًا من فكرتك، لكن يمكنك تغييره هنا.',
    },
    type: 'single',
    options: [
      { value: 'web-app', label: { en: 'Web App', ar: 'تطبيق ويب' } },
      { value: 'mobile-app', label: { en: 'Mobile App', ar: 'تطبيق جوال' } },
      { value: 'browser-extension', label: { en: 'Browser Extension', ar: 'إضافة متصفح' } },
      { value: 'rest-api', label: { en: 'REST API / Backend', ar: 'واجهة برمجية / خادم' } },
      { value: 'cli-tool', label: { en: 'CLI Tool', ar: 'أداة سطر أوامر' } },
      { value: 'discord-bot', label: { en: 'Discord Bot', ar: 'بوت ديسكورد' } },
      { value: 'telegram-bot', label: { en: 'Telegram Bot', ar: 'بوت تيليجرام' } },
      { value: 'landing-page', label: { en: 'Landing Page', ar: 'صفحة هبوط' } },
      { value: '3d-web', label: { en: '3D Web Experience', ar: 'تجربة ويب ثلاثية الأبعاد' } },
      { value: 'n8n-workflow', label: { en: 'n8n Workflow / Automation', ar: 'سير عمل n8n / أتمتة' } },
      { value: 'ai-agent', label: { en: 'AI Agent', ar: 'وكيل ذكاء اصطناعي' } },
      { value: 'unknown', label: { en: 'Something else', ar: 'شيء آخر' } },
    ],
  },
  {
    id: 'q_users',
    text: {
      en: 'Who is this for?',
      ar: 'لمن هذا المشروع؟',
    },
    hint: {
      en: 'e.g. "myself", "small business owners", "developers"',
      ar: 'مثال: "نفسي"، "أصحاب الأعمال الصغيرة"، "المطورين"',
    },
    type: 'text',
  },
  {
    id: 'q_value',
    text: {
      en: "What's the single most important thing it does?",
      ar: 'ما هو الشيء الأهم الذي يفعله؟',
    },
    hint: {
      en: 'One sentence. Focus on the core value.',
      ar: 'جملة واحدة. ركّز على القيمة الأساسية.',
    },
    type: 'text',
  },
  {
    id: 'q_timeline',
    text: {
      en: 'What is your rough timeline?',
      ar: 'ما الجدول الزمني التقريبي؟',
    },
    type: 'single',
    options: [
      { value: 'weekend', label: { en: 'Weekend project (1–2 days)', ar: 'مشروع نهاية أسبوع (١–٢ يوم)' } },
      { value: '1-week', label: { en: '1 week', ar: 'أسبوع واحد' } },
      { value: '1-month', label: { en: '1 month', ar: 'شهر واحد' } },
      { value: 'longer', label: { en: 'Longer than a month', ar: 'أكثر من شهر' } },
    ],
  },
];

export const kindQuestions: Record<ProjectKind, Question[]> = {
  'web-app': [
    {
      id: 'q_webapp_auth',
      text: { en: 'Does it need user authentication?', ar: 'هل يحتاج إلى تسجيل دخول للمستخدمين؟' },
      type: 'boolean',
    },
    {
      id: 'q_webapp_database',
      text: { en: 'Does it need a database?', ar: 'هل يحتاج إلى قاعدة بيانات؟' },
      type: 'boolean',
    },
    {
      id: 'q_webapp_payments',
      text: { en: 'Does it need payments?', ar: 'هل يحتاج إلى نظام دفع؟' },
      type: 'boolean',
    },
    {
      id: 'q_webapp_hosting',
      text: { en: 'Where do you plan to host it?', ar: 'أين تخطط لاستضافته؟' },
      type: 'single',
      options: [
        { value: 'vercel', label: { en: 'Vercel', ar: 'Vercel' } },
        { value: 'netlify', label: { en: 'Netlify', ar: 'Netlify' } },
        { value: 'vps', label: { en: 'VPS / Self-hosted', ar: 'خادم خاص' } },
        { value: 'undecided', label: { en: 'Not decided yet', ar: 'لم أحدد بعد' } },
      ],
    },
  ],
  'browser-extension': [
    {
      id: 'q_ext_browsers',
      text: { en: 'Which browsers should it support?', ar: 'ما المتصفحات التي يجب أن يدعمها؟' },
      type: 'multi',
      options: [
        { value: 'chrome', label: { en: 'Chrome', ar: 'Chrome' } },
        { value: 'firefox', label: { en: 'Firefox', ar: 'Firefox' } },
        { value: 'edge', label: { en: 'Edge', ar: 'Edge' } },
        { value: 'safari', label: { en: 'Safari', ar: 'Safari' } },
      ],
    },
    {
      id: 'q_ext_type',
      text: { en: 'Is it a content script, popup, or both?', ar: 'هل هو سكريبت محتوى، نافذة منبثقة، أم كلاهما؟' },
      type: 'single',
      options: [
        { value: 'content-script', label: { en: 'Content script (modifies pages)', ar: 'سكريبت محتوى (يعدّل الصفحات)' } },
        { value: 'popup', label: { en: 'Popup (toolbar button)', ar: 'نافذة منبثقة (زر في شريط الأدوات)' } },
        { value: 'both', label: { en: 'Both', ar: 'كلاهما' } },
      ],
    },
    {
      id: 'q_ext_permissions',
      text: { en: 'Does it need special browser permissions?', ar: 'هل يحتاج إلى صلاحيات متصفح خاصة؟' },
      hint: { en: 'e.g. tabs, storage, cookies, network requests', ar: 'مثال: التبويبات، التخزين، الكوكيز، الطلبات الشبكية' },
      type: 'boolean',
    },
  ],
  'rest-api': [
    {
      id: 'q_api_language',
      text: { en: 'What language/framework?', ar: 'ما اللغة أو الإطار؟' },
      type: 'single',
      options: [
        { value: 'node-express', label: { en: 'Node.js + Express', ar: 'Node.js + Express' } },
        { value: 'node-fastify', label: { en: 'Node.js + Fastify', ar: 'Node.js + Fastify' } },
        { value: 'python-fastapi', label: { en: 'Python + FastAPI', ar: 'Python + FastAPI' } },
        { value: 'python-django', label: { en: 'Python + Django REST', ar: 'Python + Django REST' } },
        { value: 'go', label: { en: 'Go', ar: 'Go' } },
        { value: 'other', label: { en: 'Other', ar: 'أخرى' } },
      ],
    },
    {
      id: 'q_api_database',
      text: { en: 'Which database?', ar: 'ما قاعدة البيانات؟' },
      type: 'single',
      options: [
        { value: 'postgres', label: { en: 'PostgreSQL', ar: 'PostgreSQL' } },
        { value: 'mysql', label: { en: 'MySQL', ar: 'MySQL' } },
        { value: 'mongodb', label: { en: 'MongoDB', ar: 'MongoDB' } },
        { value: 'sqlite', label: { en: 'SQLite', ar: 'SQLite' } },
        { value: 'none', label: { en: 'No database', ar: 'بدون قاعدة بيانات' } },
      ],
    },
    {
      id: 'q_api_deployment',
      text: { en: 'Deployment target?', ar: 'هدف النشر؟' },
      type: 'single',
      options: [
        { value: 'docker', label: { en: 'Docker / Container', ar: 'Docker / حاوية' } },
        { value: 'serverless', label: { en: 'Serverless (Lambda, Cloud Functions)', ar: 'بدون خادم (Lambda، Cloud Functions)' } },
        { value: 'vps', label: { en: 'VPS / Bare metal', ar: 'خادم خاص' } },
        { value: 'undecided', label: { en: 'Undecided', ar: 'غير محدد' } },
      ],
    },
  ],
  'cli-tool': [
    {
      id: 'q_cli_language',
      text: { en: 'What language?', ar: 'ما اللغة؟' },
      type: 'single',
      options: [
        { value: 'node', label: { en: 'Node.js', ar: 'Node.js' } },
        { value: 'python', label: { en: 'Python', ar: 'Python' } },
        { value: 'rust', label: { en: 'Rust', ar: 'Rust' } },
        { value: 'go', label: { en: 'Go', ar: 'Go' } },
      ],
    },
    {
      id: 'q_cli_distribution',
      text: { en: 'How will users install it?', ar: 'كيف سيثبّته المستخدمون؟' },
      type: 'single',
      options: [
        { value: 'npm', label: { en: 'npm / npx', ar: 'npm / npx' } },
        { value: 'pip', label: { en: 'pip / pipx', ar: 'pip / pipx' } },
        { value: 'cargo', label: { en: 'cargo', ar: 'cargo' } },
        { value: 'binary', label: { en: 'Compiled binary / GitHub releases', ar: 'ملف منفذ / إصدارات GitHub' } },
      ],
    },
  ],
  'discord-bot': [
    {
      id: 'q_discord_commands',
      text: { en: 'Does it use slash commands?', ar: 'هل يستخدم أوامر الشرطة المائلة؟' },
      type: 'boolean',
    },
    {
      id: 'q_discord_database',
      text: { en: 'Does it need persistent storage?', ar: 'هل يحتاج إلى تخزين دائم؟' },
      type: 'boolean',
    },
    {
      id: 'q_discord_events',
      text: { en: 'Which events does it listen to?', ar: 'ما الأحداث التي يستمع إليها؟' },
      type: 'multi',
      options: [
        { value: 'messages', label: { en: 'Messages', ar: 'الرسائل' } },
        { value: 'reactions', label: { en: 'Reactions', ar: 'ردود الفعل' } },
        { value: 'members', label: { en: 'Member joins/leaves', ar: 'انضمام/مغادرة الأعضاء' } },
        { value: 'voice', label: { en: 'Voice channels', ar: 'قنوات الصوت' } },
      ],
    },
  ],
  'telegram-bot': [
    {
      id: 'q_tg_polling',
      text: { en: 'Polling or webhook?', ar: 'استطلاع دوري أم webhook؟' },
      type: 'single',
      options: [
        { value: 'polling', label: { en: 'Polling (simpler, dev-friendly)', ar: 'استطلاع دوري (أبسط، مناسب للتطوير)' } },
        { value: 'webhook', label: { en: 'Webhook (production-ready)', ar: 'Webhook (جاهز للإنتاج)' } },
      ],
    },
    {
      id: 'q_tg_database',
      text: { en: 'Does the bot need to remember user data?', ar: 'هل يحتاج البوت إلى تذكر بيانات المستخدمين؟' },
      type: 'boolean',
    },
    {
      id: 'q_tg_inline',
      text: { en: 'Does it need inline keyboards or custom menus?', ar: 'هل يحتاج إلى أزرار مضمّنة أو قوائم مخصصة؟' },
      type: 'boolean',
    },
  ],
  'landing-page': [
    {
      id: 'q_landing_form',
      text: { en: 'Does it have a contact or signup form?', ar: 'هل تحتوي على نموذج تواصل أو تسجيل؟' },
      type: 'boolean',
    },
    {
      id: 'q_landing_cms',
      text: { en: 'Will content be updated frequently?', ar: 'هل سيتم تحديث المحتوى بشكل متكرر؟' },
      hint: { en: 'A CMS might help if yes', ar: 'نظام إدارة محتوى قد يكون مفيدًا إن كانت الإجابة نعم' },
      type: 'boolean',
    },
    {
      id: 'q_landing_animations',
      text: { en: 'Do you want scroll animations or interactive elements?', ar: 'هل تريد حركات عند التمرير أو عناصر تفاعلية؟' },
      type: 'boolean',
    },
  ],
  '3d-web': [
    {
      id: 'q_3d_animation',
      text: { en: 'Is animation a core part of the experience?', ar: 'هل الحركة جزء أساسي من التجربة؟' },
      type: 'boolean',
    },
    {
      id: 'q_3d_interaction',
      text: { en: 'Can users interact with the 3D scene?', ar: 'هل يمكن للمستخدمين التفاعل مع المشهد ثلاثي الأبعاد؟' },
      type: 'boolean',
    },
    {
      id: 'q_3d_mobile',
      text: { en: 'Must it work on mobile?', ar: 'هل يجب أن يعمل على الأجهزة المحمولة؟' },
      type: 'boolean',
    },
  ],
  'n8n-workflow': [
    {
      id: 'q_n8n_trigger',
      text: { en: 'What triggers the workflow?', ar: 'ما الذي يُشغّل سير العمل؟' },
      type: 'single',
      options: [
        { value: 'schedule', label: { en: 'Schedule / Cron', ar: 'جدول زمني / Cron' } },
        { value: 'webhook', label: { en: 'Webhook', ar: 'Webhook' } },
        { value: 'manual', label: { en: 'Manual trigger', ar: 'تشغيل يدوي' } },
        { value: 'event', label: { en: 'External event (email, form, etc.)', ar: 'حدث خارجي (بريد، نموذج، إلخ)' } },
      ],
    },
    {
      id: 'q_n8n_integrations',
      text: { en: 'Which services does it integrate with?', ar: 'ما الخدمات التي يتكامل معها؟' },
      hint: { en: 'e.g. Google Sheets, Slack, Airtable, email', ar: 'مثال: Google Sheets، Slack، Airtable، البريد الإلكتروني' },
      type: 'text',
    },
    {
      id: 'q_n8n_ai',
      text: { en: 'Does it include AI nodes (OpenAI, Claude, etc.)?', ar: 'هل يتضمن عقد الذكاء الاصطناعي (OpenAI، Claude، إلخ)؟' },
      type: 'boolean',
    },
  ],
  'ai-agent': [
    {
      id: 'q_agent_tools',
      text: { en: 'What tools/capabilities should the agent have?', ar: 'ما الأدوات/القدرات التي يجب أن يمتلكها الوكيل؟' },
      hint: { en: 'e.g. web search, code execution, file access, email', ar: 'مثال: بحث ويب، تنفيذ كود، وصول للملفات، بريد إلكتروني' },
      type: 'text',
    },
    {
      id: 'q_agent_framework',
      text: { en: 'Which AI framework?', ar: 'ما إطار الذكاء الاصطناعي؟' },
      type: 'single',
      options: [
        { value: 'langchain', label: { en: 'LangChain', ar: 'LangChain' } },
        { value: 'llamaindex', label: { en: 'LlamaIndex', ar: 'LlamaIndex' } },
        { value: 'autogen', label: { en: 'AutoGen', ar: 'AutoGen' } },
        { value: 'custom', label: { en: 'Custom (no framework)', ar: 'مخصص (بدون إطار)' } },
      ],
    },
    {
      id: 'q_agent_memory',
      text: { en: 'Does it need persistent memory across sessions?', ar: 'هل يحتاج إلى ذاكرة دائمة عبر الجلسات؟' },
      type: 'boolean',
    },
  ],
  'mobile-app': [
    {
      id: 'q_mobile_platform',
      text: { en: 'iOS, Android, or both?', ar: 'iOS أم Android أم كلاهما؟' },
      type: 'single',
      options: [
        { value: 'ios', label: { en: 'iOS only', ar: 'iOS فقط' } },
        { value: 'android', label: { en: 'Android only', ar: 'Android فقط' } },
        { value: 'both', label: { en: 'Both (cross-platform)', ar: 'كلاهما (متعدد المنصات)' } },
      ],
    },
    {
      id: 'q_mobile_framework',
      text: { en: 'Which framework?', ar: 'ما الإطار؟' },
      type: 'single',
      options: [
        { value: 'react-native', label: { en: 'React Native', ar: 'React Native' } },
        { value: 'flutter', label: { en: 'Flutter', ar: 'Flutter' } },
        { value: 'native', label: { en: 'Native (Swift / Kotlin)', ar: 'أصلي (Swift / Kotlin)' } },
      ],
    },
    {
      id: 'q_mobile_offline',
      text: { en: 'Does it need to work offline?', ar: 'هل يحتاج إلى العمل دون اتصال؟' },
      type: 'boolean',
    },
  ],
  unknown: [
    {
      id: 'q_unknown_describe',
      text: { en: 'Describe what this project does in one sentence.', ar: 'صف ما يفعله هذا المشروع في جملة واحدة.' },
      type: 'text',
    },
    {
      id: 'q_unknown_output',
      text: { en: 'What is the main output or deliverable?', ar: 'ما الناتج أو المنتج الرئيسي؟' },
      hint: { en: 'e.g. a website, a script, a report, an API', ar: 'مثال: موقع، سكريبت، تقرير، واجهة برمجية' },
      type: 'text',
    },
    {
      id: 'q_unknown_tech',
      text: { en: 'What technologies do you plan to use?', ar: 'ما التقنيات التي تخطط لاستخدامها؟' },
      type: 'text',
    },
  ],
};
