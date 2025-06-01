import React, { useEffect, useState } from 'react';
import './Sidebar.css';

function Sidebar({ wallet, onClose, onAddWallet }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filteredTx, setFilteredTx] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [selectedTxId, setSelectedTxId] = useState(null);

  const chain = wallet?.startsWith('0x') ? 'ethereum' : 'bitcoin';
  const chainSymbol = chain === 'ethereum' ? 'ETH' : 'BIT';

  useEffect(() => {
    if (!wallet) return;

    fetch(`http://localhost:8080/api/search?address=${wallet}&chain=${chain}`)
      .then((res) => {
        if (!res.ok) throw new Error('네트워크 오류');
        return res.json();
      })
      .then((result) => {
        const sortedTx = (result.transactions || []).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
        setData({ ...result, transactions: sortedTx });
        filterTransactions(sortedTx);
      })
      .catch((err) => {
        setError('정보를 불러올 수 없습니다.');
        console.error(err);
      });
  }, [wallet]);

  const filterTransactions = (transactions) => {
    let filtered = [...transactions];

    if (keyword.trim()) {
      filtered = filtered.filter((tx) =>
        tx.txID?.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    if (filterType === 'in') {
      filtered = filtered.filter((tx) =>
        tx.transfers?.[0]?.receiver?.toLowerCase() === wallet.toLowerCase()
      );
    } else if (filterType === 'out') {
      filtered = filtered.filter((tx) =>
        tx.transfers?.[0]?.sender?.toLowerCase() === wallet.toLowerCase()
      );
    }

    setFilteredTx(filtered);
  };

  useEffect(() => {
    if (data?.transactions) {
      filterTransactions(data.transactions);
    }
  }, [keyword, filterType]);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 className="block-title">Overview</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {data && (
        <>
          <div className="sidebar-block overview-block">
            <div className="overview-columns">
              <div className="overview-section">
                <p><strong>Wallet Type</strong></p>
                <ul className="algo-list"><li>{chain.toUpperCase()}</li></ul>
                <p><strong>Wallet address</strong></p>
                <ul className="algo-list"><li>{data.address}</li></ul>
                <p><strong>Balance</strong></p>
                <ul className="algo-list">
                  <li>{Number(data.balance).toFixed(6)} {chainSymbol}</li>
                </ul>
              </div>
              <div className="overview-section">
                <p><strong>Detected Mixing Algorithm</strong></p>
                <ul className="algo-list">
                  {data.patterns?.length > 0
                    ? data.patterns.map((p, i) => <li key={i}>{p}</li>)
                    : <li>None</li>}
                </ul>
              </div>
            </div>
            <div className="overview-risk">
              <span className="risk-label"><strong>위험 결과:</strong></span>
              <span className="risk-text">
                {data.patterns?.length > 3
                  ? '위험 🔴'
                  : data.patterns?.length > 1
                    ? '경고 🟠'
                    : data.patterns?.length === 1
                      ? '주의 🟡'
                      : '정상 ⚪'}
              </span>
            </div>
          </div>

          <div className="block-title-bar">
            <h3 className="block-title">Transactions</h3>
            <input
              type="text"
              placeholder="Search address..."
              className="tx-search-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <select
              className="tx-filter-dropdown"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="in">In</option>
              <option value="out">Out</option>
            </select>
          </div>

          <div className="sidebar-block tx-block">
            <div className="tx-scroll">
              {filteredTx.length > 0 ? (
                filteredTx.map((tx, i) => {
                  const transfer = tx.transfers?.[0] || {};
                  const isIncoming = transfer.receiver?.toLowerCase() === wallet.toLowerCase();
                  const amountETH = Number(transfer.amount) / 1e18;

                  const date = new Date(tx.timestamp);
                  const dateStr = `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
                  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

                  return (
                    <div
                      key={i}
                      className={`tx-item ${selectedTxId === tx.txID ? 'selected' : ''}`}
                      onClick={() => setSelectedTxId(tx.txID)}
                    >
                      <span
                        className="tx-address"
                        title={transfer.sender || transfer.receiver || 'unknown'}
                      >
                        {transfer.sender || transfer.receiver || '(unknown address)'}
                      </span>
                      <span className="tx-date">
                        {dateStr}<br />{timeStr}
                      </span>
                      <span
                        className="tx-amount"
                        style={{ color: isIncoming ? 'green' : 'red' }}
                      >
                        {isIncoming ? '←' : '→'} {amountETH.toFixed(6)}
                        <br />
                        {chainSymbol}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p>없음</p>
              )}
            </div>
          </div>

          <div className="tx-bottom-row">
            <span className="tx-action-text">check the transaction and add a new wallet</span>
            <button
              className="tx-add-btn"
              onClick={() => {
                const selected = filteredTx.find((tx) => tx.txID === selectedTxId);
                const transfer = selected?.transfers?.[0];
                if (!transfer) return alert('No address selected.');

                const isIncoming = transfer.receiver?.toLowerCase() === wallet.toLowerCase();
                const target = isIncoming ? transfer.sender : transfer.receiver;

                if (target) {
  onAddWallet({
    from: target, // 새로 연결할 주소 (ex. 169FL...)
    to: wallet    // 현재 사이드바에 열려 있는 주소 (ex. 12Ew6...)
  });
} else {
  alert('No address selected.');
}

              }}
            >
              +
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Sidebar;
