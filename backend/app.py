import os
from urllib.parse import unquote, urlparse

import requests
from flask import Flask, Response, jsonify, request

app = Flask(__name__)

DASHSCOPE_API_BASE = os.getenv("DASHSCOPE_API_BASE", "https://dashscope.aliyuncs.com/api/v1")
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")


def get_allowed_origin(request_origin):
    if ALLOWED_ORIGINS.strip() == "*":
        return "*"

    allowed = [origin.strip() for origin in ALLOWED_ORIGINS.split(",") if origin.strip()]
    if request_origin and request_origin in allowed:
        return request_origin
    return allowed[0] if allowed else "*"


def corsify(response):
    response.headers["Access-Control-Allow-Origin"] = get_allowed_origin(request.headers.get("Origin"))
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Provider-Key"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Vary"] = "Origin"
    return response


@app.after_request
def add_cors_headers(response):
    return corsify(response)


@app.route("/health", methods=["GET", "OPTIONS"])
def health():
    if request.method == "OPTIONS":
        return corsify(Response(status=204))
    return jsonify(
        {
            "ok": True,
            "providers": {
                "dashscope": bool(DASHSCOPE_API_KEY),
                "minimax": bool(MINIMAX_API_KEY),
            },
        }
    )


def get_dashscope_key():
    return DASHSCOPE_API_KEY or request.headers.get("X-Provider-Key", "").strip()


def dashscope_headers(api_key):
    return {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }


@app.route("/api/dashscope/validate", methods=["POST", "OPTIONS"])
def validate_dashscope():
    if request.method == "OPTIONS":
        return corsify(Response(status=204))

    api_key = get_dashscope_key()
    if not api_key:
        return jsonify({"success": False, "error": "DashScope API key is not configured"}), 400

    payload = {
        "model": "qwen3-tts-flash",
        "input": {
            "text": "测试",
            "voice": "Kai",
            "language_type": "Chinese",
        },
    }

    try:
        response = requests.post(
            f"{DASHSCOPE_API_BASE}/services/aigc/multimodal-generation/generation",
            headers=dashscope_headers(api_key),
            json=payload,
            timeout=30,
        )
        if response.ok or response.status_code == 400:
            return jsonify({"success": True})
        return jsonify({"success": False, "error": response.text}), response.status_code
    except requests.RequestException as exc:
        return jsonify({"success": False, "error": str(exc)}), 500


@app.route("/api/dashscope/synthesize", methods=["POST", "OPTIONS"])
def synthesize_dashscope():
    if request.method == "OPTIONS":
        return corsify(Response(status=204))

    api_key = get_dashscope_key()
    if not api_key:
        return jsonify({"error": "DashScope API key is not configured"}), 400

    payload = request.get_json(silent=True) or {}
    text = payload.get("text", "").strip()
    voice = payload.get("voice", "Kai")
    language_type = payload.get("language_type", "Chinese")

    if not text:
        return jsonify({"error": "text is required"}), 400

    dashscope_payload = {
        "model": "qwen3-tts-flash",
        "input": {
            "text": text,
            "voice": voice,
            "language_type": language_type,
        },
    }

    try:
        response = requests.post(
            f"{DASHSCOPE_API_BASE}/services/aigc/multimodal-generation/generation",
            headers=dashscope_headers(api_key),
            json=dashscope_payload,
            timeout=60,
        )
        return Response(
            response.content,
            status=response.status_code,
            content_type=response.headers.get("Content-Type", "application/json"),
        )
    except requests.RequestException as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/audio/fetch", methods=["GET", "OPTIONS"])
def fetch_audio():
    if request.method == "OPTIONS":
        return corsify(Response(status=204))

    raw_url = request.args.get("url", "").strip()
    if not raw_url:
        return jsonify({"error": "url is required"}), 400

    target_url = unquote(raw_url)
    parsed = urlparse(target_url)
    if parsed.scheme not in ("http", "https"):
        return jsonify({"error": "unsupported url scheme"}), 400

    allowed_tokens = ("dashscope-result-", "aliyuncs.com", "oss-cn-")
    if not any(token in parsed.netloc for token in allowed_tokens):
        return jsonify({"error": "unsupported audio host"}), 400

    try:
        upstream = requests.get(target_url, timeout=60, stream=True)
        response = Response(
            upstream.iter_content(chunk_size=8192),
            status=upstream.status_code,
            content_type=upstream.headers.get("Content-Type", "audio/wav"),
        )
        if upstream.headers.get("Content-Length"):
            response.headers["Content-Length"] = upstream.headers["Content-Length"]
        return response
    except requests.RequestException as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/minimax/validate", methods=["POST", "OPTIONS"])
def validate_minimax():
    if request.method == "OPTIONS":
        return corsify(Response(status=204))
    return jsonify(
        {
            "success": False,
            "error": "MiniMax backend route scaffold is ready, but live API integration is not connected yet",
        }
    ), 501


@app.route("/api/minimax/synthesize", methods=["POST", "OPTIONS"])
def synthesize_minimax():
    if request.method == "OPTIONS":
        return corsify(Response(status=204))
    return jsonify({"error": "MiniMax backend route scaffold is ready, but live API integration is not connected yet"}), 501


if __name__ == "__main__":
    port = int(os.getenv("PORT", "8787"))
    app.run(host="0.0.0.0", port=port, debug=True)
