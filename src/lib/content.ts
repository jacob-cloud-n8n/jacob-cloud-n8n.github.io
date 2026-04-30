export type Product = {
  name: string;
  price: number;
  category: "鮮乳" | "優酪乳" | "甜點" | "特調飲品" | "贈品";
  image: string;
  desc: string;
  isActive: boolean;
};

export type BrandEntry = {
  title: string;
  type: "品牌介紹" | "大事記" | "最新消息";
  date: string;
  richContent: string;
  image?: string;
  order: number;
};

export type NewsItem = {
  slug: string;
  date: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  content: string[];
  highlightTitle: string;
  highlightContent: string;
  youtubeUrl?: string;
};

export type DeliveryMethod = {
  area: string;
  schedule: string;
  method: string;
  minimum: string;
  note: string;
};

export const deliveryMethods: DeliveryMethod[] = [
  {
    area: "台中市區",
    schedule: "每逢週三、週五",
    method: "專人冷藏配送",
    minimum: "數量至少 2 瓶",
    note: "實際配送路線與可到達區域，將由官方 Line 協助確認。"
  },
  {
    area: "其他地區",
    schedule: "依客服確認",
    method: "冷藏宅配",
    minimum: "依品項與箱數評估",
    note: "若需大量訂購或企業配送，可先加入官方 Line 詢問。"
  }
];

export const fallbackProducts: Product[] = [
  {
    name: "純羊奶",
    price: 95,
    category: "鮮乳",
    image: "/images/goat-field.webp",
    desc: "100% 生乳使用，低溫殺菌保留純粹香氣。",
    isActive: true
  },
  {
    name: "牧場手作優酪乳",
    price: 120,
    category: "優酪乳",
    image: "/images/product-board.webp",
    desc: "綿密發酵，清爽酸甜，是每日早餐的溫柔選擇。",
    isActive: true
  },
  {
    name: "羊奶布丁",
    price: 45,
    category: "甜點",
    image: "/images/caramel-pudding.webp",
    desc: "天然羊奶入料，細滑細緻，帶著溫柔奶香。",
    isActive: true
  },
  {
    name: "羊奶雪糕（2入）",
    price: 120,
    category: "甜點",
    image: "/images/caramel-pudding.webp",
    desc: "羊奶香氣濃郁，冰涼細緻，適合午後小點。",
    isActive: true
  },
  {
    name: "冬瓜羊奶",
    price: 65,
    category: "特調飲品",
    image: "/images/product-board.webp",
    desc: "淡淡冬瓜香，微甜又爽口，第一次喝羊奶也容易喜歡。",
    isActive: true
  },
  {
    name: "紅茶羊奶",
    price: 65,
    category: "特調飲品",
    image: "/images/product-board.webp",
    desc: "茶味甘醇，與濃厚羊奶交織成店內人氣風味。",
    isActive: true
  },
  {
    name: "巧克力羊奶",
    price: 70,
    category: "特調飲品",
    image: "/images/product-board.webp",
    desc: "可可香氣濃郁，是大人小孩都熟悉的暖心滋味。",
    isActive: true
  },
  {
    name: "芝麻羊奶",
    price: 75,
    category: "特調飲品",
    image: "/images/product-board.webp",
    desc: "現磨黑芝麻香氣厚實，適合喜歡濃郁口感的人。",
    isActive: true
  },
  {
    name: "燕麥羊奶",
    price: 75,
    category: "特調飲品",
    image: "/images/product-board.webp",
    desc: "有纖燕麥加上羊奶，飽足又順口。",
    isActive: true
  },
  {
    name: "咖啡羊奶",
    price: 80,
    category: "特調飲品",
    image: "/images/product-board.webp",
    desc: "咖啡香與羊奶融合，適合早晨或午後補給。",
    isActive: true
  }
];

export const fallbackBrandEntries: BrandEntry[] = [
  {
    title: "清晨擠奶",
    type: "品牌介紹",
    date: "2020-01-01",
    order: 1,
    image: "/images/goat-field.webp",
    richContent: "凌晨開始處理當日鮮奶，以最溫和的方式照護羊媽媽，保留每一滴新鮮。"
  },
  {
    title: "低溫殺菌",
    type: "品牌介紹",
    date: "2020-01-02",
    order: 2,
    image: "/images/product-board.webp",
    richContent: "傳承父親獨到的殺菌技術，不急著速成，讓羊奶喝起來香濃、純淨、不腥膻。"
  },
  {
    title: "光復新村摘星",
    type: "大事記",
    date: "2021-01-01",
    order: 3,
    image: "/images/brand-timeline.webp",
    richContent: "入選台中摘星計畫，進駐光復新村，把牧場的日常溫度帶到街區。"
  },
  {
    title: "冷鏈直送",
    type: "品牌介紹",
    date: "2022-01-01",
    order: 4,
    image: "/images/order-panel.webp",
    richContent: "從牧場到您手中全程冷鏈控溫，週週送檢、羊隻定期健檢，守護餐桌安心。"
  }
];

export const fallbackNews: NewsItem[] = [
  {
    slug: "spring-chocolate-goat-milk",
    date: "2024.05.01",
    title: "春季新品：特調巧克力羊奶上市！",
    excerpt: "濃郁可可結合鮮羊乳，讓熟悉的甜香多了一層牧場的清爽。",
    category: "季節限定",
    image: "/images/caramel-pudding.webp",
    highlightTitle: "純手工低溫融合工法",
    highlightContent: "每一杯特調巧克力羊奶皆以低溫殺菌鮮乳為基底，加入濃郁可可後慢慢攪拌融合，讓奶香與可可自然交織。",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    content: [
      "在這個充滿生機的春天，小牧人為您帶來一份溫暖的驚喜。我們引以為傲的鮮羊奶，與來自西非的高品質可可豆巧妙結合，推出期間限定「特調巧克力羊奶」。",
      "這支新品不只是一杯飲品，更帶有牧場的純粹與手作溫度。鮮乳的細緻香氣讓巧克力更柔順，也讓第一次嘗試羊奶的人更容易入口。",
      "建議冷飲或搭配羊奶布丁一起享用。正式供應狀態與預留方式，請以官方 Line 回覆為準。"
    ]
  },
  {
    slug: "farm-delivery-check",
    date: "2024.04.15",
    title: "牧場週配日誌持續更新中",
    excerpt: "每週配送、冷鏈控溫與送檢紀錄同步更新，讓家人喝得更安心。",
    category: "牧場日誌",
    image: "/images/goat-field.webp",
    highlightTitle: "冷鏈直送與週週送檢",
    highlightContent: "從牧場出發到抵達餐桌，全程維持冷藏配送，並持續保留送檢與品管紀錄。",
    content: [
      "小牧人會持續整理配送與品管資訊，讓訂購家庭可以清楚知道鮮羊奶的配送節奏與保存建議。",
      "若需調整配送週期、暫停或加訂，請透過官方 Line 與我們確認。"
    ]
  },
  {
    slug: "guangfu-village",
    date: "2024.04.08",
    title: "全家便利商店限定組合優惠",
    excerpt: "即日起至月底，於指定通路購買小牧人鮮羊乳享限定優惠。",
    category: "通路優惠",
    image: "/images/product-board.webp",
    highlightTitle: "指定通路限定",
    highlightContent: "優惠內容依門市公告與實際庫存為準，建議出發前先向官方 Line 確認。",
    content: [
      "為讓更多家庭輕鬆接觸小牧人的鮮羊乳，本月推出指定通路限定組合優惠。",
      "實際品項、售價與供應門市可能隨庫存調整。"
    ]
  }
];

export const milestoneEntries: BrandEntry[] = [
  {
    title: "2018：初心萌芽",
    type: "大事記",
    date: "2018-01-01",
    order: 1,
    image: "/images/goat-field.webp",
    richContent: "離開學校工作的小牧人，回到家鄉重新認識牧場日常，開始思考如何把新鮮羊奶分享給更多人。"
  },
  {
    title: "2021：光復新村摘星",
    type: "大事記",
    date: "2021-01-01",
    order: 2,
    image: "/images/brand-timeline.webp",
    richContent: "入選青年摘星計畫，進駐光復新村創業基地，讓牧場滋味走進街區與旅人的日常。"
  },
  {
    title: "2023：新鮮配送不斷線",
    type: "大事記",
    date: "2023-01-01",
    order: 3,
    image: "/images/order-panel.webp",
    richContent: "建立穩定冷鏈與週配制度，讓鮮羊乳從牧場抵達餐桌時仍保有清爽風味。"
  },
  {
    title: "2024：品質與風味雙軌",
    type: "大事記",
    date: "2024-01-01",
    order: 4,
    image: "/images/product-board.webp",
    richContent: "持續送檢與羊隻健康照護，同時研發特調飲品與甜點，讓羊奶有更多明亮喝法。"
  },
  {
    title: "2025：持續綻放",
    type: "大事記",
    date: "2025-01-01",
    order: 5,
    image: "/images/goat-field.webp",
    richContent: "從牧場、店面到線上訂購，小牧人持續用更便利的方式服務喜歡羊奶的家庭。"
  }
];
