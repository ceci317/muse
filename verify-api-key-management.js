#!/usr/bin/env node

/**
 * Verification script for API key management functionality
 * This script tests the core API key management features without requiring a browser
 */

// Mock browser environment
global.localStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; }
};

global.btoa = function(str) { return Buffer.from(str).toString('base64'); };
global.atob = function(str) { return Buffer.from(str, 'base64').toString(); };

// Mock fetch for testing
global.fetch = async function(url, options) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Mock different responses based on API key
    const authHeader = options.headers?.Authorization || '';
    const apiKey = authHeader.replace('Bearer ', '');
    
    if (!apiKey) {
        return { ok: false, status: 401, text: async () => 'No API key' };
    }
    
    if (apiKey === 'valid-test-key') {
        return { ok: true, status: 200, json: async () => ({ output: { audio_url: 'test.mp3' } }) };
    }
    
    if (apiKey === 'invalid-test-key') {
        return { ok: false, status: 401, text: async () => 'Invalid API key' };
    }
    
    // Default to network error for unknown keys
    return { ok: false, status: 500, text: async () => 'Server error' };
};

// Load the modules
const TTSConfig = require('./js/tts/TTSConfig.js');
const DashScopeEngine = require('./js/tts/DashScopeEngine.js');

async function runTests() {
    console.log('🧪 Running API Key Management Verification Tests\n');
    
    let passed = 0;
    let total = 0;
    
    function test(name, testFn) {
        total++;
        try {
            const result = testFn();
            if (result instanceof Promise) {
                return result.then(success => {
                    if (success !== false) {
                        console.log(`✅ ${name}`);
                        passed++;
                    } else {
                        console.log(`❌ ${name}: Test returned false`);
                    }
                }).catch(error => {
                    console.log(`❌ ${name}: ${error.message}`);
                });
            } else if (result !== false) {
                console.log(`✅ ${name}`);
                passed++;
            } else {
                console.log(`❌ ${name}: Test returned false`);
            }
        } catch (error) {
            console.log(`❌ ${name}: ${error.message}`);
        }
    }
    
    // Test 1: TTSConfig API key encoding/decoding
    await test('TTSConfig API key encoding/decoding', () => {
        const config = new TTSConfig();
        const testKey = 'test-api-key-12345';
        
        const encoded = config.encodeApiKey(testKey);
        const decoded = config.decodeApiKey(encoded);
        
        if (!encoded.startsWith('enc_')) {
            throw new Error('Encoded key should start with enc_');
        }
        
        if (decoded !== testKey) {
            throw new Error(`Decoded key mismatch: expected ${testKey}, got ${decoded}`);
        }
        
        return true;
    });
    
    // Test 2: TTSConfig secure storage
    await test('TTSConfig secure storage', () => {
        const config = new TTSConfig();
        const testKey = 'secure-test-key';
        
        config.save('dashscopeApiKey', testKey);
        const retrieved = config.get('dashscopeApiKey');
        
        if (retrieved !== testKey) {
            throw new Error(`Retrieved key mismatch: expected ${testKey}, got ${retrieved}`);
        }
        
        // Check that it's stored encoded
        const rawStored = config.data.dashscopeApiKey;
        if (!rawStored.startsWith('enc_')) {
            throw new Error('API key should be stored encoded');
        }
        
        return true;
    });
    
    // Test 3: TTSConfig security status
    await test('TTSConfig security status', () => {
        const config = new TTSConfig();
        
        // Initially no key
        if (config.isApiKeySecure()) {
            throw new Error('Should not be secure without API key');
        }
        
        // Set a key
        config.save('dashscopeApiKey', 'test-key');
        
        if (!config.isApiKeySecure()) {
            throw new Error('Should be secure with encoded API key');
        }
        
        return true;
    });
    
    // Test 4: DashScopeEngine API key format validation
    await test('DashScopeEngine API key format validation', () => {
        const engine = new DashScopeEngine();
        
        // Valid formats
        if (!engine.isValidApiKeyFormat('valid-api-key-12345')) {
            throw new Error('Should accept valid format');
        }
        
        // Invalid formats
        if (engine.isValidApiKeyFormat('short')) {
            throw new Error('Should reject short keys');
        }
        
        if (engine.isValidApiKeyFormat('key with spaces')) {
            throw new Error('Should reject keys with spaces');
        }
        
        if (engine.isValidApiKeyFormat(null)) {
            throw new Error('Should reject null keys');
        }
        
        return true;
    });
    
    // Test 5: DashScopeEngine API key validation with mock network
    await test('DashScopeEngine API key validation with mock network', async () => {
        const engine = new DashScopeEngine();
        
        // Test with no API key
        const noKeyResult = await engine.validateApiKey();
        if (noKeyResult.isValid) {
            throw new Error('Should be invalid with no API key');
        }
        
        // Test with valid API key
        engine.setApiKey('valid-test-key');
        const validResult = await engine.validateApiKey();
        if (!validResult.isValid) {
            throw new Error(`Should be valid with valid API key: ${validResult.error}`);
        }
        
        // Test with invalid API key
        engine.setApiKey('invalid-test-key');
        const invalidResult = await engine.validateApiKey();
        if (invalidResult.isValid) {
            throw new Error('Should be invalid with invalid API key');
        }
        
        return true;
    });
    
    // Test 6: DashScopeEngine availability
    await test('DashScopeEngine availability', () => {
        const engine = new DashScopeEngine();
        
        // Initially not available
        if (engine.isAvailable()) {
            throw new Error('Should not be available without API key');
        }
        
        // Set API key
        engine.setApiKey('test-key');
        if (!engine.isAvailable()) {
            throw new Error('Should be available with API key');
        }
        
        // Clear API key
        engine.setApiKey(null);
        if (engine.isAvailable()) {
            throw new Error('Should not be available after clearing API key');
        }
        
        return true;
    });
    
    // Test 7: Configuration validation
    await test('Configuration validation', () => {
        const config = new TTSConfig();
        
        // Valid configuration
        config.data.engine = 'web-speech';
        config.data.dashscopeApiKey = null;
        const validResult = config.validate();
        if (!validResult.isValid) {
            throw new Error('Should be valid for web-speech without API key');
        }
        
        // Invalid configuration - DashScope without API key
        config.data.engine = 'dashscope';
        config.data.dashscopeApiKey = null;
        const invalidResult = config.validate();
        if (invalidResult.isValid) {
            throw new Error('Should be invalid for DashScope without API key');
        }
        
        // Valid configuration - DashScope with API key
        config.data.dashscopeApiKey = 'test-key';
        const validWithKeyResult = config.validate();
        if (!validWithKeyResult.isValid) {
            throw new Error('Should be valid for DashScope with API key');
        }
        
        return true;
    });
    
    // Test 8: Backward compatibility
    await test('Backward compatibility with unencoded keys', () => {
        const config = new TTSConfig();
        
        // Simulate old unencoded key in storage
        config.data.dashscopeApiKey = 'plain-text-key';
        
        const retrieved = config.get('dashscopeApiKey');
        if (retrieved !== 'plain-text-key') {
            throw new Error('Should handle unencoded keys for backward compatibility');
        }
        
        return true;
    });
    
    // Wait for all async tests to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 All API key management tests passed!');
        console.log('\n✨ API key management functionality is working correctly:');
        console.log('   • API keys are encoded for basic security');
        console.log('   • Format validation prevents obviously invalid keys');
        console.log('   • Network validation confirms key authenticity');
        console.log('   • Configuration validation ensures proper setup');
        console.log('   • Backward compatibility with existing keys');
        return true;
    } else {
        console.log('❌ Some tests failed - API key management needs attention');
        return false;
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = { runTests };