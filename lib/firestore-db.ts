import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { generateRequestId } from './db';

// Users collection operations
export const usersCollection = collection(db, 'users');
export const buyRequestsCollection = collection(db, 'buy_requests');
export const transactionsCollection = collection(db, 'transactions');
export const disputesCollection = collection(db, 'disputes');
export const sessionsCollection = collection(db, 'sessions');
export const settingsCollection = collection(db, 'settings');

// User operations
export async function createUser(userData: any) {
  const userRef = doc(usersCollection);
  const userDataWithTimestamp = {
    ...userData,
    created_at: serverTimestamp(),
    id: userRef.id
  };
  await setDoc(userRef, userDataWithTimestamp);
  return { id: userRef.id, ...userDataWithTimestamp };
}

export async function getUserById(id: string) {
  const userRef = doc(db, 'users', id);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  return null;
}

export async function getUserByUsername(username: string) {
  const q = query(usersCollection, where('username', '==', username));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function getUserByEmail(email: string) {
  const q = query(usersCollection, where('email', '==', email));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function updateUser(id: string, userData: any) {
  const userRef = doc(db, 'users', id);
  const userDataWithTimestamp = {
    ...userData,
    updated_at: serverTimestamp()
  };
  await updateDoc(userRef, userDataWithTimestamp);
  return { id, ...userDataWithTimestamp };
}

export async function getAllUsers() {
  const querySnapshot = await getDocs(usersCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateUserRole(id: string, userData: any) {
  return updateUser(id, userData);
}

// Session operations
export async function createSession(sessionData: any) {
  const sessionRef = doc(sessionsCollection);
  const sessionDataWithTimestamp = {
    ...sessionData,
    created_at: serverTimestamp(),
    id: sessionRef.id
  };
  await setDoc(sessionRef, sessionDataWithTimestamp);
  return { id: sessionRef.id, ...sessionDataWithTimestamp };
}

export async function getSessionByToken(token: string) {
  const q = query(sessionsCollection, where('token', '==', token));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function deleteSession(token: string) {
  const session = await getSessionByToken(token);
  if (session) {
    const sessionRef = doc(db, 'sessions', session.id);
    await deleteDoc(sessionRef);
    return true;
  }
  return false;
}

// Buy request operations
export async function createBuyRequest(requestData: any) {
  const requestRef = doc(buyRequestsCollection);
  const requestDataWithTimestamp = {
    ...requestData,
    request_id: requestData.request_id || generateRequestId(),
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
    id: requestRef.id
  };
  await setDoc(requestRef, requestDataWithTimestamp);
  return { id: requestRef.id, ...requestDataWithTimestamp };
}

export async function getBuyRequestById(id: string) {
  const requestRef = doc(db, 'buy_requests', id);
  const requestSnap = await getDoc(requestRef);
  if (requestSnap.exists()) {
    return { id: requestSnap.id, ...requestSnap.data() };
  }
  return null;
}

export async function getBuyRequestByRequestId(requestId: string) {
  const q = query(buyRequestsCollection, where('request_id', '==', requestId));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
}

export async function getBuyRequestsByUserId(userId: string) {
  const q = query(buyRequestsCollection, where('user_id', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAllBuyRequests() {
  const querySnapshot = await getDocs(buyRequestsCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateBuyRequest(id: string, requestData: any) {
  const requestRef = doc(db, 'buy_requests', id);
  const requestDataWithTimestamp = {
    ...requestData,
    updated_at: serverTimestamp()
  };
  await updateDoc(requestRef, requestDataWithTimestamp);
  return { id, ...requestDataWithTimestamp };
}

// Transaction operations
export async function createTransaction(transactionData: any) {
  const transactionRef = doc(transactionsCollection);
  const transactionDataWithTimestamp = {
    ...transactionData,
    created_at: serverTimestamp(),
    id: transactionRef.id
  };
  await setDoc(transactionRef, transactionDataWithTimestamp);
  return { id: transactionRef.id, ...transactionDataWithTimestamp };
}

export async function getTransactionsByUserId(userId: string) {
  const q = query(transactionsCollection, where('user_id', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAllTransactions() {
  const querySnapshot = await getDocs(transactionsCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateTransaction(id: string, transactionData: any) {
  const transactionRef = doc(db, 'transactions', id);
  const transactionDataWithTimestamp = {
    ...transactionData,
    updated_at: serverTimestamp()
  };
  await updateDoc(transactionRef, transactionDataWithTimestamp);
  return { id, ...transactionDataWithTimestamp };
}

// Dispute operations
export async function createDispute(disputeData: any) {
  const disputeRef = doc(disputesCollection);
  const disputeDataWithTimestamp = {
    ...disputeData,
    created_at: serverTimestamp(),
    id: disputeRef.id
  };
  await setDoc(disputeRef, disputeDataWithTimestamp);
  return { id: disputeRef.id, ...disputeDataWithTimestamp };
}

export async function getDisputesByUserId(userId: string) {
  const q = query(disputesCollection, where('user_id', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAllDisputes() {
  const querySnapshot = await getDocs(disputesCollection);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateDispute(id: string, disputeData: any) {
  const disputeRef = doc(db, 'disputes', id);
  const disputeDataWithTimestamp = {
    ...disputeData,
    resolved_at: disputeData.status === 'resolved' ? serverTimestamp() : null
  };
  await updateDoc(disputeRef, disputeDataWithTimestamp);
  return { id, ...disputeDataWithTimestamp };
}

// Settings operations
export async function getSettings() {
  // Get the first (and only) settings document
  const q = query(settingsCollection, limit(1));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }
  
  // If no settings exist, create default settings
  const settingsRef = doc(settingsCollection);
  const defaultSettings = {
    markup_percentage: 1.0,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp()
  };
  await setDoc(settingsRef, defaultSettings);
  return { id: settingsRef.id, ...defaultSettings };
}

export async function updateSettings(settingsData: any) {
  // Get existing settings or create new
  const settings = await getSettings();
  const settingsRef = doc(db, 'settings', settings.id);
  const settingsDataWithTimestamp = {
    ...settingsData,
    updated_at: serverTimestamp()
  };
  await updateDoc(settingsRef, settingsDataWithTimestamp);
  return { id: settings.id, ...settingsDataWithTimestamp };
}

// Helper function to convert Firestore timestamps
export function convertTimestamps(data: any) {
  if (!data) return data;
  
  const converted: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      converted[key] = (value as Timestamp).toDate();
    } else {
      converted[key] = value;
    }
  }
  return converted;
}