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
        this.handle = null;
        this.derniersFichiers = []; // Historique pour le suivi UI

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
     * NOUVEAU : Méthode standard pour s'intégrer au bouton "Lancer"
     */
    lancerApprentissage() {
        this.mettreAJourStatutUI("🚀 Synchronisation globale en cours...");
        this.mettreAJourUI();
        console.log(`[${this.nom}] Apprentissage/Synchronisation déclenché.`);
    }

    /**
     * 1. INGESTION UNIVERSELLE DE TEXTE BRUT
     */
    ingererTexte(texteBrut, sourceNom = "Saisie directe") {
        if (!texteBrut || typeof texteBrut !== 'string') return;

        this.mettreAJourStatutUI(`Analyse : ${sourceNom}...`);

        const mots = texteBrut.toLowerCase()
            .replace(/[^\w\sàâäéèêëîïôöùûüç]/gi, ' ')
            .split(/[\s,.;:!?()\[\]{}'"]+/)
            .filter(m => m.length > 3);

        const stopWords = ['les', 'des', 'une', 'pour', 'dans', 'que', 'qui', 'sur', 'par', 'avec', 'sont', 'aux', 'pas', 'plus'];

        mots.forEach(mot => {
            if (!stopWords.includes(mot)) {
                this.mettreAJourPoids(mot, 5);
            }
        });

        // Mise à jour historique
        this.derniersFichiers.unshift({ nom: sourceNom, mots: mots.length, heure: new Date().toLocaleTimeString() });
        if (this.derniersFichiers.length > 3) this.derniersFichiers.pop();

        console.log(`[${this.nom}] Ingestion réussie : ${sourceNom}`);
        this.mettreAJourUI();
    }

    /**
     * 2. INGESTION DE FICHIERS AVEC SUIVI
     */
    async traiterFichier(file) {
        if (!file) return;
        const extension = file.name.split('.').pop().toLowerCase();
        this.mettreAJourStatutUI(`⏳ Lecture de ${file.name}...`);

        try {
            if (extension === 'txt' || extension === 'md') {
                const texte = await file.text();
                this.ingererTexte(texte, file.name);
            } 
            else if (extension === 'json') {
                const texte = await file.text();
                const json = JSON.parse(texte);
                const donnees = json.memoire_paires || json.poids || json;
                for (let [k, v] of Object.entries(donnees)) {
                    if (typeof v === 'number' && !isNaN(v)) this.mettreAJourPoids(k, v);
                    else this.ingererTexte(String(v), file.name);
                }
                this.mettreAJourUI();
            } 
            else if (extension === 'pdf') {
                await this.traiterPDF(file);
            } else {
                this.mettreAJourStatutUI(`❌ Format .${extension} ignoré`);
            }
        } catch (err) {
            this.mettreAJourStatutUI(`❌ Erreur sur ${file.name}`);
            console.error(err);
        }
    }

    /**
     * 3. EXTRACTION PDF AVEC SUIVI DES PAGES
     */
    async traiterPDF(file) {
        if (typeof pdfjsLib === 'undefined') return;

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let texteTotal = "";
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                this.mettreAJourStatutUI(`📖 Lecture PDF : page ${i}/${pdfDoc.numPages}`);
                const page = await pdfDoc.getPage(i);
                const tokenText = await page.getTextContent();
                texteTotal += tokenText.items.map(item => item.str || '').join(' ') + "\n";
            }

            if (!texteTotal.trim()) {
                this.mettreAJourStatutUI("⚠️ Erreur : PDF scanné (Image).");
                return;
            }

            this.ingererTexte(texteTotal, `PDF: ${file.name}`);
        } catch (err) {
            this.mettreAJourStatutUI("❌ Erreur PDF");
            console.error(err);
        }
    }

    /**
     * 4. LIAISON FICHIER ET SAUVEGARDE
     */
    async lierFichierSauvegarde(fileHandle) {
        this.handle = fileHandle;
        const file = await fileHandle.getFile();
        this.mettreAJourStatutUI(`🔗 Lié : ${file.name}`);
        // ... (ton code de lecture existant reste inchangé ici)
    }

    async sauvegarderFichierPhysique() {
        if (!this.handle) return;
        try {
            const writable = await this.handle.createWritable();
            await writable.write(JSON.stringify({
                nom: this.nom,
                memoire_paires: this.poids
            }, null, 2));
            await writable.close();
        } catch (err) {
            console.error(err);
        }
    }

    mettreAJourPoids(cle, valeur) {
        this.poids[cle] = (this.poids[cle] || 0) + valeur;
        localStorage.setItem(`expert_memoire_${this.id}`, JSON.stringify(this.poids));
        this.sauvegarderFichierPhysique();
    }

    /**
     * Mise à jour de l'UI avec historique visuel
     */
    mettreAJourStatutUI(message) {
        const outputEl = document.getElementById(`out-${this.id}`);
        if (outputEl) outputEl.innerText = message;
    }

    mettreAJourUI() {
        const total = Object.keys(this.poids).length;
        const badge = document.getElementById(`badge-${this.id}`);
        if (badge) badge.innerText = `${total} concepts`;

        const outputEl = document.getElementById(`out-${this.id}`);
        if (outputEl) {
            let hist = this.derniersFichiers.map(f => `• ${f.nom} (${f.mots || 'JSON'} mots)`).join('\n');
            outputEl.innerText = `✔ Mémoire active : ${total} notions.\n\nHistorique :\n${hist || 'Aucun import récent.'}`;
        }
    }

    // --- Reste des méthodes (analyser, recevoirInfluence) inchangé ---
    async analyser(texteUtilisateur) { /* ... identique ... */ }
    recevoirInfluence(moduleVoisinId, poidsPartages) { /* ... identique ... */ }
}
