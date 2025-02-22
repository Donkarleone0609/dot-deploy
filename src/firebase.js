import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyBISVWWeZEOBffSaLfeg1Q1MwTOKI1PY48",
    authDomain: "dot-coin-d4ca5.firebaseapp.com",
    projectId: "dot-coin-d4ca5",
    storageBucket: "dot-coin-d4ca5.firebasestorage.app",
    messagingSenderId: "828871415977",
    appId: "1:828871415977:web:2449fa031f327163ca31b8",
    measurementId: "G-YD44NWQ2YN"
  };
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };