const fs = require('fs');
const path = require('path');

const sujetsAleatoires = [
    "actualite politique internationale", "exploration spatiale", "telescope james webb",
    "intelligence artificielle derniere actualite", "cinema actualite films", "musique pop rock",
    "football actualite", "actualite formule 1", "physique quantique", "technologie innovation"
];

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

async function lancerRechercheAleatoire() {
    const xmlPath = path.join('Source', 'recherche.xml');
    const txtPath = path.join('Source', 'recherche.txt');
    const dir = path.dirname(xmlPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let anciensTexte = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, 'utf8') : "";
    let nouveauxTexte = "";

    const sujetChoisi = sujetsAleatoires[Math.floor(Math.random() * sujetsAleatoires.length)];
    console.log(`🎲 Sujet sélectionné : "${sujetChoisi}"`);

    try {
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(sujetChoisi)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetchAvecTimeout(searchUrl);

        if (response.ok) {
            const data = await response.json();
            let resultats = [];

            if (data.RelatedTopics && data.RelatedTopics.length > 0) {
                data.RelatedTopics.forEach(topic => {
                    if (topic.Text && topic.FirstURL) {
                        resultats.push({
                            titre: topic.Text.split(' - ')[0] || sujetChoisi,
                            lien: topic.FirstURL,
                            contenu: topic.Text,
                            date: new Date().toUTCString()
                        });
                    }
                });
            }

            if (resultats.length === 0 && data.AbstractText) {
                resultats.push({
                    titre: data.Heading || sujetChoisi,
                    lien: data.AbstractURL || "https://duckduckgo.com",
                    contenu: data.AbstractText,
                    date: new Date().toUTCString()
                });
            }

            // S'il n'y a vraiment rien, on crée un résultat de secours garanti
            if (resultats.length === 0) {
                resultats.push({
                    titre: `Actualités et recherches sur : ${sujetChoisi}`,
                    lien: `https://duckduckgo.com/?q=${encodeURIComponent(sujetChoisi)}`,
                    contenu: `Point d'information actualisé concernant le sujet : ${sujetChoisi}.`,
                    date: new Date().toUTCString()
                });
            }

            resultats.forEach(item => {
                const signature = item.lien;
                if (signature && !anciensTexte.includes(signature) && !nouveauxTexte.includes(signature)) {
                    nouveauxTexte += `\n----------------------------------------\n`;
                    nouveauxTexte += `CATEGORIE: TOUT-TERRAIN (${sujetChoisi})\n`;
                    nouveauxTexte += `SOURCE: DuckDuckGo Live\n`;
                    nouveauxTexte += `DATE: ${item.date}\n`;
                    nouveauxTexte += `TITRE: ${item.titre}\n`;
                    nouveauxTexte += `LIEN: ${item.lien}\n`;
                    nouveauxTexte += `CONTENU: ${item.contenu}\n`;
                }
            });
            console.log(`✅ Traitement réussi pour "${sujetChoisi}"`);
        }
    } catch (e) {
        console.log(`⚠️ Mode secours activé suite à une erreur réseau : ${e.message}`);
        nouveauxTexte += `\n----------------------------------------\n`;
        nouveauxTexte += `CATEGORIE: SECOURS\n`;
        nouveauxTexte += `SOURCE: Système Local\n`;
        nouveauxTexte += `DATE: ${new Date().toUTCString()}\n`;
        nouveauxTexte += `TITRE: Veille automatique - ${sujetChoisi}\n`;
        nouveauxTexte += `LIEN: https://duckduckgo.com\n`;
        nouveauxTexte += `CONTENU: Génération automatique de veille pour ${sujetChoisi}.\n`;
    }

    const texteTotal = nouveauxTexte + "\n" + anciensTexte;
    fs.writeFileSync(txtPath, texteTotal.trim());

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
        <title>Base de Connaissance Universelle Aléatoire</title>
        <link>https://benlyna60.github.io/sandbox/</link>
        <description>Exploration aleatoire multi-domaines en temps reel</description>
        ${xmlItems}
    </channel>
</rss>`;

    fs.writeFileSync(xmlPath, fluxRssXml.trim());
    console.log(`🎉 Fichier recherche.xml généré et sauvegardé avec succès !`);
}

lancerRechercheAleatoire();
