import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch} from 'react-redux'; 
import Lottie from 'lottie-react';
import { motion } from 'framer-motion';
import { FaCopy, FaCheck } from 'react-icons/fa';
import QRCode from 'qrcode';
import { loginSuccess } from '../authSlice';
import './Home.css';

const Home = () => {
  const userData = useSelector((state) => state.auth.userData);
  const dispatch = useDispatch();

  const [animationData, setAnimationData] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    first_name: '',
    emailID: '',
    description: '',
  });

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const [copyStatus, setCopyStatus] = useState({ fintop_id: false, amount: false });

  const [showQRPopup, setShowQRPopup] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    fetch('/assets/animation1.json')
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error('Error loading animation:', error));
  }, []);

  useEffect(() => {
    if (userData) {
      setProfileData({
        username: userData.username || '',
        first_name: userData.first_name || '',
        emailID: userData.emailID || '',
        description: userData.description || '',
      });
    }
  }, [userData]);

  useEffect(() => {
    if (showQRPopup && userData?.fintop_id) {
      generateQRCode(userData.fintop_id);
    }
  }, [showQRPopup, userData]);

  const generateQRCode = async (text) => {
    try {
      const dataUrl = await QRCode.toDataURL(text, {
        width: 500,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadRef = React.useRef(null);

  const handleShare = async () => {
    if (!qrDataUrl) return;
    try {
      const blob = await (await fetch(qrDataUrl)).blob();
      const file = new File([blob], 'QRCode.png', { type: blob.type });
      await navigator.share({
        files: [file],
        title: userData?.fintop_id || 'FINTOP QR',
      });
    } catch (error) {
      alert("Your browser doesn't support sharing.");
    }
  };

const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com)$/;

const handleEditOrSave = async () => {
  if (isEditing) {
    if (!emailPattern.test(profileData.emailID)) {
      setPopupMessage('Please enter a valid email (must be @gmail.com, @yahoo.com or @outlook.com).');
      setShowPopup(true);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/users/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:     userData.user_id,
          username:    profileData.username,
          first_name:  profileData.first_name,
          emailID:     profileData.emailID,
          description: profileData.description,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || 'Update failed');
      }

      dispatch(loginSuccess({
        ...userData,
        username:    result.username,
        first_name:  result.first_name,
        emailID:     result.emailID,
        description: result.description,
      }));
      setPopupMessage('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      setPopupMessage(err.message || 'Failed to update profile.');
    }
    setShowPopup(true);
  }

  setIsEditing(!isEditing);
};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopy = async (field) => {
    try {
      let textToCopy;
      if (field === 'fintop_id') {
        textToCopy = userData?.fintop_id || 'Not Available';
      } else {
        textToCopy = `₹${userData?.BankAccount?.Amount || '0.00'}`;
      }
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus((prev) => ({ ...prev, [field]: true }));
      setTimeout(() => {
        setCopyStatus((prev) => ({ ...prev, [field]: false }));
      }, 2000);
    } catch {
      setPopupMessage('Failed to copy to clipboard.');
      setShowPopup(true);
    }
  };

  if (!userData) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="home-wrapper">
      <div className="home-content">
        {animationData && (
          <Lottie
            animationData={animationData}
            loop={true}
            className="home-lottie-animation"
            style={{ width: 600, height: 600, margin: '0 auto' }}
          />
        )}
        <motion.h1
          className="welcome-message"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          whileHover={{ scale: 1.2, color: '#6a0dad' }}
        >
          Welcome {userData.first_name}
        </motion.h1>

        <div className="fintop-info">
          <motion.div
            className="fintop-id"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
            onClick={() => setShowQRPopup(true)} 
            style={{ cursor: 'pointer' }}
          >
            <h2>
              <ion-icon name="qr-code-outline" style={{ marginRight: '8px' }}></ion-icon>
            </h2>
            <div className="info-with-copy">
              <p>{userData.fintop_id || 'Not Available'}</p>
              <button
                className="copy-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy('fintop_id');
                }}
              >
                {copyStatus.fintop_id ? <FaCheck color="#4caf50" /> : <FaCopy />}
              </button>
            </div>
          </motion.div>

          <motion.div
            className="amount"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.7 }}
          >
            <h2>Your Account Balance</h2>
            <div className="info-with-copy">
              <p>₹{userData.BankAccount?.Amount || '0.00'}</p>
              <button className="copy-button" onClick={() => handleCopy('amount')}>
                {copyStatus.amount ? <FaCheck color="#4caf50" /> : <FaCopy />}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="profile-container">
        <h2>Profile</h2>
        <img src="profile.jpg" alt="Profile" className="profile-picture" />
        <form>
          <label>
            Username:
            <input
              type="text"
              name="username"
              value={profileData.username}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={isEditing ? 'input-editing' : 'input-readonly'}
            />
          </label>
          <label>
            Name:
            <input
              type="text"
              name="first_name"
              value={profileData.first_name}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={isEditing ? 'input-editing' : 'input-readonly'}
            />
          </label>
          <label>
            Email ID:
            <input
              type="email"
              name="emailID"
              value={profileData.emailID}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={isEditing ? 'input-editing' : 'input-readonly'}
            />
          </label>
          <label>
            Description:
            <input
              type="text"
              name="description"
              value={profileData.description}
              onChange={handleInputChange}
              readOnly={!isEditing}
              className={isEditing ? 'input-editing' : 'input-readonly'}
            />
          </label>
          <button type="button" onClick={handleEditOrSave}>
            {isEditing ? 'Save Changes' : 'Edit'}
          </button>
        </form>
      </div>

      {showPopup && (
        <div className="popup" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <p>{popupMessage}</p>
            <button onClick={() => setShowPopup(false)}>OK</button>
          </div>
        </div>
      )}

      {showQRPopup && (
        <div className="qr-popup-overlay">
          <div className="qr-popup-content">
            <button
              className="qr-popup-close"
              onClick={() => setShowQRPopup(false)}
              aria-label="Close Popup"
            >
              &times;
            </button>
            <h2>FINTOP QR Code</h2>
            <div className="qr-code-display">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Fintop QR Code"
                  style={{ maxWidth: '100%', maxHeight: '500px' }}
                />
              ) : (
                <p>Generating QR code...</p>
              )}
            </div>

            <div className="qr-action-container">
              <a
                ref={downloadRef}
                href={qrDataUrl || '#'}
                className="qr-download qr-btn"
                download="QRCode.png"
              >
                <span>Download</span>
                <img src="download.svg" alt="download icon" />
              </a>
              <button className="qr-btn qr-share-btn" onClick={handleShare}>
                <span>Share</span>
                <img src="share.svg" alt="share icon" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
