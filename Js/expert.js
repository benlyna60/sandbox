/**
 * Module Expert - Unité d'apprentissage autonome (Mémoire + Recherche + Apprentissage Social & Questions)
 */
export class Expert {
    constructor(id, nom, domaine, cat, wikiLang, isRtl) {
        this.id = id;
        this.nom = nom;                 
        this.domaine = domaine || cat; 
        this.cat = cat;
        this.wikiLang = wikiLang || 'fr';
        this.isRtl = isRtl || false;
        this.poids = {};                
        this.timerApprentissage = null; 
        this.enVeille = false;
        this.handle = null;             
        this.dernierTexte = "En attente...";

        // CHARGEMENT DU LOCALSTORAGE AVEC BLINDAGE STRICT
        try {
            const memoireSauvee = localStorage.getItem(`expert_memoire_${this.id}`);
            if (memoireSauvee) {
                const parsed = JSON.parse(memoireSauvee);
                this.poids = {};
                for (let k in parsed) {
                    if (typeof parsed[k] === 'number' && !isNaN(parsed[k])) {
                        this.poids[k] = parsed[k];
                    }
                }
            }
        } catch (err) {
            console.warn(`[${this.nom}] Impossible de charger le localStorage :`, err);
            this.poids = {};
        }
    }

    /**
     * 1. RECHERCHE DIRECTE EN TEMPS RÉEL SUR LE DOMAINE (Wikipédia)
     */
    async rechercherDansSonDomaine(motsCles) {
        try {
            const requete = encodeURIComponent(motsCles.join(' '));
            const url = `https://${this.wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${requete}&format=json&origin=*`;
            
            const reponse = await fetch(url);
            const data = await reponse.json();

            if (data.query && data.query.search && data.query.search.length > 0) {
                const meilleurResultat = data.query.search[0];
                const extraitPropre = meilleurResultat.snippet.replace(/<[^>]*>?/gm, ''); 
                return {
                    titre: meilleurResultat.title,
                    extrait: extraitPropre
                };
            }
        } catch (err) {
            console.warn(`[${this.nom}] Recherche directe indisponible :`, err);
        }
        return null;
    }

    /**
     * 2. APPRENTISSAGE SOCIAL : Intègre les poids partagés par un autre module voisin
     */
    recevoirInfluence(moduleVoisinId, poidsPartages) {
        for (let [mot, valeur] of Object.entries(poidsPartages)) {
            if (typeof valeur === 'number' && !isNaN(valeur) && mot.length > 3) {
                // Le module intègre une partie de la connaissance de son voisin dans sa propre mémoire
                this.mettreAJourPoids(mot, Math.max(1, Math.round(valeur * 0.3)));
            }
        }
    }

    /**
     * 3. L'ANALYSE ORGANIQUE (Apprend de la question + Mémoire + Recherche)
     */
    async analyser(texteUtilisateur) {
        const mots = texteUtilisateur.toLowerCase().split(/[\s,.;!?]+/).filter(m => m.length > 2);
        
        // A. APPRENTISSAGE ACTIF : Le module apprend directement de chaque question de l'utilisateur
        mots.forEach(mot => this.mettreAJourPoids(mot, 3)); // Fort impact pour ce qu'écrit l'utilisateur

        // B. Consultation de sa mémoire accumulée
        let conceptsMemoire = [];
        let scoreMemoire = 0;
        mots.forEach(mot => {
            if (this.poids[mot]) {
                scoreMemoire += this.poids[mot];
                conceptsMemoire.push(mot);
            }
        });

        // C. Recherche directe en temps réel
        const rechercheDirecte = await this.rechercherDansSonDomaine(mots);

        // D. SYNTHÈSE ORGANIQUE (Fini les templates figés, le texte se construit selon ce qu'il sait)
        let reflexionFinale = "";
        
        if (rechercheDirecte) {
            reflexionFinale = `Analyse du domaine de ${this.nom} : En lien avec ${rechercheDirecte.titre}, ${rechercheDirecte.extrait.toLowerCase()}.`;
        } else if (conceptsMemoire.length > 0) {
            reflexionFinale = `Expertise ${this.nom} : Structuration validée autour des notions de [${conceptsMemoire.slice(0, 3).join(', ')}].`;
        } else {
            reflexionFinale = `Module ${this.nom} (${this.domaine}) : Intégration des flux et traitement des paramètres de la requête en cours.`;
        }

        // Ajout des concepts forts tirés de sa mémoire interne
        if (conceptsMemoire.length > 0) {
            reflexionFinale += ` (Pistes mémorielles mobilisées : ${conceptsMemoire.slice(0, 4).join(', ')}).`;
        }

        this.dernierTexte = reflexionFinale;
        this.mettreAJourUI();

        const scoreTotal = (rechercheDirecte ? 15 : 0) + scoreMemoire + (conceptsMemoire.length * 2);

        return {
            expert: this.nom,
            domaine: this.cat,
            score: scoreTotal,
            reflexion: reflexionFinale,
            poidsPartage: this.poids // Prêt à être partagé avec les autres modules via le Hub
        };
    }

    /**
     * 4. APPRENTISSAGE EN ARRIÈRE-PLAN (Mode Errance)
     */
    lancerApprentissage() {
        if (this.enVeille) return;
        this.enVeille = true;
        
        const dot = document.getElementById(`dot-${this.id}`);
        if (dot) dot.className = "status-dot active";

        this.timerApprentissage = setInterval(() => {
            let concept = this.genererConceptDomaine();
            this.mettreAJourPoids(concept, 1);
            this.mettreAJourUI();
        }, 6000);
    }

    arreterApprentissage() {
        if (!this.enVeille) return;
        this.enVeille = false;
        clearInterval(this.timerApprentissage);
        
        const dot = document.getElementById(`dot-${this.id}`);
        if (dot) dot.className = "status-dot paused";
    }

    /**
     * 5. GESTION DES FICHIERS ET SAUVEGARDE
     */
    async lierFichierMemoire(fileHandle) {
        try {
            this.handle = fileHandle;
            const file = await fileHandle.getFile();
            const text = await file.text();
            if (text) {
                const json = JSON.parse(text);
                const memoireFichier = json.memoire_paires || json.poids || {};
                
                for (let [k, v] of Object.entries(memoireFichier)) {
                    if (typeof v === 'number' && !isNaN(v)) {
                        this.poids[k] = (this.poids[k] || 0) + v;
                    }
                }
                
                localStorage.setItem(`expert_memoire_${this.id}`, JSON.stringify(this.poids));
                this.mettreAJourUI();
            }
            
            const btn = document.getElementById(`btn-file-${this.id}`);
            if (btn) btn.innerText = "✔ Lié";
            const dot = document.getElementById(`dot-${this.id}`);
            if (dot) dot.className = "status-dot ready";
        } catch (err) {
            console.error("Erreur lors de la lecture de la mémoire :", err);
        }
    }

    mettreAJourPoids(cle, valeur) {
        if (typeof this.poids[cle] !== 'number' || isNaN(this.poids[cle])) {
            this.poids[cle] = 0;
        }
        this.poids[cle] += valeur;

        try {
            localStorage.setItem(`expert_memoire_${this.id}`, JSON.stringify(this.poids));
        } catch (err) {
            console.error("Erreur d'écriture localStorage :", err);
        }

        this.sauvegarderFichierJSON();
    }

    async sauvegarderFichierJSON() {
        if (!this.handle) return;
        try {
            const writable = await this.handle.createWritable();
            await writable.write(JSON.stringify({
                nom: this.nom,
                domaine: this.domaine,
                categorie: this.cat,
                memoire_paires: this.poids
            }, null, 2));
            await writable.close();
        } catch (err) {
            console.error("Erreur d'écriture JSON physique :", err);
        }
    }

    genererConceptDomaine() {
        const motsBase = [this.domaine.toLowerCase(), "analyse", "structure", "donnee", "logique", "optimisation"];
        return motsBase[Math.floor(Math.random() * motsBase.length)];
    }

    mettreAJourUI() {
        let totalConnexions = 0;
        const poidsPropre = {};
        
        for (let [cle, val] of Object.entries(this.poids)) {
            if (typeof val === 'number' && !isNaN(val)) {
                poidsPropre[cle] = val;
                totalConnexions += val;
            }
        }
        this.poids = poidsPropre;

        const totalRacines = Object.keys(this.poids).length;

        const badge = document.getElementById(`badge-${this.id}`);
        if (badge) badge.innerText = `${totalRacines} racines`;

        const metricTxt = document.getElementById(`metric-txt-${this.id}`);
        if (metricTxt) metricTxt.innerText = totalConnexions;

        const densite = document.getElementById(`densite-${this.id}`);
        if (densite) densite.innerText = totalRacines > 0 ? (totalConnexions / totalRacines).toFixed(1) : 0;

        const entropie = document.getElementById(`entropie-${this.id}`);
        if (entropie) entropie.innerText = `${Math.min(totalRacines * 2, 100)}%`;

        const outputEl = document.getElementById(`out-${this.id}`);
        if (outputEl) {
            if (this.dernierTexte && typeof this.dernierTexte === 'string' && !this.dernierTexte.includes("[object Object]")) {
                outputEl.innerText = this.dernierTexte;
            } else {
                outputEl.innerText = `✔ Mémoire active (${totalRacines} concepts enregistrés).`;
            }
        }
    }
}
