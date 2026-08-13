// modules.registry.js

export const MODULES_REGISTRY = [
    // --- Communication & Style (1) ---
    { id: "redacteur", nom: "Rédacteur & Clarté", cat: "communication", dbName: "HubDB_Redacteur", keyName: "redacKey", type: "wiki", wikiLang: "fr", file: "redacteur.html" },

    // --- Langages de Code (7) ---
    { id: "python", nom: "Python", cat: "code", dbName: "HubDB_Python", keyName: "pyKey", type: "wiki", wikiLang: "en", file: "python.html" },
    { id: "javascript", nom: "JavaScript", cat: "code", dbName: "HubDB_JS", keyName: "jsKey", type: "wiki", wikiLang: "en", file: "javascript_module.html" },
    { id: "cpp", nom: "C++", cat: "code", dbName: "HubDB_CPP", keyName: "cppKey", type: "wiki", wikiLang: "en", file: "cpp_module.html" },
    { id: "htmlcss", nom: "HTML / CSS", cat: "code", dbName: "HubDB_HTMLCSS", keyName: "htmlKey", type: "wiki", wikiLang: "en", file: "html_css_module.html" },
    { id: "sql", nom: "SQL", cat: "code", dbName: "HubDB_SQL", keyName: "sqlKey", type: "wiki", wikiLang: "en", file: "sql_module.html" },
    { id: "java", nom: "Java", cat: "code", dbName: "HubDB_Java", keyName: "javaKey", type: "wiki", wikiLang: "en", file: "java_module.html" },
    { id: "php", nom: "PHP", cat: "code", dbName: "HubDB_PHP", keyName: "phpKey", type: "wiki", wikiLang: "en", file: "php_module.html" },
    
    // --- Langues, Littérature & Poésie (2) ---
    { id: "arabe", nom: "Arabe (V2)", cat: "langue", dbName: "HubDB_Arabe", keyName: "arKey", type: "wiki", wikiLang: "ar", isRtl: true, file: "Arabe.html" },
    { id: "poesie", nom: "Poésie Métrique", cat: "langue", dbName: "HubDB_Poesie", keyName: "poesieKey", type: "wiki", wikiLang: "fr", file: "module-poesie-metrique.html" },

    // --- Archives, Sciences & Domaines Spécifiques (5) ---
    { id: "maths", nom: "Mathématiques", cat: "archives", dbName: "HubDB_Maths", keyName: "mathsKey", type: "wiki", wikiLang: "en", file: "Mathématique.html" },
    { id: "droit", nom: "Droit & Réglementation", cat: "archives", dbName: "HubDB_Droit", keyName: "droitKey", type: "wiki", wikiLang: "fr", file: "Droit_ Normes_Réglementation.html" },
    { id: "gutenberg", nom: "Project Gutenberg (Classiques)", cat: "archives", dbName: "HubDB_Gutenberg", keyName: "gutKey", type: "wiki", wikiLang: "en", file: "gutenberg.html" },
    { id: "wikisource", nom: "Wikisource (Patrimoine)", cat: "archives", dbName: "HubDB_Wikisource", keyName: "wsKey", type: "wikisource", wikiLang: "fr", wikiDomain: "wikisource.org", file: "wikisource.html" },
    { id: "philo", nom: "Philosophie & Essais (Filo)", cat: "archives", dbName: "HubDB_Philo", keyName: "philoKey", type: "wikisource", wikiLang: "fr", wikiDomain: "wikiquote.org", file: "index.html" }
];

export const CATEGORIES_CONFIG = {
    communication: { label: 'Communication & Style', color: '#ff5c5c' },
    code: { label: 'Code', color: '#00d9ff' },
    langue: { label: 'Langue & Poésie', color: '#ffb000' },
    archives: { label: 'Archives & Sciences', color: '#b47cff' }
};
