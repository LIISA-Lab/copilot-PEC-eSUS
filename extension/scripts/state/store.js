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
        },
        clinicalInputs: {
            paSistolica: null,
            paDiastolica: null,
            peso: null,
            hemoglobina: null
        },
        sorologias: {
            hiv: '',
            hbsag: '',
            antiHcv: '',
            vdrl: ''
        },
        userSelectedUrgencias: []
    };

    function getPatient() {
        return state.currentPatient;
    }

    function setPatient(patient) {
        const prevId = state.currentPatient?.id || state.currentPatient?.cpf || state.currentPatient?.name;
        const newId = patient?.id || patient?.cpf || patient?.name;
        if (prevId && newId && prevId !== newId) {
            resetSelectedItems();
            resetClinicalInputs();
        }
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
        state.userSelectedUrgencias = [];
    }

    // --- Gestão de Sinais de Urgência ---
    function getSelectedUrgencias() {
        return state.userSelectedUrgencias;
    }

    function addSelectedUrgencia(item) {
        if (!state.userSelectedUrgencias.some(i => i.title === item.title)) {
            state.userSelectedUrgencias.push(item);
        }
    }

    function removeSelectedUrgencia(item) {
        state.userSelectedUrgencias = state.userSelectedUrgencias.filter(
            i => i.title !== item.title
        );
    }

    function resetSelectedUrgencias() {
        state.userSelectedUrgencias = [];
    }

    function hasSelectedUrgencias() {
        return state.userSelectedUrgencias.length > 0;
    }

    // --- Gestão de Dados Clínicos (PA, Peso, Hemoglobina, Sorologias) ---
    function getClinicalInputs() {
        return state.clinicalInputs;
    }

    function getClinicalInput(key) {
        return state.clinicalInputs[key];
    }

    function setClinicalInput(key, value) {
        state.clinicalInputs[key] = value;
    }

    function resetClinicalInputs() {
        state.clinicalInputs = {
            paSistolica: null,
            paDiastolica: null,
            peso: null,
            hemoglobina: null
        };
        state.sorologias = {
            hiv: '',
            hbsag: '',
            antiHcv: '',
            vdrl: ''
        };
    }

    function getSorologias() {
        return state.sorologias;
    }

    function getSorologia(key) {
        return state.sorologias[key];
    }

    function setSorologia(key, value) {
        state.sorologias[key] = value;
    }

    /**
     * Utilidade: Calcula o Índice de Massa Corporal (IMC)
     * @param {number} [peso] Peso em kg
     * @param {number} [altura] Altura em metros ou cm
     * @returns {number|null}
     */
    function calculateIMC(peso = state.clinicalInputs.peso, altura = null) {
        if (!peso) return null;
        let h = altura;
        if (!h && state.currentPatient) {
            h = state.currentPatient.altura || state.currentPatient.height;
        }
        if (!h) return null;
        if (h > 3) h = h / 100; // se informada em centímetros (ex: 165 -> 1.65)
        const imc = peso / (h * h);
        return parseFloat(imc.toFixed(1));
    }

    /**
     * Utilidade: Calcula a Pressão Arterial Média (PAM)
     * PAM = (2 * PAD + PAS) / 3
     */
    function calculatePAM(pas = state.clinicalInputs.paSistolica, pad = state.clinicalInputs.paDiastolica) {
        if (!pas || !pad) return null;
        const pam = (2 * pad + pas) / 3;
        return parseFloat(pam.toFixed(1));
    }

    /**
     * Utilidade: Avalia alertas clínicos baseados nos inputs
     */
    function getClinicalAlerts() {
        const pas = state.clinicalInputs.paSistolica;
        const pad = state.clinicalInputs.paDiastolica;
        const hb = state.clinicalInputs.hemoglobina;

        return {
            isHypertensive: (pas && pas >= 140) || (pad && pad >= 90),
            isHypotensive: (pas && pas < 90) || (pad && pad < 60),
            hasAnemia: hb && hb < 11,
            hasSevereAnemia: hb && hb < 8
        };
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
        getClinicalInputs,
        getClinicalInput,
        setClinicalInput,
        resetClinicalInputs,
        getSorologias,
        getSorologia,
        setSorologia,
        calculateIMC,
        calculatePAM,
        getClinicalAlerts,
        getSelectedUrgencias,
        addSelectedUrgencia,
        removeSelectedUrgencia,
        resetSelectedUrgencias,
        hasSelectedUrgencias,
        // Atalho para compatibilidade direta com referências legadas
        get userSelectedItems() {
            return state.userSelectedItems;
        }
    };
})();

// Mantém variável global legada para compatibilidade retroativa
let userSelectedItems = LensStore.userSelectedItems;

