/**
 * Module Ingestor - Ingestion Universelle (TXT, JSON, PDF) & Persistance Fichier
 * S'intègre dans l'écosystème modulaire (Compatible classe Expert / Orchestrateur)
 */
export class IngestorModule {
    constructor(id = "ingestor", nom = "Ingestor & Mémoire Persistante", cat = "archives") {
        this.id = id;
        this.nom = nom;
        this.cat = cat;
        this.domaine = "Ingestion documentaire et savoirs unifiés";
        this.poids = {};
        this.handle = null; // File System Access Handle pour l'écriture du .txt/.json

        // Chargement initial du localStorage avec blindage strict
        try {
            const memoireSauvee = localStorage.getItem(`expert_memoire_${this.id}`);
            if (memoireSauvee) {
                const parsed = JSON.parse(memoireSauvee);
                for (let k in parsed) {
                    if (typeof parsed[k] === 'number' && !isNaN(parsed[k])) {
                        this.poids[k] = parsed[k];
                    }
                }
            }
        } catch (err) {
            console.warn(`[${this.nom}] Erreur de chargement localStorage :`, err);
            this.poids = {};
        }
    }

    /**
     * 1. INGESTION UNIVERSELLE DE TEXTE BRUT
     */
    ingererTexte(texteBrut, sourceNom = "Saisie directe") {
        if (!texteBrut || typeof texteBrut !== 'string') return;

        // Nettoyage et tokenisation (mots de plus de 3 caractères)
        const mots = texteBrut.toLowerCase()
            .replace(/[^\w\sàâäéèêëîïôöùûüç]/gi, ' ')
            .split(/[\s,.;:!?()\[\]{}'"]+/)
            .filter(m => m.length > 3);

        // Stop words basiques à filtrer pour ne garder que la substance
        const stopWords = ['les', 'des', 'une', 'pour', 'dans', 'que', 'qui', 'sur', 'par', 'avec', 'sont', 'aux', 'pas', 'plus'];

        mots.forEach(mot => {
            if (!stopWords.includes(mot)) {
                this.mettreAJourPoids(mot, 5); // Poids fort car source directe utilisateur
            }
        });

        console.log(`[${this.nom}] Ingestion réussie depuis : ${sourceNom} (${mots.length} mots analysés)`);
        this.mettreAJourUI();
    }

    /**
     * 2. INGESTION DE FICHIERS (TXT, JSON ou PDF via l'API du navigateur)
     */
    async traiterFichier(file) {
        if (!file) return;
        const extension = file.name.split('.').pop().toLowerCase();

        try {
            if (extension === 'txt' || extension === 'md') {
                const texte = await file.text();
                this.ingererTexte(texte, file.name);
            } 
            else if (extension === 'json') {
                const texte = await file.text();
                const json = JSON.parse(texte);
                // Si c'est un export de mémoire au format objet
                const donnees = json.memoire_paires || json.poids || json;
                for (let [k, v] of Object.entries(donnees)) {
                    if (typeof v === 'number' && !isNaN(v)) {
                        this.mettreAJourPoids(k, v);
                    } else {
                        this.ingererTexte(String(v), file.name);
                    }
                }
                console.log(`[${this.nom}] JSON ingéré : ${file.name}`);
                this.mettreAJourUI();
            } 
            else if (extension === 'pdf') {
                await this.traiterPDF(file);
            } else {
                console.warn(`[${this.nom}] Format non pris en charge : .${extension}`);
            }
        } catch (err) {
            console.error(`[${this.nom}] Erreur lors du traitement du fichier ${file.name} :`, err);
        }
    }

    /**
     * 3. EXTRACTION LOCALE DE PDF (Utilise PDF.js chargé globalement dans le HTML)
     */
    async traiterPDF(file) {
        if (typeof pdfjsLib === 'undefined') {
            alert("La bibliothèque PDF.js n'est pas chargée dans la page HTML.");
            return;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdfDoc = await loadingTask.promise;
            
            let texteTotal = "";
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const tokenText = await page.getTextContent();
                // Sécurisation de l'extraction des chaînes de caractères (.str)
                const textPages = tokenText.items
                    .map(item => item.str || '')
                    .join(' ');
                texteTotal += textPages + "\n";
            }

            // Vérification si le PDF contient du texte extractible
            if (!texteTotal.trim()) {
                console.warn(`[${this.nom}] Le PDF "${file.name}" ne contient aucun texte textuel. Il s'agit probablement d'un PDF scanné (image).`);
                alert(`Attention : Le PDF "${file.name}" semble être une image ou un scan sans texte sélectionnable. L'extraction automatique n'a rien trouvé.`);
                return;
            }

            this.ingererTexte(texteTotal, `PDF: ${file.name}`);
        } catch (err) {
            console.error(`[${this.nom}] Erreur critique lors de la lecture du PDF :`, err);
            alert(`Erreur de lecture du PDF ${file.name}. Voir la console pour les détails.`);
        }
    }

    /**
     * 4. LIAISON AVEC UN FICHIER DE SAUVEGARDE SUR LE DISQUE (.txt ou .json)
     */
    async lierFichierSauvegarde(fileHandle) {
        try {
            this.handle = fileHandle;
            const file = await fileHandle.getFile();
            const text = await file.text();
            if (text) {
                // Tente de parser si c'est du JSON, sinon traite comme du texte brut
                try {
                    const json = JSON.parse(text);
                    const memoireFichier = json.memoire_paires || json.poids || {};
                    for (let [k, v] of Object.entries(memoireFichier)) {
                        if (typeof v === 'number' && !isNaN(v)) {
                            this.poids[k] = (this.poids[k] || 0) + v;
                        }
                    }
                } catch {
                    this.ingererTexte(text, file.name);
                }
                localStorage.setItem(`expert_memoire_${this.id}`, JSON.stringify(this.poids));
                this.mettreAJourUI();
            }
            console.log(`[${this.nom}] Fichier de sauvegarde lié avec succès.`);
        } catch (err) {
            console.error(`[${this.nom}] Erreur lors de la liaison du fichier de sauvegarde :`, err);
        }
    }

    /**
     * Écriture automatique dans le fichier lié sur le disque
     */
    async sauvegarderFichierPhysique() {
        if (!this.handle) return;
        try {
            const writable = await this.handle.createWritable();
            await writable.write(JSON.stringify({
                nom: this.nom,
                domaine: this.domaine,
                categorie: this.cat,
                memoire_paires: this.poids
            }, null, 2));
            await writable.close();
        } catch (err) {
            console.error(`[${this.nom}] Erreur d'écriture physique sur le fichier :`, err);
        }
    }

    /**
     * Gestion interne des poids et persistance localStorage
     */
    mettreAJourPoids(cle, valeur) {
        if (typeof this.poids[cle] !== 'number' || isNaN(this.poids[cle])) {
            this.poids[cle] = 0;
        }
        this.poids[cle] += valeur;

        try {
            localStorage.setItem(`expert_memoire_${this.id}`, JSON.stringify(this.poids));
        } catch (err) {
            console.error("Erreur d'écriture localStorage :", err);
        }

        this.sauvegarderFichierPhysique();
    }

    /**
     * INTERACTION AVEC L'ORCHESTRATEUR (S'intègre dans ton système d'experts)
     */
    async analyser(texteUtilisateur) {
        const texteMin = texteUtilisateur.toLowerCase();
        const mots = texteMin.split(/[\s,.;!?]+/).filter(m => m.length > 2);

        let conceptsTrouves = [];
        let scoreMemoire = 0;

        mots.forEach(mot => {
            if (this.poids[mot]) {
                scoreMemoire += this.poids[mot];
                conceptsTrouves.push(mot);
            }
        });

        // Si l'utilisateur pose une question en lien direct avec ses documents personnels, le score explose
        const scoreTotal = conceptsTrouves.length > 0 ? scoreMemoire * 2 : 0;

        let reflexion = `### 📂 Base Documentaire Personnelle (${this.nom})\n`;
        if (conceptsTrouves.length > 0) {
            reflexion += `**Documents correspondants trouvés :** ${conceptsTrouves.join(', ')}\n\n`;
            reflexion += `*Synthèse issue exclusivement de vos fichiers et textes importés.*`;
        } else {
            reflexion += `Aucun concept de vos documents personnels ne correspond directement à cette requête.`;
        }

        return {
            expert: this.nom,
            domaine: this.cat,
            score: scoreTotal,
            reflexion: reflexion,
            poidsPartage: this.poids
        };
    }

    /**
     * APPRENTISSAGE SOCIAL (Reçoit l'influence des autres modules)
     */
    recevoirInfluence(moduleVoisinId, poidsPartages) {
        // L'ingestor reste maître de ses sources, mais peut synchroniser les concepts croisés
        for (let [mot, valeur] of Object.entries(poidsPartages)) {
            if (typeof valeur === 'number' && !isNaN(valeur) && this.poids[mot]) {
                this.poids[mot] += Math.round(valeur * 0.1); // Renforce légèrement ses propres concepts si validés ailleurs
            }
        }
    }

    /**
     * Mise à jour de l'UI (si des éléments HTML correspondants existent)
     */
    mettreAJourUI() {
        const totalRacines = Object.keys(this.poids).length;
        const badge = document.getElementById(`badge-${this.id}`);
        if (badge) badge.innerText = `${totalRacines} concepts`;

        const outputEl = document.getElementById(`out-${this.id}`);
        if (outputEl) {
            outputEl.innerText = `✔ Mémoire active (${totalRacines} notions enregistrées depuis vos documents).`;
        }
    }
}
