import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
    const [energy, setEnergy] = useState(100); // Состояние энергии
    const [timeToEnergy, setTimeToEnergy] = useState(30); // Таймер до восстановления энергии
    const location = useLocation();

    // Состояния для улучшений
    const [dotCPU, setDotCPU] = useState({ count: 0, price: 1000 });
    const [dotGPU, setDotGPU] = useState({ count: 0, price: 1000 });
    const [simpleBotTrader, setSimpleBotTrader] = useState({ count: 0, price: 1500 });
    const [memecoin, setMemecoin] = useState({ count: 0, price: 2500 });
    const [traderAI, setTraderAI] = useState({ count: 0, price: 3500 });

    // Получаем ID пользователя из Telegram Mini App
    useEffect(() => {
        if (WebApp.initDataUnsafe.user) {
            const user = WebApp.initDataUnsafe.user;
            setUserId(user.id.toString());
            loadUserData(user.id.toString());
        }
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
            setEnergy(data.energy || 100); // Загружаем энергию

            // Загружаем улучшения
            setDotCPU(data.dotCPU || { count: 0, price: 1000 });
            setDotGPU(data.dotGPU || { count: 0, price: 1000 });
            setSimpleBotTrader(data.simpleBotTrader || { count: 0, price: 1500 });
            setMemecoin(data.memecoin || { count: 0, price: 2500 });
            setTraderAI(data.traderAI || { count: 0, price: 3500 });

            // Восстанавливаем энергию за время отсутствия
            if (data.lastSeen) {
                const currentTime = Date.now();
                const timeDiff = currentTime - data.lastSeen;
                const energyGained = Math.floor(timeDiff / 30000); // 1 энергия каждые 30 секунд
                const newEnergy = Math.min(data.energy + energyGained, 100); // Не больше 100
                setEnergy(newEnergy);

                await saveUserData(userId, {
                    ...data,
                    energy: newEnergy,
                    lastSeen: currentTime
                });
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
            lastSeen: data.lastSeen || Date.now(),
            energy: data.energy || 100 // Сохраняем энергию
        };

        await set(userRef, updatedData);
    }, []);

    // Обработчик клика
    const handleClick = useCallback(async () => {
        if (energy >= 1) { // Проверяем, достаточно ли энергии (1 клик = 1 энергия)
            setIsClicked(true);
            const newClickCount = clickCount + 1 + (dotCPU.count * 2) + (dotGPU.count * 2);
            const newEnergy = energy - 1; // Тратим 1 энергию

            setClickCount(newClickCount);
            setEnergy(newEnergy);

            if (userId) {
                await saveUserData(userId, {
                    clickCount: newClickCount,
                    hasAutoFarm,
                    dotCPU,
                    dotGPU,
                    simpleBotTrader,
                    memecoin,
                    traderAI,
                    energy: newEnergy
                });
            }

            setTimeout(() => setIsClicked(false), 200);
        }
    }, [clickCount, dotCPU, dotGPU, hasAutoFarm, userId, saveUserData, energy]);

    // Восстановление энергии
    useEffect(() => {
        const interval = setInterval(async () => {
            if (energy < 100) {
                const newEnergy = energy + 1;
                setEnergy(newEnergy);
                setTimeToEnergy(30); // Сбрасываем таймер

                if (userId) {
                    await saveUserData(userId, {
                        clickCount,
                        hasAutoFarm,
                        dotCPU,
                        dotGPU,
                        simpleBotTrader,
                        memecoin,
                        traderAI,
                        energy: newEnergy
                    });
                }
            }
        }, 30000); // Восстанавливаем энергию каждые 30 секунд

        return () => clearInterval(interval);
    }, [energy, userId, clickCount, hasAutoFarm, dotCPU, dotGPU, simpleBotTrader, memecoin, traderAI, saveUserData]);

    // Таймер до восстановления энергии
    useEffect(() => {
        const timer = setInterval(() => {
            if (energy < 100) {
                setTimeToEnergy((prev) => (prev > 0 ? prev - 1 : 30));
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [energy]);

    // Рассчитываем прибыль автофарминга
    const calculateAutoFarmProfit = useCallback((timeDiff) => {
        let profit = 0;

        // Базовая прибыль от автофарма
        if (hasAutoFarm) profit += Math.floor(timeDiff / 5000); // 1 монета каждые 5 секунд

        // Прибыль от улучшений
        if (simpleBotTrader.count) profit += simpleBotTrader.count * 3 * Math.floor(timeDiff / 5000); // 3 монеты каждые 5 секунд за каждый Bot Trader
        if (traderAI.count) profit += traderAI.count * 10 * Math.floor(timeDiff / 5000); // 10 монет каждые 5 секунд за каждый Trader AI
        if (memecoin.count) profit *= 1 + (0.02 * memecoin.count); // +2% к профиту за каждый Memecoin

        return Math.floor(profit);
    }, [hasAutoFarm, simpleBotTrader, traderAI, memecoin]);

    // Расчет прибыли за время отсутствия
    const calculateOfflineProfit = useCallback(async () => {
        if (userId && lastSeen) {
            const currentTime = Date.now();
            const timeDiff = currentTime - lastSeen;
            const coinsEarned = calculateAutoFarmProfit(timeDiff);

            if (coinsEarned > 0) {
                const newClickCount = clickCount + coinsEarned;
                setClickCount(newClickCount);
                setProfitPopup(`Вы получили ${coinsEarned} монет за время отсутствия!`);
                setTimeout(() => setProfitPopup(null), 5000);

                await saveUserData(userId, {
                    clickCount: newClickCount,
                    hasAutoFarm,
                    dotCPU,
                    dotGPU,
                    simpleBotTrader,
                    memecoin,
                    traderAI,
                    energy
                });
            }
        }
    }, [userId, lastSeen, clickCount, hasAutoFarm, dotCPU, dotGPU, simpleBotTrader, memecoin, traderAI, calculateAutoFarmProfit, saveUserData, energy]);

    // Эффект для расчета прибыли при возвращении на страницу
    useEffect(() => {
        if (location.pathname === '/click-counter' && lastSeen) {
            calculateOfflineProfit();
        }
    }, [location.pathname, lastSeen, calculateOfflineProfit]);

    // Сохранение данных при уходе со страницы
    useEffect(() => {
        return () => {
            if (userId) {
                saveUserData(userId, {
                    clickCount,
                    hasAutoFarm,
                    dotCPU,
                    dotGPU,
                    simpleBotTrader,
                    memecoin,
                    traderAI,
                    lastSeen: Date.now(),
                    energy
                });
            }
        };
    }, [userId, clickCount, hasAutoFarm, dotCPU, dotGPU, simpleBotTrader, memecoin, traderAI, saveUserData, energy]);

    // Покупка улучшения
    const buyUpgrade = useCallback(async (upgrade, setUpgrade, basePrice, baseEffect, label) => {
        if (clickCount >= upgrade.price && upgrade.count < 20) {
            const newClickCount = clickCount - upgrade.price;
            const newCount = upgrade.count + 1;
            const newPrice = upgrade.price * 2; // Цена увеличивается в 2 раза

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
                    traderAI,
                    energy
                });
            }
        }
    }, [clickCount, userId, saveUserData, hasAutoFarm, dotCPU, dotGPU, simpleBotTrader, memecoin, traderAI, energy]);

    // Автофармилка
    useEffect(() => {
        if (hasAutoFarm) {
            const interval = setInterval(async () => {
                const newClickCount = clickCount + 1 + (simpleBotTrader.count * 3) + (traderAI.count * 10);
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
            }, 5000); // Начисление каждые 5 секунд

            return () => clearInterval(interval);
        }
    }, [hasAutoFarm, clickCount, userId, saveUserData, simpleBotTrader, traderAI]);

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
                {/* Полоса энергии под кнопкой */}
                <div className="energy-bar-container">
                    <div
                        className="energy-bar"
                        style={{ width: `${energy}%` }} // Динамическая ширина
                    ></div>
                </div>
                {/* Таймер восстановления энергии */}
                <div className="energy-timer">
                    {energy < 100 ? `+1 через ${timeToEnergy} сек` : ''}
                </div>
            </div>

            {/* Кнопка покупки автофармилки */}
            {!hasAutoFarm && (
                <button
                    onClick={() => buyUpgrade({ count: 0, price: 500 }, setHasAutoFarm, 500, 1, "Default Miner")}
                    className="upgrade-button"
                    disabled={clickCount < 500}
                >
                    <span>Default Miner</span>
                    <span>500 монет</span>
                </button>
            )}

            {/* Кнопки для улучшений */}
            <div className="upgrades-grid">
                <UpgradeButton
                    upgrade={dotCPU}
                    setUpgrade={setDotCPU}
                    basePrice={1000}
                    baseEffect={2}
                    label="DOT CPU"
                    description="+2 к клику"
                    onClick={buyUpgrade}
                    clickCount={clickCount}
                />
                <UpgradeButton
                    upgrade={dotGPU}
                    setUpgrade={setDotGPU}
                    basePrice={1000}
                    baseEffect={2}
                    label="DOT GPU"
                    description="+2 к клику"
                    onClick={buyUpgrade}
                    clickCount={clickCount}
                />
                <UpgradeButton
                    upgrade={simpleBotTrader}
                    setUpgrade={setSimpleBotTrader}
                    basePrice={1500}
                    baseEffect={3}
                    label="Bot Trader"
                    description="+3 монеты/5 сек"
                    onClick={buyUpgrade}
                    clickCount={clickCount}
                />
                <UpgradeButton
                    upgrade={memecoin}
                    setUpgrade={setMemecoin}
                    basePrice={2500}
                    baseEffect={0.02}
                    label="Memecoin"
                    description="+2% к профиту"
                    onClick={buyUpgrade}
                    clickCount={clickCount}
                />
                <UpgradeButton
                    upgrade={traderAI}
                    setUpgrade={setTraderAI}
                    basePrice={3500}
                    baseEffect={10}
                    label="Trader AI"
                    description="+10 монет/5 сек"
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
