import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Импортируем Link для навигации
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database'; // Импортируем функции для Realtime Database
import WebApp from '@twa-dev/sdk'; // Импортируем SDK для Telegram Web Apps
import './Clicker.css'; // Импортируем CSS для анимации

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBISVWWeZEOBffSaLfeg1Q1MwTOKI1PY48",
  authDomain: "dot-coin-d4ca5.firebaseapp.com",
  projectId: "dot-coin-d4ca5",
  storageBucket: "dot-coin-d4ca5.firebasestorage.app",
  messagingSenderId: "828871415977",
  appId: "1:828871415977:web:2449fa031f327163ca31b8",
  measurementId: "G-YD44NWQ2YN"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); // Получаем ссылку на Realtime Database

const Clicker = () => {
    const [clickCount, setClickCount] = useState(0); // Счётчик кликов
    const [isClicked, setIsClicked] = useState(false); // Состояние анимации
    const [userId, setUserId] = useState(null); // ID пользователя Telegram
    const [hasAutoFarm, setHasAutoFarm] = useState(false); // Наличие автофармилки
    const [lastSeen, setLastSeen] = useState(null); // Время последнего выхода
    const [profitPopup, setProfitPopup] = useState(null); // Поп-ап с прибылью
    const [isAppVisible, setIsAppVisible] = useState(true); // Видимость мини-приложения

    // Получаем ID пользователя из Telegram Mini App
    useEffect(() => {
        if (WebApp.initDataUnsafe.user) {
            const user = WebApp.initDataUnsafe.user;
            setUserId(user.id.toString()); // Сохраняем ID пользователя
            loadUserData(user.id.toString()); // Загружаем данные пользователя
        }
    }, []);

    // Отслеживаем видимость мини-приложения
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsAppVisible(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Загрузка данных пользователя из Realtime Database
    const loadUserData = async (userId) => {
        const userRef = ref(database, `users/${userId}`); // Ссылка на данные пользователя
        const snapshot = await get(userRef); // Получаем данные
        if (snapshot.exists()) {
            const data = snapshot.val();
            setClickCount(data.clickCount || 0); // Устанавливаем сохранённое количество кликов
            setHasAutoFarm(data.hasAutoFarm || false); // Устанавливаем наличие автофармилки
            setLastSeen(data.lastSeen || Date.now()); // Устанавливаем время последнего выхода

            // Рассчитываем прибыль за время отсутствия
            if (data.hasAutoFarm && data.lastSeen) {
                const currentTime = Date.now();
                const timeDiff = currentTime - data.lastSeen; // Разница во времени
                const coinsEarned = Math.floor(timeDiff / 5000); // 1 монета каждые 5 секунд
                if (coinsEarned > 0) {
                    const newClickCount = (data.clickCount || 0) + coinsEarned;
                    setClickCount(newClickCount); // Добавляем монеты
                    setProfitPopup(coinsEarned); // Показываем поп-ап с прибылью
                    setTimeout(() => setProfitPopup(null), 5000); // Закрываем поп-ап через 5 секунд

                    // Сохраняем обновлённое количество монет в базу данных
                    await saveUserData(userId, { clickCount: newClickCount, hasAutoFarm: data.hasAutoFarm });
                }
            }
        }
    };

    // Сохранение данных пользователя в Realtime Database
    const saveUserData = async (userId, data) => {
        const userRef = ref(database, `users/${userId}`); // Ссылка на данные пользователя
        await set(userRef, { ...data, lastSeen: Date.now() }); // Сохраняем данные и время последнего выхода
    };

    // Обработчик клика
    const handleClick = async () => {
        setIsClicked(true); // Запускаем анимацию
        const newClickCount = clickCount + 1;
        setClickCount(newClickCount); // Увеличиваем счётчик

        // Сохраняем данные в Realtime Database
        if (userId) {
            await saveUserData(userId, { clickCount: newClickCount, hasAutoFarm });
        }

        // Сбрасываем анимацию через 200 мс
        setTimeout(() => {
            setIsClicked(false);
        }, 200);
    };

    // Покупка автофармилки
    const buyAutoFarm = async () => {
        if (clickCount >= 1000 && !hasAutoFarm) {
            const newClickCount = clickCount - 1000;
            setClickCount(newClickCount);
            setHasAutoFarm(true);

            // Сохраняем данные в Realtime Database
            if (userId) {
                await saveUserData(userId, { clickCount: newClickCount, hasAutoFarm: true });
            }
        }
    };

    // Автофармилка: добавляем 1 монету каждые 5 секунд
    useEffect(() => {
        if (hasAutoFarm && isAppVisible) {
            const interval = setInterval(async () => {
                const newClickCount = clickCount + 1;
                setClickCount(newClickCount); // Увеличиваем счётчик

                // Сохраняем данные в Realtime Database
                if (userId) {
                    await saveUserData(userId, { clickCount: newClickCount, hasAutoFarm });
                }
            }, 5000); // 5 секунд

            return () => clearInterval(interval); // Очистка интервала при размонтировании
        }
    }, [hasAutoFarm, isAppVisible, clickCount, userId]);

    // Сохранение времени последнего выхода при закрытии приложения
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (userId) {
                saveUserData(userId, { clickCount, hasAutoFarm });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [userId, clickCount, hasAutoFarm]);

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh', 
            backgroundColor: '#404040', 
            fontFamily: 'Arial, sans-serif',
            position: 'relative', // Для позиционирования нижней панели
        }}>
            <h1 style={{ color: '#ffffff', marginBottom: '20px' }}>$DOT Clicker</h1>
            <p style={{ color: '#ffffff', fontSize: '18px', marginBottom: '40px' }}>
                Coins: {clickCount}
            </p>

            {/* Картинка-кнопка */}
            <img
                src="https://i.ibb.co/v657CwyV/photo-2025-02-19-16-53-28.jpg" // Замените на свою картинку
                alt="Click me"
                style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    transform: isClicked ? 'scale(0.9)' : 'scale(1)', // Анимация нажатия
                    boxShadow: isClicked 
                        ? '0 4px 8px rgba(0, 0, 0, 0.2)' 
                        : '0 8px 16px rgba(0, 0, 0, 0.3)',
                }}
                onClick={handleClick}
            />

            {/* Кнопка покупки автофармилки */}
            {!hasAutoFarm && (
                <button
                    onClick={buyAutoFarm}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                    }}
                    disabled={clickCount < 1000}
                >
                    Купить автофармилку (1000 монет)
                </button>
            )}

            {/* Поп-ап с прибылью */}
            {profitPopup !== null && (
                <div className="profit-popup">
                    Вы получили {profitPopup} монет за время отсутствия!
                </div>
            )}

            {/* Нижняя панель с кнопкой навигации */}
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

export default Clicker;
