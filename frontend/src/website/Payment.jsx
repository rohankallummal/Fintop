import React, { useState, useEffect } from 'react';
import './Payment.css';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import { useLocation } from 'react-router-dom';

const Payment = () => {
  const [paymentAnimationData, setPaymentAnimationData] = useState(null);
  const [requestAnimationData, setRequestAnimationData] = useState(null);
  const [errorAnimationData, setErrorAnimationData] = useState(null);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [showAnimationPopup, setShowAnimationPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [isRequest, setIsRequest] = useState(false);
  const [password, setPassword] = useState('');
  const [fintopId, setFintopId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

  const location = useLocation();

  useEffect(() => {
    fetch('/assets/payment-animation.json')
      .then((response) => response.json())
      .then((data) => setPaymentAnimationData(data))
      .catch((error) => console.error('Error loading payment animation:', error));

    fetch('/assets/request-animation.json')
      .then((response) => response.json())
      .then((data) => setRequestAnimationData(data))
      .catch((error) => console.error('Error loading request animation:', error));
    
    fetch('/assets/insufficientamount.json')
      .then((r) => r.json())
      .then(setErrorAnimationData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fintopIdParam = params.get('fintop_id');
    const amountParam = params.get('amount');

    if (fintopIdParam) {
      setFintopId(fintopIdParam);
    }

    if (amountParam) {
      setPaymentAmount(amountParam);
    }
  }, [location]);

  const handleProceedToPay = () => {
    setIsRequest(false);
    setShowPasswordPopup(true);
  };

  const handleRequest = () => {
    setIsRequest(true);
    setShowPasswordPopup(true);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handlePopupSubmit = async () => {
    if (!fintopId || !paymentAmount || !password) {
      alert('Please fill out all fields.');
      return;
    }

    const endpoint = isRequest
      ? 'http://localhost:5000/api/users/request'
      : 'http://localhost:5000/api/users/pay';
    const payload = {
      toFintopId: fintopId,
      amount: parseFloat(paymentAmount),
      fintopPin: password,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.message && result.message.toLowerCase().includes('insufficient balance')) {
          setShowPasswordPopup(false);
          setShowErrorPopup(true);
          return;
        }
        throw new Error(result.message || 'Something went wrong');
      }

      setShowPasswordPopup(false);
      setShowAnimationPopup(true);

      const timer = setTimeout(() => {
        setShowAnimationPopup(false);
        resetForm();
      }, 3500);

      return () => clearTimeout(timer);
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleClosePopup = () => {
    setShowPasswordPopup(false);
  };

  const closeErrorPopup = () => {
    setShowErrorPopup(false);
    resetForm();
  };

  const resetForm = () => {
    setFintopId('');
    setPaymentAmount('');
    setPassword('');
  };

  return (
    <div className="payment-wrapper">
      <div className="payment-container">
        <h2 className="payment-header">
          <ion-icon name="card" style={{ marginRight: 8, fontSize: 60, verticalAlign: 'middle' }}></ion-icon>
          Payment
        </h2>

        <div className="input-group">
          <div className="input-with-icon">
            <ion-icon name="person-outline"></ion-icon>
            <input
              type="text"
              id="fintop-id"
              placeholder="Enter Fintop ID"
              value={fintopId}
              onChange={(e) => setFintopId(e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <div className="input-with-icon">
            <ion-icon name="server-outline"></ion-icon>
            <input
              type="number"
              id="payment-amount"
              placeholder="Enter payment amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </div>
        </div>

        <div className="button-group">
          <motion.button
            className="request-button"
            onClick={handleRequest}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ion-icon name="pencil-sharp"></ion-icon>
            Request
          </motion.button>

          <motion.button
            className="payment-button"
            onClick={handleProceedToPay}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ion-icon name="trending-up-outline"></ion-icon>
            Pay
          </motion.button>
        </div>
      </div>

      {/* Password Popup */}
      {showPasswordPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Fintop</h3>
            <input
              type="password"
              placeholder="Enter PIN"
              value={password}
              onChange={handlePasswordChange}
              className="password-input"
            />
            <div className="popup-buttons">
              <button onClick={handlePopupSubmit} className="submit-button">
                Submit
              </button>
              <button onClick={handleClosePopup} className="close-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnimationPopup && (
        <div className="animation-popup-overlay">
          <div className="animation-popup-content">
            <Lottie
              animationData={isRequest ? requestAnimationData : paymentAnimationData}
              loop={false}
              style={{ width: '300px', height: '300px' }}
            />
          </div>
        </div>
      )}

      {showErrorPopup && (
       <div className="error-popup-overlay">
         <div className="error-popup-content">
           {errorAnimationData && (
             <Lottie
               animationData={errorAnimationData}
               loop={false}
               style={{ width: '300px', height: '300px' }}
            />
           )}
           <p className="error-text">Transaction failure: insufficient balance.</p>
           <button className="error-ok-button" onClick={closeErrorPopup}>
             OK
           </button>
         </div>
       </div>
     )}
    </div>
  );
};

export default Payment;
