/**
 * TTS Service Integration Module
 * Main entry point for the TTS service architecture
 */

// Import all TTS components
// Note: In a browser environment, these would be loaded via script tags

/**
 * Initialize and configure the global TTS service
 * @returns {Promise<TTSService>} Initialized TTS service instance
 */
async function initializeTTSService() {
    try {
        // Create the main TTS service instance
        const ttsService = new TTSService();
        
        // Create error handler
        const errorHandler = new ErrorHandler(ttsService);
        
        // Create streaming processor
        const streamingProcessor = new StreamingProcessor();
        
        // Set up error handling for the TTS service
        ttsService.addEventListener('synthesis-error', async (event) => {
            try {
                await errorHandler.handleError(event.error, {
                    text: event.text,
                    options: event.options || {}
                });
            } catch (handledError) {
                console.error('Error handler failed:', handledError);
            }
        });
        
        // Set up streaming support
        ttsService.streamingProcessor = streamingProcessor;
        
        // Initialize the service
        await ttsService.init();
        
        console.log('TTS Service initialized successfully');
        return ttsService;
        
    } catch (error) {
        console.error('Failed to initialize TTS Service:', error);
        throw error;
    }
}

/**
 * Global TTS service instance
 */
let globalTTSService = null;

/**
 * Get or create the global TTS service instance
 * @returns {Promise<TTSService>} TTS service instance
 */
async function getTTSService() {
    if (!globalTTSService) {
        globalTTSService = await initializeTTSService();
    }
    return globalTTSService;
}

/**
 * Convenience function for text synthesis
 * @param {string} text - Text to synthesize
 * @param {Object} options - Synthesis options
 * @returns {Promise<void>}
 */
async function speakText(text, options = {}) {
    const ttsService = await getTTSService();
    return await ttsService.synthesize(text, options);
}

/**
 * Convenience function for playing voice samples
 * @param {string} voiceType - Voice type (yushao, shaonian, dashu)
 * @returns {Promise<void>}
 */
async function playSample(voiceType) {
    const sampleTexts = {
        'yushao': "过来，不用说话，听我就好。",
        'shaonian': "别离我太近，我怕控制不住。",
        'dashu': "把手给我，慢慢来，没关系的。"
    };
    
    const text = sampleTexts[voiceType] || sampleTexts['yushao'];
    return await speakText(text, { voice: voiceType });
}

/**
 * Switch TTS engine
 * @param {string} engineType - Engine type ('web-speech' or 'dashscope')
 * @returns {Promise<boolean>} Success status
 */
async function switchTTSEngine(engineType) {
    const ttsService = await getTTSService();
    return await ttsService.switchEngine(engineType);
}

/**
 * Configure DashScope API key
 * @param {string} apiKey - DashScope API key
 * @returns {Promise<{success: boolean, error?: string}>} Configuration result
 */
async function configureDashScopeApiKey(apiKey) {
    const ttsService = await getTTSService();
    return await ttsService.configureDashScopeApiKey(apiKey);
}

/**
 * Get available voices for current engine
 * @returns {Promise<Array>} Available voices
 */
async function getAvailableVoices() {
    const ttsService = await getTTSService();
    return ttsService.getAvailableVoices();
}

/**
 * Get API key status information
 * @returns {Promise<Object>} API key status
 */
async function getApiKeyStatus() {
    const ttsService = await getTTSService();
    return ttsService.getApiKeyStatus();
}

/**
 * Get available engines
 * @returns {Promise<Array>} Available engines
 */
async function getAvailableEngines() {
    const ttsService = await getTTSService();
    return ttsService.getAvailableEngines();
}

/**
 * Get current TTS configuration
 * @returns {Promise<Object>} Current configuration
 */
async function getTTSConfiguration() {
    const ttsService = await getTTSService();
    return ttsService.getConfiguration();
}

/**
 * Update TTS configuration
 * @param {string} key - Configuration key
 * @param {*} value - Configuration value
 * @returns {Promise<void>}
 */
async function updateTTSConfiguration(key, value) {
    const ttsService = await getTTSService();
    return ttsService.updateConfiguration(key, value);
}

/**
 * Stop current TTS playback
 * @returns {Promise<void>}
 */
async function stopTTS() {
    if (globalTTSService) {
        globalTTSService.stop();
    }
}

/**
 * Get TTS service status
 * @returns {Promise<Object>} Service status
 */
async function getTTSStatus() {
    const ttsService = await getTTSService();
    return ttsService.getStatus();
}

/**
 * Reset TTS service to defaults
 * @returns {Promise<void>}
 */
async function resetTTSService() {
    if (globalTTSService) {
        globalTTSService.reset();
        globalTTSService = null;
    }
}

/**
 * Voice mappings for backward compatibility
 */
const VOICE_MAPPINGS = {
    'web-speech': {
        'yushao': { pitch: 0.7, rate: 0.8, name: '🍷 低沉御少音' },
        'shaonian': { pitch: 1.2, rate: 1.0, name: '❄️ 清冷少年音' },
        'dashu': { pitch: 0.5, rate: 0.85, name: '🥃 温柔大叔音' }
    },
    'dashscope': {
        'yushao': { voice: 'Ethan', name: '🍷 低沉御少音 (Ethan)' },
        'shaonian': { voice: 'Cherry', name: '❄️ 清冷少年音 (Cherry)' },
        'dashu': { voice: 'Dylan', name: '🥃 温柔大叔音 (Dylan)' }
    }
};

/**
 * Backward compatibility function for existing code
 * @param {string} text - Text to speak
 * @param {string} type - Voice type
 */
async function legacySpeakText(text, type) {
    return await speakText(text, { voice: type });
}

/**
 * Backward compatibility function for voice selection
 * @param {string} type - Voice type
 * @param {HTMLElement} el - UI element (for compatibility)
 */
async function legacySelectVoice(type, el) {
    await updateTTSConfiguration('voice', type);
    
    // Update UI if element provided
    if (el) {
        // Visual Update for Radio Indicator
        document.querySelectorAll('.voice-card').forEach(c => {
            c.classList.remove('selected');
            const dot = c.querySelector('.selection-dot div');
            if(dot) dot.classList.add('hidden');
        });
        
        el.classList.add('selected');
        const dot = el.querySelector('.selection-dot div');
        if(dot) dot.classList.remove('hidden');
    }
}

// Export functions for global use
if (typeof window !== 'undefined') {
    // Browser environment - attach to window
    window.TTSService = {
        // Core functions
        getTTSService,
        speakText,
        playSample,
        stopTTS,
        
        // Configuration
        switchTTSEngine,
        configureDashScopeApiKey,
        getTTSConfiguration,
        updateTTSConfiguration,
        resetTTSService,
        
        // Information
        getAvailableVoices,
        getAvailableEngines,
        getApiKeyStatus,
        getTTSStatus,
        
        // Backward compatibility
        legacySpeakText,
        legacySelectVoice,
        VOICE_MAPPINGS,
        
        // Direct access to service
        initializeTTSService
    };
    
    // Also expose individual functions globally for easier migration
    window.speakText = speakText;
    window.playSample = playSample;
    window.switchTTSEngine = switchTTSEngine;
    window.stopTTS = stopTTS;
}

// Node.js environment exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeTTSService,
        getTTSService,
        speakText,
        playSample,
        switchTTSEngine,
        configureDashScopeApiKey,
        getAvailableVoices,
        getAvailableEngines,
        getApiKeyStatus,
        getTTSConfiguration,
        updateTTSConfiguration,
        stopTTS,
        getTTSStatus,
        resetTTSService,
        legacySpeakText,
        legacySelectVoice,
        VOICE_MAPPINGS
    };
}