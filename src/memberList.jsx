import React from 'react';
import { formatFirstNames } from './utils.js';

const MemberList = ({ members, onSelectMember, onEditMember, enabledBanners = [] }) => (
  <div className="list-container">
    <h2>Member List</h2>
    <div className="table-wrapper">
      <table className="member-table">
        <thead>
          <tr>
            <th>Last Name</th>
            <th>First Names</th>
            <th className="actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.LastName}</td>
              <td>{formatFirstNames(member)}</td>
              <td className="actions-cell">
                {enabledBanners.map(bannerId => (
                  <div key={bannerId} className="banner-actions">
                    <button onClick={() => onSelectMember(member, bannerId)}>
                      To Banner {bannerId}
                    </button>
                    <button 
                      onClick={() => onSelectMember(member, bannerId, 'queue')}
                      className="queue-button"
                    >
                      Queue for {bannerId}
                    </button>
                  </div>
                ))}
                <button onClick={() => onEditMember(member)}>Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default MemberList; 