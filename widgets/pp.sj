var WidgetMetadata = {
    id: "VideoFavorites",
    title: "视频收藏列表",
    description: "在线观看收藏列表",
    author: "pp",
    site: "https://example.com",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "收藏列表",
            description: "展示收藏的视频",
            requiresWebView: false,
            functionName: "getFavoriteVideos",
            sectionMode: false,
            params: [
                {
                    name: "apiUrl",
                    title: "接口地址",
                    type: "input",
                    description: "获取视频播放地址的API接口",
                    value: "https://你的接口地址",
                    placeholders: [
                        {
                            title: "默认接口",
                            value: "https://你的接口地址"
                        }
                    ],
    search: {
        title: "搜索",
        functionName: "search",
        params: [
            {
                name: "keyword",
                title: "关键词",
                type: "input",
                description: "搜索关键词",
                value: ""
            },
            {
                name: "searchUrl",
                title: "搜索地址",
                type: "input",
                description: "搜索页面地址，例如：https://cn.example.com/video/search",
                value: "https://cn.example.com/video/search",
                placeholders: [
                    {
                        title: "搜索地址示例",
                        value: "https://cn.example.com/video/search"
                    }
                ]
            },
            {
                name: "page",
                title: "页码",
                type: "page",
                description: "搜索结果页码",
                value: "1"
            }
        ]
    }
                },
                {
                    name: "favoriteUrl",
                    title: "收藏列表地址",
                    type: "input",
                    description: "收藏列表页面地址，例如：https://cn.example.com/users/username/videos/favorites",
                    value: "https://cn.example.com/users/username/videos/favorites",
                    placeholders: [
                        {
                            title: "收藏列表地址示例",
                            value: "https://cn.example.com/users/username/videos/favorites"
                        }
                    ]
                },
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    description: "当前页码",
                    value: "1"
                },
                {
                    name: "count",
                    title: "每页数量",
                    type: "count",
                    description: "每页显示的视频数量",
                    value: "20"
                }
            ]
        }
    ]
};

// 获取收藏视频列表
async function getFavoriteVideos(params = {}) {
    try {
        // 参数验证
        const page = parseInt(params.page) || 1;
        const count = parseInt(params.count) || 20;
        const apiUrl = params.apiUrl || "https://你的接口地址";
        const favoriteUrl = params.favoriteUrl || "输入你的收藏列表地址";
        
        // 验证必要参数
        if (!favoriteUrl || favoriteUrl === "https://cn.example.com/users/username/videos/favorites") {
            throw new Error("请设置正确的收藏列表地址");
        }
        
        console.log(`获取第 ${page} 页，每页 ${count} 个视频`);
        console.log(`收藏列表地址: ${favoriteUrl}`);
        console.log(`API接口地址: ${apiUrl}`);
        
        // 构建请求URL，支持分页
        const listUrl = favoriteUrl.includes('?') 
            ? `${favoriteUrl}&page=${page}` 
            : `${favoriteUrl}?page=${page}`;
        
        // 发送请求获取视频列表
        const response = await Widget.http.get(listUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3",
                "Accept-Encoding": "gzip, deflate",
                "Referer": favoriteUrl
            }
        });
        
        // 解析HTML内容
        const $ = Widget.html.load(response.data);
        const videoItems = [];
        
        // 根据实际网站结构解析视频列表 - 常见的选择器
        const videoSelectors = [
            '.videoblock',           // 通用视频块
            '.pcVideoListItem',      // PC端视频列表项
            '.phimage',              // 图片容器
            '.wrap',                 // 包装容器
            '.thumbnail-info-wrapper', // 缩略图信息包装器
            '.video-item',           // 视频项
            'li[data-entrycode]'     // 带有数据属性的列表项
        ];
        
        let foundVideos = false;
        
        for (const selector of videoSelectors) {
            const elements = $(selector);
            if (elements.length > 0) {
                console.log(`使用选择器: ${selector}, 找到 ${elements.length} 个元素`);
                
                elements.each((index, element) => {
                    const $element = $(element);
                    
                    // 多种方式提取标题
                    let title = $element.find('.title a').text().trim() ||
                               $element.find('.thumbnail-info-wrapper .title').text().trim() ||
                               $element.find('a[title]').attr('title') ||
                               $element.find('.videoTitle').text().trim() ||
                               $element.find('img').attr('alt') ||
                               "";
                    
                    // 多种方式提取视频链接
                    let viewUrl = $element.find('a').attr('href') ||
                                 $element.find('.thumbnail-info-wrapper a').attr('href') ||
                                 $element.find('.title a').attr('href') ||
                                 "";
                    
                    // 多种方式提取封面图片
                    let coverUrl = $element.find('img').attr('data-src') ||
                                  $element.find('img').attr('src') ||
                                  $element.find('.thumb img').attr('data-src') ||
                                  $element.find('.thumb img').attr('src') ||
                                  "";
                    
                    // 提取时长
                    let duration = $element.find('.duration').text().trim() ||
                                  $element.find('.video-duration').text().trim() ||
                                  "";
                    
                    // 提取观看次数或评分
                    let viewCount = $element.find('.views').text().trim() ||
                                   $element.find('.video-views').text().trim() ||
                                   "";
                    
                    if (title && viewUrl) {
                        // 确保URL是完整的
                        if (!viewUrl.startsWith('http')) {
                            const baseUrl = new URL(favoriteUrl).origin;
                            viewUrl = baseUrl + (viewUrl.startsWith('/') ? viewUrl : '/' + viewUrl);
                        }
                        
                        // 确保封面URL是完整的
                        if (coverUrl && !coverUrl.startsWith('http') && !coverUrl.startsWith('data:')) {
                            const baseUrl = new URL(favoriteUrl).origin;
                            coverUrl = baseUrl + (coverUrl.startsWith('/') ? coverUrl : '/' + coverUrl);
                        }
                        
                        // 提取viewkey
                        const viewKeyMatch = viewUrl.match(/viewkey=([^&]+)/);
                        const videoId = viewKeyMatch ? viewKeyMatch[1] : extractVideoId(viewUrl);
                        
                        videoItems.push({
                            id: videoId,
                            type: "url",
                            title: title,
                            posterPath: coverUrl || "",
                            backdropPath: coverUrl || "",
                            releaseDate: "",
                            mediaType: "movie",
                            rating: viewCount || "",
                            genreTitle: "收藏视频",
                            duration: parseDuration(duration),
                            durationText: duration || "",
                            previewUrl: "",
                            videoUrl: "", // 将在loadDetail中获取
                            link: viewUrl,
                            description: title
                        });
                    }
                });
                
                if (videoItems.length > 0) {
                    foundVideos = true;
                    break; // 找到视频后退出循环
                }
            }
        }
        
        if (!foundVideos) {
            console.log("未找到视频，可能需要调整选择器");
            console.log("页面HTML片段:", response.data.substring(0, 1000));
        }
        
        console.log(`成功获取 ${videoItems.length} 个视频`);
        return videoItems;
        
    } catch (error) {
        console.error("获取视频列表失败:", error);
        throw new Error(`获取视频列表失败: ${error.message}`);
    }
}

// 加载视频详情和播放地址
async function loadDetail(link, params = {}) {
    try {
        console.log(`加载视频详情: ${link}`);
        
        // 获取API地址
        const apiUrl = params.apiUrl || "https://你的接口地址";
        
        if (!apiUrl || apiUrl === "https://你的接口地址") {
            throw new Error("请设置正确的API接口地址");
        }
        
        // 验证链接格式
        if (!link.includes('viewkey=')) {
            throw new Error("视频链接格式不正确，需要包含viewkey参数");
        }
        
        // 提取viewkey
        const viewKeyMatch = link.match(/viewkey=([^&\s]+)/);
        if (!viewKeyMatch) {
            throw new Error("无法从链接中提取viewkey");
        }
        
        const viewKey = viewKeyMatch[1];
        console.log(`提取到viewkey: ${viewKey}`);
        console.log(`使用API地址: ${apiUrl}`);
        
        // 调用后端API获取视频播放地址
        const response = await Widget.http.post(apiUrl, {
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            body: JSON.stringify({
                url: link
            })
        });
        
        let data;
        try {
            data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
        } catch (parseError) {
            console.error("API响应解析失败:", response.data);
            throw new Error("API响应格式错误");
        }
        
        if (data.error) {
            console.error("API返回错误:", data.error);
            throw new Error(`API错误: ${data.error}`);
        }
        
        // 处理返回的视频链接
        const formats = data.result || [];
        console.log(`API返回 ${formats.length} 个视频格式:`, formats);
        
        if (formats.length === 0) {
            throw new Error("API未返回可用的视频格式");
        }
        
        let videoUrl = "";
        
        // 优先选择高清格式
        const preferredFormats = ["1080p", "720p", "480p", "360p"];
        for (const format of preferredFormats) {
            const found = formats.find(f => f.format && f.format.toLowerCase().includes(format));
            if (found && found.url) {
                videoUrl = found.url;
                console.log(`选择格式: ${found.format}`);
                break;
            }
        }
        
        // 如果没有找到首选格式，使用第一个可用的
        if (!videoUrl && formats.length > 0) {
            const firstFormat = formats.find(f => f.url);
            if (firstFormat) {
                videoUrl = firstFormat.url;
                console.log(`使用默认格式: ${firstFormat.format || '未知'}`);
            }
        }
        
        if (!videoUrl) {
            throw new Error("未找到可播放的视频地址");
        }
        
        console.log(`成功获取视频播放地址`);
        
        return {
            videoUrl: videoUrl,
            formats: formats.map(f => ({
                format: f.format || '未知格式',
                url: f.url || '',
                quality: f.format ? f.format.match(/\d+p/)?.[0] || '未知' : '未知'
            }))
        };
        
    } catch (error) {
        console.error("加载视频详情失败:", error);
        throw new Error(`加载视频详情失败: ${error.message}`);
    }
}

// 辅助函数：提取视频ID
function extractVideoId(url) {
    // 优先提取viewkey
    const viewKeyMatch = url.match(/viewkey=([^&\s]+)/);
    if (viewKeyMatch) {
        return viewKeyMatch[1];
    }
    
    // 其他格式的ID提取
    const pathMatch = url.match(/\/video\/([^\/\?]+)/);
    if (pathMatch) {
        return pathMatch[1];
    }
    
    // 最后尝试从URL末尾提取
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const cleanPart = lastPart.split('?')[0];
    
    return cleanPart || 'unknown';
}

// 辅助函数：解析时长
function parseDuration(durationText) {
    if (!durationText) return 0;
    
    const parts = durationText.split(':');
    if (parts.length === 2) {
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;
        return minutes * 60 + seconds;
    } else if (parts.length === 3) {
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseInt(parts[2]) || 0;
        return hours * 3600 + minutes * 60 + seconds;
    }
    
    return 0;
}

// 搜索功能
async function search(params = {}) {
    try {
        const keyword = params.keyword || "";
        const page = parseInt(params.page) || 1;
        const searchUrl = params.searchUrl || "输入搜索页面地址";
        
        if (!keyword) {
            throw new Error("搜索关键词不能为空");
        }
        
        if (!searchUrl || searchUrl === "https://cn.example.com/video/search") {
            throw new Error("请设置正确的搜索页面地址");
        }
        
        console.log(`搜索关键词: ${keyword}, 页码: ${page}`);
        console.log(`搜索地址: ${searchUrl}`);
        
        // 构建搜索URL
        const finalSearchUrl = searchUrl.includes('?') 
            ? `${searchUrl}&q=${encodeURIComponent(keyword)}&page=${page}`
            : `${searchUrl}?q=${encodeURIComponent(keyword)}&page=${page}`;
        
        const response = await Widget.http.get(finalSearchUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": searchUrl
            }
        });
        
        // 解析搜索结果 (使用与getFavoriteVideos相同的逻辑)
        const $ = Widget.html.load(response.data);
        const searchResults = [];
        
        // 解析视频列表 (根据实际网站结构调整选择器)
        $('.video-item, .search-result-item').each((index, element) => {
            const $element = $(element);
            
            // 提取视频信息
            const title = $element.find('.video-title, .title').text().trim();
            const viewUrl = $element.find('a').attr('href');
            const coverUrl = $element.find('img').attr('src');
            const duration = $element.find('.duration').text().trim();
            const rating = $element.find('.rating').text().trim();
            
            if (title && viewUrl) {
                // 提取viewkey或视频ID
                const viewKeyMatch = viewUrl.match(/viewkey=([^&]+)/);
                const videoId = viewKeyMatch ? viewKeyMatch[1] : extractVideoId(viewUrl);
                
                searchResults.push({
                    id: videoId,
                    type: "url",
                    title: title,
                    posterPath: coverUrl || "",
                    backdropPath: coverUrl || "",
                    releaseDate: "",
                    mediaType: "movie",
                    rating: rating || "",
                    genreTitle: "搜索结果",
                    duration: parseDuration(duration),
                    durationText: duration || "",
                    previewUrl: "",
                    videoUrl: "", // 将在loadDetail中获取
                    link: viewUrl.startsWith('http') ? viewUrl : `${new URL(searchUrl).origin}${viewUrl}`,
                    description: title
                });
            }
        });
        
        console.log(`搜索到 ${searchResults.length} 个结果`);
        return searchResults;
        
    } catch (error) {
        console.error("搜索失败:", error);
        throw new Error(`搜索失败: ${error.message}`);
    }
}
