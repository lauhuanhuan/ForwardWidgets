var WidgetMetadata = {
  id: "Pornhub",
  title: "Pornhub收藏列表",
  description: "在线观看收藏列表",
  author: "pp",
  site: "https://cn.pornhub.com",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  modules: [
    {
      title: "收藏列表",
      description: "展示收藏的视频",
      requiresWebView: false,
      functionName: "fetchFavorites",
      sectionMode: false,
      params: [
        {
          name: "apiUrl",
          title: "直链接口地址",
          type: "input",
          description: "用于获取播放直链的后端接口地址",
          value: "https://你的接口地址"
        },
        {
          name: "favoritesUrl",
          title: "收藏地址",
          type: "input",
          description: "你的 Pornhub 收藏页面地址",
          value: "https://cn.pornhub.com/users/你的用户名/favorites"
        }
      ]
    }
  ]
};

async function fetchFavorites(params = {}) {
  try {
    const url = params.favoritesUrl || "https://cn.pornhub.com/users/你的用户名/favorites";
    console.log("请求收藏页:", url);
    const res = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const $ = Widget.html.load(res.data);
    console.log("收藏页加载完成");

    const items = [];
    $(".videoPreviewWrapper").each((i, el) => {
      const title = $(el).find(".title a").text().trim();
      const link = "https://cn.pornhub.com" + $(el).find(".title a").attr("href");
      const posterPath = $(el).find("img[src]").attr("data-thumb_url") || $(el).find("img[src]").attr("src");
      const viewkey = new URL(link).searchParams.get("viewkey");

      console.log(`已解析视频: ${title}, viewkey: ${viewkey}`);

      items.push({
        id: link,
        type: "url",
        title: title,
        posterPath: posterPath,
        link: link,
        videoUrl: async () => await getDirectVideoUrl(viewkey, params.apiUrl),
        description: "点击加载直链播放"
      });
    });

    return items;
  } catch (err) {
    console.error("获取收藏失败", err);
    throw new Error("获取收藏失败: " + err.message);
  }
}

async function getDirectVideoUrl(viewkey, apiUrl) {
  try {
    apiUrl = apiUrl || "https://你的接口地址";
    const body = {
      url: `https://www.pornhub.com/view_video.php?viewkey=${viewkey}`
    };

    console.log("调用直链接口, 请求体:", body);

    const res = await Widget.http.post(apiUrl, {
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = res.data;
    console.log("接口响应:", data);

    if (data.error) throw new Error(data.error);

    const resolutions = data.result || [];
    const preferred = ["1080p", "720p", "480p"];
    for (let p of preferred) {
      const found = resolutions.find(r => r.format.includes(p));
      if (found) {
        console.log(`选中清晰度: ${p}, 链接:`, found.url);
        return found.url;
      }
    }

    if (resolutions.length > 0) {
      console.log("使用第一个可用链接:", resolutions[0].url);
      return resolutions[0].url;
    }

    throw new Error("未找到可用视频链接");
  } catch (err) {
    console.error("获取视频链接失败", err);
    throw new Error("获取视频链接失败: " + err.message);
  }
}
