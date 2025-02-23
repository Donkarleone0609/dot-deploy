import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { database, ref, get } from './firebase'; // Импортируем Firebase
import NavigationBar from './NavigationBar'; // Импортируем навигационную панель

function RewardsPage() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [telegramSubscribed, setTelegramSubscribed] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  // Получаем ID пользователя Telegram
  const userId = WebApp.initDataUnsafe.user?.id;

  // Загружаем количество монет из Firebase
  useEffect(() => {
    if (userId) {
      const fetchCoins = async () => {
        const coinsRef = ref(database, `users/${userId}/clickCount`);
        try {
          const snapshot = await get(coinsRef);
          if (snapshot.exists()) {
            setCoins(snapshot.val());
          } else {
            console.log('No coins data available');
          }
        } catch (error) {
          console.error('Error fetching coins:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchCoins();
    }
  }, [userId]);

  // Проверяем, подписан ли пользователь на Telegram канал
  useEffect(() => {
    // Здесь можно добавить логику для проверки подписки на канал
    // Например, через Telegram Bot API
    setTelegramSubscribed(false); // По умолчанию false, пока не реализована проверка
  }, []);

  // Проверяем, подключен ли кошелек
  useEffect(() => {
    if (wallet) {
      setWalletConnected(true);
    } else {
      setWalletConnected(false);
    }
  }, [wallet]);

  // Функция для получения награды за подписку на Telegram канал
  const claimTelegramReward = () => {
    if (telegramSubscribed) {
      setCoins(coins + 2000);
      alert('Вы получили 2000 монет за подписку на Telegram канал!');
    } else {
      alert('Вы еще не подписались на Telegram канал.');
    }
  };

  // Функция для получения награды за привязку кошелька
  const claimWalletReward = () => {
    if (walletConnected) {
      setCoins(coins + 5000);
      alert('Вы получили 5000 монет за привязку TON кошелька!');
    } else {
      alert('Вы еще не привязали TON кошелек.');
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className="rewards-page">
      <h1>Получение наград</h1>
      <div className="rewards-list">
        <div className="reward-item">
          <h3>Подписка на Telegram канал</h3>
          <p>Награда: 2000 монет</p>
          <button onClick={claimTelegramReward} disabled={telegramSubscribed}>
            {telegramSubscribed ? 'Награда получена' : 'Получить награду'}
          </button>
        </div>
        <div className="reward-item">
          <h3>Привязка TON кошелька</h3>
          <p>Награда: 5000 монет</p>
          <button onClick={claimWalletReward} disabled={walletConnected}>
            {walletConnected ? 'Награда получена' : 'Получить награду'}
          </button>
        </div>
      </div>
      <div className="total-coins">
        <h3>Ваши монеты: {coins}</h3>
      </div>

      {/* Добавляем навигационную панель */}
      <NavigationBar />
    </div>
  );
}

export default RewardsPage;
