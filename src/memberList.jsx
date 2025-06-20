import React from 'react';
import { formatFirstNames } from './utils.js';

const MemberList = ({ members, onSelectMember }) => (
  <div style={{ marginTop: 16 }}>
    <h2>Loaded Members:</h2>
    <div style={{
      maxHeight: 300,
      overflowY: 'auto',
      border: '1px solid #ccc',
      padding: 8,
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 4 }}>Last Name</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 4 }}>First Names</th>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: 4 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => {
            // Combine first names
            const firstNames = formatFirstNames(member);

            return (
              <tr key={index}>
                <td style={{ borderBottom: '1px solid #eee', padding: 4 }}>{member.LastName}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 4 }}>{firstNames}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 4 }}>
                  <button onClick={() => onSelectMember(member, 1)}>To Banner 1</button>
                  <button onClick={() => onSelectMember(member, 2)} style={{ marginLeft: 8 }}>To Banner 2</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default MemberList; 