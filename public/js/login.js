// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmd4U_Hk8QpVULwYSsbWWicgay6OsO3Co",
  authDomain: "login-808c3.firebaseapp.com",
  databaseURL: "https://login-808c3-default-rtdb.firebaseio.com",
  projectId: "login-808c3",
  storageBucket: "login-808c3.appspot.com",
  messagingSenderId: "948774255128",
  appId: "1:948774255128:web:f02ca8c3575485eaad216d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'index.html'; // Redirect on success
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});
