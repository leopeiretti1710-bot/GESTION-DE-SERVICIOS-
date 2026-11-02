import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBEQh4luB5lAWurMyLyCkL3HZo7Mose4vk",
  authDomain: "gestion-de-sevicios.firebaseapp.com",
  projectId: "gestion-de-sevicios",
  storageBucket: "gestion-de-sevicios.firebasestorage.app",
  messagingSenderId: "121156051532",
  appId: "1:121156051532:web:c39e400449c1e81b560ae9",
  measurementId: "G-NY1DFPECME"
};

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
