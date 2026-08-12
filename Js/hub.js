/**
 * Hub Central - Le chef d'orchestre
 */
export class HubCentral {
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

    // Méthodes alias pour correspondre aux appels de l'interface graphique index.html
    interrompreVeille() {
        this.surFrappeClavier();
    }

    reprendreVeille() {
        this.surChampVide();
    }

    // Le cœur du traitement
    processerMessage(texte) {
        let resultats = this.experts.map(expert => expert.analyser(texte));
        return this.synthetiserReponses(resultats);
    }

    // Alias pour correspondre aux appels de l'interface index.html
    processerRequete(texte) {
        return this.processerMessage(texte);
    }

    synthetiserReponses(resultats) {
        let reponse = "Réflexion du système : \n";
        resultats.forEach(res => {
            reponse += `- [${res.expert}] : ${res.reflexion}\n`;
        });
        return reponse;
    }
}
