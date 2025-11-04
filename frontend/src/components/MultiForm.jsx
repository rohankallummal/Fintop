import React, { useState, useEffect } from 'react';
import './MultiForm.css';
import Lottie from 'lottie-react';
import { useNavigate } from 'react-router-dom';

const MultiForm = ({ initialData, onFormSubmit }) => {
  const [step, setStep] = useState(1);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [formData, setFormData] = useState({
    ...initialData,
    description: '',
    AccountNumber: '',
    IFSC_Code: '',
    BankName: '',
    AccountType: '',
    first_name: '',
    phone_number: '',
    fintop_pin: '',
    confirm_fintop_pin: '',
  });
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successAnimationData, setSuccessAnimationData] = useState(null);
  const [isPinValidated, setIsPinValidated] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetch('/assets/success-animation.json')
      .then((response) => response.json())
      .then((data) => setSuccessAnimationData(data))
      .catch((error) => console.error('Error loading success animation:', error));
  }, []);
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const checkUniqueFields = async (fieldsToCheck) => {
    try {
      const response = await fetch('http://localhost:5000/api/users/check-unique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldsToCheck),
      });

      const data = await response.json();
      if (data.exists) {
        setPopupMessage(`The ${data.fields.join(' and ')} already exist.`);
        setShowPopup(true);
        return false;
      }
      return true;
    } catch (error) {
      setPopupMessage('An error occurred while checking unique fields.');
      setShowPopup(true);
      return false;
    }
  };

  const changeStep = async (direction) => {
    if (direction > 0) {
      const valid = await isFormValid();
      if (!valid) {
        return;
      }
      if (step === 4) {
        setIsPinValidated(true);
        return;
      }
    }
    setStep((prev) => prev + direction);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const isFormValid = async () => {
    let message = '';

    switch (step) {
      case 1:
        if (!formData.description.trim()) {
          message = 'Description should not be empty.';
        }
        break;
      case 2:
        if (formData.AccountNumber.trim().length < 8 || !/^\d+$/.test(formData.AccountNumber)) {
          message = 'Account Number must be at least 8 digits long and numeric.';
        } else if (!formData.BankName.trim()) {
          message = 'Bank Name should not be empty.';
        } else if (!/^[A-Za-z]{4}0\d{6}$/.test(formData.IFSC_Code)) {
          message = 'IFSC Code should follow the pattern: 4 letters (bank code), 0, 6 digits.';
        } else if (!formData.AccountType) {
          message = 'Please select an account type.';
        } else {
          const isUnique = await checkUniqueFields({ AccountNumber: formData.AccountNumber });
          if (!isUnique) {
            message = 'Account Number exists.';
            setFormData({ ...formData, AccountNumber: '' });
            setPopupMessage(message);
            setShowPopup(true);
            return false;
          }
        }
        break;
      case 3:
        if (!/^(\+91\s|91\s|91|)([7-9][0-9]{9})$/.test(formData.phone_number)) {
          message = 'Phone Number must follow the format: +91 XXXXXXXXXX.';
        } else if (!formData.first_name.trim()) {
          message = 'First Name should not be empty.';
        }
        break;
        case 4:
          if (!/^\d{4}$/.test(formData.fintop_pin) || !/^\d{4}$/.test(formData.confirm_fintop_pin)) {
            message = 'FINTOP PINs must be exactly 4 digits.';
          } else if (formData.fintop_pin !== formData.confirm_fintop_pin) {
            message = 'FINTOP PINs do not match.';
          }
        break;
        
      default:
        break;
    }

    if (message) {
      setPopupMessage(message);
      setShowPopup(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { confirm_fintop_pin, ...dataToSubmit } = formData;

    try {
      const response = await fetch('http://localhost:5000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        setFormData({
          ...initialData,
          description: '',
          AccountNumber: '',
          IFSC_Code: '',
          BankName: '',
          AccountType: '',
          first_name: '',
          phone_number: '',
          fintop_pin: '',
          confirm_fintop_pin: '',
        });

        setShowSuccessAnimation(true);

        setTimeout(() => {
          setShowSuccessAnimation(false);
          navigate('/signinsignup');
        }, 3500);
      } else {
        setPopupMessage('Failed to submit form data. Please try again.');
        setShowPopup(true);
      }
    } catch (error) {
      setPopupMessage('An error occurred. Please try again.');
      setShowPopup(true);
    }
  };

  return (
    <div className="multiform-body">
      <div className="multiform-container">
        {step === 1 && (
          <form className="multiform-form1">
            <h3>Description</h3>
            <textarea
              name="description"
              placeholder="Enter Business/Personal details"
              rows="5"
              value={formData.description}
              onChange={handleInputChange}
            ></textarea>
            <div className="multiform-btn-box">
              <button type="button" onClick={() => changeStep(1)}>
                Next
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="multiform-form2">
            <h3>Bank Account Details</h3>
            <input
              type="text"
              name="AccountNumber"
              placeholder="Bank Account Number"
              value={formData.AccountNumber}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="IFSC_Code"
              placeholder="IFSC Code"
              value={formData.IFSC_Code}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="BankName"
              placeholder="Bank Name"
              value={formData.BankName}
              onChange={handleInputChange}
            />
            <select
              name="AccountType"
              className="multiform-select"
              value={formData.AccountType}
              onChange={handleInputChange}
            >
              <option value="" disabled>
                Select Account Type
              </option>
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="business">Business</option>
            </select>
            <div className="multiform-btn-box">
              <button type="button" onClick={() => changeStep(-1)}>
                Back
              </button>
              <button type="button" onClick={() => changeStep(1)}>
                Next
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form className="multiform-form3">
            <h3>Personal Info</h3>
            <input
              type="text"
              name="first_name"
              placeholder="First Name"
              value={formData.first_name}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="phone_number"
              placeholder="Phone Number"
              value={formData.phone_number}
              onChange={handleInputChange}
            />
            <div className="multiform-btn-box">
              <button type="button" onClick={() => changeStep(-1)}>
                Back
              </button>
              <button type="button" onClick={() => changeStep(1)}>
                Next
              </button>
            </div>
          </form>
        )}

        {step === 4 && (
          <form className="multiform-form4" onSubmit={handleSubmit}>
            <h3>FINTOP PIN</h3>
            <input
              type="password"
              name="fintop_pin"
              placeholder="Enter FINTOP PIN"
              value={formData.fintop_pin}
              onChange={handleInputChange}
            />
            <input
              type="password"
              name="confirm_fintop_pin"
              placeholder="Re-enter FINTOP PIN"
              value={formData.confirm_fintop_pin}
              onChange={handleInputChange}
            />
            <div className="multiform-btn-box">
              <button type="button" onClick={() => changeStep(-1)}>
                Back
              </button>
              {!isPinValidated ? (
                <button type="button" onClick={() => changeStep(1)}>
                  Submit
                </button>
              ) : (
                <button type="submit">Submit</button>
              )}
            </div>
          </form>
        )}

        <div className="multiform-step-row">
          <div id="multiform-progress" style={{ width: `${(step / 4) * 100}%` }}></div>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="multiform-step-col">
              <small>Step {s}</small>
            </div>
          ))}
        </div>
      </div>

      {showPopup && (
        <div className="multiform-popup" onClick={closePopup}>
          <div className="multiform-popup-content">
            <p>{popupMessage}</p>
            <button onClick={closePopup}>OK</button>
          </div>
        </div>
      )}

      {showSuccessAnimation && (
        <div className="multiform-animation-popup-overlay">
          <div className="multiform-animation-popup-content">
            {successAnimationData && (
              <Lottie
                animationData={successAnimationData}
                loop={false}
                style={{ width: 250, height: 250 }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiForm;
