import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { database, ref, get, set } from './firebase';
import NavigationBar from './NavigationBar';
import confetti from 'canvas-confetti';
import './Clicker.css';

// Проверка подписки на Telegram канал
const checkTelegramSubscription = async (userId) => {
  const botToken = '7118279667:AAF0EHBOL4lK85mD7KCR8ZeJFX6-xVL2Flc';
  const channelId = '@whoisdotcoin';
  const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelId}&user_id=${userId}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return ['member', 'administrator', 'creator'].includes(data.result?.status);
  } catch (error) {
    console.error('Ошибка при проверке подписки:', error);
    return false;
  }
};

function RewardsPage() {
  const wallet = useTonWallet();
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState(null);
  const [telegramRewardClaimed, setTelegramRewardClaimed] = useState(false);
  const [walletRewardClaimed, setWalletRewardClaimed] = useState(false);
  const [isLoadingTelegram, setIsLoadingTelegram] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);

  const userId = WebApp.initDataUnsafe.user?.id;

  // Загрузка данных пользователя
  useEffect(() => {
    if (!userId) {
      console.error('ID пользователя Telegram не найден.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      const userRef = ref(database, `users/${userId}`);
      try {
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          setCoins(data.clickCount || 0);
          setTelegramRewardClaimed(data.telegramRewardClaimed || false);
          setWalletRewardClaimed(data.walletRewardClaimed || false);
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Отображение поп-апа
  const showPopup = (message, isSuccess = false) => {
    setPopupMessage(message);
    if (isSuccess) confetti();
  };

  // Получение награды за подписку на Telegram канал
  const claimTelegramReward = async () => {
    if (!userId) {
      showPopup('ID пользователя Telegram не найден.');
      return;
    }

    setIsLoadingTelegram(true);
    try {
      const isSubscribed = await checkTelegramSubscription(userId);
      if (!isSubscribed) {
        showPopup('Вы еще не подписались на Telegram канал.');
        return;
      }

      const rewardRef = ref(database, `users/${userId}/telegramRewardClaimed`);
      const snapshot = await get(rewardRef);

      if (snapshot.exists() && snapshot.val()) {
        showPopup('Вы уже получили награду за подписку на Telegram канал.');
        return;
      }

      const coinsRef = ref(database, `users/${userId}/clickCount`);
      const currentCoins = (await get(coinsRef)).val() || 0;
      const newCoins = currentCoins + 2000;

      await set(coinsRef, newCoins);
      await set(rewardRef, true);
      setCoins(newCoins);
      setTelegramRewardClaimed(true);
      showPopup('Вы получили 2000 монет за подписку на Telegram канал!', true);
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
      showPopup('Произошла ошибка при начислении награды.');
    } finally {
      setIsLoadingTelegram(false);
    }
  };

  // Получение награды за привязку кошелька
  const claimWalletReward = async () => {
    if (!wallet) {
      showPopup('Вы еще не привязали TON кошелек.');
      return;
    }

    if (!userId) {
      showPopup('ID пользователя Telegram не найден.');
      return;
    }

    setIsLoadingWallet(true);
    try {
      const rewardRef = ref(database, `users/${userId}/walletRewardClaimed`);
      const snapshot = await get(rewardRef);

      if (snapshot.exists() && snapshot.val()) {
        showPopup('Вы уже получили награду за привязку кошелька.');
        return;
      }

      const coinsRef = ref(database, `users/${userId}/clickCount`);
      const currentCoins = (await get(coinsRef)).val() || 0;
      const newCoins = currentCoins + 5000;

      await set(coinsRef, newCoins);
      await set(rewardRef, true);
      setCoins(newCoins);
      setWalletRewardClaimed(true);
      showPopup('Вы получили 5000 монет за привязку TON кошелька!', true);
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
      showPopup('Произошла ошибка при начислении награды.');
    } finally {
      setIsLoadingWallet(false);
    }
  };

  if (loading) return <div>Загрузка данных...</div>;
  if (!userId) return <div>Ошибка: ID пользователя Telegram не найден.</div>;

  return (
    <div className="rewards-page">
      <h1>Получение наград</h1>
      <div className="rewards-list">
        {!telegramRewardClaimed && (
          <div className="reward-item">
            <h3>Подписка на Telegram канал</h3>
            <p>Награда: 2000 монет</p>
            <button
              onClick={claimTelegramReward}
              disabled={isLoadingTelegram}
            >
              {isLoadingTelegram ? 'Загрузка...' : 'Получить награду'}
            </button>
          </div>
        )}

        {!walletRewardClaimed && (
          <div className="reward-item">
            <h3>Привязка TON кошелька</h3>
            <p>Награда: 5000 монет</p>
            <button
              onClick={claimWalletReward}
              disabled={isLoadingWallet}
            >
              {isLoadingWallet ? 'Загрузка...' : 'Получить награду'}
            </button>
          </div>
        )}
      </div>
      <div className="total-coins">
        <h3>Ваши монеты: {coins}</h3>
      </div>

      {popupMessage && (
        <>
          <div className="overlay" onClick={() => setPopupMessage(null)} />
          <div className="profit-popup rewards-popup">
            <p>{popupMessage}</p>
            <button onClick={() => setPopupMessage(null)}>Закрыть</button>
          </div>
        </>
      )}

      <NavigationBar />
    </div>
  );
}

export default RewardsPage;
