/**
 * reopen_button.js
 * Botão flutuante exibido no canto inferior direito quando a sidebar está minimizada.
 */

const LensReopenButton = (() => {
    function show(onReopen) {
        let btn = document.getElementById("esus-lens-reopen");
        if (btn) {
            btn.style.display = "flex";
            return;
        }

        btn = document.createElement("button");
        btn.id = "esus-lens-reopen";
        btn.innerHTML = "🩺 e-SUS Lens";
        btn.title = "Abrir Painel de Estratificação";

        btn.style.position = "fixed";
        btn.style.bottom = "24px";
        btn.style.right = "24px";
        btn.style.backgroundColor = "#1351b4";
        btn.style.color = "white";
        btn.style.border = "none";
        btn.style.borderRadius = "24px";
        btn.style.padding = "10px 20px";
        btn.style.fontSize = "0.9rem";
        btn.style.fontWeight = "bold";
        btn.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2)";
        btn.style.cursor = "pointer";
        btn.style.zIndex = "999999";
        btn.style.display = "flex";
        btn.style.alignItems = "center";
        btn.style.gap = "8px";

        btn.addEventListener("click", () => {
            btn.style.display = "none";
            if (typeof onReopen === "function") {
                onReopen();
            }
        });

        document.body.appendChild(btn);
    }

    function hide() {
        const btn = document.getElementById("esus-lens-reopen");
        if (btn) {
            btn.style.display = "none";
        }
    }

    return {
        show,
        hide
    };
})();

// Compatibilidade global legada
function showReopenButton(sidebarRef) {
    LensReopenButton.show(() => {
        if (sidebarRef) {
            sidebarRef.style.transform = "translateX(0)";
            document.body.style.paddingRight = "400px";
        }
        LensStore.setSidebarOpen(true);
        isSidebarOpen = true;
    });
}

