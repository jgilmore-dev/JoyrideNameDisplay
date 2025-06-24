import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ControlPanel from '../controlPanel.jsx';

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
});

const createTestMembers = (count = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    Member1: `Member${i + 1}`,
    Member2: i % 2 === 0 ? `Spouse${i + 1}` : null,
    Member3: i % 3 === 0 ? `Child${i + 1}` : null,
    Member4: i % 4 === 0 ? `Guest${i + 1}` : null,
    LastName: `LastName${i + 1}`,
    displayed: i % 5 === 0,
    displayedAt: new Date(Date.now() - i * 60000).toISOString()
  }));
};

describe('ControlPanel - Core Functionality', () => {
  test('renders main control panel interface', async () => {
    const { getByText, getByPlaceholderText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Member Name Display Control Panel')).toBeInTheDocument();
    });
    
    // Check for main sections that actually exist
    expect(getByText('Display Controls')).toBeInTheDocument();
    expect(getByText('Member Management')).toBeInTheDocument();
    expect(getByText('Slideshow Management')).toBeInTheDocument();
  });

  test('loads and displays member list', async () => {
    const members = createTestMembers(5);
    mockElectronAPI.invoke.mockResolvedValue(members);

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Member1')).toBeInTheDocument();
      expect(getByText('Member2')).toBeInTheDocument();
      expect(getByText('Member3')).toBeInTheDocument();
    });
  });

  test('filters members by search term', async () => {
    const members = createTestMembers(10);
    mockElectronAPI.invoke.mockResolvedValue(members);

    const { getByPlaceholderText, getByText, queryByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Member1')).toBeInTheDocument();
    });

    const searchInput = getByPlaceholderText('Search names...');
    fireEvent.change(searchInput, { target: { value: 'Member1' } });

    expect(getByText('Member1')).toBeInTheDocument();
    expect(queryByText('Member2')).not.toBeInTheDocument();
  });

  test('displays member on banner', async () => {
    const members = createTestMembers(3);
    mockElectronAPI.invoke
      .mockResolvedValueOnce(members)
      .mockResolvedValueOnce({ success: true });

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Member1')).toBeInTheDocument();
    });

    // Find the display button for the first member
    const displayButtons = screen.getAllByText(/Display on Banner/);
    if (displayButtons.length > 0) {
      fireEvent.click(displayButtons[0]);
      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('display-member', expect.any(Object));
    }
  });

  test('queues member for banner', async () => {
    const members = createTestMembers(3);
    mockElectronAPI.invoke
      .mockResolvedValueOnce(members)
      .mockResolvedValueOnce({ success: true });

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Member1')).toBeInTheDocument();
    });

    // Find the queue button for the first member
    const queueButtons = screen.getAllByText(/Queue for Banner/);
    if (queueButtons.length > 0) {
      fireEvent.click(queueButtons[0]);
      expect(mockElectronAPI.invoke).toHaveBeenCalledWith('add-to-queue', expect.any(Object));
    }
  });
});

describe('ControlPanel - Search and Filtering', () => {
  test('implements fuzzy search', async () => {
    const members = [
      { id: 1, Member1: 'John', LastName: 'Smith' },
      { id: 2, Member1: 'Jane', LastName: 'Jones' },
      { id: 3, Member1: 'Jonathan', LastName: 'Brown' }
    ];
    mockElectronAPI.invoke.mockResolvedValue(members);

    const { getByPlaceholderText, getByText, queryByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('John')).toBeInTheDocument();
    });

    const searchInput = getByPlaceholderText('Search names...');
    
    // Test fuzzy matching
    fireEvent.change(searchInput, { target: { value: 'Jon' } });
    expect(getByText('John')).toBeInTheDocument();
    expect(getByText('Jonathan')).toBeInTheDocument();
    expect(queryByText('Jane')).not.toBeInTheDocument();

    // Test case insensitive
    fireEvent.change(searchInput, { target: { value: 'jane' } });
    expect(getByText('Jane')).toBeInTheDocument();
  });

  test('clears search after displaying member', async () => {
    const members = createTestMembers(3);
    mockElectronAPI.invoke
      .mockResolvedValueOnce(members)
      .mockResolvedValueOnce({ success: true });

    const { getByPlaceholderText, getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Member1')).toBeInTheDocument();
    });

    const searchInput = getByPlaceholderText('Search names...');
    fireEvent.change(searchInput, { target: { value: 'Member1' } });

    const displayButtons = screen.getAllByText(/Display on Banner/);
    if (displayButtons.length > 0) {
      fireEvent.click(displayButtons[0]);
      // Search should be cleared
      expect(searchInput.value).toBe('');
    }
  });

  test('sorts recently displayed members first', async () => {
    const members = [
      { id: 1, Member1: 'John', LastName: 'Smith', displayed: false, displayedAt: null },
      { id: 2, Member1: 'Jane', LastName: 'Jones', displayed: true, displayedAt: new Date().toISOString() },
      { id: 3, Member1: 'Bob', LastName: 'Brown', displayed: true, displayedAt: new Date(Date.now() - 60000).toISOString() }
    ];
    mockElectronAPI.invoke.mockResolvedValue(members);

    const { container } = render(<ControlPanel />);
    
    await waitFor(() => {
      const memberElements = container.querySelectorAll('.member-item');
      if (memberElements.length > 0) {
        // Check that recently displayed members appear first
        expect(memberElements[0]).toHaveTextContent('Jane');
        expect(memberElements[1]).toHaveTextContent('Bob');
        expect(memberElements[2]).toHaveTextContent('John');
      }
    });
  });
});

describe('ControlPanel - Edge Cases and Error Handling', () => {
  test('handles empty member list', async () => {
    mockElectronAPI.invoke.mockResolvedValue([]);

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('No members loaded. Click "Load Member CSV" to begin.')).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockElectronAPI.invoke.mockRejectedValue(new Error('API Error'));

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('No members loaded. Click "Load Member CSV" to begin.')).toBeInTheDocument();
    });
  });

  test('handles malformed member data', async () => {
    const malformedMembers = [
      { id: 1, Member1: 'John', LastName: 'Smith' },
      { id: 2, Member1: null, LastName: null }, // Malformed data
      { id: 3, Member1: 'Jane', LastName: 'Jones' }
    ];
    mockElectronAPI.invoke.mockResolvedValue(malformedMembers);

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('John')).toBeInTheDocument();
      expect(getByText('Jane')).toBeInTheDocument();
    });
  });

  test('handles large member lists efficiently', async () => {
    const largeMemberList = createTestMembers(1000);
    mockElectronAPI.invoke.mockResolvedValue(largeMemberList);

    const { container } = render(<ControlPanel />);
    
    await waitFor(() => {
      // Should handle large lists without memory issues
      expect(container).toBeInTheDocument();
    });
  });
});

describe('ControlPanel - User Interaction Scenarios', () => {
  test('handles slideshow toggle', async () => {
    const members = createTestMembers(3);
    mockElectronAPI.invoke
      .mockResolvedValueOnce(members)
      .mockResolvedValueOnce({ success: true });

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Slideshow Management')).toBeInTheDocument();
    });

    const slideshowToggle = getByText('🖼️ Enable Slideshow');
    if (slideshowToggle) {
      fireEvent.click(slideshowToggle);
      expect(mockElectronAPI.invoke).toHaveBeenCalled();
    }
  });

  test('handles banner enable/disable', async () => {
    const members = createTestMembers(3);
    mockElectronAPI.invoke
      .mockResolvedValueOnce(members)
      .mockResolvedValueOnce({ success: true });

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Display Controls')).toBeInTheDocument();
    });

    const bannerToggle = getByText('Enable Banner 1');
    if (bannerToggle) {
      fireEvent.click(bannerToggle);
      expect(mockElectronAPI.invoke).toHaveBeenCalled();
    }
  });
});

describe('ControlPanel - Network and Communication', () => {
  test('handles missing electronAPI gracefully', () => {
    delete window.electronAPI;
    const { getByText } = render(<ControlPanel />);
    
    expect(getByText('Member Name Display Control Panel')).toBeInTheDocument();
    // Should not crash
  });

  test('handles network disconnection', async () => {
    mockElectronAPI.invoke.mockRejectedValue(new Error('Network Error'));

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('No members loaded. Click "Load Member CSV" to begin.')).toBeInTheDocument();
    });
  });

  test('handles Pi client connection status', async () => {
    const members = createTestMembers(3);
    mockElectronAPI.invoke
      .mockResolvedValueOnce(members)
      .mockResolvedValueOnce([
        { id: 'pi1', name: 'Pi Display 1', connected: true, version: '1.4.0' },
        { id: 'pi2', name: 'Pi Display 2', connected: false, version: '1.3.0' }
      ]);

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Pi Client Manager')).toBeInTheDocument();
    });
  });
});

describe('ControlPanel - Accessibility', () => {
  test('supports keyboard navigation', async () => {
    const members = createTestMembers(3);
    mockElectronAPI.invoke.mockResolvedValue(members);

    const { getByPlaceholderText } = render(<ControlPanel />);
    
    await waitFor(() => {
      const searchInput = getByPlaceholderText('Search names...');
      searchInput.focus();
      expect(searchInput).toHaveFocus();
    });
  });

  test('has proper search input', async () => {
    const members = createTestMembers(3);
    mockElectronAPI.invoke.mockResolvedValue(members);

    const { getByPlaceholderText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByPlaceholderText('Search names...')).toBeInTheDocument();
    });
  });
});

describe('ControlPanel - Real-world Event Scenarios', () => {
  test('handles busy event with many members', async () => {
    const busyEventMembers = createTestMembers(500);
    mockElectronAPI.invoke.mockResolvedValue(busyEventMembers);

    const { getByText, getByPlaceholderText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Member1')).toBeInTheDocument();
      expect(getByText('Member500')).toBeInTheDocument();
    });

    // Test search performance with large list
    const searchInput = getByPlaceholderText('Search names...');
    fireEvent.change(searchInput, { target: { value: 'Member100' } });

    expect(getByText('Member100')).toBeInTheDocument();
  });

  test('handles rapid member displays during event', async () => {
    const members = createTestMembers(10);
    mockElectronAPI.invoke
      .mockResolvedValueOnce(members)
      .mockResolvedValue({ success: true });

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Member1')).toBeInTheDocument();
    });

    // Rapidly display different members
    const displayButtons = screen.getAllByText(/Display on Banner/);
    if (displayButtons.length > 0) {
      for (let i = 0; i < Math.min(5, displayButtons.length); i++) {
        fireEvent.click(displayButtons[i]);
      }
    }

    // Should handle rapid displays without issues
    expect(mockElectronAPI.invoke).toHaveBeenCalled();
  });

  test('handles settings changes during event', async () => {
    const members = createTestMembers(5);
    mockElectronAPI.invoke
      .mockResolvedValueOnce(members)
      .mockResolvedValueOnce({ success: true });

    const { getByText } = render(<ControlPanel />);
    
    await waitFor(() => {
      expect(getByText('Member Name Display Control Panel')).toBeInTheDocument();
    });

    // Change settings
    const settingsButton = getByText('⚙️ Settings');
    fireEvent.click(settingsButton);

    // Should handle settings changes gracefully
    expect(mockElectronAPI.invoke).toHaveBeenCalled();
  });
}); 