/**
 * page_injector.js
 * Injeta scripts diretamente no DOM da página original para interceptar chamadas
 * de rede (Fetch/GraphQL) e eventos de navegação da History API (SPA).
 */

const PageInjector = (() => {
    function inject(scriptPath = 'scripts/inject.js') {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(scriptPath);
        script.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(script);
    }

    return {
        inject
    };
})();

