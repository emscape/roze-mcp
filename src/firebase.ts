import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  projectId: 'myfriendroze-platform',
  // Add other config as needed, but projectId is sufficient for callable functions
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Functions
const functions = getFunctions(app, 'us-west1'); // Specify the region

// Initialize Auth (for authenticated calls)
const auth = getAuth(app);

// Export Firebase services
export { functions, auth };

// Export callable functions
export const healthzCallable = httpsCallable(functions, 'healthz');
export const createOrderCallable = httpsCallable(functions, 'createOrder');
export const createSubscriptionCallable = httpsCallable(functions, 'createSubscription');
