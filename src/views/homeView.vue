<script setup>
import { ref, onMounted } from "vue";
import { db } from "../firebase/config";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    orderBy,
    query
} from "firebase/firestore";

const modalAberto = ref(false);
const modalAdicionarAberto = ref(false);
const carroSelecionado = ref(null);
const carros = ref([]);
const carregando = ref(false);

const novoCarro = ref({
    nome: "", marca: "", cor: "", placa: "", problema: "", data: "", status: "aguardando", fipe: "", conserto: ""
});

const statusLabel = { aguardando: "Aguardando", "em-andamento": "Em andamento", concluido: "Concluído" };

// Busca carros do Firestore
const buscarCarros = async () => {
    carregando.value = true;
    try {
        const q = query(collection(db, "carros"), orderBy("criadoEm", "desc"));
        const snapshot = await getDocs(q);
        carros.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error(e);
    } finally {
        carregando.value = false;
    }
};

// Adiciona carro no Firestore
const adicionarCarro = async () => {
    if (!novoCarro.value.nome || !novoCarro.value.placa) return;
    try {
        await addDoc(collection(db, "carros"), {
            ...novoCarro.value,
            criadoEm: new Date()
        });
        modalAdicionarAberto.value = false;
        await buscarCarros();
    } catch (e) {
        console.error(e);
    }
};

// Abre modal de detalhes
const abrirModal = (carro) => { carroSelecionado.value = carro; modalAberto.value = true; };
const fecharModal = () => { modalAberto.value = false; };

const abrirModalAdicionar = () => {
    novoCarro.value = { nome: "", marca: "", cor: "", placa: "", problema: "", data: "", status: "aguardando", fipe: "", conserto: "" };
    modalAdicionarAberto.value = true;
};

onMounted(buscarCarros);
</script>

<template>
    <div class="page">
        <div class="topbar">
            <div>
                <h1>Carros para arrumar</h1>
                <p>{{ carros.length }} veículos em atendimento</p>
            </div>
            <button class="btn-add" @click="abrirModalAdicionar">+ Adicionar carro</button>
        </div>

        <div class="content">
            <div class="stats">
                <div class="stat">
                    <div class="stat-label">Aguardando</div>
                    <div class="stat-value">{{carros.filter(c => c.status === 'aguardando').length}}</div>
                    <div class="stat-sub">veículos na fila</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Em andamento</div>
                    <div class="stat-value">{{carros.filter(c => c.status === 'em-andamento').length}}</div>
                    <div class="stat-sub">em manutenção</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Concluídos</div>
                    <div class="stat-value">{{carros.filter(c => c.status === 'concluido').length}}</div>
                    <div class="stat-sub">prontos para entrega</div>
                </div>
            </div>

            <!-- Lista vazia -->
            <div class="empty" v-if="carros.length === 0">
                <p>🚗</p>
                <span>Nenhum carro cadastrado ainda.</span>
                <button class="btn-add" @click="abrirModalAdicionar">+ Adicionar primeiro carro</button>
            </div>

            <div class="cards" v-else>
                <div class="card" v-for="carro in carros" :key="carro.id" @click="abrirModal(carro)">
                    <div class="card-top">
                        <div class="card-info">
                            <h3>{{ carro.nome }}</h3>
                            <p>{{ carro.marca }} • {{ carro.cor }} • {{ carro.placa }}</p>
                        </div>
                        <span class="badge" :class="carro.status">{{ statusLabel[carro.status] }}</span>
                    </div>
                    <div class="card-row"><span>Problema</span><strong>{{ carro.problema }}</strong></div>
                    <div class="card-row"><span>Entrada</span><strong>{{ carro.data }}</strong></div>
                    <div class="card-fipe">
                        <div>
                            <div class="fipe-label">Tabela FIPE</div>
                            <div class="fipe-value">{{ carro.fipe }}</div>
                        </div>
                        <div style="text-align:right">
                            <div class="fipe-label">Valor do conserto</div>
                            <div class="fipe-value">{{ carro.conserto }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal detalhes -->
        <div class="overlay" :class="{ open: modalAberto }" @click.self="fecharModal">
            <div class="modal" v-if="carroSelecionado">
                <div class="modal-header">
                    <div>
                        <h2>{{ carroSelecionado.nome }}</h2>
                        <p>{{ carroSelecionado.marca }} • {{ carroSelecionado.cor }}</p>
                    </div>
                    <button class="btn-close" @click="fecharModal">✕</button>
                </div>
                <div class="modal-section">
                    <div class="modal-section-title">Detalhes do veículo</div>
                    <div class="modal-row"><span>Placa</span><strong>{{ carroSelecionado.placa }}</strong></div>
                    <div class="modal-row"><span>Problema</span><strong>{{ carroSelecionado.problema }}</strong></div>
                    <div class="modal-row"><span>Data de entrada</span><strong>{{ carroSelecionado.data }}</strong>
                    </div>
                    <div class="modal-row"><span>Status</span><strong>{{ statusLabel[carroSelecionado.status]
                    }}</strong></div>
                </div>
                <div class="modal-section">
                    <div class="modal-section-title">Valores</div>
                    <div class="modal-fipe">
                        <div>
                            <div class="fipe-label">Tabela FIPE</div>
                            <div class="modal-fipe-value">{{ carroSelecionado.fipe }}</div>
                        </div>
                        <div style="text-align:right">
                            <div class="fipe-label">Conserto</div>
                            <div class="modal-fipe-value">{{ carroSelecionado.conserto }}</div>
                        </div>
                    </div>
                </div>
                <div class="modal-total"><span>💰 Total a receber</span><strong>{{ carroSelecionado.conserto }}</strong>
                </div>
            </div>
        </div>

        <!-- Modal adicionar carro -->
        <div class="overlay" :class="{ open: modalAdicionarAberto }" @click.self="modalAdicionarAberto = false">
            <div class="modal">
                <div class="modal-header">
                    <div>
                        <h2>Adicionar carro</h2>
                        <p>Preencha os dados do veículo</p>
                    </div>
                    <button class="btn-close" @click="modalAdicionarAberto = false">✕</button>
                </div>

                <div class="form-grid">
                    <div class="field">
                        <label>Nome do carro</label>
                        <input v-model="novoCarro.nome" type="text" placeholder="Ex: Civic 2021" />
                    </div>
                    <div class="field">
                        <label>Marca</label>
                        <input v-model="novoCarro.marca" type="text" placeholder="Ex: Honda" />
                    </div>
                    <div class="field">
                        <label>Cor</label>
                        <input v-model="novoCarro.cor" type="text" placeholder="Ex: Prata" />
                    </div>
                    <div class="field">
                        <label>Placa</label>
                        <input v-model="novoCarro.placa" type="text" placeholder="Ex: ABC-1234" />
                    </div>
                    <div class="field full">
                        <label>Problema relatado</label>
                        <input v-model="novoCarro.problema" type="text" placeholder="Ex: Freio dianteiro falhando" />
                    </div>
                    <div class="field">
                        <label>Data de entrada</label>
                        <input v-model="novoCarro.data" type="date" />
                    </div>
                    <div class="field">
                        <label>Status</label>
                        <select v-model="novoCarro.status">
                            <option value="aguardando">Aguardando</option>
                            <option value="em-andamento">Em andamento</option>
                            <option value="concluido">Concluído</option>
                        </select>
                    </div>
                    <div class="field">
                        <label>Tabela FIPE</label>
                        <input v-model="novoCarro.fipe" type="text" placeholder="Ex: R$ 112.400" />
                    </div>
                    <div class="field">
                        <label>Valor do conserto</label>
                        <input v-model="novoCarro.conserto" type="text" placeholder="Ex: R$ 850" />
                    </div>
                </div>

                <button class="btn-salvar" @click="adicionarCarro">✓ Salvar carro</button>
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
    display: inline-flex;
    align-items: center;
    gap: .5rem;
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

.stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: .85rem;
    margin-bottom: 1.5rem;
}

.stat {
    background: #0f2033;
    border: 1px solid #1e3d5c;
    border-radius: 10px;
    padding: .9rem 1rem;
}

.stat-label {
    font-size: .72rem;
    color: #3d6a8a;
    margin-bottom: .3rem;
}

.stat-value {
    font-size: 1.4rem;
    font-weight: 600;
    color: #e8f1fb;
}

.stat-sub {
    font-size: .7rem;
    color: #5a8ab0;
    margin-top: 2px;
}

.empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem 0;
    color: #3d6a8a;
    font-size: .85rem;
}

.empty p {
    font-size: 2.5rem;
}

.cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
}

.card {
    background: #0f2033;
    border: 1px solid #1e3d5c;
    border-radius: 12px;
    padding: 1.1rem;
    cursor: pointer;
    transition: all .2s;
}

.card:hover {
    border-color: #378add;
    transform: translateY(-2px);
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: .85rem;
}

.card-info h3 {
    font-size: .9rem;
    font-weight: 600;
    color: #e8f1fb;
}

.card-info p {
    font-size: .75rem;
    color: #5a8ab0;
    margin-top: 2px;
}

.badge {
    font-size: .68rem;
    font-weight: 600;
    padding: .25rem .6rem;
    border-radius: 20px;
}

.badge.aguardando {
    background: rgba(186, 117, 23, .15);
    color: #fac775;
    border: 1px solid rgba(186, 117, 23, .3);
}

.badge.em-andamento {
    background: rgba(23, 158, 117, .15);
    color: #5dcaa5;
    border: 1px solid rgba(23, 158, 117, .3);
}

.badge.concluido {
    background: rgba(55, 138, 221, .15);
    color: #7eb8f7;
    border: 1px solid rgba(55, 138, 221, .3);
}

.card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: .45rem;
}

.card-row span {
    font-size: .75rem;
    color: #5a8ab0;
}

.card-row strong {
    font-size: .78rem;
    color: #b8d8f8;
    font-weight: 500;
}

.card-fipe {
    display: flex;
    justify-content: space-between;
    background: #0b1a2d;
    border-radius: 7px;
    padding: .55rem .75rem;
    margin-top: .75rem;
}

.fipe-label {
    font-size: .68rem;
    color: #3d6a8a;
}

.fipe-value {
    font-size: .85rem;
    font-weight: 600;
    color: #7eb8f7;
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

.modal-section {
    margin-bottom: 1rem;
}

.modal-section-title {
    font-size: .7rem;
    font-weight: 600;
    color: #3d6a8a;
    text-transform: uppercase;
    letter-spacing: .5px;
    margin-bottom: .6rem;
}

.modal-row {
    display: flex;
    justify-content: space-between;
    padding: .45rem 0;
    border-bottom: 1px solid #1a2f48;
}

.modal-row:last-child {
    border-bottom: none;
}

.modal-row span {
    font-size: .8rem;
    color: #5a8ab0;
}

.modal-row strong {
    font-size: .8rem;
    color: #b8d8f8;
    font-weight: 500;
}

.modal-fipe {
    background: #0b1a2d;
    border-radius: 10px;
    padding: .85rem 1rem;
    display: flex;
    justify-content: space-between;
}

.fipe-label {
    font-size: .75rem;
    color: #3d6a8a;
}

.modal-fipe-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #7eb8f7;
}

.modal-total {
    background: rgba(24, 95, 165, .15);
    border: 1px solid rgba(55, 138, 221, .25);
    border-radius: 10px;
    padding: .85rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
}

.modal-total span {
    font-size: .8rem;
    color: #7eb8f7;
    font-weight: 500;
}

.modal-total strong {
    font-size: 1.1rem;
    font-weight: 600;
    color: #e8f1fb;
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
</style>