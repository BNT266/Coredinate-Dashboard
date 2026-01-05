console.log('JavaScript lädt!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ist bereit!');
    
    // Test ob Button existiert
    const testBtn = document.getElementById('loadTestData');
    console.log('Button gefunden:', testBtn);
    
    if (testBtn) {
        testBtn.addEventListener('click', function() {
            alert('Button funktioniert!');
            console.log('Button wurde geklickt!');
        });
    }
    
    // Test Chart.js
    if (typeof Chart !== 'undefined') {
        console.log('Chart.js ist geladen!');
        alert('Chart.js funktioniert!');
    } else {
        console.log('Chart.js FEHLER - nicht geladen!');
        alert('Chart.js FEHLER!');
    }
});
