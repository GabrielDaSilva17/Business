// config-firebase.js
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCV1X1rzIEOY7sFvwHBWW_NbxFpcXfkq2o", // Suas chaves reais
  authDomain: "business-8074f.firebaseapp.com",
  projectId: "business-8074f",
  storageBucket: "business-8074f.firebasestorage.app",
  messagingSenderId: "396159871355",
  appId: "1:396159871355:web:de7d3880e860bc7ccc35de",
  measurementId: "G-8JRPW56005"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


export { app, analytics, getAuth}

