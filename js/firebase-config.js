// Firebase web configuration is public; security is enforced by Firebase Auth and Firestore rules.
export const firebaseConfig = {
    apiKey: "AIzaSyBjU4LzP8vxGiTccQuQxlk4OUw38uNT0Og",
    authDomain: "shail-3997d.firebaseapp.com",
    projectId: "shail-3997d",
    appId: "1:597085902315:web:92e3bec5beba88832735ae"
};

// Add the Firebase Authentication UID for each person allowed to manage the website.
export const adminUids = [
    "aWxUFqpKBuXlap7OL0bSFq17zmr1",
    "LDpvmSAOS4eUzlwYMpuv9ANgO6R2"
];

export const firebaseConfigured = () =>
    !Object.values(firebaseConfig).some(value => value.includes("REPLACE_WITH")) &&
    adminUids.length > 0 &&
    adminUids.every(uid => uid && !uid.includes("REPLACE_WITH"));
