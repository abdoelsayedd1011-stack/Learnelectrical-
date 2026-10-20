# إزاي ترفع الموقع على الدومين بتاعك

الفولدر ده (`website`) هو الموقع كله. مفيش أي برنامج محتاج يتسطّب، ومفيش داتابيز. ارفع الملفات زي ما هي.

> ملحوظة: ملف `DEPLOY-AR.md` ده ليك انت بس، ممكن تمسحه قبل الرفع أو تسيبه، مش هيأثر.

---

## أ) الاسم والدومين وبيانات التواصل

الموقع متظبط جاهز على الاسم **LearnElectrical** والدومين **www.learnelectricals.com** (في `site-config.js` و `CNAME` و `sitemap.xml` و `robots.txt` وتاجات `canonical` و `og:url` و `og:image` في كل الصفحات).

1. **وسائل التواصل:** في `site-config.js` الخانات `whatsapp` و `email` و `facebook` و `youtube` فاضية `""`. وهي فاضية، الموقع بيخبي كل أزرار ولينكات التواصل، وصفحة التواصل بتكتب «وسائل التواصل هتتضاف قريب». أول ما تكتب أي واحدة، الكروت والأزرار بتظهر لوحدها.
   - الواتساب: الرقم بالكود الدولي من غير `+` ولا مسافات، مثال: `201001234567`.
2. **لو اشتريت دومين تاني** (مثلاً `learn-electrical.net`): في VS Code دوس `Ctrl+Shift+H` (بحث واستبدال في الفولدر كله)، اكتب `learnelectricals.com` واستبدله بالدومين الجديد من غير www، ودوس Replace All. ده بيغيّر كل الأماكن مرة واحدة.
   (لينكس/ماك: `grep -rl learnelectricals.com . | xargs sed -i 's/learnelectrical\.com/learn-electrical.net/g'`)
3. **لو عايز تغيّر الاسم:** غيّر `name` في `site-config.js` (اللوجو والفوتر بيتغيروا لوحدهم)، وغيّر كلمة `LearnElectrical` في عناوين الصفحات بنفس طريقة البحث والاستبدال.

## ب) اشتري الدومين

1. ادخل على أي مسجّل دومينات: Namecheap أو GoDaddy أو Cloudflare Registrar (الأرخص في التجديد عادةً).
2. دوّر على الاسم اللي عايزه بـ `.com` واشتريه (سنة أو أكتر).
3. احتفظ بإيميل وباسورد حساب المسجّل؛ هتحتاج تدخل منه على إعدادات **DNS**.

## ج) اختار طريقة استضافة واحدة من التلاتة

### 1) Cloudflare Pages أو Netlify (ببلاش وأسهل حاجة) — مُقترح

1. اعمل حساب على `pages.cloudflare.com` أو `app.netlify.com`.
2. Cloudflare: **Workers & Pages → Create → Pages → Upload assets**. Netlify: **Add new site → Deploy manually**.
3. اسحب فولدر `website` كله وارميه في المربع، واستنى لحد ما يقولك تم. هياخد لينك تجريبي (مثال `xxx.pages.dev` أو `xxx.netlify.app`)، افتحه وجرّب.
4. من إعدادات المشروع: **Custom domains → Add** واكتب `www.learnelectricals.com`.
5. في DNS عند المسجّل: اعمل سجل **CNAME** اسمه `www` قيمته اللينك التجريبي اللي هم إدّوهولك (اللي بيظهرلك في الشاشة بالظبط).
6. للدومين من غير www (`learnelectricals.com`): ضيفه هو كمان في Custom domains واختار إنه يعمل **Redirect** لـ `www`. Netlify هيقولك تعمل سجل `A` على `75.2.60.5`، وCloudflare بيظبطها لوحده لو الدومين عندهم.

### 2) GitHub Pages (ببلاش)

1. اعمل حساب على github.com، وبعدين **New repository** (مثال `learnelectrical`)، خليه Public.
2. **Add file → Upload files** وارفع **محتويات** فولدر `website` (مش الفولدر نفسه)، ودوس Commit. اتأكد إن `CNAME` و `.nojekyll` اترفعوا.
3. **Settings → Pages**: Source = `Deploy from a branch`، Branch = `main` / `root`، Save.
4. في نفس الصفحة، Custom domain = `www.learnelectricals.com` واعمل Save.
5. في DNS عند المسجّل:
   - سجل **CNAME**: الاسم `www` ← القيمة `<اسم-المستخدم>.github.io`
   - أربع سجلات **A** للدومين من غير www (الاسم `@`):
     `185.199.108.153` و `185.199.109.153` و `185.199.110.153` و `185.199.111.153`
6. استنى من ربع ساعة لحد 24 ساعة لحد ما الـ DNS ينتشر.

### 3) استضافة عادية فيها cPanel

1. اعمل ملف مضغوط (zip) لـ **محتويات** فولدر `website` (أو استخدم `website.zip` وبعد فك الضغط انقل المحتويات لبره فولدر website).
2. ادخل cPanel → **File Manager** → افتح `public_html`.
3. **Upload** وارفع ملف الـ zip.
4. كليك يمين على الملف → **Extract**. اتأكد إن `index.html` بقى جوه `public_html` على طول (مش جوه فولدر تاني).
5. لو الشركة مش هي المسجّل: غيّر الـ **Nameservers** عند المسجّل للي شركة الاستضافة إدّتهولك.
6. (اختياري) عشان صفحة 404 تشتغل: في cPanel → **Error Pages** اختار 404 وخليها تفتح `/404.html`.

## د) HTTPS (القفل الأخضر)

1. بعد ما الدومين يشتغل، فعّل **Enforce HTTPS**:
   - GitHub Pages: Settings → Pages → علّم على Enforce HTTPS.
   - Netlify: Domain management → HTTPS (بيتعمل لوحده) .
   - Cloudflare: SSL/TLS → Edge Certificates → Always Use HTTPS.
   - cPanel: **SSL/TLS Status** → Run AutoSSL، وبعدين فعّل Force HTTPS Redirect من Domains.
2. افتح `https://www.learnelectricals.com` واتأكد إن القفل ظاهر.

## هـ) لما تحدّث الموقع بعدين

1. عدّل الملفات عندك على الجهاز (أو حط معمل جديد).
2. ارفع الملفات تاني بنفس الطريقة: Cloudflare/Netlify = اسحب الفولدر تاني كـ Deploy جديد. GitHub = Upload files فوق القديمة. cPanel = ارفع واستبدل.
3. **معمل جديد؟** حط فولدره جنب `index.html` (مثال `new-lab/index.html`)، وضيف عنصر واحد في مصفوفة `LABS` في `assets/site.js`، وضيف سطره في `sitemap.xml`.
4. لو التغيير مش باين: اعمل تحديث قوي للصفحة `Ctrl+F5`.

---

### ملحوظات

- `og.png` هي الصورة اللي بتظهر لما حد يشير اللينك على فيسبوك أو واتساب (`assets/og.png`).
- الخطوط بتتحمّل من Google Fonts؛ لو النت قطع الصفحة بتستخدم خط النظام عادي.
- معملين (`vfd-simulator` و `servo-simulator`) مفيهمش زرار يرجع للرئيسية من جوه المعمل؛ الزائر يرجع بزرار Back في المتصفح.
