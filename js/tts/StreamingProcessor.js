/**
 * Streaming Audio Processor
 * Handles real-time streaming audio playback for TTS
 */
class StreamingProcessor {
    constructor() {
        this.isStreaming = false;
        this.audioQueue = [];
        this.currentAudio = null;
        this.streamBuffer = [];
        this.playbackQueue = [];
        this.isProcessing = false;
        
        // Configuration
        this.bufferSize = 5; // Number of chunks to buffer before starting playback
        this.chunkTimeout = 5000; // Timeout for individual chunks
        this.maxQueueSize = 50; // Maximum queue size to prevent memory issues
    }
    
    /**
     * Start streaming audio processing
     * @param {AsyncIterable|Array} audioChunks - Stream of audio chunks
     * @param {Object} options - Streaming options
     * @returns {Promise<void>}
     */
    async processStreamingAudio(audioChunks, options = {}) {
        this.isStreaming = true;
        this.isProcessing = true;
        
        try {
            // Handle different input types
            if (Array.isArray(audioChunks)) {
                await this.processChunkArray(audioChunks, options);
            } else if (audioChunks[Symbol.asyncIterator]) {
                await this.processAsyncIterable(audioChunks, options);
            } else {
                throw new Error('Invalid audio chunks format');
            }
        } catch (error) {
            console.error('Streaming audio processing failed:', error);
            throw error;
        } finally {
            this.isStreaming = false;
            this.isProcessing = false;
            this.cleanup();
        }
    }
    
    /**
     * Process array of audio chunks
     * @param {Array} chunks - Array of audio chunks
     * @param {Object} options - Processing options
     */
    async processChunkArray(chunks, options) {
        // Apply any configuration from options
        if (options.bufferSize !== undefined) {
            this.bufferSize = options.bufferSize;
        }
        
        for (let i = 0; i < chunks.length && this.isStreaming; i++) {
            const chunk = chunks[i];
            await this.processChunk(chunk, i, options);
        }
    }
    
    /**
     * Process async iterable of audio chunks
     * @param {AsyncIterable} chunks - Async iterable of audio chunks
     * @param {Object} options - Processing options
     */
    async processAsyncIterable(chunks, options) {
        // Apply any configuration from options
        if (options.bufferSize !== undefined) {
            this.bufferSize = options.bufferSize;
        }
        
        let index = 0;
        for await (const chunk of chunks) {
            if (!this.isStreaming) break;
            await this.processChunk(chunk, index++, options);
        }
    }
    
    /**
     * Process individual audio chunk
     * @param {string|ArrayBuffer|Blob} chunk - Audio chunk data
     * @param {number} index - Chunk index
     * @param {Object} options - Processing options
     */
    async processChunk(chunk, index, options) {
        try {
            // Convert chunk to playable format
            const audioBlob = await this.convertChunkToBlob(chunk);
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Add to playback queue
            this.playbackQueue.push({
                url: audioUrl,
                index: index,
                timestamp: Date.now()
            });
            
            // Start playback if buffer is ready or this is the last chunk
            if (this.playbackQueue.length >= this.bufferSize || !this.isStreaming) {
                await this.playQueuedChunks();
            }
            
            // Prevent queue from growing too large
            if (this.playbackQueue.length > this.maxQueueSize) {
                console.warn('Playback queue too large, dropping oldest chunks');
                this.cleanupOldChunks();
            }
            
        } catch (error) {
            console.error(`Failed to process chunk ${index}:`, error);
            // Continue with next chunk instead of failing completely
        }
    }
    
    /**
     * Convert chunk data to audio blob
     * @param {string|ArrayBuffer|Blob} chunk - Chunk data
     * @returns {Promise<Blob>} Audio blob
     */
    async convertChunkToBlob(chunk) {
        if (chunk instanceof Blob) {
            return chunk;
        }
        
        if (chunk instanceof ArrayBuffer) {
            return new Blob([chunk], { type: 'audio/mpeg' });
        }
        
        if (typeof chunk === 'string') {
            // Assume base64 encoded audio
            return this.base64ToBlob(chunk);
        }
        
        throw new Error('Unsupported chunk format');
    }
    
    /**
     * Convert base64 string to audio blob
     * @param {string} base64Data - Base64 encoded audio data
     * @returns {Blob} Audio blob
     */
    base64ToBlob(base64Data) {
        try {
            // Remove data URL prefix if present
            const base64 = base64Data.replace(/^data:audio\/[^;]+;base64,/, '');
            
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            return new Blob([byteArray], { type: 'audio/mpeg' });
        } catch (error) {
            throw new Error(`Base64 conversion failed: ${error.message}`);
        }
    }
    
    /**
     * Play queued audio chunks
     */
    async playQueuedChunks() {
        while (this.playbackQueue.length > 0 && this.isStreaming) {
            const chunk = this.playbackQueue.shift();
            
            try {
                await this.playAudioChunk(chunk.url);
            } catch (error) {
                console.error(`Failed to play chunk ${chunk.index}:`, error);
            } finally {
                // Clean up the object URL
                URL.revokeObjectURL(chunk.url);
            }
        }
    }
    
    /**
     * Play individual audio chunk
     * @param {string} audioUrl - Audio URL to play
     * @returns {Promise<void>}
     */
    async playAudioChunk(audioUrl) {
        return new Promise((resolve, reject) => {
            const audio = new Audio(audioUrl);
            
            // Set up event handlers
            audio.onended = () => {
                this.currentAudio = null;
                resolve();
            };
            
            audio.onerror = (error) => {
                this.currentAudio = null;
                reject(new Error(`Audio chunk playback failed: ${error.message || 'Unknown error'}`));
            };
            
            audio.onloadstart = () => {
                this.currentAudio = audio;
            };
            
            // Set timeout for chunk playback
            const timeout = setTimeout(() => {
                if (this.currentAudio === audio) {
                    audio.pause();
                    this.currentAudio = null;
                    reject(new Error('Audio chunk playback timeout'));
                }
            }, this.chunkTimeout);
            
            audio.onended = () => {
                clearTimeout(timeout);
                this.currentAudio = null;
                resolve();
            };
            
            audio.onerror = (error) => {
                clearTimeout(timeout);
                this.currentAudio = null;
                reject(error);
            };
            
            // Start playback
            audio.play().catch(error => {
                clearTimeout(timeout);
                this.currentAudio = null;
                reject(new Error(`Audio play failed: ${error.message}`));
            });
        });
    }
    
    /**
     * Stop streaming and cleanup
     */
    stopStreaming() {
        this.isStreaming = false;
        
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }
        
        this.cleanup();
    }
    
    /**
     * Cleanup resources
     */
    cleanup() {
        // Clean up any remaining object URLs
        this.playbackQueue.forEach(chunk => {
            if (chunk.url) {
                URL.revokeObjectURL(chunk.url);
            }
        });
        
        this.playbackQueue = [];
        this.streamBuffer = [];
        this.audioQueue = [];
    }
    
    /**
     * Clean up old chunks to prevent memory issues
     */
    cleanupOldChunks() {
        const now = Date.now();
        const maxAge = 30000; // 30 seconds
        
        while (this.playbackQueue.length > 0) {
            const chunk = this.playbackQueue[0];
            if (now - chunk.timestamp > maxAge) {
                const removed = this.playbackQueue.shift();
                URL.revokeObjectURL(removed.url);
            } else {
                break;
            }
        }
    }
    
    /**
     * Get streaming status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            isStreaming: this.isStreaming,
            isProcessing: this.isProcessing,
            queueLength: this.playbackQueue.length,
            bufferSize: this.bufferSize,
            currentlyPlaying: this.currentAudio !== null
        };
    }
    
    /**
     * Configure streaming parameters
     * @param {Object} config - Configuration options
     */
    configure(config) {
        if (config.bufferSize !== undefined) {
            this.bufferSize = Math.max(1, Math.min(20, config.bufferSize));
        }
        
        if (config.chunkTimeout !== undefined) {
            this.chunkTimeout = Math.max(1000, Math.min(30000, config.chunkTimeout));
        }
        
        if (config.maxQueueSize !== undefined) {
            this.maxQueueSize = Math.max(10, Math.min(100, config.maxQueueSize));
        }
    }
    
    /**
     * Process streaming response from DashScope API
     * @param {Response} response - Fetch response object
     * @returns {Promise<void>}
     */
    async processStreamingResponse(response) {
        if (!response.body) {
            throw new Error('Response body not available for streaming');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        try {
            while (this.isStreaming) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                // Decode chunk and add to buffer
                buffer += decoder.decode(value, { stream: true });
                
                // Process complete lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer
                
                for (const line of lines) {
                    if (line.trim()) {
                        await this.processStreamingLine(line.trim());
                    }
                }
            }
            
            // Process any remaining buffer content
            if (buffer.trim()) {
                await this.processStreamingLine(buffer.trim());
            }
            
        } finally {
            reader.releaseLock();
        }
    }
    
    /**
     * Process individual line from streaming response
     * @param {string} line - Response line
     */
    async processStreamingLine(line) {
        try {
            // Handle Server-Sent Events format
            if (line.startsWith('data: ')) {
                const data = line.substring(6);
                if (data === '[DONE]') {
                    this.stopStreaming();
                    return;
                }
                
                const parsed = JSON.parse(data);
                if (parsed.output && parsed.output.audio) {
                    await this.processChunk(parsed.output.audio, this.playbackQueue.length);
                }
            }
        } catch (error) {
            console.error('Failed to process streaming line:', error);
        }
    }
    
    /**
     * Process DashScope streaming audio data
     * @param {Object} streamData - DashScope streaming response data
     * @returns {Promise<void>}
     */
    async processDashScopeStream(streamData) {
        this.isStreaming = true;
        this.isProcessing = true;
        
        try {
            if (streamData.output && streamData.output.audio_url) {
                // Handle audio URL format
                await this.processAudioUrl(streamData.output.audio_url);
            } else if (streamData.output && streamData.output.audio) {
                // Handle base64 audio format
                await this.processChunk(streamData.output.audio, this.playbackQueue.length);
            } else {
                console.warn('Unknown DashScope stream data format:', streamData);
            }
        } catch (error) {
            console.error('DashScope stream processing failed:', error);
            throw error;
        }
    }
    
    /**
     * Process audio from URL
     * @param {string} audioUrl - Audio URL to process
     * @returns {Promise<void>}
     */
    async processAudioUrl(audioUrl) {
        try {
            const response = await fetch(audioUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio: ${response.status}`);
            }
            
            const audioBlob = await response.blob();
            const objectUrl = URL.createObjectURL(audioBlob);
            
            this.playbackQueue.push({
                url: objectUrl,
                index: this.playbackQueue.length,
                timestamp: Date.now()
            });
            
            await this.playQueuedChunks();
        } catch (error) {
            console.error('Audio URL processing failed:', error);
            throw error;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamingProcessor;
}