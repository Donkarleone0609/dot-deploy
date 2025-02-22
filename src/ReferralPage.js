import React, { useState, useEffect } from 'react';
import { database } from './firebase'; // Импортируем Firebase
import { ref, set, get, update } from 'firebase/database'; // Импортируем методы Firebase
import { useLocation, Link } from 'react-router-dom'; // Импортируем useLocation и Link для навигации
import WebApp from '@twa-dev/sdk'; // Импортируем SDK для Telegram Web Apps

const ReferralPage = () => {
    const [chatId, setChatId] = useState(''); // ID текущего пользователя (chatId из Telegram)
    const [referralLink, setReferralLink] = useState(''); // Реферальная ссылка
    const [referralCount, setReferralCount] = useState(0); // Количество рефералов
    const [referralsList, setReferralsList] = useState([]); // Список рефералов
    const [error, setError] = useState(''); // Ошибки
    const location = useLocation(); // Для получения query-параметров

    // Получение chatId из Telegram Web App
    useEffect(() => {
        if (WebApp.initDataUnsafe.user) {
            const tgChatId = WebApp.initDataUnsafe.user.id; // Получаем chatId из SDK
            setChatId(tgChatId); // Устанавливаем chatId в состояние
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
            const referralRef = ref(database, `referrals/${chatId}`); // Ссылка на данные в Firebase

            // Проверяем, существует ли запись для этого пользователя
            const snapshot = await get(referralRef);
            if (!snapshot.exists()) {
                // Если записи нет, создаем новую
                await set(referralRef, {
                    referralCount: 0, // Начальное количество рефералов
                    referrals: [], // Список уникальных рефералов
                    invitedBy: [], // Список пользователей, которые пригласили текущего пользователя
                });
            }

            // Генерация реферальной ссылки
            const link = `https://t.me/your_bot_username?start=${chatId}`; // Ссылка для Telegram-бота
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
        const refChatId = queryParams.get('start'); // Получаем chatId создателя ссылки из URL

        if (refChatId && refChatId !== chatId) { // Проверяем, что это не сам пользователь
            const referralRef = ref(database, `referrals/${refChatId}`);
            const currentUserRef = ref(database, `referrals/${chatId}`);

            get(referralRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const referrals = data.referrals || []; // Получаем список рефералов

                    // Проверяем, есть ли текущий пользователь в списке рефералов
                    if (!referrals.includes(chatId)) {
                        // Добавляем текущий пользователь в список рефералов
                        const updatedReferrals = [...referrals, chatId];
                        const updatedCount = updatedReferrals.length;

                        // Обновляем данные в Firebase
                        update(referralRef, {
                            referralCount: updatedCount,
                            referrals: updatedReferrals,
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
    }, [location, chatId]);

    // Получение текущего количества рефералов и списка рефералов
    useEffect(() => {
        if (chatId) {
            const referralRef = ref(database, `referrals/${chatId}`);
            get(referralRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    setReferralCount(data.referralCount || 0);
                    setReferralsList(data.referrals || []); // Обновляем список рефералов
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
        <div style={{ 
            backgroundColor: '#404040', 
            minHeight: '100vh', 
            padding: '20px', 
            color: '#ffffff', 
            textAlign: 'center',
            position: 'relative', // Для позиционирования нижней панели
        }}>
            <h1>Referral System</h1>

            {/* Кнопка для генерации реферальной ссылки */}
            <div style={{ marginTop: '20px' }}>
                <button
                    onClick={generateReferralLink}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#4CAF50',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    Generate Referral Link
                </button>
            </div>

            {/* Отображение реферальной ссылки и кнопка для копирования */}
            {referralLink && (
                <div style={{ marginTop: '20px' }}>
                    <p>Your Referral Link:</p>
                    <a
                        href={referralLink}
                        style={{
                            color: '#4CAF50',
                            textDecoration: 'none',
                            wordBreak: 'break-all',
                        }}
                    >
                        {referralLink}
                    </a>
                    <button
                        onClick={copyToClipboard}
                        style={{
                            marginLeft: '10px',
                            padding: '5px 10px',
                            fontSize: '14px',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        Copy Link
                    </button>
                </div>
            )}

            {/* Отображение количества рефералов */}
            <div style={{ marginTop: '20px' }}>
                <p>Total Referrals: {referralCount}</p>
            </div>

            {/* Отображение списка рефералов */}
            {referralsList.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Referrals List:</h3>
                    <ul style={{ listStyleType: 'none', padding: 0 }}>
                        {referralsList.map((refChatId, index) => (
                            <li key={index} style={{ margin: '10px 0' }}>
                                User ID: {refChatId}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Отображение ошибок */}
            {error && (
                <p style={{ color: 'red', marginTop: '20px' }}>{error}</p>
            )}

            {/* Нижняя панель с кнопками навигации */}
            <div style={{
                position: 'fixed',
                bottom: '0',
                left: '0',
                right: '0',
                backgroundColor: '#333',
                padding: '10px',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                gap: '20px', // Расстояние между кнопками
            }}>
                <Link to="/referral" style={{
                    textDecoration: 'none',
                    color: '#000000',
                    fontSize: '16px',
                    padding: '10px 20px',
                    backgroundColor: '#ffff',
                    borderRadius: '5px',
                }}>
                    Перейти к реферальной системе
                </Link>
                <Link to="/" style={{
                    textDecoration: 'none',
                    color: '#000000',
                    fontSize: '16px',
                    padding: '10px 20px',
                    backgroundColor: '#ffff',
                    borderRadius: '5px',
                }}>
                    Home
                </Link>
                <Link to="/click-counter" style={{
                    textDecoration: 'none',
                    color: '#000000',
                    fontSize: '16px',
                    padding: '10px 20px',
                    backgroundColor: '#ffff',
                    borderRadius: '5px',
                }}>
                    Перейти к Click Counter
                </Link>
            </div>
        </div>
    );
};

export default ReferralPage;