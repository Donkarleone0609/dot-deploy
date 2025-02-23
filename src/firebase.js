// firebase.js
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database'; // Импортируем необходимые функции

const firebaseConfig = {
  apiKey: "AIzaSyBISVWWeZEOBffSaLfeg1Q1MwTOKI1PY48",
  authDomain: "dot-coin-d4ca5.firebaseapp.com",
  projectId: "dot-coin-d4ca5",
  storageBucket: "dot-coin-d4ca5.appspot.com",
  messagingSenderId: "828871415977",
  appId: "1:828871415977:web:2449fa031f327163ca31b8",
  measurementId: "G-YD44NWQ2YN"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Экспортируем database и необходимые функции
export { database, ref, set, get };
