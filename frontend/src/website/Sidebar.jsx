import React, { useState } from 'react';
import './Sidebar.css';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../authSlice';
import { persistor } from '../store';

const Sidebar = () => {
  const [active, setActive] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); 

  const toggleMenu = () => {
    setActive(!active);
  };

  const handleLogout = () => {
    dispatch(logout());
    persistor.purge();
    navigate('/', { replace: true });
  };

  const menuItems = [
    { name: 'Home', icon: 'home-outline', link: '/home' },
    { name: 'Rewards', icon: 'wallet-outline', link: '/rewards' },
    { name: 'Payment', icon: 'logo-paypal', link: '/payment' },
    { name: 'Contacts', icon: 'call-outline', link: '/contacts' },
    { name: 'Transaction History', icon: 'reader-outline', link: '/transaction-history' },
  ];

  return (
    <div>
      <div className={`menu-toggle ${active ? 'active' : ''}`} onClick={toggleMenu}></div>
      <div className={`sidebar-container ${active ? 'active' : ''}`}>
        <ul>
          <li className="sidebar-item-logo" style={{ '--bg': '#333' }}>
            <Link to="/home" className="sidebar-link">
              <div className="sidebar-icon">
                <ion-icon name="cash-outline"></ion-icon>
              </div>
              <div className="sidebar-text">FINTOP</div>
            </Link>
          </li>
          <div className="MenuList">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.link;
              return (
                <li
                  key={index}
                  className={`sidebar-item ${isActive ? 'active' : ''}`}
                  style={{ '--bg': '#5c6bc0' }}
                >
                  <Link to={item.link} className="sidebar-link">
                    <div className="sidebar-icon">
                      <ion-icon name={item.icon}></ion-icon>
                    </div>
                    <div className="sidebar-text">{item.name}</div>
                  </Link>
                </li>
              );
            })}
          </div>
          <div className="sidebar-bottom">
            <li style={{ '--bg': '#5c6bc0' }} onClick={handleLogout}>
              <div className="sidebar-link">
                <div className="sidebar-icon">
                  <ion-icon name="log-out-outline"></ion-icon>
                </div>
                <div className="sidebar-text">Logout</div>
              </div>
            </li>
          </div>
        </ul>
      </div>
      <Outlet />
    </div>
  );
};

export default Sidebar;
