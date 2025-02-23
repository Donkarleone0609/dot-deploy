import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, set, get, update } from 'firebase/database';
import { useLocation, Link } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import './ReferralPage.css'; // Импортируем стили

const ReferralPage = () => {
    const [chatId, setChatId] = useState('');
    const [referralLink, setReferralLink] = useState('');
    const [referralCount, setReferralCount] = useState(0);
    const [referralsList, setReferralsList] = useState([]);
    const [error, setError] = useState('');
    const location = useLocation();

    // Получение chatId из Telegram Web App
    useEffect(() => {
        if (WebApp.initDataUnsafe.user) {
            setChatId(WebApp.initDataUnsafe.user.id);
        } else {
            setError('Chat ID not found. Please open this page via Telegram bot.');
        }
    }, []);

    // Генерация реферальной ссылки
    const generateReferralLink = async () => {
        if (!chatId) {
            setError('Chat ID is required to generate a referral link.');
            return;
        }

        try {
            const referralRef = ref(database, `referrals/${chatId}`);
            const snapshot = await get(referralRef);

            if (!snapshot.exists()) {
                await set(referralRef, {
                    referralCount: 0,
                    referrals: [],
                    invitedBy: [],
                });
            }

            const link = `https://t.me/whoisd0t_bot?start=${chatId}`;
            setReferralLink(link);
            setError('');
        } catch (err) {
            console.error('Error generating referral link:', err);
            setError('Failed to generate referral link. Please try again.');
        }
    };

    // Обработка перехода по реферальной ссылке
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const refChatId = queryParams.get('start');

        if (refChatId && refChatId !== chatId) {
            const referralRef = ref(database, `referrals/${refChatId}`);
            const currentUserRef = ref(database, `referrals/${chatId}`);

            get(referralRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const referrals = data.referrals || [];

                    if (!referrals.includes(chatId)) {
                        const updatedReferrals = [...referrals, chatId];
                        const updatedCount = updatedReferrals.length;

                        update(referralRef, {
                            referralCount: updatedCount,
                            referrals: updatedReferrals,
                        });

                        get(currentUserRef).then((currentUserSnapshot) => {
                            if (currentUserSnapshot.exists()) {
                                const currentUserData = currentUserSnapshot.val();
                                const invitedBy = currentUserData.invitedBy || [];

                                if (!invitedBy.includes(refChatId)) {
                                    update(currentUserRef, {
                                        invitedBy: [...invitedBy, refChatId],
                                    });
                                }
                            }
                        });
                    }
                }
            });
        }
    }, [location, chatId]);

    // Получение текущего количества рефералов и списка рефералов
    useEffect(() => {
        if (chatId) {
            const referralRef = ref(database, `referrals/${chatId}`);
            get(referralRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setReferralCount(data.referralCount || 0);
                    setReferralsList(data.referrals || []);
                }
            });
        }
    }, [chatId]);

    // Копирование ссылки в буфер обмена
    const copyToClipboard = () => {
        if (referralLink) {
            navigator.clipboard.writeText(referralLink)
                .then(() => alert('Referral link copied to clipboard!'))
                .catch(() => alert('Failed to copy referral link.'));
        }
    };

    return (
        <div className="referral-page">
            <h1>Referral System</h1>

            {/* Кнопка для генерации реферальной ссылки */}
            <div className="generate-link">
                <button onClick={generateReferralLink} className="generate-button">
                    Generate Referral Link
                </button>
            </div>

            {/* Отображение реферальной ссылки и кнопка для копирования */}
            {referralLink && (
                <div className="referral-link">
                    <p>Your Referral Link:</p>
                    <a href={referralLink} className="link">
                        {referralLink}
                    </a>
                    <button onClick={copyToClipboard} className="copy-button">
                        Copy Link
                    </button>
                </div>
            )}

            {/* Отображение количества рефералов */}
            <div className="referral-count">
                <p>Total Referrals: {referralCount}</p>
            </div>

            {/* Отображение списка рефералов */}
            {referralsList.length > 0 && (
                <div className="referrals-list">
                    <h3>Referrals List:</h3>
                    <ul>
                        {referralsList.map((refChatId, index) => (
                            <li key={index}>User ID: {refChatId}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Отображение ошибок */}
            {error && <p className="error">{error}</p>}

            {/* Нижняя панель с кнопками навигации */}
            <NavigationBar />
        </div>
    );
};

// Компонент для навигации
const NavigationBar = () => (
    <div className="navigation-bar">
        <Link to="/referral" className="nav-button">Referral</Link>
        <Link to="/" className="nav-button">Home</Link>
        <Link to="/click-counter" className="nav-button">Clicker</Link>
    </div>
);

export default ReferralPage;
