/**
 * risk_criteria.js
 * Catálogo e dados dos critérios de classificação de risco obstétrico e clínico.
 */

const AVALIACAO_CRITERIOS = {
    historiaReproductiva: {
        title: "História reprodutiva anterior",
        items: [
            { title: "Abortos precoces (até 12 sem), até 2 consecutivos", badge: "1pt", risk: false },
            { title: "Abortamento habitual (>= 3 consecutivos)", badge: "ALTO RISCO", risk: true },
            { title: "Aborto tardio ou morte perinatal", badge: "ALTO RISCO", risk: true },
            { title: "Insulficiência istmo-cervical", badge: "S", subtitle: "Sinalizador clínico", risk: false },
            { title: "Alterações no crescimento intrauterino (RCF, macrossomia)", badge: "S", subtitle: "Sinalizador clínico", risk: false },
            { title: "Malformação fetal ou doença genética", badge: "S", subtitle: "Sinalizador clínico", risk: false },
            { title: "Nuliparidade ou multiparidade (≥5 partos)", badge: "1pt", risk: false },
            { title: "Diabetes gestacional", badge: "2pt", risk: false },
            { title: "Síndromes hemorrágicas ou hipertensivas sem gravidade", badge: "1pt", risk: false },
            { title: "Pré-eclâmpsia grave, eclâmpsia ou HELLP", badge: "1pt", subtitle: "Sinalizador clínico", risk: false },
            { title: "Infertilidade", badge: "1pt", risk: false },
            { title: "Cesarianas prévias (2 ou mais)", badge: "1pt", risk: false },
            { title: "Intervalo interpartal <2 anos", badge: "1pt", risk: false },
            { title: "Isoimunização Rh em gestação anterior", badge: "ALTO RISCO", risk: true },
            { title: "Acretismo placentário", badge: "ALTO RISCO", risk: true },
            { title: "Prematuridade anterior", badge: "ALTO RISCO", risk: true },
            { title: "Cesariana prévia com incisão clássica/corporal", badge: "ALTO RISCO", risk: true }
        ]
    },
    condicoesSociais: {
        title: "Condições sociais e comportamentais",
        items: [
            { title: "Condições de trabalho desfavoráveis (esforço, carga horária, agentes nocivos, estresse)", subtitle: "Assistência social", badge: "AS", risk: false },
            { title: "Indícios ou ocorrência de violência doméstica ou de gênero", subtitle: "Assistência social", badge: "AS", risk: false },
            { title: "Situação conjugal insegura", badge: "AS", subtitle: "Assistência social", risk: false },
            { title: "Insuficiência de apoio familiar", badge: "AS", subtitle: "Assistência social", risk: false },
            { title: "Capacidade de autocuidado insuficiente", subtitle: "Assistência social", badge: "AS", risk: false },
            { title: "Não aceitação da gestação", subtitle: "Assistência social", badge: "AS", risk: false },
            { title: "Baixa escolaridade (<5 anos de estudo)", subtitle: "Assistência social", badge: "AS", risk: false },
            { title: "Situação de rua, comunidade indígena, quilombola ou migrante", subtitle: "Assistência social", badge: "AS", risk: false },
            { title: "Gestação resultante de estupro", subtitle: "Assistência social", badge: "AS", risk: false },
            { title: "Tabagismo (abre Escala de Fagerström)", subtitle: "Assistência social", badge: "AS", risk: false },
            { title: "Uso de medicamentos teratogênicos", badge: "2pt", risk: false },
            { title: "Uso de drogas lícitas e ilícitas (sem dependência)", badge: "2pt", risk: false },
            { title: "Etilismo com indicativo de dependência", badge: "3pt AP", subtitle: "Atenção psicossocial", risk: false },
            { title: "Dependência e/ou uso abusivo de drogas", badge: "3pt AP", subtitle: "Atenção psicossocial", risk: false },
            { title: "Agravos alimentares/nutricionais (IMC ≥40, desnutrição, transtornos alimentares)", badge: "AS", subtitle: "Assistência Social", risk: false },
            { title: "Outras condições de saúde de menor complexidade", badge: "1pt", risk: false }
        ]
    },
    condicoesClinicasPreExistentes: {
        title: "Condições clínicas pré-existentes",
        items: [
            { title: "Depressão e ansiedade leve/moderada", badge: "CC", subtitle: "Cuidado Compartilhado", risk: false },
            { title: "Asma controlada sem medicação contínua", badge: "CC", subtitle: "Cuidado Compartilhado", risk: false },
            { title: "Hipotireoidismo subclínico diagnosticado na gestação", badge: "CC", subtitle: "Cuidado Compartilhado", risk: false },
            { title: "Pneumopatias graves (asma c/ medicação contínua, DPOC, fibrose cística)", badge: "TEp", subtitle: "Teleconsulta em Pneumologia", risk: false },
            { title: "Nefropatias graves (insuficiência renal, rins policísticos)", badge: "TEn", subtitle: "Teleconsulta em Nefrologia", risk: false },
            { title: "Endocrinopatias (hipotireoidismo clínico medicado, hipertireoidismo)", badge: "TEc", subtitle: "Teleconsulta em Endocrinologia", risk: false },
            { title: "Doenças hematológicas (falciforme, PTI, talassemia, coagulopatias)", badge: "TEh", subtitle: "Teleconsulta em Hematologia", risk: false },
            { title: "Histórico de tromboembolismo", badge: "TEh", subtitle: "Teleconsulta em Hematologia", risk: false },
            { title: "Doenças neurológicas (epilepsia, AVC, déficits motores graves)", badge: "TEneu", subtitle: "Teleconsulta em Neurologia", risk: false },
            { title: "Doenças autoimunes (LES, SAAF, artrite reumatoide)", badge: "TEr", subtitle: "Teleconsulta em Reumatologia", risk: false },
            { title: "Ginecopatias (malformações uterinas, miomas, cirurgia uterina)", badge: "TEg", subtitle: "Teleconsulta em Ginecologia", risk: false },
            { title: "Neoplasias — suspeita, diagnosticada ou em tratamento", badge: "Onc", subtitle: "Encaminhamento para Oncologia", risk: false },
            { title: "Transplantada", badge: "ALTO RISCO TRt", subtitle: "Teleconsulta em Transplante", risk: true },
            { title: "Cirurgia bariátrica", badge: "TEe", subtitle: "Teleconsulta em Endocrinologia", risk: false },
            { title: "Tuberculose, hanseníase, hepatites, condiloma extenso", badge: "TEi", subtitle: "Teleconsulta em Infectologia", risk: false },
            { title: "Diagnóstico de HIV/aids prévio", badge: "TEi", subtitle: "Teleconsulta em Infectologia", risk: false },
            { title: "Transtorno mental grave (psicose, depressão grave)", badge: "TEpsi", subtitle: "Teleconsulta em Psiquiatria", risk: false },
            { title: "Gestação de homem transexual", badge: "ALTO RISCO", risk: true }
        ]
    },
    intercorrenciasGestacaoAtual: {
        title: "Intercorrência da gestação atual",
        items: [
            { title: "Gestação gemelar dicoriônica-diamniótica", badge: "3pt", risk: false },
            { title: "Diabetes gestacional controlada sem medicação", badge: "2pt", risk: false },
            { title: "Diabetes gestacional com insulina ou repercussão fetal", badge: "ALTO RISCO", risk: true },
            { title: "Hipertensão gestacional / pré-eclâmpsia sem gravidade", badge: "2pt", risk: false },
            { title: "Pré-eclâmpsia com sinais de gravidade ou precoce (<34 sem)", badge: "ALTO RISCO", risk: true },
            { title: "Infecção urinária (até 2) ou 1 pielonefrite", badge: "1pt", risk: false },
            { title: "ITU de repetição (≥3 ITU baixa ou ≥2 pielonefrites)", badge: "ALTO RISCO", risk: true },
            { title: "Ganho de peso inadequado", badge: "1pt", risk: false },
            { title: "Sífilis tratável, toxoplasmose s/ repercussão, herpes simples", badge: "1pt", risk: false },
            { title: "Sífilis resistente/terciária, toxo c/ repercussão, rubéola, CMV, HIV na gestação", badge: "ALTO RISCO", risk: true },
            { title: "Suspeita/confirmação de dengue, Zika ou Chikungunya", badge: "1pt", risk: false },
            { title: "Restrição de crescimento fetal suspeita", badge: "3pt", risk: false },
            { title: "Restrição de crescimento fetal confirmada", badge: "ALTO RISCO", risk: true },
            { title: "Feto acima do percentil 90", badge: "3pt", risk: false },
            { title: "Mola hidatiforme", badge: "ALTO RISCO", risk: true },
            { title: "Gestação gemelar monocoriônica", badge: "ALTO RISCO", risk: true },
            { title: "Gestação multifetal (>1 feto)", badge: "ALTO RISCO", risk: true },
            { title: "Gestação por reprodução assistida", badge: "ALTO RISCO", risk: true },
            { title: "Malformação fetal ou arritmia cardíaca fetal", badge: "ALTO RISCO", risk: true },
            { title: "Tromboembolismo na gestação", badge: "ALTO RISCO", risk: true },
            { title: "Desvios da quantidade de líquido amniótico", badge: "ALTO RISCO", risk: true },
            { title: "Isoimunização Rh", badge: "ALTO RISCO", risk: true },
            { title: "Insuficiência istmo-cervical na gestação atual", badge: "ALTO RISCO", risk: true },
            { title: "Trabalho de parto pré-termo inibido", badge: "ALTO RISCO", risk: true },
            { title: "Placenta prévia (confirmada após 22 sem)", badge: "ALTO RISCO", risk: true },
            { title: "Acretismo placentário", badge: "ALTO RISCO", risk: true },
            { title: "Colestase gestacional", badge: "ALTO RISCO", risk: true },
            { title: "Patologia clínica que exige obstetra na Policlínica", badge: "ALTO RISCO", risk: true }
        ]
    }
};

const SINAIS_URGENCIA = {
    sinaisUrgencia: {
        title: "Sinais de Urgência",
        subtitle: "Sempre disponíveis · marcar dispara orientação imediata",
        itens: [
            { title: "Vômitos incoercíveis não responsivos ao tratamento" },
            { title: "Cefaleia intensa súbita, sinais neurológicos, crise asmática grave, EAP" },
            { title: "Sinais premonitórios de eclâmpsia (escotomas, cefaleia occipital, epigastralgia)" },
            { title: "Eclâmpsia / convulsões" },
            { title: "Hipertermia ≥37,8 °C sem infecção de vias aéreas" },
            { title: "Suspeita de trombose venosa profunda" },
            { title: "Suspeita/diagnóstico de abdome agudo" },
            { title: "Pielonefrite, infecção ovular ou infecção com internação" },
            { title: "Prurido gestacional / icterícia" },
            { title: "Hemorragias (DPP, placenta prévia, aborto)" }
        ]
    }
}

const RiskCriteria = {
    getCriterios: () => AVALIACAO_CRITERIOS,
    getCriterio: (key) => AVALIACAO_CRITERIOS[key],
    getSinaisUrgencia: () => SINAIS_URGENCIA
};

