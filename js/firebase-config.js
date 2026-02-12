/**
 * Configuration Firebase (SDK client) pour Analytics et usage futur (Auth, Firestore client).
 * Les scripts Firebase compat doivent être chargés avant ce fichier.
 */
(function () {
    var firebaseConfig = {
        apiKey: "AIzaSyAMxdN-6CgbdG0OUbV1VqaFy8mna2_MRgw",
        authDomain: "test-efd07.firebaseapp.com",
        projectId: "test-efd07",
        storageBucket: "test-efd07.firebasestorage.app",
        messagingSenderId: "959055652554",
        appId: "1:959055652554:web:b372381018c4a8496a7633",
        measurementId: "G-NT772NZB7E"
    };

    if (typeof firebase !== 'undefined') {
        try {
            var app = firebase.initializeApp(firebaseConfig);
            if (typeof firebase.analytics === 'function') {
                firebase.analytics();
            }
        } catch (e) {
            console.warn('Firebase init:', e.message);
        }
    }
})();
