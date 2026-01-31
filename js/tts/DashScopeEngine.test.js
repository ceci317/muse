/**
 * Unit Tests for DashScopeEngine
 * Tests the DashScope TTS API adapter functionality
 */

// Mock fetch for testing
class MockFetch {
    constructor() {
        this.mockResponses = new Map();
        this.lastRequest = null;
    }
    
    setMockResponse(url, response) {
        this.mockResponses.set(url, response);
    }
    
    async fetch(url, options) {
        this.lastRequest = { url, options };
        
        const mockResponse = this.mockResponses.get(url);
        if (mockResponse) {
            return {
                ok: mockResponse.ok !== false,
                status: mockResponse.status || 200,
                json: async () => mockResponse.data || {},
                text: async () => mockResponse.text || ''
            };
        }
        
        // Default successful response
        return {
            ok: true,
            status: 200,
            json: async () => ({
                output: {
                    audio_url: 'https://example.com/audio.mp3'
                }
            })
        };
    }
}

// Mock Audio for testing
class MockAudio {
    constructor(src) {
        this.src = src;
        this.paused = true;
        this.currentTime = 0;
        this.onended = null;
        this.onerror = null;
        this.onloadstart = null;
    }
    
    async play() {
        this.paused = false;
        if (this.onloadstart) this.onloadstart();
        
        // Simulate audio playback
        setTimeout(() => {
            this.paused = true;
            if (this.onended) this.onended();
        }, 50);
    }
    
    pause() {
        this.paused = true;
    }
}

// Setup mock environment
function setupMockEnvironment() {
    const mockFetch = new MockFetch();
    
    global.fetch = mockFetch.fetch.bind(mockFetch);
    global.Audio = MockAudio;
    global.URL = {
        createObjectURL: (blob) => 'blob:mock-url',
        revokeObjectURL: (url) => {}
    };
    global.atob = (str) => str; // Simple mock for base64 decoding
    global.Blob = class MockBlob {
        constructor(data, options) {
            this.data = data;
            this.type = options?.type || '';
        }
    };
    global.Uint8Array = Array; // Simple mock
    
    return mockFetch;
}

// Test suite
function runDashScopeEngineTests() {
    console.log('Running DashScopeEngine Tests...\n');
    
    const mockFetch = setupMockEnvironment();
    
    // Import the DashScopeEngine class
    const DashScopeEngine = require('./DashScopeEngine.js');
    
    let testsPassed = 0;
    let testsTotal = 0;
    
    function test(name, testFn) {
        testsTotal++;
        return new Promise(async (resolve) => {
            try {
                await testFn();
                console.log(`✅ ${name}`);
                testsPassed++;
                resolve(true);
            } catch (error) {
                console.log(`❌ ${name}: ${error.message}`);
                resolve(false);
            }
        });
    }
    
    async function runTests() {
        // Test 1: Constructor initializes correctly
        await test('Constructor initializes correctly', async () => {
            const engine = new DashScopeEngine();
            
            if (engine.name !== 'dashscope') {
                throw new Error('Engine name should be "dashscope"');
            }
            
            if (engine.displayName !== 'DashScope TTS') {
                throw new Error('Display name should be "DashScope TTS"');
            }
            
            if (!engine.voiceMap.yushao || !engine.voiceMap.shaonian || !engine.voiceMap.dashu) {
                throw new Error('All three voice configurations should be present');
            }
            
            if (engine.baseUrl !== 'https://dashscope.aliyuncs.com/api/v1') {
                throw new Error('Base URL should be correct');
            }
        });
        
        // Test 2: Voice mapping configuration
        await test('Voice mapping configuration is correct', async () => {
            const engine = new DashScopeEngine();
            
            // Test voice mappings
            if (engine.voiceMap.yushao.voice !== 'Ethan') {
                throw new Error('Yushao should map to Ethan');
            }
            
            if (engine.voiceMap.shaonian.voice !== 'Cherry') {
                throw new Error('Shaonian should map to Cherry');
            }
            
            if (engine.voiceMap.dashu.voice !== 'Dylan') {
                throw new Error('Dashu should map to Dylan');
            }
        });
        
        // Test 3: API key management
        await test('API key management works correctly', async () => {
            const engine = new DashScopeEngine();
            
            // Initially no API key
            if (engine.isAvailable()) {
                throw new Error('Should not be available without API key');
            }
            
            // Set API key
            engine.setApiKey('test-api-key-12345');
            
            if (!engine.isAvailable()) {
                throw new Error('Should be available with API key');
            }
            
            if (engine.apiKey !== 'test-api-key-12345') {
                throw new Error('API key should be stored correctly');
            }
        });
        
        // Test 4: getAvailableVoices returns correct format
        await test('getAvailableVoices returns correct format', async () => {
            const engine = new DashScopeEngine();
            const voices = engine.getAvailableVoices();
            
            if (!Array.isArray(voices) || voices.length !== 3) {
                throw new Error('Should return array of 3 voices');
            }
            
            const voice = voices[0];
            if (!voice.id || !voice.name || !voice.description || !voice.engine) {
                throw new Error('Voice object should have id, name, description, and engine properties');
            }
            
            if (voice.engine !== 'dashscope') {
                throw new Error('Voice engine should be "dashscope"');
            }
            
            // Check that voice names include DashScope voice names
            const yushavoice = voices.find(v => v.id === 'yushao');
            if (!yushavoice.name.includes('Ethan')) {
                throw new Error('Yushao voice name should include Ethan');
            }
        });
        
        // Test 5: getCapabilities returns expected structure
        await test('getCapabilities returns expected structure', async () => {
            const engine = new DashScopeEngine();
            const capabilities = engine.getCapabilities();
            
            if (capabilities.streaming !== true) {
                throw new Error('DashScope should support streaming');
            }
            
            if (!Array.isArray(capabilities.languages)) {
                throw new Error('Languages should be an array');
            }
            
            if (typeof capabilities.maxTextLength !== 'number') {
                throw new Error('maxTextLength should be a number');
            }
            
            if (capabilities.requiresApiKey !== true) {
                throw new Error('Should require API key');
            }
        });
        
        // Test 6: validateOptions method
        await test('validateOptions validates correctly', async () => {
            const engine = new DashScopeEngine();
            
            // Valid options
            const validResult = engine.validateOptions({ voice: 'yushao', speed: 1.0, volume: 50 });
            if (!validResult.isValid) {
                throw new Error('Valid options should pass validation');
            }
            
            // Invalid voice
            const invalidVoice = engine.validateOptions({ voice: 'invalid' });
            if (invalidVoice.isValid) {
                throw new Error('Invalid voice should fail validation');
            }
            
            // Invalid speed
            const invalidSpeed = engine.validateOptions({ speed: 15 });
            if (invalidSpeed.isValid) {
                throw new Error('Invalid speed should fail validation');
            }
            
            // Invalid volume
            const invalidVolume = engine.validateOptions({ volume: 150 });
            if (invalidVolume.isValid) {
                throw new Error('Invalid volume should fail validation');
            }
        });
        
        // Test 7: API key validation
        await test('API key validation works', async () => {
            const engine = new DashScopeEngine();
            
            // No API key
            const noKeyResult = await engine.validateApiKey();
            if (noKeyResult.isValid !== false) {
                throw new Error('Should return false for no API key');
            }
            
            // Set API key and mock successful response
            engine.setApiKey('test-key');
            mockFetch.setMockResponse(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2speech/speech-synthesis',
                { ok: true, status: 200 }
            );
            
            const validKeyResult = await engine.validateApiKey();
            if (validKeyResult.isValid !== true) {
                throw new Error('Should return true for valid API key');
            }
        });
        
        // Test 8: Synthesis with audio URL response
        await test('Synthesis with audio URL response works', async () => {
            const engine = new DashScopeEngine();
            engine.setApiKey('test-key');
            
            // Mock successful API response with audio URL
            mockFetch.setMockResponse(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2speech/speech-synthesis',
                {
                    ok: true,
                    status: 200,
                    data: {
                        output: {
                            audio_url: 'https://example.com/audio.mp3'
                        }
                    }
                }
            );
            
            // Should complete without error
            await engine.synthesize('Test text', { voice: 'yushao' });
            
            // Check that correct API call was made
            const request = mockFetch.lastRequest;
            if (!request) {
                throw new Error('API request should have been made');
            }
            
            const body = JSON.parse(request.options.body);
            if (body.model !== 'qwen3-tts-flash') {
                throw new Error('Should use correct model');
            }
            
            if (body.parameters.voice !== 'Ethan') {
                throw new Error('Should map yushao to Ethan voice');
            }
        });
        
        // Test 9: Synthesis with base64 audio response
        await test('Synthesis with base64 audio response works', async () => {
            const engine = new DashScopeEngine();
            engine.setApiKey('test-key');
            
            // Mock successful API response with base64 audio
            mockFetch.setMockResponse(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2speech/speech-synthesis',
                {
                    ok: true,
                    status: 200,
                    data: {
                        output: {
                            audio: 'base64-audio-data'
                        }
                    }
                }
            );
            
            // Should complete without error
            await engine.synthesize('Test text', { voice: 'shaonian' });
            
            // Check that correct voice mapping was used
            const request = mockFetch.lastRequest;
            const body = JSON.parse(request.options.body);
            if (body.parameters.voice !== 'Cherry') {
                throw new Error('Should map shaonian to Cherry voice');
            }
        });
        
        // Test 10: Error handling for API failures
        await test('Error handling for API failures works', async () => {
            const engine = new DashScopeEngine();
            engine.setApiKey('test-key');
            
            // Mock API error response
            mockFetch.setMockResponse(
                'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2speech/speech-synthesis',
                {
                    ok: false,
                    status: 401,
                    text: 'Unauthorized'
                }
            );
            
            try {
                await engine.synthesize('Test text');
                throw new Error('Should have thrown an error');
            } catch (error) {
                if (!error.message.includes('DashScope API error')) {
                    throw new Error('Should throw DashScope API error');
                }
            }
        });
        
        // Test 11: Error handling for missing API key
        await test('Error handling for missing API key works', async () => {
            const engine = new DashScopeEngine();
            
            try {
                await engine.synthesize('Test text');
                throw new Error('Should have thrown an error');
            } catch (error) {
                if (!error.message.includes('API key not configured')) {
                    throw new Error('Should throw API key error');
                }
            }
        });
        
        // Test 12: Stop functionality
        await test('Stop functionality works', async () => {
            const engine = new DashScopeEngine();
            
            // Should not throw error
            engine.stop();
            
            if (engine.currentAudio !== null) {
                throw new Error('currentAudio should be null after stop');
            }
        });
        
        // Test 13: getStatus method
        await test('getStatus method works correctly', async () => {
            const engine = new DashScopeEngine();
            const status = engine.getStatus();
            
            if (typeof status.isPlaying !== 'boolean') {
                throw new Error('isPlaying should be boolean');
            }
            
            if (typeof status.apiKeyConfigured !== 'boolean') {
                throw new Error('apiKeyConfigured should be boolean');
            }
            
            // Test with API key
            engine.setApiKey('test-key');
            const statusWithKey = engine.getStatus();
            if (!statusWithKey.apiKeyConfigured) {
                throw new Error('Should show API key as configured');
            }
        });
        
        // Summary
        console.log(`\nTest Results: ${testsPassed}/${testsTotal} tests passed`);
        
        if (testsPassed === testsTotal) {
            console.log('🎉 All tests passed!');
            return true;
        } else {
            console.log('❌ Some tests failed');
            return false;
        }
    }
    
    return runTests();
}

// Run tests if this file is executed directly
if (require.main === module) {
    runDashScopeEngineTests();
}

module.exports = { runDashScopeEngineTests };