// Orchestrateur.js
export class Orchestrateur {
    constructor() {
        this.experts = [];
    }

    ajouterExpert(expert) {
        this.experts.push(expert);
    }

    async orchestrerAnalyse(question, maxPasses = 2, seuilCible = 25) {
        let iteration = 0;
        let meilleur = null;
        let contexteTravail = question;
        let historiquePasses = [];

        while (iteration < maxPasses) {
            iteration++;

            // 1. Tous les experts analysent la question en parallèle
            const promesses = this.experts.map(e => e.analyser(contexteTravail));
            const resultats = await Promise.all(promesses);

            // 2. Tri par score pour trouver le meilleur expert
            resultats.sort((a, b) => b.score - a.score);
            meilleur = resultats[0];

            historiquePasses.push(`Passe ${iteration}: ${meilleur.expert} (Score: ${meilleur.score})`);

            // 3. Diffusion de l'influence (Apprentissage social)
            // Les autres experts "apprennent" du meilleur
            this.experts.forEach(expert => {
                if (expert.id !== meilleur.expert) {
                    expert.recevoirInfluence(meilleur.expert, meilleur.poidsPartage);
                }
            });

            // Si le score est suffisant ou qu'on a atteint la limite de passes, on sort de la boucle
            if (meilleur.score >= seuilCible || iteration >= maxPasses) {
                break;
            }

            // Raffinement dynamique du contexte pour la passe suivante basé sur les concepts du meilleur
            const conceptsCles = Object.keys(meilleur.poidsPartage || {}).slice(0, 3).join(', ');
            contexteTravail = `${question} [Affinage passe ${iteration} - Approfondir les axes : ${conceptsCles}]`;
        }

        // 4. Retourne les métadonnées "sous le capot" séparées par "---" de la réponse claire
        const infoPasses = historiquePasses.length > 1 ? ` | Parcours: ${historiquePasses.join(' ➔ ')}` : '';
        const sousLeCapot = `[Module: ${meilleur.expert} | Score: ${meilleur.score}${infoPasses}]`;
        
        return `${sousLeCapot}\n---\n${meilleur.reflexion}`;
    }
}
