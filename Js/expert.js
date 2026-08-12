/**
 * Module Expert - Unité d'apprentissage autonome et décentralisée
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
        this.handle = null;             // Handle pour l'API File System Access
        this.dernierTexte = "En attente...";
        this.chart = null;
    }

    /**
     * 1. LE MODE VEILLE (Apprentissage aléatoire autonome)
     */
    lancerApprentissage() {
        if (this.enVeille) return;
        this.enVeille = true;
        
        const dot = document.getElementById(`dot-${this.id}`);
        if (dot) dot.className = "status-dot active";

        this.timerApprentissage = setInterval(() => {
            let conceptAleatoire = this.genererConceptAleatoire();
            this.mettreAJourPoids(conceptAleatoire, 1);
            this.mettreAJourUI();
        }, 4000);
    }

    /**
     * 2. ARRÊT DE L'APPRENTISSAGE
     */
    arreterApprentissage() {
        if (!this.enVeille) return;
        this.enVeille = false;
        clearInterval(this.timerApprentissage);
        
        const dot = document.getElementById(`dot-${this.id}`);
        if (dot) dot.className = "status-dot paused";
    }

    /**
     * 3. L'ANALYSE DE LA REQUÊTE
     */
    analyser(texteUtilisateur) {
        let mots = texteUtilisateur.toLowerCase().split(/\s+/);
        let scorePertinence = 0;
        let associationTrouvee = "";

        mots.forEach(mot => {
            if (this.poids[mot]) {
                scorePertinence += this.poids[mot];
                associationTrouvee = mot;
            }
        });

        return {
            expert: this.nom,
            domaine: this.domaine,
            score: scorePertinence,
            reflexion: scorePertinence > 0 
                ? `Connexion trouvée dans mon domaine via le concept '${associationTrouvee}'.` 
                : `Exploration neutre de la requête selon les matrices de ${this.domaine}.`
        };
    }

    /**
     * Génère un texte de simulation pour le zoom / génération
     */
    genererTexte() {
        const concepts = Object.keys(this.poids);
        if (concepts.length === 0) {
            this.dernierTexte = `[${this.nom}] Aucune donnée en mémoire. Lancez l'apprentissage ou liez un fichier JSON.`;
        } else {
            let sample = concepts[Math.floor(Math.random() * concepts.length)];
            this.dernierTexte = `[${this.nom}] Analyse active sur le vecteur central : "${sample}" (Poids cumulé : ${this.poids[sample]}).`;
        }
        
        const out = document.getElementById(`out-${this.id}`);
        if (out) out.textContent = this.dernierTexte;
    }

    /**
     * 4. LIAISON FICHIER LOCAL (File System Access API)
     */
    async lierFichier() {
        try {
            // Si le dossier global n'a pas été choisi, on permet de lier un fichier unique
            const [fileHandle] = await window.showOpenFilePicker({
                types: [{ description: 'Fichiers JSON', accept: { 'application/json': ['.json'] } }]
            });
            this.handle = fileHandle;
            const file = await fileHandle.getFile();
            const text = await file.text();
            if (text) {
                const json = JSON.parse(text);
                this.poids = json.memoire_paires || json.poids || {};
                this.mettreAJourUI();
            }
            
            const btn = document.getElementById(`btn-file-${this.id}`);
            if (btn) btn.innerText = "✔ Lié";
            const dot = document.getElementById(`dot-${this.id}`);
            if (dot) dot.className = "status-dot ready";
        } catch (err) {
            console.log("Liaison fichier annulée", err);
        }
    }

    // --- Fonctions utilitaires internes ---
    mettreAJourPoids(cle, valeur) {
        if (!this.poids[cle]) {
            this.poids[cle] = 0;
        }
        this.poids[cle] += valeur;
        
        // Sauvegarde automatique si un handle de fichier existe
        this.sauvegarderFichier();
    }

    async sauvegarderFichier() {
        if (!this.handle) return;
        try {
            const writable = await this.handle.createWritable();
            await writable.write(this.exporterPoidsJSON());
            await writable.close();
        } catch (err) {
            console.error("Erreur lors de l'écriture automatique du fichier :", err);
        }
    }

    genererConceptAleatoire() {
        const exemples = ["structure", "logique", "flux", "donnée", "syntaxe", "optimisation", "matrice", "réseau", "index"];
        return exemples[Math.floor(Math.random() * exemples.length)];
    }

    mettreAJourUI() {
        const totalRacines = Object.keys(this.poids).length;
        let totalConnexions = Object.values(this.poids).reduce((a, b) => a + b, 0);

        const badge = document.getElementById(`badge-${this.id}`);
        if (badge) badge.innerText = `${totalRacines} racines`;

        const metricTxt = document.getElementById(`metric-txt-${this.id}`);
        if (metricTxt) metricTxt.innerText = totalConnexions;

        const ringValue = document.getElementById(`ring-value-${this.id}`);
        const ring = document.getElementById(`ring-${this.id}`);
        if (ringValue && ring) {
            let pct = Math.min(totalConnexions * 2, 100);
            ringValue.innerText = `${pct}%`;
            ring.style.setProperty('--pct', pct);
        }

        const densite = document.getElementById(`densite-${this.id}`);
        if (densite) densite.innerText = totalRacines > 0 ? (totalConnexions / totalRacines).toFixed(1) : 0;

        const entropie = document.getElementById(`entropie-${this.id}`);
        if (entropie) entropie.innerText = totalRacines;

        // Mise à jour du graphique Chart.js s'il existe
        this.mettreAJourGraphique();
    }

    mettreAJourGraphique() {
        const canvas = document.getElementById(`chart-${this.id}`);
        if (!canvas) return;

        const labels = Object.keys(this.poids).slice(-6);
        const dataValues = Object.values(this.poids).slice(-6);

        if (this.chart) {
            this.chart.data.labels = labels;
            this.chart.data.datasets[0].data = dataValues;
            this.chart.update('none');
        } else {
            this.chart = new Chart(canvas, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataValues,
                        borderColor: '#00d9ff',
                        borderWidth: 1.5,
                        pointRadius: 2,
                        tension: 0.3,
                        fill: true,
                        backgroundColor: 'rgba(0, 217, 255, 0.05)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: false },
                        y: { display: false }
                    }
                }
            });
        }
    }

    exporterPoidsJSON() {
        return JSON.stringify({
            nom: this.nom,
            domaine: this.domaine,
            memoire_paires: this.poids
        }, null, 2);
    }
}
