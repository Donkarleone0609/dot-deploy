import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { database, ref, set, get } from './firebase';
import WebApp from '@twa-dev/sdk';
import './Clicker.css';

const Clicker = () => {
    const [clickCount, setClickCount] = useState(0);
    const [isClicked, setIsClicked] = useState(false);
    const [userId, setUserId] = useState(null);
    const [hasAutoFarm, setHasAutoFarm] = useState(false);
    const [lastSeen, setLastSeen] = useState(null);
    const [profitPopup, setProfitPopup] = useState(null);
    const [isAppVisible, setIsAppVisible] = useState(true);

    // Состояния для улучшений
    const [dotCPU, setDotCPU] = useState({ count: 0, price: 1500 });
    const [dotGPU, setDotGPU] = useState({ count: 0, price: 1500 });
    const [simpleBotTrader, setSimpleBotTrader] = useState({ count: 0, price: 2000 });
    const [memecoin, setMemecoin] = useState({ count: 0, price: 3000 });
    const [traderAI, setTraderAI] = useState({ count: 0, price: 5000 });

    // Получаем ID пользователя из Telegram Mini App
    useEffect(() => {
        if (WebApp.initDataUnsafe.user) {
            const user = WebApp.initDataUnsafe.user;
            setUserId(user.id.toString());
            loadUserData(user.id.toString());
        }
    }, []);

    // Отслеживаем видимость мини-приложения
    useEffect(() => {
        const handleVisibilityChange = () => setIsAppVisible(!document.hidden);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, []);

    // Загрузка данных пользователя
    const loadUserData = useCallback(async (userId) => {
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            const data = snapshot.val();
            setClickCount(data.clickCount || 0);
            setHasAutoFarm(data.hasAutoFarm || false);
            setLastSeen(data.lastSeen || Date.now());

            // Загружаем улучшения
            setDotCPU(data.dotCPU || { count: 0, price: 1500 });
            setDotGPU(data.dotGPU || { count: 0, price: 1500 });
            setSimpleBotTrader(data.simpleBotTrader || { count: 0, price: 2000 });
            setMemecoin(data.memecoin || { count: 0, price: 3000 });
            setTraderAI(data.traderAI || { count: 0, price: 5000 });

            // Рассчитываем прибыль за время отсутствия
            if (data.hasAutoFarm && data.lastSeen) {
                const currentTime = Date.now();
                const timeDiff = currentTime - data.lastSeen;
                const coinsEarned = calculateAutoFarmProfit(timeDiff, data);
                if (coinsEarned > 0) {
                    const newClickCount = (data.clickCount || 0) + coinsEarned;
                    setClickCount(newClickCount);
                    setProfitPopup(`Вы получили ${coinsEarned} монет за время отсутствия!`);
                    setTimeout(() => setProfitPopup(null), 5000);

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
    }, []);

    // Сохранение данных пользователя
    const saveUserData = useCallback(async (userId, data) => {
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await get(userRef);
        const existingData = snapshot.exists() ? snapshot.val() : {};

        const updatedData = {
            ...existingData,
            clickCount: data.clickCount,
            hasAutoFarm: data.hasAutoFarm,
            dotCPU: data.dotCPU,
            dotGPU: data.dotGPU,
            simpleBotTrader: data.simpleBotTrader,
            memecoin: data.memecoin,
            traderAI: data.traderAI,
            lastSeen: Date.now()
        };

        await set(userRef, updatedData);
    }, []);

    // Обработчик клика
    const handleClick = useCallback(async () => {
        setIsClicked(true);
        const newClickCount = clickCount + 1 + (dotCPU.count * 2) + (dotGPU.count * 2);
        setClickCount(newClickCount);

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

        setTimeout(() => setIsClicked(false), 200);
    }, [clickCount, dotCPU, dotGPU, hasAutoFarm, userId, saveUserData]);

    // Покупка улучшения
    const buyUpgrade = useCallback(async (upgrade, setUpgrade, basePrice, baseEffect, label) => {
        if (clickCount >= upgrade.price && upgrade.count < 20) {
            const newClickCount = clickCount - upgrade.price;
            const newCount = upgrade.count + 1;
            const newPrice = upgrade.price * 1.5;

            setClickCount(newClickCount);
            setUpgrade({ count: newCount, price: newPrice });

            // Если это Default Miner, обновляем hasAutoFarm
            if (label === "Default Miner") {
                setHasAutoFarm(true);
            }

            if (userId) {
                await saveUserData(userId, {
                    clickCount: newClickCount,
                    hasAutoFarm: label === "Default Miner" ? true : hasAutoFarm,
                    dotCPU,
                    dotGPU,
                    simpleBotTrader,
                    memecoin,
                    traderAI
                });
            }
        }
    }, [clickCount, userId, saveUserData, hasAutoFarm, dotCPU, dotGPU, simpleBotTrader, memecoin, traderAI]);

    // Рассчитываем прибыль автофарминга
    const calculateAutoFarmProfit = useCallback((timeDiff, data) => {
        let profit = 0;

        if (data.hasAutoFarm) profit += Math.floor(timeDiff / 5000);
        if (data.simpleBotTrader?.count) profit += data.simpleBotTrader.count * 3 * Math.floor(timeDiff / 5000);
        if (data.traderAI?.count) profit += data.traderAI.count * 14 * Math.floor(timeDiff / 5000);
        if (data.memecoin?.count) profit *= 1 + (0.02 * data.memecoin.count);

        return Math.floor(profit);
    }, []);

    // Автофармилка
    useEffect(() => {
        if (hasAutoFarm && isAppVisible) {
            const interval = setInterval(async () => {
                const newClickCount = clickCount + 1 + (simpleBotTrader.count * 3) + (traderAI.count * 14);
                setClickCount(newClickCount);

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
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [hasAutoFarm, isAppVisible, clickCount, userId, saveUserData, simpleBotTrader, traderAI]);

    // Сохранение данных при закрытии
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
    }, [userId, clickCount, hasAutoFarm, dotCPU, dotGPU, simpleBotTrader, memecoin, traderAI, saveUserData]);

    return (
        <div className="clicker-container">
            <h1>$DOT Clicker</h1>
            <p>Coins: {clickCount}</p>

            {/* Картинка-кнопка */}
            <div className="coin-container">
                <img
                    src="https://i.ibb.co/v657CwyV/photo-2025-02-19-16-53-28.jpg"
                    alt="Click me"
                    className={`clicker-button ${isClicked ? 'clicked' : ''}`}
                    onClick={handleClick}
                />
            </div>

            {/* Кнопка покупки автофармилки */}
            {!hasAutoFarm && (
                <button
                    onClick={() => buyUpgrade({ count: 0, price: 1000 }, setHasAutoFarm, 1000, 1, "Default Miner")}
                    className="upgrade-button"
                    disabled={clickCount < 1000}
                >
                    <span>Default Miner</span>
                    <span>1000 монет</span>
                </button>
            )}

            {/* Кнопки для улучшений */}
            <div className="upgrades-grid">
                <UpgradeButton
                    upgrade={dotCPU}
                    setUpgrade={setDotCPU}
                    basePrice={1500}
                    baseEffect={2}
                    label="DOT CPU"
                    description="+2 к клику"
                    onClick={buyUpgrade}
                    clickCount={clickCount}
                />
                <UpgradeButton
                    upgrade={dotGPU}
                    setUpgrade={setDotGPU}
                    basePrice={1500}
                    baseEffect={2}
                    label="DOT GPU"
                    description="+2 к клику"
                    onClick={buyUpgrade}
                    clickCount={clickCount}
                />
                <UpgradeButton
                    upgrade={simpleBotTrader}
                    setUpgrade={setSimpleBotTrader}
                    basePrice={2000}
                    baseEffect={3}
                    label="Bot Trader"
                    description="+3 монеты/5 сек"
                    onClick={buyUpgrade}
                    clickCount={clickCount}
                />
                <UpgradeButton
                    upgrade={memecoin}
                    setUpgrade={setMemecoin}
                    basePrice={3000}
                    baseEffect={0.02}
                    label="Memecoin"
                    description="+2% к профиту"
                    onClick={buyUpgrade}
                    clickCount={clickCount}
                />
                <UpgradeButton
                    upgrade={traderAI}
                    setUpgrade={setTraderAI}
                    basePrice={5000}
                    baseEffect={14}
                    label="Trader AI"
                    description="+14 монет/5 сек"
                    onClick={buyUpgrade}
                    clickCount={clickCount}
                />
            </div>

            {/* Поп-ап с прибылью */}
            {profitPopup !== null && (
                <div className="profit-popup clicker-popup">
                    {profitPopup}
                </div>
            )}

            {/* Нижняя панель с кнопками навигации */}
            <div className="navigation-bar">
                <Link to="/referral" className="nav-button">Referral</Link>
                <Link to="/" className="nav-button">Home</Link>
                <Link to="/click-counter" className="nav-button">Clicker</Link>
                <Link to="/rewards" className="nav-button">Rewards</Link>
            </div>
        </div>
    );
};

// Компонент для кнопок улучшений
const UpgradeButton = React.memo(({ upgrade, setUpgrade, basePrice, baseEffect, label, description, onClick, clickCount }) => (
    <button
        onClick={() => onClick(upgrade, setUpgrade, basePrice, baseEffect, label)}
        className={`upgrade-button ${upgrade.count >= 20 ? 'disabled' : ''}`}
        disabled={clickCount < upgrade.price || upgrade.count >= 20}
    >
        <span>{label}</span>
        <span>{description}</span>
        <span>{upgrade.price} монет</span>
        <span>Куплено: {upgrade.count}/20</span>
    </button>
));

export default Clicker;
