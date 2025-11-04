import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import './TransactionHistory.css';

const TransactionHistory = () => {
  const { userData } = useSelector((state) => state.auth);
  const currentUserFintopId = userData?.fintop_id || '';

  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 2; 
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortOption, setSortOption] = useState('');
  const filterRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/users/transactions-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
      .then((res) => res.json())
      .then((data) => setTransactions(data))
      .catch((err) => console.error('Error fetching transactions:', err));
  }, []);

  const handleCardClick = async (tx) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/transactions-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: tx.TransactionID })
      });
      if (!response.ok) throw new Error('Failed to fetch transaction details');
      const fullData = await response.json();
      setPopupData(fullData);
      setShowPopup(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTransactionType = (tx) => {
    if (tx.SenderID === currentUserFintopId) return 'sent';
    if (tx.RecipientID === currentUserFintopId) return 'received';
    return 'unknown';
  };

  const handleSort = (option) => {
    setSortOption(option);
    setIsFilterOpen(false);
    setCurrentPage(1);

    let sorted = [...transactions];
    switch (option) {
      case 'first':
        sorted.sort((a, b) => new Date(a.TimeStamp) - new Date(b.TimeStamp));
        break;
      case 'recent':
        sorted.sort((a, b) => new Date(b.TimeStamp) - new Date(a.TimeStamp));
        break;
      case 'amount':
        sorted.sort((a, b) => b.Amount - a.Amount);
        break;
      default:
        break;
    }
    setTransactions(sorted);
  };

  const formatDateAndTime = (ts) => {
    if (!ts) return { dateStr: '', timeStr: '' };
    const dateObj = new Date(ts);
    const dateStr = dateObj.toLocaleDateString();
    const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { dateStr, timeStr };
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupData(null);
  };

  const filtered = transactions.filter((tx) =>
    [tx.FirstName, tx.MobileNumber].join(' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalTransactions = filtered.length;
  const indexOfLast = currentPage * transactionsPerPage;
  const indexOfFirst = indexOfLast - transactionsPerPage;
  const currentTx = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(totalTransactions / transactionsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };
  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const renderCard = (tx, index) => {
    const { dateStr, timeStr } = formatDateAndTime(tx.TimeStamp);
    const type = getTransactionType(tx);
    const borderColor = type === 'sent' ? 'red' : type === 'received' ? 'green' : '#888';

    let message = '';
    if (type === 'sent') {
      message = `₹${tx.Amount} to ${tx.FirstName}`;
    } else if (type === 'received') {
      message = `₹${tx.Amount} from ${tx.FirstName}`;
    } else {
      message = `Transaction: ₹${tx.Amount}`;
    }

    return (
      <div
        key={index}
        className="transaction-card"
        style={{ borderLeft: `5px solid ${borderColor}` }}
        onClick={() => handleCardClick(tx)}
      >
        <div className="transaction-card-content">
          <h3>Date: {dateStr}</h3>
          <h3>Time: {timeStr}</h3>
          <p>Phone: {tx.MobileNumber}</p>
          <p>{message}</p>
        </div>
      </div>
    );
  };

  return (
    <section className="transaction-history-wrapper">
      <div className="transaction-history-content">
        <h1>Transaction History</h1>
        <div className="transaction-history-controls">
          <div className="transaction-history-search-container">
            <span className="transaction-history-search-icon">
              <ion-icon name="search-outline"></ion-icon>
            </span>
            <input
              type="text"
              placeholder="Search"
              className="transaction-history-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search Transactions"
            />
          </div>

          <div className="transaction-history-filter-container" ref={filterRef}>
            <button
              className="transaction-history-filter-button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-label="Filter Transactions"
            >
              <ion-icon name="funnel-sharp"></ion-icon>
              <span className="filter-text">Filter</span>
            </button>
            {isFilterOpen && (
              <div className="filter-dropdown">
                <ul>
                  <li onClick={() => handleSort('first')}>First</li>
                  <li onClick={() => handleSort('recent')}>Recent</li>
                  <li onClick={() => handleSort('amount')}>Amount</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="transaction-cards-container">
          {currentTx.length > 0 ? (
            currentTx.map(renderCard)
          ) : (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              No transactions found.
            </div>
          )}
        </div>

        <div className="transaction-history-pagination">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="pagination-button"
            aria-label="Previous Page"
          >
            <ion-icon name="chevron-back-sharp"></ion-icon>
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="pagination-button"
            aria-label="Next Page"
          >
            <ion-icon name="chevron-forward-sharp"></ion-icon>
          </button>
        </div>
      </div>

      {showPopup && popupData && (
        <div className="transaction-popup-overlay">
          <div className="transaction-popup-content">
            <button className="popup-close-button" onClick={closePopup}>
              &times;
            </button>

            <h2>Transaction Details</h2>
            <div className="popup-details">
              <p><strong>Transaction ID:</strong> {popupData.transaction_id}</p>
              
              <hr className="receipt-separator" />

              <p><strong>Recipient's Name:</strong> {popupData.receiver_name}</p>
              <p><strong>Recipient's Phone:</strong> {popupData.receiver_phone}</p>
              <p><strong>Recipient's Fintop ID:</strong> {popupData.receiver_fintop_id}</p>

              <hr className="receipt-separator" />


              <p><strong>Sender's Name:</strong> {popupData.sender_name}</p>
              <p><strong>Sender's Phone:</strong> {popupData.sender_phone}</p>
              <p><strong>Sender's Fintop ID:</strong> {popupData.sender_fintop_id}</p>

              <hr className="receipt-separator" />


              <p><strong>Amount:</strong> ₹{popupData.amount}</p>
              <p>
                <strong>Payment Status:</strong>{' '}
                <span
                  className={
                    popupData.status === 'Success'
                    ? 'status-success'
                    : 'status-failure'
                  }
                  >
                    {popupData.status}
                </span>
              </p>

              <hr className="receipt-separator" />

              {(() => {
                const dateObj = new Date(popupData.time_stamp);
                const dateStr = dateObj.toLocaleDateString();
                const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <>
                    <p><strong>Date:</strong> {dateStr}</p>
                    <p><strong>Time:</strong> {timeStr}</p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TransactionHistory;
