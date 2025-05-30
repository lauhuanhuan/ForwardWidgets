// Pornhub收藏列表和用户上传视频Forward模块
// 用于在Forward播放器中观看Pornhub个人收藏列表和用户上传的视频

var WidgetMetadata = {
    id: "pornhub.favorites",
    title: "Pornhub",
    version: "1.0.5",
    requiredVersion: "0.0.1",
    description: "在线搜索、观看Pornhub",
    author: "加勒比海带",
    site: "https://cn.pornhub.com",
    modules: [
        {
            id: "favorites",
            title: "我的最爱",
            functionName: "getFavorites",
            params: [
                {
                    name: "username",
                    title: "用户名",
                    type: "input",
                    description: "Pornhub用户名",
                    value: "",
                    placeholders: [
                        {
                            title: "示例用户",
                            value: "didibibibi"
                        }
                    ]
                },
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    description: "收藏列表页码",
                    value: "1"
                },
                {
                    name: "apiUrl",
                    title: "API接口地址",
                    type: "input",
                    description: "获取视频直链的API接口地址",
                    value: "https://pornhubapi.8660105.xyz/get_mp4_links",
                    placeholders: [
                        {
                            title: "默认接口",
                            value: "https://pornhubapi.8660105.xyz/get_mp4_links"
                        }
                    ]
                },
                {
                    name: "testMode",
                    title: "测试模式",
                    type: "enumeration",
                    description: "是否启用测试模式",
                    value: "0",
                    enumOptions: [
                        {
                            title: "关闭",
                            value: "0"
                        },
                        {
                            title: "开启",
                            value: "1"
                        }
                    ]
                }
            ]
        },
        {
            id: "searchUser",
            title: "搜索艺人",
            functionName: "getUserUploads",
            params: [
                {
                    name: "username",
                    title: "艺人名称",
                    type: "input",
                    description: "Pornhub艺人名称",
                    value: "",
                    placeholders: [{ 'title': '798DS', 'value': '798DS' }, { 'title': 'ADOLFxNIKA', 'value': 'ADOLFxNIKA' }, { 'title': 'aiwanxiongxiong', 'value': 'aiwanxiongxiong' }, { 'title': 'Anastangel', 'value': 'Anastangel' }, { 'title': 'andmlove', 'value': 'andmlove' }, { 'title': 'ano ano chan', 'value': 'ano ano chan' }, { 'title': 'bentoboxy', 'value': 'bentoboxy' }, { 'title': 'bibi Fluffy', 'value': 'bibi Fluffy' }, { 'title': 'big8boy', 'value': 'big8boy' }, { 'title': 'Candy Love', 'value': 'Candy Love' }, { 'title': 'CandyKissVip', 'value': 'CandyKissVip' }, { 'title': 'Chinese Bunny', 'value': 'Chinese Bunny' }, { 'title': 'DemiFairyTW', 'value': 'DemiFairyTW' }, { 'title': 'Elle Lee', 'value': 'Elle Lee' }, { 'title': 'Eve', 'value': 'Eve' }, { 'title': 'Fiamurr', 'value': 'Fiamurr' }, { 'title': 'fortunecutie', 'value': 'fortunecutie' }, { 'title': 'HongKongDoll', 'value': 'HongKongDoll' }, { 'title': 'LeoLulu', 'value': 'LeoLulu' }, { 'title': 'LIs Evans', 'value': 'LIs Evans' }, { 'title': 'loliiiiipop99', 'value': 'loliiiiipop99' }, { 'title': 'Makissse', 'value': 'Makissse' }, { 'title': 'MihaNika69', 'value': 'MihaNika69' }, { 'title': 'nan12138', 'value': 'nan12138' }, { 'title': 'Nana_taipei', 'value': 'Nana_taipei' }, { 'title': 'Nuomibaby', 'value': 'Nuomibaby' }, { 'title': 'obokozu', 'value': 'obokozu' }, { 'title': 'papaxmama', 'value': 'papaxmama' }, { 'title': 'Qiobnxingcaiii', 'value': 'Qiobnxingcaiii' }, { 'title': 'RolaKiki', 'value': 'RolaKiki' }, { 'title': 'SadieSwoon', 'value': 'SadieSwoon' }, { 'title': 'SakuraCandy', 'value': 'SakuraCandy' }, { 'title': 'sskok16', 'value': 'sskok16' }, { 'title': 'SSR Peach', 'value': 'SSR Peach' }, { 'title': 'thelittlejuicer', 'value': 'thelittlejuicer' }, { 'title': 'Theoranda', 'value': 'Theoranda' }, { 'title': 'TLMS_SVJ', 'value': 'TLMS_SVJ' }, { 'title': 'twtutu', 'value': 'twtutu' }, { 'title': 'Vita Won', 'value': 'Vita Won' }, { 'title': 'Yuqiao Chen', 'value': 'Yuqiao Chen' }, { 'title': 'YuzuKitty', 'value': 'YuzuKitty' }]

                },
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    description: "艺人视频页码",
                    value: "1"
                },
                {
                    name: "apiUrl",
                    title: "API接口地址",
                    type: "input",
                    description: "获取视频直链的API接口地址",
                    value: "https://pornhubapi.8660105.xyz/get_mp4_links",
                    placeholders: [
                        {
                            title: "默认接口",
                            value: "https://pornhubapi.8660105.xyz/get_mp4_links"
                        }
                    ]
                },
                {
                    name: "testMode",
                    title: "测试模式",
                    type: "enumeration",
                    description: "是否启用测试模式",
                    value: "0",
                    enumOptions: [
                        {
                            title: "关闭",
                            value: "0"
                        },
                        {
                            title: "开启",
                            value: "1"
                        }
                    ]
                }
            ]
        }
    ]
};

// 将时间格式（如"7:34"）转换为秒数
function convertDurationToSeconds(duration) {
    if (!duration) return 0;

    // 处理格式如 "7:34" 或 "1:23:45"
    const parts = duration.split(':').map(part => parseInt(part, 10));

    if (parts.length === 3) {
        // 时:分:秒 格式
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // 分:秒 格式
        return parts[0] * 60 + parts[1];
    } else if (parts.length === 1 && !isNaN(parts[0])) {
        // 纯秒数
        return parts[0];
    }

    return 0; // 默认返回0
}

// 仅清理URL中的换行符和首尾空格，保留URL结构
function trimUrl(url) {
    if (!url) return "";

    // 移除换行符和首尾空格
    let trimmedUrl = url.replace(/\r?\n|\r/g, "").trim();

    return trimmedUrl;
}

// 获取单个视频的m3u8播放链接 - 仅使用API方式
async function getVideoM3u8Link(viewkey, apiUrl) {
    try {
        // 构建完整的视频URL
        const videoUrl = `https://cn.pornhub.com/view_video.php?viewkey=${viewkey}`;

        // 使用传入的API地址，如果未提供则使用默认值
        const finalApiUrl = apiUrl || "https://pornhubapi.8660105.xyz/get_mp4_links";

        console.log(`正在获取视频 ${viewkey} 的播放链接，使用API: ${finalApiUrl}...`);

        // 使用raw-json格式发送请求，与Postman一致
        const requestBody = JSON.stringify({
            url: videoUrl
        });

        // 发送API请求
        const response = await Widget.http.request({
            method: "POST",
            url: finalApiUrl,
            headers: {
                "Content-Type": "application/json"
            },
            data: requestBody
        });

        // 检查API响应
        if (!response) {
            console.log(`视频 ${viewkey} 的API请求失败: 无响应`);
            throw new Error("API请求失败: 无响应");
        }

        // 处理API响应数据
        let apiData;

        // 检查response.data的类型并相应处理
        if (response.data) {
            if (typeof response.data === 'object') {
                // 如果已经是对象，直接使用
                apiData = response.data;
            } else if (typeof response.data === 'string') {
                // 如果是字符串，尝试解析为JSON
                try {
                    apiData = JSON.parse(response.data);
                } catch (parseError) {
                    console.log(`视频 ${viewkey} 的API响应解析失败: ${parseError.message}`);
                    throw new Error(`API响应解析失败: ${parseError.message}`);
                }
            } else {
                console.log(`视频 ${viewkey} 的API响应类型异常: ${typeof response.data}`);
                throw new Error(`API响应类型异常: ${typeof response.data}`);
            }
        } else {
            console.log(`视频 ${viewkey} 的API响应无数据`);
            throw new Error("API响应无数据");
        }

        // 检查API响应是否包含错误信息
        if (apiData.error) {
            console.log(`视频 ${viewkey} 的API返回错误: ${apiData.error}`);
            throw new Error(`API返回错误: ${apiData.error}`);
        }

        // 检查API响应是否包含结果
        if (!apiData.result || !apiData.result.length) {
            console.log(`视频 ${viewkey} 的API未返回有效的视频链接，可能是视频已删除或无法解析`);
            throw new Error("API未返回有效的视频链接");
        }

        // 获取最高质量的m3u8链接
        const sortedFormats = apiData.result.sort((a, b) => {
            const formatA = parseInt(a.format.replace('p', '')) || 0;
            const formatB = parseInt(b.format.replace('p', '')) || 0;
            return formatB - formatA; // 降序排列，最高质量在前
        });

        // 仅清理URL中的换行符和首尾空格
        if (sortedFormats[0] && sortedFormats[0].url) {
            const originalUrl = sortedFormats[0].url;
            sortedFormats[0].url = trimUrl(originalUrl);

            // 如果URL发生了变化，记录日志
            if (originalUrl !== sortedFormats[0].url) {
                console.log(`URL已清理，原始URL: ${originalUrl}`);
                console.log(`清理后URL: ${sortedFormats[0].url}`);
            }
        }

        // 清理所有格式的URL
        sortedFormats.forEach(format => {
            if (format.url) {
                format.url = trimUrl(format.url);
            }
        });

        console.log(`视频 ${viewkey} 的播放链接获取成功，质量: ${sortedFormats[0].format}`);

        return {
            videoUrl: sortedFormats[0].url,
            quality: sortedFormats[0].format,
            formats: sortedFormats
        };
    } catch (error) {
        console.log(`获取视频 ${viewkey} 的播放链接失败: ${error.message}`);
        throw error;
    }
}

// 获取收藏列表视频
async function getFavorites(params = {}) {
    try {
        // 参数验证
        if (!params.username) {
            throw new Error("请提供用户名");
        }

        // 检查是否启用测试模式
        const testMode = params.testMode === "1";
        if (testMode) {
            console.log("测试模式已启用，将模拟点击第一个视频并输出详细日志");
        }

        // 构建URL
        const url = `https://cn.pornhub.com/users/${params.username}/videos/favorites`;

        // 首次请求（强制第1页，用于检测分页）
        const firstPageResponse = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                "Referer": "https://cn.pornhub.com/"
            }
        });
        // 检查响应
        if (!firstPageResponse || !firstPageResponse.data) {
            throw new Error("获取收藏列表失败，请检查网络连接或用户名是否正确");
        }

        // 检查是否有地区限制或其他错误信息
        if (firstPageResponse.data.includes("As you may know, your elected officials") ||
            firstPageResponse.data.includes("Trust and Safety measures")) {
            throw new Error("无法访问Pornhub，可能存在地区限制");
        }

        // 检测分页控件是否存在（通过moreDataBtn按钮）
        const hasPagination = firstPageResponse.data.includes('id="moreDataBtn"');

        // 初始化页码
        let page = Math.max(1, Number(params.page) || 1);

        // 如果有分页控件，尝试获取最大页码
        let maxPage = 1;

        // 从moreDataBtn的onclick参数中提取最大页码
        const match = firstPageResponse.data.match(/loadMoreData\('.*?',\s*'(\d+)',\s*'(\d+)'\)/);
        console.log("分页正则匹配结果: ", match);
        if (match && match.length >= 3) {
            maxPage = Math.max(parseInt(match[1]), parseInt(match[2]));
            console.log(`解析到分页参数: ${match[1]}, ${match[2]} → 最大页码: ${maxPage}`);
        } else {
            console.log("警告：未能从分页控件中解析出页码参数");
        }

        // 限制请求的页码不超过最大页码
        page = Math.min(page, maxPage);
        console.log(`最终请求页码: ${page} (用户请求: ${params.page || 1}, 最大允许: ${maxPage})`);



        // 构建最终URL
        const pageParam = page > 1 ? `?page=${page}` : '';
        const fullUrl = url + pageParam;

        console.log(`正在获取用户 ${params.username} 的收藏列表，页码: ${page}...`);

        // 发送请求获取收藏列表页面
        const response = await Widget.http.get(fullUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                "Referer": "https://cn.pornhub.com/"
            }
        });

        // 检查响应
        if (!response || !response.data) {
            throw new Error("获取收藏列表失败，请检查网络连接或用户名是否正确");
        }

        // 解析HTML
        const $ = Widget.html.load(response.data);

        // 检查是否有地区限制或其他错误信息
        if (response.data.includes("As you may know, your elected officials") ||
            response.data.includes("Trust and Safety measures")) {
            throw new Error("无法访问Pornhub，可能存在地区限制");
        }

        // 检查是否是空收藏列表
        if (response.data.includes("没有收藏视频") ||
            response.data.includes("No videos found") ||
            response.data.includes("empty-list")) {
            console.log("收藏列表为空");
            return []; // 返回空数组表示没有收藏视频
        }

        // 提取视频列表 - 放宽选择器，并增加登录提示
        const videos = [];
        // 用于去重的viewkey集合
        const processedViewkeys = new Set();

        // 尝试更宽容的选择器
        let videoItems = $("#videoFavoritesListSection .pcVideoListItem");

        // 如果宽容选择器找不到，尝试之前的严格选择器
        if (!videoItems.length) {
            console.log("宽容选择器未找到收藏视频，尝试严格选择器...");
            videoItems = $("li.pcVideoListItem[id^=\"vfavouriteVideo\"]");
        }

        // 如果仍然找不到，尝试更通用的选择器
        if (!videoItems.length) {
            console.log("严格选择器未找到收藏视频，尝试通用选择器...");
            videoItems = $("li.pcVideoListItem, div.videoBlock, div.videoBox");
        }

        console.log(`找到 ${videoItems.length} 个可能的收藏视频项`);

        // 如果找不到任何视频项，可能是页面结构变化或用户未登录
        if (videoItems.length === 0) {
            let errorMessage = "未找到任何收藏视频项。";
            // 检查是否需要登录
            if (response.data.includes("登录") || response.data.includes("Login") ||
                response.data.includes("sign in") || response.data.includes("注册")) {
                errorMessage += " 这通常需要登录才能查看收藏列表。";
            } else {
                errorMessage += " 请确认用户名是否正确，或页面结构是否已变化。";
            }
            console.log(errorMessage);
            throw new Error(errorMessage);
        }

        // 处理每个视频项
        videoItems.each((index, element) => {
            const $element = $(element);

            try {
                // 提取视频key - 尝试多种可能的属性
                let viewkey = $element.attr('data-video-vkey') ||
                    $element.attr('data-id') ||
                    $element.attr('id');

                // 如果没有直接属性，尝试从链接中提取
                if (!viewkey) {
                    const linkElement = $element.find('a[href*="viewkey="]');
                    if (linkElement.length) {
                        const href = linkElement.attr('href');
                        const keyMatch = href.match(/viewkey=([^&]+)/);
                        if (keyMatch && keyMatch[1]) {
                            viewkey = keyMatch[1];
                        }
                    }
                }

                // 如果仍然没有viewkey，跳过该项
                if (!viewkey) {
                    console.log(`视频项 #${index} 缺少viewkey，跳过`);
                    return;
                }

                // 清理viewkey，移除可能的前缀
                viewkey = viewkey.replace(/^(video|vkey|v|vfavouriteVideo)_/, "");

                // 检查是否已处理过该viewkey，避免重复添加
                if (processedViewkeys.has(viewkey)) {
                    console.log(`视频 ${viewkey} 已存在，跳过重复项`);
                    return;
                }

                // 提取视频标题
                let title = null;
                const titleElement = $element.find('.title a, .videoTitle a, a.title');
                if (titleElement.length) {
                    title = titleElement.attr('title') || titleElement.text().trim();
                }

                // 提取缩略图URL
                let thumbnailUrl = null;
                const thumbElement = $element.find('img.thumb, img.js-videoThumb, img[data-thumb]');
                if (thumbElement.length) {
                    thumbnailUrl = thumbElement.attr('src') ||
                        thumbElement.attr('data-mediumthumb') ||
                        thumbElement.attr('data-thumb');
                }

                // 清理缩略图URL
                if (thumbnailUrl) {
                    thumbnailUrl = trimUrl(thumbnailUrl);
                }

                // 提取视频预览URL (data-mediabook)
                let previewUrl = null;
                if (thumbElement.length) {
                    previewUrl = thumbElement.attr('data-mediabook');
                    if (previewUrl) {
                        previewUrl = trimUrl(previewUrl);
                        console.log(`收藏视频 ${viewkey} 提取到预览URL: ${previewUrl}`);
                    } else {
                        console.log(`收藏视频 ${viewkey} 未找到data-mediabook属性`);
                    }
                }

                // 提取视频时长
                let durationText = null;
                const durationElement = $element.find('.duration, .videoDuration');
                if (durationElement.length) {
                    durationText = durationElement.text().trim();
                }

                const duration = convertDurationToSeconds(durationText);

                // 提取上传者信息
                let uploader = null;
                const uploaderElement = $element.find('.usernameBadgesWrapper a, .usernameWrap a');
                if (uploaderElement.length) {
                    uploader = uploaderElement.text().trim();
                }

                // 构建视频详情页URL
                const videoUrl = `/view_video.php?viewkey=${viewkey}`;

                // 添加到结果数组
                videos.push({
                    id: viewkey,
                    type: "link",
                    title: title || "未知标题",
                    coverUrl: thumbnailUrl || "",
                    previewUrl: previewUrl || "", // 使用规范的previewUrl字段名
                    duration: duration, // 数值类型（秒数）
                    durationText: durationText || "未知时长", // 原始时长文本
                    uploader: uploader || "未知上传者",
                    link: videoUrl
                });

                // 添加到已处理集合
                processedViewkeys.add(viewkey);

            } catch (error) {
                console.log(`处理视频项 #${index} 时出错: ${error.message}`);
            }
        });

        console.log(`成功提取 ${videos.length} 个收藏视频`);

        // 如果启用测试模式，模拟点击第一个视频
        if (testMode && videos.length > 0) {
            console.log("测试模式：模拟点击第一个视频...");
            try {
                const firstVideo = videos[0];
                console.log(`测试视频信息: ${JSON.stringify(firstVideo)}`);

                // 调用loadDetail获取视频播放链接
                const detailResult = await loadDetail(firstVideo.link, params.apiUrl);
                console.log(`测试视频详情: ${JSON.stringify(detailResult)}`);

                // 将播放链接添加到视频对象中，方便测试
                firstVideo.videoUrl = detailResult.videoUrl;
                firstVideo.quality = detailResult.quality;
            } catch (error) {
                console.log(`测试模式下获取视频详情失败: ${error.message}`);
            }
        }

        return videos;
    } catch (error) {
        console.log(`获取收藏列表失败: ${error.message}`);
        throw error;
    }
}

// 获取用户上传的视频
async function getUserUploads(params = {}) {
    try {
        // 参数验证
        if (!params.username) {
            throw new Error("请提供艺人名称");
        }

        // 首次请求（强制第1页，用于检测分页）
        const url = `https://cn.pornhub.com/model/${params.username}/videos`;
        const firstPageResponse = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                "Referer": "https://cn.pornhub.com/"
            }
        });

        // 关键改进：通过分页控件判断是否支持分页
        const hasPagination = firstPageResponse.data.includes('class="pagination3 paginationGated"');
        // 初始化页码
        let page = Math.max(1, Number(params.page) || 1);


        // 如果有分页控件，尝试获取最大页码
        let maxPage = 1;
        if (hasPagination) {
            // 从分页控件中提取最大页码
            const pageLinks = firstPageResponse.data.match(/href="[^"]*page=(\d+)/g) || [];
            const pageNumbers = pageLinks.map(link => {
                const match = link.match(/page=(\d+)/);
                return match ? parseInt(match[1]) : 0;
            });
            maxPage = Math.max(...pageNumbers, 1); // 获取最大的页码

            // 限制请求的页码不超过最大页码
            page = Math.min(page, maxPage);

            console.log(`检测到分页控件，最大页码为: ${maxPage}`);
        } else {
            console.log("未检测到分页控件，强制使用第1页");
            page = 1; // 无分页控件时强制使用第1页
        }


        // 检查是否启用测试模式
        const testMode = params.testMode === "1";
        if (testMode) {
            console.log("测试模式已启用，将模拟点击第一个视频并输出详细日志");
        }

        // 构建最终URL
        const pageParam = page > 1 ? `?page=${page}` : '';
        const fullUrl = url + pageParam;

        console.log(`正在获取用户 ${params.username} 的上传视频，页码: ${page}...`);

        // 发送请求获取用户上传视频页面
        const response = await Widget.http.get(fullUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                "Referer": "https://cn.pornhub.com/"
            }
        });

        // 检查响应
        if (!response || !response.data) {
            throw new Error("获取用户上传视频失败，请检查网络连接或用户名是否正确");
        }

        // 解析HTML
        const $ = Widget.html.load(response.data);

        // 检查是否有地区限制或其他错误信息
        if (response.data.includes("As you may know, your elected officials") ||
            response.data.includes("Trust and Safety measures")) {
            throw new Error("无法访问Pornhub，可能存在地区限制");
        }

        // 检查页面标题是否包含用户名，确保我们在正确的页面上
        const pageTitle = $("title").text();
        if (!pageTitle.includes(params.username)) {
            console.log(`警告：页面标题 "${pageTitle}" 可能不包含用户名 "${params.username}"`);
        }

        // 尝试找到用户上传视频的专用容器
        let videoContainer = $("#modelVideosSection");

        // 如果找不到专用容器，尝试其他可能的容器
        if (!videoContainer.length) {
            console.log("警告：未找到用户上传视频的专用容器，将使用整个页面作为容器");
            videoContainer = $("body");
        }

        // 提取视频列表
        const videos = [];
        // 用于去重的viewkey集合
        const processedViewkeys = new Set();


        // 尝试找到视频项 - 增加排除headerMenuContainer的条件
        let videoItems = videoContainer.find(".pcVideoListItemli").filter(function () {
            return $(this).closest('#headerMenuContainer').length === 0;
        });

        // 如果找不到，尝试其他可能的选择器 - 同样增加排除条件
        if (!videoItems.length) {
            console.log("未找到标准视频项，尝试其他选择器...");
            videoItems = $("li.videoblock, div.videoBox, div.videoBlock").filter(function () {
                return $(this).closest('#headerMenuContainer').length === 0;
            });
        }

        console.log(`在用户上传视频容器中找到 ${videoItems.length} 个视频项，开始处理...`);

        // 如果找不到任何视频项，可能是页面结构变化或该用户未上传视频
        if (videoItems.length === 0) {
            console.log("在用户上传视频容器中未找到任何视频项。可能是页面结构已变化或该用户未上传视频。");
            return []; // 返回空数组表示没有视频
        }

        // 处理每个视频项
        videoItems.each((index, element) => {
            const $element = $(element);

            try {
                // 提取视频key - 尝试多种可能的属性
                let viewkey = $element.attr('data-video-vkey') ||
                    $element.attr('data-id') ||
                    $element.attr('id');

                // 如果没有直接属性，尝试从链接中提取
                if (!viewkey) {
                    const linkElement = $element.find('a[href*="viewkey="]');
                    if (linkElement.length) {
                        const href = linkElement.attr('href');
                        const keyMatch = href.match(/viewkey=([^&]+)/);
                        if (keyMatch && keyMatch[1]) {
                            viewkey = keyMatch[1];
                        }
                    }
                }

                // 如果仍然没有viewkey，跳过该项
                if (!viewkey) {
                    console.log(`视频项 #${index} 缺少viewkey，跳过`);
                    return;
                }

                // 清理viewkey，移除可能的前缀
                viewkey = viewkey.replace(/^(video|vkey|v|vfavouriteVideo)_/, "");

                // 检查是否已处理过该viewkey，避免重复添加
                if (processedViewkeys.has(viewkey)) {
                    console.log(`视频 ${viewkey} 已存在，跳过重复项`);
                    return;
                }

                // 提取视频标题
                let title = null;
                const titleElement = $element.find('.title a, .videoTitle a, a.title');
                if (titleElement.length) {
                    title = titleElement.attr('title') || titleElement.text().trim();
                }

                // 提取缩略图URL
                let thumbnailUrl = null;
                const thumbElement = $element.find('img.thumb, img.js-videoThumb, img[data-thumb]');
                if (thumbElement.length) {
                    thumbnailUrl = thumbElement.attr('src') ||
                        thumbElement.attr('data-mediumthumb') ||
                        thumbElement.attr('data-thumb');
                }

                // 清理缩略图URL
                if (thumbnailUrl) {
                    thumbnailUrl = trimUrl(thumbnailUrl);
                }

                // 提取视频预览URL - 优先使用data-webm属性，若无再降级到data-mediabook
                let previewUrl = null;

                // 首先尝试从a标签获取data-webm属性
                const linkWithWebm = $element.find('a[data-webm]');
                if (linkWithWebm.length) {
                    previewUrl = linkWithWebm.attr('data-webm');
                    if (previewUrl) {
                        previewUrl = trimUrl(previewUrl);
                        console.log(`用户视频 ${viewkey} 从a标签提取到data-webm预览URL: ${previewUrl}`);
                    }
                }

                // 如果a标签没有data-webm，尝试从img标签获取data-webm
                if (!previewUrl && thumbElement.length) {
                    previewUrl = thumbElement.attr('data-webm');
                    if (previewUrl) {
                        previewUrl = trimUrl(previewUrl);
                        console.log(`用户视频 ${viewkey} 从img标签提取到data-webm预览URL: ${previewUrl}`);
                    }
                }

                // 如果仍然没有找到预览URL，降级到data-mediabook
                if (!previewUrl && thumbElement.length) {
                    previewUrl = thumbElement.attr('data-mediabook');
                    if (previewUrl) {
                        previewUrl = trimUrl(previewUrl);
                        console.log(`用户视频 ${viewkey} 降级使用data-mediabook预览URL: ${previewUrl}`);
                    } else {
                        console.log(`用户视频 ${viewkey} 未找到任何预览URL属性`);
                    }
                }

                // 提取视频时长
                let durationText = null;
                const durationElement = $element.find('.duration, .videoDuration');
                if (durationElement.length) {
                    durationText = durationElement.text().trim();
                }

                const duration = convertDurationToSeconds(durationText);

                // 提取上传者信息
                let uploader = null;
                const uploaderElement = $element.find('.usernameBadgesWrapper a, .usernameWrap a');
                if (uploaderElement.length) {
                    uploader = uploaderElement.text().trim();
                }

                // 如果没有找到上传者信息，使用URL中的用户名
                if (!uploader) {
                    uploader = params.username;
                }

                // 构建视频详情页URL
                const videoUrl = `/view_video.php?viewkey=${viewkey}`;

                // 添加到结果数组
                videos.push({
                    id: viewkey,
                    type: "link",
                    title: title || "未知标题",
                    coverUrl: thumbnailUrl || "",
                    previewUrl: previewUrl || "", // 使用规范的previewUrl字段名
                    duration: duration, // 数值类型（秒数）
                    durationText: durationText || "未知时长", // 原始时长文本
                    uploader: uploader || params.username, // 使用参数中的用户名作为默认值
                    link: videoUrl
                });

                // 添加到已处理集合
                processedViewkeys.add(viewkey);

            } catch (error) {
                console.log(`处理视频项 #${index} 时出错: ${error.message}`);
            }
        });

        console.log(`成功提取 ${videos.length} 个用户上传视频`);

        // 如果启用测试模式，模拟点击第一个视频
        if (testMode && videos.length > 0) {
            console.log("测试模式：模拟点击第一个视频...");
            try {
                const firstVideo = videos[0];
                console.log(`测试视频信息: ${JSON.stringify(firstVideo)}`);

                // 调用loadDetail获取视频播放链接
                const detailResult = await loadDetail(firstVideo.link, params.apiUrl);
                console.log(`测试视频详情: ${JSON.stringify(detailResult)}`);

                // 将播放链接添加到视频对象中，方便测试
                firstVideo.videoUrl = detailResult.videoUrl;
                firstVideo.quality = detailResult.quality;
            } catch (error) {
                console.log(`测试模式下获取视频详情失败: ${error.message}`);
            }
        }

        return videos;
    } catch (error) {
        console.log(`获取用户上传视频失败: ${error.message}`);
        throw error;
    }
}

// 加载视频详情 - 点击视频时才获取m3u8链接
async function loadDetail(link, apiUrl) {
    console.log(`loadDetail被调用，链接: ${link}`);

    try {
        // 从link中提取viewkey
        const viewkeyMatch = link.match(/viewkey=([^&]+)/);
        if (!viewkeyMatch || !viewkeyMatch[1]) {
            console.log(`无效的视频链接: ${link}`);
            throw new Error("无效的视频链接");
        }

        const viewkey = viewkeyMatch[1];
        console.log(`开始获取视频 ${viewkey} 的播放链接...`);

        // 获取m3u8链接
        const m3u8Data = await getVideoM3u8Link(viewkey, apiUrl);

        if (!m3u8Data || !m3u8Data.videoUrl) {
            console.log(`无法获取视频 ${viewkey} 的播放链接`);
            throw new Error("无法获取视频播放链接");
        }

        // 仅清理URL中的换行符和首尾空格
        const trimmedUrl = trimUrl(m3u8Data.videoUrl);
        console.log(`视频 ${viewkey} 的播放链接获取成功并已清理`);

        // 构建完整的视频URL
        const fullVideoUrl = `https://cn.pornhub.com/view_video.php?viewkey=${viewkey}`;

        // 返回Forward兼容的详情对象 - 移除自动播放标记
        const result = {
            id: viewkey,
            type: "detail", // 必须是detail类型
            videoUrl: trimmedUrl, // 仅清理换行符和首尾空格的URL
            customHeaders: {
                "Referer": fullVideoUrl,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            },
            quality: m3u8Data.quality,
            title: "视频播放", // 添加标题字段
            duration: 0, // 添加持续时间字段
            formats: m3u8Data.formats // 添加格式信息

            // 已移除所有自动播放标记
        };

        console.log(`loadDetail 返回数据: ${JSON.stringify(result)}`);

        return result;
    } catch (error) {
        console.log(`loadDetail执行失败: ${error.message}`);
        throw error;
    }
}
