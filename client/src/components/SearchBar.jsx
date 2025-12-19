import React, { useState } from 'react';

export default function SearchBar({ onSearch }){
  const [q, setQ] = useState('');
  const onChange = (e) => {
    const v = e.target.value;
    setQ(v);
    onSearch(v);
  };
  return (
    <div>
      <input value={q} onChange={onChange} className="w-full p-2 border rounded" placeholder="Search by name, username or phone" />
    </div>
  );
}
