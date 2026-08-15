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
        this.derniersFichiers = [];

        // Chargement initial du localStorage
        try {
            const memoireSauvee = localStorage.getItem(`expert_memoire_${this.id}`);
            if (memoireSauvee) {
                const parsed = JSON.parse(memoireSauvee);
                this.poids = parsed;
            }
        } catch (err) {
            console.warn(`[${this.nom}] Erreur localStorage :`, err);
        }
    }

    lancerApprentissage() {
        this.mettreAJourStatutUI("🚀 Synchronisation globale en cours...");
        this.mettreAJourUI();
    }

    ingererTexte(texteBrut, sourceNom = "Saisie directe") {
        if (!texteBrut || typeof texteBrut !== 'string') return;

        this.mettreAJourStatutUI(`Analyse : ${sourceNom}...`);

        const mots = texteBrut.toLowerCase()
            .replace(/[^\w\sàâäéèêëîïôöùûüç]/gi, ' ')
            .split(/[\s,.;:!?()\[\]{}'"]+/)
            .filter(m => m.length > 3);

        const stopWords = ['les', 'des', 'une', 'pour', 'dans', 'que', 'qui', 'sur', 'par', 'avec', 'sont', 'aux', 'pas', 'plus'];

        mots.forEach(mot => {
            if (!stopWords.includes(mot)) this.mettreAJourPoids(mot, 5);
        });

        this.derniersFichiers.unshift({ nom: sourceNom, mots: mots.length, heure: new Date().toLocaleTimeString() });
        if (this.derniersFichiers.length > 3) this.derniersFichiers.pop();
        this.mettreAJourUI();
    }

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
                const donnees = json.memoire_paires || json;
                for (let [k, v] of Object.entries(donnees)) {
                    if (typeof v === 'number') this.mettreAJourPoids(k, v);
                }
                this.mettreAJourUI();
            } 
            else if (extension === 'pdf') {
                await this.traiterPDF(file);
            }
        } catch (err) {
            this.mettreAJourStatutUI(`❌ Erreur sur ${file.name}`);
        }
    }

    async traiterPDF(file) {
        if (typeof pdfjsLib === 'undefined') return;
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let texteTotal = "";
            for (let i = 1; i <= pdfDoc.numPages; i++) {
                const page = await pdfDoc.getPage(i);
                const tokenText = await page.getTextContent();
                texteTotal += tokenText.items.map(item => item.str || '').join(' ') + "\n";
            }
            this.ingererTexte(texteTotal, `PDF: ${file.name}`);
        } catch (err) {
            this.mettreAJourStatutUI("❌ Erreur lecture PDF");
        }
    }

    /**
     * LIAISON : Charge et fusionne la mémoire pure depuis le fichier
     */
    async lierFichierSauvegarde(fileHandle) {
        try {
            this.handle = fileHandle;
            const file = await fileHandle.getFile();
            const text = await file.text();
            
            if (text && text.trim() !== "") {
                const json = JSON.parse(text);
                for (let [k, v] of Object.entries(json)) {
                    this.poids[k] = (this.poids[k] || 0) + v;
                }
            }
            this.mettreAJourStatutUI(`🔗 Lié : ${file.name}`);
            this.mettreAJourUI();
        } catch (err) {
            console.error("Erreur liaison fichier :", err);
        }
    }

    /**
     * Permet à ce module de lier son propre fichier JSON distinct sur le disque
     */
    async lierFichierDisquePersonnel() {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: `Fichier Mémoire (${this.nom})`,
                    accept: { 'application/json': ['.json', '.txt'] }
                }]
            });
            await this.lierFichierSauvegarde(handle);
        } catch (err) {
            console.log("Sélection du fichier personnel annulée.");
        }
    }

    /**
     * SAUVEGARDE : Écrit uniquement l'objet mémoire (JSON pur) dans son fichier dédié
     */
    async sauvegarderFichierPhysique() {
        if (!this.handle) return;
        try {
            const writable = await this.handle.createWritable();
            await writable.write(JSON.stringify(this.poids, null, 2));
            await writable.close();
        } catch (err) {
            console.error(`[${this.nom}] Erreur sauvegarde physique :`, err);
        }
    }

    mettreAJourPoids(cle, valeur) {
        this.poids[cle] = (this.poids[cle] || 0) + valeur;
        localStorage.setItem(`expert_memoire_${this.id}`, JSON.stringify(this.poids));
        this.sauvegarderFichierPhysique();
    }

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

    async analyser(texteUtilisateur) { /* ... */ }
    recevoirInfluence(moduleVoisinId, poidsPartages) { /* ... */ }
}
