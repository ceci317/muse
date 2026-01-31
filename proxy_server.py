#!/usr/bin/env python3
"""
CORS 代理服务器 - 解决 DashScope API 的跨域问题
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import json
import sys
import ssl
from datetime import datetime

PORT = 3001

class CORSProxyHandler(http.server.BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        """处理预检请求"""
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()
    
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
            
            # 创建请求
            req = urllib.request.Request(
                target_url,
                data=post_data,
                method='POST'
            )
            
            # 复制请求头，但排除一些可能导致问题的头部
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'origin', 'referer', 'content-length']:
                    req.add_header(header, value)
            
            # 创建 SSL 上下文，跳过证书验证（仅用于开发环境）
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            # 发送请求
            with urllib.request.urlopen(req, context=ssl_context) as response:
                # 发送响应
                self.send_response(response.getcode())
                self.send_cors_headers()
                
                # 复制响应头
                for header, value in response.headers.items():
                    if header.lower() not in ['access-control-allow-origin']:
                        self.send_header(header, value)
                
                self.end_headers()
                
                # 发送响应体
                self.wfile.write(response.read())
                
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Response: {response.getcode()}")
        
        except urllib.error.HTTPError as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] HTTP Error: {e.code} - {e.reason}")
            self.send_response(e.code)
            self.send_cors_headers()
            self.end_headers()
            
            try:
                error_body = e.read()
                self.wfile.write(error_body)
            except:
                self.wfile.write(f'{{"error": "HTTP {e.code}: {e.reason}"}}'.encode())
        
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
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        pass  # 禁用默认日志，使用自定义日志

def main():
    try:
        with socketserver.TCPServer(("", PORT), CORSProxyHandler) as httpd:
            print(f"🚀 CORS Proxy Server running on http://localhost:{PORT}")
            print(f"📡 Proxying DashScope API requests")
            print(f"🔗 Use: http://localhost:{PORT}/api/dashscope/... instead of https://dashscope.aliyuncs.com/...")
            print(f"⚠️  SSL certificate verification disabled for development")
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