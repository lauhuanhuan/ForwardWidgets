WidgetMetadata = {
  id: "ph_favorites",
  title: "Pornhub收藏夹",
  description: "自定义收藏夹和接口解析，支持多清晰度播放，默认选最高画质",
  author: "pp",
  version: "1.0.1",
  requiredVersion: "0.0.1",
  modules: [
    {
      title: "收藏夹列表",
      description: "浏览Pornhub收藏夹视频",
      requiresWebView: false,
      functionName: "loadFavorites",
      params: [
        {
          name: "favUrl",
          title: "收藏夹地址",
          type: "text",
          value: "https://cn.pornhub.com/users/your_username/videos/favorites",
          description: "请输入Pornhub收藏夹页面URL，留空需手动填写",
        },
        {
          name: "apiUrl",
          title: "解析接口地址",
          type: "text",
          value: "http://your-api-host:16813/get_mp4_links",
          description: "请输入后端解析接口地址，留空需手动填写",
        },
        {
          name: "page",
          title: "页码",
          type: "page",
          value: "1",
          description: "分页页码（如果收藏夹支持分页）",
        },
      ],
    },
  ],
};

async function loadFavorites(params = {}) {
  try {
    const url = params.favUrl;
    if (!url) throw new Error("收藏夹地址不能为空");

    let targetUrl = url;
    if (params.page && params.page !== "1") {
      targetUrl += `?page=${params.page}`;
    }

    console.log("[loadFavorites] 请求收藏夹页面：", targetUrl);

    const response = await Widget.http.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });

    if (!response || !response.data) throw new Error("无法获取收藏夹页面");

    const $ = Widget.html.load(response.data);
    const items = [];

    $(".videoPreviewBg").each((_, el) => {
      const $el = $(el);
      const href = $el.attr("href");
      if (!href || !href.includes("viewkey=")) return;

      const viewkey = new URLSearchParams(href.split("?")[1]).get("viewkey");
      const title = $el.find(".title").text().trim() || `视频 ${viewkey}`;
      const cover = $el.find("img").attr("data-thumb_url") || $el.find("img").attr("src");

      items.push({
        id: viewkey,
        type: "url",
        title: title,
        backdropPath: cover,
        link: href,
      });
    });

    console.log(`[loadFavorites] 解析到 ${items.length} 个视频`);
    return items;
  } catch (e) {
    console.error("[loadFavorites] 错误:", e.message);
    throw e;
  }
}

async function loadDetail(viewkey, params = {}) {
  try {
    if (!viewkey) throw new Error("viewkey不能为空");
    const api = params.apiUrl;
    if (!api) throw new Error("解析接口地址不能为空");

    const targetUrl = `https://cn.pornhub.com/view_video.php?viewkey=${viewkey}`;
    console.log("[loadDetail] 调用接口", api, "解析viewkey:", viewkey);

    const res = await Widget.http.post(api, {
      json: { url: targetUrl },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });

    if (!res.data || !res.data.result || res.data.result.length === 0) {
      throw new Error("接口未返回有效播放数据");
    }

    // 只保留指定清晰度，并排序保证1080p最高优先
    const allowedQualities = ["1080p", "720p", "480p", "240p"];
    let filtered = res.data.result.filter(item => allowedQualities.includes(item.format));

    filtered.sort((a, b) => allowedQualities.indexOf(a.format) - allowedQualities.indexOf(b.format));

    const children = filtered.map(item => ({
      id: item.format,
      type: "video",
      title: item.format,
      videoUrl: item.url,
      headers: {
        Referer: targetUrl,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    }));

    console.log(`[loadDetail] 返回 ${children.length} 个清晰度视频链接，默认最高画质`);

    return {
      id: viewkey,
      type: "detail",
      title: `视频播放 ${viewkey}`,
      childItems: children,
    };
  } catch (e) {
    console.error("[loadDetail] 错误:", e.message);
    throw e;
  }
}
