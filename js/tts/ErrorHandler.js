/**
 * TTS Error Handler
 * Provides comprehensive error handling and fallback mechanisms
 */
class ErrorHandler {
    constructor(ttsService) {
        this.ttsService = ttsService;
        this.fallbackEngine = 'web-speech';
        this.notificationManager = new NotificationManager();
        this.errorLog = [];
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
    }
    
    /**
     * Handle TTS errors with automatic fallback
     * @param {Error} error - The error that occurred
     * @param {Object} originalRequest - Original synthesis request
     * @returns {Promise<*>} Result of fallback attempt or throws error
     */
    async handleError(error, originalRequest) {
        // Log the error
        this.logError(error, originalRequest);
        
        console.error('TTS Error:', error);
        
        // Determine error type and appropriate response
        const errorType = this.classifyError(error);
        
        switch (errorType) {
            case 'network':
                return await this.handleNetworkError(error, originalRequest);
            
            case 'authentication':
                return await this.handleAuthenticationError(error, originalRequest);
            
            case 'api':
                return await this.handleApiError(error, originalRequest);
            
            case 'audio':
                return await this.handleAudioError(error, originalRequest);
            
            case 'system':
                return await this.handleSystemError(error, originalRequest);
            
            default:
                return await this.handleGenericError(error, originalRequest);
        }
    }
    
    /**
     * Classify error type for appropriate handling
     * @param {Error} error - The error to classify
     * @returns {string} Error classification
     */
    classifyError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
            return 'network';
        }
        
        if (message.includes('api key') || message.includes('unauthorized') || message.includes('403')) {
            return 'authentication';
        }
        
        if (message.includes('dashscope') || message.includes('400') || message.includes('500')) {
            return 'api';
        }
        
        if (message.includes('audio') || message.includes('playback') || message.includes('base64')) {
            return 'audio';
        }
        
        if (message.includes('web speech') || message.includes('not supported')) {
            return 'system';
        }
        
        return 'generic';
    }
    
    /**
     * Handle network-related errors
     */
    async handleNetworkError(error, originalRequest) {
        console.log('Handling network error, attempting fallback...');
        
        // If using DashScope, fallback to Web Speech
        if (this.ttsService.currentEngine === 'dashscope') {
            return await this.performFallback(error, originalRequest, 'Network connection issue');
        }
        
        // If already using Web Speech, show error and retry
        this.notificationManager.showError('网络连接问题，请检查网络设置', 'error');
        throw error;
    }
    
    /**
     * Handle authentication errors
     */
    async handleAuthenticationError(error, originalRequest) {
        console.log('Handling authentication error...');
        
        if (this.ttsService.currentEngine === 'dashscope') {
            this.notificationManager.showError('DashScope API密钥无效，请重新配置', 'error');
            
            // Clear invalid API key
            const dashscopeEngine = this.ttsService.engines.get('dashscope');
            if (dashscopeEngine) {
                dashscopeEngine.setApiKey(null);
            }
            this.ttsService.config.save('dashscopeApiKey', null);
            
            // Fallback to Web Speech
            return await this.performFallback(error, originalRequest, 'API密钥问题');
        }
        
        throw error;
    }
    
    /**
     * Handle API-related errors
     */
    async handleApiError(error, originalRequest) {
        console.log('Handling API error...');
        
        if (this.ttsService.currentEngine === 'dashscope') {
            // Check if it's a temporary API issue
            if (error.message.includes('500') || error.message.includes('503')) {
                return await this.performFallback(error, originalRequest, 'DashScope服务暂时不可用');
            }
            
            // For other API errors, show specific message
            this.notificationManager.showError(`DashScope API错误: ${error.message}`, 'error');
            return await this.performFallback(error, originalRequest, 'API服务错误');
        }
        
        throw error;
    }
    
    /**
     * Handle audio playback errors
     */
    async handleAudioError(error, originalRequest) {
        console.log('Handling audio error...');
        
        // Try to retry with the same engine first
        if (originalRequest.retryCount < this.maxRetries) {
            return await this.retryRequest(error, originalRequest);
        }
        
        // If retries exhausted, fallback if possible
        if (this.ttsService.currentEngine === 'dashscope') {
            return await this.performFallback(error, originalRequest, '音频播放问题');
        }
        
        this.notificationManager.showError('音频播放失败，请检查设备设置', 'error');
        throw error;
    }
    
    /**
     * Handle system-related errors
     */
    async handleSystemError(error, originalRequest) {
        console.log('Handling system error...');
        
        if (this.ttsService.currentEngine === 'web-speech') {
            this.notificationManager.showError('浏览器不支持语音合成功能', 'error');
        } else if (this.ttsService.currentEngine === 'dashscope') {
            // Try fallback to Web Speech if system error occurs with DashScope
            return await this.performFallback(error, originalRequest, '系统错误');
        }
        
        throw error;
    }
    
    /**
     * Handle generic errors
     */
    async handleGenericError(error, originalRequest) {
        console.log('Handling generic error...');
        
        // Try fallback if using DashScope
        if (this.ttsService.currentEngine === 'dashscope') {
            return await this.performFallback(error, originalRequest, '未知错误');
        }
        
        this.notificationManager.showError(`语音合成失败: ${error.message}`, 'error');
        throw error;
    }
    
    /**
     * Perform fallback to alternative engine
     */
    async performFallback(originalError, originalRequest, reason) {
        console.log(`Performing fallback due to: ${reason}`);
        console.log('Original error:', originalError.message);
        
        const originalEngine = this.ttsService.currentEngine;
        
        try {
            // Switch to fallback engine
            await this.ttsService.switchEngine(this.fallbackEngine);
            
            // Retry the request with fallback engine
            const result = await this.ttsService.synthesize(
                originalRequest.text,
                originalRequest.options
            );
            
            // Show fallback notification
            this.notificationManager.showFallbackNotification(originalEngine, this.fallbackEngine);
            
            return result;
            
        } catch (fallbackError) {
            // Restore original engine
            try {
                await this.ttsService.switchEngine(originalEngine);
            } catch (restoreError) {
                console.error('Failed to restore original engine:', restoreError);
            }
            
            // Both engines failed
            this.notificationManager.showError('所有语音引擎都不可用', 'error');
            throw new Error(`All TTS engines failed. Original: ${originalError.message}, Fallback: ${fallbackError.message}`);
        }
    }
    
    /**
     * Retry the original request
     */
    async retryRequest(error, originalRequest) {
        const retryCount = (originalRequest.retryCount || 0) + 1;
        
        console.log(`Retrying request (attempt ${retryCount}/${this.maxRetries})`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * retryCount));
        
        try {
            return await this.ttsService.synthesize(
                originalRequest.text,
                { ...originalRequest.options, retryCount }
            );
        } catch (retryError) {
            if (retryCount >= this.maxRetries) {
                throw retryError;
            }
            return await this.retryRequest(retryError, { ...originalRequest, retryCount });
        }
    }
    
    /**
     * Log error for debugging and analytics
     */
    logError(error, context) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context: {
                engine: this.ttsService.currentEngine,
                text: context?.text?.substring(0, 100) + '...',
                options: context?.options
            },
            userAgent: navigator.userAgent
        };
        
        this.errorLog.push(errorEntry);
        
        // Keep only last 50 errors
        if (this.errorLog.length > 50) {
            this.errorLog.shift();
        }
        
        // Log to console for debugging
        console.error('TTS Error logged:', errorEntry);
    }
    
    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        const stats = {
            totalErrors: this.errorLog.length,
            errorsByType: {},
            errorsByEngine: {},
            recentErrors: this.errorLog.slice(-10)
        };
        
        this.errorLog.forEach(entry => {
            const type = this.classifyError({ message: entry.error.message });
            stats.errorsByType[type] = (stats.errorsByType[type] || 0) + 1;
            
            const engine = entry.context.engine;
            stats.errorsByEngine[engine] = (stats.errorsByEngine[engine] || 0) + 1;
        });
        
        return stats;
    }
    
    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
    }
}

/**
 * Notification Manager for user-friendly error messages
 */
class NotificationManager {
    constructor() {
        this.notifications = [];
    }
    
    /**
     * Show error notification
     * @param {string} message - Error message
     * @param {string} type - Notification type
     */
    showError(message, type = 'error') {
        const notification = this.createNotification(message, type);
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
    
    /**
     * Show fallback notification
     * @param {string} fromEngine - Original engine
     * @param {string} toEngine - Fallback engine
     */
    showFallbackNotification(fromEngine, toEngine) {
        const engineNames = {
            'dashscope': 'DashScope',
            'web-speech': '本地语音合成'
        };
        
        const message = `${engineNames[fromEngine] || fromEngine}服务暂时不可用，已切换到${engineNames[toEngine] || toEngine}`;
        this.showError(message, 'warning');
    }
    
    /**
     * Create notification element
     * @param {string} message - Notification message
     * @param {string} type - Notification type
     * @returns {HTMLElement} Notification element
     */
    createNotification(message, type) {
        const div = document.createElement('div');
        div.className = `tts-notification tts-${type} fixed top-4 right-4 z-50 max-w-sm`;
        
        const bgColor = type === 'error' ? 'red' : 'yellow';
        const icon = type === 'error' ? 'exclamation-circle' : 'exclamation-triangle';
        
        div.innerHTML = `
            <div class="bg-${bgColor}-500/20 border border-${bgColor}-500/30 rounded-lg p-3 text-${bgColor}-200 text-xs backdrop-blur-md">
                <div class="flex items-center gap-2">
                    <i class="fa-solid fa-${icon}"></i>
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="ml-auto text-${bgColor}-300 hover:text-${bgColor}-100">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        return div;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ErrorHandler, NotificationManager };
}