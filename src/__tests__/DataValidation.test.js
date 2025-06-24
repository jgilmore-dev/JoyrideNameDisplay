const { validateMemberData, validateVenueConfig, validateBannerConfig, sanitizeInput } = require('../utils.js');

describe('Data Validation - Member Data', () => {
  test('validates correct member data', () => {
    const validMember = {
      id: 1,
      Member1: 'John',
      Member2: 'Jane',
      Member3: 'Bob',
      Member4: 'Alice',
      LastName: 'Smith'
    };

    const result = validateMemberData(validMember);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('handles missing required fields', () => {
    const invalidMember = {
      id: 1,
      // Missing Member1 and LastName
      Member2: 'Jane'
    };

    const result = validateMemberData(invalidMember);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Member1 is required');
    expect(result.errors).toContain('LastName is required');
  });

  test('handles empty string values', () => {
    const memberWithEmptyStrings = {
      id: 1,
      Member1: '',
      Member2: '   ',
      Member3: null,
      Member4: undefined,
      LastName: 'Smith'
    };

    const result = validateMemberData(memberWithEmptyStrings);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Member1 cannot be empty');
  });

  test('validates ID field', () => {
    const memberWithoutId = {
      Member1: 'John',
      LastName: 'Smith'
    };

    const result = validateMemberData(memberWithoutId);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('ID is required');
  });

  test('handles very long names', () => {
    const memberWithLongName = {
      id: 1,
      Member1: 'A'.repeat(1000),
      LastName: 'B'.repeat(1000)
    };

    const result = validateMemberData(memberWithLongName);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Member1 exceeds maximum length');
    expect(result.errors).toContain('LastName exceeds maximum length');
  });

  test('validates special characters', () => {
    const memberWithSpecialChars = {
      id: 1,
      Member1: 'José María',
      LastName: 'O\'Connor-Smith'
    };

    const result = validateMemberData(memberWithSpecialChars);
    expect(result.isValid).toBe(true);
  });

  test('validates unicode characters', () => {
    const memberWithUnicode = {
      id: 1,
      Member1: '李小明',
      LastName: '王'
    };

    const result = validateMemberData(memberWithUnicode);
    expect(result.isValid).toBe(true);
  });

  test('handles null/undefined input', () => {
    const result1 = validateMemberData(null);
    expect(result1.isValid).toBe(false);
    expect(result1.errors).toContain('Member data is required');

    const result2 = validateMemberData(undefined);
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain('Member data is required');
  });
});

describe('Data Validation - Venue Configuration', () => {
  test('validates correct venue configuration', () => {
    const validVenueConfig = {
      venueName: 'Test Venue',
      displaySettings: {
        defaultFontSize: '36px',
        defaultColor: '#FFFFFF',
        backgroundColor: '#000000'
      },
      banners: {
        count: 3,
        enabled: [true, true, true]
      }
    };

    const result = validateVenueConfig(validVenueConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('handles missing venue name', () => {
    const invalidVenueConfig = {
      displaySettings: {
        defaultFontSize: '36px',
        defaultColor: '#FFFFFF'
      }
    };

    const result = validateVenueConfig(invalidVenueConfig);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Venue name is required');
  });

  test('validates color formats', () => {
    const venueConfigWithInvalidColors = {
      venueName: 'Test Venue',
      displaySettings: {
        defaultFontSize: '36px',
        defaultColor: 'invalid-color',
        backgroundColor: '#GGGGGG'
      }
    };

    const result = validateVenueConfig(venueConfigWithInvalidColors);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid color format');
  });

  test('validates font size format', () => {
    const venueConfigWithInvalidFontSize = {
      venueName: 'Test Venue',
      displaySettings: {
        defaultFontSize: 'invalid',
        defaultColor: '#FFFFFF'
      }
    };

    const result = validateVenueConfig(venueConfigWithInvalidFontSize);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid font size format');
  });

  test('validates banner configuration', () => {
    const venueConfigWithInvalidBanners = {
      venueName: 'Test Venue',
      banners: {
        count: -1,
        enabled: [true, true, true]
      }
    };

    const result = validateVenueConfig(venueConfigWithInvalidBanners);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid banner count');
  });
});

describe('Data Validation - Banner Configuration', () => {
  test('validates correct banner configuration', () => {
    const validBannerConfig = {
      bannerId: 1,
      enabled: true,
      fontSize: '48px',
      fontColor: '#FFFFFF',
      backgroundColor: '#000000',
      position: { x: 0, y: 0, width: 1920, height: 1080 }
    };

    const result = validateBannerConfig(validBannerConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validates banner ID', () => {
    const invalidBannerConfig = {
      bannerId: 'invalid',
      enabled: true
    };

    const result = validateBannerConfig(invalidBannerConfig);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid banner ID');
  });

  test('validates position coordinates', () => {
    const bannerConfigWithInvalidPosition = {
      bannerId: 1,
      enabled: true,
      position: { x: -1, y: 0, width: 1920, height: 1080 }
    };

    const result = validateBannerConfig(bannerConfigWithInvalidPosition);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid position coordinates');
  });

  test('validates dimensions', () => {
    const bannerConfigWithInvalidDimensions = {
      bannerId: 1,
      enabled: true,
      position: { x: 0, y: 0, width: 0, height: 1080 }
    };

    const result = validateBannerConfig(bannerConfigWithInvalidDimensions);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid dimensions');
  });
});

describe('Data Validation - Input Sanitization', () => {
  test('sanitizes HTML content', () => {
    const inputWithHtml = '<script>alert("xss")</script>John Smith';
    const sanitized = sanitizeInput(inputWithHtml);
    expect(sanitized).toBe('John Smith');
  });

  test('sanitizes SQL injection attempts', () => {
    const inputWithSql = "'; DROP TABLE members; --";
    const sanitized = sanitizeInput(inputWithSql);
    expect(sanitized).not.toContain('DROP TABLE');
  });

  test('sanitizes special characters', () => {
    const inputWithSpecialChars = 'John\n\r\tSmith';
    const sanitized = sanitizeInput(inputWithSpecialChars);
    expect(sanitized).toBe('John Smith');
  });

  test('preserves valid unicode characters', () => {
    const inputWithUnicode = 'José María O\'Connor';
    const sanitized = sanitizeInput(inputWithUnicode);
    expect(sanitized).toBe('José María O\'Connor');
  });

  test('handles null/undefined input', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
  });

  test('trims whitespace', () => {
    const inputWithWhitespace = '  John Smith  ';
    const sanitized = sanitizeInput(inputWithWhitespace);
    expect(sanitized).toBe('John Smith');
  });
});

describe('Data Validation - Edge Cases', () => {
  test('handles extremely large data', () => {
    const largeMember = {
      id: 1,
      Member1: 'A'.repeat(10000),
      LastName: 'B'.repeat(10000)
    };

    const result = validateMemberData(largeMember);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Member1 exceeds maximum length');
  });

  test('handles deeply nested objects', () => {
    const deeplyNestedConfig = {
      venueName: 'Test',
      settings: {
        display: {
          banner: {
            config: {
              nested: {
                value: 'test'
              }
            }
          }
        }
      }
    };

    const result = validateVenueConfig(deeplyNestedConfig);
    expect(result.isValid).toBe(false);
  });

  test('handles circular references', () => {
    const circularObject = { name: 'test' };
    circularObject.self = circularObject;

    const result = validateMemberData(circularObject);
    expect(result.isValid).toBe(false);
  });

  test('handles non-string inputs', () => {
    const nonStringInputs = [
      123,
      true,
      false,
      [],
      {},
      () => {}
    ];

    nonStringInputs.forEach(input => {
      const result = validateMemberData(input);
      expect(result.isValid).toBe(false);
    });
  });
});

describe('Data Validation - Performance', () => {
  test('handles large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      Member1: `Member${i + 1}`,
      LastName: `LastName${i + 1}`
    }));

    const startTime = Date.now();
    largeDataset.forEach(member => {
      validateMemberData(member);
    });
    const endTime = Date.now();

    // Should complete within reasonable time (less than 1 second)
    expect(endTime - startTime).toBeLessThan(1000);
  });

  test('handles rapid validation calls', () => {
    const member = { id: 1, Member1: 'John', LastName: 'Smith' };

    const startTime = Date.now();
    for (let i = 0; i < 10000; i++) {
      validateMemberData(member);
    }
    const endTime = Date.now();

    // Should handle rapid calls efficiently
    expect(endTime - startTime).toBeLessThan(1000);
  });
});

describe('Data Validation - Real-world Scenarios', () => {
  test('validates CSV import data', () => {
    const csvData = [
      { id: 1, Member1: 'John', LastName: 'Smith' },
      { id: 2, Member1: 'Jane', LastName: 'Jones' },
      { id: 3, Member1: '', LastName: 'Brown' }, // Invalid
      { id: 4, Member1: 'Bob', LastName: '' }, // Invalid
      { id: 5, Member1: 'Alice', LastName: 'Wilson' }
    ];

    const results = csvData.map(member => validateMemberData(member));
    const validResults = results.filter(result => result.isValid);
    const invalidResults = results.filter(result => !result.isValid);

    expect(validResults).toHaveLength(3);
    expect(invalidResults).toHaveLength(2);
  });

  test('validates user input from forms', () => {
    const formInputs = [
      { Member1: 'John', LastName: 'Smith' }, // Valid
      { Member1: '<script>alert("xss")</script>', LastName: 'Hacker' }, // Invalid
      { Member1: 'José', LastName: 'García' }, // Valid
      { Member1: 'A'.repeat(1000), LastName: 'Long' }, // Invalid
      { Member1: '', LastName: 'Empty' } // Invalid
    ];

    formInputs.forEach((input, index) => {
      const result = validateMemberData({ id: index + 1, ...input });
      if (index === 0 || index === 2) {
        expect(result.isValid).toBe(true);
      } else {
        expect(result.isValid).toBe(false);
      }
    });
  });

  test('validates configuration updates', () => {
    const configUpdates = [
      { venueName: 'New Venue', displaySettings: { defaultFontSize: '48px' } }, // Valid
      { venueName: '', displaySettings: { defaultFontSize: 'invalid' } }, // Invalid
      { venueName: 'Test Venue', banners: { count: 5, enabled: [true, true, true] } }, // Valid
      { venueName: 'Test', banners: { count: -1 } } // Invalid
    ];

    configUpdates.forEach((config, index) => {
      const result = validateVenueConfig(config);
      if (index === 0 || index === 2) {
        expect(result.isValid).toBe(true);
      } else {
        expect(result.isValid).toBe(false);
      }
    });
  });
}); 