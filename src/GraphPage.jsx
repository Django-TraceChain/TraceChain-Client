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

          console.log('🔍 detect-selected 전체 응답:', detectRes.data);
          console.log(`🔍 찾는 address (입력값): [${address}]`);

          detectRes.data.forEach((item, idx) => {
            console.log(`🔍 [${idx}] 응답 address: [${item.address}]`);
          });

          const matched = detectRes.data.find(
            (item) =>
              item.address?.toLowerCase().trim() === address?.toLowerCase().trim()
          );

          if (matched) {
            const patternsFromServer = matched.patterns || [];
            console.log(`🧠 감지된 패턴 (${matched.address}):`, patternsFromServer);
            result.patterns = patternsFromServer;
          } else {
            console.warn(`❗ 감지 응답에 주소 ${address}에 해당하는 데이터가 없음`);
            result.patterns = [];
          }
        } catch (e) {
          console.warn('❌ Detect API 실패:', address, e);
          result.patterns = [];
        }
      } else {
        const existingPatterns = walletData[address]?.patterns || [];
        result.patterns = existingPatterns;
      }

      console.log(`📦 최종 result 저장 [${address}]:`, result);

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

  const updateAllMixingInfo = async () => {
    const newData = {};

    for (const addr of wallets) {
      try {
        const data = await fetchWalletData(addr, true);
        if (data) {
          newData[addr] = data;
        }
        await new Promise((r) => setTimeout(r, 100)); // 서버 부하 방지
      } catch (err) {
        console.warn(`⚠️ 감지 실패: ${addr}`, err);
      }
    }

    setWalletData((prev) => ({ ...prev, ...newData }));
  };

  const handleAddWallet = async ({ from, to }) => {
    if (!wallets.includes(from)) {
      setWallets((prev) => [...prev, from]);
    }

    const edgeExists = edges.some((e) => e.from === from && e.to === to);
    if (!edgeExists) {
      setEdges((prev) => [...prev, { from, to }]);
    }

    const newData = await fetchWalletData(from, mixingEnabled);
    if (!newData) return;

    setSelectedWallet(from);
    setSidebarVisible(true);
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
      await updateAllMixingInfo();
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

        <div style={{ marginBottom: '20px' }}>
          <SearchBar />
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
