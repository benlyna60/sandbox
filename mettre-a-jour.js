const fs = require('fs');
const path = require('path');

// Fonction pour extraire les articles existants du fichier HTML afin de ne rien perdre (mémoire infinie)
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
    
    // On s'assure que le dossier Source existe
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let anciensArticlesHtml = extraireAnciensArticles(filePath);
    let nouveauxArticlesHtml = "";

    for (let source of sources) {
        try {
            // Utilisation d'un proxy/passerelle public ultra-stable pour transformer le RSS en JSON propre
            const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(source.url)}`;
            const response = await fetch(apiUrl);
            const json = await response.json();
            
            if (json.contents) {
                // Parser simple de secours basé sur du texte brut XML/RSS
                const itemMatches = json.contents.match(/<item>([\s\S]*?)<\/item>/g);
                
                if (itemMatches) {
                    // On prend les 5 premiers articles de la source
                    for (let i = 0; i < Math.min(itemMatches.length, 5); i++) {
                        const itemXml = itemMatches[i];
                        
                        const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
                        const linkMatch = itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/);
                        const dateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
                        const descMatch = itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
                        
                        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : "Article sans titre";
                        const link = linkMatch ? linkMatch[1].trim() : "#";
                        const pubDateRaw = dateMatch ? dateMatch[1].trim() : new Date().toUTCString();
                        let description = descMatch ? descMatch[1].replace(/<[^>]*>/g, '').trim() : "";
                        
                        // Nettoyage de la description si trop longue
                        if (description.length > 200) {
                            description = description.substring(0, 200) + "...";
                        }

                        const dateObj = new Date(pubDateRaw);
                        const isoDate = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : "";
                        const signature = `href="${link}"`;

                        if (!anciensArticlesHtml.includes(signature) && !nouveauxArticlesHtml.includes(signature)) {
                            nouveauxArticlesHtml += `
                    <div class="article-card" data-date="${isoDate}" data-source="${source.nom}">
                        <div class="meta-info">
                            <span class="source-tag">${source.nom}</span>
                            <span class="date">${pubDateRaw}</span>
                        </div>
                        <h3><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h3>
                        <div class="article-content">${description}</div>
                    </div>`;
                        }
                    }
                }
            }
        } catch (e) {
            console.error(`Erreur sur ${source.nom}:`, e);
        }
    }

    const feedTotal = nouveauxArticlesHtml + "\n" + anciensArticlesHtml;

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

    fs.writeFileSync(filePath, pageComplete);
    console.log(`Succès : ${filePath} mis à jour avec des articles !`);
}

async function lancerToutesLesMisesAJour() {
    await mettreAJourPage('journal.html', 'journal.io', '#2563eb', [
        { nom: "Radio-Canada Actualités", url: "https://ici.radio-canada.ca/rss/1" },
        { nom: "Le Figaro Actualité", url: "https://www.lefigaro.fr/rss/figaro_actualites.xml" }
    ]);

    await mettreAJourPage('eco.html', 'eco.io', '#059669', [
        { nom: "La Presse Affaires", url: "https://www.lapresse.ca/affaires/rss" },
        { nom: "Le Figaro Économie", url: "https://www.lefigaro.fr/rss/figaro_economie.xml" }
    ]);

    await mettreAJourPage('culture.html', 'culture.io', '#7c3aed', [
        { nom: "Radio-Canada Culture", url: "https://ici.radio-canada.ca/rss/13" },
        { nom: "Le Figaro Culture", url: "https://www.lefigaro.fr/rss/figaro_culture.xml" }
    ]);
}

lancerToutesLesMisesAJour();
