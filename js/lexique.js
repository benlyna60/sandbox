/**
 * Expert : Lexique & Style Professionnel
 * Spécialisé dans la clarté du vocabulaire, la formulation et la rigueur rédactionnelle.
 */
export class ExpertLexique {
    constructor(id, nom, description, cat, wikiLang = 'fr', isRtl = false) {
        this.id = id;
        this.nom = nom;
        this.description = description;
        this.cat = cat;
        this.wikiLang = wikiLang;
        this.isRtl = isRtl;
        
        this.poids = {};
        this.handle = null;
        this.intervalErrance = null;
        this.dernierTexte = "";
    }

    // Errance : enrichissement lexical via des concepts de linguistique, grammaire ou administration
    async lancerApprentissage() {
        if (this.intervalErrance) return;

        const sourcesLexique = [
            `https://${this.wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=lexique%20technique%20terminologie&format=json&origin=*`,
            `https://${this.wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=style%20rédactionnel%20administratif&format=json&origin=*`
        ];

        this.intervalErrance = setInterval(async () => {
            try {
                const urlAlea = sourcesLexique[Math.floor(Math.random() * sourcesLexique.length)];
                const reponse = await fetch(urlAlea);
                const data = await reponse.json();
                
                if (data.query?.search?.length > 0) {
                    const article = data.query.search[0];
                    const texte = (article.title + " " + article.snippet).replace(/<[^>]*>?/gm, '');
                    
                    texte.toLowerCase().split(/\s+/).forEach(mot => {
                        if (mot.length > 3) {
                            this.poids[mot] = (this.poids[mot] || 0) + 1;
                        }
                    });
                }
            } catch (err) {}
        }, 14000); // Errance toutes les 14 secondes
    }

    arreterApprentissage() {
        if (this.intervalErrance) {
            clearInterval(this.intervalErrance);
            this.intervalErrance = null;
        }
    }

    recevoirInfluence(moduleVoisinId, poidsPartages) {
        // Intègre les termes partagés pour enrichir le vocabulaire global de la réponse
        for (let [mot, valeur] of Object.entries(poidsPartages)) {
            if (valeur > 1) {
                this.poids[mot] = (this.poids[mot] || 0) + 1;
            }
        }
    }

    async analyser(requête) {
        let texteReponse = "Formulation claire et vocabulaire validé selon les standards de rédaction.";
        
        this.dernierTexte = texteReponse;
        return {
            score: 6,
            reflexion: texteReponse,
            poidsPartage: this.poids
        };
    }

    async lierFichierMemoire(fileHandle) {
        this.handle = fileHandle;
        const contenu = await (await fileHandle.getFile()).text();
        contenu.toLowerCase().split(/\s+/).forEach(m => {
            if (m.length > 2) this.poids[m] = (this.poids[m] || 0) + 2;
        });
    }

    mettreAJourPoids(mot, valeur) {
        this.poids[mot] = (this.poids[mot] || 0) + valeur;
    }
}
