/**
 * Expert : Logique & Synthèse
 * Spécialisé dans l'enchaînement logique, la structuration des étapes et la cohérence.
 */
export class ExpertLogique {
    constructor(id, nom, description, cat, wikiLang = 'fr', isRtl = false) {
        this.id = id;
        this.nom = nom;
        this.description = description;
        this.cat = cat;
        this.wikiLang = wikiLang;
        this.isRtl = isRtl;
        
        this.poids = {}; // Mémoire interne de pondération
        this.handle = null; // Fichier de mémoire local optionnel
        this.intervalErrance = null;
        this.dernierTexte = "";
    }

    // Errance autonome : s'alimente via une source publique externe (ex: concepts de logique formelle via Wikipédia/API open)
    async lancerApprentissage() {
        if (this.intervalErrance) return;

        // Source publique externe ciblée pour l'apprentissage du module
        const sourcesPubliques = [
            `https://${this.wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=logique%20formelle%20syllogisme&format=json&origin=*`,
            `https://${this.wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=methode%20scientifique%20structure&format=json&origin=*`
        ];

        this.intervalErrance = setInterval(async () => {
            try {
                const urlAlea = sourcesPubliques[Math.floor(Math.random() * sourcesPubliques.length)];
                const reponse = await fetch(urlAlea);
                const data = await reponse.json();
                
                if (data.query && data.query.search && data.query.search.length > 0) {
                    const article = data.query.search[Math.floor(Math.random() * data.query.search.length)];
                    const texteExtrait = (article.title + " " + article.snippet).replace(/<[^>]*>?/gm, '');
                    
                    // Apprentissage par pondération des mots clés logiques
                    const mots = texteExtrait.toLowerCase().split(/[\s,.;!?]+/);
                    mots.forEach(mot => {
                        if (mot.length > 3) {
                            this.poids[mot] = (this.poids[mot] || 0) + 1;
                        }
                    });
                }
            } catch (err) {
                // Errances silencieuses si pas de réseau
            }
        }, 12000); // Errance toutes les 12 secondes
    }

    arreterApprentissage() {
        if (this.intervalErrance) {
            clearInterval(this.intervalErrance);
            this.intervalErrance = null;
        }
    }

    // Synchronisation / Influence croisée avec les autres modules du Hub
    recevoirInfluence(moduleVoisinId, poidsPartages) {
        // Le module ajuste sa propre matrice en fonction des concepts forts partagés par un voisin
        for (let [mot, valeur] of Object.entries(poidsPartages)) {
            if (valeur > 2) {
                this.poids[mot] = (this.poids[mot] || 0) + Math.round(valeur * 0.2); // Intégration partielle de l'influence
            }
        }
    }

    async analyser(requête) {
        const motsReq = requête.toLowerCase().split(/\s+/);
        let scoreTotal = 0;
        let reflexions = [];

        motsReq.forEach(mot => {
            if (this.poids[mot]) {
                scoreTotal += this.poids[mot];
                reflexions.push(mot);
            }
        });

        // Restitution structurée orientée logique
        let texteReponse = `Analyse logique : Structuration des étapes requise. Cohérence validée sur les concepts de base.`;
        if (reflexions.length > 0) {
            texteReponse = `Enchaînement logique établi à partir des notions de [${reflexions.slice(0, 3).join(', ')}]. Les étapes s'articulent de manière séquentielle.`;
        }

        this.dernierTexte = texteReponse;
        return {
            score: scoreTotal + 5, // Score de base pertinent pour la structure
            reflexion: texteReponse,
            poidsPartage: this.poids // Données prêtes à être partagées pour synchroniser les autres modules
        };
    }

    async lierFichierMemoire(fileHandle) {
        this.handle = fileHandle;
        const file = await fileHandle.getFile();
        const contenu = await file.text();
        const mots = contenu.toLowerCase().split(/[\s,.;!?]+/);
        mots.forEach(mot => {
            if (mot.length > 2) {
                this.poids[mot] = (this.poids[mot] || 0) + 2;
            }
        });
    }

    mettreAJourPoids(mot, valeur) {
        this.poids[mot] = (this.poids[mot] || 0) + valeur;
    }
}
