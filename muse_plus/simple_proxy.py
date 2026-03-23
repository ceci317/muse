#!/usr/bin/env python3
"""
简单的 CORS 代理服务器 - 使用 requests 库
"""

try:
    import requests
except ImportError:
    print("❌ 需要安装 requests 库")
    print("   运行: pip3 install requests")
    exit(1)

import http.server
import socketserver
import json
import sys
from datetime import datetime
from urllib.parse import urlparse, parse_qs, unquote

PORT = 3001

class SimpleProxyHandler(http.server.BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        """处理预检请求"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        """代理外部音频文件，避免浏览器直接加载跨域媒体失败"""
        parsed_path = urlparse(self.path)
        if parsed_path.path != '/proxy/audio':
            self.send_error(404, "Not Found")
            return

        query = parse_qs(parsed_path.query)
        raw_url = query.get('url', [None])[0]
        if not raw_url:
            self.send_error(400, "Missing url parameter")
            return

        target_url = unquote(raw_url)
        parsed_target = urlparse(target_url)
        allowed_hosts = (
            'dashscope-result-',
            'oss-cn-',
            'aliyuncs.com',
        )

        if parsed_target.scheme not in ('http', 'https') or not any(token in parsed_target.netloc for token in allowed_hosts):
            self.send_error(400, "Unsupported audio url")
            return

        print(f"[{datetime.now().strftime('%H:%M:%S')}] Proxying audio: GET {target_url}")

        try:
            response = requests.get(
                target_url,
                verify=False,
                timeout=30,
                stream=True
            )

            self.send_response(response.status_code)
            self.send_cors_headers()

            content_type = response.headers.get('Content-Type', 'audio/wav')
            self.send_header('Content-Type', content_type)
            content_length = response.headers.get('Content-Length')
            if content_length:
                self.send_header('Content-Length', content_length)
            self.end_headers()

            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    self.wfile.write(chunk)
                    self.wfile.flush()

            print(f"[{datetime.now().strftime('%H:%M:%S')}] Audio response: {response.status_code}")

        except requests.exceptions.RequestException as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Audio proxy error: {str(e)}")
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{"error": "Audio proxy failed: {str(e)}"}}'.encode())
    
    def do_POST(self):
        """处理 POST 请求"""
        if not self.path.startswith('/api/dashscope/'):
            self.send_error(404, "Not Found")
            return
        
        # 提取目标路径
        target_path = self.path.replace('/api/dashscope', '')
        target_url = f'https://dashscope.aliyuncs.com{target_path}'
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Proxying: POST {target_url}")
        
        try:
            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b''
            
            # 准备请求头
            headers = {}
            is_streaming = False
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'origin', 'referer', 'content-length']:
                    headers[header] = value
                    if header.lower() == 'x-dashscope-sse' and value == 'enable':
                        is_streaming = True
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Streaming mode: {is_streaming}")
            
            # 使用 requests 发送请求，禁用 SSL 验证
            response = requests.post(
                target_url,
                data=post_data,
                headers=headers,
                verify=False,  # 禁用 SSL 验证
                timeout=30,
                stream=is_streaming  # 启用流式响应
            )
            
            # 发送响应头
            self.send_response(response.status_code)
            self.send_cors_headers()
            
            # 复制响应头
            for header, value in response.headers.items():
                if header.lower() not in ['access-control-allow-origin', 'content-encoding', 'transfer-encoding']:
                    self.send_header(header, value)
            
            self.end_headers()
            
            # 处理响应体
            if is_streaming:
                # 流式响应：逐块转发
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Starting streaming response...")
                chunk_count = 0
                try:
                    for chunk in response.iter_content(chunk_size=1024):
                        if chunk:
                            chunk_count += 1
                            print(f"[{datetime.now().strftime('%H:%M:%S')}] Forwarding chunk {chunk_count}, size: {len(chunk)} bytes")
                            # 打印前100个字符用于调试
                            chunk_preview = chunk.decode('utf-8', errors='ignore')[:100]
                            print(f"[{datetime.now().strftime('%H:%M:%S')}] Chunk preview: {chunk_preview}")
                            
                            self.wfile.write(chunk)
                            self.wfile.flush()  # 立即发送
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Streaming response completed, total chunks: {chunk_count}")
                except Exception as stream_error:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Streaming error: {str(stream_error)}")
            else:
                # 非流式响应：一次性发送
                self.wfile.write(response.content)
            
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Response: {response.status_code}")
        
        except requests.exceptions.RequestException as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Request Error: {str(e)}")
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{"error": "Request failed: {str(e)}"}}'.encode())
        
        except Exception as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Error: {str(e)}")
            self.send_response(500)
            self.send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(f'{{"error": "Proxy error: {str(e)}"}}'.encode())
    
    def send_cors_headers(self):
        """发送 CORS 头部"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-DashScope-SSE')
        self.send_header('Access-Control-Max-Age', '86400')
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        pass  # 禁用默认日志，使用自定义日志

def main():
    # 禁用 SSL 警告
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    try:
        with socketserver.TCPServer(("", PORT), SimpleProxyHandler) as httpd:
            print(f"🚀 Simple CORS Proxy Server running on http://localhost:{PORT}")
            print(f"📡 Proxying DashScope API requests using requests library")
            print(f"🔗 Use: http://localhost:{PORT}/api/dashscope/... instead of https://dashscope.aliyuncs.com/...")
            print(f"⚠️  SSL verification disabled for development")
            print(f"⏹️  Press Ctrl+C to stop")
            print()
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
