/**
 * Web Speech API Engine Adapter
 * Provides a unified interface for Web Speech Synthesis API
 */
class WebSpeechEngine {
    constructor() {
        this.name = 'web-speech';
        this.displayName = 'Web Speech API';
        
        // Voice configuration mapping
        this.voiceMap = {
            'yushao': { 
                pitch: 0.7, 
                rate: 0.8, 
                name: '🍷 低沉御少音',
                description: '磁性 · 成熟'
            },
            'shaonian': { 
                pitch: 1.2, 
                rate: 1.0, 
                name: '❄️ 清冷少年音',
                description: '清脆 · 禁欲'
            },
            'dashu': { 
                pitch: 0.5, 
                rate: 0.85, 
                name: '🥃 温柔大叔音',
                description: '低沉 · 包容'
            }
        };
        
        this.isInitialized = false;
        this.currentUtterance = null;
    }
    
    /**
     * Initialize the Web Speech engine
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.isInitialized) return;
        
        if (!window.speechSynthesis) {
            throw new Error('Web Speech API not supported in this browser');
        }
        
        // Wait for voices to be loaded
        return new Promise((resolve) => {
            const checkVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    this.isInitialized = true;
                    resolve();
                } else {
                    // Some browsers need time to load voices
                    setTimeout(checkVoices, 100);
                }
            };
            
            // Handle the voiceschanged event
            window.speechSynthesis.onvoiceschanged = checkVoices;
            
            // Also check immediately in case voices are already loaded
            checkVoices();
            
            // Timeout after 5 seconds
            setTimeout(() => {
                if (!this.isInitialized) {
                    this.isInitialized = true; // Allow to proceed even without voices
                    resolve();
                }
            }, 5000);
        });
    }
    
    /**
     * Synthesize text to speech
     * @param {string} text - Text to synthesize
     * @param {Object} options - Synthesis options
     * @returns {Promise<void>}
     */
    async synthesize(text, options = {}) {
        if (!window.speechSynthesis) {
            throw new Error('Web Speech API not supported');
        }
        
        // Cancel any ongoing speech
        this.stop();
        
        return new Promise((resolve, reject) => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                const voiceConfig = this.voiceMap[options.voice] || this.voiceMap['yushao'];
                
                // Configure utterance
                utterance.lang = options.language || 'zh-CN';
                utterance.pitch = voiceConfig.pitch;
                utterance.rate = voiceConfig.rate * (options.speed || 1.0);
                utterance.volume = (options.volume || 50) / 100;
                
                // Set up event handlers
                utterance.onend = () => {
                    this.currentUtterance = null;
                    resolve();
                };
                
                utterance.onerror = (error) => {
                    this.currentUtterance = null;
                    reject(new Error(`Web Speech synthesis failed: ${error.error}`));
                };
                
                utterance.onstart = () => {
                    // Speech started successfully
                };
                
                // Store current utterance for potential cancellation
                this.currentUtterance = utterance;
                
                // Start synthesis
                window.speechSynthesis.speak(utterance);
                
            } catch (error) {
                reject(new Error(`Web Speech synthesis error: ${error.message}`));
            }
        });
    }
    
    /**
     * Stop current speech synthesis
     */
    stop() {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        this.currentUtterance = null;
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
        return typeof window !== 'undefined' && 'speechSynthesis' in window;
    }
    
    /**
     * Get engine capabilities
     * @returns {Object} Engine capabilities
     */
    getCapabilities() {
        return {
            streaming: false,
            languages: ['zh-CN', 'en-US'],
            formats: ['text'],
            maxTextLength: 32767, // Chrome's limit for utterance text
            supportsSSML: false
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
        
        if (options.speed && (options.speed < 0.1 || options.speed > 10)) {
            errors.push('Speed must be between 0.1 and 10');
        }
        
        if (options.volume && (options.volume < 0 || options.volume > 100)) {
            errors.push('Volume must be between 0 and 100');
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
            isPlaying: window.speechSynthesis && window.speechSynthesis.speaking,
            isPaused: window.speechSynthesis && window.speechSynthesis.paused,
            currentUtterance: this.currentUtterance !== null
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebSpeechEngine;
}