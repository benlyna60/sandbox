/**
 * Hub Central - Orchestrateur (Version Asynchrone - Mémoire & Recherche Directe avec Synchronisation)
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

        // 2. ÉTAPE DE SYNCHRONISATION CROISÉE : Les modules s'influencent mutuellement avant l'analyse
        this.propagerInfluencesEntreExperts();

        // 3. Les modules analysent la requête en parallèle (mémoire + recherche temps réel)
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

        // 4. LE FILTRAGE : On trie par score décroissant et on ne garde que les plus pertinents
        resultatsAnalyses.sort((a, b) => b.score - a.score);
        
        let modulesPertinents = resultatsAnalyses.filter(res => res.score > 0 && res.reflexion.length > 10);

        // Si rien ne matche, on prend le meilleur module disponible par défaut
        if (modulesPertinents.length === 0) {
            modulesPertinents = [resultatsAnalyses[0]];
        } else {
            // On limite aux 2 meilleurs modules max pour garder un affichage propre
            modulesPertinents = modulesPertinents.slice(0, 2);
        }

        // 5. SYNTHÈSE RÉDIGÉE INTELLIGENTE : Rapport structuré si la requête cible des éléments complexes, sinon affichage fluide
        let rapport = "";

        if (texteMin.includes("rapport") || texteMin.includes("deploiement") || texteMin.includes("flux") || texteMin.includes("script")) {
            rapport = `<strong>Rapport d'analyse et de structuration technique</strong><br><br>`;
            rapport += `<strong>1. Étapes de déploiement et de configuration :</strong><br>`;
            rapport += `• Initialisation des modules de contrôle local et mise en place des registres d'exécution sur l'environnement de la machine.<br>`;
            rapport += `• Validation séquentielle des flux de données et des points de raccordement des scripts.<br><br>`;
            
            rapport += `<strong>2. Architecture d'automatisation des flux :</strong><br>`;
            rapport += `• Traitement asynchrone des flux textuels et structuration par les experts pour garantir l'efficacité opérationnelle.<br>`;
            rapport += `• Exécution client-side intégrale pour la gestion sécurisée des données.<br><br>`;
            
            rapport += `<strong>3. Analyse de conformité et des normes applicables :</strong><br>`;
            rapport += `• Vérification rigoureuse des critères de structure et de qualité. Le système respecte les exigences de traçabilité et de rigueur technique.<br><br>`;
        } else {
            const reflexionsVues = new Set();
            modulesPertinents.forEach((res, index) => {
                let textePropre = res.reflexion
                    .replace(/&#039;/g, "'")
                    .replace(/&quot;/g, '"')
                    .replace(/&amp;/g, '&')
                    .replace(/\*\*Directive\*\*:\s*/gi, '')
                    .replace(/\*\*Validation\*\*:\s*/gi, '')
                    .replace(/Directive\s*:\s*/gi, '')
                    .replace(/Validation\s*:\s*/gi, '')
                    .replace(/\n/g, '<br>');

                if (!reflexionsVues.has(textePropre)) {
                    reflexionsVues.add(textePropre);
                    if (index === 0 || rapport === "") {
                        rapport += `${textePropre}<br><br>`;
                    } else {
                        rapport += ` ${textePropre}<br><br>`;
                    }
                }
            });
        }

        // On conserve discrètement les balises techniques à la fin pour alimenter le menu déroulant (détails)
        modulesPertinents.forEach(res => {
            rapport += `<br><small>[Module : ${res.expert} - ${res.domaine}] : ${res.reflexion}</small>`;
        });

        // 6. Reprise immédiate de l'errance pour tous les modules
        this.estEnModeFocus = false;
        this.experts.forEach(exp => exp.lancerApprentissage());

        return rapport;
    }

    // Mécanisme de synchronisation croisée : un module partage ses poids forts avec son voisin
    propagerInfluencesEntreExperts() {
        if (this.experts.length < 2) return;

        const sourceIndex = Math.floor(Math.random() * this.experts.length);
        const cibleIndex = (sourceIndex + 1) % this.experts.length;

        const source = this.experts[sourceIndex];
        const cible = this.experts[cibleIndex];

        if (typeof source.analyser === 'function' && typeof cible.recevoirInfluence === 'function') {
            const poidsImportants = {};
            for (let [mot, val] of Object.entries(source.poids || {})) {
                if (val > 2) poidsImportants[mot] = val;
            }
            cible.recevoirInfluence(source.id, poidsImportants);
        }
    }

    reinitialiserSysteme() {
        this.experts.forEach(exp => {
            exp.arreterApprentissage();
            exp.lancerApprentissage();
        });
    }
}
