import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

function SearchBar() {
  const [wallet, setWallet] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    if (wallet.trim()) {
      navigate(`/graph?wallet=${wallet}`);
    }
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Put your cryptocurrency wallet address"
        value={wallet}
        onChange={(e) => setWallet(e.target.value)}
      />
      <button onClick={handleSearch}>🔍</button>
    </div>
  );
}

export default SearchBar;
