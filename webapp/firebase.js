  // firebase.js
  sap.ui.define([], function () {
    // Your web app's Firebase configuration
    const firebaseConfig = {
        apiKey: "AIzaSyDqC8PJKalrVQr9jclJIhH-jsuhgda5-uQ",
        authDomain: "ushare-e5995.firebaseapp.com",
        projectId: "ushare-e5995",
        storageBucket: "ushare-e5995.appspot.com",
        messagingSenderId: "692157355665",
        appId: "1:692157355665:web:7c56267347f44d2f635130"
      };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    // Initialize Firebase Storage
    var storage = firebase.storage();
    return storage;
  });
