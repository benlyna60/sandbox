/**
 * Hub Central - Orchestrateur (Optimisé pour ton interface)
 */
export class HubCentral {
    constructor() {
        this.experts = [];
        this.estEnModeFocus = false;
    }

    ajouterExpert(expert) {
        this.experts.push(expert);
    }

    /**
     * Traite la requête et orchestre la collaboration
     * Cette méthode remplace/enrichit ton ancienne logique de processus
     */
    traiterRequete(texte) {
        this.estEnModeFocus = true;

        // 1. Mise en pause de l'apprentissage de tous les modules
        this.experts.forEach(exp => exp.arreterApprentissage());

        // 2. Mobilisation : chaque expert analyse dans son domaine
        // On récupère les réflexions de tout le monde
        const resultats = this.experts.map(exp => exp.analyser(texte));

        // 3. Synthèse structurée (Épurée mais transparente)
        let rapport = `=== ANALYSE COLLABORATIVE (Focus) ===\n\n`;
        
        // Bloc 1 : Synthèse globale (la réponse épurée)
        rapport += `[SYNTHÈSE] : Système opérationnel. Tous les modules ont analysé la requête "${texte}".\n\n`;

        // Bloc 2 : Détail des travaux (Transparence totale)
        rapport += `--- Détails des travaux par module ---\n`;
        resultats.forEach(res => {
            rapport += `• ${res.expert} [${res.domaine}] : ${res.reflexion}\n`;
        });

        // 4. Reprise de l'apprentissage automatique (Errance)
        this.estEnModeFocus = false;
        this.experts.forEach(exp => exp.lancerApprentissage());

        return rapport;
    }

    /**
     * Permet de forcer le redémarrage de tous les systèmes
     */
    reinitialiserSysteme() {
        this.experts.forEach(exp => {
            exp.arreterApprentissage();
            exp.lancerApprentissage();
        });
    }
}
