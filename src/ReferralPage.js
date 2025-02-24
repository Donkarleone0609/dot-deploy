import React, { useEffect, useState } from 'react';
import { database, ref, set, get } from './firebase';
import WebApp from '@twa-dev/sdk';
import { Link } from 'react-router-dom';

const ReferralPage = () => {
  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [chatId, setChatId] = useState('');

  useEffect(() => {
    if (WebApp.initDataUnsafe.user) {
      const user = WebApp.initDataUnsafe.user;
      setChatId(user.id);
    }
  }, []);

  useEffect(() => {
    if (chatId) {
      // Генерация реферальной ссылки
      const link = `https://t.me/whoisd0t_bot/dot?start=${chatId}`;
      setReferralLink(link);

      // Проверяем, существует ли запись в Firebase
      const referralRef = ref(database, `referrals/${chatId}`);
      get(referralRef).then((snapshot) => {
        if (snapshot.exists()) {
          setReferralCount(snapshot.val().referralCount || 0);
        } else {
          // Если записи нет, создаем ее с referralCount = 0
          set(referralRef, { referralCount: 0 });
        }
      });
    }
  }, [chatId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      alert('Referral link copied to clipboard!');
    });
  };

  return (
    <div className="referral-page">
      <h1>Referral System</h1>
      <p>Your referral link:</p>
      <input type="text" value={referralLink} readOnly />
      <button onClick={handleCopyLink}>Copy Link</button>
      <p>Total referrals: {referralCount}</p>

      {/* Навигационные кнопки */}
      <NavigationBar />
    </div>
  );
};

// Компонент навигации
const NavigationBar = () => (
  <div className="navigation-bar">
    <Link to="/referral" className="nav-button">Referral</Link>
    <Link to="/" className="nav-button">Home</Link>
    <Link to="/click-counter" className="nav-button">Clicker</Link>
    <Link to="/rewards" className="nav-button">Rewards</Link>
  </div>
);

export default ReferralPage;
