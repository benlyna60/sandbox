/**
 * Hub Central - Le chef d'orchestre
 */
class HubCentral {
    constructor() {
        this.experts = [];
        this.estEnVeille = true;
    }

    // Ajouter un expert au Hub
    ajouterExpert(expert) {
        this.experts.push(expert);
    }

    // Initialisation : Tous les experts commencent leur apprentissage
    demarrerSysteme() {
        this.experts.forEach(expert => expert.lancerApprentissageAléatoire());
        console.log("Hub Central : Système opérationnel, apprentissage actif.");
    }

    // Appelé dès qu'une touche est pressée dans l'interface
    surFrappeClavier() {
        if (this.estEnVeille) {
            this.estEnVeille = false;
            this.experts.forEach(expert => expert.stopApprentissage());
            console.log("Hub Central : Interruption activée, mode Focus.");
        }
    }

    // Appelé quand le message est envoyé ou le champ vidé
    surChampVide() {
        if (!this.estEnVeille) {
            this.estEnVeille = true;
            this.experts.forEach(expert => expert.lancerApprentissageAléatoire());
            console.log("Hub Central : Reprise de l'apprentissage.");
        }
    }

    // Le cœur du traitement
    processerMessage(texte) {
        // 1. Demande à chaque expert d'analyser le texte selon ses poids
        let resultats = this.experts.map(expert => expert.analyser(texte));

        // 2. Synthèse (Le Hub rassemble les briques pour formuler la réponse)
        return this.synthetiserReponses(resultats);
    }

    synthetiserReponses(resultats) {
        // Pour l'instant, on crée une réponse structurée à partir des réflexions
        let reponse = "Réflexion du système : \n";
        resultats.forEach(res => {
            reponse += `- [${res.expert}] : ${res.reflexion}\n`;
        });
        return reponse;
    }
}
