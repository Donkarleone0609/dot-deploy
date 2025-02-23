import React, { useEffect, useState } from 'react';
import { TonConnectUIProvider, useTonConnectUI, useTonWallet, TonConnectButton } from '@tonconnect/ui-react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ReferralPage from './ReferralPage';
import ClickCounter from './clicker';
import WebApp from '@twa-dev/sdk';
import './App.css'; // Импортируем стили

function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://orange-used-monkey-420.mypinata.cloud/ipfs/bafkreief5t4vlgrj77jc3tlswclcz2zcx4yspfzh2muahy7c5vehgwrfri">
      <Router>
        <Routes>
          <Route path="/" element={<WalletConnection />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/click-counter" element={<ClickCounter />} />
        </Routes>
      </Router>
    </TonConnectUIProvider>
  );
}

function WalletConnection() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isMobile, setIsMobile] = useState(true);

  const onlyMobile = false;

  // Проверяем, является ли устройство мобильным
  useEffect(() => {
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
    setIsMobile(isMobileDevice);
  }, []);

  // Получаем данные пользователя из Telegram Mini App
  useEffect(() => {
    if (WebApp.initDataUnsafe.user) {
      const user = WebApp.initDataUnsafe.user;
      setUsername(user.username || '');
      setFirstName(user.first_name || '');
    }
  }, []);

  // Если onlyMobile равно true и пользователь заходит с ПК, показываем сообщение
  if (onlyMobile && !isMobile) {
    return (
      <div className="mobile-only-message">
        <h1>DOT COIN</h1>
        <p>Пожалуйста, откройте это приложение на вашем телефоне.</p>
        <p>Это приложение доступно только для мобильных устройств.</p>
      </div>
    );
  }

  return (
    <div className="wallet-connection">
      <div className="content">
        <h1>DOT COIN</h1>
        {firstName && <p>Hello, {firstName}!</p>}
        {username && <p>Your username: @{username}</p>}

        <p className="wallet-instruction">
          Connect your wallet to receive airdrop in the future
        </p>

        <div className="ton-connect-button-container">
          <TonConnectButton />
        </div>
      </div>

      <NavigationBar />
    </div>
  );
}

// Компонент для навигации
const NavigationBar = () => (
  <div className="navigation-bar">
    <Link to="/referral" className="nav-button">Referral</Link>
    <Link to="/" className="nav-button">Home</Link>
    <Link to="/click-counter" className="nav-button">Clicker</Link>
  </div>
);

export default App;
