var WidgetMetadata = {
  id: "Pornhub",
  title: "Pornhub收藏列表",
  description: "在线观看收藏列表",
  author: "pp",
  site: "https://cn.pornhub.com",
  version: "1.0.7",
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
          value: "https://cn.pornhub.com/users/你的用户名/videos/favorites"
        }
      ]
    }
  ]
};

// 正则提取viewkey函数
function getViewkeyFromUrl(url) {
  const match = url.match(/[?&]viewkey=([^&]+)/);
  return match ? match[1] : null;
}

async function fetchFavorites(params = {}) {
  try {
    const url = params.favoritesUrl;
    if (!url || !url.includes("pornhub.com")) {
      throw new Error("请输入有效的 Pornhub 收藏链接");
    }

    console.log("请求收藏页: " + url);

    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": "https://cn.pornhub.com"
      }
    });

    console.log("收藏页加载完成");

    const $ = Widget.html.load(response.data);
    const videoElements = $("ul.videos li.videoBox");

    const videos = videoElements.map((i, el) => {
      const element = $(el);
      const title = element.find("span.title a").text().trim();
      const href = element.find("a").attr("href");
      if (!href) return null;

      const link = "https://cn.pornhub.com" + href;
      const posterPath = element.find("img").attr("data-thumb_url") || element.find("img").attr("src");
      const durationText = element.find(".duration").text().trim();

      // 用正则提取viewkey，兼容无URL对象环境
      const viewkey = getViewkeyFromUrl(link);

      console.log(`已解析视频: ${title}, viewkey: ${viewkey}`);

      return {
        id: link,
        type: "url",
        title,
        posterPath,
        backdropPath: posterPath,
        durationText,
        mediaType: "movie",
        genreTitle: "收藏",
        link,
        description: "点击跳转到 Pornhub 原始页面播放",
        videoUrl: async () => await getDirectVideoUrl(viewkey, params.apiUrl)
      };
    }).get().filter(Boolean);

    console.log("调用成功，共获取视频数: " + videos.length);
    return videos;
  } catch (error) {
    console.error("收藏加载失败: " + error.message);
    throw error;
  }
}

async function getDirectVideoUrl(viewkey, apiUrl) {
  try {
    apiUrl = apiUrl || "https://你的接口地址";
    const videoUrl = `https://www.pornhub.com/view_video.php?viewkey=${viewkey}`;
    const body = { url: videoUrl };

    console.log("调用直链接口: " + apiUrl);
    console.log("请求体: " + JSON.stringify(body));

    const res = await Widget.http.post(apiUrl, {
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = res.data;
    console.log("接口响应: " + JSON.stringify(data));

    if (data.error) throw new Error(data.error);

    const resolutions = data.result || [];
    const preferred = ["1080p", "720p", "480p"];
    for (let p of preferred) {
      const found = resolutions.find(r => r.format.includes(p));
      if (found) {
        console.log(`选中清晰度 ${p}: ${found.url}`);
        return found.url;
      }
    }

    if (resolutions.length > 0) {
      console.log("使用第一个可用链接: " + resolutions[0].url);
      return resolutions[0].url;
    }

    throw new Error("未找到可用视频链接");
  } catch (err) {
    console.error("获取视频链接失败: " + err.message);
    throw new Error("获取视频链接失败: " + err.message);
  }
}
