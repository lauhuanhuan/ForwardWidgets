var WidgetMetadata = {
    id: "ph_favorites_webview",
    title: "Pornhub 收藏夹 (WebView)",
    description: "点击视频打开原始页面播放",
    author: "pp",
    site: "https://cn.pornhub.com",
    version: "1.0.2",
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "我的收藏视频",
            description: "加载并跳转到收藏夹视频详情页播放",
            requiresWebView: true,
            functionName: "fetchFavoritesWebView",
            sectionMode: false,
            params: [
                {
                    name: "url",
                    title: "收藏页地址",
                    type: "input",
                    description: "输入你的收藏夹地址，例如：https://cn.pornhub.com/users/你的用户名/videos/favorites",
                    value: "https://cn.pornhub.com/users/aaaaa/videos/favorites"
                }
            ]
        }
    ]
};

async function fetchFavoritesWebView(params = {}) {
    try {
        const url = params.url;
        if (!url || !url.includes("pornhub.com")) {
            throw new Error("请输入有效的 Pornhub 收藏链接");
        }

        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://cn.pornhub.com"
            }
        });

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

            return {
                id: link,
                type: "url",
                title,
                posterPath,
                backdropPath: posterPath,
                durationText,
                mediaType: "movie",
                genreTitle: "收藏",
                link, // ✅ 仅保留 link 字段
                description: "点击跳转到 Pornhub 原始页面播放"
            };
        }).get().filter(Boolean);

        return videos;
    } catch (error) {
        console.error("收藏加载失败:", error);
        throw error;
    }
}
