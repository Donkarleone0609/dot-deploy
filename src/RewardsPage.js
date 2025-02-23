import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { database, ref, get, set } from './firebase'; // Импортируем Firebase
import NavigationBar from './NavigationBar'; // Импортируем навигационную панель

// Функция для проверки подписки на Telegram канал
const checkTelegramSubscription = async (userId) => {
  const botToken = '7118279667:AAF0EHBOL4lK85mD7KCR8ZeJFX6-xVL2Flc'; // Замените на токен вашего бота
  const channelId = '@whoisdotcoin'; // Замените на username вашего канала, например, @my_channel
  const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelId}&user_id=${userId}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.result.status === 'member' || data.result.status === 'administrator';
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    return false;
  }
};

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
    if (!userId) {
      console.error('ID пользователя Telegram не найден.');
      setLoading(false);
      return;
    }

    const fetchCoins = async () => {
      const coinsRef = ref(database, `users/${userId}/clickCount`);
      try {
        const snapshot = await get(coinsRef);
        if (snapshot.exists()) {
          setCoins(snapshot.val());
        } else {
          console.log('Данные о монетах отсутствуют.');
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, [userId]);

  // Проверяем, подписан ли пользователь на Telegram канал
  useEffect(() => {
    const checkSubscription = async () => {
      if (userId) {
        const isSubscribed = await checkTelegramSubscription(userId);
        setTelegramSubscribed(isSubscribed);
      }
    };

    checkSubscription();
  }, [userId]);

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
  const claimWalletReward = async () => {
    if (!walletConnected) {
      alert('Вы еще не привязали TON кошелек.');
      return;
    }

    // Проверяем, было ли задание уже выполнено
    const rewardRef = ref(database, `users/${userId}/walletRewardClaimed`);
    const snapshot = await get(rewardRef);

    if (snapshot.exists() && snapshot.val() === true) {
      alert('Вы уже получили награду за привязку кошелька.');
      return;
    }

    // Начисляем награду
    setCoins(coins + 5000);
    await set(rewardRef, true); // Сохраняем состояние выполнения задания
    alert('Вы получили 5000 монет за привязку TON кошелька!');
  };

  if (loading) {
    return <div>Загрузка данных...</div>;
  }

  if (!userId) {
    return <div>Ошибка: ID пользователя Telegram не найден.</div>;
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
