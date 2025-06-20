import React from 'react';
import { formatFirstNames } from './utils.js';

const MemberList = ({ members, onSelectMember, onEditMember }) => (
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
                <button onClick={() => onSelectMember(member, 1)}>To Banner 1</button>
                <button onClick={() => onSelectMember(member, 2)}>To Banner 2</button>
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