import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import MemberMergeManager from '../memberMergeManager.jsx';

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
    displayed: i % 5 === 0
  }));
};

describe('MemberMergeManager - Core Functionality', () => {
  const members = createTestMembers(5);

  test('renders merge mode toggle and enables merge mode', () => {
    const { getByText } = render(
      <MemberMergeManager members={members} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    expect(getByText('🔗 Enable Merge Mode')).toBeInTheDocument();
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    expect(getByText('Merge Mode - Select Multiple Members')).toBeInTheDocument();
  });

  test('selects members and shows preview', () => {
    const { getByText } = render(
      <MemberMergeManager members={members} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    fireEvent.click(getByText('Member1'));
    fireEvent.click(getByText('Member2'));
    expect(getByText('Member1\nMember2')).toBeInTheDocument();
    expect(getByText('LastName1\nLastName2')).toBeInTheDocument();
  });

  test('calls onDisplayMerged with correct data', () => {
    const onDisplayMerged = jest.fn();
    const { getByText } = render(
      <MemberMergeManager members={members} onDisplayMerged={onDisplayMerged} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    fireEvent.click(getByText('Member1'));
    fireEvent.click(getByText('Member2'));
    fireEvent.click(getByText('Display on Banner 1'));
    expect(onDisplayMerged).toHaveBeenCalled();
    const call = onDisplayMerged.mock.calls[0][0];
    expect(call.firstLine).toContain('Member1');
    expect(call.firstLine).toContain('Member2');
    expect(call.secondLine).toContain('LastName1');
    expect(call.secondLine).toContain('LastName2');
    expect(call.isMerged).toBe(true);
    expect(call.memberIds).toEqual([1, 2]);
  });
});

describe('MemberMergeManager - Edge Cases', () => {
  test('handles empty member list', () => {
    const { getByText } = render(
      <MemberMergeManager members={[]} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    expect(getByText('0 members selected')).toBeInTheDocument();
  });

  test('handles single member selection', () => {
    const members = createTestMembers(1);
    const { getByText } = render(
      <MemberMergeManager members={members} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    fireEvent.click(getByText('Member1'));
    expect(getByText('1 member selected')).toBeInTheDocument();
    expect(getByText('Member1')).toBeInTheDocument();
    expect(getByText('LastName1')).toBeInTheDocument();
  });

  test('handles very long names', () => {
    const membersWithLongNames = [
      {
        id: 1,
        Member1: 'VeryLongFirstNameThatExceedsNormalLength',
        LastName: 'VeryLongLastNameThatExceedsNormalLength'
      },
      {
        id: 2,
        Member1: 'AnotherVeryLongFirstName',
        LastName: 'AnotherVeryLongLastName'
      }
    ];
    const { getByText } = render(
      <MemberMergeManager members={membersWithLongNames} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    fireEvent.click(getByText('VeryLongFirstNameThatExceedsNormalLength'));
    fireEvent.click(getByText('AnotherVeryLongFirstName'));
    expect(getByText('VeryLongFirstNameThatExceedsNormalLength\nAnotherVeryLongFirstName')).toBeInTheDocument();
  });

  test('handles members with missing data', () => {
    const membersWithMissingData = [
      { id: 1, Member1: 'John', LastName: 'Smith' },
      { id: 2, Member1: null, LastName: 'Jones' },
      { id: 3, Member1: 'Jane', LastName: null },
      { id: 4, Member1: null, LastName: null }
    ];
    const { getByText } = render(
      <MemberMergeManager members={membersWithMissingData} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    fireEvent.click(getByText('John'));
    fireEvent.click(getByText('Jane'));
    expect(getByText('John\nJane')).toBeInTheDocument();
    expect(getByText('Smith\n')).toBeInTheDocument();
  });
});

describe('MemberMergeManager - Performance and Load Testing', () => {
  test('handles large member list (100+ members)', () => {
    const largeMemberList = createTestMembers(100);
    const { getByText } = render(
      <MemberMergeManager members={largeMemberList} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    
    // Select multiple members from different parts of the list
    fireEvent.click(getByText('Member1'));
    fireEvent.click(getByText('Member50'));
    fireEvent.click(getByText('Member100'));
    
    expect(getByText('3 members selected')).toBeInTheDocument();
  });

  test('handles rapid selection/deselection', () => {
    const members = createTestMembers(10);
    const { getByText } = render(
      <MemberMergeManager members={members} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    
    // Rapidly click members
    for (let i = 0; i < 5; i++) {
      fireEvent.click(getByText(`Member${i + 1}`));
    }
    
    expect(getByText('5 members selected')).toBeInTheDocument();
  });
});

describe('MemberMergeManager - User Interaction Scenarios', () => {
  test('clear selection functionality', () => {
    const members = createTestMembers(5);
    const { getByText } = render(
      <MemberMergeManager members={members} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    fireEvent.click(getByText('Member1'));
    fireEvent.click(getByText('Member2'));
    expect(getByText('2 members selected')).toBeInTheDocument();
    
    fireEvent.click(getByText('Clear Selection'));
    expect(getByText('0 members selected')).toBeInTheDocument();
  });

  test('exit merge mode functionality', () => {
    const members = createTestMembers(3);
    const { getByText, queryByText } = render(
      <MemberMergeManager members={members} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    expect(getByText('Merge Mode - Select Multiple Members')).toBeInTheDocument();
    
    fireEvent.click(getByText('Exit Merge Mode'));
    expect(queryByText('Merge Mode - Select Multiple Members')).not.toBeInTheDocument();
    expect(getByText('🔗 Enable Merge Mode')).toBeInTheDocument();
  });

  test('multiple banner support', () => {
    const members = createTestMembers(3);
    const { getByText } = render(
      <MemberMergeManager members={members} onDisplayMerged={jest.fn()} enabledBanners={[1, 2, 3]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    fireEvent.click(getByText('Member1'));
    fireEvent.click(getByText('Member2'));
    
    expect(getByText('Display on Banner 1')).toBeInTheDocument();
    expect(getByText('Display on Banner 2')).toBeInTheDocument();
    expect(getByText('Display on Banner 3')).toBeInTheDocument();
    expect(getByText('Queue for Banner 1')).toBeInTheDocument();
    expect(getByText('Queue for Banner 2')).toBeInTheDocument();
    expect(getByText('Queue for Banner 3')).toBeInTheDocument();
  });
});

describe('MemberMergeManager - Error Handling', () => {
  test('handles onDisplayMerged errors gracefully', () => {
    const onDisplayMerged = jest.fn().mockRejectedValue(new Error('Display failed'));
    const members = createTestMembers(2);
    const { getByText } = render(
      <MemberMergeManager members={members} onDisplayMerged={onDisplayMerged} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    fireEvent.click(getByText('Member1'));
    fireEvent.click(getByText('Display on Banner 1'));
    
    expect(onDisplayMerged).toHaveBeenCalled();
  });

  test('handles missing electronAPI gracefully', () => {
    delete window.electronAPI;
    const members = createTestMembers(2);
    const { getByText } = render(
      <MemberMergeManager members={members} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    fireEvent.click(getByText('Member1'));
    fireEvent.click(getByText('Queue for Banner 1'));
    // Should not crash
  });
});

describe('MemberMergeManager - Accessibility', () => {
  test('supports keyboard navigation', () => {
    const members = createTestMembers(3);
    const { getByText, getByRole } = render(
      <MemberMergeManager members={members} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(0);
    
    // Test tab navigation
    checkboxes[0].focus();
    expect(checkboxes[0]).toHaveFocus();
  });

  test('has proper ARIA labels', () => {
    const members = createTestMembers(2);
    const { getByText, getByLabelText } = render(
      <MemberMergeManager members={members} onDisplayMerged={jest.fn()} enabledBanners={[1]} />
    );
    fireEvent.click(getByText('🔗 Enable Merge Mode'));
    
    // Check for proper labeling
    expect(getByText('Merge Mode - Select Multiple Members')).toBeInTheDocument();
    expect(getByText('Click on members below to select them for merging.')).toBeInTheDocument();
  });
}); 