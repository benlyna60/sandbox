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

async function mettreAJourPageMultiCategories(nomFichier, titrePage, sources) {
    const htmlPath = `Source/${nomFichier}`;
    const txtPath = `Source/${nomFichier.replace('.html', '.txt')}`;
    const xmlPath = `Source/${nomFichier.replace('.html', '.xml')}`;
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
                data.items.forEach(item => {
                    const cleanTitle = item.title ? item.title.replace(/<[^>]*>/g, '').trim() : "";
                    const cleanDesc = item.description ? item.description.replace(/<[^>]*>/g, '').trim() : "";
                    const signature = item.link;

                    if (!anciensTexte.includes(signature) && !nouveauxTexte.includes(signature)) {
                        // Format texte structuré avec la CATÉGORIE pour l'apprentissage du modèle
                        nouveauxTexte += `\n----------------------------------------\n`;
                        nouveauxTexte += `CATEGORIE: ${source.categorie}\n`;
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

    // 1. Sauvegarde du fichier Texte Brut unifié, catégorisé et cumulé
    fs.writeFileSync(txtPath, texteTotal.trim());

    // 2. Génération du fichier XML global avec les catégories
    let xmlItems = ``;
    const blocsArticles = texteTotal.split('----------------------------------------');
    blocsArticles.forEach(morceau => {
        if (morceau.trim()) {
            const lignesBloc = morceau.trim().split('\n');
            let itemData = { categorie: '', source: '', date: '', titre: '', lien: '', contenu: '' };
            lignesBloc.forEach(ligne => {
                if (ligne.startsWith('CATEGORIE:')) itemData.categorie = ligne.replace('CATEGORIE:', '').trim();
                if (ligne.startsWith('SOURCE:')) itemData.source = ligne.replace('SOURCE:', '').trim();
                if (ligne.startsWith('DATE:')) itemData.date = ligne.replace('DATE:', '').trim();
                if (ligne.startsWith('TITRE:')) itemData.titre = ligne.replace('TITRE:', '').trim();
                if (ligne.startsWith('LIEN:')) itemData.lien = ligne.replace('LIEN:', '').trim();
                if (ligne.startsWith('CONTENU:')) itemData.contenu = ligne.replace('CONTENU:', '').trim();
            });

            if (itemData.titre && itemData.lien) {
                xmlItems += `
        <item>
            <title><![CDATA[${itemData.titre}]]></title>
            <link>${itemData.lien}</link>
            <pubDate>${itemData.date}</pubDate>
            <category>${itemData.categorie}</category>
            <description><![CDATA[${itemData.contenu}]]></description>
            <source>${itemData.source}</source>
        </item>`;
            }
        }
    });

    const fluxRssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
        <title>${titrePage}</title>
        <link>https://benlyna60.github.io/sandbox/</link>
        <description>Base d'apprentissage unifiée et catégorisée pour ${titrePage}</description>
        ${xmlItems}
    </channel>
</rss>`;

    fs.writeFileSync(xmlPath, fluxRssXml.trim());

    // 3. Transformation en blocs HTML
    let articlesHtmlBlock = "";
    blocsArticles.forEach(morceau => {
        if (morceau.trim()) {
            articlesHtmlBlock += `
            <div class="article" style="margin-bottom: 20px; padding: 10px; border-bottom: 1px solid #ccc;">
                <p>${morceau.trim().replace(/\n/g, '<br>')}</p>
            </div>`;
        }
    });

    const contenuSecurise = articlesHtmlBlock.replace(/`/g, '\\`').replace(/\$/g, '\\$');

    // 4. Sauvegarde du fichier HTML
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
    <div id="content">Chargement de la base d'apprentissage...</div>

    <script>
        setTimeout(() => {
            document.getElementById('content').innerHTML = \`${contenuSecurise}\`;
        }, 600);
    </script>
</body>
</html>`;

    fs.writeFileSync(htmlPath, pageHtml);
    console.log(`Succès : ${htmlPath}, ${txtPath} et ${xmlPath} mis à jour avec accumulation et catégories !`);
}

async function lancerToutesLesMisesAJour() {
    // Liste complète et unifiée de toutes tes sources sérieuses classées par catégorie
    const toutesLesSources = [
        // --- ACTUALITÉS ---
        { nom: "Radio-Canada", categorie: "ACTUALITÉS", url: "https://ici.radio-canada.ca/abonnement/rss/config.code.asap" },
        { nom: "Le Monde", categorie: "ACTUALITÉS", url: "https://www.lemonde.fr/rss/une.xml" },
        { nom: "24 Heures", categorie: "ACTUALITÉS", url: "https://www.24hoursv.ca/rss" },
        
        // --- ÉCONOMIE ---
        { nom: "Les Echos", categorie: "ÉCONOMIE", url: "https://www.lesechos.fr/rss/rss_une.xml" },
        { nom: "La Tribune", categorie: "ÉCONOMIE", url: "https://www.latribune.fr/rss/rubriques/economie.xml" },
        
        // --- TECH ---
        { nom: "Le Blog du Modérateur", categorie: "TECH", url: "https://www.blogdumoderateur.com/feed/" },
        { nom: "Siècle Digital", categorie: "TECH", url: "https://siecledigital.fr/feed/" },
        { nom: "GitHub Blog", categorie: "TECH", url: "https://github.blog/feed/" },
        
        // --- SCIENCES ---
        { nom: "Futura Sciences", categorie: "SCIENCES", url: "https://www.futura-sciences.com/rss/actualites.xml" },
        
        // --- CULTURE ---
        { nom: "France Culture", categorie: "CULTURE", url: "https://www.radiofrance.fr/franceculture/rss" }
    ];

    await mettreAJourPageMultiCategories('journal.html', 'Journal Unifié - Base d\'Apprentissage', toutesLesSources);
}

lancerToutesLesMisesAJour();
