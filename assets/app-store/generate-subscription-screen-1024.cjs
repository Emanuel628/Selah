const { chromium } = require('@playwright/test');
const path = require('path');

const out = path.resolve('assets/app-store/selah-subscription-screen-1024.png');
const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    width: 1024px;
    height: 1024px;
    background: linear-gradient(180deg, #fffaf0 0%, #f2eadb 100%);
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif;
    color: #20312b;
    overflow: hidden;
  }
  .frame { width:1024px; height:1024px; padding:38px 52px 34px; }
  .status { height:34px; display:flex; justify-content:space-between; align-items:center; font-size:22px; font-weight:800; }
  .header { height:74px; border-bottom:2px solid rgba(32,49,43,.12); display:grid; grid-template-columns:1fr 1fr 1fr; align-items:center; }
  .brand { display:flex; align-items:center; gap:10px; font-size:25px; font-weight:900; }
  .leaf { color:#34745A; font-size:30px; }
  .title { text-align:center; font-size:24px; font-weight:850; }
  .content { padding-top:28px; }
  .card { background:#fffdf7; border:2px solid rgba(32,49,43,.12); border-radius:30px; padding:32px 38px; box-shadow:0 18px 44px rgba(52,116,90,.08); }
  .eyebrow { color:#D4A72C; font-size:15px; letter-spacing:3px; font-weight:950; margin-bottom:10px; }
  .plan { font-size:48px; line-height:1; font-weight:950; margin-bottom:12px; }
  .sub { font-size:23px; line-height:1.25; color:#6f7f78; margin-bottom:22px; max-width:720px; }
  .features { display:grid; grid-template-columns:1fr 1fr; column-gap:20px; row-gap:12px; }
  .feature { display:flex; align-items:center; gap:12px; font-size:20px; line-height:1.15; color:#20312b; min-height:34px; }
  .check { width:28px; height:28px; border-radius:14px; background:#34745A; color:#fffaf0; display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:950; flex:0 0 auto; }
  .purchase { background:#fffdf7; border:2px solid rgba(32,49,43,.12); border-radius:30px; padding:30px 36px; margin-top:24px; }
  .purchase-title { font-size:28px; font-weight:950; margin-bottom:6px; }
  .purchase-copy { color:#6f7f78; font-size:19px; margin-bottom:14px; }
  .price { font-size:48px; font-weight:950; margin-bottom:8px; }
  .terms { color:#6f7f78; font-size:16px; line-height:1.28; margin-bottom:22px; }
  .button { height:70px; border-radius:22px; background:#34745A; color:#fffaf0; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:950; }
  .restore { color:#34745A; text-align:center; font-size:18px; font-weight:900; margin-top:14px; }
  .note { color:#6f7f78; text-align:center; font-size:14px; line-height:1.25; margin-top:18px; padding:0 34px; }
</style>
</head>
<body>
  <main class="frame">
    <div class="status"><span>9:41</span><span>5G&nbsp;&nbsp;Wi‑Fi&nbsp;&nbsp;100%</span></div>
    <div class="header">
      <div class="brand"><span class="leaf">☘</span><span>Selah</span></div>
      <div class="title">Your Selah plan</div>
      <div></div>
    </div>
    <section class="content">
      <div class="card">
        <div class="eyebrow">CURRENT PLAN</div>
        <div class="plan">Selah Pro</div>
        <div class="sub">Unlock guided Scripture study, deeper Garden insights, and connected reflection tools.</div>
        <div class="features">
          <div class="feature"><span class="check">✓</span><span>Full Scripture search</span></div>
          <div class="feature"><span class="check">✓</span><span>Cross references</span></div>
          <div class="feature"><span class="check">✓</span><span>Saved highlights</span></div>
          <div class="feature"><span class="check">✓</span><span>Garden Insights</span></div>
          <div class="feature"><span class="check">✓</span><span>AI reflection help</span></div>
          <div class="feature"><span class="check">✓</span><span>Knowledge Graph</span></div>
        </div>
      </div>
      <div class="purchase">
        <div class="purchase-title">App Store subscription</div>
        <div class="purchase-copy">Selah Pro Monthly</div>
        <div class="price">$1.99 / month</div>
        <div class="terms">Includes a 30-day free trial for new subscribers. Renews monthly. Cancel anytime in your Apple ID subscriptions.</div>
        <div class="button">Start Selah Pro</div>
        <div class="restore">Restore Purchases</div>
      </div>
      <div class="note">Payment is charged to your Apple ID after confirmation. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.</div>
    </section>
  </main>
</body>
</html>`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: out, fullPage: false });
  await browser.close();
  console.log(out);
})();
