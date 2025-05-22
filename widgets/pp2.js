var WidgetMetadata = {
  id: "GenericVideoPlayer",
  title: "通用视频播放器",
  description: "在线观看视频收藏列表",
  author: "pp",
  site: "https://example.com",
  version: "1.0.2",
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
                  value: "https://your-api-domain.com/get_video_links",
                  placeholders: [
                      {
                          title: "默认接口",
                          value: "https://your-api-domain.com/get_video_links"
                      }
                  ]
              },
              {
                  name: "favoriteUrl",
                  title: "收藏列表地址",
                  type: "input",
                  description: "收藏列表页面地址",
                  value: "输入你的收藏列表地址",
                  placeholders: [
                      {
                          title: "收藏列表地址",
                          value: "输入你的收藏列表地址"
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
              description: "搜索页面地址",
              value: "输入搜索页面地址",
              placeholders: [
                  {
                      title: "搜索地址",
                      value: "输入搜索页面地址"
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
};

// 全局变量存储配置
let globalConfig = {
  apiUrl: "https://your-api-domain.com/get_video_links"
};

// 获取收藏视频列表
async function getFavoriteVideos(params = {}) {
  try {
      // 参数验证
      const page = parseInt(params.page) || 1;
      const count = parseInt(params.count) || 20;
      const apiUrl = params.apiUrl || "https://your-api-domain.com/get_video_links";
      const favoriteUrl = params.favoriteUrl || "输入你的收藏列表地址";
      
      // 保存API地址到全局变量
      globalConfig.apiUrl = apiUrl;
      
      // 验证必要参数
      if (!favoriteUrl || favoriteUrl === "输入你的收藏列表地址") {
          throw new Error("请设置收藏列表地址");
      }
      
      console.log(`获取第 ${page} 页，每页 ${count} 个视频`);
      console.log(`收藏列表地址: ${favoriteUrl}`);
      console.log(`API接口地址: ${apiUrl}`);
      
      // 构建请求URL
      const listUrl = favoriteUrl.includes('?') 
          ? `${favoriteUrl}&page=${page}` 
          : `${favoriteUrl}?page=${page}`;
      
      // 发送请求获取视频列表
      const response = await Widget.http.get(listUrl, {
          headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
              "Referer": favoriteUrl
          }
      });
      
      // 解析HTML内容
      const $ = Widget.html.load(response.data);
      const videoItems = [];
      
      console.log("开始解析HTML内容");
      
      // 解析视频列表 (使用pornhub的实际选择器)
      const videoElements = $('.videoblock');
      console.log(`使用选择器:.videoblock，找到 ${videoElements.length} 个元素`);
      
      for (let i = 0; i < videoElements.length && videoItems.length < count; i++) {
          const element = videoElements[i];
          const $element = $(element);
          
          // 提取视频信息
          const titleElement = $element.find('.title a, .phimage a');
          const title = titleElement.attr('title') || titleElement.text().trim();
          const viewUrl = titleElement.attr('href');
          const coverUrl = $element.find('img').attr('data-src') || $element.find('img').attr('src');
          const duration = $element.find('.duration').text().trim();
          const rating = $element.find('.rating-container .percent').text().trim();
          
          console.log(`视频 ${i + 1}: 标题="${title}", URL="https://cn.pornhub.com${viewUrl}"`);
          
          if (title && viewUrl) {
              // 提取viewkey
              const viewKeyMatch = viewUrl.match(/viewkey=([^&]+)/);
              const videoId = viewKeyMatch ? viewKeyMatch[1] : extractVideoId(viewUrl);
              
              // 构建完整URL
              const fullUrl = viewUrl.startsWith('http') ? viewUrl : `https://cn.pornhub.com${viewUrl}`;
              
              videoItems.push({
                  id: videoId,
                  type: "url",
                  title: title,
                  posterPath: coverUrl || "",
                  backdropPath: coverUrl || "",
                  releaseDate: "",
                  mediaType: "movie",
                  rating: rating || "",
                  genreTitle: "视频",
                  duration: parseDuration(duration),
                  durationText: duration || "",
                  previewUrl: "",
                  videoUrl: fullUrl, // 先设置页面URL，loadDetail会替换为播放地址
                  link: fullUrl,
                  description: title
              });
          }
      }
      
      console.log(`成功获取 ${videoItems.length} 个视频`);
      return videoItems;
      
  } catch (error) {
      console.error("获取视频列表失败:", error);
      throw new Error(`获取视频列表失败: ${error.message}`);
  }
}

// 加载视频详情和播放地址
async function loadDetail(link) {
  try {
      console.log(`加载视频详情: ${link}`);
      
      // 使用全局配置中的API地址
      const apiUrl = globalConfig.apiUrl;
      
      // 提取viewkey
      const viewKeyMatch = link.match(/viewkey=([^&]+)/);
      if (!viewKeyMatch) {
          throw new Error("无法提取视频ID");
      }
      
      const viewKey = viewKeyMatch[1];
      console.log(`使用API地址: ${apiUrl}`);
      console.log(`视频ID: ${viewKey}`);
      
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
          data = JSON.parse(response.data);
      } catch (parseError) {
          console.error("解析API响应失败:", parseError);
          console.log("原始响应:", response.data);
          throw new Error("API响应格式错误");
      }
      
      if (data.error) {
          throw new Error(data.error);
      }
      
      // 处理返回的视频链接
      const formats = data.result || [];
      console.log(`获取到 ${formats.length} 个格式:`, formats);
      
      if (formats.length === 0) {
          throw new Error("API未返回任何视频格式");
      }
      
      let selectedFormat = null;
      
      // 优先选择高清格式
      const preferredFormats = ["1080p", "720p", "480p"];
      for (const format of preferredFormats) {
          const found = formats.find(f => f.format && f.format.includes(format));
          if (found && found.url) {
              selectedFormat = found;
              console.log(`选择格式: ${found.format}`);
              break;
          }
      }
      
      // 如果没有找到首选格式，使用第一个可用的
      if (!selectedFormat && formats.length > 0) {
          selectedFormat = formats[0];
          console.log(`使用默认格式: ${selectedFormat.format}`);
      }
      
      if (!selectedFormat || !selectedFormat.url) {
          throw new Error("未找到可播放的视频地址");
      }
      
      const videoUrl = selectedFormat.url;
      console.log(`最终视频地址: ${videoUrl}`);

      // 返回完整的视频信息
      return {
          success: true,
          videoUrl: videoUrl,
          formats: formats,
          selectedFormat: selectedFormat.format,
          // 添加播放器可能需要的额外信息
          headers: {
              "Referer": "https://cn.pornhub.com/",
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
      };
      
  } catch (error) {
      console.error("加载视频详情失败:", error);
      return {
          success: false,
          error: error.message,
          videoUrl: "",
          formats: []
      };
  }
}

// 辅助函数：提取视频ID
function extractVideoId(url) {
  // 根据实际URL结构调整
  const matches = url.match(/\/video\/([^\/\?]+)/);
  return matches ? matches[1] : url.split('/').pop().split('?')[0];
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
      
      if (!searchUrl || searchUrl === "输入搜索页面地址") {
          throw new Error("请设置搜索页面地址");
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
      
      // 解析视频列表 (使用pornhub的实际选择器)
      $('.videoblock').each((index, element) => {
          const $element = $(element);
          
          // 提取视频信息
          const titleElement = $element.find('.title a, .phimage a');
          const title = titleElement.attr('title') || titleElement.text().trim();
          const viewUrl = titleElement.attr('href');
          const coverUrl = $element.find('img').attr('data-src') || $element.find('img').attr('src');
          const duration = $element.find('.duration').text().trim();
          const rating = $element.find('.rating-container .percent').text().trim();
          
          if (title && viewUrl) {
              // 提取viewkey
              const viewKeyMatch = viewUrl.match(/viewkey=([^&]+)/);
              const videoId = viewKeyMatch ? viewKeyMatch[1] : extractVideoId(viewUrl);
              
              // 构建完整URL
              const fullUrl = viewUrl.startsWith('http') ? viewUrl : `https://cn.pornhub.com${viewUrl}`;
              
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
                  videoUrl: fullUrl, // 先设置页面URL，loadDetail会替换为播放地址
                  link: fullUrl,
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
