import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, set, get, update, runTransaction } from 'firebase/database';
import { useLocation, Link } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import './ReferralPage.css';

const ReferralPage = () => {
    const [chatId, setChatId] = useState('');
    const [referralLink, setReferralLink] = useState('');
    const [referralCount, setReferralCount] = useState(0);
    const [referralsList, setReferralsList] = useState([]);
    const [error, setError] = useState('');
    const location = useLocation();

    // Переменная для контроля самоприглашения
    const allowSelfReferral = true; // Измените на false, чтобы запретить самоприглашение

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

        if (refChatId && chatId) {
            // Проверка на самоприглашение
            if (!allowSelfReferral && refChatId === chatId) {
                setError('Self-referral is not allowed.');
                return;
            }

            const referralRef = ref(database, `referrals/${refChatId}`);
            const currentUserRef = ref(database, `referrals/${chatId}`);

            get(referralRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const referrals = data.referrals || [];

                    if (!referrals.includes(chatId)) {
                        const updatedReferrals = [...referrals, chatId];
                        const updatedCount = updatedReferrals.length;

                        // Начисляем монеты за нового реферала
                        const coinsEarned = 5000 * updatedCount;

                        // Обновляем данные в Firebase
                        runTransaction(referralRef, (referralData) => {
                            if (referralData) {
                                referralData.referralCount = updatedCount;
                                referralData.referrals = updatedReferrals;
                            }
                            return referralData;
                        });

                        // Обновляем монеты пользователя
                        const userRef = ref(database, `users/${refChatId}`);
                        get(userRef).then((userSnapshot) => {
                            if (userSnapshot.exists()) {
                                const userData = userSnapshot.val();
                                const newClickCount = (userData.clickCount || 0) + coinsEarned;

                                update(userRef, {
                                    clickCount: newClickCount,
                                });
                            }
                        });

                        // Добавляем refChatId в список "пригласивших" текущего пользователя
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
    }, [location.search, chatId, allowSelfReferral]);

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
            }).catch((err) => {
                console.error('Error fetching referral data:', err);
                setError('Failed to fetch referral data. Please try again.');
            });
        }
    }, [chatId]);

    // Копирование ссылки в буфер обмена
    const copyToClipboard = () => {
        if (referralLink) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(referralLink)
                    .then(() => alert('Referral link copied to clipboard!'))
                    .catch(() => alert('Failed to copy referral link. Please try again.'));
            } else {
                alert('Clipboard API is not supported in your browser.');
            }
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

// Навигационная панель
const NavigationBar = () => (
    <div className="navigation-bar">
        <Link to="/referral" className="nav-button">Referral</Link>
        <Link to="/" className="nav-button">Home</Link>
        <Link to="/click-counter" className="nav-button">Clicker</Link>
        <Link to="/rewards" className="nav-button">Rewards</Link>
    </div>
);

export default ReferralPage;
