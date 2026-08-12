/**
 * Hub Central - Le chef d'orchestre
 */
export class HubCentral {
    constructor() {
        this.experts = [];
        this.estEnVeille = true;
        this.timerVeilleGlobale = null;
    }

    ajouterExpert(expert) {
        this.experts.push(expert);
    }

    demarrerSysteme() {
        this.experts.forEach(expert => {
            if (typeof expert.lancerApprentissage === 'function') {
                expert.lancerApprentissage();
            } else if (typeof expert.lancerApprentissageAléatoire === 'function') {
                expert.lancerApprentissageAléatoire();
            }
        });
        console.log("Hub Central : Système opérationnel, apprentissage actif.");
    }

    interrompreVeille() {
        if (this.estEnVeille) {
            this.estEnVeille = false;
            this.experts.forEach(expert => {
                if (typeof expert.arreterApprentissage === 'function') {
                    expert.arreterApprentissage();
                } else if (typeof expert.stopApprentissage === 'function') {
                    expert.stopApprentissage();
                }
            });
            console.log("Hub Central : Interruption activée, mode Focus.");
        }
    }

    reprendreVeille() {
        if (this.timerVeilleGlobale) clearTimeout(this.timerVeilleGlobale);
        
        this.timerVeilleGlobale = setTimeout(() => {
            this.estEnVeille = true;
            this.experts.forEach(expert => {
                if (typeof expert.lancerApprentissage === 'function') {
                    expert.lancerApprentissage();
                } else if (typeof expert.lancerApprentissageAléatoire === 'function') {
                    expert.lancerApprentissageAléatoire();
                }
            });
            console.log("Hub Central : Reprise de l'apprentissage.");
        }, 5000);
    }

    processerRequete(texte) {
        let resultats = this.experts.map(expert => expert.analyser(texte));
        resultats.sort((a, b) => b.score - a.score);

        let meilleur = resultats[0];
        let reponse = `=== ANALYSE DU HUB CENTRAL ===\n\n`;
        
        if (meilleur && meilleur.score > 0) {
            reponse += `🎯 Expert Principal retenu : ${meilleur.expert} (${meilleur.domaine || 'Domaine spécifique'})\n`;
            reponse += `💬 Réflexion : ${meilleur.reflexion}\n\n`;
        } else {
            reponse += `🌐 Requête distribuée en mode exploratoire neutre.\n\n`;
        }

        reponse += `--- Synthèse des autres modules ---\n`;
        resultats.slice(1).forEach(res => {
            reponse += `• ${res.expert} : ${res.reflexion}\n`;
        });

        return reponse;
    }
}
