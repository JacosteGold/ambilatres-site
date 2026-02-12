/**
 * Configuration Firebase (SDK client) — chargée depuis l’API pour ne pas exposer de clés en dur.
 * Si GET /api/firebase-config ne renvoie pas de config, Firebase n’est pas initialisé.
 */
(function () {
    var apiBase = (window.location.origin.includes('localhost') || window.location.protocol === 'file:')
        ? 'http://localhost:3000'
        : '';

    function initFirebase(config) {
        if (typeof firebase === 'undefined' || !config || !config.apiKey) return;
        try {
            firebase.initializeApp(config);
            if (typeof firebase.analytics === 'function') {
                firebase.analytics();
            }
        } catch (e) {
            console.warn('Firebase init:', e.message);
        }
    }

    function loadFromApi() {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', apiBase + '/api/firebase-config', true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            if (xhr.status === 200) {
                try {
                    var config = JSON.parse(xhr.responseText);
                    initFirebase(config);
                } catch (e) {
                    console.warn('Firebase config parse:', e.message);
                }
            }
        };
        xhr.send();
    }

    if (typeof firebase !== 'undefined') {
        loadFromApi();
    }
})();
