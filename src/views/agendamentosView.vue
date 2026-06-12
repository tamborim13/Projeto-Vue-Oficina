<!-- src/views/agendamentosView.vue -->
<script setup>
import { ref, computed, onMounted } from "vue";
import { db } from "../firebase/config";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

const hoje = new Date();
const mesAtual = ref(hoje.getMonth());
const anoAtual = ref(hoje.getFullYear());
const diaSelecionado = ref(null);
const agendamentos = ref([]);
const modalAberto = ref(false);
const novoAgendamento = ref({ carroId: "", nome: "", marca: "", placa: "", problema: "", data: "" });
const carros = ref([]);

const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const diasDoMes = computed(() => {
    const primeiro = new Date(anoAtual.value, mesAtual.value, 1);
    const ultimo = new Date(anoAtual.value, mesAtual.value + 1, 0);
    const dias = [];
    for (let i = 0; i < primeiro.getDay(); i++) dias.push(null);
    for (let d = 1; d <= ultimo.getDate(); d++) dias.push(d);
    return dias;
});

const agendamentosPorDia = computed(() => {
    const map = {};
    agendamentos.value.forEach(a => {
        if (!map[a.data]) map[a.data] = [];
        map[a.data].push(a);
    });
    return map;
});

const excluirAgendamento = async (id) => {
    await deleteDoc(doc(db, "agendamentos", id));
    await buscarDados();
};

const dataFormatada = (dia) => {
    const m = String(mesAtual.value + 1).padStart(2, "0");
    const d = String(dia).padStart(2, "0");
    return `${anoAtual.value}-${m}-${d}`;
};

const agendamentosDoDia = computed(() => {
    if (!diaSelecionado.value) return [];
    return agendamentosPorDia.value[dataFormatada(diaSelecionado.value)] || [];
});

const temAgendamento = (dia) => {
    return !!agendamentosPorDia.value[dataFormatada(dia)]?.length;
};

const mesAnterior = () => {
    if (mesAtual.value === 0) { mesAtual.value = 11; anoAtual.value--; }
    else mesAtual.value--;
    diaSelecionado.value = null;
};

const proximoMes = () => {
    if (mesAtual.value === 11) { mesAtual.value = 0; anoAtual.value++; }
    else mesAtual.value++;
    diaSelecionado.value = null;
};

const buscarDados = async () => {
    const [snapAgend, snapCarros] = await Promise.all([
        getDocs(query(collection(db, "agendamentos"), orderBy("criadoEm", "desc"))),
        getDocs(collection(db, "carros"))
    ]);
    agendamentos.value = snapAgend.docs.map(d => ({ id: d.id, ...d.data() }));
    carros.value = snapCarros.docs.map(d => ({ id: d.id, ...d.data() }));
};

const selecionarCarro = () => {
    const carro = carros.value.find(c => c.id === novoAgendamento.value.carroId);
    if (carro) {
        novoAgendamento.value.nome = carro.nome;
        novoAgendamento.value.marca = carro.marca;
        novoAgendamento.value.placa = carro.placa;
        novoAgendamento.value.problema = carro.problema;
    }
};

const salvarAgendamento = async () => {
    if (!novoAgendamento.value.data || !novoAgendamento.value.nome) return;
    await addDoc(collection(db, "agendamentos"), {
        ...novoAgendamento.value,
        criadoEm: new Date()
    });
    modalAberto.value = false;
    await buscarDados();
};

onMounted(buscarDados);
</script>

<template>
    <div class="page">
        <div class="topbar">
            <div>
                <h1>Agendamentos</h1>
                <p>Clique em uma data para ver os agendamentos</p>
            </div>
            <button class="btn-add" @click="modalAberto = true">+ Novo agendamento</button>
        </div>

        <div class="content">
            <div class="layout">
                <!-- Calendário -->
                <div class="calendario">
                    <div class="cal-header">
                        <button class="cal-nav" @click="mesAnterior">‹</button>
                        <span class="cal-titulo">{{ meses[mesAtual] }} {{ anoAtual }}</span>
                        <button class="cal-nav" @click="proximoMes">›</button>
                    </div>
                    <div class="cal-grid">
                        <div class="cal-dia-semana" v-for="d in diasSemana" :key="d">{{ d }}</div>
                        <div v-for="(dia, i) in diasDoMes" :key="i" class="cal-dia" :class="{
                            vazio: !dia,
                            hoje: dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear(),
                            selecionado: dia === diaSelecionado,
                            'tem-agendamento': dia && temAgendamento(dia)
                        }" @click="dia && (diaSelecionado = dia)">
                            <span v-if="dia">{{ dia }}</span>
                            <div class="cal-dot" v-if="dia && temAgendamento(dia)"></div>
                        </div>
                    </div>
                </div>

                <!-- Painel lateral -->
                <div class="painel">
                    <div class="painel-header">
                        <h2 v-if="diaSelecionado">
                            {{ diaSelecionado }} de {{ meses[mesAtual] }}
                        </h2>
                        <h2 v-else>Selecione uma data</h2>
                    </div>

                    <div class="empty-painel" v-if="!diaSelecionado">
                        <span>📅</span>
                        <p>Clique em um dia no calendário para ver os agendamentos</p>
                    </div>

                    <div class="empty-painel" v-else-if="agendamentosDoDia.length === 0">
                        <span>🚗</span>
                        <p>Nenhum agendamento para este dia</p>
                    </div>

                    <div class="agend-list" v-else>
                        <div class="agend-card" v-for="a in agendamentosDoDia" :key="a.id">
                            <div class="agend-top">
                                <h3>{{ a.nome }}</h3>
                                <span class="agend-placa">{{ a.placa }}</span>
                            </div>
                            <p class="agend-marca">{{ a.marca }}</p>
                            <div class="agend-row"><span>Problema</span><strong>{{ a.problema }}</strong></div>
                            <button class="btn-excluir" @click="excluirAgendamento(a.id)">🗑 Excluir
                                agendamento</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal novo agendamento -->
        <div class="overlay" :class="{ open: modalAberto }" @click.self="modalAberto = false">
            <div class="modal">
                <div class="modal-header">
                    <div>
                        <h2>Novo agendamento</h2>
                        <p>Selecione o carro e a data</p>
                    </div>
                    <button class="btn-close" @click="modalAberto = false">✕</button>
                </div>
                <div class="form-grid">
                    <div class="field full">
                        <label>Selecionar carro cadastrado</label>
                        <select v-model="novoAgendamento.carroId" @change="selecionarCarro">
                            <option value="">— Selecione um carro —</option>
                            <option v-for="c in carros" :key="c.id" :value="c.id">
                                {{ c.nome }} • {{ c.placa }}
                            </option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Nome do carro</label>
                        <input v-model="novoAgendamento.nome" type="text" placeholder="Ex: Civic 2021" />
                    </div>
                    <div class="field">
                        <label>Marca</label>
                        <input v-model="novoAgendamento.marca" type="text" placeholder="Ex: Honda" />
                    </div>
                    <div class="field">
                        <label>Placa</label>
                        <input v-model="novoAgendamento.placa" type="text" placeholder="Ex: ABC-1234" />
                    </div>
                    <div class="field">
                        <label>Data do agendamento</label>
                        <input v-model="novoAgendamento.data" type="date" />
                    </div>
                    <div class="field full">
                        <label>Problema</label>
                        <input v-model="novoAgendamento.problema" type="text" placeholder="Ex: Troca de óleo" />
                    </div>
                </div>
                <button class="btn-salvar" @click="salvarAgendamento">✓ Salvar agendamento</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600&display=swap');

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Sora', sans-serif;
}

.page {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.topbar {
    padding: 1.25rem 1.75rem;
    border-bottom: 1px solid #1e3d5c;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.topbar h1 {
    font-size: 1.05rem;
    font-weight: 600;
    color: #e8f1fb;
}

.topbar p {
    font-size: .78rem;
    color: #3d6a8a;
    margin-top: 2px;
}

.btn-add {
    padding: .55rem 1rem;
    background: #185fa5;
    border: none;
    border-radius: 8px;
    color: #e8f4ff;
    font-size: .8rem;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
}

.btn-add:hover {
    background: #1e6fc0;
}

.content {
    padding: 1.5rem 1.75rem;
    flex: 1;
}

.layout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.calendario {
    background: #0f2033;
    border: 1px solid #1e3d5c;
    border-radius: 14px;
    padding: 1.25rem;
}

.cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
}

.cal-titulo {
    font-size: .95rem;
    font-weight: 600;
    color: #e8f1fb;
}

.cal-nav {
    background: none;
    border: 1px solid #1e3d5c;
    border-radius: 6px;
    color: #7eb8f7;
    font-size: 1.2rem;
    width: 30px;
    height: 30px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.cal-nav:hover {
    background: #1e3d5c;
}

.cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: .3rem;
}

.cal-dia-semana {
    text-align: center;
    font-size: .68rem;
    color: #3d6a8a;
    font-weight: 600;
    padding: .3rem 0;
}

.cal-dia {
    position: relative;
    text-align: center;
    padding: .55rem .2rem;
    font-size: .82rem;
    color: #5a8ab0;
    border-radius: 8px;
    cursor: pointer;
    transition: all .15s;
    min-height: 38px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.cal-dia:not(.vazio):hover {
    background: #1e3d5c;
    color: #e8f1fb;
}

.cal-dia.hoje {
    color: #7eb8f7;
    font-weight: 600;
}

.cal-dia.selecionado {
    background: #185fa5;
    color: #e8f4ff;
}

.cal-dia.tem-agendamento {
    color: #e8f1fb;
}

.cal-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #378add;
    margin-top: 2px;
}

.cal-dia.selecionado .cal-dot {
    background: #fff;
}

.painel {
    background: #0f2033;
    border: 1px solid #1e3d5c;
    border-radius: 14px;
    padding: 1.25rem;
}

.painel-header {
    margin-bottom: 1rem;
    padding-bottom: .75rem;
    border-bottom: 1px solid #1e3d5c;
}

.painel-header h2 {
    font-size: .95rem;
    font-weight: 600;
    color: #e8f1fb;
}

.empty-painel {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .75rem;
    padding: 3rem 1rem;
    color: #3d6a8a;
    font-size: .82rem;
    text-align: center;
}

.empty-painel span {
    font-size: 2rem;
}

.agend-list {
    display: flex;
    flex-direction: column;
    gap: .75rem;
}

.agend-card {
    background: #0b1a2d;
    border: 1px solid #1e3d5c;
    border-radius: 10px;
    padding: .9rem 1rem;
}

.agend-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: .25rem;
}

.agend-top h3 {
    font-size: .88rem;
    font-weight: 600;
    color: #e8f1fb;
}

.agend-placa {
    font-size: .72rem;
    font-weight: 600;
    background: rgba(55, 138, 221, .15);
    color: #7eb8f7;
    border: 1px solid rgba(55, 138, 221, .3);
    padding: .2rem .5rem;
    border-radius: 5px;
}

.agend-marca {
    font-size: .75rem;
    color: #5a8ab0;
    margin-bottom: .5rem;
}

.agend-row {
    display: flex;
    justify-content: space-between;
}

.agend-row span {
    font-size: .75rem;
    color: #5a8ab0;
}

.agend-row strong {
    font-size: .75rem;
    color: #b8d8f8;
    font-weight: 500;
}

.overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, .6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    opacity: 0;
    pointer-events: none;
    transition: opacity .2s;
}

.overlay.open {
    opacity: 1;
    pointer-events: all;
}

.modal {
    background: #0f2033;
    border: 1px solid #1e3d5c;
    border-radius: 16px;
    width: 90%;
    max-width: 500px;
    padding: 1.75rem;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.25rem;
}

.modal-header h2 {
    font-size: 1rem;
    font-weight: 600;
    color: #e8f1fb;
}

.modal-header p {
    font-size: .78rem;
    color: #5a8ab0;
    margin-top: 3px;
}

.btn-close {
    background: none;
    border: none;
    color: #5a8ab0;
    cursor: pointer;
    font-size: 20px;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .85rem;
    margin-bottom: 1.25rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: .35rem;
}

.field.full {
    grid-column: span 2;
}

.field label {
    font-size: .75rem;
    font-weight: 500;
    color: #7eb8f7;
}

.field input,
.field select {
    background: #0b1a2d;
    border: 1px solid #1e3d5c;
    border-radius: 8px;
    padding: .6rem .85rem;
    font-size: .85rem;
    color: #d0e8ff;
    outline: none;
    font-family: 'Sora', sans-serif;
    transition: border-color .2s;
}

.field input::placeholder {
    color: #2d5070;
}

.field input:focus,
.field select:focus {
    border-color: #378add;
}

.field select option {
    background: #0f2033;
}

.btn-salvar {
    width: 100%;
    padding: .75rem;
    background: #185fa5;
    border: none;
    border-radius: 8px;
    color: #e8f4ff;
    font-size: .9rem;
    font-weight: 600;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
}

.btn-salvar:hover {
    background: #1e6fc0;
}

.btn-excluir {
    width: 100%;
    margin-top: .75rem;
    padding: .45rem;
    border: 1px solid rgba(162,45,45,.3);
    background: rgba(162,45,45,.1);
    border-radius: 7px;
    color: #f09595;
    font-size: .75rem;
    font-weight: 500;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
    transition: background .15s;
}

.btn-excluir:hover {
    background: rgba(162,45,45,.2);
}
</style>