/**
 * DashScope TTS Engine Adapter - Non-Streaming Version
 * Provides a unified interface for Alibaba Cloud DashScope TTS API
 */
class DashScopeEngine {
    constructor() {
        this.name = 'dashscope';
        this.displayName = 'DashScope TTS';
        this.apiKey = null;
        this.baseUrl = this.resolveBaseUrl();
        console.log('DashScope Base URL:', this.baseUrl);
        
        // Voice mapping from internal names to DashScope voice parameters
        this.voiceMap = {
            'yushao': {
                voice: 'Kai',
                name: '🍷 低沉御少音 (Kai)',
                description: '磁性 · 成熟'
            },
            'shaonian': {
                voice: 'Nofish',
                name: '❄️ 清冷少年音 (Nofish)',
                description: '清脆 · 禁欲'
            },
            'dashu': {
                voice: 'Lenn',
                name: '🥃 温柔大叔音 (Lenn)',
                description: '低沉 · 包容'
            }
        };
        
        this.isInitialized = false;
        this.currentAudio = null;
    }

    /**
     * Whether we are using local proxy mode (recommended for browsers)
     * @returns {boolean}
     */
    isLocalProxyMode() {
        return (
            typeof this.baseUrl === 'string' &&
            (this.baseUrl.startsWith('http://localhost:3001/') || this.baseUrl.startsWith('http://127.0.0.1:3001/'))
        );
    }

    /**
     * Whether we are using the formal backend proxy.
     * @returns {boolean}
     */
    isBackendProxyMode() {
        return (
            typeof this.baseUrl === 'string' &&
            (this.baseUrl.endsWith('/api/dashscope') || this.baseUrl.includes('/api/dashscope?'))
        );
    }

    /**
     * Resolve API base URL from runtime config, local storage, or local development fallback.
     * @returns {string}
     */
    resolveBaseUrl() {
        const runtimeConfigBase = typeof window !== 'undefined' && window.MUSE_RUNTIME_CONFIG
            ? String(window.MUSE_RUNTIME_CONFIG.proxyBase || '').trim()
            : '';
        const storedProxyBase = typeof window !== 'undefined'
            ? String(localStorage.getItem('muse_proxy_base') || '').trim()
            : '';
        const configuredProxyBase = runtimeConfigBase || storedProxyBase;

        if (configuredProxyBase) {
            return `${configuredProxyBase.replace(/\/$/, '')}/api/dashscope`;
        }

        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3001/api/dashscope/api/v1';
        }

        return 'https://dashscope.aliyuncs.com/api/v1';
    }

    /**
     * Whether current environment is likely a static host where DashScope is CORS-blocked
     * @returns {boolean}
     */
    isCorsRestrictedEnvironment() {
        const isDirectDashScope = typeof this.baseUrl === 'string' && this.baseUrl.startsWith('https://dashscope.aliyuncs.com/');
        return isDirectDashScope && !this.isLocalProxyMode();
    }

    /**
     * Friendly guidance when running in static hosting environments like GitHub Pages
     * @returns {string}
     */
    getCorsHelpMessage() {
        const host = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : '';
        const isGitHubPages = host.endsWith('github.io');
        const hintHost = isGitHubPages ? 'GitHub Pages' : '静态站点';

        return `浏览器在 ${hintHost} 上无法直接调用 DashScope TTS（跨域/CORS 限制）。\n\n可选方案：\n1) 本地运行 ./start.sh（会启动 CORS 代理），再访问 http://localhost:3000/\n2) 改用 Web Speech API（无需后端，但音质/音色由浏览器决定）`;
    }
    
    /**
     * Initialize the DashScope engine
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;
        
        // Check if API key is available
        if (!this.apiKey) {
            throw new Error('DashScope API key not configured');
        }
        
        // Validate API key format (basic check)
        if (typeof this.apiKey !== 'string' || this.apiKey.length < 10) {
            throw new Error('Invalid DashScope API key format');
        }
        
        this.isInitialized = true;
    }
    
    /**
     * Set the API key for DashScope
     * @param {string} apiKey - The DashScope API key
     */
    setApiKey(apiKey) {
        // Validate API key format before setting
        if (apiKey !== null && !this.isValidApiKeyFormat(apiKey)) {
            console.warn('API key format appears invalid');
        }
        
        this.apiKey = apiKey;
        this.isInitialized = false; // Reset initialization status
    }
    
    /**
     * Validate API key format (basic client-side validation)
     * @param {string} apiKey - The API key to validate
     * @returns {boolean} True if format appears valid
     */
    isValidApiKeyFormat(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return false;
        }
        
        // Basic format checks for DashScope API keys
        // DashScope keys are typically 32+ characters long
        if (apiKey.length < 10) {
            return false;
        }
        
        // Should not contain spaces or special characters that would be invalid
        if (/\s/.test(apiKey)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Validate API key by making a test request
     * @returns {Promise<{isValid: boolean, error?: string}>} Validation result with details
     */
    async validateApiKey() {
        if (!this.apiKey) {
            return { isValid: false, error: 'No API key provided' };
        }
        
        if (!this.isValidApiKeyFormat(this.apiKey)) {
            return { isValid: false, error: 'Invalid API key format' };
        }
        
        try {
            // In static hosting environments, direct calls are often blocked by CORS.
            if (this.isCorsRestrictedEnvironment()) {
                return { isValid: false, error: this.getCorsHelpMessage() };
            }

            const requestInfo = this.buildValidateRequest();
            // Make a minimal test request to validate the API key
            const response = await fetch(requestInfo.url, requestInfo.options);
            
            if (response.ok) {
                return { isValid: true };
            } else if (response.status === 401) {
                return { isValid: false, error: 'Invalid API key or unauthorized' };
            } else if (response.status === 403) {
                return { isValid: false, error: 'API key does not have required permissions' };
            } else if (response.status === 429) {
                return { isValid: false, error: 'Rate limit exceeded, but API key appears valid' };
            } else if (response.status === 400) {
                // 400 might be expected for minimal request, but key is likely valid
                return { isValid: true };
            } else {
                const errorText = await response.text().catch(() => 'Unknown error');
                return { isValid: false, error: `API error (${response.status}): ${errorText}` };
            }
            
        } catch (error) {
            // In browsers, CORS failures often surface as TypeError: Failed to fetch
            if (this.isCorsRestrictedEnvironment()) {
                return { isValid: false, error: this.getCorsHelpMessage() };
            }

            if (error && error.name === 'TypeError' && String(error.message || '').includes('fetch')) {
                return { isValid: false, error: 'Network error: Unable to connect to DashScope API' };
            }

            return { isValid: false, error: `Validation failed: ${error.message}` };
        }
    }
    
    /**
     * Synthesize text to speech using DashScope API
     * @param {string} text - Text to synthesize
     * @param {Object} options - Synthesis options
     * @returns {Promise<void>}
     */
    async synthesize(text, options = {}) {
        if (!this.apiKey) {
            throw new Error('DashScope API key not configured');
        }
        
        // Stop any current audio
        this.stop();
        
        console.log('=== DashScope Synthesis ===');
        console.log('Text:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        console.log('Text length:', text.length);
        console.log('Options:', JSON.stringify(options, null, 2));
        
        console.log('⚡ Using NON-STREAMING synthesis');
        return await this.synthesizeNonStreaming(text, options);
    }
    
    /**
     * Non-streaming synthesis
     * @param {string} text - Text to synthesize
     * @param {Object} options - Synthesis options
     * @returns {Promise<void>}
     */
    async synthesizeNonStreaming(text, options = {}) {
        const voiceConfig = this.voiceMap[options.voice] || this.voiceMap['shaonian'];
        
        const requestBody = {
            model: 'qwen3-tts-flash',
            input: {
                text: text,
                voice: voiceConfig.voice,
                language_type: options.language || 'Chinese'
            }
        };
        
        try {
            if (this.isCorsRestrictedEnvironment()) {
                throw new Error(this.getCorsHelpMessage());
            }

            const requestInfo = this.buildSynthesizeRequest(requestBody);
            const apiUrl = requestInfo.url;
            console.log('DashScope API URL:', apiUrl);
            console.log('Request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(apiUrl, requestInfo.options);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('DashScope API error response:', errorText);
                throw new Error(`DashScope API error (${response.status}): ${errorText}`);
            }
            
            const result = await response.json();
            console.log('DashScope API response:', result);
            
            if (result.output && result.output.audio_url) {
                console.log('Received audio URL:', result.output.audio_url);
                return await this.playAudioFromUrl(result.output.audio_url);
            } else if (result.output && result.output.audio) {
                console.log('Received audio object:', result.output.audio);
                
                if (typeof result.output.audio === 'object' && result.output.audio.url) {
                    console.log('Using audio URL from object:', result.output.audio.url);
                    return await this.playAudioFromUrl(result.output.audio.url);
                } else if (typeof result.output.audio === 'string') {
                    console.log('Received base64 audio data, length:', result.output.audio.length);
                    return await this.playAudioFromBase64(result.output.audio);
                } else if (result.output.audio.data) {
                    console.log('Received audio data in data field');
                    return await this.playAudioFromBase64(result.output.audio.data);
                } else {
                    console.error('Unexpected audio format:', typeof result.output.audio, result.output.audio);
                    throw new Error('Unsupported audio format in DashScope response');
                }
            } else {
                console.error('Unexpected response format:', result);
                throw new Error('Invalid response from DashScope API: no audio data found');
            }
            
        } catch (error) {
            if (this.isCorsRestrictedEnvironment()) {
                throw new Error(this.getCorsHelpMessage());
            }

            if (error && error.name === 'TypeError' && String(error.message || '').includes('fetch')) {
                throw new Error('Network error: Unable to connect to DashScope API');
            }

            throw new Error(`DashScope synthesis failed: ${error.message}`);
        }
    }
    
    /**
     * Play audio from URL
     * @param {string} audioUrl - URL of the audio file
     * @returns {Promise<void>}
     */
    async playAudioFromUrl(audioUrl) {
        return new Promise((resolve, reject) => {
            const playableUrl = this.getPlayableAudioUrl(audioUrl);
            console.log('Creating audio element for URL:', playableUrl);
            
            // 停止当前播放的音频
            this.stop();
            
            const audio = new Audio();
            
            // 设置音频属性
            audio.preload = 'auto';
            
            // 设置音频源
            audio.src = playableUrl;
            this.currentAudio = audio;
            
            // 添加事件监听器
            audio.onloadstart = () => {
                console.log('Audio loading started');
            };
            
            audio.onloadeddata = () => {
                console.log('Audio data loaded');
            };
            
            audio.oncanplay = () => {
                console.log('Audio can start playing');
            };
            
            audio.onplay = () => {
                console.log('Audio playback started');
            };
            
            audio.onended = () => {
                console.log('Audio playback ended');
                this.currentAudio = null;
                resolve();
            };
            
            audio.onerror = (error) => {
                console.error('Audio error:', error);
                console.error('Audio error details:', {
                    error: audio.error,
                    networkState: audio.networkState,
                    readyState: audio.readyState,
                    src: audio.src
                });
                this.currentAudio = null;
                
                // 提供更详细的错误信息
                let errorMessage = 'Unknown audio error';
                if (audio.error) {
                    switch (audio.error.code) {
                        case audio.error.MEDIA_ERR_ABORTED:
                            errorMessage = 'Audio playback was aborted';
                            break;
                        case audio.error.MEDIA_ERR_NETWORK:
                            errorMessage = 'Network error occurred while loading audio';
                            break;
                        case audio.error.MEDIA_ERR_DECODE:
                            errorMessage = 'Audio decoding error';
                            break;
                        case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            errorMessage = 'Audio format not supported';
                            break;
                        default:
                            errorMessage = `Audio error code: ${audio.error.code}`;
                    }
                }
                
                reject(new Error(`Audio playback failed: ${errorMessage}`));
            };
            
            // 等待一小段时间确保音频元素准备就绪
            setTimeout(() => {
                // 尝试播放
                console.log('Attempting to play audio...');
                
                const playPromise = audio.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log('Audio playback started successfully');
                        })
                        .catch(error => {
                            console.error('Play promise rejected:', error);
                            this.currentAudio = null;
                            
                            // 检查是否是自动播放策略问题
                            if (error.name === 'NotAllowedError') {
                                reject(new Error('浏览器阻止了自动播放，请先与页面交互后再试'));
                            } else if (error.name === 'NotSupportedError') {
                                reject(new Error('音频格式不支持'));
                            } else if (error.name === 'AbortError') {
                                reject(new Error('音频播放被中断'));
                            } else {
                                reject(new Error(`Audio play failed: ${error.message}`));
                            }
                        });
                } else {
                    // 旧版浏览器，play() 不返回 Promise
                    console.log('Legacy browser, play() does not return Promise');
                }
            }, 100); // 等待100ms
        });
    }

    /**
     * Route remote audio through the local proxy in development to avoid media loading issues.
     * @param {string} audioUrl - Original audio URL
     * @returns {string} Playable URL
     */
    getPlayableAudioUrl(audioUrl) {
        if (!audioUrl) {
            return audioUrl;
        }

        if (audioUrl.startsWith('blob:') || audioUrl.startsWith('data:')) {
            return audioUrl;
        }

        try {
            const parsed = new URL(audioUrl);
            if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
                return audioUrl;
            }
            if (this.isBackendProxyMode()) {
                const proxyBase = this.baseUrl.replace(/\/api\/dashscope$/, '');
                return `${proxyBase}/api/audio/fetch?url=${encodeURIComponent(audioUrl)}`;
            }
            if (!this.isLocalProxyMode()) {
                return audioUrl;
            }
            return `http://localhost:3001/proxy/audio?url=${encodeURIComponent(audioUrl)}`;
        } catch (error) {
            console.warn('Failed to normalize audio URL, using original:', error);
            return audioUrl;
        }
    }

    /**
     * Build request for API key validation.
     * @returns {{url: string, options: object}}
     */
    buildValidateRequest() {
        if (this.isBackendProxyMode()) {
            return {
                url: `${this.baseUrl}/validate`,
                options: {
                    method: 'POST',
                    headers: this.buildRequestHeaders(),
                }
            };
        }

        return {
            url: `${this.baseUrl}/services/aigc/multimodal-generation/generation`,
            options: {
                method: 'POST',
                headers: this.buildRequestHeaders(),
                body: JSON.stringify({
                    model: 'qwen3-tts-flash',
                    input: {
                        text: '测试',
                        voice: 'Kai',
                        language_type: 'Chinese'
                    }
                })
            }
        };
    }

    /**
     * Build request for synthesis.
     * @param {Object} requestBody - DashScope payload
     * @returns {{url: string, options: object}}
     */
    buildSynthesizeRequest(requestBody) {
        if (this.isBackendProxyMode()) {
            return {
                url: `${this.baseUrl}/synthesize`,
                options: {
                    method: 'POST',
                    headers: this.buildRequestHeaders(),
                    body: JSON.stringify({
                        text: requestBody.input.text,
                        voice: requestBody.input.voice,
                        language_type: requestBody.input.language_type
                    })
                }
            };
        }

        return {
            url: `${this.baseUrl}/services/aigc/multimodal-generation/generation`,
            options: {
                method: 'POST',
                headers: this.buildRequestHeaders(),
                body: JSON.stringify(requestBody)
            }
        };
    }

    /**
     * Build request headers depending on current mode.
     * @returns {Object} Headers
     */
    buildRequestHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.isBackendProxyMode()) {
            if (this.apiKey) {
                headers['X-Provider-Key'] = this.apiKey;
            }
            return headers;
        }

        headers['Authorization'] = `Bearer ${this.apiKey}`;
        return headers;
    }
    
    /**
     * Play audio from base64 data
     * @param {string} base64Data - Base64 encoded audio data
     * @returns {Promise<void>}
     */
    async playAudioFromBase64(base64Data) {
        try {
            console.log('Converting base64 to blob...');
            const audioBlob = this.base64ToBlob(base64Data);
            console.log('Blob created, size:', audioBlob.size, 'type:', audioBlob.type);
            
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log('Object URL created:', audioUrl);
            
            const result = await this.playAudioFromUrl(audioUrl);
            
            // Clean up the object URL
            URL.revokeObjectURL(audioUrl);
            console.log('Object URL cleaned up');
            
            return result;
        } catch (error) {
            console.error('Base64 audio playback failed:', error);
            throw new Error(`Base64 audio playback failed: ${error.message}`);
        }
    }
    
    /**
     * Convert base64 to audio blob
     * @param {string|Array} base64Data - Base64 encoded audio data
     * @returns {Blob} Audio blob
     */
    base64ToBlob(base64Data) {
        try {
            let cleanBase64;
            let mimeType = 'audio/mpeg';
            
            // 处理不同类型的 base64 数据
            if (typeof base64Data === 'string') {
                const dataUrlMatch = base64Data.match(/^data:(audio\/[^;]+);base64,/);
                if (dataUrlMatch) {
                    mimeType = dataUrlMatch[1];
                }

                // 移除可能的 data URL 前缀
                cleanBase64 = base64Data.replace(/^data:audio\/[^;]+;base64,/, '');
            } else if (Array.isArray(base64Data)) {
                // 如果是数组，转换为字符串
                cleanBase64 = base64Data.join('');
            } else {
                // 尝试转换为字符串
                cleanBase64 = String(base64Data);
            }
            
            console.log('Processing base64 data, type:', typeof base64Data, 'length:', cleanBase64.length);
            
            const byteCharacters = atob(cleanBase64);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            if (mimeType === 'audio/mpeg') {
                mimeType = this.detectAudioMimeType(byteArray);
            }

            console.log('Detected audio MIME type:', mimeType);
            return new Blob([byteArray], { type: mimeType });
        } catch (error) {
            console.error('Base64 conversion error:', error);
            throw new Error(`Base64 conversion failed: ${error.message}`);
        }
    }

    /**
     * Detect audio MIME type from magic bytes
     * @param {Uint8Array} byteArray - Audio bytes
     * @returns {string} MIME type
     */
    detectAudioMimeType(byteArray) {
        if (!byteArray || byteArray.length < 4) {
            return 'audio/mpeg';
        }

        // ID3 header or MP3 frame sync
        if (
            (byteArray[0] === 0x49 && byteArray[1] === 0x44 && byteArray[2] === 0x33) ||
            (byteArray[0] === 0xff && (byteArray[1] & 0xe0) === 0xe0)
        ) {
            return 'audio/mpeg';
        }

        // WAV / RIFF
        if (
            byteArray[0] === 0x52 &&
            byteArray[1] === 0x49 &&
            byteArray[2] === 0x46 &&
            byteArray[3] === 0x46
        ) {
            return 'audio/wav';
        }

        // OGG
        if (
            byteArray[0] === 0x4f &&
            byteArray[1] === 0x67 &&
            byteArray[2] === 0x67 &&
            byteArray[3] === 0x53
        ) {
            return 'audio/ogg';
        }

        return 'audio/mpeg';
    }
    
    /**
     * Stop current audio playback
     */
    stop() {
        if (this.currentAudio) {
            try {
                this.currentAudio.pause();
                this.currentAudio.currentTime = 0;
                this.currentAudio.src = ''; // 清除音频源
                this.currentAudio = null;
            } catch (error) {
                console.warn('停止音频时出错:', error);
                this.currentAudio = null;
            }
        }
        
        console.log('🛑 Audio playback stopped');
    }
    
    /**
     * Get available voices for this engine
     * @returns {Array} Array of voice options
     */
    getAvailableVoices() {
        return Object.keys(this.voiceMap).map(id => ({
            id: id,
            name: this.voiceMap[id].name,
            description: this.voiceMap[id].description,
            engine: this.name
        }));
    }
    
    /**
     * Check if the engine is available
     * @returns {boolean} True if engine is available
     */
    isAvailable() {
        return this.apiKey !== null && this.apiKey.length > 0 && !this.isCorsRestrictedEnvironment();
    }
    
    /**
     * Get engine capabilities
     * @returns {Object} Engine capabilities
     */
    getCapabilities() {
        return {
            streaming: false,
            languages: ['Chinese', 'English'],
            formats: ['mp3'],
            maxTextLength: 10000, // DashScope limit
            supportsSSML: false,
            requiresApiKey: true
        };
    }
    
    /**
     * Validate synthesis options
     * @param {Object} options - Options to validate
     * @returns {Object} Validation result
     */
    validateOptions(options) {
        const errors = [];
        
        if (options.voice && !this.voiceMap[options.voice]) {
            errors.push(`Unsupported voice: ${options.voice}`);
        }
        
        if (options.speed && (options.speed < 0.5 || options.speed > 2.0)) {
            errors.push('Speed must be between 0.5 and 2.0 for DashScope');
        }
        
        if (options.volume && (options.volume < 0 || options.volume > 100)) {
            errors.push('Volume must be between 0 and 100');
        }
        
        if (options.sampleRate && ![16000, 24000, 48000].includes(options.sampleRate)) {
            errors.push('Sample rate must be 16000, 24000, or 48000');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    /**
     * Get current synthesis status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            isPlaying: this.currentAudio && !this.currentAudio.paused,
            isPaused: this.currentAudio && this.currentAudio.paused,
            currentAudio: this.currentAudio !== null,
            apiKeyConfigured: this.apiKey !== null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashScopeEngine;
}
