// NavigationBar.js
import React from 'react';
import { Link } from 'react-router-dom';

const NavigationBar = () => (
  <div className="navigation-bar">
    <Link to="/referral" className="nav-button">Referral</Link>
    <Link to="/" className="nav-button">Home</Link>
    <Link to="/click-counter" className="nav-button">Clicker</Link>
    <Link to="/rewards" className="nav-button">Rewards</Link>
  </div>
);

export default NavigationBar;
