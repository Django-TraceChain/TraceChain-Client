import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

function SearchBar({ onAddWallet }) {
  const [wallet, setWallet] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(); // ✅ DOM 추적용 ref

  // ✅ 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearch = async () => {
    if (!wallet.trim()) return;
    try {
      const res = await axios.get('http://localhost:8080/api/search', {
        params: { address: wallet.trim() },
      });
      setSearchResult(res.data);
      setShowDropdown(true);
    } catch (e) {
      console.error('검색 실패:', e);
      setSearchResult(null);
      setShowDropdown(false);
    }
  };

  const handleAddClick = () => {
    if (!searchResult) return;
    onAddWallet({
      from: searchResult.address,
      to: searchResult.address,
      amount: '0',
    });
    setShowDropdown(false);
  };

  return (
    <div
      className="search-bar"
      style={{ position: 'relative', flexDirection: 'column' }}
      ref={dropdownRef} // ✅ ref 연결
    >
      <div style={{ display: 'flex', width: '100%' }}>
      
        <input
          type="text"
          placeholder="Put your cryptocurrency wallet address"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch}>🔍</button>
      </div>

      {showDropdown && searchResult && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            color: '#333',
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            marginTop: '2px',
            zIndex: 10,
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
          }}
        >
          <div>
            <strong>Chain:</strong> {searchResult.address.startsWith('0x') ? 'ethereum' : 'bitcoin'}&nbsp;&nbsp;
            <strong>Address:</strong> {searchResult.address}&nbsp;&nbsp;
            <strong>Balance:</strong> {Number(searchResult.balance).toFixed(6)}
          </div>
          <button
            onClick={handleAddClick}
            style={{
              border: 'none',
              background: 'white',
              color: '#0e0e5f',
              fontSize: '20px',
              fontWeight: 'bold',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              boxShadow: '0 0 3px rgba(0,0,0,0.2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Add to graph"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}

export default SearchBar;
