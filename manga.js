document.addEventListener('DOMContentLoaded', () => {
    
    /* =================================================================
       1. SELEÇÃO DE GÊNERO
    ================================================================= */
    let currentGenre = ""; 
    const genreButtons = document.querySelectorAll('.genre-btn');
    
    genreButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            genreButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentGenre = btn.getAttribute('data-value');
        });
    });

    /* =================================================================
       2. FUNÇÃO DE TRADUÇÃO (NOVIDADE!)
    ================================================================= */
    async function traduzirTexto(textoIngles) {
        if (!textoIngles) return "Sinopse indisponível.";

        try {
            // A API gratuita tem limite de tamanho, então pegamos os primeiros 500 caracteres
            // para garantir que a tradução funcione rápido.
            const textoParaTraduzir = textoIngles.substring(0, 500);
            
            const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textoParaTraduzir)}&langpair=en|pt`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            // Se o texto original era maior que 500 caracteres, adicionamos "..."
            let textoTraduzido = data.responseData.translatedText;
            if (textoIngles.length > 500) {
                textoTraduzido += "... (leia mais no site oficial)";
            }
            
            return textoTraduzido;

        } catch (error) {
            console.error("Erro ao traduzir:", error);
            // Se a tradução falhar (internet ou limite), mostra em inglês mesmo
            return textoIngles;
        }
    }

    /* =================================================================
       3. LÓGICA DO MANGÁ
    ================================================================= */
    const mangaButton = document.getElementById('manga-button');
    const mangaContainer = document.getElementById('manga-container');
    const loadingSpinner = document.getElementById('loadingSpinner');

    async function fetchRandomMangaWithFilter(genre) {
        try {
            let manga;
            let attempts = 0;
            const maxAttempts = 15;

            do {
                attempts++;
                const response = await fetch('https://api.jikan.moe/v4/random/manga');
                if (!response.ok) throw new Error('Erro na API');
                
                const data = await response.json();
                manga = data.data;

                let hasGenre = true;
                if (genre && manga.genres) {
                    hasGenre = manga.genres.some(g => g.name.toLowerCase() === genre.toLowerCase());
                }

                const isSafe = !manga.genres.some(g => g.name === 'Hentai' || g.name === 'Erotica');
                
                if (!hasGenre || !isSafe) manga = null;
                if (attempts >= maxAttempts) return null;

            } while (!manga); 

            return manga;
        } catch (error) {
            console.error('Erro ao buscar mangá:', error);
            return null;
        }
    }

    async function showRandomManga() {
        if (!mangaButton) return;

        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (mangaContainer) mangaContainer.innerHTML = ''; 

        // 1. Busca o Mangá
        const manga = await fetchRandomMangaWithFilter(currentGenre);
        
        if (manga && mangaContainer) {
            const title = manga.title_english || manga.title;
            const author = (manga.authors && manga.authors.length > 0) ? manga.authors[0].name : "Autor desconhecido";
            const rawSynopsis = manga.synopsis ? manga.synopsis : "Sinopse indisponível.";
            const year = manga.published && manga.published.prop && manga.published.prop.from.year ? manga.published.prop.from.year : "?";
            
            // 2. CHAMA A TRADUÇÃO (Isso pode levar +1 segundo)
            // Enquanto traduz, mudamos o texto do spinner se quiser, ou só esperamos
            const translatedSynopsis = await traduzirTexto(rawSynopsis);

            let linkAction = manga.url;
            if (!linkAction) {
                linkAction = `https://www.google.com/search?q=manga+${encodeURIComponent(title)}`;
            }

            mangaContainer.innerHTML = `
                <div class="manga-card">
                    <div class="img-container">
                        <img src="${manga.images.jpg.large_image_url}" alt="${title}">
                    </div>
                    <div class="content">
                        <h2>${title}</h2>
                        <div class="meta">
                            ⭐ ${manga.score || 'N/A'} | ✍️ ${author} | 📅 ${year}
                        </div>
                        <p class="synopsis">${translatedSynopsis}</p>
                        <a href="${linkAction}" target="_blank" class="btn-link">📖 Ler Sobre / Ver Mais</a>
                    </div>
                </div>
            `;
        } else if (mangaContainer) {
            const genreName = currentGenre ? `de ${currentGenre}` : "";
            mangaContainer.innerHTML = `<p>Não encontrei um mangá ${genreName} legal agora. Tente de novo!</p>`;
        }
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }

    if (mangaButton) {
        mangaButton.addEventListener('click', showRandomManga);
    }

    /* =================================================================
       4. LÓGICA DO ANIME (MANTIDA)
    ================================================================= */
    const animeButton = document.getElementById('anime-button');
    const animeContainer = document.getElementById('anime-container');

    async function fetchRandomAnimeWithFilter(genre) {
        try {
            let anime;
            let attempts = 0;
            const maxAttempts = 15;
            do {
                attempts++;
                const response = await fetch('https://api.jikan.moe/v4/random/anime');
                if (!response.ok) throw new Error('Erro API');
                const data = await response.json();
                anime = data.data;

                if (genre && anime.genres) {
                    const hasGenre = anime.genres.some(g => g.name.toLowerCase() === genre.toLowerCase());
                    if (!hasGenre) anime = null;
                }
                if (attempts >= maxAttempts) return null;
            } while (!anime || anime.type !== 'TV');
            return anime;
        } catch (error) { return null; }
    }

    async function showRandomAnime() {
        if(!animeButton) return;
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (animeContainer) animeContainer.innerHTML = ''; 

        const anime = await fetchRandomAnimeWithFilter(currentGenre);
        
        if (anime && animeContainer) {
            // Se quiser traduzir anime também, use: await traduzirTexto(anime.synopsis)
            animeContainer.innerHTML = `
                <h2>${anime.title}</h2>
                <img src="${anime.images.jpg.large_image_url}" alt="${anime.title}" style="max-width: 100%; height: 300px; margin-top: 15px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
                <div style="margin-top: 15px;">
                    <p style="font-size: 1rem;">Nota: <strong>${anime.score || 'N/A'}</strong> ⭐</p>
                    <p style="font-size: 0.9rem; opacity: 0.8;">Episódios: ${anime.episodes || '?'}</p>
                    <p style="font-size: 0.8rem; margin-top: 5px; color: var(--header-bg);">${anime.year || ''}</p>
                </div>
            `;
        } else if (animeContainer) {
            animeContainer.innerHTML = `<p>Não encontrado. Tente novamente!</p>`;
        }
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }

    if (animeButton) {
        animeButton.addEventListener('click', showRandomAnime);
    }

    /* =================================================================
       5. MENU E TEMA
    ================================================================= */
    const navbarMenu = document.getElementById("menu");
    const burgerMenu = document.getElementById("burger");
    if (burgerMenu && navbarMenu) {
        burgerMenu.addEventListener("click", () => {
            burgerMenu.classList.toggle("is-active");
            navbarMenu.classList.toggle("is-active");
        });
    }
    document.querySelectorAll(".menu-link").forEach((link) => {
        link.addEventListener("click", () => {
            if(burgerMenu) burgerMenu.classList.remove("is-active");
            if(navbarMenu) navbarMenu.classList.remove("is-active");
        });
    });

    const toggleBtn = document.getElementById("theme-toggle");
    const html = document.documentElement;
    const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>`;
    const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>`;

    function updateIcon(theme) {
        if (!toggleBtn) return;
        toggleBtn.innerHTML = theme === "dark" ? sunIcon : moonIcon;
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        html.setAttribute("data-theme", savedTheme);
        updateIcon(savedTheme);
    } else {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        if (systemDark) {
            html.setAttribute("data-theme", "dark");
            updateIcon("dark");
        } else {
            updateIcon("light");
        }
    }

    if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            const currentTheme = html.getAttribute("data-theme");
            const newTheme = currentTheme === "dark" ? "light" : "dark";
            html.setAttribute("data-theme", newTheme);
            localStorage.setItem("theme", newTheme);
            updateIcon(newTheme);
        });
    }
});
