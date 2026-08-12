/**
 * Module Expert - Unité d'apprentissage autonome et décentralisée
 */
class Expert {
    constructor(nom, domaine) {
        this.nom = nom;                 // Ex: "Expert Langue", "Expert Code", "Expert Personnel"
        this.domaine = domaine;         // Description de son domaine spécifique
        this.poids = {};                // Matrice de probabilités et liaisons (PAS de texte brut)
        this.timerApprentissage = null; // Pour gérer le mode veille
        this.enVeille = false;
    }

    /**
     * 1. LE MODE VEILLE (Apprentissage aléatoire autonome)
     * Tourne en boucle tant que tu n'écris rien.
     */
    lancerApprentissageAléatoire(sourceDonneesSimulee) {
        if (this.enVeille) return;
        this.enVeille = true;
        
        console.log(`[${this.nom}] Entre en mode veille : début de l'apprentissage autonome.`);

        // Simule une boucle d'entraînement en arrière-plan (toutes les 4 secondes)
        this.timerApprentissage = setInterval(() => {
            // Dans la vraie vie, il va chercher un mot/concept dans sa source (ex: Wikipédia ou tes notes)
            let conceptAleatoire = this.genererConceptAleatoire(sourceDonneesSimulee);
            this.mettreAJourPoids(conceptAleatoire, 1);
        }, 4000);
    }

    /**
     * 2. L'INTERRUPTION INSTANTANÉÉ (Dès que tu tapes une lettre)
     */
    stopApprentissage() {
        if (!this.enVeille) return;
        this.enVeille = false;
        clearInterval(this.timerApprentissage);
        console.log(`[${this.nom}] Interruption immédiate : Prêt pour l'analyse.`);
    }

    /**
     * 3. L'ANALYSE DE TA REQUÊTE
     * Confronte ton texte à sa matrice de poids (sans stocker ton texte)
     */
    analyser(texteUtilisateur) {
        // Découpe ton texte en mots clés
        let mots = texteUtilisateur.toLowerCase().split(/\s+/);
        let scorePertinence = 0;
        let associationTrouvee = "";

        // Utilise ses "poids" mathématiques pour évaluer sa réponse dans son domaine
        mots.forEach(mot => {
            if (this.poids[mot]) {
                scorePertinence += this.poids[mot];
                associationTrouvee = mot;
            }
        });

        // Retourne une brique de réflexion propre à son domaine
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
     * 4. LA CORRECTION (RLHF Maison)
     * Quand tu corriges une réponse, on met à jour les poids, jamais le texte brut.
     */
    integrerCorrection(motCle, forceLiaison) {
        this.mettreAJourPoids(motCle, forceLiaison);
        console.log(`[${this.nom}] Poids mis à jour suite à votre correction.`);
    }

    // --- Fonctions utilitaires internes ---
    mettreAJourPoids(cle, valeur) {
        if (!this.poids[cle]) {
            this.poids[cle] = 0;
        }
        this.poids[cle] += valeur; // Renforce la connexion neuronale statistique
    }

    genererConceptAleatoire(source) {
        // Simulation d'extraction d'un terme du domaine
        const exemples = ["structure", "logique", "flux", "donnée", "syntaxe", "optimisation"];
        return exemples[Math.floor(Math.random() * exemples.length)];
    }

    /**
     * Exporte les poids au format JSON pour les sauvegarder sur ton disque/GitHub
     */
    exporterPoidsJSON() {
        return JSON.stringify({
            nom: this.nom,
            domaine: this.domaine,
            poids: this.poids
        }, null, 2);
    }
}
