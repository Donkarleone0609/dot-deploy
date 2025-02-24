import React, { useState, useEffect } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import WebApp from '@twa-dev/sdk';
import { database, ref, get, set } from './firebase';
import NavigationBar from './NavigationBar';
import confetti from 'canvas-confetti';
import './Clicker.css';

// Check Telegram subscription
const checkTelegramSubscription = async (userId) => {
  const botToken = '7118279667:AAF0EHBOL4lK85mD7KCR8ZeJFX6-xVL2Flc';
  const channelId = '@whoisdotcoin';
  const url = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelId}&user_id=${userId}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return ['member', 'administrator', 'creator'].includes(data.result?.status);
  } catch (error) {
    console.error('Error checking Telegram subscription:', error);
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

  // Load user data
  useEffect(() => {
    if (!userId) {
      console.error('Telegram user ID not found.');
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
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Show popup message
  const showPopup = (message, isSuccess = false) => {
    setPopupMessage(message);
    if (isSuccess) confetti();
  };

  // Claim Telegram reward
  const claimTelegramReward = async () => {
    if (!userId) {
      showPopup('Telegram user ID not found.');
      return;
    }

    setIsLoadingTelegram(true);
    try {
      const isSubscribed = await checkTelegramSubscription(userId);
      if (!isSubscribed) {
        showPopup('You are not subscribed to the Telegram channel.');
        return;
      }

      const rewardRef = ref(database, `users/${userId}/telegramRewardClaimed`);
      const snapshot = await get(rewardRef);

      if (snapshot.exists() && snapshot.val()) {
        showPopup('You have already claimed the Telegram reward.');
        return;
      }

      const coinsRef = ref(database, `users/${userId}/clickCount`);
      const currentCoins = (await get(coinsRef)).val() || 0;
      const newCoins = currentCoins + 2000;

      await set(coinsRef, newCoins);
      await set(rewardRef, true);
      setCoins(newCoins);
      setTelegramRewardClaimed(true);
      showPopup('You have received 2000 coins for subscribing to the Telegram channel!', true);
    } catch (error) {
      console.error('Error updating data:', error);
      showPopup('An error occurred while claiming the reward.');
    } finally {
      setIsLoadingTelegram(false);
    }
  };

  // Claim wallet reward
  const claimWalletReward = async () => {
    if (!wallet) {
      showPopup('You have not connected a TON wallet.');
      return;
    }

    if (!userId) {
      showPopup('Telegram user ID not found.');
      return;
    }

    setIsLoadingWallet(true);
    try {
      const rewardRef = ref(database, `users/${userId}/walletRewardClaimed`);
      const snapshot = await get(rewardRef);

      if (snapshot.exists() && snapshot.val()) {
        showPopup('You have already claimed the wallet reward.');
        return;
      }

      const coinsRef = ref(database, `users/${userId}/clickCount`);
      const currentCoins = (await get(coinsRef)).val() || 0;
      const newCoins = currentCoins + 5000;

      await set(coinsRef, newCoins);
      await set(rewardRef, true);
      setCoins(newCoins);
      setWalletRewardClaimed(true);
      showPopup('You have received 5000 coins for connecting your TON wallet!', true);
    } catch (error) {
      console.error('Error updating data:', error);
      showPopup('An error occurred while claiming the reward.');
    } finally {
      setIsLoadingWallet(false);
    }
  };

  return (
    <div className="rewards-page">
      <NavigationBar />
      {loading ? (
        <div className="loading-container">
          <div className="loading-label">Загрузка данных...</div>
        </div>
      ) : (
        <>
          <h1>Получение наград</h1>
          <div className="rewards-list">
            {!telegramRewardClaimed && (
              <div className="reward-item">
                <h3>Подписка на Telegram канал</h3>
                <p>Награда: 2000 монет</p>
                <a
                  href="https://t.me/whoisdotcoin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="telegram-link"
                >
                  Перейти в Telegram канал
                </a>
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
        </>
      )}
    </div>
  );
}

export default RewardsPage;
