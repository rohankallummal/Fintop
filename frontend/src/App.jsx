import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import SignInSignUp from './components/SignInSignUp';
import MultiForm from './components/MultiForm';
import Sidebar from './website/Sidebar';
import Home from './website/Home';
import Rewards from './website/Rewards';
import Payment from './website/Payment';
import Contacts from './website/Contacts';
import TransactionHistory from './website/TransactionHistory';
import { useSelector } from 'react-redux';

function App() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Router>
      <Routes>
        {!isAuthenticated && (
          <>
            <Route path="/" element={<SignInSignUp />} />
            <Route path="/multiform" element={<MultiForm />} />
          </>
        )}

        {isAuthenticated && (
          <Route element={<Sidebar />}>
            <Route path="/home" element={<Home />} />
            <Route path="/rewards" element={<Rewards />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route
              path="/transaction-history"
              element={<TransactionHistory />}
            />
          </Route>
        )}

        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? '/home' : '/'} replace />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
