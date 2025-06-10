import React, { useState } from 'react';
import './App.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function App() {
  const [wallet, setWallet] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async () => {
    setError('');
    setResults(null);

    try {
      const res = await axios.get('http://localhost:8080/api/search', {
        params: {
          address: wallet,
          chain: wallet.startsWith("0x") ? "ethereum" : "bitcoin",
        },
      });

      if (!res.data || !res.data.address) {
        setError('There is no cryptocurrency associated with that wallet address.');
      } else {
        setResults({
          ...res.data,
          chain: wallet.startsWith("0x") ? "ethereum" : "bitcoin",
        });
      }

    } catch (err) {
    if (err.response && err.response.status === 500) {
      // 백엔드에서 404 응답이 오면 사용자 정의 메시지로 대체
      setError('There is no cryptocurrency associated with that wallet address.');
    } else {
      setError('검색 중 오류 발생');
    }
    console.error(err);
  }
  };

  const goToGraph = () => {
    navigate(`/graph?wallet=${wallet}`);
  };

  return (
    <div className="wrapper">
      <header className="header">
        <div className="logo-circle">로고</div>
        <h1 className="logo-text">TraceChain</h1>
      </header>

      <section className="search-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Put your cryptocurrency wallet address"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
          />
          <button onClick={handleSearch}>🔍</button>
        </div>
      </section>

<section className="result-dropdown">
  {results && results.address ? (
    <div className="wallet-info">
      <p><strong>Chain:</strong> {results.chain}</p>
      <p><strong>Address:</strong> {results.address}</p>
      <p><strong>Balance:</strong> {results.balance}</p>
      <button onClick={goToGraph}>＋</button>
    </div>
  ) : error ? (
    <div className="wallet-info">
      <p style={{ color: 'red' }}>{error}</p>
    </div>
  ) : null}
</section>

      <button className="help-btn">❓ Help</button>
    </div>
  );
}

export default App;
