# poster

## كيف يعمل الآن (سطر بسطر)

1) شغّل Reddit:
```bash
npm run reddit
```
- يفتح المتصفح بشكل مرئي (`headless: false`).
- يذهب إلى `https://www.reddit.com`.
- يحفظ الجلسة في مجلد `reddit-session`.

2) شغّل LinkedIn:
```bash
npm run linkedin
```
- يفتح المتصفح بشكل مرئي.
- يذهب إلى `https://www.linkedin.com`.
- يحفظ الجلسة في `linkedin-session`.

3) شغّل Instagram:
```bash
npm run instagram
```
- يفتح المتصفح بشكل مرئي.
- يذهب إلى `https://www.instagram.com`.
- يحفظ الجلسة في `instagram-session`.


4) شغّل التحميل والتشغيل عبر بايثون:
```bash
npm run star
```
- يشغّل ملف `STAR` (بايثون).
- ينفّذ `npm install` لتنزيل/تحديث كل الاعتمادات.
- ثم ينفّذ `npm start` لتشغيل المشروع.

## ملاحظات سريعة
- أول تشغيل: سجل دخولك يدويًا داخل كل منصة.
- التشغيلات التالية: سيستخدم نفس الجلسة المحفوظة غالبًا.
- أغلق نافذة المتصفح عندما تنتهي.

## الملفات
- `redit.js`: فتح Reddit.
- `linkdin.js`: فتح LinkedIn.
- `instagram.js`: فتح Instagram.
