import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxiLgMGGV4IX4AV3VvIHeEoL4alxfUDnQ",
  authDomain: "coffee-shop-98d71.firebaseapp.com",
  projectId: "coffee-shop-98d71",
  storageBucket: "coffee-shop-98d71.firebasestorage.app",
  messagingSenderId: "565341014261",
  appId: "1:565341014261:web:94213ffb93b0b5776fddbc"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);