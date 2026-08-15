/**
 * Expert : Contrôle & Analyse Critique
 * Spécialisé dans la détection d'anomalies, la sécurité et la conformité.
 */
export class ExpertCritique {
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

    // Errance : recherche des normes, des vulnérabilités ou des critères de conformité
    async lancerApprentissage() {
        if (this.intervalErrance) return;

        const sourcesRisques = [
            `https://${this.wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=norme%20qualité%20ISO&format=json&origin=*`,
            `https://${this.wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=cybersécurité%20bonnes%20pratiques&format=json&origin=*`
        ];

        this.intervalErrance = setInterval(async () => {
            try {
                const urlAlea = sourcesRisques[Math.floor(Math.random() * sourcesRisques.length)];
                const reponse = await fetch(urlAlea);
                const data = await reponse.json();
                
                if (data.query?.search?.length > 0) {
                    const article = data.query.search[0];
                    const texte = (article.title + " " + article.snippet).replace(/<[^>]*>?/gm, '');
                    
                    // Apprentissage par détection de termes techniques de contrôle
                    texte.toLowerCase().split(/\s+/).forEach(mot => {
                        if (mot.length > 4) { // On cible les termes longs, souvent techniques
                            this.poids[mot] = (this.poids[mot] || 0) + 1;
                        }
                    });
                }
            } catch (err) {}
        }, 15000); // Errance toutes les 15 secondes
    }

    arreterApprentissage() {
        if (this.intervalErrance) {
            clearInterval(this.intervalErrance);
            this.intervalErrance = null;
        }
    }

    recevoirInfluence(moduleVoisinId, poidsPartages) {
        // Le critique devient plus sévère si les autres modules partagent des mots-clés liés au "déploiement" ou "flux"
        for (let [mot, valeur] of Object.entries(poidsPartages)) {
            if (mot.includes('flux') || mot.includes('deploy')) {
                this.poids[mot] = (this.poids[mot] || 0) + 2;
            }
        }
    }

    async analyser(requête) {
        // Analyse orientée "Validation et Risques"
        let texteReponse = "Analyse critique : Vérification des paramètres de conformité en cours.";
        
        // Simule une vérification si le texte est technique
        if (requête.length > 50) {
            texteReponse = "Contrôle qualité : Les normes de structure sont en cours de validation. Aucune faille critique détectée pour le moment.";
        }

        this.dernierTexte = texteReponse;
        return {
            score: 7, // Score élevé pour les questions de conformité
            reflexion: texteReponse,
            poidsPartage: this.poids
        };
    }

    async lierFichierMemoire(fileHandle) {
        this.handle = fileHandle;
        const contenu = await (await fileHandle.getFile()).text();
        contenu.toLowerCase().split(/\s+/).forEach(m => {
            if (m.length > 3) this.poids[m] = (this.poids[m] || 0) + 2;
        });
    }

    mettreAJourPoids(mot, valeur) {
        this.poids[mot] = (this.poids[mot] || 0) + valeur;
    }
}
