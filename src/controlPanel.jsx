import React, { useState } from 'react';
import MemberList from './memberList.jsx';
import { formatFirstNames } from './utils.js';

const ControlPanel = () => {
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleLoadCsv = async () => {
    const result = await window.electronAPI.invoke('load-csv');
    if (result.error) {
      setError(result.error);
      setMembers([]);
    } else {
      setMembers(result.data);
      setError('');
    }
  };

  const handleSelectMember = (member, banner) => {
    const firstNames = formatFirstNames(member);

    const nameData = {
      firstLine: firstNames,
      secondLine: member.LastName,
    };

    window.electronAPI.send('banner-display', { banner, nameData });
  };

  const filteredMembers = members.filter(member => {
    const fullName = `${member.Member1 || ''} ${member.Member2 || ''} ${member.Member3 || ''} ${member.Member4 || ''} ${member.LastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1>Joyride Control Panel</h1>
      
      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <button onClick={handleLoadCsv}>Load Member CSV</button>
        <button onClick={() => window.electronAPI.send('banner-clear', { banner: 1 })}>Clear Banner 1</button>
        <button onClick={() => window.electronAPI.send('banner-clear', { banner: 2 })}>Clear Banner 2</button>
      </div>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {members.length > 0 && (
        <>
          <div style={{ marginTop: 16 }}>
            <input
              type="text"
              placeholder="Search names..."
              style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <MemberList members={filteredMembers} onSelectMember={handleSelectMember} />
        </>
      )}
    </div>
  );
};

export default ControlPanel; 