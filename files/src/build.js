// يولّد ملخص بنك الأسئلة PDF بخط تجوال المحلي. التشغيل من جذر المستودع: node files/src/build.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SRC = __dirname;
const font = fs.readFileSync(path.join(SRC, '../../assets/fonts/Tajawal-Medium.ttf')).toString('base64');
const footer = `<style>@font-face{font-family:TJ;src:url(data:font/ttf;base64,${font})}</style>
<div dir="rtl" style="font-family:TJ;font-size:8px;color:#5b6a6c;width:100%;padding:0 12mm;display:flex;justify-content:space-between">
<span>ملخص بنك أسئلة قواعد الفقه المالي ومقاصده</span><span style="color:#94661c">أعدّه الذكاء الاصطناعي · المرجع المعتمد بنك الأسئلة</span>
<span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + path.join(SRC, 'summary.html')); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: path.join(SRC, '../ملخص-قواعد-الفقه-المالي-ومقاصده.pdf'), format: 'A4', printBackground: true,
    preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>', footerTemplate: footer });
  await b.close(); console.log('built');
})();
