const fs = require('fs');

// Fonction générique pour récupérer les flux et générer le HTML d'une page
async function mettreAJourPage(nomFichier, titrePage, couleurPrimaire, sources) {
    let articlesHtml = "";

    for (let source of sources) {
        try {
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.status === 'ok' && data.items) {
                data.items.forEach(item => {
                    const dateObj = new Date(item.pubDate);
                    const isoDate = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : "";
                    
                    articlesHtml += `
                    <div class="article-card" data-date="${isoDate}" data-source="${source.nom}">
                        <div class="meta-info">
                            <span class="source-tag">${source.nom}</span>
                            <span class="date">${item.pubDate}</span>
                        </div>
                        <h3><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a></h3>
                        <div class="article-content">${item.description || ''}</div>
                    </div>`;
                });
            }
        } catch (e) {
            console.error(`Erreur sur ${source.nom}:`, e);
        }
    }

    const pageComplete = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titrePage} - Archives</title>
    <style>
        :root {
            --bg-color: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #1e293b;
            --text-muted: #64748b;
            --primary: ${couleurPrimaire};
            --border: #e2e8f0;
        }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: var(--bg-color); color: var(--text-main); max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.7; }
        header { background: var(--card-bg); padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 25px; }
        h1 { margin: 0; font-size: 1.5rem; color: #0f172a; }
        .article-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 22px; margin-bottom: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .meta-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .source-tag { font-size: 0.75rem; background: #e2e8f0; color: #334155; padding: 3px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; }
        .date { font-size: 0.8rem; color: var(--text-muted); }
        h3 { margin: 0 0 10px 0; font-size: 1.15rem; }
        h3 a { color: var(--primary); text-decoration: none; }
        h3 a:hover { text-decoration: underline; }
        .article-content { font-size: 0.95rem; color: #475569; margin-top: 12px; border-top: 1px solid var(--border); padding-top: 12px; }
    </style>
</head>
<body>
    <header><h1>${titrePage}</h1></header>
    <div id="feed-container">${articlesHtml}</div>
</body>
</html>`;

    // Écrit le fichier directement dans le dossier Source
    fs.writeFileSync(`Source/${nomFichier}`, pageComplete);
    console.log(`Fichier Source/${nomFichier} mis à jour !`);
}

// Fonction principale qui enchaîne les trois pages
async function lancerToutesLesMisesAJour() {
    // 1. Journal
    await mettreAJourPage('journal.html', 'journal.io', '#2563eb', [
        { nom: "Radio-Canada Actualités", url: "https://ici.radio-canada.ca/rss/1" },
        { nom: "Le Figaro Actualité", url: "https://www.lefigaro.fr/rss/figaro_actualites.xml" }
    ]);

    // 2. Économie
    await mettreAJourPage('eco.html', 'eco.io', '#059669', [
        { nom: "La Presse Affaires", url: "https://www.lapresse.ca/affaires/rss" },
        { nom: "Le Figaro Économie", url: "https://www.lefigaro.fr/rss/figaro_economie.xml" }
    ]);

    // 3. Culture
    await mettreAJourPage('culture.html', 'culture.io', '#7c3aed', [
        { nom: "Radio-Canada Culture", url: "https://ici.radio-canada.ca/rss/13" },
        { nom: "Le Figaro Culture", url: "https://www.lefigaro.fr/rss/figaro_culture.xml" }
    ]);
}

lancerToutesLesMisesAJour();
