var WidgetMetadata = {
    id: "favorites_viewer",
    title: "收藏列表观看器",
    description: "获取用户收藏列表中的视频并在线观看",
    author: "pp",
    site: "https://example.com",
    version: "1.0.1",
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "收藏列表",
            description: "获取用户收藏的视频列表",
            requiresWebView: false,
            functionName: "getFavoritesList",
            sectionMode: false,
            params: [
                {
                    name: "favoritesUrl",
                    title: "收藏列表地址",
                    type: "input",
                    description: "用户收藏列表的完整URL地址",
                    value: "https://example.com/users/username/videos/favorites",
                    placeholders: [
                        {
                            title: "示例地址",
                            value: "https://example.com/users/username/videos/favorites"
                        }
                    ]
                },
                {
                    name: "apiUrl",
                    title: "API接口地址",
                    type: "input",
                    description: "获取视频直链的API接口地址",
                    value: "http://127.0.0.1:16813/get_mp4_links",
                    placeholders: [
                        {
                            title: "本地接口",
                            value: "http://127.0.0.1:16813/get_mp4_links"
                        }
                    ]
                },
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    description: "收藏列表页码",
                    value: "1"
                }
            ]
        }
    ]
};

// 全局变量存储API地址
let globalApiUrl = "";

// 获取收藏列表的主函数
async function getFavoritesList(params = {}) {
    console.log("开始获取收藏列表，参数:", params);
    
    try {
        // 1. 参数验证
        if (!params.favoritesUrl) {
            throw new Error("缺少收藏列表地址参数");
        }
        if (!params.apiUrl) {
            throw new Error("缺少API接口地址参数");
        }

        const favoritesUrl = params.favoritesUrl;
        globalApiUrl = params.apiUrl; // 存储API地址供loadDetail使用
        const page = params.page || 1;
        
        console.log(`正在获取第${page}页收藏列表: ${favoritesUrl}`);
        console.log(`API接口地址: ${globalApiUrl}`);

        // 2. 发送请求获取收藏列表页面
        const response = await Widget.http.get(favoritesUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": getDomainFromUrl(favoritesUrl),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
            }
        });

        console.log("收藏列表页面获取成功，开始解析DOM");

        // 3. 解析HTML内容
        const $ = Widget.html.load(response.data);
        const videoItems = [];

        // 使用Set来避免重复的viewkey
        const processedViewkeys = new Set();
        
        // 根据页面结构解析视频项目 - 使用更精确的选择器
        $('.videoblock .phimage, .wrap .phimage, [class*="videoblock"] a[href*="viewkey"], [class*="video"] a[href*="viewkey"]').each((index, element) => {
            try {
                const $element = $(element);
                let $container = $element;
                
                // 如果当前元素是链接，找到其容器
                if ($element.is('a')) {
                    $container = $element.closest('.videoblock, .wrap, [class*="video"]');
                    if ($container.length === 0) {
                        $container = $element.parent();
                    }
                }
                
                // 获取视频链接和viewkey
                let videoLink = '';
                if ($element.is('a')) {
                    videoLink = $element.attr('href') || '';
                } else {
                    videoLink = $element.find('a[href*="viewkey"]').first().attr('href') || '';
                }
                
                const viewkey = extractViewkey(videoLink);
                
                if (!viewkey) {
                    console.log(`跳过无效的视频项目: ${videoLink}`);
                    return;
                }
                
                // 检查是否已处理过此viewkey，避免重复
                if (processedViewkeys.has(viewkey)) {
                    console.log(`跳过重复的视频项目: ${viewkey}`);
                    return;
                }
                processedViewkeys.add(viewkey);

                // 获取标题 - 更全面的选择器
                const title = $container.find('.title a, .phimage a, a[href*="viewkey"]').attr('title') || 
                             $container.find('.title, .videoTitle, [class*="title"]').text().trim() ||
                             $element.attr('title') ||
                             `视频 ${viewkey}`;

                // 获取封面图片
                const coverImg = $container.find('img').first();
                let coverUrl = coverImg.attr('src') || coverImg.attr('data-src') || coverImg.attr('data-thumb_url') || '';
                
                // 处理相对路径
                if (coverUrl && !coverUrl.startsWith('http')) {
                    const domain = getDomainFromUrl(favoritesUrl);
                    coverUrl = domain + (coverUrl.startsWith('/') ? '' : '/') + coverUrl;
                }

                // 获取时长
                const durationText = $container.find('.duration, .video-duration, [class*="duration"]').text().trim();
                const duration = parseDuration(durationText);

                // 获取评分（如果有）
                const ratingText = $container.find('.rating-container, .percent, [class*="rating"]').text().trim();
                const rating = parseRating(ratingText);

                // 构造标准的视频URL - 使用固定域名避免解析问题
                const standardVideoUrl = `https://cn.pornhub.com/view_video.php?viewkey=${viewkey}`;
                console.log(`构造标准视频URL: ${standardVideoUrl}`);

                const videoItem = {
                    id: viewkey,
                    type: "url",
                    title: title,
                    posterPath: coverUrl,
                    backdropPath: coverUrl,
                    releaseDate: "",
                    mediaType: "movie",
                    rating: rating,
                    genreTitle: "收藏视频",
                    duration: duration,
                    durationText: durationText,
                    previewUrl: "",
                    videoUrl: "", // 通过 loadDetail 获取
                    link: standardVideoUrl, // 使用标准格式的URL
                    description: `观看时长: ${durationText}`,
                    childItems: []
                };

                videoItems.push(videoItem);
                console.log(`解析视频项目成功: ${title} (${viewkey}) - URL: ${standardVideoUrl}`);
                
            } catch (error) {
                console.error("解析单个视频项目时出错:", error);
            }
        });

        console.log(`成功解析 ${videoItems.length} 个视频项目`);

        if (videoItems.length === 0) {
            console.warn("未找到任何视频项目，可能页面结构已变更");
            // 尝试备用解析方法
            return tryAlternativeParsing($, favoritesUrl);
        }

        return videoItems;

    } catch (error) {
        console.error("获取收藏列表失败:", error);
        throw error;
    }
}

// 详情加载函数 - 获取视频播放地址（参考Jable脚本）
async function loadDetail(link) {
    console.log("开始加载视频详情:", link);
    
    try {
        let viewkey = extractViewkey(link);
        let videoUrl = link;
        
        // 确保使用正确的URL格式
        if (!link.includes('view_video.php') && viewkey) {
            videoUrl = `https://cn.pornhub.com/view_video.php?viewkey=${viewkey}`;
        } else if (link.includes('view_video.php')) {
            // 确保使用正确的域名
            if (!link.startsWith('https://cn.pornhub.com')) {
                videoUrl = link.replace(/https?:\/\/[^\/]+/, 'https://cn.pornhub.com');
            }
        }
        
        if (!viewkey) {
            throw new Error("无法从链接中提取viewkey");
        }

        console.log(`准备调用API获取视频直链 - viewkey: ${viewkey}, URL: ${videoUrl}`);

        // 调用API获取播放链接
        const apiUrl = globalApiUrl || "http://127.0.0.1:16813/get_mp4_links";
        
        const response = await Widget.http.post(apiUrl, {
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "ForwardWidget/1.0.0"
            },
            body: JSON.stringify({
                url: videoUrl
            })
        });

        console.log("API响应状态:", response.status);
        console.log("API响应内容:", response.data);

        let result;
        try {
            result = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch (parseError) {
            console.error("JSON解析失败:", parseError);
            throw new Error(`API响应格式错误: ${response.data}`);
        }
        
        if (result.error) {
            throw new Error(`API错误: ${result.error}`);
        }

        if (!result.result || result.result.length === 0) {
            throw new Error("未找到可播放的视频格式");
        }

        // 选择最高质量的视频链接
        const formats = result.result;
        const preferredOrder = ['1080p', '720p', '480p', '240p'];
        
        let selectedFormat = null;
        for (const quality of preferredOrder) {
            selectedFormat = formats.find(f => f.format === quality);
            if (selectedFormat) break;
        }

        if (!selectedFormat) {
            selectedFormat = formats[0]; // 如果没有找到偏好格式，使用第一个
        }

        console.log(`选择视频格式: ${selectedFormat.format}, URL: ${selectedFormat.url}`);

        // 返回类似Jable脚本的格式
        const item = {
            id: link,
            type: "detail",
            videoUrl: selectedFormat.url,
            customHeaders: {
                "Referer": "https://cn.pornhub.com/",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        };

        console.log("返回播放详情:", item);
        return item;

    } catch (error) {
        console.error("加载视频详情失败:", error);
        throw error;
    }
}

// 辅助函数：从URL中提取viewkey
function extractViewkey(url) {
    if (!url) return null;
    
    const match = url.match(/viewkey=([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

// 辅助函数：获取域名
function getDomainFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const domain = `${urlObj.protocol}//${urlObj.host}`;
        console.log(`域名解析成功: ${url} -> ${domain}`);
        return domain;
    } catch (error) {
        console.error("解析URL失败:", url, error);
        // 如果URL解析失败，尝试从字符串中提取域名
        const match = url.match(/https?:\/\/[^\/]+/);
        if (match) {
            console.log(`通过正则表达式提取域名: ${match[0]}`);
            return match[0];
        }
        // 默认返回pornhub域名
        console.log("使用默认域名: https://cn.pornhub.com");
        return "https://cn.pornhub.com";
    }
}

// 辅助函数：获取完整URL
function getFullUrl(path, baseUrl) {
    if (!path) return "";
    if (path.startsWith('http')) return path;
    
    const domain = getDomainFromUrl(baseUrl);
    return domain + (path.startsWith('/') ? '' : '/') + path;
}

// 辅助函数：解析时长
function parseDuration(durationText) {
    if (!durationText) return 0;
    
    const match = duration
