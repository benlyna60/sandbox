const fs = require('fs');
const path = require('path');

function extraireAnciensArticles(filePath) {
    if (!fs.existsSync(filePath)) return "";
    return fs.readFileSync(filePath, 'utf8');
}

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
            
            if (!response.ok) {
                console.log(`⚠️ Source ignorée (Erreur HTTP ${response.status}) : ${source.nom}`);
                continue;
            }

            const data = await response.json();

            // Sécurité : on vérifie que l'API a bien renvoyé du contenu valide et pas une erreur de l'API elle-même
            if (data && data.status === 'ok' && data.items) {
                data.items.forEach(item => {
                    const cleanTitle = item.title ? item.title.replace(/<[^>]*>/g, '').trim() : "";
                    const cleanDesc = item.description ? item.description.replace(/<[^>]*>/g, '').trim() : "";
                    const signature = item.link;

                    if (signature && !anciensTexte.includes(signature) && !nouveauxTexte.includes(signature)) {
                        nouveauxTexte += `\n----------------------------------------\n`;
                        nouveauxTexte += `CATEGORIE: ${source.categorie}\n`;
                        nouveauxTexte += `SOURCE: ${source.nom}\n`;
                        nouveauxTexte += `DATE: ${item.pubDate}\n`;
                        nouveauxTexte += `TITRE: ${cleanTitle}\n`;
                        nouveauxTexte += `LIEN: ${item.link}\n`;
                        nouveauxTexte += `CONTENU: ${cleanDesc}\n`;
                    }
                });
                console.log(`✅ Succès : ${source.nom}`);
            } else {
                console.log(`⚠️ Flux invalide ou rejeté par l'API pour : ${source.nom}`);
            }
        } catch (e) {
            // Si une source plante, le script l'affiche dans les logs mais CONTINUE avec les autres !
            console.log(`❌ Erreur sur ${source.nom}: ${e.message}`);
        }
    }

    const texteTotal = nouveauxTexte + "\n" + anciensTexte;

    // 1. Sauvegarde du fichier Texte Brut unifié
    fs.writeFileSync(txtPath, texteTotal.trim());

    // 2. Génération du fichier XML global
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
        <description>Base d'apprentissage massive et sécurisée</description>
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
    console.log(`🎉 Mise à jour terminée avec succès !`);
}

async function lancerToutesLesMisesAJour() {
    const toutesLesSources = [
        // --- ACTUALITÉS & MÉDIAS GÉNÉRAUX ---
        { nom: "Radio-Canada (Une)", categorie: "ACTUALITÉS", url: "https://ici.radio-canada.ca/abonnement/rss/config.code.asap" },
        { nom: "La Presse (Actualités)", categorie: "ACTUALITÉS", url: "https://www.lapresse.ca/rss/2" },
        { nom: "Le Devoir (Actualités)", categorie: "ACTUALITÉS", url: "https://www.ledevoir.com/rss/manchettes.xml" },
        { nom: "Le Monde (Une)", categorie: "ACTUALITÉS", url: "https://www.lemonde.fr/rss/une.xml" },
        { nom: "Le Figaro (Actualités)", categorie: "ACTUALITÉS", url: "https://www.lefigaro.fr/rss/figaro_actualites.xml" },
        { nom: "France Info (Fil info)", categorie: "ACTUALITÉS", url: "https://www.radiofrance.fr/franceinfo/rss" },
        { nom: "BFMTV (Info)", categorie: "ACTUALITÉS", url: "https://www.bfmtv.com/rss/info/flux-rss/flux-toutes-les-actualites/" },
        { nom: "24 Heures", categorie: "ACTUALITÉS", url: "https://www.24hoursv.ca/rss" },
        { nom: "Le Parisien", categorie: "ACTUALITÉS", url: "https://www.leparisien.fr/arc/outboundfeeds/rss/" },
        { nom: "20 Minutes", categorie: "ACTUALITÉS", url: "https://www.20minutes.fr/rss/une.xml" },
        { nom: "RFI (Actualités)", categorie: "ACTUALITÉS", url: "https://www.rfi.fr/fr/general/rss" },
        { nom: "Swissinfo (Suisse)", categorie: "ACTUALITÉS", url: "https://www.swissinfo.ch/fre/rss" },
        { nom: "La Libre (Belgique)", categorie: "ACTUALITÉS", url: "https://www.lalibre.be/arc/outboundfeeds/rss/" },
        { nom: "Le Soir (Belgique)", categorie: "ACTUALITÉS", url: "https://www.lesoir.be/arc/outboundfeeds/rss/" },

        // --- UNIVERSITÉ, RECHERCHE & ESSAIS ---
        { nom: "The Conversation France", categorie: "UNIVERSITÉ & RECHERCHE", url: "https://theconversation.com/fr/articles.atom" },
        { nom: "CNRS Le Journal", categorie: "UNIVERSITÉ & RECHERCHE", url: "https://lejournal.cnrs.fr/rss.xml" },
        { nom: "Phys.org", categorie: "UNIVERSITÉ & RECHERCHE", url: "https://phys.org/rss-feed/" },
        { nom: "Le Devoir (Idées)", categorie: "ESSAIS", url: "https://www.ledevoir.com/rss/idees.xml" },
        { nom: "Le Monde (Idées & Analyses)", categorie: "ESSAIS", url: "https://www.lemonde.fr/idees/rss_full.xml" },

        // --- ÉCONOMIE & FINANCE ---
        { nom: "Les Echos", categorie: "ÉCONOMIE", url: "https://www.lesechos.fr/rss/rss_une.xml" },
        { nom: "La Tribune", categorie: "ÉCONOMIE", url: "https://www.latribune.fr/rss/rubriques/economie.xml" },
        { nom: "Radio-Canada (Économie)", categorie: "ÉCONOMIE", url: "https://ici.radio-canada.ca/rss/41" },
        { nom: "La Presse (Affaires)", categorie: "ÉCONOMIE", url: "https://www.lapresse.ca/rss/3" },
        { nom: "Capital (France)", categorie: "ÉCONOMIE", url: "https://www.capital.fr/rss" },

        // --- TECH, WEB & IA ---
        { nom: "Le Blog du Modérateur", categorie: "TECH", url: "https://www.blogdumoderateur.com/feed/" },
        { nom: "Siècle Digital", categorie: "TECH", url: "https://siecledigital.fr/feed/" },
        { nom: "GitHub Blog", categorie: "TECH", url: "https://github.blog/feed/" },
        { nom: "Numerama", categorie: "TECH", url: "https://www.numerama.com/feed/" },
        { nom: "Journal du Geek", categorie: "TECH", url: "https://www.journaldugeek.com/feed/" },
        { nom: "Silicon.fr", categorie: "TECH", url: "https://www.silicon.fr/feed" },

        // --- SCIENCES & ESPACE ---
        { nom: "Futura Sciences", categorie: "SCIENCES", url: "https://www.futura-sciences.com/rss/actualites.xml" },
        { nom: "NASA Breaking News", categorie: "SCIENCES", url: "https://www.nasa.gov/rss/dyn/breaking_news.rss" },
        { nom: "ESA Space News", categorie: "SCIENCES", url: "https://www.esa.int/rssfeed/Our_Activities/Space_News" },
        { nom: "Pour la Science", categorie: "SCIENCES", url: "https://www.pourlascience.fr/rss/actualites.xml" },

        // --- CULTURE, ART & SOCIÉTÉ ---
        { nom: "France Culture", categorie: "CULTURE & ART", url: "https://www.radiofrance.fr/franceculture/rss" },
        { nom: "Radio-Canada (Culture)", categorie: "CULTURE & ART", url: "https://ici.radio-canada.ca/rss/67" },
        { nom: "La Presse (Arts)", categorie: "CULTURE & ART", url: "https://www.lapresse.ca/rss/6" },
        { nom: "BeauxArts Magazine", categorie: "CULTURE & ART", url: "https://www.beauxarts.com/feed/" }
    ];

    await mettreAJourPageMultiCategories('journal.html', 'Base d\'Apprentissage Massive et Globale', toutesLesSources);
}

lancerToutesLesMisesAJour();
