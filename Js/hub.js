/**
 * Hub Central - Orchestrateur (Version Filtrée et Collaborative)
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
     * Traite la requête en faisant travailler les 14 modules,
     * puis filtre et ne remonte que l'information pertinente.
     */
    traiterRequete(texte) {
        this.estEnModeFocus = true;

        // 1. Pause de l'errance pour tous les modules
        this.experts.forEach(exp => exp.arreterApprentissage());

        const texteMin = texte.toLowerCase();
        const motsClesRequete = texteMin.split(/\s+/);

        // 2. Les 14 modules analysent chacun dans leur spécialité
        const resultatsAnalyses = this.experts.map(exp => {
            const resultatBrut = exp.analyser(texte);
            
            // Calcul d'un score de pertinence basé sur le domaine ou la catégorie
            let score = 0;
            const domaineExp = (exp.domaine || exp.cat || "").toLowerCase();
            const nomExp = (exp.nom || "").toLowerCase();
            
            motsClesRequete.forEach(mot => {
                if (mot.length > 2 && (domaineExp.includes(mot) || nomExp.includes(mot))) {
                    score += 5; // Plus le mot correspond à sa spécialité, plus le score monte
                }
            });

            return {
                expert: exp.nom,
                domaine: exp.cat,
                reflexion: resultatBrut.reflexion || "Analyse en cours...",
                score: score
            };
        });

        // 3. LE FILTRAGE : On ne garde que les modules dont le score est pertinent (> 0)
        let modulesPertinents = resultatsAnalyses.filter(res => res.score > 0);
        
        // Fallback : Si aucun mot-clé direct ne correspond, on sélectionne les 2 modules les plus actifs pour garder du répondant
        if (modulesPertinents.length === 0) {
            modulesPertinents = resultatsAnalyses.slice(0, 2);
        }

        // 4. Construction d'un rapport propre, structuré et épuré
        let rapport = `=== SYNTHÈSE DU HUB CENTRAL ===\n`;
        rapport += `Requête : "${texte}"\n`;
        rapport += `Modules consultés : 14 | Pertinents retenus : ${modulesPertinents.length}\n\n`;

        modulesPertinents.forEach(res => {
            rapport += `[✔ Recommandation | ${res.expert} (${res.domaine})] :\n`;
            rapport += `  └─ ${res.reflexion}\n\n`;
        });

        // 5. Reprise immédiate de l'errance pour tout le monde
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
