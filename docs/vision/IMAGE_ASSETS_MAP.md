# PlanGraph MVP 2 — Image Assets Map

هذا الملف يثبت أسماء الصور الرسمية داخل المشروع حتى لا نعتمد على أسماء عشوائية من مولد الصور.

| File | Screen / Concept | Usage |
|---|---|---|
| `01-dashboard-overview-v1.png` | Dashboard Overview V1 | لوحة رئيسية تعرض ملخص التقدم، المشروع النشط، المشغلات، الذاكرة، اللقطات، المعطلات، والنشاط الأخير. |
| `02-projects-templates-v1.png` | Projects & Templates V1 | صفحة المشاريع والقوالب مع شبكة مشاريع، معاينة جانبية، وقوالب موصى بها. |
| `03-ai-planning-chat-v1.png` | AI Planning Chat V1 | واجهة المساعد الذكي لتحويل الفكرة إلى خطة عبر محادثة، مرفقات، وملخص مشروع مقترح. |
| `04-graph-workspace-v1.png` | Graph Workspace V1 | مساحة المخطط الأساسية مع عقد مترابطة ولوحة تفاصيل العقدة. |
| `05-execution-center-v1.png` | Execution Center V1 | مركز التنفيذ مع قائمة خطوات، اختيار منفذين، معاينة التصحيح، وسجل تنفيذ. |
| `06-ai-model-graph-map.png` | AI Model Graph Map | خريطة بصرية لمثال AI Model وتفرعات المهارات والمكتبات والأدوات والتنفيذ. |
| `07-node-system.png` | Node System | إنفوجرافيك أنواع العقد ومكونات البطاقة. |
| `08-dashboard-overview-v2.png` | Dashboard Overview V2 | نسخة بديلة للوحة الرئيسية مع توزيع أحدث وأزرار إجراءات سريعة. |
| `09-graph-workspace-v2.png` | Graph Workspace V2 | نسخة أكثر تفصيلاً لمساحة المخطط مع قائمة أنواع العقد ومخطط مصغر. |
| `10-projects-templates-v2.png` | Projects & Templates V2 | نسخة بديلة لصفحة المشاريع والقوالب مع لوحة معاينة تفصيلية. |
| `11-ai-planning-chat-v2.png` | AI Planning Chat V2 | نسخة أكثر تكاملاً للمساعد الذكي مع ملخص الخطة ومعاينة المخطط والمرفقات. |
| `12-execution-center-v2.png` | Execution Center V2 | نسخة بديلة لمركز التنفيذ تركز على صفّ التنفيذ، التوكنات، وتفاصيل الخطوة الجانبية. |
| `13-library-memory.png` | Library & Memory | صفحة المكتبة والذاكرة لملفات Markdown والملاحظات والتقارير والأصول المرفقة. |
| `14-snapshots-import.png` | Snapshots & Import | صفحة اللقطات والاستيراد مع مقارنة نسخ، استعادة، واستيراد من ZIP أو مجلد أو Git أو Markdown. |
| `15-validation-audit-reports.png` | Validation, Audit & Reports | صفحة التحقق والتدقيق والتقارير مع مؤشرات الصحة والقضايا وسجل التدقيق. |
| `16-settings-workspace.png` | Settings & Workspace | صفحة الإعدادات ومساحة العمل للمشغلات، التخزين، التوكن، الخصوصية، والمظهر واللغة. |
| `17-ai-model-graph-vision.png` | AI Model Graph Vision | إنفوجرافيك الرؤية الشاملة من الفكرة إلى التخطيط والرسم البياني وMarkdown والتنفيذ. |

## Naming Rule

- الأرقام من `01` إلى `17` تحفظ ترتيب القراءة داخل وثائق الرؤية.
- الصور التي تنتهي بـ `v1` و `v2` هي بدائل تصميمية لنفس الصفحة، وليست تكرارًا خاطئًا.
- الأفضل في التنفيذ اعتماد نسخة واحدة كتصميم أساسي، وترك الأخرى كمرجع داخل الوثائق.

## Visual Source-of-Truth Mapping

Use the screenshots in `docs/vision/assets` as the visual source of truth. Match only the relevant screen pair for the current session before moving to the next screen.

| Source screenshots | Target screen |
|---|---|
| `01-dashboard-overview-v1.png`<br>`08-dashboard-overview-v2.png` | Dashboard / الرئيسية |
| `02-projects-templates-v1.png`<br>`10-projects-templates-v2.png` | Projects + Templates / المشاريع والقوالب |
| `03-ai-planning-chat-v1.png`<br>`11-ai-planning-chat-v2.png` | AI Planning Chat / مساعد التخطيط الذكي |
| `04-graph-workspace-v1.png`<br>`09-graph-workspace-v2.png`<br>`06-ai-model-graph-map.png` | Graph Workspace / مساحة المخطط |
| `05-execution-center-v1.png`<br>`12-execution-center-v2.png` | Execution Center / مركز التنفيذ |
| `07-node-system.png` | Node Cards / نظام العقد |
| `13-library-memory.png` | Library + Memory / المكتبة والذاكرة |
| `14-snapshots-import.png` | Snapshots + Import / اللقطات والاستيراد |
| `15-validation-audit-reports.png` | Validation + Audit + Reports / التحقق والتدقيق والتقارير |
| `16-settings-workspace.png` | Settings / الإعدادات ومساحة العمل |
| `17-ai-model-graph-vision.png` | Product Vision / الرؤية العامة للنظام |
