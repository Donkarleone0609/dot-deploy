import React, { useEffect, useState } from 'react';
import { database, ref, get } from './firebase';
import WebApp from '@twa-dev/sdk';
import { Link } from 'react-router-dom';
import './ReferralPage.css';

const ReferralPage = () => {
    const [referralLink, setReferralLink] = useState('');
    const [referralCount, setReferralCount] = useState(0);
    const [chatId, setChatId] = useState('');
    const [referralsList, setReferralsList] = useState([]); // Состояние для списка рефералов

    useEffect(() => {
        if (WebApp.initDataUnsafe.user) {
            const user = WebApp.initDataUnsafe.user;
            setChatId(user.id);
        }
    }, []);

    useEffect(() => {
        if (chatId) {
            const link = `https://t.me/whoisd0t_bot?start=${chatId}`;
            setReferralLink(link);

            // Получаем количество рефералов
            const referralRef = ref(database, `referrals/${chatId}`);
            get(referralRef).then((snapshot) => {
                if (snapshot.exists()) {
                    setReferralCount(snapshot.val().referralCount || 0);
                }
            });

            // Получаем список рефералов
            const userReferralsRef = ref(database, `users/${chatId}/referrals`);
            get(userReferralsRef).then(async (snapshot) => {
                if (snapshot.exists()) {
                    const referrals = snapshot.val();
                    const referralsData = await Promise.all(
                        referrals.map(async (referralId) => {
                            const userRef = ref(database, `users/${referralId}`);
                            const userSnapshot = await get(userRef);
                            if (userSnapshot.exists()) {
                                const userData = userSnapshot.val();
                                return {
                                    id: referralId,
                                    name: userData.name || 'Unknown', // Имя пользователя
                                    coins: userData.clickCount || 0, // Количество монет
                                };
                            }
                            return null;
                        })
                    );
                    setReferralsList(referralsData.filter(Boolean)); // Убираем null из списка
                }
            });
        }
    }, [chatId]);

    // Функция для округления числа монет
    const roundCoins = (coins) => {
        const thresholds = [100, 1000, 10000, 100000, 1000000];
        for (let threshold of thresholds) {
            if (coins < threshold) {
                return threshold;
            }
        }
        return thresholds[thresholds.length - 1]; // Возвращаем максимальное значение, если монет больше
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('Referral link copied to clipboard!');
        });
    };

    return (
        <div className="referral-page">
            <h1 className="title">Referral System</h1>
            <div className="description">Your referral link:</div>
            <div className="referral-link">
                <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="link-input"
                />
                <button onClick={handleCopyLink} className="copy-button">Copy Link</button>
            </div>
            <div className="referral-count">Total referrals: {referralCount}</div>

            {/* Отображение списка рефералов */}
            <div className="referrals-list">
                <h2>Your Referrals:</h2>
                {referralsList.length > 0 ? (
                    <ul>
                        {referralsList.map((referral, index) => (
                            <li key={index}>
                                <span className="referral-name">{referral.name}</span>
                                <span className="referral-coins">
                                    Coins: {roundCoins(referral.coins)}
                                </span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No referrals yet.</p>
                )}
            </div>

            <NavigationBar /> {/* Используем новый компонент NavigationBar */}
        </div>
    );
};

const NavigationBar = () => (
    <div className="navigation-bar">
        <Link to="/referral" className="nav-button">Referral</Link>
        <Link to="/" className="nav-button">Home</Link>
        <Link to="/click-counter" className="nav-button">Clicker</Link>
        <Link to="/rewards" className="nav-button">Rewards</Link>
    </div>
);

export default ReferralPage;
