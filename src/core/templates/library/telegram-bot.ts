import type { Template } from '../types';

const telegramBot: Template = {
  id: 'telegram-bot',
  kind: 'telegram-bot',
  name: { en: 'Telegram Bot', ar: 'بوت تيليغرام' },
  description: {
    en: 'Telegram bot with command handlers, inline keyboards, persistent storage, and webhook deployment.',
    ar: 'بوت تيليغرام مع معالجات الأوامر ولوحات المفاتيح المضمَّنة والتخزين الدائم ونشر webhook.',
  },
  defaultStack: ['Node.js', 'TypeScript', 'grammY', 'PostgreSQL', 'Prisma'],
  protectedFiles: [
    '.env', '.env.local', 'secrets/**', '.git/**',
    '*.pem', '*.key',
  ],
  baseSteps: [
    {
      id: '01_project_setup',
      title: { en: 'Project setup', ar: 'إعداد المشروع' },
      type: 'setup',
      goal: {
        en: 'Bootstrap a Node.js TypeScript bot project using grammY. Configure bot token loading and basic health check.',
        ar: 'إنشاء مشروع بوت Node.js TypeScript باستخدام grammY. تكوين تحميل رمز البوت وفحص صحة أساسي.',
      },
      recommendedLibraries: [
        { name: 'grammy', purpose: 'Telegram Bot API framework', required: true },
        { name: 'typescript', purpose: 'Type safety', required: true },
        { name: 'tsx', purpose: 'Run TS directly in development', required: true },
        { name: 'dotenv', purpose: 'Load BOT_TOKEN from .env', required: true },
      ],
      successCriteria: {
        en: [
          'Bot starts and connects to Telegram in long-polling mode',
          'BOT_TOKEN read from environment, never hardcoded',
          '/ping command replies with "pong"',
          'Graceful shutdown on SIGTERM and SIGINT',
          '.env.example documents BOT_TOKEN and optional variables',
        ],
        ar: [
          'يبدأ البوت ويتصل بتيليغرام في وضع الاستطلاع الطويل',
          'يُقرأ BOT_TOKEN من البيئة، وليس مُرمَّزًا أبدًا',
          'يرد أمر /ping بـ "pong"',
          'إغلاق أنيق عند SIGTERM وSIGINT',
          'يوثق .env.example BOT_TOKEN والمتغيرات الاختيارية',
        ],
      },
      restrictions: {
        en: [
          'Do not hardcode the bot token anywhere in source code.',
          'Do not use the production bot token for development — create a separate @BotFather bot.',
        ],
        ar: [
          'لا تُرمِّز رمز البوت في أي مكان في الكود المصدري.',
          'لا تستخدم رمز بوت الإنتاج للتطوير — أنشئ بوتًا منفصلاً من @BotFather.',
        ],
      },
      dependsOn: [],
    },
    {
      id: '02_bot_config',
      title: { en: 'Bot configuration', ar: 'إعداد البوت' },
      type: 'setup',
      goal: {
        en: 'Configure bot metadata via BotFather: name, description, about text, commands list, and profile picture.',
        ar: 'تكوين بيانات تعريف البوت عبر BotFather: الاسم والوصف ونص "حول" وقائمة الأوامر وصورة الملف الشخصي.',
      },
      recommendedLibraries: [
        { name: 'grammy', purpose: 'setMyCommands API call', required: true },
      ],
      successCriteria: {
        en: [
          'Bot command list visible in Telegram UI (/ menu)',
          'Bot description and about text set via API',
          'Commands registered for both private chats and groups where applicable',
          'setMyCommands called programmatically on startup',
        ],
        ar: [
          'قائمة أوامر البوت مرئية في واجهة تيليغرام (قائمة /)',
          'تم تعيين وصف البوت ونص "حول" عبر API',
          'الأوامر مسجَّلة للمحادثات الخاصة والمجموعات حيثما ينطبق',
          'استدعاء setMyCommands برمجيًا عند بدء التشغيل',
        ],
      },
      restrictions: {
        en: [
          'Do not register more than 100 commands — Telegram enforces this limit.',
        ],
        ar: [
          'لا تسجّل أكثر من 100 أمر — تيليغرام يُفرض هذا الحد.',
        ],
      },
      dependsOn: ['01_project_setup'],
    },
    {
      id: '03_command_handlers',
      title: { en: 'Command handlers', ar: 'معالجات الأوامر' },
      type: 'implementation',
      goal: {
        en: 'Implement /start, /help, and all primary bot commands. Organise handlers in a commands/ folder with one file per command.',
        ar: 'تنفيذ /start و/help وجميع أوامر البوت الأساسية. تنظيم المعالجات في مجلد commands/ مع ملف واحد لكل أمر.',
      },
      recommendedLibraries: [
        { name: 'grammy', purpose: 'Bot context and command routing', required: true },
      ],
      successCriteria: {
        en: [
          '/start sends a welcome message with an inline keyboard',
          '/help lists all available commands with brief descriptions',
          'Unknown commands receive a friendly fallback message',
          'Commands work in both private chat and group context',
          'Handler errors are caught and user notified — no silent failures',
        ],
        ar: [
          'يُرسل /start رسالة ترحيب مع لوحة مفاتيح مضمَّنة',
          'يُدرج /help جميع الأوامر المتاحة مع أوصاف موجزة',
          'تتلقى الأوامر غير المعروفة رسالة احتياطية ودية',
          'تعمل الأوامر في كلٍّ من المحادثة الخاصة وسياق المجموعة',
          'يتم التقاط أخطاء المعالج وإعلام المستخدم — لا إخفاقات صامتة',
        ],
      },
      restrictions: {
        en: [
          'Do not use bot.on("message") as a catch-all — use specific filter methods.',
          'Do not reply to bot messages from other bots to prevent loops.',
        ],
        ar: [
          'لا تستخدم bot.on("message") كشبكة صيد عامة — استخدم أساليب التصفية المحددة.',
          'لا ترد على رسائل البوت من البوتات الأخرى لمنع الحلقات.',
        ],
      },
      dependsOn: ['02_bot_config'],
    },
    {
      id: '04_message_handlers',
      title: { en: 'Message handlers', ar: 'معالجات الرسائل' },
      type: 'implementation',
      goal: {
        en: 'Handle text messages, callback queries from inline keyboards, and file uploads. Implement conversation flow for multi-step interactions.',
        ar: 'معالجة الرسائل النصية واستعلامات رد الاتصال من لوحات المفاتيح المضمَّنة وتحميل الملفات. تنفيذ تدفق المحادثة للتفاعلات متعددة الخطوات.',
      },
      recommendedLibraries: [
        { name: 'grammy', purpose: 'Context and middleware', required: true },
        { name: '@grammyjs/conversations', purpose: 'Multi-step conversation flows', required: false, alternative: 'Scenes with telegraf' },
      ],
      successCriteria: {
        en: [
          'Callback queries answered within 10 seconds (Telegram timeout)',
          'Multi-step conversations preserve state across messages',
          'File uploads (photos, documents) handled with size validation',
          'answerCallbackQuery called on every inline button press',
        ],
        ar: [
          'يتم الرد على استعلامات رد الاتصال خلال 10 ثوانٍ (مهلة تيليغرام)',
          'تحافظ المحادثات متعددة الخطوات على الحالة عبر الرسائل',
          'يتم معالجة تحميل الملفات (الصور، المستندات) مع التحقق من الحجم',
          'استدعاء answerCallbackQuery عند كل ضغطة على زر مضمَّن',
        ],
      },
      restrictions: {
        en: [
          'Do not send more than 30 messages per second (Telegram rate limit).',
          'Do not store message content permanently without user consent.',
        ],
        ar: [
          'لا ترسل أكثر من 30 رسالة في الثانية (حد معدل تيليغرام).',
          'لا تخزن محتوى الرسائل بشكل دائم بدون موافقة المستخدم.',
        ],
      },
      dependsOn: ['03_command_handlers'],
    },
    {
      id: '05_error_handling',
      title: { en: 'Error handling', ar: 'معالجة الأخطاء' },
      type: 'implementation',
      goal: {
        en: 'Implement a global error handler for the bot. Catch unhandled errors, send user-friendly replies, and log errors for debugging.',
        ar: 'تنفيذ معالج أخطاء عالمي للبوت. التقاط الأخطاء غير المعالجة وإرسال ردود سهلة الاستخدام وتسجيل الأخطاء لأغراض التصحيح.',
      },
      recommendedLibraries: [
        { name: 'grammy', purpose: 'bot.catch() global error handler', required: true },
        { name: 'pino', purpose: 'Structured error logging', required: true },
      ],
      successCriteria: {
        en: [
          'bot.catch() registered to handle all unhandled errors',
          'Users always receive a reply — no silent failures',
          'Error details logged with request context (update_id, user_id)',
          'Bot remains running after an error — no process crash',
          'Test: throwing inside a handler does not crash the bot process',
        ],
        ar: [
          'تسجيل bot.catch() لمعالجة جميع الأخطاء غير المعالجة',
          'يتلقى المستخدمون دائمًا ردًا — لا إخفاقات صامتة',
          'تفاصيل الخطأ مسجَّلة مع سياق الطلب (update_id، user_id)',
          'يبقى البوت يعمل بعد حدوث خطأ — لا انهيار للعملية',
          'اختبار: الإلقاء داخل معالج لا يُسقط عملية البوت',
        ],
      },
      restrictions: {
        en: [
          'Do not send stack traces to users — log them server-side only.',
        ],
        ar: [
          'لا ترسل تتبعات المكدس للمستخدمين — سجّلها من جانب الخادم فقط.',
        ],
      },
      dependsOn: ['04_message_handlers'],
    },
    {
      id: '06_keyboards',
      title: { en: 'Keyboards & menus', ar: 'لوحات المفاتيح والقوائم' },
      type: 'implementation',
      goal: {
        en: 'Build reusable inline keyboard builders and reply keyboards. Implement a menu system for navigating bot features.',
        ar: 'بناء منشئي لوحة مفاتيح مضمَّنة قابلة لإعادة الاستخدام ولوحات مفاتيح الرد. تنفيذ نظام قوائم للتنقل في ميزات البوت.',
      },
      recommendedLibraries: [
        { name: 'grammy', purpose: 'InlineKeyboard and Keyboard builders', required: true },
        { name: '@grammyjs/menu', purpose: 'Dynamic, state-aware menu system', required: false },
      ],
      successCriteria: {
        en: [
          'Inline keyboards use callback_data under 64 bytes',
          'Keyboard builders are pure functions returning InlineKeyboard objects',
          'Menu navigation has a consistent "back" button pattern',
          'Keyboards render correctly on iOS, Android, and Telegram Desktop',
        ],
        ar: [
          'تستخدم لوحات المفاتيح المضمَّنة callback_data أقل من 64 بايت',
          'منشئو لوحة المفاتيح وظائف بحتة تُرجع كائنات InlineKeyboard',
          'تنقل القائمة له نمط زر "رجوع" متسق',
          'تُصيَّر لوحات المفاتيح بشكل صحيح على iOS وAndroid وسطح مكتب تيليغرام',
        ],
      },
      restrictions: {
        en: [
          'Do not exceed 8 buttons per row — Telegram truncates them silently.',
          'Do not use keyboard button text longer than 40 characters.',
        ],
        ar: [
          'لا تتجاوز 8 أزرار لكل صف — تيليغرام يقطعها بصمت.',
          'لا تستخدم نص زر لوحة مفاتيح أطول من 40 حرفًا.',
        ],
      },
      dependsOn: ['03_command_handlers'],
    },
    {
      id: '09_webhooks',
      title: { en: 'Webhook setup', ar: 'إعداد Webhook' },
      type: 'delivery',
      goal: {
        en: 'Switch from long-polling to webhook delivery for production. Set up an HTTPS endpoint and register it with Telegram.',
        ar: 'التحويل من الاستطلاع الطويل إلى تسليم webhook للإنتاج. إعداد نقطة نهاية HTTPS وتسجيلها مع تيليغرام.',
      },
      recommendedLibraries: [
        { name: 'hono', purpose: 'Lightweight HTTP server for webhook endpoint', required: false, alternative: 'express' },
        { name: 'grammy', purpose: 'webhookCallback adapter', required: true },
      ],
      successCriteria: {
        en: [
          'Webhook secret token configured (prevents spoofed requests)',
          'setWebhook called with the production HTTPS URL',
          'Telegram confirms webhook is active (getWebhookInfo)',
          'Server responds to webhook requests within 5 seconds',
        ],
        ar: [
          'رمز سر Webhook مُكوَّن (يمنع الطلبات المزيفة)',
          'استدعاء setWebhook مع عنوان URL HTTPS للإنتاج',
          'تيليغرام يؤكد أن webhook نشط (getWebhookInfo)',
          'يستجيب الخادم لطلبات webhook في غضون 5 ثوانٍ',
        ],
      },
      restrictions: {
        en: [
          'Webhook endpoint must use HTTPS — Telegram rejects HTTP.',
          'Do not expose the webhook URL publicly without the secret token check.',
        ],
        ar: [
          'يجب أن تستخدم نقطة نهاية Webhook HTTPS — تيليغرام يرفض HTTP.',
          'لا تكشف عنوان URL الخاص بـ webhook علنًا بدون فحص الرمز السري.',
        ],
      },
      dependsOn: ['06_keyboards'],
    },
    {
      id: '10_deployment',
      title: { en: 'Deployment', ar: 'النشر' },
      type: 'delivery',
      goal: {
        en: 'Deploy the bot to Railway, Fly.io, or a VPS. Configure environment variables, auto-restart on crash, and process monitoring.',
        ar: 'نشر البوت على Railway أو Fly.io أو VPS. تكوين متغيرات البيئة وإعادة التشغيل التلقائي عند الانهيار ومراقبة العمليات.',
      },
      recommendedLibraries: [
        { name: 'railway', purpose: 'Zero-config deployment with env var management', required: false, alternative: 'Fly.io / Render' },
      ],
      successCriteria: {
        en: [
          'Bot responds to messages in production within 2 seconds',
          'Process restarts automatically on crash',
          'Logs accessible from deployment dashboard',
          'Environment variables set in deployment platform, not in code',
        ],
        ar: [
          'يستجيب البوت للرسائل في الإنتاج خلال ثانيتين',
          'تعيد العملية التشغيل تلقائيًا عند الانهيار',
          'السجلات قابلة للوصول من لوحة تحكم النشر',
          'متغيرات البيئة مُعيَّنة في منصة النشر، وليس في الكود',
        ],
      },
      restrictions: {
        en: [
          'Do not run more than one bot instance with polling — use webhooks for multi-instance setups.',
        ],
        ar: [
          'لا تشغّل أكثر من مثيل بوت واحد مع الاستطلاع — استخدم webhooks للإعدادات متعددة المثيلات.',
        ],
      },
      dependsOn: ['09_webhooks'],
    },
  ],
  conditionalSteps: [
    {
      id: '05_inline_queries',
      title: { en: 'Inline queries', ar: 'الاستعلامات المضمَّنة' },
      type: 'implementation',
      goal: {
        en: 'Implement inline query handler so users can use the bot from any chat by typing @botname query.',
        ar: 'تنفيذ معالج الاستعلام المضمَّن حتى يتمكن المستخدمون من استخدام البوت من أي محادثة بكتابة @botname استعلام.',
      },
      includeWhen: (f) => f.includes('inline'),
      recommendedLibraries: [
        { name: 'grammy', purpose: 'on("inline_query") handler', required: true },
      ],
      successCriteria: {
        en: [
          'Inline query returns results within 5 seconds',
          'answerInlineQuery called with cache_time set appropriately',
          'Empty query returns helpful default results',
          'Inline mode enabled in BotFather settings',
        ],
        ar: [
          'يُرجع الاستعلام المضمَّن نتائج خلال 5 ثوانٍ',
          'استدعاء answerInlineQuery مع cache_time مُعيَّن بشكل مناسب',
          'الاستعلام الفارغ يُرجع نتائج افتراضية مفيدة',
          'الوضع المضمَّن مُفعَّل في إعدادات BotFather',
        ],
      },
      restrictions: {
        en: [
          'Do not return more than 50 results per inline query response.',
        ],
        ar: [
          'لا تُرجع أكثر من 50 نتيجة لكل استجابة استعلام مضمَّن.',
        ],
      },
      dependsOn: ['03_command_handlers'],
    },
    {
      id: '07_database',
      title: { en: 'Database storage', ar: 'تخزين قاعدة البيانات' },
      type: 'implementation',
      goal: {
        en: 'Add persistent storage for user preferences, session data, and bot state using Prisma and PostgreSQL.',
        ar: 'إضافة تخزين دائم لتفضيلات المستخدم وبيانات الجلسة وحالة البوت باستخدام Prisma وPostgreSQL.',
      },
      includeWhen: (f) => f.includes('database'),
      recommendedLibraries: [
        { name: 'prisma', purpose: 'ORM + migrations', required: true },
        { name: '@prisma/client', purpose: 'Type-safe queries', required: true },
        { name: '@grammyjs/storage-prisma', purpose: 'Prisma session storage adapter', required: false },
      ],
      successCriteria: {
        en: [
          'User record auto-created on first /start interaction',
          'Session data persists across bot restarts',
          'Database connection retried on failure with exponential backoff',
          'Prisma migrations applied before bot starts',
        ],
        ar: [
          'يُنشأ سجل المستخدم تلقائيًا عند أول تفاعل /start',
          'تستمر بيانات الجلسة عبر إعادة تشغيل البوت',
          'يُعاد محاولة اتصال قاعدة البيانات عند الفشل مع تراجع أُسي',
          'يتم تطبيق ترحيلات Prisma قبل بدء البوت',
        ],
      },
      restrictions: {
        en: [
          'Do not store the full message content — store only what is needed for functionality.',
        ],
        ar: [
          'لا تخزن محتوى الرسائل الكامل — خزّن فقط ما هو مطلوب للوظيفة.',
        ],
      },
      dependsOn: ['01_project_setup'],
    },
    {
      id: '08_admin_commands',
      title: { en: 'Admin commands', ar: 'أوامر الإدارة' },
      type: 'implementation',
      goal: {
        en: 'Implement admin-only commands: broadcast, ban/unban users, view stats. Admin IDs loaded from environment variable.',
        ar: 'تنفيذ أوامر للمسؤولين فقط: البث وحظر/رفع الحظر عن المستخدمين وعرض الإحصاءات. معرفات المسؤول مُحمَّلة من متغير البيئة.',
      },
      includeWhen: (f) => f.includes('admin'),
      recommendedLibraries: [
        { name: 'grammy', purpose: 'Middleware for admin ID check', required: true },
      ],
      successCriteria: {
        en: [
          'Admin commands fail silently for non-admins (no error message shown)',
          'ADMIN_IDS loaded from environment as comma-separated Telegram user IDs',
          'Broadcast command sends to all active users with rate limiting',
          'Ban command prevents banned users from interacting with the bot',
        ],
        ar: [
          'تفشل أوامر الإدارة بصمت للمستخدمين غير الإداريين (لا تُظهر رسالة خطأ)',
          'ADMIN_IDS مُحمَّلة من البيئة كمعرفات مستخدم تيليغرام مفصولة بفواصل',
          'يُرسل أمر البث إلى جميع المستخدمين النشطين مع تحديد المعدل',
          'يمنع أمر الحظر المستخدمين المحظورين من التفاعل مع البوت',
        ],
      },
      restrictions: {
        en: [
          'Do not expose admin commands in the public /help text.',
        ],
        ar: [
          'لا تكشف أوامر الإدارة في نص /help العام.',
        ],
      },
      dependsOn: ['07_database'],
    },
  ],
};

export default telegramBot;
