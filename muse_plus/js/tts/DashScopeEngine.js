/**
 * DashScope TTS Engine Adapter - Non-Streaming Version
 * Provides a unified interface for Alibaba Cloud DashScope TTS API
 */
class DashScopeEngine {
    constructor() {
        this.name = 'dashscope';
        this.displayName = 'DashScope TTS';
        this.apiKey = null;
        
        // 检测是否在本地开发环境，如果是则使用代理
        this.baseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:3001/api/dashscope/api/v1'
            : 'https://dashscope.aliyuncs.com/api/v1';
        
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
            // Make a minimal test request to validate the API key
            const response = await fetch(`${this.baseUrl}/services/aigc/multimodal-generation/generation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'qwen3-tts-flash',
                    input: {
                        text: '测试',
                        voice: 'Kai',
                        language_type: 'Chinese'
                    }
                })
            });
            
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
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
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
            model: 'qwen3-tts-flash-2025-11-27',
            input: {
                text: text,
                voice: voiceConfig.voice,
                language_type: options.language || 'Chinese'
            }
        };
        
        try {
            const apiUrl = `${this.baseUrl}/services/aigc/multimodal-generation/generation`;
            console.log('DashScope API URL:', apiUrl);
            console.log('Request body:', JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
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
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
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
            console.log('Creating audio element for URL:', audioUrl);
            const audio = new Audio(audioUrl);
            
            // 添加更多事件监听器用于调试
            audio.onloadstart = () => {
                console.log('Audio loading started');
                this.currentAudio = audio;
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
                reject(new Error(`Audio playback failed: ${audio.error ? audio.error.message : 'Unknown error'}`));
            };
            
            // 尝试播放
            console.log('Attempting to play audio...');
            
            // 检查浏览器自动播放策略
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
                        } else {
                            reject(new Error(`Audio play failed: ${error.message}`));
                        }
                    });
            } else {
                // 旧版浏览器，play() 不返回 Promise
                console.log('Legacy browser, play() does not return Promise');
            }
        });
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
            
            // 处理不同类型的 base64 数据
            if (typeof base64Data === 'string') {
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
            return new Blob([byteArray], { type: 'audio/mpeg' });
        } catch (error) {
            console.error('Base64 conversion error:', error);
            throw new Error(`Base64 conversion failed: ${error.message}`);
        }
    }
    
    /**
     * Stop current audio playback
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.currentAudio = null;
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
        return this.apiKey !== null && this.apiKey.length > 0;
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