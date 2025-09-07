// app.js - v3.1 - Final, Completo e Corrigido

document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // 1. CONFIGURAÇÕES E DADOS
    // =================================================================================
    const ADMIN_PASSWORD = "1234";
    let TAREFAS_PREDEFINIDAS_INICIAL = [
        { id: 1, nome: "Arrumar a cama", categoria: "Casa", pontos: 1 },
        { id: 2, nome: "Ajudar a guarda louça - 2º x", categoria: "Casa", pontos: 1 },
        { id: 3, nome: "Alimentar a CHURY / Retirada do xixi e/ou cocô", categoria: "Casa", pontos: 5 },
        { id: 4, nome: "Deixar toalha ou roupa fora do lugar", categoria: "Casa", pontos: -3 },
        { id: 5, nome: "Ser cobrado por escova dente, banhar, pentear", categoria: "Comportamental", pontos: -2 },
        { id: 6, nome: "Resmungar, teimar, falar alto", categoria: "Comportamental", pontos: -3 },
        { id: 7, nome: "Falha no comportamneto fora casa", categoria: "Comportamental", pontos: -5 },
        { id: 8, nome: "Usar mais de uma tela ao mesmo tempo", categoria: "Comportamental", pontos: -6 },
        { id: 9, nome: "Respeitar o tempo de tela", categoria: "Comportamental", pontos: 7 },
       { id: 10, nome: "Ler por 30min de forma espontanêa", categoria: "Educação", pontos: 3 },
       { id: 11, nome: "Ler por 30min e resumo de forma espontanêa", categoria: "Educação", pontos: 5 },
       { id: 12, nome: "Concluir um curso on line", categoria: "Educação", pontos: 10 },           
        
    ];

    let lancamentos = JSON.parse(localStorage.getItem('mesadaInteligente_lancamentos')) || [];
    let TAREFAS_PREDEFINIDAS = JSON.parse(localStorage.getItem('mesadaInteligente_tarefas')) || TAREFAS_PREDEFINIDAS_INICIAL;
    let meuGrafico;

    // =================================================================================
    // 2. SELETORES DE ELEMENTOS DO DOM
    // =================================================================================
    const saldoTotalEl = document.getElementById('saldo-total');
    const listaLancamentosEl = document.getElementById('lista-lancamentos');
    const graficoCanvas = document.getElementById('grafico-categorias');
    const navBotoes = document.querySelectorAll('.nav-button');
    const telas = document.querySelectorAll('.tela');
    const fab = document.getElementById('btn-adicionar-flutuante');

    const todosOsModais = document.querySelectorAll('.modal-container');
    const modalAdicionar = document.getElementById('modal-adicionar');
    const modalAdminLogin = document.getElementById('modal-admin-login');
    const painelAdmin = document.getElementById('painel-admin');
    const modalTarefaEditor = document.getElementById('modal-tarefa-editor');

    const formTarefa = document.getElementById('form-tarefa');
    const selectTarefaEl = document.getElementById('select-tarefa');
    const formAdminLogin = document.getElementById('form-admin-login');
    const adminPasswordInput = document.getElementById('admin-password');
    const adminLoginError = document.getElementById('admin-login-error');
    const formAjustePontos = document.getElementById('form-ajuste-pontos');
    const formRelatorioPdf = document.getElementById('form-relatorio-pdf');
    const formExclusaoSegura = document.getElementById('form-exclusao-segura');
    const formTarefaEditor = document.getElementById('form-tarefa-editor');

    const listaAprovacaoEl = document.getElementById('lista-aprovacao');
    const listaTarefasAdminEl = document.getElementById('lista-tarefas-admin');
    const btnAbrirModalNovaTarefa = document.getElementById('btn-abrir-modal-nova-tarefa');

    // =================================================================================
    // 3. FUNÇÕES PRINCIPAIS
    // =================================================================================

    const salvarDados = () => {
        localStorage.setItem('mesadaInteligente_lancamentos', JSON.stringify(lancamentos));
        localStorage.setItem('mesadaInteligente_tarefas', JSON.stringify(TAREFAS_PREDEFINIDAS));
    };

    const calcularSaldoAtual = () => lancamentos.filter(l => l.status === 'aprovado').reduce((total, l) => total + l.pontos, 0);

    const renderizarTudo = () => {
        saldoTotalEl.textContent = `${calcularSaldoAtual()} Pontos`;
        renderizarListaLancamentos();
        renderizarGrafico();
        recarregarSelectDeTarefas();
    };

    const renderizarListaLancamentos = () => {
        listaLancamentosEl.innerHTML = '';
        const lancamentosRecentes = [...lancamentos].reverse();
        if (lancamentosRecentes.length === 0) {
            listaLancamentosEl.innerHTML = '<li><p>Nenhuma tarefa registrada ainda.</p></li>';
            return;
        }
        lancamentosRecentes.forEach(lanc => {
            const li = document.createElement('li');
            const classePontos = lanc.pontos >= 0 ? 'positivo' : 'negativo';
            const statusTag = `<span class="status-tag ${lanc.status}">${lanc.status}</span>`;
            li.innerHTML = `
                <div class="lancamento-info">
                    <strong>${lanc.nome}</strong>
                    <small>${new Date(lanc.data).toLocaleString('pt-BR')}</small>
                </div>
                <div class="lancamento-status">
                    ${statusTag}
                    <span class="lancamento-pontos ${classePontos}">${lanc.pontos > 0 ? '+' : ''}${lanc.pontos}</span>
                </div>`;
            listaLancamentosEl.appendChild(li);
        });
    };

    const renderizarGrafico = () => {
        const categorias = {};
        TAREFAS_PREDEFINIDAS.forEach(t => { if (t.pontos > 0) categorias[t.categoria] = 0; });
        lancamentos.filter(l => l.status === 'aprovado').forEach(lanc => {
            const tarefaOrigem = TAREFAS_PREDEFINIDAS.find(t => t.id === lanc.idTarefa);
            if (tarefaOrigem && tarefaOrigem.pontos > 0 && categorias[tarefaOrigem.categoria] !== undefined) {
                categorias[tarefaOrigem.categoria]++;
            }
        });
        if (meuGrafico) meuGrafico.destroy();
        meuGrafico = new Chart(graficoCanvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categorias),
                datasets: [{
                    data: Object.values(categorias),
                    backgroundColor: ['#4a90e2', '#50e3c2', '#f5a623', '#bd10e0', '#7ed321', '#e74c3c'],
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    };

    const recarregarSelectDeTarefas = () => {
        selectTarefaEl.innerHTML = '<option value="" disabled selected>Selecione uma missão...</option>';
        TAREFAS_PREDEFINIDAS.filter(t => t.pontos > 0).forEach(tarefa => {
            const option = document.createElement('option');
            option.value = tarefa.id;
            option.textContent = `${tarefa.nome} (${tarefa.pontos} pts)`;
            selectTarefaEl.appendChild(option);
        });
    };

    const fecharTodosOsModais = () => todosOsModais.forEach(modal => modal.classList.remove('visivel'));

    // =================================================================================
    // 4. EVENT LISTENERS
    // =================================================================================

    navBotoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const telaAlvo = botao.dataset.tela;
            telas.forEach(tela => tela.classList.remove('ativa'));
            document.getElementById(`tela-${telaAlvo}`).classList.add('ativa');
            navBotoes.forEach(b => b.classList.remove('ativo'));
            botao.classList.add('ativo');
        });
    });

    fab.addEventListener('click', () => modalAdicionar.classList.add('visivel'));
    todosOsModais.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-container') || e.target.classList.contains('btn-fechar-modal')) {
                fecharTodosOsModais();
            }
        });
    });

    formTarefa.addEventListener('submit', (e) => {
        e.preventDefault();
        const tarefaId = parseInt(selectTarefaEl.value);
        const tarefa = TAREFAS_PREDEFINIDAS.find(t => t.id === tarefaId);
        if (!tarefa) return;
        lancamentos.push({
            id: Date.now(),
            idTarefa: tarefa.id,
            nome: tarefa.nome,
            pontos: tarefa.pontos,
            data: new Date().toISOString(),
            status: 'pendente'
        });
        salvarDados();
        renderizarTudo();
        fecharTodosOsModais();
        formTarefa.reset();
        alert('Tarefa registrada! Aguardando aprovação.');
    });

    // --- Lógica do Administrador ---
    document.getElementById('admin-trigger').addEventListener('click', () => modalAdminLogin.classList.add('visivel'));

    formAdminLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        if (adminPasswordInput.value === ADMIN_PASSWORD) {
            fecharTodosOsModais();
            renderizarAdmin();
            painelAdmin.classList.add('visivel');
        } else {
            adminLoginError.textContent = "Senha incorreta.";
        }
        formAdminLogin.reset();
    });

    const renderizarAdmin = () => {
        renderizarTarefasPendentes();
        renderizarTarefasAdmin();
    };

    // 4.6 Aprovação de Tarefas
    const renderizarTarefasPendentes = () => {
        listaAprovacaoEl.innerHTML = '';
        const tarefasPendentes = lancamentos.filter(l => l.status === 'pendente');
        if (tarefasPendentes.length === 0) {
            listaAprovacaoEl.innerHTML = '<p>Nenhuma tarefa para aprovar.</p>';
            return;
        }
        tarefasPendentes.forEach(tarefa => {
            const item = document.createElement('div');
            item.className = 'tarefa-aprovacao-item';
            item.innerHTML = `
                <div class="tarefa-aprovacao-info">
                    <strong>${tarefa.nome}</strong>
                    <small>${new Date(tarefa.data).toLocaleDateString('pt-BR')}</small>
                </div>
                <div class="tarefa-aprovacao-acoes">
                    <button class="btn-aprovar" data-id="${tarefa.id}" title="Aprovar"><i class="fa-solid fa-check"></i></button>
                    <button class="btn-recusar" data-id="${tarefa.id}" title="Recusar"><i class="fa-solid fa-times"></i></button>
                </div>`;
            listaAprovacaoEl.appendChild(item);
        });
    };

    listaAprovacaoEl.addEventListener('click', (e) => {
        const botao = e.target.closest('button');
        if (!botao) return;
        const id = parseInt(botao.dataset.id);
        const index = lancamentos.findIndex(l => l.id === id);
        if (index === -1) return;
        if (botao.classList.contains('btn-aprovar')) {
            lancamentos[index].status = 'aprovado';
        } else if (botao.classList.contains('btn-recusar')) {
            lancamentos.splice(index, 1);
        }
        salvarDados();
        renderizarTudo();
        renderizarAdmin();
    });

    // 4.2 Ajuste Manual de Pontos
    formAjustePontos.addEventListener('submit', (e) => {
        e.preventDefault();
        const pontos = parseInt(document.getElementById('ajuste-pontos-valor').value);
        const motivo = document.getElementById('ajuste-pontos-motivo').value;
        if (!pontos || !motivo) return;
        lancamentos.push({
            id: Date.now(),
            idTarefa: null,
            nome: motivo,
            pontos: pontos,
            data: new Date().toISOString(),
            status: 'aprovado'
        });
        salvarDados();
        renderizarTudo();
        formAjustePontos.reset();
    });

    // 4.3 Gerenciador de Tarefas
    const renderizarTarefasAdmin = () => {
        listaTarefasAdminEl.innerHTML = '';
        TAREFAS_PREDEFINIDAS.forEach(tarefa => {
            const item = document.createElement('div');
            item.className = 'tarefa-item';
            item.innerHTML = `
                <div class="tarefa-item-info"><strong>${tarefa.nome}</strong> (${tarefa.pontos} pts)</div>
                <div class="tarefa-item-acoes">
                    <button data-id="${tarefa.id}" class="btn-editar-tarefa"><i class="fa-solid fa-pencil"></i></button>
                    <button data-id="${tarefa.id}" class="btn-excluir-tarefa"><i class="fa-solid fa-trash"></i></button>
                </div>`;
            listaTarefasAdminEl.appendChild(item);
        });
    };

    listaTarefasAdminEl.addEventListener('click', (e) => {
        const botao = e.target.closest('button');
        if (!botao) return;
        const id = parseInt(botao.dataset.id);
        if (botao.classList.contains('btn-editar-tarefa')) {
            const tarefa = TAREFAS_PREDEFINIDAS.find(t => t.id === id);
            if (tarefa) {
                document.getElementById('editor-titulo').textContent = "Editar Tarefa";
                document.getElementById('tarefa-id-editor').value = tarefa.id;
                document.getElementById('tarefa-nome-editor').value = tarefa.nome;
                document.getElementById('tarefa-categoria-editor').value = tarefa.categoria;
                document.getElementById('tarefa-pontos-editor').value = tarefa.pontos;
                modalTarefaEditor.classList.add('visivel');
            }
        } else if (botao.classList.contains('btn-excluir-tarefa')) {
            if (confirm(`Tem certeza que deseja excluir a tarefa? Esta ação não pode ser desfeita.`)) {
                TAREFAS_PREDEFINIDAS = TAREFAS_PREDEFINIDAS.filter(t => t.id !== id);
                salvarDados();
                renderizarAdmin();
                recarregarSelectDeTarefas();
            }
        }
    });

    btnAbrirModalNovaTarefa.addEventListener('click', () => {
        document.getElementById('editor-titulo').textContent = "Adicionar Nova Tarefa";
        formTarefaEditor.reset();
        document.getElementById('tarefa-id-editor').value = '';
        modalTarefaEditor.classList.add('visivel');
    });

    formTarefaEditor.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('tarefa-id-editor').value;
        const tarefa = {
            id: id ? parseInt(id) : Date.now(),
            nome: document.getElementById('tarefa-nome-editor').value,
            categoria: document.getElementById('tarefa-categoria-editor').value,
            pontos: parseInt(document.getElementById('tarefa-pontos-editor').value)
        };
        if (id) {
            const index = TAREFAS_PREDEFINIDAS.findIndex(t => t.id === tarefa.id);
            TAREFAS_PREDEFINIDAS[index] = tarefa;
        } else {
            TAREFAS_PREDEFINIDAS.push(tarefa);
        }
        salvarDados();
        renderizarAdmin();
        recarregarSelectDeTarefas();
        modalTarefaEditor.classList.remove('visivel');
    });

    // 4.4 Gerador de Relatório PDF
    formRelatorioPdf.addEventListener('submit', (e) => {
        e.preventDefault();
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const dataInicio = new Date(document.getElementById('pdf-data-inicio').value + 'T00:00:00');
        const dataFim = new Date(document.getElementById('pdf-data-fim').value + 'T23:59:59');

        const lancamentosFiltrados = lancamentos.filter(l => {
            const dataLancamento = new Date(l.data);
            return dataLancamento >= dataInicio && dataLancamento <= dataFim && l.status === 'aprovado';
        });

        const margem = 15;
        const larguraPagina = doc.internal.pageSize.getWidth();
        doc.setDrawColor(0);
        doc.rect(margem, margem, larguraPagina - (margem * 2), doc.internal.pageSize.getHeight() - (margem * 2));

        doc.setFontSize(22);
        doc.text("MESADA INTELIGENTE", larguraPagina / 2, margem + 10, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Relatório de Desempenho - ${dataInicio.toLocaleDateString('pt-BR')} a ${dataFim.toLocaleDateString('pt-BR')}`, larguraPagina / 2, margem + 20, { align: 'center' });

        let y = margem + 40;
        doc.setFontSize(10);
        doc.text("Data", margem + 5, y);
        doc.text("Tarefa/Motivo", margem + 40, y);
        doc.text("Pontos", larguraPagina - margem - 20, y, { align: 'right' });
        y += 5;
        doc.line(margem, y, larguraPagina - margem, y);
        y += 5;

        lancamentosFiltrados.forEach(lanc => {
            if (y > doc.internal.pageSize.getHeight() - 30) {
                doc.addPage();
                y = margem + 10;
            }
            doc.text(new Date(lanc.data).toLocaleDateString('pt-BR'), margem + 5, y);
            doc.text(lanc.nome, margem + 40, y);
            doc.text(lanc.pontos.toString(), larguraPagina - margem - 20, y, { align: 'right' });
            y += 7;
        });

        const totalPontos = lancamentosFiltrados.reduce((acc, l) => acc + l.pontos, 0);
        y += 5;
        doc.line(margem, y, larguraPagina - margem, y);
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.text("Total de Pontos no Período:", margem + 40, y);
        doc.text(totalPontos.toString(), larguraPagina - margem - 20, y, { align: 'right' });

        doc.save(`relatorio-mesada-inteligente.pdf`);
    });

    // 4.5 Zona de Perigo - Apagar Dados
    formExclusaoSegura.addEventListener('submit', (e) => {
        e.preventDefault();
        const dataInicioStr = document.getElementById('apagar-data-inicio').value;
        const dataFimStr = document.getElementById('apagar-data-fim').value;
        if (!dataInicioStr || !dataFimStr) {
            alert("Por favor, selecione as datas de início e fim.");
            return;
        }
        if (confirm(`ATENÇÃO!\n\nVocê tem certeza que deseja apagar TODOS os lançamentos entre ${dataInicioStr} e ${dataFimStr}?\n\nESTA AÇÃO NÃO PODE SER DESFEITA.`)) {
            const dataInicio = new Date(dataInicioStr + 'T00:00:00');
            const dataFim = new Date(dataFimStr + 'T23:59:59');
            const lancamentosAntes = lancamentos.length;
            lancamentos = lancamentos.filter(l => {
                const dataLancamento = new Date(l.data);
                return dataLancamento < dataInicio || dataLancamento > dataFim;
            });
            const lancamentosDepois = lancamentos.length;
            salvarDados();
            renderizarTudo();
            renderizarAdmin();
            alert(`${lancamentosAntes - lancamentosDepois} lançamento(s) foram apagados com sucesso.`);
        }
    });

    // =================================================================================
    // 5. INICIALIZAÇÃO
    // =================================================================================
    renderizarTudo();

}); // FIM DO SCRIPT
