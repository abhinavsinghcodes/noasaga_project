// Firebase configuration and initialization
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
  firebase.initializeApp(firebaseConfig);
  
  const auth = firebase.auth();
  const database = firebase.database();
  
  // Register function
  function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const username = document.getElementById('username').value;
    const favoriteSong = document.getElementById('favorite_song').value;
    const milkBeforeCereal = document.getElementById('milk_before_cereal').value;
  
    if (!email || !password || !username || !favoriteSong || !milkBeforeCereal) {
      alert('Please fill all fields');
      return;
    }
  
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        const user = auth.currentUser;
        const userData = {
          username,
          email,
          favoriteSong,
          milkBeforeCereal,
          lastLogin: Date.now()
        };
        database.ref('users/' + user.uid).set(userData);
        alert('Registration successful!');
        window.location.href = 'index.html'; // Redirect to homepage
      })
      .catch(error => {
        alert(error.message);
      });
  }
  
  // Login function
  function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    if (!email || !password) {
      alert('Please enter email and password');
      return;
    }
  
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        alert('Login successful!');
        window.location.href = 'index.html'; // Redirect to homepage
      })
      .catch(error => {
        alert(error.message);
      });
  }
  