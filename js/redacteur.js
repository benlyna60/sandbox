/**
 * Module Expert - Rédacteur & Clarté (Mémoire + Recherche Wiktionnaire/Style + LocalStorage)
 */
export class ExpertRedacteur {
    constructor(id, nom, domaine, cat, wikiLang, isRtl) {
        this.id = id || 'redacteur';
        this.nom = nom || 'Rédacteur';                 
        this.domaine = domaine || 'Rédaction et Clarté';         
        this.cat = cat || 'Communication';
        this.wikiLang = wikiLang || 'fr';
        this.isRtl = isRtl || false;
        this.poids = {};                
        this.timerApprentissage = null; 
        this.enVeille = false;
        this.handle = null;             
        this.dernierTexte = "En attente de structuration...";

        // CHARGEMENT DU LOCALSTORAGE AVEC BLINDAGE ANTI-CORRUPTION STRICT
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
     * 1. RECHERCHE SUR LE WIKTIONNAIRE (Vocabulaire, tournures et style)
     */
    async rechercherDansSonDomaine(motsCles) {
        try {
            const requete = encodeURIComponent(motsCles.join(' '));
            // Utilisation de l'API Wiktionnaire pour chercher des définitions ou notions de style
            const url = `https://${this.wikiLang}.wiktionary.org/w/api.php?action=query&list=search&srsearch=${requete}&format=json&origin=*`;
            
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
            console.warn(`[${this.nom}] Recherche lexicale indisponible :`, err);
        }
        return null;
    }

    /**
     * 2. L'ANALYSE ET LA SYNTHÈSE RÉDACTIONNELLE
     */
    async analyser(texteUtilisateur) {
        const texteMin = texteUtilisateur.toLowerCase();
        const mots = texteMin.split(/[\s,.;!?]+/).filter(m => m.length > 2);

        // A. Apprentissage direct
        mots.forEach(mot => this.mettreAJourPoids(mot, 2));

        // B. Consultation de la mémoire
        let conceptsMemoire = [];
        let scoreMemoire = 0;
        mots.forEach(mot => {
            if (this.poids[mot]) {
                scoreMemoire += this.poids[mot];
                conceptsMemoire.push(`${mot}`);
            }
        });

        // C. Recherche externe (Lexique / Style)
        const rechercheDirecte = await this.rechercherDansSonDomaine(mots);

        // D. Formulation orientée clarté, structure et rédaction développée
        let reflexionFinale = "";

        if (texteMin.includes("plan") || texteMin.includes("organisation") || texteMin.includes("semaine") || texteMin.includes("alternance") || texteMin.includes("structur")) {
            reflexionFinale = `### 🌍 Analyse et Structuration : Plan d'action détaillé

Voici une architecture fluide et équilibrée conçue pour harmoniser vos tâches administratives, techniques et créatives avec clarté et efficacité.

**1. L'approche méthodologique globale :**
L'objectif est de cloisonner les temps forts pour éviter la dispersion cognitive. Travailler par blocs homogènes permet d'optimiser la concentration et d'assurer un suivi rigoureux des livrables sans rupture de charge.

**2. Déclinaison opérationnelle :**
* **Phase d'initialisation :** Consacrez les premiers moments de votre démarche à la mise en ordre des priorités, au tri des flux entrants et à la préparation des environnements de travail.
* **Phase d'immersion technique :** Isolez les séquences à forte complexité intellectuelle ou de développement pour y injecter un maximum d'énergie créative.
* **Phase de consolidation :** Réservez des créneaux dédiés aux bilans intermédiaires, au nettoyage des espaces numériques et à la validation des acquis.

**3. Points clés et exigences de clarté :**
*   **Domaine d'application :** ${this.cat}
*   **Concepts mobilisés :** ${conceptsMemoire.length > 0 ? conceptsMemoire.slice(0, 4).join(', ') : 'Optimisation, Fluidité, Structure'}
*   **Synthèse organique :** Traitement validé par le module ${this.nom}.`;
        } else if (rechercheDirecte) {
            reflexionFinale = `### 🌍 Analyse lexicale : ${rechercheDirecte.titre}

Sur le plan de la formulation et du style : ${rechercheDirecte.extrait.toLowerCase()}.

**Axes de développement rédactionnel :**
* Veillez à articuler chaque idée autour d'un noyau sémantique fort.
* Assurez la liaison logique entre les paragraphes pour garantir une lecture fluide et sans heurt.
* Éliminez les redondances superflues pour ne conserver que l'essence de l'information.`;
        } else {
            reflexionFinale = `### 🌍 Analyse de la structure rédactionnelle

Sur le plan de la structuration globale, il est recommandé de clarifier les objectifs, d'ordonner les concepts logiquement et d'instaurer des transitions fluides entre chaque argument.

**Lignes directrices pour la clarté :**
* Définir l'intention centrale dès l'introduction du propos.
* Hiérarchiser l'information du général vers le particulier à l'aide de puces épurées.
* Soigner la concision pour alléger la charge cognitive du lecteur.`;
        }

        if (conceptsMemoire.length > 0) {
            reflexionFinale += `\n\n> *Termes de style et pistes mémorielles mobilisés :* ${conceptsMemoire.slice(0, 4).join(', ')}.`;
        }

        this.dernierTexte = reflexionFinale;
        this.mettreAJourUI();

        const scoreTotal = (rechercheDirecte ? 15 : 0) + scoreMemoire + (conceptsMemoire.length * 2);

        return {
            expert: this.nom,
            domaine: this.cat,
            score: scoreTotal,
            reflexion: reflexionFinale,
            poidsPartage: this.poids
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
     * 4. GESTION DES FICHIERS ET SAUVEGARDE PHYSIQUE
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
            console.error("Erreur lors de la lecture de la mémoire du rédacteur :", err);
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
        const motsBase = ["syntaxe", "clarte", "structure", "vocabulaire", "fluidite", "expression"];
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
                outputEl.innerText = `✔ Mémoire active (${totalRacines} concepts de style enregistrés).`;
            }
        }
    }
}
