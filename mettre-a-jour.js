const fs = require('fs');
const path = require('path');

function extraireAnciensArticles(filePath) {
    if (!fs.existsSync(filePath)) return "";
    const contenuActuel = fs.readFileSync(filePath, 'utf8');
    const debut = contenuActuel.indexOf('<div id="feed-container">');
    const fin = contenuActuel.lastIndexOf('</div>\n</body>');
    if (debut !== -1 && fin !== -1) {
        return contenuActuel.substring(debut + '<div id="feed-container">'.length, fin).trim();
    }
    return "";
}

async function mettreAJourPage(nomFichier, titrePage, couleurPrimaire, sources) {
    const filePath = `Source/${nomFichier}`;
    const jsonPath = filePath.replace('.html', '.json');
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let anciensArticlesHtml = extraireAnciensArticles(filePath);
    let nouveauxArticlesHtml = "";
    let listeArticlesJson = [];

    for (let source of sources) {
        try {
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.items) {
                data.items.slice(0, 5).forEach(item => {
                    const dateObj = new Date(item.pubDate);
                    const isoDate = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : "";
                    const signature = `href="${item.link}"`;
                    
                    // Texte complet non coupé pour l'interface d'apprentissage
                    const descriptionComplete = item.description ? item.description.replace(/<[^>]*>/g, '').trim() : "";
                    
                    // Version légèrement tronquée pour l'affichage visuel des cartes HTML si besoin
                    let descriptionHtml = descriptionComplete;
                    if (descriptionHtml.length > 250) {
                        descriptionHtml = descriptionHtml.substring(0, 250) + "...";
                    }

                    if (!anciensArticlesHtml.includes(signature) && !nouveauxArticlesHtml.includes(signature)) {
                        // 1. Génération du bloc HTML pour ton site
                        nouveauxArticlesHtml += `
                    <div class="article-card" data-date="${isoDate}" data-source="${source.nom}">
                        <div class="meta-info">
                            <span class="source-tag">${source.nom}</span>
                            <span class="date">${item.pubDate}</span>
                        </div>
                        <h3><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a></h3>
                        <div class="article-content">${descriptionHtml}</div>
                    </div>`;

                        // 2. Enregistrement des données brutes structurées pour ton interface d'apprentissage
                        listeArticlesJson.push({
                            titre: item.title,
                            lien: item.link,
                            date: item.pubDate,
                            dateIso: isoDate,
                            source: source.nom,
                            contenu: descriptionComplete
                        });
                    }
                });
            }
        } catch (e) {
            console.error(`Erreur sur ${source.nom}:`, e);
        }
    }

    const feedTotal = nouveauxArticlesHtml + "\n" + anciensArticlesHtml;

    // Reconstruction de la page HTML (ton design inchangé)
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
    <div id="feed-container">
${feedTotal}
    </div>
</body>
</html>`;

    // Sauvegarde du HTML pour ton site web
    fs.writeFileSync(filePath, pageComplete);

    // Sauvegarde du fichier JSON propre pour ton interface d'apprentissage (avec fusion des anciens si besoin)
    let anciensJson = [];
    if (fs.existsSync(jsonPath)) {
        try {
            anciensJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        } catch (err) { anciensJson = []; }
    }
    const jsonTotal = [...listeArticlesJson, ...anciensJson];
    fs.writeFileSync(jsonPath, JSON.stringify(jsonTotal, null, 2));

    console.log(`Succès : ${filePath} et ${jsonPath} mis à jour !`);
}

async function lancerToutesLesMisesAJour() {
    await mettreAJourPage('journal.html', 'journal.io', '#2563eb', [
        { nom: "Le Monde Actualités", url: "https://www.lemonde.fr/rss/une.xml" },
        { nom: "24 Heures", url: "https://www.24hoursv.ca/rss" }
    ]);

    await mettreAJourPage('eco.html', 'eco.io', '#059669', [
        { nom: "Les Echos", url: "https://www.lesechos.fr/rss/rss_une.xml" }
    ]);

    await mettreAJourPage('culture.html', 'culture.io', '#7c3aed', [
        { nom: "France Culture", url: "https://www.radiofrance.fr/franceculture/rss" }
    ]);
}

lancerToutesLesMisesAJour();
