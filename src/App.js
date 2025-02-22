import React, { useEffect, useState } from 'react';
import { TonConnectUIProvider, useTonConnectUI, useTonWallet, TonConnectButton } from '@tonconnect/ui-react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ReferralPage from './ReferralPage';
import ClickCounter from './clicker'; // Импортируем компонент ClickCounter
import WebApp from '@twa-dev/sdk'; // Импортируем SDK для Telegram Web Apps

function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://orange-used-monkey-420.mypinata.cloud/ipfs/bafkreief5t4vlgrj77jc3tlswclcz2zcx4yspfzh2muahy7c5vehgwrfri">
      <Router>
        <Routes>
          <Route path="/" element={<WalletConnection />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/click-counter" element={<ClickCounter />} /> {/* Добавляем маршрут для ClickCounter */}
        </Routes>
      </Router>
    </TonConnectUIProvider>
  );
}

function WalletConnection() {
  const [tonConnectUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [walletAddress, setWalletAddress] = useState('');
  const [error, setError] = useState('');
  const [username, setUsername] = useState(''); // Состояние для хранения никнейма пользователя
  const [firstName, setFirstName] = useState(''); // Состояние для хранения имени пользователя

  useEffect(() => {
    if (wallet) {
      setWalletAddress(wallet.account.address);
      setError(''); // Очищаем ошибку при успешном подключении
    } else {
      setWalletAddress('');
    }
  }, [wallet]);

  // Получаем данные пользователя из Telegram Mini App
  useEffect(() => {
    if (WebApp.initDataUnsafe.user) {
      const user = WebApp.initDataUnsafe.user;
      if (user.username) {
        setUsername(user.username); // Устанавливаем никнейм пользователя
      }
      if (user.first_name) {
        setFirstName(user.first_name); // Устанавливаем имя пользователя
      }
    }
  }, []);

  const handleSendTon = async () => {
    if (!wallet) {
      setError('Wallet is not connected');
      return;
    }

    try {
      // Адрес кошелька получателя (подключенный пользователь)
      const recipientAddress = wallet.account.address;

      // Количество TON для отправки (0.001 TON = 1000000 наноТонов)
      const amount = '1000000'; // 0.001 TON

      // Создаем транзакцию для отправки TON
      const transaction = {
        messages: [
          {
            address: recipientAddress, // Адрес получателя
            amount: amount, // Количество TON в наноТонах
          },
        ],
        validUntil: Math.floor(Date.now() / 1000) + 600, // Транзакция действительна 10 минут
      };

      // Отправляем транзакцию
      const result = await tonConnectUI.sendTransaction(transaction);

      console.log('Transaction sent:', result);
      setError(''); // Очищаем ошибку при успешной транзакции
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Failed to send TON. Please try again.');
    }
  };

  // Глобальный обработчик ошибок
  useEffect(() => {
    const handleError = (event) => {
      const error = event.error || event.reason;
      if (error && error.message === 'Operation aborted') {
        // Игнорируем ошибку "Operation aborted"
        console.log('Operation aborted (likely due to tab switch or browser minimization)');
      } else if (error) {
        console.error('Unhandled error:', error);
        setError('An error occurred. Please try again.');
      }
    };

    // Подписываемся на глобальные ошибки
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    // Отписываемся от глобальных ошибок при размонтировании компонента
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return (
    <div style={{ 
      backgroundColor: '#404040', // Фон всей страницы
      minHeight: '100vh', // Минимальная высота страницы
      padding: '20px', // Отступы для контента
      display: 'flex', // Используем flexbox для центрирования
      flexDirection: 'column', // Вертикальное расположение элементов
      alignItems: 'center', // Центрирование по горизонтали
      justifyContent: 'flex-start', // Контент начинается сверху
      paddingTop: '50px', // Отступ сверху для поднятия контента выше
    }}>
      {/* Основной контент */}
      <div style={{ 
        textAlign: 'center', 
        color: '#ffffff', // Белый текст для контраста
        width: '100%', // Занимает всю ширину
      }}>
        <h1>DOT COIN</h1>
        {firstName && <p>Hello, {firstName}!</p>} {/* Отображаем имя пользователя */}
        {username && <p>Your username: @{username}</p>} {/* Отображаем никнейм пользователя */}

        {/* Текст над кнопкой подключения кошелька */}
        <p style={{ marginBottom: '10px', fontSize: '16px' }}>
          Connect your wallet to receive airdrop in the future
        </p>

        {/* Контейнер для центрирования кнопки */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', // Центрирование по горизонтали
          width: '100%', // Занимает всю ширину
        }}>
          <TonConnectButton />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}
        {wallet && (
          <div style={{ marginTop: '20px' }}>
            <p>Connected Wallet: {walletAddress}</p>
            <button 
              onClick={handleSendTon}
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
            >
              Получить 0.001 TON
            </button>
          </div>
        )}
      </div>

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
          Referral
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
}

export default App;
