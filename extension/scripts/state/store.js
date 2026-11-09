/**
 * store.js
 * Gerenciamento centralizado de estado para a extensão e-SUS Lens.
 */

const LensStore = (() => {
    const state = {
        currentPatient: null,
        isSidebarOpen: false,
        userSelectedItems: {
            historiaReproductiva: [],
            condicoesSociais: [],
            condicoesClinicasPreExistentes: [],
            intercorrenciasGestacaoAtual: []
        }
    };

    function getPatient() {
        return state.currentPatient;
    }

    function setPatient(patient) {
        state.currentPatient = patient;
    }

    function isSidebarOpen() {
        return state.isSidebarOpen;
    }

    function setSidebarOpen(isOpen) {
        state.isSidebarOpen = Boolean(isOpen);
    }

    function getSelectedItems(criterioKey) {
        if (!criterioKey) return state.userSelectedItems;
        return state.userSelectedItems[criterioKey] || [];
    }

    function addSelectedItem(criterioKey, item) {
        if (!state.userSelectedItems[criterioKey]) {
            state.userSelectedItems[criterioKey] = [];
        }
        state.userSelectedItems[criterioKey].push(item);
    }

    function removeSelectedItem(criterioKey, item) {
        if (!state.userSelectedItems[criterioKey]) return;
        state.userSelectedItems[criterioKey] = state.userSelectedItems[criterioKey].filter(
            i => i.title !== item.title || i.badge !== item.badge
        );
    }

    function resetSelectedItems() {
        Object.keys(state.userSelectedItems).forEach(key => {
            state.userSelectedItems[key] = [];
        });
    }

    return {
        getPatient,
        setPatient,
        isSidebarOpen,
        setSidebarOpen,
        getSelectedItems,
        addSelectedItem,
        removeSelectedItem,
        resetSelectedItems,
        // Atalho para compatibilidade direta com referências legadas
        get userSelectedItems() {
            return state.userSelectedItems;
        }
    };
})();

// Mantém variável global legada para compatibilidade retroativa
let userSelectedItems = LensStore.userSelectedItems;

