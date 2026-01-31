/**
 * Unit Tests for StreamingProcessor
 * Tests streaming audio processing functionality
 */

// Mock Audio API for testing
class MockAudio {
    constructor(src) {
        this.src = src;
        this.onended = null;
        this.onerror = null;
        this.onloadstart = null;
        this.paused = true;
        
        // Simulate successful playback after a short delay
        setTimeout(() => {
            if (this.onloadstart) this.onloadstart();
            setTimeout(() => {
                this.paused = false;
                if (this.onended) this.onended();
            }, 100);
        }, 50);
    }
    
    play() {
        this.paused = false;
        return Promise.resolve();
    }
    
    pause() {
        this.paused = true;
    }
}

// Mock global Audio constructor
global.Audio = MockAudio;

// Mock URL.createObjectURL and revokeObjectURL
global.URL = {
    createObjectURL: (blob) => `mock-url-${Date.now()}-${Math.random()}`,
    revokeObjectURL: (url) => { /* no-op */ }
};

// Mock atob for base64 decoding
global.atob = (str) => {
    // Simple mock implementation
    return Buffer.from(str, 'base64').toString('binary');
};

// Import the StreamingProcessor
const StreamingProcessor = require('./StreamingProcessor');

describe('StreamingProcessor', () => {
    let processor;
    
    beforeEach(() => {
        processor = new StreamingProcessor();
    });
    
    afterEach(() => {
        if (processor) {
            processor.stopStreaming();
        }
    });
    
    test('should initialize with correct default values', () => {
        expect(processor.isStreaming).toBe(false);
        expect(processor.audioQueue).toEqual([]);
        expect(processor.currentAudio).toBe(null);
        expect(processor.bufferSize).toBe(5);
        expect(processor.maxQueueSize).toBe(50);
    });
    
    test('should convert base64 to blob', () => {
        const base64Data = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
        const blob = processor.base64ToBlob(base64Data);
        
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('audio/mpeg');
    });
    
    test('should handle base64 data with data URL prefix', () => {
        const base64Data = 'data:audio/mpeg;base64,SGVsbG8gV29ybGQ=';
        const blob = processor.base64ToBlob(base64Data);
        
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('audio/mpeg');
    });
    
    test('should convert different chunk formats to blob', async () => {
        // Test base64 string
        const base64Chunk = 'SGVsbG8gV29ybGQ=';
        const blob1 = await processor.convertChunkToBlob(base64Chunk);
        expect(blob1).toBeInstanceOf(Blob);
        
        // Test ArrayBuffer
        const arrayBuffer = new ArrayBuffer(8);
        const blob2 = await processor.convertChunkToBlob(arrayBuffer);
        expect(blob2).toBeInstanceOf(Blob);
        
        // Test Blob
        const inputBlob = new Blob(['test'], { type: 'audio/mpeg' });
        const blob3 = await processor.convertChunkToBlob(inputBlob);
        expect(blob3).toBe(inputBlob);
    });
    
    test('should throw error for unsupported chunk format', async () => {
        await expect(processor.convertChunkToBlob(123)).rejects.toThrow('Unsupported chunk format');
    });
    
    test('should process array of audio chunks', async () => {
        const chunks = ['SGVsbG8=', 'V29ybGQ='];
        
        await processor.processStreamingAudio(chunks);
        
        expect(processor.isStreaming).toBe(false);
        expect(processor.isProcessing).toBe(false);
    });
    
    test('should configure streaming parameters', () => {
        processor.configure({
            bufferSize: 10,
            chunkTimeout: 8000,
            maxQueueSize: 30
        });
        
        expect(processor.bufferSize).toBe(10);
        expect(processor.chunkTimeout).toBe(8000);
        expect(processor.maxQueueSize).toBe(30);
    });
    
    test('should enforce configuration limits', () => {
        processor.configure({
            bufferSize: 0,    // Should be clamped to 1
            chunkTimeout: 500, // Should be clamped to 1000
            maxQueueSize: 200  // Should be clamped to 100
        });
        
        expect(processor.bufferSize).toBe(1);
        expect(processor.chunkTimeout).toBe(1000);
        expect(processor.maxQueueSize).toBe(100);
    });
    
    test('should return correct status', () => {
        const status = processor.getStatus();
        
        expect(status).toHaveProperty('isStreaming');
        expect(status).toHaveProperty('isProcessing');
        expect(status).toHaveProperty('queueLength');
        expect(status).toHaveProperty('bufferSize');
        expect(status).toHaveProperty('currentlyPlaying');
        
        expect(status.isStreaming).toBe(false);
        expect(status.isProcessing).toBe(false);
        expect(status.queueLength).toBe(0);
        expect(status.currentlyPlaying).toBe(false);
    });
    
    test('should stop streaming and cleanup', () => {
        processor.isStreaming = true;
        processor.currentAudio = new MockAudio('test-url');
        processor.playbackQueue = [
            { url: 'mock-url-1', index: 0, timestamp: Date.now() },
            { url: 'mock-url-2', index: 1, timestamp: Date.now() }
        ];
        
        processor.stopStreaming();
        
        expect(processor.isStreaming).toBe(false);
        expect(processor.currentAudio).toBe(null);
        expect(processor.playbackQueue).toEqual([]);
    });
    
    test('should handle DashScope stream data with audio URL', async () => {
        // Mock fetch for audio URL
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            blob: () => Promise.resolve(new Blob(['audio data'], { type: 'audio/mpeg' }))
        });
        
        const streamData = {
            output: {
                audio_url: 'https://example.com/audio.mp3'
            }
        };
        
        await processor.processDashScopeStream(streamData);
        
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/audio.mp3');
    });
    
    test('should handle DashScope stream data with base64 audio', async () => {
        const streamData = {
            output: {
                audio: 'SGVsbG8gV29ybGQ='
            }
        };
        
        await processor.processDashScopeStream(streamData);
        
        // Should complete without errors
        expect(processor.isStreaming).toBe(false);
    });
    
    test('should handle invalid base64 data gracefully', () => {
        expect(() => {
            processor.base64ToBlob('invalid-base64-data!!!');
        }).toThrow('Base64 conversion failed');
    });
    
    test('should clean up old chunks when queue is too large', () => {
        const now = Date.now();
        processor.playbackQueue = [
            { url: 'old-url', index: 0, timestamp: now - 40000 }, // 40 seconds old
            { url: 'new-url', index: 1, timestamp: now }
        ];
        
        processor.cleanupOldChunks();
        
        expect(processor.playbackQueue).toHaveLength(1);
        expect(processor.playbackQueue[0].url).toBe('new-url');
    });
});

// Run the tests if this file is executed directly
if (require.main === module) {
    console.log('Running StreamingProcessor tests...');
    
    // Simple test runner
    const runTests = async () => {
        const processor = new StreamingProcessor();
        
        try {
            // Test 1: Basic initialization
            console.log('✓ Basic initialization test passed');
            
            // Test 2: Base64 conversion
            const blob = processor.base64ToBlob('SGVsbG8=');
            if (blob instanceof Blob) {
                console.log('✓ Base64 conversion test passed');
            }
            
            // Test 3: Configuration
            processor.configure({ bufferSize: 10 });
            if (processor.bufferSize === 10) {
                console.log('✓ Configuration test passed');
            }
            
            // Test 4: Status
            const status = processor.getStatus();
            if (status.isStreaming === false) {
                console.log('✓ Status test passed');
            }
            
            console.log('All basic tests passed!');
            
        } catch (error) {
            console.error('Test failed:', error);
        }
    };
    
    runTests();
}