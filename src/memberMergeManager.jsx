import React, { useState, useEffect } from 'react';
import { formatFirstNames } from './utils.js';

const MemberMergeManager = ({ members, onDisplayMerged, enabledBanners = [] }) => {
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [mergeMode, setMergeMode] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Generate preview of merged display
  useEffect(() => {
    if (selectedMembers.length === 0) {
      setPreviewData(null);
      return;
    }

    const firstNames = selectedMembers.map(member => formatFirstNames(member)).join('\n');
    const lastNames = selectedMembers.map(member => member.LastName).join('\n');
    
    setPreviewData({
      firstLine: firstNames,
      secondLine: lastNames
    });
  }, [selectedMembers]);

  const toggleMemberSelection = (member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);
      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  const clearSelection = () => {
    setSelectedMembers([]);
    setMergeMode(false);
  };

  const handleDisplayMerged = async (bannerId) => {
    if (selectedMembers.length === 0) return;

    const firstNames = selectedMembers.map(member => formatFirstNames(member)).join('\n');
    const lastNames = selectedMembers.map(member => member.LastName).join('\n');
    
    const nameData = {
      firstLine: firstNames,
      secondLine: lastNames,
      isMerged: true,
      memberIds: selectedMembers.map(m => m.id)
    };

    await onDisplayMerged(nameData, bannerId);
    
    // Mark all selected members as displayed
    for (const member of selectedMembers) {
      await window.electronAPI.invoke('mark-as-displayed', member.id);
    }
    
    clearSelection();
  };

  const handleQueueMerged = async (bannerId) => {
    if (selectedMembers.length === 0) return;

    const firstNames = selectedMembers.map(member => formatFirstNames(member)).join('\n');
    const lastNames = selectedMembers.map(member => member.LastName).join('\n');
    
    const nameData = {
      firstLine: firstNames,
      secondLine: lastNames,
      isMerged: true,
      memberIds: selectedMembers.map(m => m.id)
    };

    try {
      const result = await window.electronAPI.invoke('add-to-queue', { 
        bannerId: bannerId, 
        member: nameData 
      });
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Failed to add merged members to queue:', error);
      alert('Failed to add merged members to queue');
    }
    
    clearSelection();
  };

  if (!mergeMode) {
    return (
      <div className="merge-manager">
        <button 
          className="merge-toggle-button"
          onClick={() => setMergeMode(true)}
        >
          🔗 Enable Merge Mode
        </button>
      </div>
    );
  }

  return (
    <div className="merge-manager active">
      <div className="merge-header">
        <h3>Merge Mode - Select Multiple Members</h3>
        <div className="merge-controls">
          <span className="selected-count">
            {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
          </span>
          <button 
            className="clear-selection-button"
            onClick={clearSelection}
            disabled={selectedMembers.length === 0}
          >
            Clear Selection
          </button>
          <button 
            className="exit-merge-button"
            onClick={() => setMergeMode(false)}
          >
            Exit Merge Mode
          </button>
        </div>
      </div>

      {selectedMembers.length > 0 && (
        <div className="merge-preview">
          <h4>Preview:</h4>
          <div className="preview-display">
            <div className="preview-first-line">{previewData?.firstLine}</div>
            <div className="preview-second-line">{previewData?.secondLine}</div>
          </div>
          
          <div className="merge-actions">
            {enabledBanners.map(bannerId => (
              <div key={bannerId} className="banner-merge-actions">
                <button 
                  onClick={() => handleDisplayMerged(bannerId)}
                  className="display-merged-button"
                >
                  Display on Banner {bannerId}
                </button>
                <button 
                  onClick={() => handleQueueMerged(bannerId)}
                  className="queue-merged-button"
                >
                  Queue for Banner {bannerId}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="merge-instructions">
        <p>Click on members below to select them for merging. Selected members will be displayed together with their names on separate lines.</p>
      </div>

      <div className="merge-member-list">
        <table className="merge-table">
          <thead>
            <tr>
              <th>Select</th>
              <th>Last Name</th>
              <th>First Names</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isSelected = selectedMembers.some(m => m.id === member.id);
              return (
                <tr 
                  key={member.id} 
                  className={`merge-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => toggleMemberSelection(member)}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleMemberSelection(member)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>{member.LastName}</td>
                  <td>{formatFirstNames(member)}</td>
                  <td>
                    {member.displayed ? (
                      <span className="displayed-status">Displayed</span>
                    ) : (
                      <span className="not-displayed-status">Not Displayed</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberMergeManager; 