// src/GraphPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './GraphPage.css';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import GraphView from './components/GraphView';

function GraphPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialWallet = params.get('wallet');

  const [wallets, setWallets] = useState(initialWallet ? [initialWallet] : []);
  const [edges, setEdges] = useState([]);
  const [walletData, setWalletData] = useState({});
  const [selectedWallet, setSelectedWallet] = useState(initialWallet);
  const [sidebarVisible, setSidebarVisible] = useState(!!initialWallet);
  const [mixingEnabled, setMixingEnabled] = useState(false);

  const fetchWalletData = async (address, enableMixing = false) => {
    const chain = address.startsWith('0x') ? 'ethereum' : 'bitcoin';

    try {
      const res = await axios.get('http://localhost:8080/api/search', {
        params: { address, chain },
      });

      let result = res.data;

      if (enableMixing) {
        try {
          const detectRes = await axios.post(
            'http://localhost:8080/api/detect-selected',
            [address],
            { headers: { 'Content-Type': 'application/json' } }
          );

          const matched = detectRes.data.find(
            (item) =>
              item.address?.toLowerCase().trim() === address?.toLowerCase().trim()
          );

          result.patterns = matched ? matched.patterns || [] : [];
        } catch (e) {
          result.patterns = [];
        }
      } else {
        const existingPatterns = walletData[address]?.patterns || [];
        result.patterns = existingPatterns;
      }

      setWalletData((prev) => ({
        ...prev,
        [address]: {
          ...(prev[address] || {}),
          ...result,
          patterns: result.patterns,
        },
      }));

      return result;
    } catch (e) {
      console.warn('❌ Search API 실패:', address, e);
      return null;
    }
  };

  const handleAddWallet = async ({ from, to, amount }) => {
    if (!wallets.includes(from)) {
      setWallets((prev) => [...prev, from]);
    }

    const edgeExists = edges.some((e) => e.from === from && e.to === to);
    if (!edgeExists) {
      setEdges((prev) => [...prev, { from, to, amount: String(amount) }]);
    }

    await fetchWalletData(from, mixingEnabled);
    setSidebarVisible(true); // ⚠️ selectedWallet은 변경하지 않음
  };

  const handleNodeClick = (wallet) => {
    setSelectedWallet(wallet);
    setSidebarVisible(true);
  };

  const handleSidebarClose = () => {
    setSidebarVisible(false);
  };

  const handleToggleChange = async (e) => {
    const isOn = e.target.checked;
    setMixingEnabled(isOn);

    if (isOn) {
      const newData = {};
      for (const addr of wallets) {
        const data = await fetchWalletData(addr, true);
        if (data) {
          newData[addr] = data;
        }
        await new Promise((r) => setTimeout(r, 100));
      }
      setWalletData((prev) => ({ ...prev, ...newData }));
    } else {
      const reset = Object.fromEntries(
        Object.entries(walletData).map(([k, v]) => [k, { ...v, patterns: [] }])
      );
      setWalletData(reset);
    }
  };

  useEffect(() => {
    const loadInitialWallet = async () => {
      if (initialWallet && !walletData[initialWallet]) {
        const data = await fetchWalletData(initialWallet, false);
        if (data) {
          setWalletData((prev) => ({
            ...prev,
            [initialWallet]: data,
          }));
        }
      }
    };
    loadInitialWallet();
  }, [initialWallet]);

  return (
    <div className="graph-wrapper">
      <div className={`main-content ${sidebarVisible ? 'half' : 'full'}`}>
        <header className="header">
          <div className="logo-circle">로고</div>
          <h1 className="logo-text">TraceChain</h1>
        </header>

        <div style={{ marginBottom: '20px'}}>
          <SearchBar onAddWallet={handleAddWallet} />
        </div>

        <div className="toggle-wrapper">
          <label className="toggle-label">Mixing Detection</label>
          <label className="switch">
            <input
              type="checkbox"
              checked={mixingEnabled}
              onChange={handleToggleChange}
            />
            <span className="slider round"></span>
          </label>
        </div>

        <section className="graph-area">
          <GraphView
            nodes={wallets.map((address) => ({
              address,
              patternCount: walletData[address]?.patterns?.length || 0,
            }))}
            edges={edges}
            onNodeClick={handleNodeClick}
          />
        </section>
      </div>

      {sidebarVisible && selectedWallet && (
        <div className="sidebar-wrapper">
          <Sidebar
            wallet={selectedWallet}
            onClose={handleSidebarClose}
            onAddWallet={handleAddWallet}
            walletData={walletData[selectedWallet] || null}
            mixingEnabled={mixingEnabled}
          />
        </div>
      )}
    </div>
  );
}

export default GraphPage;
