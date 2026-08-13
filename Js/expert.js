/**
 * Module Expert - Unité d'apprentissage autonome (Mémoire + Recherche temps réel + LocalStorage)
 */
export class Expert {
    constructor(id, nom, domaine, cat, wikiLang, isRtl) {
        this.id = id;
        this.nom = nom;                 
        this.domaine = domaine;         
        this.cat = cat;
        this.wikiLang = wikiLang || 'fr';
        this.isRtl = isRtl || false;
        this.poids = {};                
        this.timerApprentissage = null; 
        this.enVeille = false;
        this.handle = null;             
        this.dernierTexte = "En attente...";

        // CHARGEMENT AUTOMATIQUE DU LOCALSTORAGE (Persistance malgré le F5 sur Windows)
        try {
            const memoireSauvee = localStorage.getItem(`expert_memoire_${this.id}`);
            if (memoireSauvee) {
                this.poids = JSON.parse(memoireSauvee);
            }
        } catch (err) {
            console.warn(`[${this.nom}] Impossible de charger le localStorage :`, err);
        }
    }

    /**
     * 1. RECHERCHE DIRECTE EN TEMPS RÉEL SUR LE DOMAINE (ex: Wikipédia / Sources)
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
     * 2. L'ANALYSE COMBINÉE (Mémoire Acquise + Recherche Directe)
     */
    async analyser(texteUtilisateur) {
        const mots = texteUtilisateur.toLowerCase().split(/[\s,.;!?]+/).filter(m => m.length > 2);

        // A. Ingestion et apprentissage direct dans sa mémoire
        mots.forEach(mot => this.mettreAJourPoids(mot, 2));

        // B. Consultation de la mémoire accumulée (Poids)
        let conceptsMemoire = [];
        let scoreMemoire = 0;
        mots.forEach(mot => {
            if (this.poids[mot]) {
                scoreMemoire += this.poids[mot];
                conceptsMemoire.push(`${mot}`);
            }
        });

        // C. Recherche directe en temps réel dans son domaine
        const rechercheDirecte = await this.rechercherDansSonDomaine(mots);

        // D. Synthèse : Fusion de la recherche en temps réel et de la mémoire
        let reflexionFinale = "";

        if (rechercheDirecte) {
            reflexionFinale = `📌 **${rechercheDirecte.titre}** : ${rechercheDirecte.extrait}...`;
        } else {
            reflexionFinale = `Analyse basée sur les matrices fondamentales de ${this.domaine}.`;
        }

        if (conceptsMemoire.length > 0) {
            reflexionFinale += `\n*(Ancrage mémoire interne : ${conceptsMemoire.slice(0, 3).join(', ')})*`;
        }

        this.dernierTexte = reflexionFinale;
        this.mettreAJourUI();

        const scoreTotal = (rechercheDirecte ? 15 : 0) + scoreMemoire;

        return {
            expert: this.nom,
            domaine: this.cat,
            score: scoreTotal,
            reflexion: reflexionFinale
        };
    }

    /**
     * 3. APPRENTISSAGE EN ARRIÈRE-PLAN (Mode Errance)
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
        }, 5000);
    }

    arreterApprentissage() {
        if (!this.enVeille) return;
        this.enVeille = false;
        clearInterval(this.timerApprentissage);
        
        const dot = document.getElementById(`dot-${this.id}`);
        if (dot) dot.className = "status-dot paused";
    }

    /**
     * 4. GESTION DES FICHIERS ET SAUVEGARDE (Local + Fichier Physique)
     */
    async lierFichierMemoire(fileHandle) {
        try {
            this.handle = fileHandle;
            const file = await fileHandle.getFile();
            const text = await file.text();
            if (text) {
                const json = JSON.parse(text);
                const memoireFichier = json.memoire_paires || json.poids || {};
                
                // Fusion de la mémoire du fichier avec celle déjà en cache dans le navigateur
                this.poids = { ...this.poids, ...memoireFichier };
                
                // Sauvegarde de la fusion dans le LocalStorage
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
        if (!this.poids[cle]) this.poids[cle] = 0;
        this.poids[cle] += valeur;

        // 1. Sauvegarde instantanée dans le LocalStorage du navigateur (Résiste au F5)
        try {
            localStorage.setItem(`expert_memoire_${this.id}`, JSON.stringify(this.poids));
        } catch (err) {
            console.error("Erreur d'écriture localStorage :", err);
        }

        // 2. Sauvegarde automatique dans le fichier physique (si un fichier a été lié)
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
        const motsBase = [this.domaine.toLowerCase(), "analyse", "structure", "donnee", "logique"];
        return motsBase[Math.floor(Math.random() * motsBase.length)];
    }

    mettreAJourUI() {
        const totalRacines = Object.keys(this.poids).length;
        let totalConnexions = Object.values(this.poids).reduce((a, b) => a + b, 0);

        const badge = document.getElementById(`badge-${this.id}`);
        if (badge) badge.innerText = `${totalRacines} racines`;

        const metricTxt = document.getElementById(`metric-txt-${this.id}`);
        if (metricTxt) metricTxt.innerText = totalConnexions;

        const densite = document.getElementById(`densite-${this.id}`);
        if (densite) densite.innerText = totalRacines > 0 ? (totalConnexions / totalRacines).toFixed(1) : 0;

        const entropie = document.getElementById(`entropie-${this.id}`);
        if (entropie) entropie.innerText = `${Math.min(totalRacines * 2, 100)}%`;

        // CORRECTION : Affichage propre de la zone texte de la carte sans objets bruts
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
