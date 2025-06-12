// src/components/Sidebar.jsx
import React, { useMemo, useState } from "react";
import "./Sidebar.css";

function Sidebar({ wallet, onClose, onAddWallet, walletData, mixingEnabled }) {
  const [keyword, setKeyword] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedTransferKey, setSelectedTransferKey] = useState(null);

  const safeData = walletData || {
    address: "",
    balance: 0,
    transactions: [],
    patterns: [],
  };

  const data = {
    ...safeData,
    patterns: mixingEnabled ? safeData.patterns || [] : [],
  };

  const transactions = data.transactions || [];

  const filteredTransfers = useMemo(() => {
    let allTransfers = [];

    for (const tx of transactions) {
      for (const t of tx.transfers || []) {
        const sender = t.sender?.toLowerCase();
        const receiver = t.receiver?.toLowerCase();
        const walletLower = wallet.toLowerCase();

        const isInvolved = sender === walletLower || receiver === walletLower;

        if (!isInvolved) continue;
        if (sender === receiver) continue; // A→A 트랜스퍼 제외

        allTransfers.push({
          txID: tx.txID,
          timestamp: tx.timestamp,
          transfer: t,
        });
      }
    }

    if (keyword.trim()) {
      const query = keyword.toLowerCase();
      allTransfers = allTransfers.filter(({ txID, transfer }) => {
        const sender = transfer.sender?.toLowerCase() || "";
        const receiver = transfer.receiver?.toLowerCase() || "";
        return (
          txID.toLowerCase().includes(query) ||
          sender.includes(query) ||
          receiver.includes(query)
        );
      });
    }

    if (filterType === "in") {
      allTransfers = allTransfers.filter(
        ({ transfer }) =>
          transfer.receiver?.toLowerCase() === wallet.toLowerCase()
      );
    } else if (filterType === "out") {
      allTransfers = allTransfers.filter(
        ({ transfer }) =>
          transfer.sender?.toLowerCase() === wallet.toLowerCase()
      );
    }

    allTransfers.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return allTransfers;
  }, [transactions, wallet, keyword, filterType]);

  const chain = wallet?.startsWith("0x") ? "ethereum" : "bitcoin";
  const chainSymbol = chain === "ethereum" ? "ETH" : "BIT";

  const riskLevel =
    data.patterns.length > 3
      ? "위험 🔴"
      : data.patterns.length > 1
      ? "경고 🟠"
      : data.patterns.length === 1
      ? "주의 🟡"
      : "정상 ⚪";

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 className="block-title">Overview</h3>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="sidebar-block overview-block">
        <div className="overview-columns">
          <div className="overview-section">
            <p>
              <strong>Wallet Type</strong>
            </p>
            <ul className="algo-list">
              <li>{chain.toUpperCase()}</li>
            </ul>
            <p>
              <strong>Wallet address</strong>
            </p>
            <ul className="algo-list">
              <li>{data.address || "(불러오는 중)"}</li>
            </ul>
            <p>
              <strong>Balance</strong>
            </p>
            <ul className="algo-list">
              <li>
                {Number(data.balance).toFixed(6)} {chainSymbol}
              </li>
            </ul>
          </div>
          <div className="overview-section">
            <p>
              <strong>Detected Mixing Algorithm</strong>
            </p>
            <ul className="algo-list">
              {data.patterns.length > 0 ? (
                data.patterns.map((p, i) => <li key={i}>{p}</li>)
              ) : (
                <li>None</li>
              )}
            </ul>
          </div>
        </div>
        <div className="overview-risk">
          <span className="risk-label">
            <strong>위험 결과:</strong>
          </span>
          <span className="risk-text">{riskLevel}</span>
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
          {filteredTransfers.length > 0 ? (
            filteredTransfers.map(({ txID, timestamp, transfer }, i) => {
              const isIncoming =
                transfer.receiver?.toLowerCase() === wallet.toLowerCase();
              const amount =
                transfer.amount !== undefined ? Number(transfer.amount) : null;

              const date = new Date(timestamp);
              const dateStr = `${date.getFullYear()}.${String(
                date.getMonth() + 1
              ).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
              const timeStr = `${String(date.getHours()).padStart(
                2,
                "0"
              )}:${String(date.getMinutes()).padStart(2, "0")}:${String(
                date.getSeconds()
              ).padStart(2, "0")}`;

              const transferKey = `${txID}_${i}`;

              return (
                <div
                  key={transferKey}
                  className={`tx-item ${
                    selectedTransferKey === transferKey ? "selected" : ""
                  }`}
                  onClick={() => setSelectedTransferKey(transferKey)}
                >
                  <span
                    className="tx-address"
                    title={`${transfer.sender} → ${transfer.receiver}`}
                  >
                    {transfer.sender} → {transfer.receiver}
                  </span>
                  <span className="tx-date">
                    {dateStr}
                    <br />
                    {timeStr}
                  </span>
                  <span
                    className="tx-amount"
                    style={{ color: isIncoming ? "green" : "red" }}
                  >
                    {isIncoming ? "←" : "→"}{" "}
                    {amount !== null ? amount.toFixed(6) : "N/A"}
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
        <span className="tx-action-text">
          check the transaction and add a new wallet
        </span>
        <button
          className="tx-add-btn"
          onClick={() => {
            const selectedTransfer = filteredTransfers.find(
              (_, i) =>
                `${filteredTransfers[i].txID}_${i}` === selectedTransferKey
            )?.transfer;

            if (!selectedTransfer) {
              return alert("No valid transfer selected.");
            }

            const isSenderSelf =
              selectedTransfer.sender?.toLowerCase() === wallet.toLowerCase();
            const isReceiverSelf =
              selectedTransfer.receiver?.toLowerCase() === wallet.toLowerCase();

            let counterparty = null;

            if (isSenderSelf && !isReceiverSelf) {
              counterparty = selectedTransfer.receiver;
            } else if (!isSenderSelf && isReceiverSelf) {
              counterparty = selectedTransfer.sender;
            } else {
              return alert("Cannot determine which wallet to add.");
            }

            if (
              !counterparty ||
              counterparty.toLowerCase() === wallet.toLowerCase()
            ) {
              return alert("Cannot add the same wallet.");
            }

            onAddWallet({
              from: selectedTransfer.sender,
              to: selectedTransfer.receiver,
              amount: String(selectedTransfer.amount),
            });
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
