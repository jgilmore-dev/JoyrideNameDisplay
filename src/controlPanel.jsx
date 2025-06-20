import React, { useState, useEffect } from 'react';
import MemberList from './memberList.jsx';
import { formatFirstNames } from './utils.js';
import AddMemberForm from './addMemberForm.jsx';
import EditMemberForm from './editMemberForm.jsx';

const ControlPanel = () => {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDisplayed, setShowDisplayed] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const fetchMembers = async () => {
    const memberList = await window.electronAPI.invoke('get-members');
    setMembers(memberList);
  };

  // Fetch initial members on component mount
  useEffect(() => {
    fetchMembers();
  }, []);

  const handleLoadCsv = async () => {
    const result = await window.electronAPI.invoke('load-csv');
    if (result.error) {
      setError(result.error);
    }
    fetchMembers(); // Refresh list after loading
  };

  const handleAddMember = async (newMember) => {
    await window.electronAPI.invoke('add-member', newMember);
    setShowAddForm(false); // Hide form after adding
    fetchMembers(); // Refresh list
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
  };

  const handleUpdateMember = async (updatedMember) => {
    await window.electronAPI.invoke('update-member', updatedMember);
    setEditingMember(null); // Close the form
    fetchMembers(); // Refresh list
  };

  const handleSelectMember = async (member, banner) => {
    const firstNames = formatFirstNames(member);

    const nameData = {
      firstLine: firstNames,
      secondLine: member.LastName,
    };

    window.electronAPI.send('banner-display', { banner, nameData });

    // Mark member as displayed in the central data store
    await window.electronAPI.invoke('mark-as-displayed', member.id);
    fetchMembers(); // Refresh list
  };

  const membersToDisplay = members.filter(member => {
    const isNotDisplayed = !member.displayed;
    const matchesSearch = `${member.Member1 || ''} ${member.Member2 || ''} ${member.Member3 || ''} ${member.Member4 || ''} ${member.LastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    return isNotDisplayed && matchesSearch;
  });

  const recentlyDisplayedMembers = members.filter(member => {
    const isDisplayed = member.displayed;
    const matchesSearch = `${member.Member1 || ''} ${member.Member2 || ''} ${member.Member3 || ''} ${member.Member4 || ''} ${member.LastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    return isDisplayed && matchesSearch;
  });

  return (
    <div className="container">
      <h1>Joyride Control Panel</h1>
      
      <div className="button-group">
        <button onClick={handleLoadCsv}>Load Member CSV</button>
        <button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Cancel Adding' : 'Add New Member'}
        </button>
        <button onClick={() => window.electronAPI.send('banner-clear', { banner: 1 })}>Clear Banner 1</button>
        <button onClick={() => window.electronAPI.send('banner-clear', { banner: 2 })}>Clear Banner 2</button>
      </div>
      
      {showAddForm && <AddMemberForm onAddMember={handleAddMember} onCancel={() => setShowAddForm(false)} />}
      
      {error && <p className="error-text">{error}</p>}

      {members.length > 0 ? (
        <>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search names..."
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <label>
              <input
                type="checkbox"
                checked={showDisplayed}
                onChange={(e) => setShowDisplayed(e.target.checked)}
              />
              Show Recently Displayed
            </label>
          </div>
          <MemberList
            members={showDisplayed ? recentlyDisplayedMembers : membersToDisplay}
            onSelectMember={handleSelectMember}
            onEditMember={handleEditMember}
          />
          {editingMember && (
            <EditMemberForm
              member={editingMember}
              onUpdateMember={handleUpdateMember}
              onCancel={() => setEditingMember(null)}
            />
          )}
        </>
      ) : (
        <p className="info-text">No members loaded. Click "Load Member CSV" to begin.</p>
      )}
    </div>
  );
};

export default ControlPanel; 