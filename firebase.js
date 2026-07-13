import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyCoC88IZa1F6TjgGsDAyxGk0QoYkq2PIiQ",
  authDomain: "seungwoo-record.firebaseapp.com",
  projectId: "seungwoo-record",
  storageBucket: "seungwoo-record.firebasestorage.app",
  messagingSenderId: "1079513296391",
  appId: "1:1079513296391:web:b8cbb7d9f9d2ad1bdb44a2"
};

const app = initializeApp(firebaseConfig);

export { app };