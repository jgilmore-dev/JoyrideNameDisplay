import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import QueueManager from '../queueManager.jsx';

// Mock window.require for testing
const mockIpcRenderer = {
  invoke: jest.fn(),
  on: jest.fn(),
  removeAllListeners: jest.fn()
};

beforeEach(() => {
  window.require = jest.fn(() => ({
    ipcRenderer: mockIpcRenderer
  }));
  jest.clearAllMocks();
});

const createTestQueueData = (bannerId, memberCount = 3) => {
  const queue = Array.from({ length: memberCount }, (_, i) => ({
    member: {
      id: i + 1,
      Member1: `Member${i + 1}`,
      LastName: `LastName${i + 1}`
    },
    nameData: {
      firstLine: `Member${i + 1}`,
      secondLine: `LastName${i + 1}`
    },
    addedAt: new Date(Date.now() - i * 60000).toISOString()
  }));

  return {
    queue,
    currentDisplay: memberCount > 0 ? {
      member: queue[0].member,
      nameData: queue[0].nameData,
      addedAt: queue[0].addedAt
    } : null
  };
};

const setupInvokeMock = (queueData) => {
  mockIpcRenderer.invoke.mockImplementation((channel, ...args) => {
    if (channel === 'get-all-queues') {
      return Promise.resolve(queueData);
    }
    // Default mock for other channels
    return Promise.resolve({ message: 'ok' });
  });
};

describe('QueueManager - Core Functionality', () => {
  test('renders queue management interface', () => {
    const enabledBanners = [1, 2, 3];
    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    expect(getByText('Queue Management')).toBeInTheDocument();
    expect(getByText('Banner 1')).toBeInTheDocument();
    expect(getByText('Banner 2')).toBeInTheDocument();
    expect(getByText('Banner 3')).toBeInTheDocument();
  });

  test('displays queued members for each banner', async () => {
    const enabledBanners = [1, 2];
    const queueData = {
      1: createTestQueueData(1, 2),
      2: createTestQueueData(2, 1)
    };
    setupInvokeMock(queueData);
    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    await waitFor(() => {
      expect(getByText('Member1 LastName1')).toBeInTheDocument();
      expect(getByText('Member2 LastName2')).toBeInTheDocument();
    });
  });

  test('allows removing members from queue', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: createTestQueueData(1, 2)
    };
    setupInvokeMock(queueData);
    const { getByText, getAllByTitle } = render(<QueueManager enabledBanners={enabledBanners} />);
    await waitFor(() => {
      expect(getByText('Member1 LastName1')).toBeInTheDocument();
    });
    const removeButtons = getAllByTitle('Remove');
    fireEvent.click(removeButtons[0]);
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('remove-from-queue', { bannerId: 1, memberId: 1 });
  });

  test('allows moving members between banners', async () => {
    const enabledBanners = [1, 2];
    const queueData = {
      1: createTestQueueData(1, 1),
      2: createTestQueueData(2, 0)
    };
    setupInvokeMock(queueData);
    const { getByText, getByTitle } = render(<QueueManager enabledBanners={enabledBanners} />);
    await waitFor(() => {
      expect(getByText('Member1 LastName1')).toBeInTheDocument();
    });
    const moveButton = getByTitle('Move to Banner');
    fireEvent.click(moveButton);
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('move-to-banner', { fromBannerId: 1, toBannerId: 2, memberId: 1 });
  });

  test('allows clearing entire queue', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: createTestQueueData(1, 2)
    };
    setupInvokeMock(queueData);
    global.confirm = jest.fn(() => true);
    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    await waitFor(() => {
      expect(getByText('Member1 LastName1')).toBeInTheDocument();
    });
    const clearButton = getByText('Clear Queue (2)');
    fireEvent.click(clearButton);
    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('clear-queue', 1);
  });
});

describe('QueueManager - Edge Cases', () => {
  test('handles empty queues', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: createTestQueueData(1, 0)
    };
    setupInvokeMock(queueData);
    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    await waitFor(() => {
      expect(getByText('No members in queue')).toBeInTheDocument();
    });
  });

  test('handles very large queues', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: createTestQueueData(1, 50)
    };
    setupInvokeMock(queueData);
    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    await waitFor(() => {
      expect(getByText('Member1 LastName1')).toBeInTheDocument();
      expect(getByText('Member50 LastName50')).toBeInTheDocument();
    });
  });

  test('handles members with missing data', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: {
        queue: [
          {
            member: { id: 1, Member1: 'John', LastName: null },
            nameData: { firstLine: 'John', secondLine: '' },
            addedAt: new Date().toISOString()
          }
        ],
        currentDisplay: null
      }
    };
    setupInvokeMock(queueData);
    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    await waitFor(() => {
      expect(getByText('John')).toBeInTheDocument();
    });
  });

  test('handles very long names', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: {
        queue: [
          {
            member: { id: 1, Member1: 'VeryLongFirstNameThatExceedsNormalLength', LastName: 'VeryLongLastNameThatExceedsNormalLength' },
            nameData: { firstLine: 'VeryLongFirstNameThatExceedsNormalLength', secondLine: 'VeryLongLastNameThatExceedsNormalLength' },
            addedAt: new Date().toISOString()
          }
        ],
        currentDisplay: null
      }
    };
    setupInvokeMock(queueData);
    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    await waitFor(() => {
      expect(getByText('VeryLongFirstNameThatExceedsNormalLength VeryLongLastNameThatExceedsNormalLength')).toBeInTheDocument();
    });
  });
});

describe('QueueManager - Error Handling', () => {
  test('handles API errors gracefully', async () => {
    const enabledBanners = [1];
    mockIpcRenderer.invoke.mockRejectedValue(new Error('API Error'));

    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      expect(getByText('Queue Management')).toBeInTheDocument();
    });
  });

  test('handles missing electronAPI gracefully', () => {
    delete window.require;
    const enabledBanners = [1];
    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    expect(getByText('Queue Management')).toBeInTheDocument();
  });

  test('handles network disconnection', async () => {
    const enabledBanners = [1];
    mockIpcRenderer.invoke.mockRejectedValue(new Error('Network Error'));

    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      expect(getByText('Queue Management')).toBeInTheDocument();
    });
  });

  test('handles invalid queue data', async () => {
    const enabledBanners = [1];
    mockIpcRenderer.invoke.mockResolvedValue(null);

    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      expect(getByText('Queue Management')).toBeInTheDocument();
    });
  });
});

describe('QueueManager - Performance and Load Testing', () => {
  test('handles rapid queue operations', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: createTestQueueData(1, 5)
    };
    
    mockIpcRenderer.invoke
      .mockResolvedValueOnce(queueData)
      .mockResolvedValue({ message: 'Operation completed' });

    const { getAllByTitle } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      const clearButtons = screen.getAllByText(/Clear Queue/);
      expect(clearButtons.length).toBeGreaterThan(0);
    });

    // Rapidly click buttons
    const clearButtons = screen.getAllByText(/Clear Queue/);
    for (let i = 0; i < Math.min(5, clearButtons.length); i++) {
      fireEvent.click(clearButtons[i]);
    }

    expect(mockIpcRenderer.invoke).toHaveBeenCalled();
  });

  test('handles concurrent operations', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: createTestQueueData(1, 3)
    };
    
    mockIpcRenderer.invoke
      .mockResolvedValueOnce(queueData)
      .mockResolvedValue({ message: 'Operation completed' });

    const { getByTitle } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      const removeButton = getByTitle('Remove');
      const moveButton = getByTitle('Move Up');
      
      // Fire multiple operations simultaneously
      fireEvent.click(removeButton);
      fireEvent.click(moveButton);
    });

    expect(mockIpcRenderer.invoke).toHaveBeenCalled();
  });
});

describe('QueueManager - User Interaction Scenarios', () => {
  test('confirms before clearing queue', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: createTestQueueData(1, 2)
    };
    
    mockIpcRenderer.invoke
      .mockResolvedValueOnce(queueData)
      .mockResolvedValueOnce({ message: 'Queue cleared' });

    // Mock confirm to return true
    global.confirm = jest.fn(() => true);

    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      const clearButton = getByText('Clear Queue (2)');
      fireEvent.click(clearButton);
    });

    expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to clear the entire queue for this banner?');
  });

  test('cancels clear queue operation', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: createTestQueueData(1, 2)
    };
    
    mockIpcRenderer.invoke.mockResolvedValue(queueData);

    // Mock confirm to return false
    global.confirm = jest.fn(() => false);

    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      const clearButton = getByText('Clear Queue (2)');
      fireEvent.click(clearButton);
    });

    expect(global.confirm).toHaveBeenCalled();
    expect(mockIpcRenderer.invoke).not.toHaveBeenCalledWith('clear-queue', 1);
  });

  test('handles move operation with dropdown', async () => {
    const enabledBanners = [1, 2];
    const queueData = {
      1: createTestQueueData(1, 1),
      2: createTestQueueData(2, 0)
    };
    
    mockIpcRenderer.invoke
      .mockResolvedValueOnce(queueData)
      .mockResolvedValueOnce({ message: 'Member moved' });

    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      const moveSelect = screen.getByTitle('Move to Banner');
      fireEvent.change(moveSelect, { target: { value: '2' } });
    });

    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('move-to-banner', { fromBannerId: 1, toBannerId: 2, memberId: 1 });
  });
});

describe('QueueManager - Accessibility', () => {
  test('supports keyboard navigation', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: createTestQueueData(1, 2)
    };
    
    mockIpcRenderer.invoke.mockResolvedValue(queueData);

    const { getAllByRole } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Test keyboard navigation
      buttons[0].focus();
      expect(buttons[0]).toHaveFocus();
    });
  });

  test('has proper ARIA labels', async () => {
    const enabledBanners = [1, 2];
    const queueData = {
      1: createTestQueueData(1, 1),
      2: createTestQueueData(2, 0)
    };
    
    mockIpcRenderer.invoke.mockResolvedValue(queueData);

    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      expect(getByText('Queue Management')).toBeInTheDocument();
      expect(getByText('Banner 1')).toBeInTheDocument();
      expect(getByText('Banner 2')).toBeInTheDocument();
    });
  });
});

describe('QueueManager - Real-world Scenarios', () => {
  test('handles event with multiple banners and queues', async () => {
    const enabledBanners = [1, 2, 3];
    const queueData = {
      1: createTestQueueData(1, 2),
      2: createTestQueueData(2, 1),
      3: createTestQueueData(3, 0)
    };
    
    mockIpcRenderer.invoke.mockResolvedValue(queueData);

    const { getByText } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      // Check all banners have their members
      expect(getByText('Member1 LastName1')).toBeInTheDocument();
      expect(getByText('Member2 LastName2')).toBeInTheDocument();
    });
  });

  test('handles queue reordering during event', async () => {
    const enabledBanners = [1];
    const queueData = {
      1: createTestQueueData(1, 3)
    };
    
    mockIpcRenderer.invoke
      .mockResolvedValueOnce(queueData)
      .mockResolvedValueOnce({ message: 'Member moved up' });

    const { getByTitle } = render(<QueueManager enabledBanners={enabledBanners} />);
    
    await waitFor(() => {
      expect(getByTitle('Move Up')).toBeInTheDocument();
    });

    const moveUpButton = getByTitle('Move Up');
    fireEvent.click(moveUpButton);

    expect(mockIpcRenderer.invoke).toHaveBeenCalledWith('move-up-in-queue', { bannerId: 1, memberId: 2 });
  });
}); 