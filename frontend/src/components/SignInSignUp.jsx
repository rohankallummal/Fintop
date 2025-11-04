import React, { useState, useEffect, useRef } from 'react';
import './SignInSignUp.css';
import MultiForm from './MultiForm';
import * as THREE from 'three';
import GLOBE from 'vanta/dist/vanta.globe.min';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginSuccess } from '../authSlice';

const SignInSignUp = () => {
  const [isActive, setIsActive] = useState(false);
  const [signUpValues, setSignUpValues] = useState({ username: '', emailID: '', app_password: '' });
  const [signInValues, setSignInValues] = useState({ emailID: '', app_password: '' });
  const [popupMessage, setPopupMessage] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [isMultiFormVisible, setIsMultiFormVisible] = useState(false);
  const vantaRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const vantaEffect = GLOBE({
      el: vantaRef.current,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      color: 0x0077ff,
      THREE: THREE,
    });
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const toggleForm = () => setIsActive((a) => !a);

  const handleSignUpInputChange = (e) => {
    const { id, value } = e.target;
    setSignUpValues({ ...signUpValues, [id]: value });
  };

  const handleSignInInputChange = (e) => {
    const { id, value } = e.target;
    setSignInValues({ ...signInValues, [id]: value });
  };

  const validateSignUpForm = () => {
    const { username, emailID, app_password } = signUpValues;
    const emailPattern = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com)$/;
    const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!username || !emailID || !app_password) {
      setPopupMessage('Name, email, and password must not be empty.');
      return false;
    }
    if (!emailPattern.test(emailID)) {
      setPopupMessage('Please enter a valid email address (e.g., @gmail.com, @yahoo.com).');
      return false;
    }
    if (!passwordPattern.test(app_password)) {
      setPopupMessage(
        'Password must be at least 8 characters, include letters, numbers, and a special character.'
      );
      return false;
    }
    return true;
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    if (!validateSignUpForm()) {
      setShowPopup(true);
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/users/check-unique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: signUpValues.username, emailID: signUpValues.emailID }),
      });
      const data = await response.json();
      if (data.exists) {
        const fields = data.fields.join(' and ');
        setPopupMessage(`The ${fields} already exist.`);
        setShowPopup(true);
      } else {
        setIsMultiFormVisible(true);
      }
    } catch {
      setPopupMessage('An error occurred while checking for existing users.');
      setShowPopup(true);
    }
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/users/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signInValues),
      });
      if (response.ok) {
        const userData = await response.json();
        dispatch(loginSuccess(userData));
        navigate('/home', { replace: true });
      } else {
        setPopupMessage('Invalid credentials. Please try again.');
        setShowPopup(true);
      }
    } catch {
      setPopupMessage('An error occurred during authentication. Please try again.');
      setShowPopup(true);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setSignUpValues({ username: '', emailID: '', app_password: '' });
    setSignInValues({ emailID: '', app_password: '' });
  };

  const handleMultiFormSubmit = () => {
    setIsMultiFormVisible(false);
    setSignUpValues({ username: '', emailID: '', app_password: '' });
  };

  return (
    <div ref={vantaRef} className="signin-signup-body">
      {!isMultiFormVisible ? (
        <div className={`signin-signup-container ${isActive ? 'active' : ''}`}>
          {/* Sign Up Form */}
          <div className="signin-signup-form-container signin-signup-sign-up">
            <form id="signupForm" onSubmit={handleSignUpSubmit}>
              <h1>Create Account</h1>
              <div className="signup-input-container">
                <ion-icon name="person-add" />
                <input
                  type="text"
                  id="username"
                  placeholder="User Name"
                  value={signUpValues.username}
                  onChange={handleSignUpInputChange}
                />
              </div>
              <div className="signup-input-container">
                <ion-icon name="mail" />
                <input
                  type="email"
                  id="emailID"
                  placeholder="Email"
                  value={signUpValues.emailID}
                  onChange={handleSignUpInputChange}
                />
              </div>
              <div className="signup-input-container">
                <ion-icon name="key" />
                <input
                  type="password"
                  id="app_password"
                  placeholder="Password"
                  value={signUpValues.app_password}
                  onChange={handleSignUpInputChange}
                />
              </div>
              <button type="submit">Sign Up</button>
            </form>
          </div>

          <div className="signin-signup-form-container signin-signup-sign-in">
            <form onSubmit={handleSignInSubmit}>
              <h1>Sign In</h1>
              <div className="signin-input-container">
                <ion-icon name="mail-outline" />
                <input
                  type="email"
                  id="emailID"
                  placeholder="Email"
                  value={signInValues.emailID}
                  onChange={handleSignInInputChange}
                />
              </div>
              <div className="signin-input-container">
                <ion-icon name="key-outline" />
                <input
                  type="password"
                  id="app_password"
                  placeholder="Password"
                  value={signInValues.app_password}
                  onChange={handleSignInInputChange}
                />
              </div>
              <button type="submit">Sign In</button>
            </form>
          </div>

          <div className="signin-signup-toggle-container">
            <div className="signin-signup-toggle">
              <div className="signin-signup-toggle-panel signin-signup-toggle-left">
                <h1>Welcome Back!</h1>
                <p>Enter your personal details to use all of the site's features</p>
                <button className="hidden" onClick={toggleForm}>
                  Sign In
                </button>
              </div>
              <div className="signin-signup-toggle-panel signin-signup-toggle-right">
                <h1>Hello, Friend!</h1>
                <p>Register with your personal details to use all of the site's features</p>
                <button className="hidden" onClick={toggleForm}>
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          {showPopup && (
            <div className="signin-signup-popup">
              <div className="signin-signup-popup-content">
                <p>{popupMessage}</p>
                <button onClick={closePopup}>OK</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <MultiForm initialData={signUpValues} onFormSubmit={handleMultiFormSubmit} />
      )}
    </div>
  );
};

export default SignInSignUp;
