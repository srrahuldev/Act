import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  where
} from "firebase/firestore";
import { db, auth } from "../firebase";

const TRANSACTIONS_COLLECTION = "transactions";
const CUSTOMERS_COLLECTION = "customers";

// Transactions
export const fetchTransactions = async (params = {}) => {
  const user = auth.currentUser;
  if (!user) return { data: [] };

  const q = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where("userId", "==", user.uid)
  );
  
  const querySnapshot = await getDocs(q);
  let data = querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

  // Sort by date descending
  data.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));

  if (params.search) {
    const s = params.search.toLowerCase();
    data = data.filter(t => 
      t.name?.toLowerCase().includes(s) || 
      t.lastName?.toLowerCase().includes(s) || 
      t.description?.toLowerCase().includes(s)
    );
  }
  return { data };
};

export const createTransaction = async (t) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in to create a transaction");

  const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
    ...t,
    userId: user.uid,
    createdAt: serverTimestamp()
  });
  return { data: { _id: docRef.id, ...t, userId: user.uid } };
};

export const updateTransaction = async (id, t) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized");
  
  const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
  await updateDoc(docRef, { ...t, userId: user.uid }); // Ensure userId stays correct
  return { data: { _id: id, ...t, userId: user.uid } };
};

export const deleteTransaction = async (id) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized");

  const docRef = doc(db, TRANSACTIONS_COLLECTION, id);
  // In a real production app, you'd use security rules to enforce this.
  await deleteDoc(docRef);
  return { data: { message: 'Deleted' } };
};

// Customers
export const fetchCustomers = async () => {
  const user = auth.currentUser;
  if (!user) return { data: [] };

  const q = query(
    collection(db, CUSTOMERS_COLLECTION),
    where("userId", "==", user.uid)
  );

  const querySnapshot = await getDocs(q);
  const data = querySnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
  return { data };
};

export const createCustomer = async (c) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User must be logged in to create a customer");

  const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
    ...c,
    userId: user.uid,
    balance: 0,
    totalCredit: 0,
    totalDebit: 0,
    transactionsCount: 0,
    createdAt: serverTimestamp()
  });
  return { data: { _id: docRef.id, ...c, userId: user.uid } };
};

export const updateCustomer = async (id, c) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized");

  const docRef = doc(db, CUSTOMERS_COLLECTION, id);
  await updateDoc(docRef, { ...c, userId: user.uid });
  return { data: { _id: id, ...c, userId: user.uid } };
};

export const deleteCustomer = async (id) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Unauthorized");

  const docRef = doc(db, CUSTOMERS_COLLECTION, id);
  await deleteDoc(docRef);
  return { data: { message: 'Deleted' } };
};
