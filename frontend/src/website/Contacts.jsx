import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './Contacts.css';
import Lottie from 'lottie-react';

const Contacts = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterOption, setFilterOption] = useState('None');
  const [animationData1, setAnimationData1] = useState(null);
  const [animationData2, setAnimationData2] = useState(null);
  const [isAnimation1, setIsAnimation1] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;
  const navigate = useNavigate();

  const userData = useSelector((state) => state.auth.userData);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'http://localhost:5000/api/users/contactinfo',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          }
        );
        if (response.ok) {
          const contacts = await response.json();
          const filteredContacts = contacts.filter(
            (contact) => contact.phone_number !== userData.phone_number
          );
          setData(filteredContacts);
          setFilteredData(filteredContacts);
        } else {
          console.error('Failed to fetch contact information');
        }
      } catch (error) {
        console.error('Error fetching contact information:', error);
      }
    };

    fetchData();
  }, [userData]);

  useEffect(() => {
    fetch('/assets/animation3.json')
      .then((response) => response.json())
      .then((data) => setAnimationData1(data))
      .catch((error) =>
        console.error('Error loading first animation:', error)
      );

    fetch('/assets/animation4.json')
      .then((response) => response.json())
      .then((data) => setAnimationData2(data))
      .catch((error) =>
        console.error('Error loading second animation:', error)
      );
  }, []);

  useEffect(() => {
    const toggleAnimation = () => {
      setIsAnimation1((prev) => !prev);
    };

    const timer = setTimeout(
      toggleAnimation,
      isAnimation1 ? 4000 : 2000
    );

    return () => clearTimeout(timer);
  }, [isAnimation1]);

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = data.filter(
      (contact) =>
        contact.first_name.toLowerCase().includes(query) ||
        contact.phone_number.toLowerCase().includes(query)
    );

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen((open) => !open);
  };

  const handleFilterSelection = (option) => {
    setFilterOption(option);
    setIsDropdownOpen(false);

    let newList = [...data];
    if (option === 'Ascending') {
      newList.sort((a, b) =>
        a.first_name.localeCompare(b.first_name)
      );
    } else if (option === 'Descending') {
      newList.sort((a, b) =>
        b.first_name.localeCompare(a.first_name)
      );
    } else if (option === 'Pending Payments') {
      newList = data.filter(
        (contact) => contact.request_status === 'Pending'
      );
    }
    setFilteredData(newList);
    setCurrentPage(1);
  };

  const handleRowClick = (contact) => {
    const { fintop_id, request_status, request_amount } = contact;
    let queryParams = `fintop_id=${encodeURIComponent(fintop_id)}`;
    if (request_status === 'Pending') {
      queryParams += `&amount=${encodeURIComponent(
        request_amount
      )}`;
    }
    navigate(`/payment?${queryParams}`);
  };

  return (
    <div className="contacts-wrapper">
      <div className="contacts-container">
        <div className="contacts-text">Contacts</div>

        <div className="search-filter-container">
          <div className="search-input-container">
            <ion-icon
              name="search-sharp"
              className="search-icon"
            />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
          </div>

          <div className="filter-input-container">
            <ion-icon
              name="funnel-outline"
              className="filter-icon"
            />
            <button
              className="filter-button"
              onClick={toggleDropdown}
            >
              {filterOption}
            </button>
            {isDropdownOpen && (
              <div
                className="dropdown-menu"
                onClick={(e) => e.stopPropagation()}
              >
                <div onClick={() => handleFilterSelection('None')}>
                  None
                </div>
                <div
                  onClick={() =>
                    handleFilterSelection('Ascending')
                  }
                >
                  Ascending
                </div>
                <div
                  onClick={() =>
                    handleFilterSelection('Descending')
                  }
                >
                  Descending
                </div>
                <div
                  onClick={() =>
                    handleFilterSelection('Pending Payments')
                  }
                >
                  Pending Payments
                </div>
              </div>
            )}
          </div>
        </div>

        {filteredData.length > 0 ? (
          <>
            <table className="contacts-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile Number</th>
                  <th>Fintop ID</th>
                  <th>Request</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredData
                  .slice(
                    (currentPage - 1) * PAGE_SIZE,
                    currentPage * PAGE_SIZE
                  )
                  .map((row, idx) => (
                    <tr
                      key={idx}
                      onClick={() => handleRowClick(row)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>{row.first_name}</td>
                      <td>{row.phone_number}</td>
                      <td>{row.fintop_id}</td>
                      <td>{row.request_status || '-'}</td>
                      <td>{row.request_amount || '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="pagination-controls">
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.max(p - 1, 1))
                }
                disabled={currentPage === 1}
              >
                <ion-icon name="chevron-back-sharp" />
              </button>
              <span>Page {currentPage}</span>
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(
                      p + 1,
                      Math.ceil(filteredData.length / PAGE_SIZE)
                    )
                  )
                }
                disabled={
                  currentPage ===
                  Math.ceil(filteredData.length / PAGE_SIZE)
                }
              >
                <ion-icon name="chevron-forward-sharp" />
              </button>
            </div>
          </>
        ) : (
          <p>No contacts available</p>
        )}
      </div>

      <div className="contacts-animations">
        {animationData1 && animationData2 && (
          <Lottie
            animationData={
              isAnimation1 ? animationData1 : animationData2
            }
            loop={false}
            style={{ width: '300px', height: '400px' }}
          />
        )}
      </div>
    </div>
  );
};

export default Contacts;
