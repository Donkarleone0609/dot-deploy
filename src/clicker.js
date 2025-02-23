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
  storageBucket: "dot-coin-d4ca5.appspot.com",
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

    // Новые состояния для улучшений
    const [dotCPU, setDotCPU] = useState({ count: 0, price: 1000 }); // DOT CPU
    const [dotGPU, setDotGPU] = useState({ count: 0, price: 1000 }); // DOT GPU
    const [simpleBotTrader, setSimpleBotTrader] = useState({ count: 0, price: 1500 }); // SIMPLE BOT TRADER
    const [memecoin, setMemecoin] = useState({ count: 0, price: 2500 }); // MEMECOIN
    const [traderAI, setTraderAI] = useState({ count: 0, price: 3500 }); // TRADER AI

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

            // Загружаем данные улучшений
            setDotCPU(data.dotCPU || { count: 0, price: 1000 });
            setDotGPU(data.dotGPU || { count: 0, price: 1000 });
            setSimpleBotTrader(data.simpleBotTrader || { count: 0, price: 1500 });
            setMemecoin(data.memecoin || { count: 0, price: 2500 });
            setTraderAI(data.traderAI || { count: 0, price: 3500 });

            // Рассчитываем прибыль за время отсутствия
            if (data.hasAutoFarm && data.lastSeen) {
                const currentTime = Date.now();
                const timeDiff = currentTime - data.lastSeen; // Разница во времени
                const coinsEarned = calculateAutoFarmProfit(timeDiff, data); // Рассчитываем прибыль
                if (coinsEarned > 0) {
                    const newClickCount = (data.clickCount || 0) + coinsEarned;
                    setClickCount(newClickCount); // Добавляем монеты
                    setProfitPopup(coinsEarned); // Показываем поп-ап с прибылью
                    setTimeout(() => setProfitPopup(null), 5000); // Закрываем поп-ап через 5 секунд

                    // Сохраняем обновлённое количество монет в базу данных
                    await saveUserData(userId, { 
                        clickCount: newClickCount, 
                        hasAutoFarm: data.hasAutoFarm,
                        dotCPU: data.dotCPU,
                        dotGPU: data.dotGPU,
                        simpleBotTrader: data.simpleBotTrader,
                        memecoin: data.memecoin,
                        traderAI: data.traderAI
                    });
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
        const newClickCount = clickCount + 1 + (dotCPU.count * 2) + (dotGPU.count * 2); // Учитываем улучшения
        setClickCount(newClickCount); // Увеличиваем счётчик

        // Сохраняем данные в Realtime Database
        if (userId) {
            await saveUserData(userId, { 
                clickCount: newClickCount, 
                hasAutoFarm,
                dotCPU,
                dotGPU,
                simpleBotTrader,
                memecoin,
                traderAI
            });
        }

        // Сбрасываем анимацию через 200 мс
        setTimeout(() => {
            setIsClicked(false);
        }, 200);
    };

    // Покупка улучшения
    const buyUpgrade = async (upgrade, setUpgrade, basePrice, baseEffect) => {
        if (clickCount >= upgrade.price && upgrade.count < 3) {
            const newClickCount = clickCount - upgrade.price;
            const newCount = upgrade.count + 1;
            const newPrice = upgrade.price * 2; // Увеличиваем цену в 2 раза
            const newEffect = baseEffect * Math.pow(2, newCount); // Увеличиваем эффект в 2 раза

            setClickCount(newClickCount);
            setUpgrade({ count: newCount, price: newPrice });

            // Сохраняем данные в Realtime Database
            if (userId) {
                await saveUserData(userId, { 
                    clickCount: newClickCount, 
                    hasAutoFarm,
                    dotCPU,
                    dotGPU,
                    simpleBotTrader,
                    memecoin,
                    traderAI
                });
            }
        }
    };

    // Рассчитываем прибыль автофарминга
    const calculateAutoFarmProfit = (timeDiff, data) => {
        let profit = 0;

        // Прибыль от автофарминга
        if (data.hasAutoFarm) {
            profit += Math.floor(timeDiff / 5000); // 1 монета каждые 5 секунд
        }

        // Прибыль от улучшений
        if (data.simpleBotTrader?.count) {
            profit += data.simpleBotTrader.count * 3 * Math.floor(timeDiff / 5000);
        }
        if (data.traderAI?.count) {
            profit += data.traderAI.count * 14 * Math.floor(timeDiff / 5000);
        }

        // Учитываем MEMECOIN (увеличиваем общий профит на 2% за каждый уровень)
        if (data.memecoin?.count) {
            profit *= 1 + (0.02 * data.memecoin.count);
        }

        return Math.floor(profit);
    };

    // Автофармилка: добавляем монеты каждые 5 секунд
    useEffect(() => {
        if (hasAutoFarm && isAppVisible) {
            const interval = setInterval(async () => {
                const newClickCount = clickCount + 1 + 
                    (simpleBotTrader.count * 3) + 
                    (traderAI.count * 14); // Учитываем улучшения
                setClickCount(newClickCount); // Увеличиваем счётчик

                // Сохраняем данные в Realtime Database
                if (userId) {
                    await saveUserData(userId, { 
                        clickCount: newClickCount, 
                        hasAutoFarm,
                        dotCPU,
                        dotGPU,
                        simpleBotTrader,
                        memecoin,
                        traderAI
                    });
                }
            }, 5000); // 5 секунд

            return () => clearInterval(interval); // Очистка интервала при размонтировании
        }
    }, [hasAutoFarm, isAppVisible, clickCount, userId, simpleBotTrader, traderAI]);

    // Сохранение времени последнего выхода при закрытии приложения
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (userId) {
                saveUserData(userId, { 
                    clickCount, 
                    hasAutoFarm,
                    dotCPU,
                    dotGPU,
                    simpleBotTrader,
                    memecoin,
                    traderAI
                });
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [userId, clickCount, hasAutoFarm, dotCPU, dotGPU, simpleBotTrader, memecoin, traderAI]);

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
                    onClick={() => buyUpgrade({ count: 0, price: 500 }, setHasAutoFarm, 500, 1)}
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
                    disabled={clickCount < 500}
                >
                    Default miner (500 монет)
                </button>
            )}

            {/* Кнопки для улучшений */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                    onClick={() => buyUpgrade(dotCPU, setDotCPU, 1000, 2)}
                    disabled={clickCount < dotCPU.price || dotCPU.count >= 3}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: dotCPU.count >= 3 ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                    }}
                >
                    DOT CPU ({dotCPU.price} монет) +2 к клику (куплено: {dotCPU.count}/3)
                </button>
                <button
                    onClick={() => buyUpgrade(dotGPU, setDotGPU, 1000, 2)}
                    disabled={clickCount < dotGPU.price || dotGPU.count >= 3}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: dotGPU.count >= 3 ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                    }}
                >
                    DOT GPU ({dotGPU.price} монет) +2 к клику (куплено: {dotGPU.count}/3)
                </button>
                <button
                    onClick={() => buyUpgrade(simpleBotTrader, setSimpleBotTrader, 1500, 3)}
                    disabled={clickCount < simpleBotTrader.price || simpleBotTrader.count >= 3}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: simpleBotTrader.count >= 3 ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                    }}
                >
                    SIMPLE BOT TRADER ({simpleBotTrader.price} монет) +3 монеты каждые 5 секунд (куплено: {simpleBotTrader.count}/3)
                </button>
                <button
                    onClick={() => buyUpgrade(memecoin, setMemecoin, 2500, 0.02)}
                    disabled={clickCount < memecoin.price || memecoin.count >= 3}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: memecoin.count >= 3 ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                    }}
                >
                    MEMECOIN ({memecoin.price} монет) +2% к общему профиту (куплено: {memecoin.count}/3)
                </button>
                <button
                    onClick={() => buyUpgrade(traderAI, setTraderAI, 3500, 14)}
                    disabled={clickCount < traderAI.price || traderAI.count >= 3}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        backgroundColor: traderAI.count >= 3 ? '#ccc' : '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                    }}
                >
                    TRADER AI ({traderAI.price} монет) +14 монет каждые 5 секунд (куплено: {traderAI.count}/3)
                </button>
            </div>

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
