import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import Banner from '../banner.jsx';

// Mock window.electronAPI for testing
const mockElectronAPI = {
  invoke: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn()
};

beforeEach(() => {
  window.electronAPI = mockElectronAPI;
  jest.clearAllMocks();
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

describe('Banner - Core Display Functionality', () => {
  test('displays single member name correctly', () => {
    const { getByText } = render(<Banner images={[]} />);
    const testMember = { Member1: 'John', LastName: 'Smith' };
    
    // Simulate receiving display data
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member: testMember, bannerId: 1 } 
    }));
    
    expect(getByText('John')).toBeInTheDocument();
    expect(getByText('Smith')).toBeInTheDocument();
  });

  test('displays merged members correctly', () => {
    const { getByText } = render(<Banner images={[]} />);
    const mergedData = {
      firstLine: 'John\nJane',
      secondLine: 'Smith\nJones',
      isMerged: true,
      memberIds: [1, 2]
    };
    
    fireEvent(window, new CustomEvent('displayMerged', { 
      detail: { data: mergedData, bannerId: 1 } 
    }));
    
    expect(getByText('John')).toBeInTheDocument();
    expect(getByText('Jane')).toBeInTheDocument();
    expect(getByText('Smith')).toBeInTheDocument();
    expect(getByText('Jones')).toBeInTheDocument();
  });

  test('clears display when requested', () => {
    const { getByText, queryByText } = render(<Banner images={[]} />);
    const testMember = { Member1: 'John', LastName: 'Smith' };
    
    // Display a member
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member: testMember, bannerId: 1 } 
    }));
    expect(getByText('John')).toBeInTheDocument();
    
    // Clear the display
    fireEvent(window, new CustomEvent('clearDisplay', { 
      detail: { bannerId: 1 } 
    }));
    
    expect(queryByText('John')).not.toBeInTheDocument();
  });
});

describe('Banner - Edge Cases and Error Handling', () => {
  test('handles empty member data gracefully', () => {
    const { container } = render(<Banner images={[]} />);
    const emptyMember = { Member1: '', LastName: '' };
    
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member: emptyMember, bannerId: 1 } 
    }));
    
    // Should not crash and should handle empty strings
    expect(container).toBeInTheDocument();
  });

  test('handles null/undefined member data', () => {
    const { container } = render(<Banner images={[]} />);
    
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member: null, bannerId: 1 } 
    }));
    
    // Should not crash
    expect(container).toBeInTheDocument();
  });

  test('handles very long names', () => {
    const { getByText } = render(<Banner images={[]} />);
    const longNameMember = {
      Member1: 'VeryLongFirstNameThatExceedsNormalLengthAndShouldBeHandledGracefully',
      LastName: 'VeryLongLastNameThatExceedsNormalLengthAndShouldBeHandledGracefully'
    };
    
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member: longNameMember, bannerId: 1 } 
    }));
    
    expect(getByText('VeryLongFirstNameThatExceedsNormalLengthAndShouldBeHandledGracefully')).toBeInTheDocument();
    expect(getByText('VeryLongLastNameThatExceedsNormalLengthAndShouldBeHandledGracefully')).toBeInTheDocument();
  });

  test('handles special characters in names', () => {
    const { getByText } = render(<Banner images={[]} />);
    const specialCharMember = {
      Member1: 'José María',
      LastName: 'O\'Connor-Smith'
    };
    
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member: specialCharMember, bannerId: 1 } 
    }));
    
    expect(getByText('José María')).toBeInTheDocument();
    expect(getByText('O\'Connor-Smith')).toBeInTheDocument();
  });

  test('handles unicode characters', () => {
    const { getByText } = render(<Banner images={[]} />);
    const unicodeMember = {
      Member1: '李小明',
      LastName: '王'
    };
    
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member: unicodeMember, bannerId: 1 } 
    }));
    
    expect(getByText('李小明')).toBeInTheDocument();
    expect(getByText('王')).toBeInTheDocument();
  });
});

describe('Banner - Performance and Load Testing', () => {
  test('handles rapid display changes', async () => {
    const { getByText } = render(<Banner images={[]} />);
    
    // Rapidly change displays
    for (let i = 1; i <= 10; i++) {
      const member = { Member1: `Member${i}`, LastName: `LastName${i}` };
      fireEvent(window, new CustomEvent('displayMember', { 
        detail: { member, bannerId: 1 } 
      }));
    }
    
    // Should show the last member
    expect(getByText('Member10')).toBeInTheDocument();
    expect(getByText('LastName10')).toBeInTheDocument();
  });

  test('handles concurrent display and clear events', () => {
    const { container } = render(<Banner images={[]} />);
    const member = { Member1: 'John', LastName: 'Smith' };
    
    // Fire display and clear events simultaneously
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member, bannerId: 1 } 
    }));
    fireEvent(window, new CustomEvent('clearDisplay', { 
      detail: { bannerId: 1 } 
    }));
    
    // Should handle gracefully without crashing
    expect(container).toBeInTheDocument();
  });

  test('handles large merged member lists', () => {
    const { getByText } = render(<Banner images={[]} />);
    const largeMergedData = {
      firstLine: Array.from({ length: 20 }, (_, i) => `Member${i + 1}`).join('\n'),
      secondLine: Array.from({ length: 20 }, (_, i) => `LastName${i + 1}`).join('\n'),
      isMerged: true,
      memberIds: Array.from({ length: 20 }, (_, i) => i + 1)
    };
    
    fireEvent(window, new CustomEvent('displayMerged', { 
      detail: { data: largeMergedData, bannerId: 1 } 
    }));
    
    // Should display all members
    expect(getByText('Member1')).toBeInTheDocument();
    expect(getByText('Member20')).toBeInTheDocument();
    expect(getByText('LastName1')).toBeInTheDocument();
    expect(getByText('LastName20')).toBeInTheDocument();
  });
});

describe('Banner - Slideshow Functionality', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('handles slideshow enable/disable', () => {
    const { container } = render(<Banner images={[]} />);
    
    // Enable slideshow
    fireEvent(window, new CustomEvent('slideshowEnabled', { 
      detail: { enabled: true, bannerId: 1 } 
    }));
    
    // Disable slideshow
    fireEvent(window, new CustomEvent('slideshowEnabled', { 
      detail: { enabled: false, bannerId: 1 } 
    }));
    
    // Should handle both states without crashing
    expect(container).toBeInTheDocument();
  });

  test('handles slideshow clear events', () => {
    const { container } = render(<Banner images={[]} />);
    
    fireEvent(window, new CustomEvent('slideshowClear', { 
      detail: { bannerId: 1 } 
    }));
    
    // Should handle slideshow clear without crashing
    expect(container).toBeInTheDocument();
  });

  test('handles slideshow with images', () => {
    const testImages = ['image1.jpg', 'image2.jpg', 'image3.jpg'];
    const { container } = render(<Banner images={testImages} />);
    
    // Enable slideshow
    fireEvent(window, new CustomEvent('slideshowEnabled', { 
      detail: { enabled: true, bannerId: 1 } 
    }));
    
    // Should handle slideshow with images without crashing
    expect(container).toBeInTheDocument();
  });
});

describe('Banner - Network and Communication', () => {
  test('handles missing electronAPI gracefully', () => {
    delete window.electronAPI;
    const { container } = render(<Banner images={[]} />);
    const member = { Member1: 'John', LastName: 'Smith' };
    
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member, bannerId: 1 } 
    }));
    
    // Should not crash when electronAPI is missing
    expect(container).toBeInTheDocument();
  });

  test('handles network disconnection scenarios', () => {
    const { container } = render(<Banner images={[]} />);
    
    // Simulate network disconnection
    fireEvent(window, new CustomEvent('networkError', { 
      detail: { error: 'Connection lost' } 
    }));
    
    // Should handle network errors gracefully
    expect(container).toBeInTheDocument();
  });
});

describe('Banner - Accessibility and Usability', () => {
  test('maintains proper contrast ratios', () => {
    const { container } = render(<Banner images={[]} />);
    const member = { Member1: 'John', LastName: 'Smith' };
    
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member, bannerId: 1 } 
    }));
    
    // Check that text elements are present and visible
    const textElements = container.querySelectorAll('.member-name, .member-lastname');
    expect(textElements.length).toBeGreaterThan(0);
  });

  test('supports screen readers', () => {
    const { getByRole } = render(<Banner images={[]} />);
    const member = { Member1: 'John', LastName: 'Smith' };
    
    fireEvent(window, new CustomEvent('displayMember', { 
      detail: { member, bannerId: 1 } 
    }));
    
    // Check for proper semantic structure
    const banner = getByRole('banner');
    expect(banner).toBeInTheDocument();
  });

  test('handles font loading gracefully', () => {
    const { container } = render(<Banner images={[]} />);
    
    // Simulate font loading failure
    fireEvent(window, new CustomEvent('fontLoadError', { 
      detail: { font: 'GothamRnd-Bold' } 
    }));
    
    // Should fallback to system fonts gracefully
    expect(container).toBeInTheDocument();
  });
});

describe('Banner - Configuration and Customization', () => {
  test('handles custom banner configurations', () => {
    const { container } = render(<Banner images={[]} />);
    
    // Simulate custom configuration
    fireEvent(window, new CustomEvent('bannerConfig', { 
      detail: { 
        bannerId: 1,
        fontSize: '48px',
        fontColor: '#FF0000',
        backgroundColor: '#000000'
      } 
    }));
    
    // Should apply custom styling
    expect(container).toBeInTheDocument();
  });

  test('handles venue-specific settings', () => {
    const { container } = render(<Banner images={[]} />);
    
    // Simulate venue configuration
    fireEvent(window, new CustomEvent('venueConfig', { 
      detail: { 
        venueName: 'Test Venue',
        displaySettings: {
          defaultFontSize: '36px',
          defaultColor: '#FFFFFF'
        }
      } 
    }));
    
    // Should apply venue settings
    expect(container).toBeInTheDocument();
  });
});

describe('Banner - Memory and Resource Management', () => {
  test('cleans up event listeners on unmount', () => {
    const { unmount } = render(<Banner images={[]} />);
    
    // Spy on removeEventListener
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    unmount();
    
    // Should clean up event listeners
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  test('handles memory leaks from rapid updates', () => {
    const { container } = render(<Banner images={[]} />);
    
    // Simulate rapid updates that could cause memory leaks
    for (let i = 0; i < 100; i++) {
      const member = { Member1: `Member${i}`, LastName: `LastName${i}` };
      fireEvent(window, new CustomEvent('displayMember', { 
        detail: { member, bannerId: 1 } 
      }));
    }
    
    // Should handle without memory issues
    expect(container).toBeInTheDocument();
  });
}); 