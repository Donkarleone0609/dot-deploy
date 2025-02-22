import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Импортируем Link для навигации

const Clicker = () => {
    const [clickCount, setClickCount] = useState(0); // Счётчик кликов
    const [isClicked, setIsClicked] = useState(false); // Состояние анимации

    // Обработчик клика
    const handleClick = () => {
        setIsClicked(true); // Запускаем анимацию
        setClickCount(clickCount + 1); // Увеличиваем счётчик

        // Сбрасываем анимацию через 200 мс
        setTimeout(() => {
            setIsClicked(false);
        }, 200);
    };

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
