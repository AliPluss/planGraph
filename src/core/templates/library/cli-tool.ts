import type { Template } from '../types';

const cliTool: Template = {
  id: 'cli-tool',
  kind: 'cli-tool',
  name: { en: 'CLI Tool (Node.js)', ar: 'أداة سطر الأوامر (Node.js)' },
  description: {
    en: 'Command-line tool with subcommands, config management, rich output formatting, and npm distribution.',
    ar: 'أداة سطر أوامر مع أوامر فرعية وإدارة إعداد وتنسيق إخراج غني وتوزيع npm.',
  },
  defaultStack: ['Node.js', 'TypeScript', 'commander.js', 'chalk', 'tsup'],
  protectedFiles: [
    '.env', '.env.local', 'secrets/**', '.git/**',
    'dist/**', '*.pem', '*.key',
  ],
  baseSteps: [
    {
      id: '01_project_setup',
      title: { en: 'Project setup', ar: 'إعداد المشروع' },
      type: 'setup',
      goal: {
        en: 'Bootstrap a Node.js CLI project with TypeScript, tsup for bundling, and a shebang entry point. Configure package.json bin field.',
        ar: 'إنشاء مشروع CLI Node.js مع TypeScript وtsup للتجميع ونقطة دخول shebang. تكوين حقل bin في package.json.',
      },
      recommendedLibraries: [
        { name: 'typescript', purpose: 'Type safety', required: true },
        { name: 'tsup', purpose: 'Bundle TS to CJS/ESM for distribution', required: true },
        { name: 'tsx', purpose: 'Run TS in development without compiling', required: true },
        { name: '@types/node', purpose: 'Node.js type definitions', required: true },
      ],
      successCriteria: {
        en: [
          '`npm run dev` runs the CLI entry point without compilation',
          '`npm run build` emits dist/index.js with correct shebang',
          '`npm link` then `<tool-name> --version` outputs the correct version',
          'TypeScript strict mode enabled',
          'package.json has correct "bin", "main", "types", "files" fields',
        ],
        ar: [
          'يشغّل `npm run dev` نقطة دخول CLI بدون تجميع',
          'يُصدر `npm run build` dist/index.js مع shebang صحيح',
          'يُخرج `npm link` ثم `<اسم-الأداة> --version` الإصدار الصحيح',
          'وضع TypeScript الصارم مُفعَّل',
          'package.json يحتوي على حقول "bin" و"main" و"types" و"files" الصحيحة',
        ],
      },
      restrictions: {
        en: [
          'Do not publish to npm in this step — only set up the build pipeline.',
          'Do not add command logic yet — only the entry point and build config.',
        ],
        ar: [
          'لا تنشر على npm في هذه الخطوة — فقط أعدد خط أنابيب البناء.',
          'لا تضف منطق الأوامر بعد — فقط نقطة الدخول وإعداد البناء.',
        ],
      },
      dependsOn: [],
    },
    {
      id: '02_command_parser',
      title: { en: 'Command parser', ar: 'محلل الأوامر' },
      type: 'implementation',
      goal: {
        en: 'Set up commander.js with the main program, version, help text, and at least a stub for each planned subcommand.',
        ar: 'إعداد commander.js مع البرنامج الرئيسي والإصدار ونص المساعدة ونموذج مؤقت على الأقل لكل أمر فرعي مخطط.',
      },
      recommendedLibraries: [
        { name: 'commander', purpose: 'Argument parsing and subcommand routing', required: true },
        { name: 'chalk', purpose: 'Terminal color output', required: true },
        { name: 'ora', purpose: 'Terminal spinner for async operations', required: true },
      ],
      successCriteria: {
        en: [
          '`<tool> --help` shows all commands with descriptions',
          '`<tool> <cmd> --help` shows command-specific help',
          'Unknown commands print a helpful error, not a stack trace',
          'Version flag reads from package.json automatically',
          'Global options (--verbose, --json, --no-color) registered',
        ],
        ar: [
          'يُظهر `<الأداة> --help` جميع الأوامر مع أوصافها',
          'يُظهر `<الأداة> <أمر> --help` المساعدة الخاصة بالأمر',
          'تطبع الأوامر غير المعروفة خطأ مفيدًا، وليس تتبع مكدس',
          'يقرأ علَم الإصدار من package.json تلقائيًا',
          'الخيارات العالمية (--verbose، --json، --no-color) مسجَّلة',
        ],
      },
      restrictions: {
        en: [
          'Do not use process.exit(0) inside command handlers — throw errors instead.',
          'Do not use synchronous console.log in library code — use a logger abstraction.',
        ],
        ar: [
          'لا تستخدم process.exit(0) داخل معالجات الأوامر — ارمِ الأخطاء بدلاً من ذلك.',
          'لا تستخدم console.log المتزامن في كود المكتبة — استخدم تجريد logger.',
        ],
      },
      dependsOn: ['01_project_setup'],
    },
    {
      id: '03_config_management',
      title: { en: 'Config management', ar: 'إدارة الإعداد' },
      type: 'implementation',
      goal: {
        en: 'Implement user configuration stored at ~/.config/<tool>/config.json. Support `init`, `get`, `set`, `reset` config subcommands.',
        ar: 'تنفيذ إعداد المستخدم المخزَّن في ~/.config/<الأداة>/config.json. دعم أوامر إعداد فرعية `init` و`get` و`set` و`reset`.',
      },
      recommendedLibraries: [
        { name: 'conf', purpose: 'XDG-compliant config file management', required: true },
        { name: 'zod', purpose: 'Config schema validation on load', required: true },
      ],
      successCriteria: {
        en: [
          'Config file created on first run if absent',
          '`<tool> config set key value` persists the value',
          '`<tool> config get key` reads and prints the value',
          'Config validated against Zod schema on every load',
          'Corrupt config file produces a clear error message with recovery instructions',
        ],
        ar: [
          'يُنشأ ملف الإعداد عند أول تشغيل إذا لم يكن موجودًا',
          'يحفظ `<الأداة> config set مفتاح قيمة` القيمة',
          'يقرأ ويطبع `<الأداة> config get مفتاح` القيمة',
          'يتم التحقق من صحة الإعداد مقابل مخطط Zod عند كل تحميل',
          'يُنتج ملف الإعداد التالف رسالة خطأ واضحة مع تعليمات الاسترداد',
        ],
      },
      restrictions: {
        en: [
          'Do not store secrets (API keys, passwords) in the config file — use keytar or OS keychain.',
          'Do not use ~/.toolrc dot-files — follow XDG base directory spec.',
        ],
        ar: [
          'لا تخزن الأسرار (مفاتيح API، كلمات المرور) في ملف الإعداد — استخدم keytar أو سلسلة مفاتيح نظام التشغيل.',
          'لا تستخدم ملفات نقطية ~/.toolrc — اتبع مواصفات دليل XDG الأساسي.',
        ],
      },
      dependsOn: ['02_command_parser'],
    },
    {
      id: '04_core_commands',
      title: { en: 'Core commands', ar: 'الأوامر الأساسية' },
      type: 'implementation',
      goal: {
        en: 'Implement the main commands that deliver the tool\'s primary value. Each command should be a single-responsibility module.',
        ar: 'تنفيذ الأوامر الرئيسية التي تُقدِّم القيمة الأساسية للأداة. يجب أن يكون كل أمر وحدة ذات مسؤولية واحدة.',
      },
      recommendedLibraries: [
        { name: 'execa', purpose: 'Child process spawning with better error messages', required: false, alternative: 'node:child_process' },
        { name: 'fs-extra', purpose: 'Enhanced file system utilities', required: false, alternative: 'node:fs/promises' },
      ],
      successCriteria: {
        en: [
          'Each command exits with code 0 on success, 1 on error',
          'All async operations show progress with ora spinners',
          'Verbose mode (`--verbose`) shows debug information',
          'Commands are idempotent where possible (re-running is safe)',
        ],
        ar: [
          'يخرج كل أمر برمز 0 عند النجاح، 1 عند الخطأ',
          'تُظهر جميع العمليات غير المتزامنة التقدم مع مؤشرات ora الدوارة',
          'يُظهر وضع Verbose (`--verbose`) معلومات التصحيح',
          'الأوامر ذات نتائج متكافئة حيثما أمكن (إعادة التشغيل آمنة)',
        ],
      },
      restrictions: {
        en: [
          'Do not write commands that require sudo/elevated permissions.',
          'Do not access the internet without informing the user first.',
        ],
        ar: [
          'لا تكتب أوامر تتطلب أذونات sudo/مرتفعة.',
          'لا تصل إلى الإنترنت بدون إعلام المستخدم أولاً.',
        ],
      },
      dependsOn: ['03_config_management'],
    },
    {
      id: '05_output_formatting',
      title: { en: 'Output formatting', ar: 'تنسيق الإخراج' },
      type: 'implementation',
      goal: {
        en: 'Implement a consistent output layer: coloured tables, success/error indicators, JSON mode for scripting, and --no-color support.',
        ar: 'تنفيذ طبقة إخراج متسقة: جداول ملوَّنة ومؤشرات نجاح/خطأ ووضع JSON للبرمجة النصية ودعم --no-color.',
      },
      recommendedLibraries: [
        { name: 'chalk', purpose: 'Terminal colour', required: true },
        { name: 'cli-table3', purpose: 'Table rendering', required: false, alternative: 'columnify' },
        { name: 'boxen', purpose: 'Bordered boxes for important messages', required: false },
      ],
      successCriteria: {
        en: [
          '`--json` flag outputs machine-readable JSON to stdout',
          'Errors go to stderr, not stdout',
          'Color is disabled automatically in non-TTY environments (pipes, CI)',
          'Success messages are green, errors red, warnings yellow',
        ],
        ar: [
          'يُخرج علَم `--json` JSON قابلاً للقراءة آليًا إلى stdout',
          'تذهب الأخطاء إلى stderr، وليس stdout',
          'يُعطَّل اللون تلقائيًا في بيئات غير TTY (الأنابيب، CI)',
          'رسائل النجاح باللون الأخضر، والأخطاء باللون الأحمر، والتحذيرات باللون الأصفر',
        ],
      },
      restrictions: {
        en: [
          'Do not use emoji in output unless the user explicitly enables them — many terminals do not support them.',
          'Do not use ansi escape codes directly — use chalk.',
        ],
        ar: [
          'لا تستخدم الرموز التعبيرية في الإخراج ما لم يُفعّلها المستخدم صراحةً — كثير من الطرفيات لا تدعمها.',
          'لا تستخدم رموز الهروب ANSI مباشرةً — استخدم chalk.',
        ],
      },
      dependsOn: ['04_core_commands'],
    },
    {
      id: '06_error_handling',
      title: { en: 'Error handling', ar: 'معالجة الأخطاء' },
      type: 'implementation',
      goal: {
        en: 'Define custom error classes (CLIError, ConfigError, NetworkError). Catch and format all errors at the top-level entry point.',
        ar: 'تعريف فئات خطأ مخصصة (CLIError وConfigError وNetworkError). التقاط وتنسيق جميع الأخطاء عند نقطة الدخول المستوى الأعلى.',
      },
      recommendedLibraries: [
        { name: 'chalk', purpose: 'Error message formatting', required: true },
      ],
      successCriteria: {
        en: [
          'All custom errors extend a base CLIError class with exitCode and isUserFacing fields',
          'User-facing errors show a friendly message without a stack trace',
          'Developer errors (unexpected) log stack traces when --verbose',
          'Exit code 0 = success, 1 = user error, 2 = unexpected/internal error',
        ],
        ar: [
          'جميع الأخطاء المخصصة تمتد من فئة CLIError أساسية مع حقول exitCode وisUserFacing',
          'تُظهر أخطاء المستخدم رسالة ودية بدون تتبع مكدس',
          'تسجّل أخطاء المطور (غير المتوقعة) تتبعات المكدس عند --verbose',
          'رمز الخروج 0 = نجاح، 1 = خطأ مستخدم، 2 = خطأ غير متوقع/داخلي',
        ],
      },
      restrictions: {
        en: [
          'Do not swallow errors silently — always either handle or rethrow.',
        ],
        ar: [
          'لا تبتلع الأخطاء بصمت — تعامل معها دائمًا أو أعد رميها.',
        ],
      },
      dependsOn: ['05_output_formatting'],
    },
    {
      id: '07_testing',
      title: { en: 'Testing', ar: 'الاختبار' },
      type: 'verification',
      goal: {
        en: 'Write unit tests for command logic and integration tests that spawn the CLI as a subprocess and assert stdout/stderr/exit code.',
        ar: 'كتابة اختبارات الوحدة لمنطق الأوامر واختبارات التكامل التي تشغّل CLI كعملية فرعية وتؤكد stdout/stderr/رمز الخروج.',
      },
      recommendedLibraries: [
        { name: 'vitest', purpose: 'Unit test runner', required: true },
        { name: 'execa', purpose: 'Spawn CLI as subprocess in integration tests', required: true },
      ],
      successCriteria: {
        en: [
          'Each command has at least one happy-path test',
          'Error paths tested: missing required args, invalid config, network failure',
          '`--help` output tested for regression',
          'Exit codes verified for success and error cases',
        ],
        ar: [
          'كل أمر له اختبار مسار سعيد واحد على الأقل',
          'اختبار مسارات الخطأ: الوسائط المطلوبة المفقودة والإعداد غير الصالح وفشل الشبكة',
          'اختبار إخراج `--help` للانحدار',
          'التحقق من رموز الخروج لحالات النجاح والخطأ',
        ],
      },
      restrictions: {
        en: [
          'Do not test implementation details — test observable behaviour (stdout, exit codes).',
        ],
        ar: [
          'لا تختبر تفاصيل التنفيذ — اختبر السلوك الملحوظ (stdout، رموز الخروج).',
        ],
      },
      dependsOn: ['06_error_handling'],
    },
    {
      id: '08_packaging',
      title: { en: 'Packaging & distribution', ar: 'التعبئة والتوزيع' },
      type: 'delivery',
      goal: {
        en: 'Prepare the package for npm publish. Configure .npmignore, verify the package size, and do a dry-run publish.',
        ar: 'إعداد الحزمة لنشر npm. تكوين .npmignore والتحقق من حجم الحزمة وإجراء نشر تجريبي.',
      },
      recommendedLibraries: [
        { name: 'publint', purpose: 'Lint package.json for publish correctness', required: true },
        { name: 'np', purpose: 'Interactive npm publish workflow with git tagging', required: false },
      ],
      successCriteria: {
        en: [
          '`npm pack --dry-run` lists only dist/, README, LICENSE',
          '`publint` passes with no errors',
          'Package size under 500 KB unpacked',
          'README includes install command, quick start, and all command references',
          'CHANGELOG.md exists with at least an initial release entry',
        ],
        ar: [
          'يُدرج `npm pack --dry-run` فقط dist/ وREADME وLICENSE',
          'يمر `publint` بدون أخطاء',
          'حجم الحزمة أقل من 500 كيلوبايت غير مضغوطة',
          'يتضمن README أمر التثبيت والبدء السريع ومراجع جميع الأوامر',
          'CHANGELOG.md موجود مع إدخال إصدار أولي على الأقل',
        ],
      },
      restrictions: {
        en: [
          'Do not publish from a dirty git working tree — tag the release commit first.',
          'Do not use npm publish without running the test suite first.',
        ],
        ar: [
          'لا تنشر من شجرة عمل git متسخة — ضع علامة على إيداع الإصدار أولاً.',
          'لا تستخدم npm publish بدون تشغيل مجموعة الاختبار أولاً.',
        ],
      },
      dependsOn: ['07_testing'],
    },
  ],
  conditionalSteps: [],
};

export default cliTool;
