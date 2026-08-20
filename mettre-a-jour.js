const fs = require('fs');
const path = require('path');

function extraireAnciensArticles(filePath) {
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, 'utf8');
}

// Fonction fetch sécurisée avec timeout pour éviter les blocages de flux
async function fetchAvecTimeout(url, options = {}, timeout = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

async function mettreAJourPage(nomFichier, titrePage, sources) {
    const htmlPath = `Source/${nomFichier}`;
    const txtPath = `Source/${nomFichier.replace('.html', '.txt')}`;
    const dir = path.dirname(htmlPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let anciensTexte = extraireAnciensArticles(txtPath);
    let nouveauxTexte = "";

    for (let source of sources) {
        try {
            const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}`;
            const response = await fetchAvecTimeout(apiUrl);
            const data = await response.json();

            if (data && data.items) {
                data.items.slice(0, 5).forEach(item => {
                    const cleanTitle = item.title ? item.title.replace(/<[^>]*>/g, '').trim() : "";
                    const cleanDesc = item.description ? item.description.replace(/<[^>]*>/g, '').trim() : "";
                    const signature = item.link;

                    if (!anciensTexte.includes(signature) && !nouveauxTexte.includes(signature)) {
                        // Format texte brut ultra-lisible pour l'entraînement de modèles
                        nouveauxTexte += `\n----------------------------------------\n`;
                        nouveauxTexte += `SOURCE: ${source.nom}\n`;
                        nouveauxTexte += `DATE: ${item.pubDate}\n`;
                        nouveauxTexte += `TITRE: ${cleanTitle}\n`;
                        nouveauxTexte += `LIEN: ${item.link}\n`;
                        nouveauxTexte += `CONTENU: ${cleanDesc}\n`;
                    }
                });
            }
        } catch (e) {
            console.error(`Erreur ou délai dépassé sur ${source.nom}:`, e.message);
        }
    }

    const texteTotal = nouveauxTexte + "\n" + anciensTexte;

    // 1. Sauvegarde du fichier Texte Brut
    fs.writeFileSync(txtPath, texteTotal.trim());

    // 2. Transformation du texte en blocs HTML structurés
    let articlesHtmlBlock = "";
    const blocsArticles = texteTotal.split('----------------------------------------');
    
    blocsArticles.forEach(morceau => {
        if (morceau.trim()) {
            articlesHtmlBlock += `
            <div class="article" style="margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ccc;">
                <p>${morceau.trim().replace(/\n/g, '<br>')}</p>
            </div>`;
        }
    });

    // Échappement propre du HTML pour l'injection par script JavaScript
    const contenuSecurise = articlesHtmlBlock.replace(/`/g, '\\`').replace(/\$/g, '\\$');

    // 3. Sauvegarde du fichier HTML avec simulation dynamique pour l'iframe de Memoir.html
    const pageHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>${titrePage}</title>
    <style>
        body { font-family: sans-serif; margin: 40px; line-height: 1.6; color: #202122; max-width: 800px; }
        h1 { border-bottom: 1px solid #a2a9b1; padding-bottom: 5px; }
        .article { margin-bottom: 30px; border-bottom: 1px solid #eaecf0; padding-bottom: 20px; }
    </style>
</head>
<body>
    <h1>${titrePage}</h1>
    <div id="content">Chargement et fusion des sources...</div>

    <script>
        // Simule le délai et le rendu dynamique attendu par l'iframe de Memoir.html
        setTimeout(() => {
            document.getElementById('content').innerHTML = \`${contenuSecurise}\`;
        }, 600);
    </script>
</body>
</html>`;

    fs.writeFileSync(htmlPath, pageHtml);
    console.log(`Succès : ${htmlPath} et ${txtPath} mis à jour !`);
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
