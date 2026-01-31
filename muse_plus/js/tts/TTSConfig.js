/**
 * TTS Configuration Management System
 * Handles storage and retrieval of TTS settings
 */
class TTSConfig {
    constructor() {
        this.data = {
            engine: 'web-speech',           // 当前选择的引擎
            voice: 'yushao',                // 当前选择的音色
            dashscopeApiKey: null,          // DashScope API密钥
            fallbackEnabled: true,          // 是否启用自动降级
            volume: 50,                     // 音量设置
            speed: 1.0,                     // 语速设置
            lastUsedEngine: 'web-speech'    // 上次使用的引擎
        };
        this.load();
    }
    
    /**
     * Load configuration from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem('muse_tts_config');
            if (saved) {
                const parsedData = JSON.parse(saved);
                this.data = { ...this.data, ...parsedData };
            }
            
            // Migrate from old voice settings if they exist
            this.migrateOldSettings();
        } catch (error) {
            console.warn('Failed to load TTS config:', error);
            // Use default settings if loading fails
        }
    }
    
    /**
     * Migrate from old voice settings format
     */
    migrateOldSettings() {
        const oldVoiceType = localStorage.getItem('muse_voice_type');
        const oldVoiceSettings = localStorage.getItem('muse_voice_settings');
        
        if (oldVoiceType && !this.data.voice) {
            this.data.voice = oldVoiceType;
        }
        
        if (oldVoiceSettings) {
            try {
                const parsed = JSON.parse(oldVoiceSettings);
                if (parsed.type && !this.data.voice) {
                    this.data.voice = parsed.type;
                }
            } catch (error) {
                console.warn('Failed to migrate old voice settings:', error);
            }
        }
    }
    
    /**
     * Save a configuration value
     * @param {string} key - Configuration key
     * @param {*} value - Configuration value
     */
    save(key, value) {
        // Special handling for sensitive data like API keys
        if (key === 'dashscopeApiKey') {
            this.data[key] = this.encodeApiKey(value);
        } else {
            this.data[key] = value;
        }
        
        try {
            localStorage.setItem('muse_tts_config', JSON.stringify(this.data));
        } catch (error) {
            console.error('Failed to save TTS config:', error);
        }
    }
    
    /**
     * Get a configuration value
     * @param {string} key - Configuration key
     * @returns {*} Configuration value
     */
    get(key) {
        // Special handling for sensitive data like API keys
        if (key === 'dashscopeApiKey') {
            return this.decodeApiKey(this.data[key]);
        }
        return this.data[key];
    }
    
    /**
     * Get all configuration data
     * @returns {Object} All configuration data
     */
    getAll() {
        return { ...this.data };
    }
    
    /**
     * Reset configuration to defaults
     */
    reset() {
        this.data = {
            engine: 'web-speech',
            voice: 'yushao',
            dashscopeApiKey: null,
            fallbackEnabled: true,
            volume: 50,
            speed: 1.0,
            lastUsedEngine: 'web-speech'
        };
        try {
            localStorage.setItem('muse_tts_config', JSON.stringify(this.data));
        } catch (error) {
            console.error('Failed to reset TTS config:', error);
        }
    }
    
    /**
     * Basic API key encoding for storage (simple obfuscation)
     * Note: This is not cryptographic security, just basic obfuscation
     * @param {string} apiKey - The API key to encode
     * @returns {string|null} Encoded API key or null
     */
    encodeApiKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return null;
        }
        
        try {
            // Simple base64 encoding with a prefix to identify encoded keys
            return 'enc_' + btoa(apiKey);
        } catch (error) {
            console.warn('Failed to encode API key:', error);
            return apiKey; // Fallback to plain text
        }
    }
    
    /**
     * Basic API key decoding from storage
     * @param {string} encodedKey - The encoded API key
     * @returns {string|null} Decoded API key or null
     */
    decodeApiKey(encodedKey) {
        if (!encodedKey || typeof encodedKey !== 'string') {
            return null;
        }
        
        // Check if key is encoded
        if (encodedKey.startsWith('enc_')) {
            try {
                return atob(encodedKey.substring(4));
            } catch (error) {
                console.warn('Failed to decode API key:', error);
                return null;
            }
        }
        
        // Return as-is if not encoded (backward compatibility)
        return encodedKey;
    }
    
    /**
     * Check if API key is stored securely
     * @returns {boolean} True if API key is encoded
     */
    isApiKeySecure() {
        const storedKey = this.data.dashscopeApiKey;
        return storedKey && storedKey.startsWith('enc_');
    }
    
    /**
     * Validate configuration data
     * @returns {Object} Validation result with isValid and errors
     */
    validate() {
        const errors = [];
        
        // Validate engine
        if (!['web-speech', 'dashscope'].includes(this.data.engine)) {
            errors.push('Invalid engine type');
        }
        
        // Validate voice
        if (!['yushao', 'shaonian', 'dashu'].includes(this.data.voice)) {
            errors.push('Invalid voice type');
        }
        
        // Validate DashScope API key if engine is dashscope
        if (this.data.engine === 'dashscope' && !this.data.dashscopeApiKey) {
            errors.push('DashScope API key is required');
        }
        
        // Validate volume
        if (typeof this.data.volume !== 'number' || this.data.volume < 0 || this.data.volume > 100) {
            errors.push('Volume must be between 0 and 100');
        }
        
        // Validate speed
        if (typeof this.data.speed !== 'number' || this.data.speed < 0.1 || this.data.speed > 3.0) {
            errors.push('Speed must be between 0.1 and 3.0');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTSConfig;
}