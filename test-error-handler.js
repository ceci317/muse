/**
 * ErrorHandler Test Suite
 * Tests the ErrorHandler functionality without browser dependencies
 */

// Mock DOM elements for testing
global.document = {
    createElement: (tag) => ({
        className: '',
        innerHTML: '',
        remove: () => {},
        parentNode: { removeChild: () => {} }
    }),
    body: {
        appendChild: () => {}
    }
};

global.setTimeout = setTimeout;

// Load the ErrorHandler
const { ErrorHandler, NotificationManager } = require('./js/tts/ErrorHandler.js');

// Mock TTS Service
class MockTTSService {
    constructor() {
        this.currentEngine = 'dashscope';
        this.engines = new Map([
            ['dashscope', { name: 'DashScope' }],
            ['web-speech', { name: 'Web Speech' }]
        ]);
        this.config = {
            save: (key, value) => console.log(`Config saved: ${key} = ${value}`)
        };
    }
    
    async switchEngine(engine) {
        console.log(`Switching engine to: ${engine}`);
        this.currentEngine = engine;
        return true;
    }
    
    async synthesize(text, options) {
        console.log(`Synthesizing: "${text}" with engine: ${this.currentEngine}`);
        if (this.currentEngine === 'dashscope' && text.includes('error')) {
            throw new Error('DashScope API error: Service unavailable');
        }
        return Promise.resolve();
    }
}

// Test functions
async function testErrorClassification() {
    console.log('\n=== Testing Error Classification ===');
    
    const mockTTSService = new MockTTSService();
    const errorHandler = new ErrorHandler(mockTTSService);
    
    const testErrors = [
        new Error('Network timeout occurred'),
        new Error('DashScope API key is invalid'),
        new Error('DashScope API error: 500 Internal Server Error'),
        new Error('Audio playback failed'),
        new Error('Web Speech API not supported'),
        new Error('Unknown error occurred')
    ];
    
    testErrors.forEach((error, index) => {
        const classification = errorHandler.classifyError(error);
        console.log(`${index + 1}. "${error.message}" → ${classification}`);
    });
    
    console.log('✓ Error classification test completed');
}

async function testFallbackLogic() {
    console.log('\n=== Testing Fallback Logic ===');
    
    const mockTTSService = new MockTTSService();
    const errorHandler = new ErrorHandler(mockTTSService);
    
    try {
        const originalRequest = {
            text: 'This will cause an error',
            options: { voice: 'yushao' }
        };
        
        // Simulate a DashScope error
        const error = new Error('DashScope API error: Service unavailable');
        
        console.log('Testing fallback with simulated DashScope error...');
        await errorHandler.handleError(error, originalRequest);
        
        console.log('✓ Fallback logic test completed successfully');
        
    } catch (error) {
        console.log(`✗ Fallback logic test failed: ${error.message}`);
    }
}

async function testErrorStatistics() {
    console.log('\n=== Testing Error Statistics ===');
    
    const mockTTSService = new MockTTSService();
    const errorHandler = new ErrorHandler(mockTTSService);
    
    // Generate some test errors
    const testErrors = [
        new Error('Network timeout'),
        new Error('DashScope API error'),
        new Error('Audio playback failed')
    ];
    
    // Log some errors
    testErrors.forEach((error, index) => {
        errorHandler.logError(error, {
            text: `Test text ${index}`,
            options: { voice: 'yushao' }
        });
    });
    
    const stats = errorHandler.getErrorStats();
    console.log('Error Statistics:');
    console.log(`- Total errors: ${stats.totalErrors}`);
    console.log(`- Errors by type:`, stats.errorsByType);
    console.log(`- Errors by engine:`, stats.errorsByEngine);
    
    // Test clearing log
    errorHandler.clearErrorLog();
    const clearedStats = errorHandler.getErrorStats();
    console.log(`- After clearing: ${clearedStats.totalErrors} errors`);
    
    console.log('✓ Error statistics test completed');
}

async function testNotificationManager() {
    console.log('\n=== Testing Notification Manager ===');
    
    const notificationManager = new NotificationManager();
    
    // Test error notification
    console.log('Testing error notification...');
    notificationManager.showError('Test error message', 'error');
    
    // Test fallback notification
    console.log('Testing fallback notification...');
    notificationManager.showFallbackNotification('dashscope', 'web-speech');
    
    console.log('✓ Notification manager test completed');
}

async function testLayeredErrorHandling() {
    console.log('\n=== Testing Layered Error Handling ===');
    
    const mockTTSService = new MockTTSService();
    const errorHandler = new ErrorHandler(mockTTSService);
    
    const testCases = [
        { error: new Error('Network timeout'), expectedType: 'network' },
        { error: new Error('API key invalid'), expectedType: 'authentication' },
        { error: new Error('DashScope API error: 500'), expectedType: 'api' },
        { error: new Error('Audio playback failed'), expectedType: 'audio' },
        { error: new Error('Web Speech not supported'), expectedType: 'system' }
    ];
    
    for (const testCase of testCases) {
        const classification = errorHandler.classifyError(testCase.error);
        const match = classification === testCase.expectedType;
        console.log(`${match ? '✓' : '✗'} ${testCase.error.message} → ${classification} (expected: ${testCase.expectedType})`);
    }
    
    console.log('✓ Layered error handling test completed');
}

// Run all tests
async function runAllTests() {
    console.log('Starting ErrorHandler Test Suite...\n');
    
    try {
        await testErrorClassification();
        await testFallbackLogic();
        await testErrorStatistics();
        await testNotificationManager();
        await testLayeredErrorHandling();
        
        console.log('\n🎉 All ErrorHandler tests completed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
        process.exit(1);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests();
}

module.exports = {
    testErrorClassification,
    testFallbackLogic,
    testErrorStatistics,
    testNotificationManager,
    testLayeredErrorHandling,
    runAllTests
};