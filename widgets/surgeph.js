// Pornhub直链解析 Surge模块
// 作者: pp
// 版本: 1.0.0
// 日期: 2025-05-30
// 描述: 本地解析Pornhub视频直链，解决IP验证问题

// 配置常量
const CACHE_EXPIRY = 3600; // 缓存过期时间1小时
const MAX_CACHE_SIZE = 100; // 最大缓存条目数
const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Origin': 'https://cn.pornhub.com',
  'Referer': 'https://cn.pornhub.com/',
  'Connection': 'keep-alive',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'cross-site',
};

// 缓存键前缀
const CACHE_KEYS = {
  VIDEO: "ph_video_",
  INFO: "ph_info_",
  M3U8: "ph_m3u8_",
  TS: "ph_ts_"
};

// 工具函数
function log(message, type = "info") {
  if (type === "error") {
    console.error(`[PornhubAPI] ${message}`);
  } else {
    console.log(`[PornhubAPI] ${message}`);
  }
}

function makeId(url) {
  // 简单的哈希函数，用于生成缓存ID
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(16);
}

// 缓存管理
function cacheSet(type, id, data) {
  try {
    const key = `${type}${id}`;
    const cacheData = {
      data: data,
      timestamp: Date.now()
    };
    $persistentStore.write(JSON.stringify(cacheData), key);
    return true;
  } catch (e) {
    log(`缓存设置失败: ${e.message}`, "error");
    return false;
  }
}

function cacheGet(type, id) {
  try {
    const key = `${type}${id}`;
    const cacheJson = $persistentStore.read(key);
    if (!cacheJson) return null;
    
    const cache = JSON.parse(cacheJson);
    if (Date.now() - cache.timestamp > CACHE_EXPIRY * 1000) {
      // 缓存过期
      return null;
    }
    return cache.data;
  } catch (e) {
    log(`缓存获取失败: ${e.message}`, "error");
    return null;
  }
}

// 清理过期缓存
function cleanupCache() {
  // 在Surge环境中，我们无法枚举所有存储的键
  // 因此这个函数在Surge中实际上不会执行任何操作
  log("缓存清理在Surge环境中不可用");
}

// PornHub解析器
class PornHubParser {
  constructor() {
    this.headers = DEFAULT_HEADERS;
  }

  extractViewkey(url) {
    const match = url.match(/viewkey=([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  }

  async parsePornhub(url) {
    try {
      const viewkey = this.extractViewkey(url);
      if (!viewkey) {
        throw new Error("Invalid PornHub URL: viewkey not found");
      }

      log(`解析视频 viewkey: ${viewkey}`);

      // 获取页面内容
      const response = await this.httpGet(url);
      if (!response.body) {
        throw new Error("Failed to get page content");
      }
      const content = response.body;

      let results = [];

      // 方法1: 查找所有可能的flashvars模式
      const flashvarsPatterns = [
        /var\s+flashvars_\d+\s*=\s*({.+?});/,
        /var\s+flashvars[^=]*=\s*({.+?});/,
        /flashvars_\d+\s*=\s*({.+?});/,
        /flashvars\s*=\s*({.+?});/,
        /var\s+[a-zA-Z_]\w*\s*=\s*({[^}]*mediaDefinitions[^}]*});/,
        /({[^{}]*"mediaDefinitions"[^{}]*(?:{[^{}]*}[^{}]*)*})/
      ];

      for (const pattern of flashvarsPatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          for (const match of matches) {
            try {
              // 清理JavaScript代码
              let flashvarsStr = match.trim();
              
              // 移除注释
              flashvarsStr = flashvarsStr.replace(/\/\/.*?$/gm, '');
              flashvarsStr = flashvarsStr.replace(/\/\*.*?\*\//gs, '');
              
              // 处理JavaScript字符串拼接
              flashvarsStr = flashvarsStr.replace(/"\s*\+\s*"/g, '');
              flashvarsStr = flashvarsStr.replace(/'\s*\+\s*'/g, '');
              
              // 尝试解析JSON
              const flashvars = JSON.parse(flashvarsStr);
              
              // 查找 mediaDefinitions
              const mediaDefinitions = flashvars.mediaDefinitions || [];
              if (mediaDefinitions.length > 0) {
                log(`找到 ${mediaDefinitions.length} 个媒体定义`);
                
                for (const media of mediaDefinitions) {
                  const videoFormat = media.format || '';
                  const videoUrl = media.videoUrl || '';
                  
                  if (videoFormat === 'hls' && videoUrl) {
                    // 处理URL
                    let processedUrl = videoUrl;
                    if (processedUrl.startsWith('//')) {
                      processedUrl = 'https:' + processedUrl;
                    } else if (processedUrl.startsWith('/')) {
                      const urlObj = new URL(url);
                      processedUrl = `${urlObj.protocol}//${urlObj.host}${processedUrl}`;
                    }
                    
                    // 解码URL
                    processedUrl = this.decodeVideoUrl(processedUrl);
                    
                    // 获取质量信息
                    let quality = 'Unknown';
                    const qualityList = media.quality;
                    if (Array.isArray(qualityList) && qualityList.length > 0) {
                      quality = qualityList[0];
                    } else if (typeof qualityList === 'string') {
                      quality = qualityList;
                    }
                    
                    results.push({
                      format: isNaN(quality) ? String(quality) : `${quality}p`,
                      ext: 'm3u8',
                      url: processedUrl,
                      type: 'hls',
                      viewkey: viewkey,
                      referer: url
                    });
                    
                    log(`添加结果: ${quality}p - ${processedUrl.substring(0, 100)}...`);
                  }
                }
              }
              
              // 如果找到结果就跳出
              if (results.length > 0) break;
            } catch (e) {
              log(`解析flashvars失败: ${e.message}`, "error");
              continue;
            }
          }
        }
        
        // 如果找到结果就跳出
        if (results.length > 0) break;
      }

      // 方法2: 查找独立的mediaDefinitions
      if (results.length === 0) {
        log("方法1失败，尝试方法2...");
        const mediaPatterns = [
          /"mediaDefinitions":\s*(\[[^\]]+\])/,
          /'mediaDefinitions':\s*(\[[^\]]+\])/,
          /mediaDefinitions":\s*(\[[^\]]+\])/,
          /mediaDefinitions:\s*(\[[^\]]+\])/
        ];
        
        for (const pattern of mediaPatterns) {
          const matches = content.match(pattern);
          if (matches && matches.length > 1) {
            try {
              const mediaData = JSON.parse(matches[1]);
              
              for (const item of mediaData) {
                if (item.format === 'hls' && item.videoUrl) {
                  let videoUrl = item.videoUrl;
                  if (videoUrl.startsWith('//')) {
                    videoUrl = 'https:' + videoUrl;
                  }
                  
                  videoUrl = this.decodeVideoUrl(videoUrl);
                  
                  let quality = item.quality;
                  if (Array.isArray(quality)) {
                    quality = quality.length > 0 ? quality[0] : 'Unknown';
                  }
                  
                  results.push({
                    format: isNaN(quality) ? String(quality) : `${quality}p`,
                    ext: 'm3u8',
                    url: videoUrl,
                    type: 'hls',
                    viewkey: viewkey,
                    referer: url
                  });
                }
              }
              
              if (results.length > 0) break;
            } catch (e) {
              log(`解析mediaDefinitions失败: ${e.message}`, "error");
              continue;
            }
          }
        }
      }

      // 方法3: 查找video/get_media API调用
      if (results.length === 0) {
        log("方法2失败，尝试方法3...");
        const apiPatterns = [
          /"(\/video\/get_media\?[^"]*)"/,
          /'(\/video\/get_media\?[^']*)'/,
          /(\/video\/get_media\?[^\s&"'<>]+)/
        ];
        
        for (const pattern of apiPatterns) {
          const matches = content.match(pattern);
          if (matches && matches.length > 1) {
            try {
              let apiUrl = matches[1];
              if (!apiUrl.startsWith('http')) {
                const urlObj = new URL(url);
                apiUrl = `${urlObj.protocol}//${urlObj.host}${apiUrl}`;
              }
              
              log(`尝试API URL: ${apiUrl}`);
              const apiResponse = await this.httpGet(apiUrl);
              
              if (apiResponse.status === 200 && apiResponse.body) {
                const apiData = JSON.parse(apiResponse.body);
                
                // 查找HLS链接
                for (const key in apiData) {
                  if (Array.isArray(apiData[key])) {
                    for (const item of apiData[key]) {
                      if (typeof item === 'object' && item.format === 'hls') {
                        const videoUrl = item.videoUrl || '';
                        if (videoUrl) {
                          const decodedUrl = this.decodeVideoUrl(videoUrl);
                          const quality = item.quality || 'Unknown';
                          
                          results.push({
                            format: isNaN(quality) ? String(quality) : `${quality}p`,
                            ext: 'm3u8',
                            url: decodedUrl,
                            type: 'hls',
                            viewkey: viewkey,
                            referer: url
                          });
                        }
                      }
                    }
                  }
                }
                
                if (results.length > 0) break;
              }
            } catch (e) {
              log(`API调用失败: ${e.message}`, "error");
              continue;
            }
          }
        }
      }

      // 方法4: 直接搜索m3u8链接
      if (results.length === 0) {
        log("方法3失败，尝试方法4...");
        const m3u8Patterns = [
          /"(https?:\/\/[^"]*\.m3u8[^"]*)"/,
          /'(https?:\/\/[^']*\.m3u8[^']*)'/,
          /(https?:\/\/[^\s"'<>]*\.m3u8[^\s"'<>]*)/
        ];
        
        const foundUrls = new Set();
        for (const pattern of m3u8Patterns) {
          const matches = content.match(new RegExp(pattern, 'gi'));
          if (matches) {
            for (const match of matches) {
              // 提取URL部分
              const urlMatch = match.match(/(https?:\/\/[^\s"'<>]*\.m3u8[^\s"'<>]*)/);
              if (urlMatch) {
                const videoUrl = decodeURIComponent(urlMatch[1]);
                
                if (!foundUrls.has(videoUrl) && (videoUrl.includes('pornhub') || videoUrl.includes('phncdn'))) {
                  foundUrls.add(videoUrl);
                  
                  const quality = this.extractQualityFromUrl(videoUrl);
                  
                  results.push({
                    format: quality,
                    ext: 'm3u8',
                    url: videoUrl,
                    type: 'hls',
                    viewkey: viewkey,
                    referer: url
                  });
                }
              }
            }
          }
        }
      }

      log(`总共找到 ${results.length} 个结果`);

      // 按质量排序
      if (results.length > 0) {
        results = this.sortByQuality(results);
      }

      return results;
    } catch (e) {
      log(`PornHub解析失败: ${e.message}`, "error");
      log(`错误堆栈: ${e.stack}`, "error");
      return [];
    }
  }

  decodeVideoUrl(url) {
    try {
      // 检查是否是base64编码
      if (url.includes('=') && url.length > 100) {
        try {
          const base64Regex = /^[A-Za-z0-9+/=]+$/;
          // 提取可能的base64部分
          const base64Match = url.match(/([A-Za-z0-9+/=]{40,})/);
          if (base64Match && base64Regex.test(base64Match[1])) {
            const decoded = atob(base64Match[1]);
            if (decoded.startsWith('http')) {
              return decoded;
            }
          }
        } catch (e) {
          // 忽略base64解码错误
        }
      }
      
      // URL解码
      return decodeURIComponent(url);
    } catch (e) {
      return url;
    }
  }

  extractQualityFromUrl(url) {
    const qualityPatterns = [
      /(\d{3,4})p/,
      /(\d{3,4})P/,
      /_(\d{3,4})_/,
      /\/(\d{3,4})\//,
      /quality=(\d{3,4})/,
      /res=(\d{3,4})/
    ];
    
    for (const pattern of qualityPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `${match[1]}p`;
      }
    }
    
    return "Unknown";
  }

  sortByQuality(results) {
    return results.sort((a, b) => {
      const qualityA = parseInt((a.format || '0p').replace(/[^0-9]/g, '')) || 0;
      const qualityB = parseInt((b.format || '0p').replace(/[^0-9]/g, '')) || 0;
      return qualityB - qualityA; // 降序排列，最高质量在前
    });
  }

  async httpGet(url) {
    return new Promise((resolve, reject) => {
      $httpClient.get({
        url: url,
        headers: this.headers
      }, (error, response, body) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            status: response.status,
            headers: response.headers,
            body: body
          });
        }
      });
    });
  }
}

// 获取并修复m3u8内容
async function getM3u8Content(url, referer = null) {
  try {
    // 准备请求头
    const headers = {...DEFAULT_HEADERS};
    if (referer) {
      headers['Referer'] = referer;
    }
    
    return new Promise((resolve, reject) => {
      $httpClient.get({
        url: url,
        headers: headers
      }, (error, response, body) => {
        if (error) {
          log(`获取m3u8内容失败: ${error}`, "error");
          reject(error);
          return;
        }
        
        if (response.status !== 200) {
          log(`获取m3u8内容失败，状态码: ${response.status}`, "error");
          reject(new Error(`HTTP status ${response.status}`));
          return;
        }
        
        // 检查是否是有效的m3u8内容
        if (!body.trim().startsWith('#EXTM3U')) {
          log(`无效的m3u8内容: ${body.substring(0, 100)}...`, "error");
          reject(new Error("Invalid m3u8 content"));
          return;
        }
        
        log(`成功获取m3u8内容，来自 ${url}`);
        resolve(body);
      });
    });
  } catch (e) {
    log(`获取m3u8内容错误: ${e.message}`, "error");
    throw e;
  }
}

// 获取ts文件内容
async function getTsContent(url, referer = null) {
  try {
    // 准备请求头
    const headers = {...DEFAULT_HEADERS};
    if (referer) {
      headers['Referer'] = referer;
    }
    
    return new Promise((resolve, reject) => {
      $httpClient.get({
        url: url,
        headers: headers
      }, (error, response, body) => {
        if (error) {
          log(`获取ts内容失败: ${error}`, "error");
          reject(error);
          return;
        }
        
        if (response.status !== 200) {
          log(`获取ts内容失败，状态码: ${response.status}`, "error");
          reject(new Error(`HTTP status ${response.status}`));
          return;
        }
        
        // 检查内容类型
        const contentType = response.headers['Content-Type'] || '';
        if (!contentType.includes('video') && !contentType.includes('octet-stream') && !contentType.includes('mpegurl')) {
          log(`ts文件内容类型异常: ${contentType}`, "error");
        }
        
        log(`成功获取ts内容，来自 ${url}，大小: ${body.length} 字节`);
        resolve(body);
      });
    });
  } catch (e) {
    log(`获取ts内容错误: ${e.message}`, "error");
    throw e;
  }
}

// 修复m3u8内容，将相对路径转换为代理URL
function fixM3u8Content(content, originalUrl, proxyBaseUrl) {
  try {
    // 解析原始URL
    const urlObj = new URL(originalUrl);
    const baseScheme = urlObj.protocol.replace(':', '');
    const baseNetloc = urlObj.hostname;
    const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
    const baseQuery = urlObj.search.replace('?', '');
    
    const lines = content.split('\n');
    const resultLines = [];
    
    for (const line of lines) {
      // 跳过注释和空行
      if (line.startsWith('#') || !line.trim()) {
        resultLines.push(line);
        continue;
      }
      
      // 处理相对路径
      if (!line.startsWith('http')) {
        let absoluteUrl;
        
        // 检查是否包含查询参数
        if (line.includes('?')) {
          // 保留原始查询参数
          const [path, query] = line.split('?', 2);
          // 构建绝对URL
          absoluteUrl = `${baseScheme}://${baseNetloc}${basePath}${path}?${query}`;
        } else {
          // 没有查询参数，但需要保留原始URL的查询参数
          absoluteUrl = `${baseScheme}://${baseNetloc}${basePath}${line}`;
          if (baseQuery) {
            absoluteUrl += `?${baseQuery}`;
          }
        }
        
        // 创建代理URL
        const tsId = makeId(absoluteUrl);
        const proxyUrl = `${proxyBaseUrl}/ts/${tsId}`;
        
        // 缓存原始URL
        cacheSet(CACHE_KEYS.VIDEO, tsId, {
          url: absoluteUrl,
          referer: originalUrl
        });
        
        resultLines.push(proxyUrl);
        log(`修复相对路径: ${line} -> ${proxyUrl}`);
      } else {
        // 已经是绝对路径，也转换为代理URL
        const tsId = makeId(line);
        const proxyUrl = `${proxyBaseUrl}/ts/${tsId}`;
        
        // 缓存原始URL
        cacheSet(CACHE_KEYS.VIDEO, tsId, {
          url: line,
          referer: originalUrl
        });
        
        resultLines.push(proxyUrl);
        log(`代理绝对路径: ${line} -> ${proxyUrl}`);
      }
    }
    
    return resultLines.join('\n');
  } catch (e) {
    log(`修复m3u8内容失败: ${e.message}`, "error");
    return content; // 出错时返回原始内容
  }
}

// 初始化解析器
const parser = new PornHubParser();

// 主函数：处理所有请求
async function handleRequest(request) {
  const url = request.url;
  const method = request.method;
  
  log(`收到请求: ${method} ${url}`);
  
  // 解析URL路径
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  
  // 获取代理基础URL
  const proxyBaseUrl = "http://pornhubapi.local";
  
  // 路由处理
  try {
    // 获取M3U8链接接口
    if ((path === '/get_mp4_links' || path === '/get_m3u8_links') && method === 'POST') {
      const requestBody = JSON.parse(request.body);
      const videoUrl = requestBody.url;
      
      if (!videoUrl) {
        return {
          response: {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing URL parameter' })
          }
        };
      }
      
      // 验证是否为PornHub URL
      if (!videoUrl.toLowerCase().includes('pornhub.com')) {
        return {
          response: {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Only PornHub URLs are supported' })
          }
        };
      }
      
      // 检查缓存
      const cacheKey = makeId(videoUrl);
      const cachedResult = cacheGet(CACHE_KEYS.INFO, cacheKey);
      if (cachedResult) {
        log(`使用缓存结果，URL: ${videoUrl}`);
        return {
          response: {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ result: cachedResult })
          }
        };
      }
      
      // 解析视频链接
      log(`解析URL: ${videoUrl}`);
      const results = await parser.parsePornhub(videoUrl);
      
      if (results.length === 0) {
        return {
          response: {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'No M3U8 links found' })
          }
        };
      }
      
      // 为每个链接创建代理URL并预加载m3u8内容
      const proxyResults = [];
      for (const result of results) {
        const videoUrl = result.url;
        const referer = result.referer || videoUrl;
        const id = makeId(videoUrl);
        
        // 缓存视频URL和referer
        cacheSet(CACHE_KEYS.VIDEO, id, {
          url: videoUrl,
          referer: referer
        });
        
        // 预加载并修复m3u8内容
        try {
          const m3u8Content = await getM3u8Content(videoUrl, referer);
          if (m3u8Content) {
            // 修复m3u8内容，将相对路径转换为代理URL
            const fixedContent = fixM3u8Content(m3u8Content, videoUrl, proxyBaseUrl);
            cacheSet(CACHE_KEYS.M3U8, id, fixedContent);
            log(`预加载并缓存m3u8内容，ID: ${id}`);
          }
        } catch (e) {
          log(`预加载m3u8内容失败: ${e.message}`, "error");
        }
        
        const proxyUrl = `${proxyBaseUrl}/proxy/${id}`;
        
        proxyResults.push({
          format: result.format,
          ext: result.ext,
          url: proxyUrl,
          type: result.type || 'hls',
          viewkey: result.viewkey
        });
      }
      
      // 缓存结果
      cacheSet(CACHE_KEYS.INFO, cacheKey, proxyResults);
      
      return {
        response: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            result: proxyResults,
            count: proxyResults.length,
            viewkey: results[0].viewkey || null
          })
        }
      };
    }
    
    // 获取直接M3U8链接接口
    else if (path === '/get_direct_m3u8' && method === 'POST') {
      const requestBody = JSON.parse(request.body);
      const videoUrl = requestBody.url;
      
      if (!videoUrl) {
        return {
          response: {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Missing URL parameter' })
          }
        };
      }
      
      // 验证是否为PornHub URL
      if (!videoUrl.toLowerCase().includes('pornhub.com')) {
        return {
          response: {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Only PornHub URLs are supported' })
          }
        };
      }
      
      // 解析视频链接
      log(`获取直接M3U8链接，URL: ${videoUrl}`);
      const results = await parser.parsePornhub(videoUrl);
      
      if (results.length === 0) {
        return {
          response: {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'No M3U8 links found' })
          }
        };
      }
      
      // 返回直接链接
      const directResults = results.map(result => ({
        format: result.format,
        ext: result.ext,
        url: result.url,  // 直接返回原始URL
        type: result.type || 'hls',
        viewkey: result.viewkey
      }));
      
      return {
        response: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            result: directResults,
            count: directResults.length,
            viewkey: results[0].viewkey || null
          })
        }
      };
    }
    
    // 代理M3U8内容
    else if (path.startsWith('/proxy/')) {
      const id = path.replace('/proxy/', '');
      
      // 从缓存获取原始URL和referer
      const videoData = cacheGet(CACHE_KEYS.VIDEO, id);
      if (!videoData) {
        return {
          response: {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid or expired proxy ID' })
          }
        };
      }
      
      const originalUrl = videoData.url;
      const referer = videoData.referer;
      
      // 尝试从缓存获取已修复的m3u8内容
      const cachedContent = cacheGet(CACHE_KEYS.M3U8, id);
      if (cachedContent) {
        log(`提供缓存的m3u8内容，ID: ${id}`);
        return {
          response: {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.apple.mpegurl',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'max-age=300'  // 5分钟缓存
            },
            body: cachedContent
          }
        };
      }
      
      try {
        // 获取m3u8内容
        const m3u8Content = await getM3u8Content(originalUrl, referer);
        
        if (!m3u8Content) {
          log(`获取m3u8内容失败，ID: ${id}，回退到重定向`, "error");
          return {
            response: {
              status: 302,
              headers: { 'Location': originalUrl }
            }
          };
        }
        
        // 修复m3u8内容，将相对路径转换为代理URL
        const fixedContent = fixM3u8Content(m3u8Content, originalUrl, proxyBaseUrl);
        
        // 缓存修复后的内容
        cacheSet(CACHE_KEYS.M3U8, id, fixedContent);
        
        // 返回修复后的m3u8内容
        return {
          response: {
            status: 200,
            headers: {
              'Content-Type': 'application/vnd.apple.mpegurl',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'max-age=300'  // 5分钟缓存
            },
            body: fixedContent
          }
        };
      } catch (e) {
        log(`代理m3u8内容错误: ${e.message}`, "error");
        // 出错时回退到重定向
        return {
          response: {
            status: 302,
            headers: { 'Location': originalUrl }
          }
        };
      }
    }
    
    // 代理TS文件
    else if (path.startsWith('/ts/')) {
      const id = path.replace('/ts/', '');
      
      // 从缓存获取原始URL和referer
      const videoData = cacheGet(CACHE_KEYS.VIDEO, id);
      if (!videoData) {
        return {
          response: {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Invalid or expired proxy ID' })
          }
        };
      }
      
      const originalUrl = videoData.url;
      const referer = videoData.referer;
      
      // 尝试从缓存获取ts内容
      const cachedContent = cacheGet(CACHE_KEYS.TS, id);
      if (cachedContent) {
        log(`提供缓存的ts内容，ID: ${id}`);
        return {
          response: {
            status: 200,
            headers: {
              'Content-Type': 'video/mp2t',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'max-age=3600'  // 1小时缓存
            },
            body: cachedContent
          }
        };
      }
      
      try {
        // 获取ts内容
        const tsContent = await getTsContent(originalUrl, referer);
        
        if (!tsContent) {
          log(`获取ts内容失败，ID: ${id}，回退到重定向`, "error");
          return {
            response: {
              status: 302,
              headers: { 'Location': originalUrl }
            }
          };
        }
        
        // 缓存ts内容
        cacheSet(CACHE_KEYS.TS, id, tsContent);
        
        // 返回ts内容
        return {
          response: {
            status: 200,
            headers: {
              'Content-Type': 'video/mp2t',
              'Access-Control-Allow-Origin': '*',
              'Cache-Control': 'max-age=3600'  // 1小时缓存
            },
            body: tsContent
          }
        };
      } catch (e) {
        log(`代理ts内容错误: ${e.message}`, "error");
        // 出错时回退到重定向
        return {
          response: {
            status: 302,
            headers: { 'Location': originalUrl }
          }
        };
      }
    }
    
    // 健康检查接口
    else if (path === '/health') {
      return {
        response: {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'ok',
            timestamp: Date.now(),
            version: '1.0.0'
          })
        }
      };
    }
    
    // 未知路径
    else {
      return {
        response: {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Not Found' })
        }
      };
    }
  } catch (e) {
    log(`请求处理错误: ${e.message}`, "error");
    log(`错误堆栈: ${e.stack}`, "error");
    
    return {
      response: {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Internal Server Error: ${e.message}` })
      }
    };
  }
}

// 导出主函数
exports.main = handleRequest;
