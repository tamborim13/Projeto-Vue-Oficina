import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyABIh1BXJg-6QGs34OuTaNpkvUWzQSeCWY",
    authDomain: "vue-firebase-31de1.firebaseapp.com",
    projectId: "vue-firebase-31de1",
    storageBucket: "vue-firebase-31de1.firebasestorage.app",
    messagingSenderId: "133522615554",
    appId: "1:133522615554:web:13b1ed664aab4a814e261b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };