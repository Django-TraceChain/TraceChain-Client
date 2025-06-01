import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import './GraphPage.css';
import Sidebar from './components/Sidebar';
import SearchBar from './components/SearchBar';
import GraphView from './components/GraphView';


function GraphPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialWallet = params.get('wallet');

  const [wallets, setWallets] = useState(initialWallet ? [initialWallet] : []);
  const [edges, setEdges] = useState([]); // { from, to } 형태
  const [selectedWallet, setSelectedWallet] = useState(initialWallet);
  const [sidebarVisible, setSidebarVisible] = useState(!!initialWallet);

  // 노드 클릭 시 사이드바 열기
  const handleNodeClick = (wallet) => {
    setSelectedWallet(wallet);
    setSidebarVisible(true);
  };

  const handleSidebarClose = () => {
    setSidebarVisible(false);
  };

  // + 버튼에서 호출될 함수
  const handleAddWallet = ({ from, to }) => {
    // from 주소가 wallets에 없다면 추가
    if (!wallets.includes(from)) {
      setWallets((prev) => [...prev, from]);
    }

    // 간선 추가 (중복 방지)
    const edgeExists = edges.some(e => e.from === from && e.to === to);
    if (!edgeExists) {
      setEdges((prev) => [...prev, { from, to }]);
    }

    setSelectedWallet(from); // 새 노드를 선택한 상태로
    setSidebarVisible(true);
  };

  return (
    <div className="graph-wrapper">
      <div className={`main-content ${sidebarVisible ? 'half' : 'full'}`}>
        <header className="header">
          <div className="logo-circle">로고</div>
          <h1 className="logo-text">TraceChain</h1>
        </header>

        <div style={{ marginBottom: '30px' }}>
          <SearchBar />
        </div>

<section className="graph-area">
  <GraphView
    nodes={wallets.map((address) => ({ address }))}
    edges={edges}
    onNodeClick={(wallet) => handleNodeClick(wallet)}
  />
</section>

      </div>

      {sidebarVisible && selectedWallet && (
        <div className="sidebar-wrapper">
          <Sidebar
            wallet={selectedWallet}
            onClose={handleSidebarClose}
            onAddWallet={handleAddWallet} // + 버튼으로 호출될 콜백
          />
        </div>
      )}
    </div>
  );
}

export default GraphPage;
