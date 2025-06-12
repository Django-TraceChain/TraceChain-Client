// src/components/Sidebar.jsx
import React, { useMemo, useState } from "react";
import "./Sidebar.css";

function Sidebar({ wallet, onClose, onAddWallet, walletData, mixingEnabled }) {
  const [keyword, setKeyword] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedTxId, setSelectedTxId] = useState(null);

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

  const filteredTx = useMemo(() => {
    let filtered = [...transactions];

    if (keyword.trim()) {
      const query = keyword.toLowerCase();
      filtered = filtered.filter((tx) =>
        tx.transfers?.some((transfer) => {
          const sender = transfer.sender?.toLowerCase() || "";
          const receiver = transfer.receiver?.toLowerCase() || "";
          const txID = tx.txID?.toLowerCase() || "";
          return (
            txID.includes(query) ||
            sender.includes(query) ||
            receiver.includes(query)
          );
        })
      );
    }

    if (filterType === "in") {
      filtered = filtered.filter((tx) =>
        tx.transfers?.some(
          (transfer) =>
            transfer.receiver?.toLowerCase() === wallet.toLowerCase()
        )
      );
    } else if (filterType === "out") {
      filtered = filtered.filter((tx) =>
        tx.transfers?.some(
          (transfer) => transfer.sender?.toLowerCase() === wallet.toLowerCase()
        )
      );
    } else {
      filtered = filtered.filter((tx) =>
        tx.transfers?.some(
          (transfer) =>
            transfer.sender?.toLowerCase() === wallet.toLowerCase() ||
            transfer.receiver?.toLowerCase() === wallet.toLowerCase()
        )
      );
    }

    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return filtered;
  }, [transactions, keyword, filterType, wallet]);

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
          {filteredTx.length > 0 ? (
            filteredTx.map((tx, i) => {
              const transfer = tx.transfers?.find(
                (t) =>
                  t.sender?.toLowerCase() === wallet.toLowerCase() ||
                  t.receiver?.toLowerCase() === wallet.toLowerCase()
              );
              if (!transfer) return null;

              const isIncoming =
                transfer.receiver?.toLowerCase() === wallet.toLowerCase();
              const counterparty = isIncoming
                ? transfer.sender
                : transfer.receiver;
              const rawAmount = transfer.amount;
              const amountETH =
                rawAmount !== undefined && rawAmount !== null
                  ? Number(rawAmount)
                  : null;

              console.log("[🔍 Amount Debug]", {
                txID: tx.txID,
                rawAmount,
                parsedAmount: amountETH,
                sender: transfer.sender,
                receiver: transfer.receiver,
              });

              const date = new Date(tx.timestamp);
              const dateStr = `${date.getFullYear()}.${(date.getMonth() + 1)
                .toString()
                .padStart(2, "0")}.${date
                .getDate()
                .toString()
                .padStart(2, "0")}`;
              const timeStr = `${date
                .getHours()
                .toString()
                .padStart(2, "0")}:${date
                .getMinutes()
                .toString()
                .padStart(2, "0")}:${date
                .getSeconds()
                .toString()
                .padStart(2, "0")}`;

              return (
                <div
                  key={i}
                  className={`tx-item ${
                    selectedTxId === tx.txID ? "selected" : ""
                  }`}
                  onClick={() => setSelectedTxId(tx.txID)}
                >
                  <span className="tx-address" title={counterparty}>
                    {counterparty || "(unknown)"}
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
                    {amountETH !== null ? amountETH.toFixed(6) : "N/A"}
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
            const selected = filteredTx.find((tx) => tx.txID === selectedTxId);
            const transfer = selected?.transfers?.find(
              (t) =>
                t.sender?.toLowerCase() === wallet.toLowerCase() ||
                t.receiver?.toLowerCase() === wallet.toLowerCase()
            );
            if (!transfer) return alert("No address selected.");

            onAddWallet({
              from: transfer.sender,
              to: transfer.receiver,
              amount: String(transfer.amount),
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
