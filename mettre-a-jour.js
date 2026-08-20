const fs = require('fs');
const path = require('path');

function extraireAnciensArticles(filePath) {
    if (!fs.existsSync(filePath)) return "";
    const contenuActuel = fs.readFileSync(filePath, 'utf8');
    const debut = contenuActuel.indexOf('<div class="mw-parser-output">');
    const fin = contenuActuel.lastIndexOf('</div');
    if (debut !== -1 && fin !== -1) {
        return contenuActuel.substring(debut + '<div class="mw-parser-output">'.length, fin).trim();
    }
    return "";
}

async function mettreAJourPage(nomFichier, titrePage, sources) {
    const filePath = `Source/${nomFichier}`;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let anciensHtml = extraireAnciensArticles(filePath);
    let nouveauxHtml = "";

    for (let source of sources) {
        try {
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data && data.items) {
                data.items.slice(0, 5).forEach(item => {
                    const cleanTitle = item.title ? item.title.replace(/<[^>]*>/g, '').trim() : "";
                    const cleanDesc = item.description ? item.description.replace(/<[^>]*>/g, '').trim() : "";
                    const signature = `href="${item.link}"`;

                    if (!anciensHtml.includes(signature) && !nouveauxHtml.includes(signature)) {
                        // Structure type article encyclopédique (style Wikipédia pur)
                        nouveauxHtml += `
    <h2><span class="mw-headline">${cleanTitle}</span></h2>
    <p><b>Source (${source.nom}) - Publié le ${item.pubDate} :</b> ${cleanDesc} <a href="${item.link}" target="_blank">[Lire l'article complet]</a></p>`;
                    }
                });
            }
        } catch (e) {
            console.error(`Erreur sur ${source.nom}:`, e);
        }
    }

    const contenuTotal = nouveauxHtml + "\n" + anciensHtml;

    // Design minimaliste style Wikipédia pour que le scraper lise directement le texte brut
    const pageWiki = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${titrePage} - Wikipédia</title>
    <style>
        body { font-family: sans-serif; margin: 40px; line-height: 1.6; color: #202122; max-width: 800px; }
        h1 { border-bottom: 1px solid #a2a9b1; padding-bottom: 5px; font-size: 1.8em; }
        h2 { font-size: 1.3em; border-bottom: 1px solid #eaecf0; padding-bottom: 3px; margin-top: 30px; }
        p { margin-bottom: 15px; text-align: justify; }
        a { color: #0645ad; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div id="content">
        <h1>${titrePage}</h1>
        <div class="mw-parser-output">
${contenuTotal}
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(filePath, pageWiki);
    console.log(`Succès : ${filePath} généré au format Wikipédia !`);
}

async function lancerToutesLesMisesAJour() {
    await mettreAJourPage('journal.html', 'Journal d\'actualités', [
        { nom: "Le Monde", url: "https://www.lemonde.fr/rss/une.xml" },
        { nom: "24 Heures", url: "https://www.24hoursv.ca/rss" }
    ]);

    await mettreAJourPage('eco.html', 'Économie et Finances', [
        { nom: "Les Echos", url: "https://www.lesechos.fr/rss/rss_une.xml" }
    ]);

    await mettreAJourPage('culture.html', 'Culture et Société', [
        { nom: "France Culture", url: "https://www.radiofrance.fr/franceculture/rss" }
    ]);
}

lancerToutesLesMisesAJour();
