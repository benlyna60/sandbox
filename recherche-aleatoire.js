const fs = require('fs');
const path = require('path');

// Liste de plus de 100 sujets ultra-variés (de la politique au sport, pop culture, science, etc.)
const sujetsAleatoires = [
    // Actualités & Politique
    "actualite politique internationale", "elections et gouvernance", "diplomatie mondiale", "economie globale", "tendances societales",
    // Sport
    "football actualite", "resultats basketball", "actualite formule 1", "jeux olympiques", "tennis grand chelem", 
    "cyclisme tour de france", "arts martiaux mixtes mma", "hockey sur glace lnh", "rugby actualite", "sports extremes",
    // Espace & Science
    "exploration spatiale", "telescope james webb", "astronomie decouvertes", "physique quantique", "biologie evolution",
    "neurosciences cerveau", "energies renouvelables", "fusion nucleaire", "changement climatique", "archeologie decouvertes",
    // Technologie & IA
    "intelligence artificielle derniere actualite", "cybersécurité alertes", "innovation technologique", "gadgets high tech",
    "programmation informatique tendances", "blockchain et crypto", "realite virtuelle et augmentee", "voiture electrique autonome",
    // Culture, Arts & Divertissement
    "cinema actualite films", "musique pop rock electronique", "series tv tendances", "litterature livres prix", "art contemporain",
    "jeux video actualite", "architecture design", "photographie artistique", "culture pop et internet", "festival de musique",
    // Mode, Style de vie & Bien-être
    "tendances mode fashion", "gastronomie et recettes", "nutrition et sante", "fitness et entrainement physique", "meditation et bien-etre",
    "voyage et tourisme insolite", "architecture dinterieur", "jardinage et plantes", "developpement personnel", "minimalisme mode de vie",
    // Histoire, Philosophie & Société
    "histoire ancienne et mysteres", "philosophie moderne", "psychologie humaine", "sociologie des reseaux", "faits historiques insolites",
    "grandes inventions de l'histoire", "mythologie ancienne", "anthropologie culturelle", "sciences sociales", "education et pedagogie",
    // Environnement & Nature
    "animaux et faune sauvage", "conservation de la nature", "oceans et vie marine", "meteorologie phenomenes rares", "geologie volcans seismes",
    "forets du monde", "biodiversite en danger", "energies du futur", "ecologie urbaine", "agriculture durable",
    // Insolite & Curiosités
    "decouvertes insolites", "records du monde", "mysteres non resolus", "technologies du futur lointain", "futurisme et societe",
    "innovations farfelues", "sciences et nature bizarres", "enigmes historiques", "exploration des grands fonds marins", "objets volants non identifies"
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
    // Choisir un sujet au hasard parmi la grande liste
    const sujetChoisi = sujetsAleatoires[Math.floor(Math.random() * sujetsAleatoires.length)];
    console.log(`🎲 Sujet universel sélectionné : "${sujetChoisi}"`);

    const xmlPath = path.join('Source', 'recherche.xml');
    const txtPath = path.join('Source', 'recherche.txt');
    const dir = path.dirname(xmlPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    let anciensTexte = fs.existsSync(txtPath) ? fs.readFileSync(txtPath, 'utf8') : "";
    let nouveauxTexte = "";

    try {
        const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(sujetChoisi)}&format=json&no_html=1&skip_disambig=1`;
        const response = await fetchAvecTimeout(searchUrl);

        if (!response.ok) {
            console.log(`⚠️ Erreur HTTP lors de la recherche.`);
            return;
        }

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

        if (resultats.length > 0) {
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
            console.log(`✅ ${resultats.length} éléments récupérés pour "${sujetChoisi}"`);
        } else {
            console.log(`⚠️ Aucun résultat direct pour cette requête, on retentera au prochain cycle.`);
            return;
        }

    } catch (e) {
        console.log(`❌ Erreur pendant la recherche live : ${e.message}`);
        return;
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
    console.log(`🎉 Fichier recherche.xml diversifié mis à jour !`);
}

lancerRechercheAleatoire();
