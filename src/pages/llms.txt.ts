import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const siteUrl = process.env.SITE_URL || (site ? site.origin : "https://shepherd.zeabur.app");
  const baseUrl = siteUrl.replace(/\/$/, "");

  const content = `# 小牧人羊奶

小牧人羊奶提供 100% 天然純鮮羊乳，低溫殺菌，牧場直送。我們在光復新村設有實體門市，並提供台中、南投配送訂閱服務，將清新純淨的乳香送至您的餐桌。

## 網站架構與主要頁面

- [首頁](${baseUrl}/) - 品牌理念、核心優勢與特色介紹
- [商品廚窗](${baseUrl}/products/) - 鮮乳系列、特調飲品與手作甜點（羊奶饅頭、布丁、雪糕）
- [配送方案](${baseUrl}/delivery/) - 週配訂閱細節、配送時間、配送地區與訂購需知
- [最新消息](${baseUrl}/news/) - 牧場動態、門市公告與最新活動文章
- [大事記](${baseUrl}/milestones/) - 小牧人發展歷程與品牌歷史大事記
- [品牌故事](${baseUrl}/brand-story/) - 傳承父親酪農夢想與牧場初心的故事
- [加入 Line](${baseUrl}/line/) - 快速加入官方 LINE 帳號進行訂單確認與配送諮詢
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
};
