/**
 * Hub Central - Orchestrateur (Version Intelligente et Dynamique)
 */
export class HubCentral {
    constructor() {
        this.experts = [];
        this.estEnModeFocus = false;
    }

    ajouterExpert(expert) {
        this.experts.push(expert);
    }

    traiterRequete(texte) {
        this.estEnModeFocus = true;

        // 1. Pause de l'errance pour tous les modules
        this.experts.forEach(exp => exp.arreterApprentissage());

        const texteMin = texte.toLowerCase();
        const motsClesRequete = texteMin.split(/\s+/).filter(m => m.length > 2);

        // 2. Les 14 modules analysent la requête dans leur spécialité
        const resultatsAnalyses = this.experts.map(exp => {
            const resultatBrut = exp.analyser(texte);
            const reflexionTexte = (resultatBrut.reflexion || "").toLowerCase();
            
            // Calcul d'un score basé sur la correspondance entre les mots de la requête et la réflexion de l'expert
            let score = 0;
            motsClesRequete.forEach(mot => {
                if (reflexionTexte.includes(mot)) {
                    score += 3; // Plus le module trouve de mots en lien avec la question dans sa mémoire, plus il monte
                }
            });

            // Bonus si le domaine ou le nom correspond directement à la question
            if (texteMin.includes(exp.id) || texteMin.includes(exp.cat.toLowerCase())) {
                score += 5;
            }

            return {
                expert: exp.nom,
                domaine: exp.cat,
                reflexion: resultatBrut.reflexion || "Analyse en cours...",
                score: score
            };
        });

        // 3. LE VRAI FILTRAGE : On trie par score et on ne garde que ceux qui ont un score > 0 et une vraie réflexion
        resultatsAnalyses.sort((a, b) => b.score - a.score);
        
        let modulesPertinents = resultatsAnalyses.filter(res => res.score > 0 && res.reflexion.length > 10);

        // Si vraiment rien ne matche, on prend le meilleur module disponible au lieu de bloquer
        if (modulesPertinents.length === 0) {
            modulesPertinents = [resultatsAnalyses[0]];
        } else {
            // On limite aux 2 ou 3 meilleurs max pour ne pas surcharger
            modulesPertinents = modulesPertinents.slice(0, 2);
        }

        // 4. Construction d'une réponse claire et propre
        let rapport = `=== RAPPORT DU HUB CENTRAL ===\n`;
        rapport += `Requête : "${texte}"\n\n`;

        modulesPertinents.forEach(res => {
            rapport += `[Module : ${res.expert} - ${res.domaine}] :\n`;
            rapport += `${res.reflexion}\n\n`;
        });

        // 5. Reprise immédiate de l'errance
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
