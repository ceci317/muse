/**
 * MiniMax TTS Engine Adapter
 * Scaffold only: keeps the TTS layer extensible while the live MiniMax API is prepared.
 */
class MiniMaxEngine {
    constructor() {
        this.name = 'minimax';
        this.displayName = 'MiniMax TTS';
        this.apiKey = null;
        this.isInitialized = false;
        this.voiceMap = {
            yushao: {
                voice: 'male_magnetic',
                name: '🍷 低沉御少音',
                description: 'MiniMax 占位音色'
            },
            shaonian: {
                voice: 'male_cool',
                name: '❄️ 清冷少年音',
                description: 'MiniMax 占位音色'
            },
            dashu: {
                voice: 'male_warm',
                name: '🥃 温柔大叔音',
                description: 'MiniMax 占位音色'
            }
        };
    }

    async initialize() {
        if (!this.apiKey) {
            throw new Error('MiniMax API key not configured');
        }
        this.isInitialized = true;
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.isInitialized = false;
    }

    isValidApiKeyFormat(apiKey) {
        return typeof apiKey === 'string' && apiKey.trim().length >= 10 && !/\\s/.test(apiKey);
    }

    async validateApiKey() {
        if (!this.apiKey) {
            return { isValid: false, error: 'No MiniMax API key provided' };
        }
        if (!this.isValidApiKeyFormat(this.apiKey)) {
            return { isValid: false, error: 'Invalid MiniMax API key format' };
        }
        return {
            isValid: false,
            error: 'MiniMax scaffold is ready, but the live API proxy has not been connected yet'
        };
    }

    async synthesize() {
        throw new Error('MiniMax TTS is not connected yet');
    }

    stop() {}

    getAvailableVoices() {
        return Object.keys(this.voiceMap).map(id => ({
            id,
            name: this.voiceMap[id].name,
            description: this.voiceMap[id].description,
            engine: this.name
        }));
    }

    isAvailable() {
        return !!this.apiKey;
    }

    getCapabilities() {
        return {
            streaming: false,
            languages: ['Chinese', 'English'],
            formats: ['audio'],
            maxTextLength: 5000,
            requiresApiKey: true
        };
    }

    validateOptions(options) {
        const errors = [];
        if (options.voice && !this.voiceMap[options.voice]) {
            errors.push(`Unsupported voice: ${options.voice}`);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    getStatus() {
        return {
            isInitialized: this.isInitialized,
            apiKeyConfigured: !!this.apiKey
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MiniMaxEngine;
}
