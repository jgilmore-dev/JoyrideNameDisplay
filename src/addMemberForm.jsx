import React, { useState } from 'react';

const AddMemberForm = ({ onAddMember, onCancel }) => {
  const [lastName, setLastName] = useState('');
  const [member1, setMember1] = useState('');
  const [member2, setMember2] = useState('');
  const [member3, setMember3] = useState('');
  const [member4, setMember4] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!lastName || !member1) {
      alert('Last Name and at least one First Name are required.');
      return;
    }
    onAddMember({
      LastName: lastName,
      Member1: member1,
      Member2: member2,
      Member3: member3,
      Member4: member4,
    });
    // Clear form
    setLastName('');
    setMember1('');
    setMember2('');
    setMember3('');
    setMember4('');
  };

  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      border: '1px solid #ccc',
      borderRadius: 4,
    }}>
      <h3>Add New Member/Family</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Last Name: </label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>First Name 1: </label>
          <input type="text" value={member1} onChange={(e) => setMember1(e.target.value)} required />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>First Name 2: </label>
          <input type="text" value={member2} onChange={(e) => setMember2(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>First Name 3: </label>
          <input type="text" value={member3} onChange={(e) => setMember3(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>First Name 4: </label>
          <input type="text" value={member4} onChange={(e) => setMember4(e.target.value)} />
        </div>
        <button type="submit">Add Member</button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 8 }}>Cancel</button>
      </form>
    </div>
  );
};

export default AddMemberForm; 