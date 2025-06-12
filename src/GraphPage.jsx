import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import "./GraphPage.css";
import Sidebar from "./components/Sidebar";
import SearchBar from "./components/SearchBar";
import GraphView from "./components/GraphView";
import logo from "./assets/logo.png";

const normalizeAddress = (address) =>
  address.startsWith("0x") ? address.toLowerCase() : address;

function GraphPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialWalletRaw = params.get("wallet");
  const initialWallet = initialWalletRaw
    ? normalizeAddress(initialWalletRaw)
    : null;

  const [wallets, setWallets] = useState(initialWallet ? [initialWallet] : []);
  const [edges, setEdges] = useState([]);
  const [walletData, setWalletData] = useState({});
  const [selectedWallet, setSelectedWallet] = useState(initialWallet || null);
  const [sidebarVisible, setSidebarVisible] = useState(!!initialWallet);
  const [mixingEnabled, setMixingEnabled] = useState(false);

  const fetchWalletData = useCallback(
    async (address, enableMixing = false) => {
      const normalized = normalizeAddress(address);
      const chain = normalized.startsWith("0x") ? "ethereum" : "bitcoin";

      try {
        const res = await axios.get("http://localhost:8080/api/search", {
          params: { address: normalized, chain },
        });
        let result = res.data;

        if (enableMixing) {
          try {
            const detectRes = await axios.post(
              "http://localhost:8080/api/detect-selected",
              [normalized],
              { headers: { "Content-Type": "application/json" } }
            );

            const matched = detectRes.data.find(
              (item) => normalizeAddress(item.address) === normalized
            );

            result.patterns = matched ? matched.patterns || [] : [];
          } catch (e) {
            result.patterns = [];
          }
        } else {
          result.patterns = walletData[normalized]?.patterns || [];
        }

        return result;
      } catch (e) {
        console.warn("❌ Search API 실패:", address, e);
        return null;
      }
    },
    [walletData]
  );

  const handleAddWallet = useCallback(
    async ({ from, to, amount }) => {
      const fromAddr = normalizeAddress(from);
      const toAddr = normalizeAddress(to);

      const addresses = [fromAddr, toAddr];
      const uniqueAddresses = addresses.filter(
        (addr) => !wallets.includes(addr)
      );
      const fetchResults = await Promise.all(
        uniqueAddresses.map((addr) => fetchWalletData(addr, mixingEnabled))
      );

      const newWalletData = {};
      uniqueAddresses.forEach((addr, i) => {
        if (fetchResults[i]) {
          newWalletData[addr] = {
            ...(walletData[addr] || {}),
            ...fetchResults[i],
            patterns: fetchResults[i].patterns || [],
          };
        }
      });

      if (Object.keys(newWalletData).length > 0) {
        setWalletData((prev) => ({ ...prev, ...newWalletData }));
        setWallets((prev) => [
          ...new Set([...prev, ...Object.keys(newWalletData)]),
        ]);

        const edgeExists = edges.some(
          (e) =>
            normalizeAddress(e.from) === fromAddr &&
            normalizeAddress(e.to) === toAddr &&
            e.amount === String(amount)
        );

        if (!edgeExists) {
          setEdges((prev) => [
            ...prev,
            { from: fromAddr, to: toAddr, amount: String(amount) },
          ]);
        }

        setSidebarVisible(true);
      }
    },
    [wallets, edges, walletData, fetchWalletData, mixingEnabled]
  );

  const handleNodeClick = (wallet) => {
    setSelectedWallet(normalizeAddress(wallet));
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
  }, [initialWallet, fetchWalletData, walletData]);

  return (
    <div className="graph-wrapper">
      <div className={`main-content ${sidebarVisible ? "half" : "full"}`}>
        <header className="header">
          <img src={logo} alt="TraceChain Logo" className="logo-image" />
          <h1 className="logo-text">TraceChain</h1>
        </header>

        <div style={{ marginBottom: "20px" }}>
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
