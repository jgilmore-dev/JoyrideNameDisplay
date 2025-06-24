const { testNetworkConnectivity, handleNetworkError, retryOperation, validateConnection } = require('../utils.js');

// Mock network functions
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Network Resilience - Connectivity Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('detects successful network connection', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ok' })
    });

    const result = await testNetworkConnectivity('https://api.example.com');
    expect(result.connected).toBe(true);
    expect(result.latency).toBeGreaterThan(0);
  });

  test('detects network timeout', async () => {
    mockFetch.mockRejectedValue(new Error('timeout'));

    const result = await testNetworkConnectivity('https://api.example.com');
    expect(result.connected).toBe(false);
    expect(result.error).toContain('timeout');
  });

  test('detects DNS resolution failure', async () => {
    mockFetch.mockRejectedValue(new Error('ENOTFOUND'));

    const result = await testNetworkConnectivity('https://nonexistent.example.com');
    expect(result.connected).toBe(false);
    expect(result.error).toContain('ENOTFOUND');
  });

  test('detects server errors', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const result = await testNetworkConnectivity('https://api.example.com');
    expect(result.connected).toBe(false);
    expect(result.error).toContain('500');
  });

  test('handles multiple endpoint testing', async () => {
    const endpoints = [
      'https://api1.example.com',
      'https://api2.example.com',
      'https://api3.example.com'
    ];

    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const results = await Promise.all(
      endpoints.map(endpoint => testNetworkConnectivity(endpoint))
    );

    expect(results[0].connected).toBe(true);
    expect(results[1].connected).toBe(false);
    expect(results[2].connected).toBe(true);
  });
});

describe('Network Resilience - Error Handling', () => {
  test('handles connection refused errors', () => {
    const error = new Error('ECONNREFUSED');
    const result = handleNetworkError(error);
    
    expect(result.type).toBe('connection_refused');
    expect(result.retryable).toBe(true);
    expect(result.message).toContain('Connection refused');
  });

  test('handles timeout errors', () => {
    const error = new Error('ETIMEDOUT');
    const result = handleNetworkError(error);
    
    expect(result.type).toBe('timeout');
    expect(result.retryable).toBe(true);
    expect(result.message).toContain('Request timed out');
  });

  test('handles DNS resolution errors', () => {
    const error = new Error('ENOTFOUND');
    const result = handleNetworkError(error);
    
    expect(result.type).toBe('dns_error');
    expect(result.retryable).toBe(false);
    expect(result.message).toContain('DNS resolution failed');
  });

  test('handles SSL certificate errors', () => {
    const error = new Error('CERT_HAS_EXPIRED');
    const result = handleNetworkError(error);
    
    expect(result.type).toBe('ssl_error');
    expect(result.retryable).toBe(false);
    expect(result.message).toContain('SSL certificate error');
  });

  test('handles rate limiting errors', () => {
    const error = new Error('RATE_LIMIT_EXCEEDED');
    error.status = 429;
    const result = handleNetworkError(error);
    
    expect(result.type).toBe('rate_limit');
    expect(result.retryable).toBe(true);
    expect(result.message).toContain('Rate limit exceeded');
  });

  test('handles server errors', () => {
    const error = new Error('INTERNAL_SERVER_ERROR');
    error.status = 500;
    const result = handleNetworkError(error);
    
    expect(result.type).toBe('server_error');
    expect(result.retryable).toBe(true);
    expect(result.message).toContain('Server error');
  });

  test('handles unknown errors', () => {
    const error = new Error('UNKNOWN_ERROR');
    const result = handleNetworkError(error);
    
    expect(result.type).toBe('unknown');
    expect(result.retryable).toBe(false);
    expect(result.message).toContain('Unknown network error');
  });
});

describe('Network Resilience - Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retries failed operations successfully', async () => {
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce('success');

    const result = await retryOperation(operation, { maxRetries: 3, delay: 100 });
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  test('fails after max retries', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('permanent failure'));

    await expect(retryOperation(operation, { maxRetries: 3, delay: 100 }))
      .rejects.toThrow('permanent failure');
    
    expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries
  });

  test('respects retry delay', async () => {
    jest.useFakeTimers();
    
    const operation = jest.fn()
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce('success');

    const retryPromise = retryOperation(operation, { maxRetries: 1, delay: 1000 });
    
    expect(operation).toHaveBeenCalledTimes(1);
    
    jest.advanceTimersByTime(1000);
    await retryPromise;
    
    expect(operation).toHaveBeenCalledTimes(2);
    
    jest.useRealTimers();
  });

  test('implements exponential backoff', async () => {
    jest.useFakeTimers();
    
    const operation = jest.fn()
      .mockRejectedValue(new Error('temporary failure'));

    const retryPromise = retryOperation(operation, { 
      maxRetries: 3, 
      delay: 100, 
      exponentialBackoff: true 
    });
    
    // First retry after 100ms
    jest.advanceTimersByTime(100);
    expect(operation).toHaveBeenCalledTimes(2);
    
    // Second retry after 200ms
    jest.advanceTimersByTime(200);
    expect(operation).toHaveBeenCalledTimes(3);
    
    // Third retry after 400ms
    jest.advanceTimersByTime(400);
    expect(operation).toHaveBeenCalledTimes(4);
    
    await expect(retryPromise).rejects.toThrow();
    
    jest.useRealTimers();
  });

  test('cancels retry on abort signal', async () => {
    const abortController = new AbortController();
    const operation = jest.fn().mockRejectedValue(new Error('temporary failure'));

    const retryPromise = retryOperation(operation, { 
      maxRetries: 5, 
      delay: 1000,
      signal: abortController.signal 
    });

    // Abort after first failure
    setTimeout(() => abortController.abort(), 100);
    
    await expect(retryPromise).rejects.toThrow('Operation aborted');
    expect(operation).toHaveBeenCalledTimes(1);
  });
});

describe('Network Resilience - Connection Validation', () => {
  test('validates stable connection', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: 'ok' })
    });

    const result = await validateConnection('https://api.example.com', {
      timeout: 5000,
      requiredLatency: 1000
    });

    expect(result.valid).toBe(true);
    expect(result.latency).toBeLessThan(1000);
  });

  test('detects unstable connection', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const result = await validateConnection('https://api.example.com', {
      timeout: 5000,
      requiredLatency: 100,
      stabilityChecks: 3
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContain('unstable');
  });

  test('detects high latency connection', async () => {
    mockFetch.mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve({ ok: true, status: 200 });
        }, 2000);
      });
    });

    const result = await validateConnection('https://api.example.com', {
      timeout: 5000,
      requiredLatency: 1000
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toContain('high_latency');
  });

  test('validates multiple endpoints', async () => {
    const endpoints = [
      'https://primary.example.com',
      'https://backup1.example.com',
      'https://backup2.example.com'
    ];

    mockFetch
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });

    const results = await Promise.all(
      endpoints.map(endpoint => validateConnection(endpoint, { timeout: 5000 }))
    );

    expect(results[0].valid).toBe(false);
    expect(results[1].valid).toBe(true);
    expect(results[2].valid).toBe(true);
  });
});

describe('Network Resilience - Real-world Scenarios', () => {
  test('handles intermittent connectivity', async () => {
    const operation = jest.fn()
      .mockResolvedValueOnce('success')
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('success')
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('success');

    const results = [];
    for (let i = 0; i < 5; i++) {
      try {
        const result = await retryOperation(operation, { maxRetries: 2, delay: 100 });
        results.push(result);
      } catch (error) {
        results.push('failed');
      }
    }

    expect(results).toEqual(['success', 'success', 'success', 'success', 'success']);
  });

  test('handles network partition recovery', async () => {
    let networkAvailable = false;
    const operation = jest.fn().mockImplementation(() => {
      if (!networkAvailable) {
        throw new Error('network partition');
      }
      return Promise.resolve('success');
    });

    // Simulate network partition
    const retryPromise = retryOperation(operation, { maxRetries: 10, delay: 100 });
    
    // Network becomes available after 500ms
    setTimeout(() => {
      networkAvailable = true;
    }, 500);

    const result = await retryPromise;
    expect(result).toBe('success');
  });

  test('handles load balancer issues', async () => {
    const endpoints = [
      'https://lb1.example.com',
      'https://lb2.example.com',
      'https://lb3.example.com'
    ];

    mockFetch
      .mockRejectedValueOnce(new Error('service unavailable'))
      .mockRejectedValueOnce(new Error('service unavailable'))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    let workingEndpoint = null;
    for (const endpoint of endpoints) {
      try {
        const result = await testNetworkConnectivity(endpoint);
        if (result.connected) {
          workingEndpoint = endpoint;
          break;
        }
      } catch (error) {
        continue;
      }
    }

    expect(workingEndpoint).toBe('https://lb3.example.com');
  });

  test('handles DNS cache poisoning', async () => {
    mockFetch.mockRejectedValue(new Error('ENOTFOUND'));

    const result = await testNetworkConnectivity('https://malicious.example.com');
    expect(result.connected).toBe(false);
    expect(result.error).toContain('ENOTFOUND');

    // Should suggest alternative endpoints
    expect(result.suggestions).toContain('Check DNS settings');
  });

  test('handles corporate firewall restrictions', async () => {
    mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await testNetworkConnectivity('https://external-api.example.com');
    expect(result.connected).toBe(false);
    expect(result.error).toContain('ECONNREFUSED');

    // Should suggest internal alternatives
    expect(result.suggestions).toContain('Check firewall settings');
  });
});

describe('Network Resilience - Performance Under Load', () => {
  test('handles concurrent network operations', async () => {
    const operations = Array.from({ length: 10 }, (_, i) => 
      jest.fn().mockResolvedValue(`result-${i}`)
    );

    const startTime = Date.now();
    const results = await Promise.all(
      operations.map(operation => retryOperation(operation, { maxRetries: 1, delay: 10 }))
    );
    const endTime = Date.now();

    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
  });

  test('handles rapid connection testing', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const startTime = Date.now();
    const tests = Array.from({ length: 50 }, () => 
      testNetworkConnectivity('https://api.example.com')
    );
    const results = await Promise.all(tests);
    const endTime = Date.now();

    expect(results.every(r => r.connected)).toBe(true);
    expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
  });

  test('handles memory usage during network stress', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    const operations = Array.from({ length: 100 }, () => 
      jest.fn().mockResolvedValue('success')
    );

    await Promise.all(
      operations.map(operation => retryOperation(operation, { maxRetries: 3, delay: 10 }))
    );

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable (less than 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});

describe('Network Resilience - Error Recovery', () => {
  test('recovers from temporary network issues', async () => {
    let failureCount = 0;
    const operation = jest.fn().mockImplementation(() => {
      failureCount++;
      if (failureCount <= 2) {
        throw new Error('temporary network issue');
      }
      return Promise.resolve('recovered');
    });

    const result = await retryOperation(operation, { maxRetries: 5, delay: 100 });
    expect(result).toBe('recovered');
    expect(operation).toHaveBeenCalledTimes(3);
  });

  test('handles cascading failures gracefully', async () => {
    const primaryOperation = jest.fn().mockRejectedValue(new Error('primary failed'));
    const fallbackOperation = jest.fn().mockResolvedValue('fallback success');

    let result;
    try {
      result = await retryOperation(primaryOperation, { maxRetries: 2, delay: 100 });
    } catch (error) {
      result = await fallbackOperation();
    }

    expect(result).toBe('fallback success');
  });

  test('maintains state during network recovery', async () => {
    let state = { counter: 0 };
    const operation = jest.fn().mockImplementation(() => {
      state.counter++;
      if (state.counter <= 2) {
        throw new Error('network error');
      }
      return Promise.resolve(`success-${state.counter}`);
    });

    const result = await retryOperation(operation, { maxRetries: 5, delay: 100 });
    expect(result).toBe('success-3');
    expect(state.counter).toBe(3);
  });
}); 