const fs = require('fs');
const path = require('path');

function extraireAnciensArticles(filePath) {
    if (!fs.existsSync(filePath)) return "";
    const contenuActuel = fs.readFileSync(filePath, 'utf8');
    const debut = contenuActuel.indexOf('<main id="feed-container">');
    const fin = contenuActuel.lastIndexOf('</main>');
    if (debut !== -1 && fin !== -1) {
        return contenuActuel.substring(debut + '<main id="feed-container">'.length, fin).trim();
    }
    return "";
}

async function mettreAJourPage(nomFichier, titrePage, couleurPrimaire, sources) {
    const filePath = `Source/${nomFichier}`;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let anciensArticlesHtml = extraireAnciensArticles(filePath);
    let nouveauxArticlesHtml = "";

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
                    
                    const descriptionComplete = item.description ? item.description.replace(/<[^>]*>/g, '').trim() : "";

                    if (!anciensArticlesHtml.includes(signature) && !nouveauxArticlesHtml.includes(signature)) {
                        // Structure ultra-propre style Wikipédia (balises sémantiques standard)
                        nouveauxArticlesHtml += `
                    <article class="article-item" data-date="${isoDate}" data-source="${source.nom}">
                        <header class="article-header">
                            <span class="article-source">${source.nom}</span>
                            <time class="article-date" datetime="${isoDate}">${item.pubDate}</time>
                        </header>
                        <h2 class="article-title"><a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a></h2>
                        <div class="article-summary">
                            <p>${descriptionComplete}</p>
                        </div>
                    </article>`;
                    }
                });
            }
        } catch (e) {
            console.error(`Erreur sur ${source.nom}:`, e);
        }
    }

    const feedTotal = nouveauxArticlesHtml + "\n" + anciensArticlesHtml;

    // Page HTML style encyclopédie/Wikipédia, parfaitement lisible pour les humains et les robots
    const pageComplete = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titrePage} - Archives</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.7; }
        header.site-header { background: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 25px; border-left: 5px solid ${couleurPrimaire}; }
        h1 { margin: 0; font-size: 1.5rem; color: #0f172a; }
        .article-item { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 22px; margin-bottom: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .article-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 0.85rem; color: #64748b; }
        .article-source { background: #e2e8f0; color: #334155; padding: 3px 8px; border-radius: 4px; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; }
        .article-title { margin: 0 0 10px 0; font-size: 1.15rem; }
        .article-title a { color: ${couleurPrimaire}; text-decoration: none; }
        .article-title a:hover { text-decoration: underline; }
        .article-summary { font-size: 0.95rem; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; }
    </style>
</head>
<body>
    <header class="site-header">
        <h1>${titrePage}</h1>
    </header>
    <main id="feed-container">
${feedTotal}
    </main>
</body>
</html>`;

    fs.writeFileSync(filePath, pageComplete);
    console.log(`Succès : ${filePath} mis à jour au format standard !`);
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
