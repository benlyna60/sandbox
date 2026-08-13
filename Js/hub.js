/**
 * Hub Central - Orchestrateur (Version Asynchrone - Mémoire & Recherche Directe)
 */
export class HubCentral {
    constructor() {
        this.experts = [];
        this.estEnModeFocus = false;
    }

    ajouterExpert(expert) {
        this.experts.push(expert);
    }

    async traiterRequete(texte) {
        this.estEnModeFocus = true;

        // 1. Pause de l'errance pour tous les modules
        this.experts.forEach(exp => exp.arreterApprentissage());

        const texteMin = texte.toLowerCase();
        const motsClesRequete = texteMin.split(/\s+/).filter(m => m.length > 2);

        // 2. Les 14 modules analysent la requête en parallèle (mémoire + recherche temps réel)
        const resultatsAnalyses = await Promise.all(
            this.experts.map(async (exp) => {
                const resultatBrut = await exp.analyser(texte);
                const reflexionTexte = (resultatBrut.reflexion || "").toLowerCase();
                
                // Récupération du score de l'expert et application d'un bonus selon les mots-clés de la requête
                let score = resultatBrut.score || 0;
                
                motsClesRequete.forEach(mot => {
                    if (reflexionTexte.includes(mot)) {
                        score += 3; 
                    }
                });

                // Bonus si le domaine ou l'identifiant du module correspond directement à la question
                if (texteMin.includes(exp.id) || texteMin.includes(exp.cat.toLowerCase())) {
                    score += 5;
                }

                return {
                    expert: exp.nom,
                    domaine: exp.cat,
                    reflexion: resultatBrut.reflexion || "Analyse en cours...",
                    score: score
                };
            })
        );

        // 3. LE FILTRAGE : On trie par score décroissant et on ne garde que les plus pertinents
        resultatsAnalyses.sort((a, b) => b.score - a.score);
        
        let modulesPertinents = resultatsAnalyses.filter(res => res.score > 0 && res.reflexion.length > 10);

        // Si rien ne matche, on prend le meilleur module disponible par défaut
        if (modulesPertinents.length === 0) {
            modulesPertinents = [resultatsAnalyses[0]];
        } else {
            // On limite aux 2 meilleurs modules max pour garder un affichage propre
            modulesPertinents = modulesPertinents.slice(0, 2);
        }

        // 4. Construction du rapport final structuré
        let rapport = `=== RAPPORT DU HUB CENTRAL ===\n`;
        rapport += `Requête : "${texte}"\n\n`;

        modulesPertinents.forEach(res => {
            rapport += `[Module : ${res.expert} - ${res.domaine}] :\n`;
            rapport += `${res.reflexion}\n\n`;
        });

        // 5. Reprise immédiate de l'errance pour tous les modules
        this.estEnModeFocus = false;
        this.experts.forEach(exp => exp.lancerApprentissage());

        return rapport;
    }

    reinitialiserSysteme() {
        this.experts.forEach(exp => {
            exp.arreterApprentissage();
            exp.lancerApprentissage();
        });
    }
}
