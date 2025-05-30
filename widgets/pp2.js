from flask import Flask, request, jsonify, redirect, abort, Response
import requests
import re
import json
import hashlib
import time
import threading
from urllib.parse import urljoin, urlparse, unquote, urlencode, parse_qs
import base64
import logging
import os

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('pornhub_api')

app = Flask(__name__)

# 缓存配置
video_cache = {}
info_cache = {}
m3u8_content_cache = {}  # m3u8内容缓存
ts_cache = {}  # ts文件缓存
CACHE_EXPIRY = 3600  # 缓存过期时间1小时
MAX_CACHE_SIZE = 1000
lock = threading.Lock()

# 请求头配置
DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Origin': 'https://www.pornhub.com',
    'Referer': 'https://www.pornhub.com/',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
}


class PornHubParser:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(DEFAULT_HEADERS)

    def extract_viewkey(self, url):
        """从URL中提取viewkey"""
        match = re.search(r'viewkey=([a-zA-Z0-9]+)', url)
        return match.group(1) if match else None

    def parse_pornhub(self, url):
        """PornHub 解析器 - 模仿youtube-dl的方法"""
        try:
            viewkey = self.extract_viewkey(url)
            if not viewkey:
                raise ValueError("Invalid PornHub URL: viewkey not found")

            logger.info(f"Parsing viewkey: {viewkey}")

            # 获取页面内容
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            content = response.text

            results = []

            # 方法1: 查找所有可能的flashvars模式 (模仿youtube-dl)
            flashvars_patterns = [
                # 标准flashvars模式
                r'var\s+flashvars_\d+\s*=\s*({.+?});',
                r'var\s+flashvars[^=]*=\s*({.+?});',
                r'flashvars_\d+\s*=\s*({.+?});',
                r'flashvars\s*=\s*({.+?});',
                # 更宽泛的模式
                r'var\s+[a-zA-Z_]\w*\s*=\s*({[^}]*mediaDefinitions[^}]*});',
                # 直接查找包含mediaDefinitions的对象
                r'({[^{}]*"mediaDefinitions"[^{}]*(?:{[^{}]*}[^{}]*)*})',
            ]

            for i, pattern in enumerate(flashvars_patterns):
                logger.debug(f"Trying pattern {i + 1}: {pattern[:50]}...")
                matches = re.findall(pattern, content, re.DOTALL | re.IGNORECASE)

                for match in matches:
                    try:
                        logger.debug(f"Found potential flashvars: {match[:200]}...")

                        # 清理JavaScript代码
                        flashvars_str = match.strip()

                        # 移除注释
                        flashvars_str = re.sub(r'//.*?$', '', flashvars_str, flags=re.MULTILINE)
                        flashvars_str = re.sub(r'/\*.*?\*/', '', flashvars_str, flags=re.DOTALL)

                        # 处理JavaScript字符串拼接
                        flashvars_str = re.sub(r'"\s*\+\s*"', '', flashvars_str)
                        flashvars_str = re.sub(r"'\s*\+\s*'", '', flashvars_str)

                        # 尝试解析JSON
                        flashvars = json.loads(flashvars_str)
                        logger.debug(f"Successfully parsed flashvars: {list(flashvars.keys())}")

                        # 查找 mediaDefinitions
                        media_definitions = flashvars.get('mediaDefinitions', [])
                        if media_definitions:
                            logger.info(f"Found {len(media_definitions)} media definitions")

                            for media in media_definitions:
                                video_format = media.get('format', '')
                                video_url = media.get('videoUrl', '')

                                logger.debug(
                                    f"Media format: {video_format}, URL: {video_url[:100] if video_url else 'None'}...")

                                if video_format == 'hls' and video_url:
                                    # 处理URL
                                    if video_url.startswith('//'):
                                        video_url = 'https:' + video_url
                                    elif video_url.startswith('/'):
                                        video_url = urljoin(url, video_url)

                                    # 解码URL (可能是base64编码)
                                    video_url = self._decode_video_url(video_url)

                                    # 获取质量信息
                                    quality_list = media.get('quality', [])
                                    if isinstance(quality_list, list) and quality_list:
                                        quality = quality_list[0]
                                    elif isinstance(quality_list, str):
                                        quality = quality_list
                                    else:
                                        quality = 'Unknown'

                                    results.append({
                                        'format': f"{quality}p" if str(quality).isdigit() else str(quality),
                                        'ext': 'm3u8',
                                        'url': video_url,
                                        'type': 'hls',
                                        'viewkey': viewkey,
                                        'referer': url  # 保存原始页面URL作为referer
                                    })
                                    logger.info(f"Added result: {quality}p - {video_url[:100]}...")

                        # 如果找到结果就跳出
                        if results:
                            break

                    except (json.JSONDecodeError, KeyError, ValueError) as e:
                        logger.warning(f"Failed to parse flashvars attempt: {e}")
                        continue

                # 如果找到结果就跳出
                if results:
                    break

            # 方法2: 查找独立的mediaDefinitions (如果方法1失败)
            if not results:
                logger.info("Method 1 failed, trying method 2...")
                media_patterns = [
                    r'"mediaDefinitions":\s*(\[[^\]]+\])',
                    r"'mediaDefinitions':\s*(\[[^\]]+\])",
                    r'mediaDefinitions":\s*(\[[^\]]+\])',
                    r'mediaDefinitions:\s*(\[[^\]]+\])',
                ]

                for pattern in media_patterns:
                    matches = re.findall(pattern, content, re.DOTALL)
                    for match in matches:
                        try:
                            logger.debug(f"Found mediaDefinitions: {match[:200]}...")
                            media_data = json.loads(match)

                            for item in media_data:
                                if item.get('format') == 'hls' and item.get('videoUrl'):
                                    video_url = item['videoUrl']
                                    if video_url.startswith('//'):
                                        video_url = 'https:' + video_url

                                    video_url = self._decode_video_url(video_url)

                                    quality = item.get('quality', ['Unknown'])
                                    if isinstance(quality, list):
                                        quality = quality[0] if quality else 'Unknown'

                                    results.append({
                                        'format': f"{quality}p" if str(quality).isdigit() else str(quality),
                                        'ext': 'm3u8',
                                        'url': video_url,
                                        'type': 'hls',
                                        'viewkey': viewkey,
                                        'referer': url
                                    })
                            break
                        except (json.JSONDecodeError, KeyError) as e:
                            logger.warning(f"Failed to parse mediaDefinitions: {e}")
                            continue

                    if results:
                        break

            # 方法3: 查找video/get_media API调用
            if not results:
                logger.info("Method 2 failed, trying method 3...")
                api_patterns = [
                    r'"(/video/get_media\?[^"]*)"',
                    r"'(/video/get_media\?[^']*)'",
                    r'(/video/get_media\?[^\s&"\'<>]+)',
                ]

                for pattern in api_patterns:
                    matches = re.findall(pattern, content)
                    for api_url in matches:
                        try:
                            if not api_url.startswith('http'):
                                api_url = urljoin(url, api_url)

                            logger.info(f"Trying API URL: {api_url}")
                            api_response = self.session.get(api_url, timeout=10)

                            if api_response.status_code == 200:
                                api_data = api_response.json()

                                # 查找HLS链接
                                for key, value in api_data.items():
                                    if isinstance(value, list):
                                        for item in value:
                                            if isinstance(item, dict) and item.get('format') == 'hls':
                                                video_url = item.get('videoUrl', '')
                                                if video_url:
                                                    video_url = self._decode_video_url(video_url)
                                                    quality = item.get('quality', 'Unknown')

                                                    results.append({
                                                        'format': f"{quality}p" if str(quality).isdigit() else str(
                                                            quality),
                                                        'ext': 'm3u8',
                                                        'url': video_url,
                                                        'type': 'hls',
                                                        'viewkey': viewkey,
                                                        'referer': url
                                                    })
                                break
                        except Exception as e:
                            logger.warning(f"API call failed: {e}")
                            continue

                    if results:
                        break

            # 方法4: 直接搜索m3u8链接 (最后的尝试)
            if not results:
                logger.info("Method 3 failed, trying method 4...")
                m3u8_patterns = [
                    r'"(https?://[^"]*\.m3u8[^"]*)"',
                    r"'(https?://[^']*\.m3u8[^']*)'",
                    r'(https?://[^\s"\'<>]*\.m3u8[^\s"\'<>]*)',
                ]

                found_urls = set()
                for pattern in m3u8_patterns:
                    matches = re.findall(pattern, content, re.IGNORECASE)
                    for match in matches:
                        video_url = unquote(match)

                        if video_url not in found_urls and ('pornhub' in video_url or 'phncdn' in video_url):
                            found_urls.add(video_url)

                            quality = self._extract_quality_from_url(video_url)

                            results.append({
                                'format': quality,
                                'ext': 'm3u8',
                                'url': video_url,
                                'type': 'hls',
                                'viewkey': viewkey,
                                'referer': url
                            })

            logger.info(f"Total results found: {len(results)}")

            # 按质量排序
            if results:
                results = self._sort_by_quality(results)

            return results

        except Exception as e:
            logger.error(f"PornHub parser failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return []

    def _decode_video_url(self, url):
        """解码视频URL (处理可能的编码)"""
        try:
            # 检查是否是base64编码
            if '=' in url and len(url) > 100:
                try:
                    decoded = base64.b64decode(url).decode('utf-8')
                    if decoded.startswith('http'):
                        return decoded
                except:
                    pass

            # URL解码
            return unquote(url)
        except:
            return url

    def _extract_quality_from_url(self, url):
        """从URL中提取质量信息"""
        quality_patterns = [
            r'(\d{3,4})p',
            r'(\d{3,4})P',
            r'_(\d{3,4})_',
            r'/(\d{3,4})/',
            r'quality=(\d{3,4})',
            r'res=(\d{3,4})'
        ]

        for pattern in quality_patterns:
            match = re.search(pattern, url)
            if match:
                return f"{match.group(1)}p"

        return "Unknown"

    def _sort_by_quality(self, results):
        """按质量排序结果"""

        def quality_key(item):
            format_str = item.get('format', '0p')
            if 'p' in format_str:
                try:
                    return int(re.search(r'(\d+)', format_str).group(1))
                except:
                    return 0
            return 0

        return sorted(results, key=quality_key, reverse=True)


# 缓存管理函数
def make_id(url):
    return hashlib.sha256(url.encode()).hexdigest()


def cache_set(id, video_url, referer=None):
    """缓存视频URL和referer"""
    with lock:
        if len(video_cache) >= MAX_CACHE_SIZE:
            oldest = min(video_cache.items(), key=lambda x: x[1]['timestamp'])[0]
            del video_cache[oldest]
        video_cache[id] = {
            "url": video_url,
            "referer": referer,
            "timestamp": time.time()
        }


def cache_get(id):
    """获取缓存的视频URL和referer"""
    with lock:
        entry = video_cache.get(id)
        if not entry:
            return None, None
        if time.time() - entry["timestamp"] > CACHE_EXPIRY:
            del video_cache[id]
            return None, None
        return entry["url"], entry.get("referer")


def info_cache_set(key, data):
    """缓存API响应信息"""
    with lock:
        if len(info_cache) >= MAX_CACHE_SIZE:
            oldest = min(info_cache.items(), key=lambda x: x[1]['timestamp'])[0]
            del info_cache[oldest]
        info_cache[key] = {
            "data": data,
            "timestamp": time.time()
        }


def info_cache_get(key):
    """获取缓存的API响应信息"""
    with lock:
        entry = info_cache.get(key)
        if not entry:
            return None
        if time.time() - entry["timestamp"] > CACHE_EXPIRY:
            del info_cache[key]
            return None
        return entry["data"]


def m3u8_cache_set(id, content):
    """缓存m3u8内容"""
    with lock:
        if len(m3u8_content_cache) >= MAX_CACHE_SIZE:
            oldest = min(m3u8_content_cache.items(), key=lambda x: x[1]['timestamp'])[0]
            del m3u8_content_cache[oldest]
        m3u8_content_cache[id] = {
            "content": content,
            "timestamp": time.time()
        }


def m3u8_cache_get(id):
    """获取缓存的m3u8内容"""
    with lock:
        entry = m3u8_content_cache.get(id)
        if not entry:
            return None
        if time.time() - entry["timestamp"] > CACHE_EXPIRY:
            del m3u8_content_cache[id]
            return None
        return entry["content"]


def ts_cache_set(id, content):
    """缓存ts文件内容"""
    with lock:
        if len(ts_cache) >= MAX_CACHE_SIZE * 10:  # ts文件可能很多，允许更大的缓存
            # 删除最旧的10%缓存
            sorted_items = sorted(ts_cache.items(), key=lambda x: x[1]['timestamp'])
            for i in range(int(len(sorted_items) * 0.1)):
                del ts_cache[sorted_items[i][0]]
        
        ts_cache[id] = {
            "content": content,
            "timestamp": time.time()
        }


def ts_cache_get(id):
    """获取缓存的ts文件内容"""
    with lock:
        entry = ts_cache.get(id)
        if not entry:
            return None
        if time.time() - entry["timestamp"] > CACHE_EXPIRY:
            del ts_cache[id]
            return None
        return entry["content"]


def cleanup_caches():
    """清理所有缓存"""
    with lock:
        now = time.time()
        # 清理视频URL缓存
        expired_keys = [k for k, v in video_cache.items() if now - v["timestamp"] > CACHE_EXPIRY]
        for k in expired_keys:
            del video_cache[k]
        
        # 清理信息缓存
        expired_keys = [k for k, v in info_cache.items() if now - v["timestamp"] > CACHE_EXPIRY]
        for k in expired_keys:
            del info_cache[k]
        
        # 清理m3u8内容缓存
        expired_keys = [k for k, v in m3u8_content_cache.items() if now - v["timestamp"] > CACHE_EXPIRY]
        for k in expired_keys:
            del m3u8_content_cache[k]
        
        # 清理ts文件缓存
        expired_keys = [k for k, v in ts_cache.items() if now - v["timestamp"] > CACHE_EXPIRY]
        for k in expired_keys:
            del ts_cache[k]
        
        logger.info(f"Cleaned up caches. Current sizes - video: {len(video_cache)}, info: {len(info_cache)}, m3u8: {len(m3u8_content_cache)}, ts: {len(ts_cache)}")


def periodic_cleanup(interval=600):
    """定期清理缓存的后台线程"""
    while True:
        time.sleep(interval)
        cleanup_caches()


def fix_m3u8_content(content, base_url, proxy_base_url):
    """修复m3u8内容，将相对路径转换为代理URL"""
    if not content or not base_url:
        return content
    
    # 解析基础URL
    parsed_base = urlparse(base_url)
    base_scheme = parsed_base.scheme
    base_netloc = parsed_base.netloc
    
    # 获取基础URL的路径部分（不包括最后的文件名）
    base_path = '/'.join(parsed_base.path.split('/')[:-1]) + '/'
    
    # 获取查询参数
    base_query = parsed_base.query
    
    # 按行处理m3u8内容
    lines = content.split('\n')
    result_lines = []
    
    for line in lines:
        # 跳过注释和空行
        if line.startswith('#') or not line.strip():
            result_lines.append(line)
            continue
        
        # 处理相对路径
        if not line.startswith('http'):
            # 检查是否包含查询参数
            if '?' in line:
                # 保留原始查询参数
                path, query = line.split('?', 1)
                # 构建绝对URL
                absolute_url = f"{base_scheme}://{base_netloc}{base_path}{path}?{query}"
            else:
                # 没有查询参数，但需要保留原始URL的查询参数
                absolute_url = f"{base_scheme}://{base_netloc}{base_path}{line}"
                if base_query:
                    absolute_url += f"?{base_query}"
            
            # 创建代理URL
            ts_id = make_id(absolute_url)
            proxy_url = f"{proxy_base_url}/ts/{ts_id}"
            
            # 缓存原始URL
            cache_set(ts_id, absolute_url)
            
            result_lines.append(proxy_url)
            logger.debug(f"Fixed relative path: {line} -> {proxy_url}")
        else:
            # 已经是绝对路径，也转换为代理URL
            ts_id = make_id(line)
            proxy_url = f"{proxy_base_url}/ts/{ts_id}"
            
            # 缓存原始URL
            cache_set(ts_id, line)
            
            result_lines.append(proxy_url)
            logger.debug(f"Proxied absolute path: {line} -> {proxy_url}")
    
    return '\n'.join(result_lines)


def get_m3u8_content(url, referer=None):
    """获取并修复m3u8内容"""
    try:
        # 准备请求头
        headers = DEFAULT_HEADERS.copy()
        if referer:
            headers['Referer'] = referer
        
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            logger.warning(f"Failed to get m3u8 content, status code: {response.status_code}")
            return None
        
        content = response.text
        
        # 检查是否是有效的m3u8内容
        if not content.strip().startswith('#EXTM3U'):
            logger.warning(f"Invalid m3u8 content: {content[:100]}...")
            return None
        
        logger.info(f"Successfully got m3u8 content from {url}")
        
        return content
    except Exception as e:
        logger.error(f"Error getting m3u8 content: {e}")
        return None


def get_ts_content(url, referer=None):
    """获取ts文件内容"""
    try:
        # 准备请求头
        headers = DEFAULT_HEADERS.copy()
        if referer:
            headers['Referer'] = referer
        
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            logger.warning(f"Failed to get ts content, status code: {response.status_code}")
            return None
        
        # 检查内容类型
        content_type = response.headers.get('Content-Type', '')
        if not ('video' in content_type or 'octet-stream' in content_type or 'mpegurl' in content_type):
            logger.warning(f"Unexpected content type for ts file: {content_type}")
        
        logger.info(f"Successfully got ts content from {url}, size: {len(response.content)} bytes")
        
        return response.content
    except Exception as e:
        logger.error(f"Error getting ts content: {e}")
        return None


# 启动后台清理线程
threading.Thread(target=periodic_cleanup, daemon=True).start()

# 初始化解析器
parser = PornHubParser()


@app.route('/get_m3u8_links', methods=['POST'])
def get_m3u8_links():
    """获取M3U8链接(通过代理) - 兼容原接口名称"""
    return get_mp4_links()


@app.route('/get_mp4_links', methods=['POST'])
def get_mp4_links():
    """获取M3U8链接(通过代理) - 保持原接口名称兼容性"""
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'error': 'Missing URL parameter'}), 400

    # 验证是否为PornHub URL
    if 'pornhub.com' not in url.lower():
        return jsonify({'error': 'Only PornHub URLs are supported'}), 400

    # 检查缓存
    cached_result = info_cache_get(url)
    if cached_result:
        logger.info(f"Using cached result for {url}")
        return jsonify({'result': cached_result})

    try:
        logger.info(f"Parsing URL: {url}")

        # 解析视频链接
        results = parser.parse_pornhub(url)

        if not results:
            return jsonify({'error': 'No M3U8 links found'}), 404

        # 获取代理基础URL
        proxy_base_url = "https://pornhubapi.8660105.xyz"
        
        # 为每个链接创建代理URL并预加载m3u8内容
        proxy_results = []
        for result in results:
            video_url = result['url']
            referer = result.get('referer', url)
            id = make_id(video_url)
            
            # 缓存视频URL和referer
            cache_set(id, video_url, referer)

            # 预加载并修复m3u8内容
            try:
                m3u8_content = get_m3u8_content(video_url, referer)
                if m3u8_content:
                    # 修复m3u8内容，将相对路径转换为代理URL
                    fixed_content = fix_m3u8_content(m3u8_content, video_url, proxy_base_url)
                    m3u8_cache_set(id, fixed_content)
                    logger.info(f"Preloaded and cached m3u8 content for {id}")
            except Exception as e:
                logger.warning(f"Failed to preload m3u8 content: {e}")

            proxy_url = f"{proxy_base_url}/proxy/{id}"

            proxy_results.append({
                'format': result['format'],
                'ext': result['ext'],
                'url': proxy_url,
                'type': result.get('type', 'hls'),
                'viewkey': result.get('viewkey')
            })

        # 缓存结果
        info_cache_set(url, proxy_results)

        return jsonify({
            'result': proxy_results,
            'count': len(proxy_results),
            'viewkey': results[0].get('viewkey') if results else None
        })

    except Exception as e:
        logger.error(f"Error in get_mp4_links: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Parsing failed: {str(e)}'}), 500


@app.route('/get_direct_m3u8', methods=['POST'])
def get_direct_m3u8():
    """获取直接M3U8链接(不通过代理)"""
    data = request.json
    url = data.get('url')
    if not url:
        return jsonify({'error': 'Missing URL parameter'}), 400

    # 验证是否为PornHub URL
    if 'pornhub.com' not in url.lower():
        return jsonify({'error': 'Only PornHub URLs are supported'}), 400

    try:
        logger.info(f"Getting direct M3U8 for: {url}")

        # 解析视频链接
        results = parser.parse_pornhub(url)

        if not results:
            return jsonify({'error': 'No M3U8 links found'}), 404

        # 返回直接链接
        direct_results = []
        for result in results:
            direct_results.append({
                'format': result['format'],
                'ext': result['ext'],
                'url': result['url'],  # 直接返回原始URL
                'type': result.get('type', 'hls'),
                'viewkey': result.get('viewkey')
            })

        return jsonify({
            'result': direct_results,
            'count': len(direct_results),
            'viewkey': results[0].get('viewkey') if results else None
        })

    except Exception as e:
        logger.error(f"Error in get_direct_m3u8: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({'error': f'Parsing failed: {str(e)}'}), 500


@app.route('/proxy/<id>', methods=['GET'])
def proxy_m3u8(id):
    """代理M3U8内容，修复相对路径问题"""
    # 从缓存获取原始URL和referer
    original_url, referer = cache_get(id)
    if not original_url:
        return jsonify({'error': 'Invalid or expired proxy ID'}), 404

    # 尝试从缓存获取已修复的m3u8内容
    cached_content = m3u8_cache_get(id)
    if cached_content:
        logger.info(f"Serving cached m3u8 content for {id}")
        return Response(
            cached_content,
            mimetype='application/vnd.apple.mpegurl',
            headers={
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'max-age=300'  # 5分钟缓存
            }
        )

    try:
        # 获取m3u8内容
        m3u8_content = get_m3u8_content(original_url, referer)
        
        if not m3u8_content:
            logger.warning(f"Failed to get m3u8 content for {id}, falling back to redirect")
            return redirect(original_url)
        
        # 获取代理基础URL
        proxy_base_url = "https://pornhubapi.8660105.xyz"
        
        # 修复m3u8内容，将相对路径转换为代理URL
        fixed_content = fix_m3u8_content(m3u8_content, original_url, proxy_base_url)
        
        # 缓存修复后的内容
        m3u8_cache_set(id, fixed_content)
        
        # 返回修复后的m3u8内容
        return Response(
            fixed_content,
            mimetype='application/vnd.apple.mpegurl',
            headers={
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'max-age=300'  # 5分钟缓存
            }
        )
    
    except Exception as e:
        logger.error(f"Error in proxy_m3u8: {e}")
        # 出错时回退到重定向
        return redirect(original_url)


@app.route('/ts/<id>', methods=['GET'])
def proxy_ts(id):
    """代理TS文件，添加必要的请求头"""
    # 从缓存获取原始URL和referer
    original_url, referer = cache_get(id)
    if not original_url:
        return jsonify({'error': 'Invalid or expired proxy ID'}), 404

    # 尝试从缓存获取ts内容
    cached_content = ts_cache_get(id)
    if cached_content:
        logger.info(f"Serving cached ts content for {id}")
        return Response(
            cached_content,
            mimetype='video/mp2t',
            headers={
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'max-age=3600'  # 1小时缓存
            }
        )

    try:
        # 获取ts内容
        ts_content = get_ts_content(original_url, referer)
        
        if not ts_content:
            logger.warning(f"Failed to get ts content for {id}, falling back to redirect")
            return redirect(original_url)
        
        # 缓存ts内容
        ts_cache_set(id, ts_content)
        
        # 返回ts内容
        return Response(
            ts_content,
            mimetype='video/mp2t',
            headers={
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'max-age=3600'  # 1小时缓存
            }
        )
    
    except Exception as e:
        logger.error(f"Error in proxy_ts: {e}")
        # 出错时回退到重定向
        return redirect(original_url)


@app.route('/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({
        'status': 'ok',
        'timestamp': time.time(),
        'cache_stats': {
            'video_cache': len(video_cache),
            'info_cache': len(info_cache),
            'm3u8_content_cache': len(m3u8_content_cache),
            'ts_cache': len(ts_cache)
        }
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=16813, debug=True)  # 开启debug查看详细日志

