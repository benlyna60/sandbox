// Orchestrateur.js
export class Orchestrateur {
    constructor() {
        this.experts = [];
    }

    ajouterExpert(expert) {
        this.experts.push(expert);
    }

    async orchestrerAnalyse(question) {
        // 1. Tous les experts analysent la question en parallèle
        const promesses = this.experts.map(e => e.analyser(question));
        const resultats = await Promise.all(promesses);

        // 2. Tri par score pour trouver le meilleur expert
        const resultatsTries = resultats.sort((a, b) => b.score - a.score);
        const meilleur = resultatsTries[0];

        // 3. Diffusion de l'influence (Apprentissage social)
        // Les autres experts "apprennent" du meilleur
        this.experts.forEach(expert => {
            if (expert.id !== meilleur.expert) {
                expert.recevoirInfluence(meilleur.expert, meilleur.poidsPartage);
            }
        });

        // 4. Retourne la réflexion du meilleur + une mention de l'expert
        return `*Analyse validée par le module : **${meilleur.expert}** (Score: ${meilleur.score})*\n\n${meilleur.reflexion}`;
    }
}
