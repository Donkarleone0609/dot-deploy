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

  // Функция для получения награды за подписку на Telegram канал
  const claimTelegramReward = async () => {
    if (!userId) {
      alert('ID пользователя Telegram не найден.');
      return;
    }

    const isSubscribed = await checkTelegramSubscription(userId);
    if (isSubscribed) {
      const rewardRef = ref(database, `users/${userId}/telegramRewardClaimed`);
      const snapshot = await get(rewardRef);

      if (snapshot.exists() && snapshot.val() === true) {
        alert('Вы уже получили награду за подписку на Telegram канал.');
        return;
      }

      const coinsRef = ref(database, `users/${userId}/clickCount`);
      const currentCoins = (await get(coinsRef)).val() || 0;
      const newCoins = currentCoins + 2000;

      try {
        await set(coinsRef, newCoins); // Обновляем монеты в Firebase
        await set(rewardRef, true); // Сохраняем флаг выполнения задания
        setCoins(newCoins); // Обновляем состояние в React
        alert('Вы получили 2000 монет за подписку на Telegram канал!');
      } catch (error) {
        console.error('Ошибка при обновлении данных:', error);
        alert('Произошла ошибка при начислении награды.');
      }
    } else {
      alert('Вы еще не подписались на Telegram канал.');
    }
  };

  // Функция для получения награды за привязку кошелька
  const claimWalletReward = async () => {
    if (!wallet) {
      alert('Вы еще не привязали TON кошелек.');
      return;
    }

    if (!userId) {
      alert('ID пользователя Telegram не найден.');
      return;
    }

    // Проверяем, было ли задание уже выполнено
    const rewardRef = ref(database, `users/${userId}/walletRewardClaimed`);
    const snapshot = await get(rewardRef);

    if (snapshot.exists() && snapshot.val() === true) {
      alert('Вы уже получили награду за привязку кошелька.');
      return;
    }

    // Добавляем 5000 монет в Firebase
    const coinsRef = ref(database, `users/${userId}/clickCount`);
    const currentCoins = (await get(coinsRef)).val() || 0;
    const newCoins = currentCoins + 5000;

    try {
      await set(coinsRef, newCoins); // Обновляем монеты в Firebase
      await set(rewardRef, true); // Сохраняем флаг выполнения задания
      setCoins(newCoins); // Обновляем состояние в React
      alert('Вы получили 5000 монет за привязку TON кошелька!');
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
      alert('Произошла ошибка при начислении награды.');
    }
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
          <button onClick={claimTelegramReward}>
            Получить награду
          </button>
        </div>
        <div className="reward-item">
          <h3>Привязка TON кошелька</h3>
          <p>Награда: 5000 монет</p>
          <button onClick={claimWalletReward}>
            Получить награду
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
