/**
 * Unified TTS Service
 * Provides a single interface for multiple TTS engines
 */
class TTSService {
    constructor() {
        this.engines = new Map();
        this.config = new TTSConfig();
        this.currentEngine = this.config.get('engine') || 'web-speech';
        this.isInitialized = false;
        
        // Event listeners for engine switching and status updates
        this.eventListeners = {
            'engine-switched': [],
            'synthesis-started': [],
            'synthesis-ended': [],
            'synthesis-error': []
        };
        
        this.init();
    }
    
    /**
     * Initialize the TTS service
     */
    async init() {
        try {
            // Register available engines
            this.registerEngine('web-speech', new WebSpeechEngine());
            this.registerEngine('dashscope', new DashScopeEngine());
            
            // Load DashScope API key if available
            const apiKey = this.config.get('dashscopeApiKey');
            if (apiKey) {
                const dashscopeEngine = this.engines.get('dashscope');
                if (dashscopeEngine) {
                    dashscopeEngine.setApiKey(apiKey);
                }
            }
            
            // Initialize current engine
            await this.initializeCurrentEngine();
            
            this.isInitialized = true;
            console.log('TTS Service initialized successfully');
            
        } catch (error) {
            console.error('TTS Service initialization failed:', error);
            // Fallback to web-speech if initialization fails
            if (this.currentEngine !== 'web-speech') {
                this.currentEngine = 'web-speech';
                await this.initializeCurrentEngine();
            }
        }
    }
    
    /**
     * Register a TTS engine
     * @param {string} name - Engine name
     * @param {Object} engine - Engine instance
     */
    registerEngine(name, engine) {
        this.engines.set(name, engine);
    }
    
    /**
     * Initialize the current engine
     */
    async initializeCurrentEngine() {
        const engine = this.engines.get(this.currentEngine);
        if (engine && typeof engine.initialize === 'function') {
            await engine.initialize();
        }
    }
    
    /**
     * Switch to a different TTS engine
     * @param {string} engineType - Engine type ('web-speech' or 'dashscope')
     * @returns {Promise<boolean>} True if switch was successful
     */
    async switchEngine(engineType) {
        if (!this.engines.has(engineType)) {
            throw new Error(`Unknown engine type: ${engineType}`);
        }
        
        // Stop current synthesis
        this.stop();
        
        const previousEngine = this.currentEngine;
        this.currentEngine = engineType;
        
        try {
            // Initialize new engine
            await this.initializeCurrentEngine();
            
            // Save to configuration
            this.config.save('engine', engineType);
            this.config.save('lastUsedEngine', previousEngine);
            
            // Emit engine switched event
            this.emit('engine-switched', {
                from: previousEngine,
                to: engineType
            });
            
            console.log(`Switched TTS engine from ${previousEngine} to ${engineType}`);
            return true;
            
        } catch (error) {
            // Revert to previous engine on failure
            this.currentEngine = previousEngine;
            console.error(`Failed to switch to ${engineType}:`, error);
            throw error;
        }
    }
    
    /**
     * Synthesize text to speech using the current engine
     * @param {string} text - Text to synthesize
     * @param {Object} options - Synthesis options
     * @returns {Promise<void>}
     */
    async synthesize(text, options = {}) {
        if (!this.isInitialized) {
            await this.init();
        }
        
        const engine = this.engines.get(this.currentEngine);
        if (!engine) {
            throw new Error(`Engine ${this.currentEngine} not available`);
        }
        
        // Merge with default options from config
        const mergedOptions = {
            voice: this.config.get('voice'),
            volume: this.config.get('volume'),
            speed: this.config.get('speed'),
            stream: this.config.get('streamingEnabled'),
            ...options
        };
        
        // Validate options for current engine
        if (typeof engine.validateOptions === 'function') {
            const validation = engine.validateOptions(mergedOptions);
            if (!validation.isValid) {
                throw new Error(`Invalid options: ${validation.errors.join(', ')}`);
            }
        }
        
        try {
            // Emit synthesis started event
            this.emit('synthesis-started', {
                engine: this.currentEngine,
                text: text,
                options: mergedOptions
            });
            
            // Perform synthesis
            await engine.synthesize(text, mergedOptions);
            
            // Emit synthesis ended event
            this.emit('synthesis-ended', {
                engine: this.currentEngine,
                text: text
            });
            
        } catch (error) {
            // Emit synthesis error event
            this.emit('synthesis-error', {
                engine: this.currentEngine,
                error: error,
                text: text
            });
            
            throw error;
        }
    }
    
    /**
     * Stop current synthesis
     */
    stop() {
        const engine = this.engines.get(this.currentEngine);
        if (engine && typeof engine.stop === 'function') {
            engine.stop();
        }
    }
    
    /**
     * Get available voices for the current engine
     * @returns {Array} Array of voice options
     */
    getAvailableVoices() {
        const engine = this.engines.get(this.currentEngine);
        if (engine && typeof engine.getAvailableVoices === 'function') {
            return engine.getAvailableVoices();
        }
        return [];
    }
    
    /**
     * Get all available engines
     * @returns {Array} Array of engine information
     */
    getAvailableEngines() {
        const engines = [];
        
        for (const [name, engine] of this.engines) {
            engines.push({
                id: name,
                name: engine.displayName || name,
                available: engine.isAvailable ? engine.isAvailable() : true,
                capabilities: engine.getCapabilities ? engine.getCapabilities() : {}
            });
        }
        
        return engines;
    }
    
    /**
     * Get current engine information
     * @returns {Object} Current engine info
     */
    getCurrentEngine() {
        const engine = this.engines.get(this.currentEngine);
        return {
            id: this.currentEngine,
            name: engine ? (engine.displayName || this.currentEngine) : this.currentEngine,
            available: engine ? (engine.isAvailable ? engine.isAvailable() : true) : false,
            status: engine ? (engine.getStatus ? engine.getStatus() : {}) : {}
        };
    }
    
    /**
     * Configure DashScope API key
     * @param {string} apiKey - The API key
     * @returns {Promise<{success: boolean, error?: string}>} Configuration result
     */
    async configureDashScopeApiKey(apiKey) {
        const dashscopeEngine = this.engines.get('dashscope');
        if (!dashscopeEngine) {
            throw new Error('DashScope engine not available');
        }
        
        // Set the API key
        dashscopeEngine.setApiKey(apiKey);
        
        // Validate the API key
        const validation = await dashscopeEngine.validateApiKey();
        
        if (validation.isValid) {
            // Save to configuration
            this.config.save('dashscopeApiKey', apiKey);
            console.log('DashScope API key configured successfully');
            return { success: true };
        } else {
            // Remove invalid key
            dashscopeEngine.setApiKey(null);
            const error = validation.error || 'Invalid DashScope API key';
            console.warn('DashScope API key validation failed:', error);
            return { success: false, error: error };
        }
    }
    
    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfiguration() {
        return this.config.getAll();
    }
    
    /**
     * Get API key status information
     * @returns {Object} API key status
     */
    getApiKeyStatus() {
        const dashscopeEngine = this.engines.get('dashscope');
        const hasApiKey = !!this.config.get('dashscopeApiKey');
        
        return {
            hasApiKey: hasApiKey,
            isSecure: this.config.isApiKeySecure(),
            engineAvailable: dashscopeEngine ? dashscopeEngine.isAvailable() : false,
            formatValid: hasApiKey && dashscopeEngine ? 
                dashscopeEngine.isValidApiKeyFormat(this.config.get('dashscopeApiKey')) : false
        };
    }
    
    /**
     * Update configuration
     * @param {string} key - Configuration key
     * @param {*} value - Configuration value
     */
    updateConfiguration(key, value) {
        this.config.save(key, value);
        
        // Handle special configuration changes
        if (key === 'engine' && value !== this.currentEngine) {
            this.switchEngine(value);
        }
    }
    
    /**
     * Add event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    addEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        }
    }
    
    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            const index = this.eventListeners[event].indexOf(callback);
            if (index > -1) {
                this.eventListeners[event].splice(index, 1);
            }
        }
    }
    
    /**
     * Emit event to listeners
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Get synthesis status
     * @returns {Object} Status information
     */
    getStatus() {
        const engine = this.engines.get(this.currentEngine);
        return {
            isInitialized: this.isInitialized,
            currentEngine: this.currentEngine,
            engineStatus: engine ? (engine.getStatus ? engine.getStatus() : {}) : {},
            configuration: this.config.getAll(),
            apiKeySecurity: {
                isSecure: this.config.isApiKeySecure(),
                hasApiKey: !!this.config.get('dashscopeApiKey')
            }
        };
    }
    
    /**
     * Reset service to default state
     */
    reset() {
        this.stop();
        this.config.reset();
        this.currentEngine = 'web-speech';
        this.isInitialized = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TTSService;
}