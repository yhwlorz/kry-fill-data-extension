// src/App.tsx
import React, { useState } from 'react';

const App: React.FC = () => {
  const [headerClass, setHeaderClass] = useState('');
  const [headerName, setHeaderName] = useState('');
  const [bodyClass, setBodyClass] = useState('');
  const [inputValue, setInputValue] = useState('');

  const fillTable = () => {
    chrome.runtime.sendMessage({
      action: 'fill',
      headerClass,
      headerName,
      bodyClass,
      inputValue
    });
  };

  return (
    <div>
      <h1>Table Filler</h1>
      <input
        type="text"
        placeholder="Header Class"
        value={headerClass}
        onChange={e => setHeaderClass(e.target.value)}
      />
      <input
        type="text"
        placeholder="Header Name"
        value={headerName}
        onChange={e => setHeaderName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Body Class"
        value={bodyClass}
        onChange={e => setBodyClass(e.target.value)}
      />
      <input
        type="text"
        placeholder="Input Value"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
      />
      <button onClick={fillTable}>
        Fill Table
      </button>
    </div>
  );
};

export default App;
