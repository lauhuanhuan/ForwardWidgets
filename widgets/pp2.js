var WidgetMetadata = {
    id: "VideoFavoritePlayer",
    title: "视频收藏列表播放器",
    description: "在线播放收藏列表中的视频内容",
    author: "pp",
    site: "https://example.com",
    version: "1.1.0",
    requiredVersion: "0.0.1",
    modules: [
        {
            title: "收藏列表",
            description: "获取并播放收藏列表中的视频",
            requiresWebView: false,
            functionName: "getFavoriteVideos",
            sectionMode: false,
            params: [
                {
                    name: "favoriteUrl",
                    title: "收藏列表地址",
                    type: "input",
                    description: "收藏列表页面的完整URL地址",
                    value: "",
                    placeholders: [
                        {
                            title: "例如：https://cn.pornhub.com/users/username/videos/favorites",
                            value: "https://cn.pornhub.com/users/username/videos/favorites"
                        }
                    ]
                },
                {
                    name: "apiUrl",
                    title: "视频解析API地址",
                    type: "input",
                    description: "用于获取视频播放地址的后端API接口",
                    value: "http://localhost:16813/get_mp4_links",
                    placeholders: [
                        {
                            title: "默认本地API",
                            value: "http://localhost:16813/get_mp4_links"
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

// 全局配置管理
const GlobalConfig = {
    apiUrl: "http://localhost:16813/get_mp4_links",
    defaultHeaders: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    },
    
    // 更新API地址
    updateApiUrl(newUrl) {
        if (newUrl && newUrl.trim()) {
            this.apiUrl = newUrl.trim();
            console.log(`API地址已更新为: ${this.apiUrl}`);
        }
    }
};

// 参数验证工具
const ParamValidator = {
    /**
     * 验证必需参数
     */
    validateRequired(params, requiredFields) {
        const missing = [];
        requiredFields.forEach(field => {
            if (!params[field] || params[field].toString().trim() === "") {
                missing.push(field);
            }
        });
        
        if (missing.length > 0) {
            throw new Error(`缺少必需参数: ${missing.join(', ')}`);
        }
    },
    
    /**
     * 验证URL格式
     */
    validateUrl(url, fieldName = "URL") {
        if (!url || typeof url !== 'string') {
            throw new Error(`${fieldName}不能为空`);
        }
        
        const trimmedUrl = url.trim();
        if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
            throw new Error(`${fieldName}格式不正确，必须以http://或https://开头`);
        }
        
        return trimmedUrl;
    },
    
    /**
     * 验证数字参数
     */
    validateNumber(value, fieldName, min = 1, max = 100) {
        // 处理空值或未定义的情况
        if (value === null || value === undefined || value === '') {
            console.log(`${fieldName}为空，使用默认值: ${min}`);
            return min;
        }
        
        const num = parseInt(value);
        if (isNaN(num)) {
            console.log(`${fieldName}不是有效数字，使用默认值: ${min}`);
            return min;
        }
        
        // 确保数字在合理范围内
        if (num < min) {
            console.log(`${fieldName}(${num})小于最小值，使用: ${min}`);
            return min;
        }
        
        if (num > max) {
            console.log(`${fieldName}(${num})大于最大值，使用: ${max}`);
            return max;
        }
        
        return num;
    }
};

// HTML解析工具
const HtmlParser = {
    /**
     * 解析视频列表元素
     */
    parseVideoElements($, selector = '.videoblock') {
        const elements = $(selector);
        console.log(`使用选择器: ${selector}，找到 ${elements.length} 个视频元素`);
        return elements;
    },
    
    /**
     * 提取视频信息
     */
    extractVideoInfo($element) {
        try {
            // 尝试多种选择器获取标题和链接
            let titleElement = $element.find('.title a');
            if (titleElement.length === 0) {
                titleElement = $element.find('.phimage a');
            }
            if (titleElement.length === 0) {
                titleElement = $element.find('a[title]');
            }
            if (titleElement.length === 0) {
                titleElement = $element.find('a').first();
            }
            
            const title = this.cleanText(
                titleElement.attr('title') || 
                titleElement.text() || 
                titleElement.find('img').attr('alt') || ""
            );
            
            const viewUrl = titleElement.attr('href') || "";
            
            // 获取封面图片 - 尝试多种属性
            const imgElement = $element.find('img').first();
            const coverUrl = imgElement.attr('data-src') || 
                             imgElement.attr('src') || 
                             imgElement.attr('data-mediumthumb') || 
                             imgElement.attr('data-thumb_url') || 
                             imgElement.attr('data-original') || "";
            
            // 获取时长信息
            const duration = this.cleanText(
                $element.find('.duration').text() ||
                $element.find('.video-duration').text() ||
                $element.find('[class*="duration"]').text() || ""
            );
            
            // 获取评分信息
            const rating = this.cleanText(
                $element.find('.rating-container .percent').text() ||
                $element.find('.percent').text() ||
                $element.find('[class*="rating"]').text() || ""
            );
            
            // 获取观看次数
            const views = this.cleanText(
                $element.find('.views').text() ||
                $element.find('[class*="view"]').text() || ""
            );
            
            console.log(`提取信息 - 标题: "${title}", URL: "${viewUrl}", 封面: "${coverUrl ? '有' : '无'}", 时长: "${duration}"`);
            
            return {
                title,
                viewUrl,
                coverUrl,
                duration,
                rating,
                views
            };
        } catch (error) {
            console.error('提取视频信息时出错:', error);
            return {
                title: "",
                viewUrl: "",
                coverUrl: "",
                duration: "",
                rating: "",
                views: ""
            };
        }
    },
    
    /**
     * 清理文本内容
     */
    cleanText(text) {
        return text ? text.trim().replace(/\s+/g, ' ') : "";
    }
};

// URL工具
const UrlUtils = {
    /**
     * 提取视频ID
     */
    extractVideoId(url) {
        if (!url) return null;
        
        // 匹配 viewkey 参数
        const viewKeyMatch = url.match(/viewkey=([^&]+)/);
        if (viewKeyMatch) {
            return viewKeyMatch[1];
        }
        
        // 匹配路径中的ID
        const pathMatch = url.match(/\/video\/([^\/\?]+)/);
        if (pathMatch) {
            return pathMatch[1];
        }
        
        // 默认处理
        return url.split('/').pop().split('?')[0];
    },
    
    /**
     * 构建完整URL
     */
    buildFullUrl(baseUrl, path) {
        if (!path) return "";
        if (path.startsWith('http')) return path;
        
        const cleanBase = baseUrl.replace(/\/$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${cleanBase}${cleanPath}`;
    },
    
    /**
     * 构建分页URL
     */
    buildPageUrl(baseUrl, page) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}page=${page}`;
    }
};

// 时长解析工具
const DurationParser = {
    /**
     * 解析时长文本为秒数
     */
    parseToSeconds(durationText) {
        if (!durationText) return 0;
        
        const cleanText = durationText.trim();
        const parts = cleanText.split(':');
        
        try {
            if (parts.length === 2) {
                // MM:SS 格式
                const minutes = parseInt(parts[0]) || 0;
                const seconds = parseInt(parts[1]) || 0;
                return minutes * 60 + seconds;
            } else if (parts.length === 3) {
                // HH:MM:SS 格式
                const hours = parseInt(parts[0]) || 0;
                const minutes = parseInt(parts[1]) || 0;
                const seconds = parseInt(parts[2]) || 0;
                return hours * 3600 + minutes * 60 + seconds;
            }
        } catch (error) {
            console.warn(`解析时长失败: ${durationText}`, error);
        }
        
        return 0;
    }
};

// 视频格式选择器
const FormatSelector = {
    /**
     * 选择最佳视频格式
     */
    selectBestFormat(formats) {
        if (!formats || formats.length === 0) {
            return null;
        }
        
        console.log(`可用格式数量: ${formats.length}`);
        formats.forEach((format, index) => {
            console.log(`格式 ${index + 1}: ${format.format} - ${format.url ? '有效' : '无效'}`);
        });
        
        // 优先级列表
        const preferredFormats = ["1080p", "720p", "480p", "360p"];
        
        // 按优先级查找
        for (const preferred of preferredFormats) {
            const found = formats.find(f => 
                f.format && 
                f.url && 
                f.format.toLowerCase().includes(preferred.toLowerCase())
            );
            if (found) {
                console.log(`选择格式: ${found.format}`);
                return found;
            }
        }
        
        // 如果没有匹配的优先格式，选择第一个有效的
        const firstValid = formats.find(f => f.url);
        if (firstValid) {
            console.log(`使用第一个有效格式: ${firstValid.format}`);
            return firstValid;
        }
        
        console.warn("未找到任何有效的视频格式");
        return null;
    }
};

/**
 * 获取收藏视频列表
 */
async function getFavoriteVideos(params = {}) {
    try {
        console.log("=== 开始获取收藏视频列表 ===");
        console.log("输入参数:", params);
        
        // 参数验证和处理
        ParamValidator.validateRequired(params, ['favoriteUrl']);
        
        const favoriteUrl = ParamValidator.validateUrl(params.favoriteUrl, "收藏列表地址");
        const apiUrl = ParamValidator.validateUrl(params.apiUrl || GlobalConfig.apiUrl, "API地址");
        const page = ParamValidator.validateNumber(params.page || 1, "页码", 1, 999);
        const count = ParamValidator.validateNumber(params.count || 20, "每页数量", 1, 50);
        
        // 更新全局配置
        GlobalConfig.updateApiUrl(apiUrl);
        
        console.log(`收藏列表地址: ${favoriteUrl}`);
        console.log(`API接口地址: ${apiUrl}`);
        console.log(`页码: ${page}, 每页数量: ${count}`);
        
        // 构建请求URL
        const listUrl = UrlUtils.buildPageUrl(favoriteUrl, page);
        console.log(`请求URL: ${listUrl}`);
        
        // 发送HTTP请求
        const response = await Widget.http.get(listUrl, {
            headers: {
                ...GlobalConfig.defaultHeaders,
                "Referer": favoriteUrl
            }
        });
        
        if (!response.data) {
            throw new Error("服务器返回空数据");
        }
        
        console.log(`HTML内容长度: ${response.data.length} 字符`);
        
        // 解析HTML内容
        const $ = Widget.html.load(response.data);
        const videoItems = [];
        
        // 获取视频元素
        const videoElements = HtmlParser.parseVideoElements($);
        
        if (videoElements.length === 0) {
            console.warn("未找到任何视频元素，可能需要调整选择器");
            return [];
        }
        
        // 解析视频信息
        for (let i = 0; i < videoElements.length && videoItems.length < count; i++) {
            try {
                const $element = $(videoElements[i]);
                const videoInfo = HtmlParser.extractVideoInfo($element);
                
                console.log(`处理视频 ${i + 1}:`, {
                    title: videoInfo.title,
                    viewUrl: videoInfo.viewUrl,
                    coverUrl: videoInfo.coverUrl ? '有封面' : '无封面',
                    duration: videoInfo.duration
                });
                
                if (!videoInfo.title || !videoInfo.viewUrl) {
                    console.warn(`视频 ${i + 1}: 缺少必要信息 - 标题: "${videoInfo.title}", URL: "${videoInfo.viewUrl}"`);
                    continue;
                }
                
                // 提取视频ID
                const videoId = UrlUtils.extractVideoId(videoInfo.viewUrl);
                if (!videoId) {
                    console.warn(`视频 ${i + 1}: 无法提取视频ID，URL: ${videoInfo.viewUrl}`);
                    continue;
                }
                
                // 构建完整URL
                const fullUrl = UrlUtils.buildFullUrl("https://cn.pornhub.com", videoInfo.viewUrl);
                
                console.log(`✓ 成功处理视频 ${i + 1}: "${videoInfo.title}" - ID: ${videoId}`);
                
                // 创建视频项
                const videoItem = {
                    id: videoId,
                    type: "url",
                    title: videoInfo.title,
                    posterPath: videoInfo.coverUrl,
                    backdropPath: videoInfo.coverUrl,
                    releaseDate: "",
                    mediaType: "movie",
                    rating: videoInfo.rating,
                    genreTitle: "收藏视频",
                    duration: DurationParser.parseToSeconds(videoInfo.duration),
                    durationText: videoInfo.duration,
                    previewUrl: "",
                    videoUrl: fullUrl, // 页面URL，loadDetail会获取实际播放地址
                    link: fullUrl,
                    description: videoInfo.title
                };
                
                videoItems.push(videoItem);
                console.log(`当前已获取视频数量: ${videoItems.length}/${count}`);
                
            } catch (itemError) {
                console.error(`解析视频 ${i + 1} 时出错:`, itemError);
                console.error(`错误详情:`, itemError.stack);
                continue;
            }
        }
        
        console.log(`=== 成功获取 ${videoItems.length} 个视频 ===`);
        return videoItems;
        
    } catch (error) {
        console.error("获取收藏视频列表失败:", error);
        throw new Error(`获取收藏视频列表失败: ${error.message}`);
    }
}

/**
 * 加载视频详情和播放地址
 */
async function loadDetail(link) {
    try {
        console.log("=== 开始加载视频详情 ===");
        console.log(`视频链接: ${link}`);
        
        // 参数验证
        if (!link) {
            throw new Error("视频链接不能为空");
        }
        
        // 提取视频ID
        const videoId = UrlUtils.extractVideoId(link);
        if (!videoId) {
            throw new Error("无法从链接中提取视频ID");
        }
        
        console.log(`视频ID: ${videoId}`);
        console.log(`使用API地址: ${GlobalConfig.apiUrl}`);
        
        // 调用后端API获取视频播放地址
        const response = await Widget.http.post(GlobalConfig.apiUrl, {
            headers: {
                "Content-Type": "application/json",
                "User-Agent": GlobalConfig.defaultHeaders["User-Agent"]
            },
            body: JSON.stringify({
                url: link
            })
        });
        
        if (!response.data) {
            throw new Error("API返回空响应");
        }
        
        // 解析JSON响应
        let apiData;
        try {
            apiData = JSON.parse(response.data);
        } catch (parseError) {
            console.error("解析API响应失败:", parseError);
            console.log("原始响应内容:", response.data);
            throw new Error("API响应格式错误");
        }
        
        // 检查API错误
        if (apiData.error) {
            throw new Error(`API错误: ${apiData.error}`);
        }
        
        // 处理返回的视频格式
        const formats = apiData.result || [];
        console.log(`API返回 ${formats.length} 个视频格式`);
        
        if (formats.length === 0) {
            throw new Error("API未返回任何视频格式");
        }
        
        // 选择最佳格式
        const selectedFormat = FormatSelector.selectBestFormat(formats);
        if (!selectedFormat) {
            throw new Error("未找到可用的视频格式");
        }
        
        const videoUrl = selectedFormat.url;
        console.log(`最终视频播放地址: ${videoUrl}`);
        
        // 返回详情信息
        const result = {
            success: true,
            videoUrl: videoUrl,
            formats: formats,
            selectedFormat: selectedFormat.format,
            headers: {
                "Referer": "https://cn.pornhub.com/",
                "User-Agent": GlobalConfig.defaultHeaders["User-Agent"]
            }
        };
        
        console.log("=== 视频详情加载成功 ===");
        return result;
        
    } catch (error) {
        console.error("加载视频详情失败:", error);
        
        // 返回错误信息
        return {
            success: false,
            error: error.message,
            videoUrl: "",
            formats: []
        };
    }
}
