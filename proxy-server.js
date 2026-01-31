const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3001;

// CORS 头部
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
};

const server = http.createServer((req, res) => {
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200, corsHeaders);
        res.end();
        return;
    }

    // 只代理到 DashScope API
    if (!req.url.startsWith('/api/dashscope/')) {
        res.writeHead(404, corsHeaders);
        res.end('Not Found');
        return;
    }

    // 提取目标 URL
    const targetPath = req.url.replace('/api/dashscope', '');
    const targetUrl = `https://dashscope.aliyuncs.com${targetPath}`;

    console.log(`[${new Date().toISOString()}] Proxying: ${req.method} ${targetUrl}`);

    // 收集请求体
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        const parsedUrl = url.parse(targetUrl);
        
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.path,
            method: req.method,
            headers: {
                ...req.headers,
                host: parsedUrl.hostname
            }
        };

        // 删除可能导致问题的头部
        delete options.headers.origin;
        delete options.headers.referer;

        const proxyReq = https.request(options, (proxyRes) => {
            // 设置响应头
            const responseHeaders = {
                ...corsHeaders,
                ...proxyRes.headers
            };
            
            // 删除可能导致问题的头部
            delete responseHeaders['access-control-allow-origin'];
            responseHeaders['Access-Control-Allow-Origin'] = '*';

            res.writeHead(proxyRes.statusCode, responseHeaders);

            // 转发响应数据
            proxyRes.on('data', chunk => {
                res.write(chunk);
            });

            proxyRes.on('end', () => {
                res.end();
            });
        });

        proxyReq.on('error', (error) => {
            console.error('Proxy request error:', error);
            res.writeHead(500, corsHeaders);
            res.end(JSON.stringify({ error: 'Proxy request failed', details: error.message }));
        });

        // 发送请求体
        if (body) {
            proxyReq.write(body);
        }
        
        proxyReq.end();
    });
});

server.listen(PORT, () => {
    console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
    console.log(`📡 Proxying DashScope API requests`);
    console.log(`🔗 Use: http://localhost:${PORT}/api/dashscope/... instead of https://dashscope.aliyuncs.com/...`);
});

server.on('error', (error) => {
    console.error('Server error:', error);
});