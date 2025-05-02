/**
 * Advanced Bot Detection Script
 * 
 * Generates a feature vector for ML bot classification based on:
 * - Automation framework detection (Puppeteer, Selenium, Cypress)
 * - Browser fingerprinting
 * - User behavior signals
 * - WebDriver presence
 * - Crypto fingerprinting
 * - Browser API inconsistencies
 * - Hidden Unicode character detection (LLM-generated text indicators)
 */

const botDetection = (() => {
  // Store detection results
  const features = {
    // Automation frameworks
    isPuppeteer: false,
    isSelenium: false,
    isCypress: false,
    isWebDriver: false,
    isPhantomJS: false,
    
    // User interaction signals
    hasMouseMoved: false,
    hasMouseClicked: false,
    hasTouched: false,
    naturalMouseMovements: 0, // Score 0-1 based on movement patterns
    
    // Browser fingerprinting 
    hasPlugins: false,
    pluginCount: 0,
    hasInconsistentUserAgent: false,
    hasInconsistentLanguages: false,
    screenSizeAnomalies: false,
    hardwareAnomalies: false,
    
    // API inconsistencies
    hasWebDriverAPI: false,
    missingAPIs: 0,        // Count of expected APIs that are missing
    extraAPIs: 0,          // Count of unexpected APIs
    permissionInconsistencies: false,
    
    // Crypto fingerprinting
    cryptoRandom: 0,       // Measure of randomness in crypto values
    cryptoSupport: false,  // Checks if crypto APIs are properly implemented
    
    // LLM text indicators
    hiddenUnicodeChars: false, // Hidden/zero-width unicode characters in text
    hiddenUnicodeCount: 0,    // Count of suspicious unicode characters
    
    // Other signals
    headlessBrowserHints: 0, // Count of signals suggesting headless browser
    executionTimeAnomalies: false,
    hasDevToolsOpen: false,
  };
  
  // Automation framework detection
  const detectAutomationFrameworks = () => {
    // Check for Puppeteer
    features.isPuppeteer = (
      navigator.userAgent.includes('HeadlessChrome') ||
      navigator.webdriver ||
      window.navigator.plugins.length === 0 ||
      !!window._phantom ||
      !!window.callPhantom
    );
    
    // Check for Selenium WebDriver
    features.isSelenium = (
      !!window.document.documentElement.getAttribute('selenium') ||
      !!window.document.documentElement.getAttribute('webdriver') ||
      !!window.document.documentElement.getAttribute('driver') ||
      !!window._selenium ||
      !!window.$cdc_asdjflasutopfhvcZLmcfl_ ||
      !!window.$chrome_asyncScriptInfo ||
      !!window.__webdriver_script_fn
    );
    
    // Check for Cypress
    features.isCypress = (
      !!window.Cypress ||
      !!window.__cypress ||
      !!window.top.__cypress
    );
    
    // Check for WebDriver
    features.isWebDriver = (
      !!navigator.webdriver ||
      'true' === navigator.webdriver ||
      true === navigator.webdriver
    );
    
    // Check for PhantomJS
    features.isPhantomJS = (
      !!window._phantom ||
      !!window.callPhantom
    );
  };
  
  // Detect user interaction signals
  const detectUserInteraction = () => {
    let mouseMovements = [];
    let lastMousePos = { x: 0, y: 0 };
    let lastMoveTime = 0;
    
    // Track mouse movements
    document.addEventListener('mousemove', (e) => {
      features.hasMouseMoved = true;
      
      const currentTime = Date.now();
      const timeDelta = currentTime - lastMoveTime;
      
      // Store movement data for pattern analysis
      if (lastMoveTime > 0) {
        const movement = {
          x: e.clientX - lastMousePos.x,
          y: e.clientY - lastMousePos.y,
          time: timeDelta
        };
        mouseMovements.push(movement);
        
        // Keep only last 20 movements
        if (mouseMovements.length > 20) {
          mouseMovements.shift();
        }
        
        // Analyze movement patterns once we have enough data
        if (mouseMovements.length >= 10) {
          analyzeMouseMovements();
        }
      }
      
      lastMousePos = { x: e.clientX, y: e.clientY };
      lastMoveTime = currentTime;
    });
    
    // Track mouse clicks
    document.addEventListener('mousedown', () => {
      features.hasMouseClicked = true;
    });
    
    // Track touch events
    document.addEventListener('touchstart', () => {
      features.hasTouched = true;
    });
    
    // Analyze mouse movement patterns for naturalness
    const analyzeMouseMovements = () => {
      let naturalScore = 0;
      
      // Calculate variance in movement speeds (bots often have consistent speeds)
      const speeds = mouseMovements.map(m => Math.sqrt(m.x * m.x + m.y * m.y) / m.time);
      const avgSpeed = speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length;
      const speedVariance = speeds.reduce((sum, speed) => sum + Math.pow(speed - avgSpeed, 2), 0) / speeds.length;
      
      // Calculate path smoothness (bots often move in straight lines)
      let directionChanges = 0;
      for (let i = 2; i < mouseMovements.length; i++) {
        const prev = mouseMovements[i-2];
        const current = mouseMovements[i-1];
        const next = mouseMovements[i];
        
        const prevAngle = Math.atan2(current.y - prev.y, current.x - prev.x);
        const nextAngle = Math.atan2(next.y - current.y, next.x - current.x);
        const angleChange = Math.abs(nextAngle - prevAngle);
        
        if (angleChange > 0.3) { // Threshold for direction change
          directionChanges++;
        }
      }
      
      // Humans typically have higher variance and more direction changes
      const speedScore = Math.min(1, speedVariance * 100); // Higher variance = more human-like
      const directionScore = Math.min(1, directionChanges / 5); // More changes = more human-like
      
      naturalScore = (speedScore + directionScore) / 2;
      features.naturalMouseMovements = naturalScore;
    };
  };
  
  // Browser fingerprinting
  const browserFingerprinting = () => {
    // Check plugins
    try {
      features.hasPlugins = navigator.plugins.length > 0;
      features.pluginCount = navigator.plugins.length;
    } catch (e) {
      features.hasPlugins = false;
      features.pluginCount = 0;
    }
    
    // Check user agent inconsistencies
    const ua = navigator.userAgent.toLowerCase();
    features.hasInconsistentUserAgent = (
      (ua.includes('chrome') && !window.chrome) ||
      (ua.includes('firefox') && !('InstallTrigger' in window)) ||
      (ua.includes('safari') && !navigator.vendor.includes('Apple'))
    );
    
    // Language inconsistencies
    try {
      features.hasInconsistentLanguages = (
        navigator.languages.length === 0 ||
        navigator.languages[0] !== navigator.language
      );
    } catch (e) {
      features.hasInconsistentLanguages = true;
    }
    
    // Screen size anomalies
    features.screenSizeAnomalies = (
      window.screen.width < 2 ||
      window.screen.height < 2 ||
      window.outerWidth === 0 ||
      window.outerHeight === 0 ||
      window.innerWidth === 0 ||
      window.innerHeight === 0
    );
    
    // Hardware concurrency and device memory anomalies (often spoofed in headless browsers)
    features.hardwareAnomalies = (
      navigator.hardwareConcurrency === undefined ||
      navigator.hardwareConcurrency === 0 ||
      (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory === 0)
    );
  };
  
  // API inconsistency checks
  const apiInconsistencies = () => {
    // Check WebDriver API
    features.hasWebDriverAPI = (
      navigator.webdriver === true ||
      'webdriver' in navigator
    );
    
    // Expected APIs in modern browsers
    const expectedAPIs = [
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'openDatabase',
      'requestAnimationFrame',
      'Blob',
      'URL',
      'BroadcastChannel',
    ];
    
    // Count missing expected APIs
    for (const api of expectedAPIs) {
      if (!(api in window)) {
        features.missingAPIs++;
      }
    }
    
    // Unexpected APIs often found in automation environments
    const unexpectedAPIs = [
      '__nightmare',
      '__phantomas',
      '_selenium',
      'callPhantom',
      '_phantom',
      '__webdriver_evaluate',
      '__selenium_evaluate',
      '__webdriver_unwrapped',
    ];
    
    // Count unexpected APIs
    for (const api of unexpectedAPIs) {
      if (api in window) {
        features.extraAPIs++;
      }
    }
    
    // Permission inconsistencies (for modern browsers)
    if ('permissions' in navigator) {
      try {
        navigator.permissions.query({ name: 'notifications' })
          .then(status => {
            if (Notification.permission !== status.state && 
                status.state !== 'prompt') {
              features.permissionInconsistencies = true;
            }
          });
      } catch (e) {
        // Unable to check, possibly inconsistent
        features.permissionInconsistencies = true;
      }
    }
  };
  
  // Crypto-related detection
  const cryptoFingerprinting = () => {
    // Check if crypto is properly implemented
    features.cryptoSupport = (
      typeof window.crypto !== 'undefined' &&
      typeof window.crypto.subtle !== 'undefined' &&
      typeof window.crypto.getRandomValues !== 'undefined'
    );
    
    // Test randomness of crypto values
    if (features.cryptoSupport) {
      try {
        // Generate random values
        const values = new Uint32Array(10);
        window.crypto.getRandomValues(values);
        
        // Simple entropy test (count unique values)
        const uniqueValues = new Set();
        for (const val of values) {
          uniqueValues.add(val);
        }
        
        // In true random data, we'd expect most/all values to be unique
        features.cryptoRandom = uniqueValues.size / values.length;
      } catch (e) {
        features.cryptoRandom = 0;
        features.cryptoSupport = false;
      }
    }
  };
  
  // Additional headless browser checks
  const additionalHeadlessChecks = () => {
    let headlessHints = 0;
    
    // Check for Chrome headless flags
    if (/HeadlessChrome/.test(navigator.userAgent)) {
      headlessHints++;
    }
    
    // Check automation-specific properties
    if (navigator.webdriver) headlessHints++;
    if ('domAutomation' in window || 'domAutomationController' in window) headlessHints++;
    
    // Check Chrome properties
    if (window.chrome) {
      if (!window.chrome.app) headlessHints++;
      if (!window.chrome.runtime) headlessHints++;
    } else if (/chrome/i.test(navigator.userAgent)) {
      headlessHints++;
    }
    
    // Check if browser lies about plugins
    if (/chrome/i.test(navigator.userAgent) && navigator.plugins.length === 0) {
      headlessHints++;
    }
    
    // Media query for print features - headless browsers often report different values
    if (window.matchMedia('(prefers-color-scheme: dark)').matches && 
        window.matchMedia('(prefers-color-scheme: light)').matches) {
      headlessHints++;
    }
    
    // Test for broken image rendering
    const img = document.createElement('img');
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QFsLbAAAAABJRU5ErkJggg==';
    img.onerror = function() { headlessHints++; };
    
    features.headlessBrowserHints = headlessHints;
  };
  
  // Test for execution time anomalies
  const checkExecutionTimeAnomalies = () => {
    const start = performance.now();
    const iterations = 1000000;
    let temp = 0;
    
    for (let i = 0; i < iterations; i++) {
      temp += Math.sqrt(i);
    }
    
    const end = performance.now();
    const executionTime = end - start;
    
    // If execution is too fast or too slow, it might indicate throttling or debugging
    // Human users typically don't have abnormally fast/slow execution
    const expectedMinTime = 5; // minimum realistic time in ms
    const expectedMaxTime = 500; // maximum realistic time in ms
    
    features.executionTimeAnomalies = (
      executionTime < expectedMinTime || 
      executionTime > expectedMaxTime
    );
    
    return temp; // Prevent optimization
  };
  
  // Check for devtools
  const checkDevTools = () => {
    let devtoolsOpen = false;
    
    // Method 1: Size check on window resize
    const widthThreshold = 160;
    const heightThreshold = 160;
    
    if (window.outerWidth - window.innerWidth > widthThreshold ||
        window.outerHeight - window.innerHeight > heightThreshold) {
      devtoolsOpen = true;
    }
    
    // Method 2: Firebug check
    if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
      devtoolsOpen = true;
    }
    
    // Method 3: Check for Firefox devtools
    if (typeof InstallTrigger !== 'undefined') { // Firefox
      if (navigator.userAgent.indexOf('Firefox') > 0 && 
          window.outerHeight > 0 && 
          Math.abs(screen.height - window.outerHeight) > 200) {
        devtoolsOpen = true;
      }
    }
    
    features.hasDevToolsOpen = devtoolsOpen;
  };
  
  // Detect hidden Unicode characters that may indicate LLM-generated text
  const detectHiddenUnicodeCharacters = () => {
    // Scan page text content
    const textContent = document.body ? document.body.textContent || '' : '';
    
    // Regex for suspicious Unicode characters often found in LLM output
    // This includes zero-width spaces, joiners, non-joiners, soft hyphens, and other invisible characters
    const suspiciousChars = /[\u200B-\u200F\u2060-\u2064\u180E\u00AD\u034F\uFEFF\u061C\u115F\u1160\u17B4\u17B5\u3164\uFFA0]/g;
    
    // Find all matches
    const matches = textContent.match(suspiciousChars);
    const hasHiddenChars = matches !== null && matches.length > 0;
    
    features.hiddenUnicodeChars = hasHiddenChars;
    features.hiddenUnicodeCount = hasHiddenChars ? matches.length : 0;
    
    // For debugging - log found characters if any
    if (hasHiddenChars && console && console.debug) {
      console.debug('Hidden Unicode characters detected:', 
        matches.map(char => `U+${char.charCodeAt(0).toString(16).padStart(4, '0')}`));
    }
  };

  // Run all tests and return feature vector
  const runTests = () => {
    detectAutomationFrameworks();
    detectUserInteraction();
    browserFingerprinting();
    apiInconsistencies();
    cryptoFingerprinting();
    additionalHeadlessChecks();
    checkExecutionTimeAnomalies();
    checkDevTools();
    detectHiddenUnicodeCharacters();
    
    return generateFeatureVector();
  };
  
  // Convert the features object to a flat array for ML processing
  const generateFeatureVector = () => {
    return [
      // Automation frameworks (0-1 for each)
      features.isPuppeteer ? 1 : 0,
      features.isSelenium ? 1 : 0,
      features.isCypress ? 1 : 0,
      features.isWebDriver ? 1 : 0,
      features.isPhantomJS ? 1 : 0,
      
      // User interaction (0-1 for each)
      features.hasMouseMoved ? 1 : 0,
      features.hasMouseClicked ? 1 : 0,
      features.hasTouched ? 1 : 0,
      features.naturalMouseMovements, // 0-1 score
      
      // Browser fingerprinting
      features.hasPlugins ? 1 : 0,
      features.pluginCount,
      features.hasInconsistentUserAgent ? 1 : 0,
      features.hasInconsistentLanguages ? 1 : 0,
      features.screenSizeAnomalies ? 1 : 0,
      features.hardwareAnomalies ? 1 : 0,
      
      // API inconsistencies
      features.hasWebDriverAPI ? 1 : 0,
      features.missingAPIs,
      features.extraAPIs,
      features.permissionInconsistencies ? 1 : 0,
      
      // Crypto
      features.cryptoRandom, // 0-1 score
      features.cryptoSupport ? 1 : 0,
      
      // LLM text indicators
      features.hiddenUnicodeChars ? 1 : 0,
      features.hiddenUnicodeCount,
      
      // Others
      features.headlessBrowserHints,
      features.executionTimeAnomalies ? 1 : 0,
      features.hasDevToolsOpen ? 1 : 0
    ];
  };
  
  // Public API
  return {
    detectBot: runTests,
    getFeatures: () => features
  };
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = botDetection;
} else if (typeof window !== 'undefined') {
  window.botDetection = botDetection;
}
