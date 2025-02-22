import React, { useEffect, useState } from 'react';
import { TonConnectUIProvider, useTonConnectUI, useTonWallet, TonConnectButton } from '@tonconnect/ui-react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ReferralPage from './ReferralPage';
import ClickCounter from './clicker'; // Импортируем компонент ClickCounter
import WebApp from '@twa-dev/sdk'; // Импортируем SDK для Telegram Web Apps
import { motion, AnimatePresence } from 'framer-motion'; // Импортируем Framer Motion

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
  const [username, setUsername] = useState(''); // Состояние для хранения никнейма пользователя
  const [firstName, setFirstName] = useState(''); // Состояние для хранения имени пользователя
  const [isMobile, setIsMobile] = useState(true); // Состояние для проверки устройства
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки

  // Проверяем, является ли устройство мобильным
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    setIsMobile(isMobileDevice);
  }, []);

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

  // Имитация загрузки приложения
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false); // Завершаем загрузку через 3 секунды
    }, 3000);

    return () => clearTimeout(timer); // Очистка таймера при размонтировании
  }, []);

  // Глобальный обработчик ошибок
  useEffect(() => {
    const handleError = (event) => {
      const error = event.error || event.reason;
      if (error && error.message === 'Operation aborted') {
        // Игнорируем ошибку "Operation aborted"
        console.log('Operation aborted (likely due to tab switch or browser minimization)');
      } else if (error) {
        console.error('Unhandled error:', error);
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

  // Если пользователь заходит с ПК, показываем сообщение
  if (!isMobile) {
    return (
      <div style={{ 
        backgroundColor: '#404040', // Фон всей страницы
        minHeight: '100vh', // Минимальная высота страницы
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: '#ffffff', // Белый текст для контраста
        textAlign: 'center',
        padding: '20px',
      }}>
        <h1>DOT COIN</h1>
        <p>Пожалуйста, откройте это приложение на вашем телефоне.</p>
        <p>Это приложение доступно только для мобильных устройств.</p>
      </div>
    );
  }

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
      {/* Анимация загрузки */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#404040',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '5px solid #4CAF50',
                borderTop: '5px solid transparent',
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Основной контент */}
      {!isLoading && (
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
        </div>
      )}

      {/* Нижняя панель с кнопками навигации */}
      {!isLoading && (
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
      )}
    </div>
  );
}

export default App;
