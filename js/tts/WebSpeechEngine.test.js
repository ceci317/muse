/**
 * Unit Tests for WebSpeechEngine
 * Tests the Web Speech API adapter functionality
 */

// Mock Web Speech API for testing
class MockSpeechSynthesis {
    constructor() {
        this.speaking = false;
        this.paused = false;
        this.pending = false;
        this.onvoiceschanged = null;
        this.mockVoices = [
            { name: 'Chinese Voice', lang: 'zh-CN' },
            { name: 'English Voice', lang: 'en-US' }
        ];
    }
    
    speak(utterance) {
        this.speaking = true;
        setTimeout(() => {
            this.speaking = false;
            if (utterance.onend) utterance.onend();
        }, 100);
    }
    
    cancel() {
        this.speaking = false;
    }
    
    getVoices() {
        return this.mockVoices;
    }
}

class MockSpeechSynthesisUtterance {
    constructor(text) {
        this.text = text;
        this.lang = 'zh-CN';
        this.pitch = 1;
        this.rate = 1;
        this.volume = 1;
        this.onend = null;
        this.onerror = null;
        this.onstart = null;
    }
}

// Setup mock environment
function setupMockEnvironment() {
    global.window = {
        speechSynthesis: new MockSpeechSynthesis(),
        SpeechSynthesisUtterance: MockSpeechSynthesisUtterance
    };
}

// Test suite
function runWebSpeechEngineTests() {
    console.log('Running WebSpeechEngine Tests...\n');
    
    setupMockEnvironment();
    
    // Import the WebSpeechEngine class
    const WebSpeechEngine = require('./WebSpeechEngine.js');
    
    let testsPassed = 0;
    let testsTotal = 0;
    
    function test(name, testFn) {
        testsTotal++;
        try {
            testFn();
            console.log(`✅ ${name}`);
            testsPassed++;
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
        }
    }
    
    // Test 1: Constructor initializes correctly
    test('Constructor initializes correctly', () => {
        const engine = new WebSpeechEngine();
        
        if (engine.name !== 'web-speech') {
            throw new Error('Engine name should be "web-speech"');
        }
        
        if (engine.displayName !== 'Web Speech API') {
            throw new Error('Display name should be "Web Speech API"');
        }
        
        if (!engine.voiceMap.yushao || !engine.voiceMap.shaonian || !engine.voiceMap.dashu) {
            throw new Error('All three voice configurations should be present');
        }
    });
    
    // Test 2: Voice configuration mapping
    test('Voice configuration mapping is correct', () => {
        const engine = new WebSpeechEngine();
        
        // Test yushao voice config
        const yushao = engine.voiceMap.yushao;
        if (yushao.pitch !== 0.7 || yushao.rate !== 0.8) {
            throw new Error('Yushao voice config is incorrect');
        }
        
        // Test shaonian voice config
        const shaonian = engine.voiceMap.shaonian;
        if (shaonian.pitch !== 1.2 || shaonian.rate !== 1.0) {
            throw new Error('Shaonian voice config is incorrect');
        }
        
        // Test dashu voice config
        const dashu = engine.voiceMap.dashu;
        if (dashu.pitch !== 0.5 || dashu.rate !== 0.85) {
            throw new Error('Dashu voice config is incorrect');
        }
    });
    
    // Test 3: getAvailableVoices returns correct format
    test('getAvailableVoices returns correct format', () => {
        const engine = new WebSpeechEngine();
        const voices = engine.getAvailableVoices();
        
        if (!Array.isArray(voices) || voices.length !== 3) {
            throw new Error('Should return array of 3 voices');
        }
        
        const voice = voices[0];
        if (!voice.id || !voice.name || !voice.description || !voice.engine) {
            throw new Error('Voice object should have id, name, description, and engine properties');
        }
        
        if (voice.engine !== 'web-speech') {
            throw new Error('Voice engine should be "web-speech"');
        }
    });
    
    // Test 4: isAvailable method
    test('isAvailable method works correctly', () => {
        const engine = new WebSpeechEngine();
        
        if (!engine.isAvailable()) {
            throw new Error('Should return true when speechSynthesis is available');
        }
    });
    
    // Test 5: getCapabilities returns expected structure
    test('getCapabilities returns expected structure', () => {
        const engine = new WebSpeechEngine();
        const capabilities = engine.getCapabilities();
        
        if (capabilities.streaming !== false) {
            throw new Error('Web Speech should not support streaming');
        }
        
        if (!Array.isArray(capabilities.languages)) {
            throw new Error('Languages should be an array');
        }
        
        if (typeof capabilities.maxTextLength !== 'number') {
            throw new Error('maxTextLength should be a number');
        }
    });
    
    // Test 6: validateOptions method
    test('validateOptions validates correctly', () => {
        const engine = new WebSpeechEngine();
        
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
    });
    
    // Test 7: Synthesis with different voice options
    test('Synthesis applies voice configurations correctly', async () => {
        const engine = new WebSpeechEngine();
        
        // Test that synthesis completes without error
        try {
            await engine.synthesize('Test text', { voice: 'yushao' });
            await engine.synthesize('Test text', { voice: 'shaonian' });
            await engine.synthesize('Test text', { voice: 'dashu' });
        } catch (error) {
            throw new Error(`Synthesis should not throw error: ${error.message}`);
        }
    });
    
    // Test 8: Stop functionality
    test('Stop functionality works', () => {
        const engine = new WebSpeechEngine();
        
        // Should not throw error
        engine.stop();
        
        if (engine.currentUtterance !== null) {
            throw new Error('currentUtterance should be null after stop');
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

// Run tests if this file is executed directly
if (require.main === module) {
    runWebSpeechEngineTests();
}

module.exports = { runWebSpeechEngineTests };