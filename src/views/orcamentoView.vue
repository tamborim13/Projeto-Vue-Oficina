<script setup>
import { ref, onMounted } from "vue";
import { db } from "../firebase/config";
import {
    collection, addDoc, getDocs, updateDoc, deleteDoc, doc, orderBy, query
} from "firebase/firestore";

const modalAberto = ref(false);
const orcamentoSelecionado = ref(null);
const orcamentos = ref([]);
const carregando = ref(false);

const novoOrcamento = ref({
    nome: "", marca: "", cor: "", placa: "", problema: "",
    cliente: "", telefone: "", data: "", fipe: "", valor: ""
});

const statusLabel = {
    criado: "Criado",
    andamento: "Em andamento",
    finalizado: "Finalizado",
    cancelado: "Cancelado"
};

const nivelMap = { criado: 1, andamento: 2, finalizado: 3, cancelado: 0 };

const buscarOrcamentos = async () => {
    carregando.value = true;
    try {
        const q = query(collection(db, "orcamentos"), orderBy("criadoEm", "desc"));
        const snapshot = await getDocs(q);
        orcamentos.value = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error(e);
    } finally {
        carregando.value = false;
    }
};

const adicionarOrcamento = async () => {
    if (!novoOrcamento.value.nome || !novoOrcamento.value.placa) return;
    try {
        await addDoc(collection(db, "orcamentos"), {
            ...novoOrcamento.value,
            status: "criado",
            criadoEm: new Date()
        });
        modalAberto.value = false;
        await buscarOrcamentos();
    } catch (e) {
        console.error(e);
    }
};

const atualizarStatus = async (orcamento, novoStatus) => {
    try {
        const ref = doc(db, "orcamentos", orcamento.id);
        await updateDoc(ref, { status: novoStatus });

        // Se finalizado, envia para a home (coleção carros)
        if (novoStatus === "finalizado") {
            await addDoc(collection(db, "carros"), {
                nome: orcamento.nome,
                marca: orcamento.marca,
                cor: orcamento.cor,
                placa: orcamento.placa,
                problema: orcamento.problema,
                data: orcamento.data,
                fipe: orcamento.fipe,
                conserto: orcamento.valor,
                status: "aguardando",
                criadoEm: new Date()
            });
        }

        await buscarOrcamentos();
    } catch (e) {
        console.error(e);
    }
};

const excluirOrcamento = async (id) => {
    try {
        await deleteDoc(doc(db, "orcamentos", id));
        await buscarOrcamentos();
    } catch (e) {
        console.error(e);
    }
};

const abrirModal = (orc) => { orcamentoSelecionado.value = orc; };
const abrirModalAdicionar = () => {
    novoOrcamento.value = { nome: "", marca: "", cor: "", placa: "", problema: "", cliente: "", telefone: "", data: "", fipe: "", valor: "" };
    modalAberto.value = true;
};

onMounted(buscarOrcamentos);
</script>

<template>
    <div class="page">
        <div class="topbar">
            <div>
                <h1>Orçamentos</h1>
                <p>{{orcamentos.filter(o => o.status !== 'cancelado').length}} orçamentos ativos</p>
            </div>
            <button class="btn-add" @click="abrirModalAdicionar">+ Novo orçamento</button>
        </div>

        <div class="content">
            <div class="pipeline">
                <div class="pipe">
                    <div class="pipe-label">Criados</div>
                    <div class="pipe-value">{{orcamentos.filter(o => o.status === 'criado').length}}</div>
                    <div class="pipe-sub">aguardando aprovação</div>
                </div>
                <div class="pipe">
                    <div class="pipe-label">Em andamento</div>
                    <div class="pipe-value">{{orcamentos.filter(o => o.status === 'andamento').length}}</div>
                    <div class="pipe-sub">em execução</div>
                </div>
                <div class="pipe">
                    <div class="pipe-label">Finalizados</div>
                    <div class="pipe-value">{{orcamentos.filter(o => o.status === 'finalizado').length}}</div>
                    <div class="pipe-sub">enviados para home</div>
                </div>
            </div>

            <div class="empty" v-if="orcamentos.length === 0">
                <p>📋</p>
                <span>Nenhum orçamento cadastrado ainda.</span>
                <button class="btn-add" @click="abrirModalAdicionar">+ Criar primeiro orçamento</button>
            </div>

            <div class="cards" v-else>
                <div class="card" :class="{ cancelado: orc.status === 'cancelado' }" v-for="orc in orcamentos"
                    :key="orc.id">
                    <div class="card-top">
                        <div class="card-info">
                            <h3>{{ orc.nome }}</h3>
                            <p>{{ orc.marca }} • {{ orc.placa }} • {{ orc.cor }}</p>
                        </div>
                        <span class="badge" :class="orc.status">{{ statusLabel[orc.status] }}</span>
                    </div>

                    <div class="card-row"><span>Problema</span><strong>{{ orc.problema }}</strong></div>
                    <div class="card-row"><span>Cliente</span><strong>{{ orc.cliente }}</strong></div>
                    <div class="card-row"><span>Telefone</span><strong>{{ orc.telefone }}</strong></div>
                    <div class="card-row"><span>Data</span><strong>{{ orc.data }}</strong></div>

                    <div class="nivel">
                        <div class="nivel-dot" :class="{ ativo: nivelMap[orc.status] >= 1 }"></div>
                        <div class="nivel-dot" :class="{ ativo: nivelMap[orc.status] >= 2 }"></div>
                        <div class="nivel-dot" :class="{ ativo: nivelMap[orc.status] >= 3 }"></div>
                        <span class="nivel-label">
                            {{ orc.status === 'criado' ? 'Nível 1 — Criado' :
                                orc.status === 'andamento' ? 'Nível 2 — Em andamento' :
                                    orc.status === 'finalizado' ? 'Nível 3 — Finalizado ✓' :
                                        'Cancelado pelo usuário' }}
                        </span>
                    </div>

                    <div class="card-valor">
                        <div>
                            <div class="valor-label">Tabela FIPE</div>
                            <div class="valor-value">{{ orc.fipe }}</div>
                        </div>
                        <div style="text-align:right">
                            <div class="valor-label">Valor do orçamento</div>
                            <div class="valor-value">{{ orc.valor }}</div>
                        </div>
                    </div>

                    <div class="card-actions" v-if="orc.status === 'criado'">
                        <button class="btn-status" @click="atualizarStatus(orc, 'andamento')">▶ Iniciar
                            andamento</button>
                        <button class="btn-status cancelar" @click="atualizarStatus(orc, 'cancelado')">✕
                            Cancelar</button>
                    </div>

                    <div class="card-actions" v-else-if="orc.status === 'andamento'">
                        <button class="btn-status finalizar" @click="atualizarStatus(orc, 'finalizado')">✓
                            Finalizar</button>
                        <button class="btn-status cancelar" @click="atualizarStatus(orc, 'cancelado')">✕
                            Cancelar</button>
                    </div>

                    <div class="card-actions" v-else-if="orc.status === 'cancelado'">
                        <button class="btn-lixeira" @click="excluirOrcamento(orc.id)">🗑 Excluir</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal adicionar -->
        <div class="overlay" :class="{ open: modalAberto }" @click.self="modalAberto = false">
            <div class="modal">
                <div class="modal-header">
                    <div>
                        <h2>Novo orçamento</h2>
                        <p>Preencha os dados do veículo e cliente</p>
                    </div>
                    <button class="btn-close" @click="modalAberto = false">✕</button>
                </div>
                <div class="form-grid">
                    <div class="field">
                        <label>Nome do carro</label>
                        <input v-model="novoOrcamento.nome" type="text" placeholder="Ex: Civic 2021" />
                    </div>
                    <div class="field">
                        <label>Marca</label>
                        <input v-model="novoOrcamento.marca" type="text" placeholder="Ex: Honda" />
                    </div>
                    <div class="field">
                        <label>Cor</label>
                        <input v-model="novoOrcamento.cor" type="text" placeholder="Ex: Prata" />
                    </div>
                    <div class="field">
                        <label>Placa</label>
                        <input v-model="novoOrcamento.placa" type="text" placeholder="Ex: ABC-1234" />
                    </div>
                    <div class="field full">
                        <label>Problema relatado</label>
                        <input v-model="novoOrcamento.problema" type="text"
                            placeholder="Ex: Freio dianteiro falhando" />
                    </div>
                    <div class="field">
                        <label>Nome do cliente</label>
                        <input v-model="novoOrcamento.cliente" type="text" placeholder="Ex: João Silva" />
                    </div>
                    <div class="field">
                        <label>Telefone</label>
                        <input v-model="novoOrcamento.telefone" type="text" placeholder="Ex: (11) 99999-9999" />
                    </div>
                    <div class="field">
                        <label>Data de entrada</label>
                        <input v-model="novoOrcamento.data" type="date" />
                    </div>
                    <div class="field">
                        <label>Tabela FIPE</label>
                        <input v-model="novoOrcamento.fipe" type="text" placeholder="Ex: R$ 112.400" />
                    </div>
                    <div class="field full">
                        <label>Valor do orçamento</label>
                        <input v-model="novoOrcamento.valor" type="text" placeholder="Ex: R$ 850,00" />
                    </div>
                </div>
                <button class="btn-salvar" @click="adicionarOrcamento">✓ Criar orçamento</button>
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

.pipeline {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: .85rem;
    margin-bottom: 1.5rem;
}

.pipe {
    background: #0f2033;
    border: 1px solid #1e3d5c;
    border-radius: 10px;
    padding: .9rem 1rem;
}

.pipe-label {
    font-size: .72rem;
    color: #3d6a8a;
    margin-bottom: .3rem;
}

.pipe-value {
    font-size: 1.4rem;
    font-weight: 600;
    color: #e8f1fb;
}

.pipe-sub {
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
    transition: all .2s;
}

.card.cancelado {
    opacity: .6;
    border-style: dashed;
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

.badge.criado {
    background: rgba(186, 117, 23, .15);
    color: #fac775;
    border: 1px solid rgba(186, 117, 23, .3);
}

.badge.andamento {
    background: rgba(23, 158, 117, .15);
    color: #5dcaa5;
    border: 1px solid rgba(23, 158, 117, .3);
}

.badge.finalizado {
    background: rgba(55, 138, 221, .15);
    color: #7eb8f7;
    border: 1px solid rgba(55, 138, 221, .3);
}

.badge.cancelado {
    background: rgba(162, 45, 45, .15);
    color: #f09595;
    border: 1px solid rgba(162, 45, 45, .3);
}

.card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: .4rem;
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

.nivel {
    display: flex;
    align-items: center;
    gap: .4rem;
    margin: .65rem 0;
}

.nivel-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #1e3d5c;
    transition: background .2s;
}

.nivel-dot.ativo {
    background: #378add;
}

.nivel-label {
    font-size: .68rem;
    color: #3d6a8a;
    margin-left: .25rem;
}

.card-valor {
    background: #0b1a2d;
    border-radius: 7px;
    padding: .55rem .75rem;
    display: flex;
    justify-content: space-between;
}

.valor-label {
    font-size: .68rem;
    color: #3d6a8a;
}

.valor-value {
    font-size: .85rem;
    font-weight: 600;
    color: #7eb8f7;
}

.card-actions {
    display: flex;
    gap: .5rem;
    margin-top: .75rem;
}

.btn-status {
    flex: 1;
    padding: .45rem;
    border: 1px solid #1e3d5c;
    background: #0b1a2d;
    border-radius: 7px;
    color: #7eb8f7;
    font-size: .72rem;
    font-weight: 500;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
    transition: background .15s;
}

.btn-status:hover {
    background: #112944;
}

.btn-status.cancelar {
    color: #f09595;
    border-color: rgba(162, 45, 45, .3);
}

.btn-status.finalizar {
    color: #5dcaa5;
    border-color: rgba(23, 158, 117, .3);
}

.btn-lixeira {
    padding: .45rem .9rem;
    border: 1px solid rgba(162, 45, 45, .3);
    background: rgba(162, 45, 45, .1);
    border-radius: 7px;
    color: #f09595;
    font-size: .78rem;
    font-weight: 500;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
}

.btn-lixeira:hover {
    background: rgba(162, 45, 45, .2);
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
    max-width: 520px;
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

.field input {
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

.field input:focus {
    border-color: #378add;
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