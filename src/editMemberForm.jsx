import React, { useState, useEffect } from 'react';

const EditMemberForm = ({ member, onUpdateMember, onCancel }) => {
  const [lastName, setLastName] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  const [member3, setMember3] = useState('');
  const [member4, setMember4] = useState('');

  useEffect(() => {
    if (member) {
      setLastName(member.LastName || '');
      setMember1(member.Member1 || '');
      setMember2(member.Member2 || '');
      setMember3(member.Member3 || '');
      setMember4(member.Member4 || '');
    }
  }, [member]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lastName || !member1) {
      alert('Last Name and at least one First Name are required.');
      return;
    }
    onUpdateMember({
      ...member, // Preserve original data like 'displayed' status
      LastName: lastName,
      Member1: member1,
      Member2: member2,
      Member3: member3,
      Member4: member4,
    });
  };

  if (!member) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>Edit Member/Family</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Last Name: </label>
            <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>First Name 1: </label>
            <input type="text" value={member1} onChange={(e) => setMember1(e.target.value)} required />
          </div>
          <div className="form-field">
            <label>First Name 2: </label>
            <input type="text" value={member2} onChange={(e) => setMember2(e.target.value)} />
          </div>
          <div className="form-field">
            <label>First Name 3: </label>
            <input type="text" value={member3} onChange={(e) => setMember3(e.target.value)} />
          </div>
          <div className="form-field">
            <label>First Name 4: </label>
            <input type="text" value={member4} onChange={(e) => setMember4(e.target.value)} />
          </div>
          <div className="form-actions">
            <button type="submit">Update Member</button>
            <button type="button" onClick={onCancel}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditMemberForm; 