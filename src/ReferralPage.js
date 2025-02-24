import React, { useEffect, useState } from 'react';
import { useTonWallet } from '@tonconnect/ui-react';
import { database, ref, get, set } from './firebase';
import { useLocation } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

const ReferralPage = () => {
  const wallet = useTonWallet();
  const [referralLink, setReferralLink] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const location = useLocation();
  const [chatId, setChatId] = useState('');

  useEffect(() => {
    if (WebApp.initDataUnsafe.user) {
      const user = WebApp.initDataUnsafe.user;
      setChatId(user.id);
    }
  }, []);

  useEffect(() => {
    if (chatId) {
      const link = `https://your-app-url.com?start=${chatId}`;
      setReferralLink(link);

      // Получаем текущее количество рефералов
      const referralRef = ref(database, `referrals/${chatId}`);
      get(referralRef).then((snapshot) => {
        if (snapshot.exists()) {
          setReferralCount(snapshot.val().referralCount || 0);
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
    </div>
  );
};

export default ReferralPage;
