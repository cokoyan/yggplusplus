const apiKey = 'xxxxxxxx';  // OMDB API KEY

const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 jours

// Un objet de cache pour stocker les notes des films
const movieCache = JSON.parse(localStorage.getItem('movieCache')) || {};

for (let key in movieCache) {
  if (isCacheExpired(movieCache[key].timestamp)) {
    delete movieCache[key];
  }
}

// Fonction pour injecter le CSS
function injectCSS() {
  // Crée un élément <style>
  const styleSheet = document.createElement("style");
  // Définit les règles CSS pour la classe .ct
  styleSheet.textContent = `
    .ct {
      /* Ajoutez vos propriétés CSS ici */
      width: 1600px;
    }
  `;
  // Ajoute le style dans le <head> du document
  document.head.appendChild(styleSheet);
}

function isCacheExpired(timestamp) {
  return Date.now() - timestamp > CACHE_EXPIRY;
}

function saveCache() {
  localStorage.setItem('movieCache', JSON.stringify(movieCache));
}

function calculateColor(rating) {
  // Échelle : de 0 à 5 => rouge pâle à orange clair, de 5 à 10 => orange clair à vert pâle
  if (rating <= 5) {
    // Note faible (0 à 5), transition du rouge pâle (#FFCCCC) à l'orange clair (#FFE5CC)
    const green = Math.floor((rating / 5) * 128); // Augmente le vert jusqu'à 128
    return `rgb(255,${128 + green},204)`; // Rouge adouci
  } else {
    // Note élevée (5 à 10), transition de l'orange clair (#FFE5CC) au vert pâle (#CCFFCC)
    const red = Math.floor(255 - ((rating - 5) / 5) * 128); // Réduit le rouge jusqu'à 128
    return `rgb(${red},255,204)`; // Vert adouci
  }
}

// Fonction principale pour extraire le nom et l'année du film
function extractMovieInfo(filename) {
    // Pattern pour détecter le titre alternatif entre parenthèses
    const altTitlePattern = /\((.*?)\)$/;
    const altTitle = filename.match(altTitlePattern)?.[1];

    // Nettoyer le nom du fichier avant extraction
    let cleanName = filename.replace(altTitlePattern, '').trim();

    // Pattern pour les fichiers avec points ET ceux avec espaces
    // Capture tout jusqu'à l'année ou jusqu'aux marqueurs de qualité/langue
    const pattern = /^(.*?)(?:\.|\s)(?:\d{4}|\(RM\)|(?:FRENCH|MULTI|VOSTFR|VOF|VFF|CUSTOM))/i;
    const match = cleanName.match(pattern);

    if (!match) return null;

    // Extraire l'année
    const yearPattern = /\b(19|20)\d{2}\b/;
    const year = filename.match(yearPattern)?.[0];

    // Nettoyer le titre
    let title = match[1].replace(/\./g, ' ').trim();

    // Nettoyage supplémentaire pour enlever les encodages/langues qui pourraient être restés
    title = title.replace(/\b(FRENCH|MULTI|VOSTFR|VOF|VFF|CUSTOM)\b/gi, '').trim();

    return {
        title,
        altTitle: altTitle || null,
        year: year || null
    };
}

// Fonction qui vérifie et modifie les tableaux de données sur la page
function addActionDownload() {
  // Sélectionne tous les éléments <table> ayant la classe "table"
  const tables = document.querySelectorAll("table.table");

  // Si aucun tableau n'est trouvé, on arrête la fonction
  if (!tables.length) {
    return;
  } 
  // Si le premier tableau n'a pas de lignes dans son corps, on réessaie dans 100ms
  else if (!tables[0].tBodies[0].rows.length) {
    setTimeout(addActionDownload, 100);
  } 
  // Si des tableaux avec des données sont trouvés
  else {
    // Pour chaque tableau trouvé
    tables.forEach((table) => {
      // Crée un nouvel en-tête de colonne pour les actions
      let th = document.createElement("th");
      th.colSpan = 1;
      th.innerText = "Actions";
      table.tHead.rows[0].appendChild(th);

      // Pour chaque ligne du corps du tableau
      for (let row of table.tBodies[0].rows) {
        // Crée une nouvelle cellule pour l'action
        let td = document.createElement("td");
        		
        // Récupère le lien de la deuxième cellule de la ligne
        const link = row.cells[1].firstChild.href;
        // Extrait le nom du fichier de l'URL
        const name = link.substr(link.lastIndexOf("/") + 1);
        // Extrait l'ID du torrent du nom du fichier
        const id = name.substr(0, name.indexOf("-"));

        // Ajoute un lien de téléchargement dans la nouvelle cellule
        td.innerHTML = '<svg viewBox="0 0 32 32" width="30px" height="20px">' +
						  '<a xlink:href="https://www.ygg.re/engine/download_torrent?id=' + id + '">' +
							  '<rect width="32" height="32" rx="4" fill="#2563eb"/>' +
							  '<path d="M16 8 L16 20 M11 15 L16 20 L21 15 M10 24 L22 24" stroke="white" stroke-width="2" fill="none" stroke-linecap="round"/>' +
						  '</a>'+
						'</svg>';
          //'<a href="https://www.ygg.re/engine/download_torrent?id=' +
          //id +
          //'">Télécharger</a>';
        
        // Ajoute la cellule à la fin de la ligne
        row.appendChild(td);
      }
    });
  }
}

function applyRating(td) {
	const imdbRating = parseFloat(td.innerHTML) || 0; // Note IMDb
			const color = calculateColor(imdbRating); // Couleur basée sur la note
			
			// Met à jour la cellule
			if (imdbRating != 0) {
				td.innerHTML = `${imdbRating} / 10`; // Affiche la note
				td.style.background = color; // Applique la couleur en fond
			}
}

// Fonction qui vérifie et modifie les tableaux de données sur la page
function addEvaluation() {
  // Sélectionne tous les éléments <table> ayant la classe "table"
  const tables = document.querySelectorAll("table.table");

  // Si aucun tableau n'est trouvé, on arrête la fonction
  if (!tables.length) {
    return;
  } 
  // Si le premier tableau n'a pas de lignes dans son corps, on réessaie dans 100ms
  else if (!tables[0].tBodies[0].rows.length) {
    setTimeout(addEvaluation, 100);
  } 
  // Si des tableaux avec des données sont trouvés
  else {

    // Pour chaque tableau trouvé
    tables.forEach((table) => {

      // Pour chaque ligne du corps du tableau
      for (let row of table.tBodies[0].rows) {
		  
		// On commence par vérifier qu'on est dans la catégorie film
        const link = row.cells[1].firstChild.href;
		
		if (link.match("/film/") == null) {
			return;
		}
		
        // Crée une nouvelle cellule pour l'action
        let td = document.createElement("td");

		// Récupération du nom de release affiché dans la colonne
        const name = row.cells[1].firstChild.innerText;
        		
        // Ajoute un lien de téléchargement dans la nouvelle cellule
		const movieInfos = extractMovieInfo(name);
		
		td.innerHTML = "N/A";
			
		if (movieInfos != null) {
			// Crée une clé pour identifier de manière unique le film dans le cache
			const movieKey = `${movieInfos.title}${movieInfos.year ? `-${movieInfos.year}` : ''}`;

			// Vérifie si les informations sont déjà dans le cache
			if (movieCache[movieKey]) {
				// Données déjà en cache
				td.innerHTML = movieCache[movieKey].imdbRating || "Non disponible";
				
				applyRating(td);
				
			} else {
				// Si les informations ne sont pas dans le cache, faire une requête à l'API
				// Requête OMDB API pour récupérer la note
				urlToFecth = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(movieInfos.title)}`;
				
				if (movieInfos.year != null) {
					urlToFecth += '&y=' + movieInfos.year;
				}
				
				fetch(urlToFecth)
				  .then(response => response.json())
				  .then(data => {
					if (data.Response === 'True') {
					  console.log('Titre :', data.Title);
					  console.log('Année :', data.Year);
					  console.log('Note IMDb :', data.imdbRating);
					  console.log('Note Rotten Tomatoes :', data.Ratings ? data.Ratings.find(rating => rating.Source === 'Rotten Tomatoes')?.Value : 'Non disponible');
					  
					  // Enregistre les données dans le cache
						const cachedData = {
						  imdbRating: data.imdbRating || 'Non disponible'
						};
						
						movieCache[movieKey] = cachedData; // Enregistre dans le cache
						saveCache(); // Sauvegarde dans le localStorage

						// Met à jour la cellule avec la note
						td.innerHTML = cachedData.imdbRating;
						
						applyRating(td);
					} else {
					  console.error('Film non trouvé');
					}
				  }).catch(error => console.error('Erreur :', error));
			}
			
		} 
        
        // Ajoute la cellule à la fin de la ligne
        row.appendChild(td);
      }
	  
      // Crée un nouvel en-tête de colonne pour les actions
      let th = document.createElement("th");
      th.colSpan = 1;
      th.innerText = "Notes";
      table.tHead.rows[0].appendChild(th);
    });
  }
}

// Injecte d'abord le CSS
injectCSS();

// Lance la fonction d'ajout du lien dl
addActionDownload();

// Lance la fonction d'ajout de la note
addEvaluation();