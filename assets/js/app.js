window.__INSTALANCHES_APP_LOADED__ = true;
const safeStorage = {
            getItem: function(key) { try { return localStorage.getItem(key); } catch(e) { return null; } },
            setItem: function(key, val) { try { localStorage.setItem(key, val); } catch(e) {} },
            removeItem: function(key) { try { localStorage.removeItem(key); } catch(e) {} }
        };

        let carrinho = []; 
        let cardapioOriginal = []; 
        let taxasOriginal = [];
        let subtotalPreco = 0; 
        let taxaPreco = 0;
        let configLojaGlob = { status: 'AUTO', mostrarBanner: true, textoBanner: '' };
        let statusLoja = { aceitandoPedidos: true, bloqueadoManual: false, motivo: 'aberta', mensagemBanner: 'Aberto para pedidos', horario: { abre: 17, fecha: 23, diaFechado: 3, textoDiaFechado: 'Quarta-feira' } };
        
        let loopRastreio = null;
        let pedidosRastreioCliente = []; 
        let abaRastreioAtual = 0;

        const TELEFONE_WHATSAPP = "5585991558671"; 

        window.isModalOpen = false;
        window.isFooterVisible = false;
        let isCheckoutReady = false;

        const mapIconesCategorias = {
            'hamburguer': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529854/4_symwgr.png',
            'burguer': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529854/4_symwgr.png',
            'espetinho': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529865/1_fkxedr.png',
            'carne': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529865/1_fkxedr.png',
            'frango': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529865/1_fkxedr.png',
            'porcao': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773543182/Por%C3%A7%C3%B5es_z9zhbr.png',
            'porcoes': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773543182/Por%C3%A7%C3%B5es_z9zhbr.png',
            'batata': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773543182/Por%C3%A7%C3%B5es_z9zhbr.png',
            'prato': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773534247/pratos_1_zjccts.png',
            'refeicao': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773534247/pratos_1_zjccts.png',
            'lasanha': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773534247/pratos_1_zjccts.png',
            'pastel': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529842/3_yh0rpo.png',
            'pasteis': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529842/3_yh0rpo.png',
            'cerveja': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529864/5_sphdck.png',
            'cervejas': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529864/5_sphdck.png',
            'bebida': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529865/6_ul3jkg.png',
            'bebidas': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529865/6_ul3jkg.png',
            'suco': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529865/6_ul3jkg.png',
            'refrigerante': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529865/6_ul3jkg.png',
            'agua': 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529865/6_ul3jkg.png'
        };

        // Função de normalização blindada contra falhas em telemóveis antigos
        const normalizarTexto = (str) => {
            if (!str) return '';
            try {
                return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            } catch (e) {
                let s = String(str).toLowerCase();
                const map = {'á':'a','à':'a','â':'a','ã':'a','ä':'a','é':'e','è':'e','ê':'e','ë':'e','í':'i','ì':'i','î':'i','ï':'i','ó':'o','ò':'o','ô':'o','õ':'o','ö':'o','ú':'u','ù':'u','û':'u','ü':'u','ç':'c'};
                return s.replace(/[áàâãäéèêëíìîïóòôõöúùûüç]/g, match => map[match] || match);
            }
        };
        
        function getIconeParaCategoria(categoria) {
            const catLower = normalizarTexto(categoria);
            for (const key in mapIconesCategorias) { if (catLower.includes(key)) return mapIconesCategorias[key]; }
            return 'https://res.cloudinary.com/de9bsqp2z/image/upload/v1773529854/4_symwgr.png';
        }

        function showToast(msg, tipo = 'success') {
            const toast = document.getElementById('toast'); const icon = document.getElementById('toast-icon');
            document.getElementById('toast-msg').textContent = msg; icon.className = tipo === 'success' ? 'fas fa-check-circle text-success-green text-xl shrink-0' : 'fas fa-exclamation-triangle text-red-500 text-xl shrink-0';
            toast.classList.remove('opacity-0', 'scale-95', 'pointer-events-none'); toast.classList.add('opacity-100', 'scale-100');
            setTimeout(() => { toast.classList.remove('opacity-100', 'scale-100'); toast.classList.add('opacity-0', 'scale-95', 'pointer-events-none'); }, 4000);
        }

        async function carregarConfiguracoesSupabase() {
            try {
                const { data, error } = await supabaseClient.from('configuracoes').select('*').order('id', { ascending: true }).limit(1);
                if (error && error.code !== '42P01') throw error; 
                
                if (data && data.length > 0) {
                    const config = data[0];
                    if (config.modo_manual === true) { configLojaGlob.status = config.aberto ? 'FORCAR_ABERTO' : 'FORCAR_FECHADO'; } 
                    else { configLojaGlob.status = 'AUTO'; }
                    
                    configLojaGlob.mostrarBanner = false; 
                    configLojaGlob.textoBanner = '';
                    
                    safeStorage.setItem('InstaLanches_ConfigLoja', JSON.stringify(configLojaGlob));
                    statusLoja = calcularStatusLoja();
                    aplicarStatusLojaInterface();
                }
            } catch (err) { }
        }

        async function carregarTaxasSupabase() {
            try {
                const { data, error } = await supabaseClient.from('taxas_entrega').select('*').order('bairro');
                if (error && error.code !== '42P01') throw error;
                if (data && data.length > 0) { taxasOriginal = data; } else { taxasOriginal = [{ id: 'taxa_1', bairro: 'Taxa Padrão', taxa: 5.00 }]; }
                preencherSelectTaxas();
            } catch (err) { 
                taxasOriginal = [{ id: 'taxa_1', bairro: 'Taxa Padrão', taxa: 5.00 }]; 
                preencherSelectTaxas(); 
            }
        }

        async function carregarCardapioSupabase() {
            mostrarLoaderCardapio();
            try {
                const { data, error } = await supabaseClient.from('produto').select('*');
                if (error) throw error;

                if (data && data.length > 0) {
                    safeStorage.setItem('InstaLanches_CardapioCacheV4', JSON.stringify(data));
                    montarInterface(data);
                } else {
                    esconderLoaderCardapio();
                    document.getElementById('container-cardapio').innerHTML = '<p class="text-center text-gray-500 py-10 font-bold">Ainda não há produtos cadastrados no cardápio.</p>';
                }
            } catch (err) { 
                esconderLoaderCardapio(); 
                document.getElementById('container-cardapio').innerHTML = `<div class="text-center p-8"><i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i><p class="text-red-500 font-bold">Erro ao carregar o cardápio!</p><p class="text-xs text-gray-500 mt-2">${err.message || 'Verifique a sua internet.'}</p></div>`;
            }
        }

        function calcularStatusLoja() {
            const horarioPadrao = { abre: 17, fecha: 23, diaFechado: 3, textoDiaFechado: 'Quarta-feira' };
            const agora = new Date();
            const fechadoPorDia = agora.getDay() === horarioPadrao.diaFechado;
            const fechadoPorHorario = agora.getHours() < horarioPadrao.abre || agora.getHours() >= horarioPadrao.fecha;
            
            let aceitandoPedidos = false; let motivo = 'aberta'; let mensagemBanner = configLojaGlob.textoBanner || '';

            if (configLojaGlob.status === 'FORCAR_ABERTO') { aceitandoPedidos = true; motivo = 'aberta'; } 
            else if (configLojaGlob.status === 'FORCAR_FECHADO') { aceitandoPedidos = false; motivo = 'bloqueio_manual'; } 
            else {
                if (fechadoPorDia) { aceitandoPedidos = false; motivo = 'dia_fechado'; }
                else if (fechadoPorHorario) { aceitandoPedidos = false; motivo = 'fora_do_horario'; }
                else { aceitandoPedidos = true; motivo = 'aberta'; }
            }

            return { aceitandoPedidos, bloqueadoManual: configLojaGlob.status === 'FORCAR_FECHADO', motivo, mensagemBanner, horario: horarioPadrao };
        }

        function proximoDiaFuncionamento(diaAtual, diaFechado) {
            for (let i = 1; i <= 7; i++) { const dia = (diaAtual + i) % 7; if (dia !== diaFechado) return dia; }
            return diaAtual;
        }

        function aplicarStatusLojaInterface() {
            const statusBanner = document.getElementById('statusBanner');
            const marqueeText = document.getElementById('marqueeText');
            const abre = statusLoja.horario.abre !== undefined ? statusLoja.horario.abre : 17; 
            const aberto = !!statusLoja.aceitandoPedidos; let textoBanner = configLojaGlob.textoBanner;

            if (statusBanner) {
                if (configLojaGlob.mostrarBanner) { statusBanner.style.display = 'flex'; document.documentElement.style.setProperty('--banner-height', 'max(32px, calc(26px + env(safe-area-inset-top)))'); } 
                else { statusBanner.style.display = 'none'; document.documentElement.style.setProperty('--banner-height', '0px'); }
            }

            if (aberto) {
                if (!textoBanner) textoBanner = '✨ ESTAMOS ABERTOS! FAÇA SEU PEDIDO AGORA 🍔🍟🥤 ✨';
                if (statusBanner) statusBanner.style.background = 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';
                document.querySelectorAll('[data-add-item]').forEach(btn => { btn.disabled = false; btn.classList.remove('opacity-60', 'cursor-not-allowed', 'pointer-events-none'); });
            } else {
                if (statusBanner) statusBanner.style.background = '#121212';
                const agora = new Date(); const horaAtual = agora.getHours();
                if (!textoBanner) {
                    if (statusLoja.motivo === 'bloqueio_manual') { textoBanner = '🔒 PAUSAMOS OS PEDIDOS TEMPORARIAMENTE. VOLTAMOS JÁ! ✨'; } 
                    else {
                        if (horaAtual < abre) { textoBanner = `⏳ FECHADO • ABRIMOS ÀS ${String(abre).padStart(2, '0')}H! PREPARE SEU APETITE 🤤🍔`; } 
                        else { textoBanner = `🌙 FECHADO • ENCERRAMOS POR HOJE! VOLTAMOS AMANHÃ ÀS ${String(abre).padStart(2, '0')}H ✨`; }
                    }
                }
                document.querySelectorAll('[data-add-item]').forEach(btn => { btn.disabled = true; btn.classList.add('opacity-60', 'cursor-not-allowed', 'pointer-events-none'); });
            }

            if (marqueeText) marqueeText.textContent = `${textoBanner} \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 ${textoBanner}`;
            atualizarVisibilidadeCarrinhoGlob();
        }

        window.abrirAdminAuth = function(e) { if(e) { e.preventDefault(); e.stopPropagation(); } abrirModal('modal-admin-auth'); };

        function verificarSenhaAdminMobile() {
            const senha = document.getElementById('senha-admin-mobile').value;
            if(senha === 'admin123') { 
                fecharModal('modal-admin-auth'); 
                document.getElementById('senha-admin-mobile').value = '';
                abrirModal('modal-admin-panel'); 
                mudarAbaAdmin('admin-pedidos', document.querySelector('[data-admin-tab="admin-pedidos"]'));
                adminAtualizarEstadoLojaVisual();
            } else { 
                showToast('Senha incorreta!', 'error'); 
            }
        }

        function adminEscapeHtml(value) {
            return String(value ?? '').replace(/[&<>"']/g, function(char) {
                return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char];
            });
        }

        function adminEscapeAttr(value) {
            return adminEscapeHtml(value).replace(/`/g, '&#096;');
        }

        function adminMoney(value) {
            const numero = Number(value || 0);
            return `R$ ${numero.toFixed(2).replace('.', ',')}`;
        }

        function adminHora(value) {
            if(!value) return 'Novo';
            try {
                return new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            } catch(e) {
                return 'Novo';
            }
        }

        function adminPrimeirasLetras(nome) {
            const partes = String(nome || 'Cliente').trim().split(/\s+/).filter(Boolean);
            if(partes.length === 0) return 'CL';
            return partes.slice(0, 2).map(p => p[0]).join('').toUpperCase();
        }

        function adminStatusMeta(status) {
            const statusNormalizado = normalizarTexto(status || 'Pendente');
            if(statusNormalizado.includes('saiu')) return { classe: 'route', label: 'Saiu para entrega', icon: 'fa-truck-fast' };
            if(statusNormalizado.includes('pronto')) return { classe: 'ready', label: 'Pronto', icon: 'fa-bag-shopping' };
            if(statusNormalizado.includes('preparando')) return { classe: 'preparing', label: 'Preparando', icon: 'fa-fire-burner' };
            if(statusNormalizado.includes('entregue') || statusNormalizado.includes('finalizado')) return { classe: 'done', label: status || 'Finalizado', icon: 'fa-check' };
            return { classe: 'pending', label: status || 'Pendente', icon: 'fa-clock' };
        }

        function adminAtualizarEstadoLojaVisual() {
            const el = document.getElementById('admin-sidebar-status');
            if(!el) return;
            const aberta = statusLoja && statusLoja.aceitandoPedidos;
            el.innerHTML = aberta ? '<i class="fas fa-circle"></i> Loja aberta' : '<i class="fas fa-circle"></i> Loja fechada';
            el.style.color = aberta ? '#bbf7d0' : '#fecaca';
            el.style.background = aberta ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)';
            el.style.borderColor = aberta ? 'rgba(34,197,94,0.22)' : 'rgba(239,68,68,0.22)';
        }

        function adminAtualizarKpis(pedidos) {
            const lista = Array.isArray(pedidos) ? pedidos : [];
            const total = lista.reduce((acc, p) => acc + Number(p.total || 0), 0);
            const entregas = lista.filter(p => p.tipo === 'entrega').length;
            const retiradas = lista.filter(p => p.tipo === 'retirada').length;

            const sets = [
                ['admin-kpi-orders', lista.length],
                ['admin-kpi-total', adminMoney(total)],
                ['admin-kpi-delivery', entregas],
                ['admin-kpi-pickup', retiradas],
                ['admin-kpi-side-orders', lista.length],
                ['admin-kpi-side-total', adminMoney(total)]
            ];

            sets.forEach(([id, value]) => {
                const el = document.getElementById(id);
                if(el) el.textContent = value;
            });
        }

        function mudarAbaAdmin(abaId, btnElement) {
            document.querySelectorAll('.admin-tab-content').forEach(el => { 
                el.classList.add('hidden'); 
                el.classList.remove('block'); 
            });

            const aba = document.getElementById(abaId);
            if(aba) {
                aba.classList.remove('hidden'); 
                aba.classList.add('block');
            }

            document.querySelectorAll('.admin-tab-btn').forEach(btn => { 
                btn.classList.remove('admin-tab-active', 'active', 'text-insta-pink', 'border-insta-pink'); 
                btn.classList.add('text-gray-400', 'border-transparent'); 
            });

            document.querySelectorAll(`[data-admin-tab="${abaId}"]`).forEach(btn => {
                btn.classList.add('admin-tab-active', 'active');
                btn.classList.remove('text-gray-400', 'border-transparent');
            });

            if(btnElement) {
                btnElement.classList.add('admin-tab-active', 'active');
                btnElement.classList.remove('text-gray-400', 'border-transparent');
            }

            if(abaId === 'admin-pedidos') carregarPedidosMobile();
            if(abaId === 'admin-loja') {
                const radios = document.getElementsByName('admin_loja_status');
                for(let r of radios) { if(r.value === configLojaGlob.status) r.checked = true; }
                const banner = document.getElementById('admin-banner-loja');
                if(banner) banner.value = configLojaGlob.textoBanner || '';
                adminAtualizarEstadoLojaVisual();
            }
            if(abaId === 'admin-cardapio') carregarAdminCardapio();
            if(abaId === 'admin-taxas') carregarAdminTaxas();
        }

        async function salvarConfiguracoesLoja(btn) {
            const originalHtml = btn.innerHTML; 
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...'; 
            btn.disabled = true;

            let novoStatus = 'AUTO'; 
            document.getElementsByName('admin_loja_status').forEach(r => { if(r.checked) novoStatus = r.value; });

            try {
                const { data: existente } = await supabaseClient.from('configuracoes').select('id').order('id', { ascending: true }).limit(1);
                let isAberto = true; 
                let isManual = false;

                if (novoStatus === 'FORCAR_ABERTO') { isAberto = true; isManual = true; } 
                else if (novoStatus === 'FORCAR_FECHADO') { isAberto = false; isManual = true; }

                const configPayload = { aberto: isAberto, modo_manual: isManual }; 
                let error = null;

                if (existente && existente.length > 0) { 
                    const res = await supabaseClient.from('configuracoes').update(configPayload).eq('id', existente[0].id); 
                    error = res.error; 
                } else { 
                    const res = await supabaseClient.from('configuracoes').insert([configPayload]); 
                    error = res.error; 
                }

                if(error) throw error;
                showToast('Loja atualizada com sucesso!'); 
                await carregarConfiguracoesSupabase(); 
                adminAtualizarEstadoLojaVisual();
            } catch(e) { 
                showToast('Erro Supabase: ' + (e.message || 'Falha ao guardar'), 'error'); 
            } finally { 
                btn.innerHTML = originalHtml; 
                btn.disabled = false; 
            }
        }

        async function carregarAdminCardapio() {
            const container = document.getElementById('admin-lista-cardapio');
            if(!container) return;
            container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Buscando produtos...</h5><p>Aguarde alguns segundos.</p></div></div>';
            try {
                const { data, error } = await supabaseClient.from('produto').select('*'); 
                if(error) throw error;

                if(!data || data.length === 0) { 
                    container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-box-open"></i><h5>Nenhum produto cadastrado</h5><p>Cadastre produtos no Supabase para aparecerem aqui.</p></div></div>'; 
                    return;
                }

                const dadosOrdenados = data.sort((a,b) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nome || '').localeCompare(b.nome || ''));
                container.innerHTML = dadosOrdenados.map(p => {
                    const nome = adminEscapeHtml(p.nome || 'Produto');
                    const categoria = adminEscapeHtml(p.categoria || 'Diversos');
                    const preco = adminMoney(p.preco);
                    return `<article class="admin-product-row">
                        <div class="admin-product-info">
                            <strong>${nome}</strong>
                            <small>${categoria}</small>
                        </div>
                        <span class="admin-price-chip">${preco}</span>
                    </article>`;
                }).join('');
            } catch(e) { 
                container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar cardápio</h5><p>${adminEscapeHtml(e.message || 'Verifique sua conexão.')}</p></div></div>`; 
            }
        }

        async function carregarAdminTaxas() {
            const container = document.getElementById('admin-lista-taxas');
            if(!container) return;
            container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Buscando taxas...</h5><p>Aguarde alguns segundos.</p></div></div>';
            try {
                const { data, error } = await supabaseClient.from('taxas_entrega').select('*'); 
                if(error) throw error;

                if(!data || data.length === 0) { 
                    container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-map-location-dot"></i><h5>Nenhuma taxa cadastrada</h5><p>Adicione bairros para habilitar a entrega.</p></div></div>'; 
                    return;
                }

                const dadosOrdenados = data.sort((a,b) => (a.bairro || '').localeCompare(b.bairro || ''));
                container.innerHTML = dadosOrdenados.map(t => {
                    const valorTaxa = t.taxa !== undefined ? t.taxa : t.valor; 
                    const bairro = adminEscapeHtml(t.bairro || 'Bairro');
                    const idTaxa = adminEscapeAttr(t.id || '');
                    return `<article class="admin-fee-row">
                        <div class="admin-fee-info">
                            <strong>${bairro}</strong>
                            <small>Taxa de entrega</small>
                        </div>
                        <div class="admin-fee-actions">
                            <span class="admin-fee-chip">${adminMoney(valorTaxa)}</span>
                            <button type="button" onclick="deletarTaxaAdmin('${idTaxa}')" class="admin-delete-btn" aria-label="Apagar taxa">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </article>`;
                }).join('');
            } catch(e) { 
                container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar taxas</h5><p>${adminEscapeHtml(e.message || 'Verifique sua conexão.')}</p></div></div>`; 
            }
        }

        async function adicionarTaxaAdmin(btn) {
            const bairroInput = document.getElementById('nova-taxa-bairro');
            const valorInput = document.getElementById('nova-taxa-valor');
            const bairro = bairroInput.value.trim(); 
            const valor = valorInput.value;

            if(!bairro || !valor) return showToast('Preencha o bairro e o valor!', 'error');

            const originalHtml = btn.innerHTML; 
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 
            btn.disabled = true;

            try {
                const { error } = await supabaseClient.from('taxas_entrega').insert([{ bairro: bairro, taxa: parseFloat(valor), ativo: true }]);
                if(error) throw error;
                showToast('Taxa adicionada com sucesso!'); 
                bairroInput.value = ''; 
                valorInput.value = '';
                carregarAdminTaxas(); 
                carregarTaxasSupabase(); 
            } catch(e) { 
                showToast('Erro Supabase: ' + (e.message || 'Falha ao adicionar'), 'error'); 
            } finally { 
                btn.innerHTML = originalHtml; 
                btn.disabled = false; 
            }
        }

        async function deletarTaxaAdmin(id) {
            if(!confirm('Tem certeza que deseja apagar esta taxa?')) return;
            try {
                const { error } = await supabaseClient.from('taxas_entrega').delete().eq('id', id); 
                if(error) throw error;
                showToast('Taxa apagada!'); 
                carregarAdminTaxas(); 
                carregarTaxasSupabase();
            } catch(e) { 
                showToast('Erro: ' + (e.message || 'Falha ao apagar'), 'error'); 
            }
        }

        async function carregarPedidosMobile() {
            const container = document.getElementById('mobile-admin-pedidos-lista');
            if(!container) return;

            container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Buscando pedidos...</h5><p>Carregando a fila em tempo real.</p></div></div>';

            try {
                let { data: pedidos, error } = await supabaseClient
                    .from('pedidos')
                    .select('*, itens_do_pedido(*)')
                    .neq('status', 'Finalizado')
                    .neq('status', 'Entregue')
                    .order('id', { ascending: false });

                if (error && error.code === 'PGRST200') {
                    const resP = await supabaseClient
                        .from('pedidos')
                        .select('*')
                        .neq('status', 'Finalizado')
                        .neq('status', 'Entregue')
                        .order('id', { ascending: false });

                    pedidos = resP.data;
                    if(pedidos && pedidos.length > 0) {
                        const ids = pedidos.map(p => p.id);
                        const resI = await supabaseClient.from('itens_do_pedido').select('*').in('pedido_id', ids);
                        if (resI.data) pedidos.forEach(p => p.itens_do_pedido = resI.data.filter(i => i.pedido_id === p.id));
                    }
                    error = resP.error;
                }

                if (error) throw error;
                renderizarPedidosMobile(pedidos || []);
            } catch (err) { 
                adminAtualizarKpis([]);
                showToast("Erro buscar pedidos: " + err.message, 'error');
                container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar pedidos</h5><p>${adminEscapeHtml(err.message || 'Tente atualizar novamente.')}</p></div></div>`; 
            }
        }

        function renderizarPedidosMobile(pedidos) {
            const container = document.getElementById('mobile-admin-pedidos-lista');
            if(!container) return;

            adminAtualizarKpis(pedidos || []);
            adminAtualizarEstadoLojaVisual();

            if(!pedidos || pedidos.length === 0) {
                container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-check-circle"></i><h5>Nenhum pedido pendente</h5><p>A fila está limpa. Novos pedidos aparecerão aqui automaticamente ao atualizar.</p></div></div>';
                return;
            }

            container.innerHTML = pedidos.map(p => {
                const isDel = p.tipo === 'entrega';
                const tipoClasse = isDel ? 'delivery' : 'pickup';
                const tipoIcone = isDel ? 'fa-motorcycle' : 'fa-store';
                const tipoTexto = isDel ? 'Entrega' : 'Retirada';
                const whatsNum = p.whatsapp ? String(p.whatsapp).replace(/\D/g, '') : '';
                const nomeCliente = p.nome_cliente || 'Cliente';
                const horaPedidoStr = adminHora(p.created_at);
                const statusMeta = adminStatusMeta(p.status);
                const endereco = isDel ? `${p.endereco || ''}${p.bairro ? ' • ' + p.bairro : ''}` : 'Cliente vai retirar no local';
                const totalPedido = Number(p.total || 0);
                const itensArray = Array.isArray(p.itens_do_pedido) ? p.itens_do_pedido : [];

                const strItens = itensArray.length
                    ? itensArray.map(i => `${i.quantidade || 1}x ${i.nome_do_produto || i.produto_nome || 'Item'} — ${adminMoney(i.preco || 0)}`).join('\n')
                    : 'Itens não encontrados para este pedido.';

                const statusEntrega = isDel 
                    ? ['Preparando', 'Saiu para entrega', 'Entregue']
                    : ['Preparando', 'Pronto', 'Finalizado'];

                const botoes = statusEntrega.map(status => {
                    const ativo = (p.status || 'Pendente') === status;
                    const label = status === 'Saiu para entrega' ? 'Saiu' : status;
                    return `<button type="button" 
                        data-whatsapp="${adminEscapeAttr(whatsNum)}" 
                        data-nome="${adminEscapeAttr(nomeCliente)}"
                        onclick="mudarStatusPedidoMobile(${Number(p.id)}, '${adminEscapeAttr(status)}', this.dataset.whatsapp, this.dataset.nome, this)" 
                        class="admin-status-btn ${ativo ? 'active' : ''}">
                        ${adminEscapeHtml(label)}
                    </button>`;
                }).join('');

                return `<article class="admin-order-card">
                    <div class="admin-order-top">
                        <div class="admin-order-client">
                            <div class="admin-order-avatar">${adminEscapeHtml(adminPrimeirasLetras(nomeCliente))}</div>
                            <div class="min-w-0">
                                <h5>${adminEscapeHtml(nomeCliente)}</h5>
                                <div class="admin-order-meta">
                                    <span>#${adminEscapeHtml(p.id)}</span>
                                    <span>${adminEscapeHtml(horaPedidoStr)}</span>
                                </div>
                            </div>
                        </div>
                        <a href="https://wa.me/${adminEscapeAttr(whatsNum)}" target="_blank" rel="noopener" class="admin-whatsapp-btn" aria-label="Abrir WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </a>
                    </div>

                    <div class="admin-order-meta" style="margin-top:12px;">
                        <span class="admin-badge ${tipoClasse}"><i class="fas ${tipoIcone}"></i> ${tipoTexto}</span>
                        <span class="admin-status-badge ${statusMeta.classe}"><i class="fas ${statusMeta.icon}"></i> ${adminEscapeHtml(statusMeta.label)}</span>
                        <span>${adminEscapeHtml(p.pagamento || 'Pagamento')}</span>
                    </div>

                    <div class="admin-order-items custom-scroll">${adminEscapeHtml(strItens)}</div>

                    <div class="admin-order-footer">
                        <div class="admin-order-address">
                            <i class="fas fa-location-dot text-insta-pink mr-1"></i>
                            ${adminEscapeHtml(endereco || 'Endereço não informado')}
                        </div>
                        <div class="admin-order-total">
                            <small>Total</small>
                            <strong>${adminMoney(totalPedido)}</strong>
                        </div>
                    </div>

                    <div class="admin-order-actions">${botoes}</div>
                </article>`;
            }).join('');
        }

        async function mudarStatusPedidoMobile(idPedido, novoStatus, whatsapp, nome, btnElement) {
            const oldHtml = btnElement ? btnElement.innerHTML : ''; 
            if(btnElement) {
                btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; 
                btnElement.disabled = true;
            }

            try {
                const { error } = await supabaseClient.from('pedidos').update({ status: novoStatus }).eq('id', idPedido);
                if (error) throw error;

                showToast(novoStatus.includes('Finalizado') || novoStatus.includes('Entregue') ? 'Pedido finalizado!' : 'Status atualizado!');
                carregarPedidosMobile(); 

                if(whatsapp && !novoStatus.includes('Finalizado') && !novoStatus.includes('Entregue') && confirm(`Avisar no WhatsApp de ${nome}?`)) {
                    let numero = whatsapp.length <= 11 ? "55" + whatsapp : whatsapp;
                    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(`Olá, *${nome}*! O seu pedido mudou o estado para: *${novoStatus}*.`)}`, '_blank');
                }
            } catch (err) { 
                showToast('Erro: ' + (err.message || 'Falha ao atualizar'), 'error'); 
            } finally { 
                if(btnElement) { 
                    btnElement.innerHTML = oldHtml; 
                    btnElement.disabled = false; 
                } 
            }
        }

        function montarInterface(dados) {
            cardapioOriginal = Array.isArray(dados) ? dados : [];
            const cardapioLoading = document.getElementById('cardapio-loading'); 
            if (cardapioLoading && cardapioLoading.parentNode) cardapioLoading.parentNode.removeChild(cardapioLoading);
            
            const navMenu = document.getElementById('menu-categorias'); const mainContainer = document.getElementById('container-cardapio');
            navMenu.innerHTML = ''; mainContainer.innerHTML = '';

            const categorias = [...new Set(cardapioOriginal.map(item => item.categoria || 'Diversos'))].sort((a, b) => {
                const aLower = normalizarTexto(a);
                const bLower = normalizarTexto(b);
                const palavrasBebida = ['bebida', 'cerveja', 'suco', 'refrigerante', 'agua'];
                const isABebida = palavrasBebida.some(p => aLower.indexOf(p) !== -1);
                const isBBebida = palavrasBebida.some(p => bLower.indexOf(p) !== -1);
                
                if (isABebida && !isBBebida) return 1; 
                if (!isABebida && isBBebida) return -1; 
                return String(a).localeCompare(String(b)); 
            });
            
            categorias.forEach((cat, index) => {
                const sectionId = `sec-${normalizarTexto(cat).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
                navMenu.innerHTML += `<a href="#${sectionId}" class="nav-link text-gray-500 px-2.5 pb-3 text-sm sm:text-sm uppercase tracking-wider font-semibold shrink-0 ${index === 0 ? 'active' : ''}">${cat}</a>`;

                const itensDaCategoria = cardapioOriginal.filter(item => item.categoria === cat);
                let secaoHTML = `<section id="${sectionId}" class="mb-12 sm:mb-14 pt-4 animate-fade-in"><h2 class="text-2xl sm:text-2xl font-display text-gray-800 mb-5 sm:mb-6 flex items-center drop-shadow-sm pl-1 uppercase tracking-wider"><span class="w-2.5 h-6 gradient-bg mr-3 rounded-full"></span>${cat}</h2><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">`;

                itensDaCategoria.forEach(item => {
                    secaoHTML += `
                        <div class="group bg-white rounded-3xl p-4 sm:p-5 flex gap-4 sm:gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100/80 relative overflow-hidden transform hover:-translate-y-1">
                            <div class="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center border border-gray-200/50 shadow-inner relative z-10 group-hover:border-insta-orange/30 transition-colors">
                                 <img class="categoria-img" src="${getIconeParaCategoria(item.categoria)}" alt="categoria">
                            </div>
                            <div class="flex flex-col flex-1 py-1 pr-1 relative z-10 min-w-0">
                                <h3 class="font-bold text-gray-800 text-lg sm:text-base leading-tight mb-1 group-hover:text-insta-purple transition-colors break-words">${item.nome}</h3>
                                <p class="text-gray-500 text-sm sm:text-xs line-clamp-3 sm:line-clamp-3 leading-relaxed mb-3 break-words">${item.descricao}</p>
                                <div class="mt-auto flex items-center justify-between gap-3">
                                    <span class="font-black text-insta-purple text-xl sm:text-lg tracking-tight shrink-0">R$ ${parseFloat(item.preco).toFixed(2).replace('.', ',')}</span>
                                    <button onclick="tratarAdicaoItem('${item.id}')" data-add-item="${item.id}" class="bg-gray-900 text-white hover:bg-insta-pink rounded-xl w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center font-bold shadow-md hover:shadow-lg transition-all active:scale-95 shrink-0"><i class="fas fa-plus"></i></button>
                                </div>
                            </div>
                        </div>`;
                });
                mainContainer.innerHTML += secaoHTML + `</div></section>`;
            });
            configurarNavegacao();
            aplicarStatusLojaInterface();
        }

        function preencherSelectTaxas() {
            const select = document.getElementById('bairro-select');
            if(!select) return;
            select.innerHTML = '<option value="" data-taxa="0">Selecione seu Bairro...</option>';
            taxasOriginal.forEach(taxa => {
                const valorAtual = taxa.taxa !== undefined ? taxa.taxa : taxa.valor;
                select.innerHTML += `<option value="${taxa.bairro}" data-taxa="${valorAtual}">${taxa.bairro} - R$ ${parseFloat(valorAtual).toFixed(2).replace('.', ',')}</option>`;
            });
        }

        function tratarAdicaoItem(id) {
            const produto = cardapioOriginal.find(p => p.id === id);
            if (!produto) return;
            if (normalizarTexto(produto.categoria).includes('hamburguer') || normalizarTexto(produto.categoria).includes('burguer')) {
                document.getElementById('opcoes-nome-produto').textContent = produto.nome; 
                document.getElementById('opcoes-id-produto').value = produto.id; 
                const radios = document.getElementsByName('tipo_pao');
                if(radios.length > 0) radios[0].checked = true;
                abrirModal('modal-opcoes');
            } else { adicionarAoCarrinho(produto, null); }
        }

        function confirmarOpcoesEAdicionar() {
            const produtoBase = cardapioOriginal.find(p => p.id === document.getElementById('opcoes-id-produto').value);
            if (!produtoBase) return;
            let opcaoEscolhida = ""; let precoAdicional = 0;
            document.getElementsByName('tipo_pao').forEach(r => { 
                if(r.checked) { opcaoEscolhida = r.value; precoAdicional = parseFloat(r.getAttribute('data-adicional')) || 0; }
            });
            const produtoModificado = { ...produtoBase, id: produtoBase.id + '_' + opcaoEscolhida.replace(/\s/g, ''), nome: `${produtoBase.nome} (${opcaoEscolhida})`, preco: parseFloat(produtoBase.preco) + precoAdicional };
            adicionarAoCarrinho(produtoModificado, null); 
            fecharModal('modal-opcoes');
        }

        function adicionarAoCarrinho(produto, opcao) {
            const cartId = opcao ? `${produto.id}_${opcao}` : produto.id;
            const existente = carrinho.find(item => item.cartId === cartId);
            if (existente) { existente.quantidade++; } else { carrinho.push({ ...produto, cartId: cartId, quantidade: 1, opcaoEscolhida: opcao }); }
            atualizarCarrinho(); showToast(`${produto.nome} foi adicionado!`);
            const cartBtn = document.getElementById('barra-flutuante-carrinho');
            if(cartBtn) { cartBtn.classList.remove('translate-y-full'); void cartBtn.offsetWidth; }
        }

        function atualizarCarrinho() {
            const container = document.getElementById('cart-items');
            document.getElementById('cart-count').textContent = carrinho.reduce((s, i) => s + i.quantidade, 0);
            
            if (carrinho.length === 0) {
                container.innerHTML = '<div class="text-center py-8 opacity-50"><p class="font-bold text-gray-500 text-sm">O carrinho está vazio</p></div>'; subtotalPreco = 0;
            } else {
                container.innerHTML = ''; subtotalPreco = 0;
                carrinho.forEach((item, index) => {
                    subtotalPreco += (parseFloat(item.preco) * item.quantidade);
                    const opcaoHTML = item.opcaoEscolhida ? `<span class="block text-[10px] text-insta-orange bg-orange-50 px-2 py-1 rounded-md mt-1 w-fit border border-orange-100 font-bold uppercase tracking-wider">${item.opcaoEscolhida}</span>` : '';
                    container.innerHTML += `
                        <div class="flex justify-between items-center bg-white p-3 sm:p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <div class="flex-1 pr-3"><h4 class="font-bold text-gray-800 text-sm leading-tight">${item.nome}</h4>${opcaoHTML}<p class="text-insta-purple font-black text-sm mt-1">R$ ${parseFloat(item.preco).toFixed(2).replace('.', ',')}</p></div>
                            <div class="flex items-center gap-2 bg-gray-50 px-1.5 py-1.5 rounded-xl border border-gray-200"><button onclick="alterarQuantidade(${index}, -1)" class="text-gray-400 hover:text-red-500 w-7 h-7 flex items-center justify-center bg-white rounded-lg"><i class="fas fa-minus"></i></button><span class="font-black text-sm w-4 text-center text-gray-800">${item.quantidade}</span><button onclick="alterarQuantidade(${index}, 1)" class="text-insta-pink hover:text-white hover:bg-insta-pink w-7 h-7 flex items-center justify-center bg-white rounded-lg"><i class="fas fa-plus"></i></button></div>
                        </div>`;
                });
            }
            calcularTotal(); atualizarVisibilidadeCarrinhoGlob();
        }

        function alterarQuantidade(index, mudanca) { carrinho[index].quantidade += mudanca; if (carrinho[index].quantidade <= 0) carrinho.splice(index, 1); atualizarCarrinho(); }
        
        function calcularTotal() {
            const elTipo = document.getElementById('tipo-pedido');
            const tipo = elTipo ? elTipo.value : ''; 
            taxaPreco = 0;
            if (tipo === 'entrega') {
                const select = document.getElementById('bairro-select');
                if (select && select.selectedIndex > 0) {
                    const taxaVal = select.options[select.selectedIndex].getAttribute('data-taxa');
                    if (taxaVal) taxaPreco = parseFloat(taxaVal) || 0;
                }
            }
            
            const elPag = document.getElementById('pagamento');
            const pagamento = elPag ? elPag.value : '';
            let taxaPagamento = 0;
            
            if (pagamento === 'Cartão') {
                taxaPagamento = (subtotalPreco + taxaPreco) * 0.05; 
            }

            let totalParcial = subtotalPreco + taxaPreco + taxaPagamento;
            let totalFinal = Math.ceil(totalParcial);
            
            const cSub = document.getElementById('cart-subtotal'); if(cSub) cSub.textContent = `R$ ${subtotalPreco.toFixed(2).replace('.', ',')}`;
            const cTax = document.getElementById('cart-taxa'); if(cTax) cTax.textContent = `R$ ${taxaPreco.toFixed(2).replace('.', ',')}`;
            
            const cTaxPagLinha = document.getElementById('cart-taxa-pagamento-linha'); 
            const cTaxPag = document.getElementById('cart-taxa-pagamento');
            if(taxaPagamento > 0) {
                if(cTaxPagLinha) cTaxPagLinha.classList.remove('hidden');
                if(cTaxPag) cTaxPag.textContent = `R$ ${taxaPagamento.toFixed(2).replace('.', ',')}`;
            } else {
                if(cTaxPagLinha) cTaxPagLinha.classList.add('hidden');
            }

            const cTot = document.getElementById('cart-total'); if(cTot) cTot.textContent = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;
            
            const fTot = document.getElementById('floating-total'); if(fTot) fTot.textContent = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;
            const fTotCheckout = document.getElementById('cart-total-floating'); if(fTotCheckout) fTotCheckout.textContent = `R$ ${totalFinal.toFixed(2).replace('.', ',')}`;
            
            validarCheckout();
        }

        function mudarTipoPedido() {
            const tipo = document.getElementById('tipo-pedido').value;
            const areaEntregaResumo = document.getElementById('area-entrega-resumo');
            
            if (tipo === 'entrega') {
                if(areaEntregaResumo) areaEntregaResumo.classList.remove('hidden');
            } else {
                if(areaEntregaResumo) areaEntregaResumo.classList.add('hidden'); 
                taxaPreco = 0;
            }
            document.getElementById('txt-ver-pedido-btn').textContent = 'Ver Pedido';
            calcularTotal();
        }

        function toggleTroco() {
            const pagamento = document.getElementById('pagamento').value;
            const trocoContainer = document.getElementById('troco-container');
            if (pagamento === 'Dinheiro') { trocoContainer.classList.remove('hidden'); } 
            else { trocoContainer.classList.add('hidden'); document.getElementById('troco').value = ''; }
            calcularTotal(); 
        }

        function validarCheckout() {
            const elTipoPed = document.getElementById('tipo-pedido');
            const tipoPedido = elTipoPed ? elTipoPed.value : '';
            const cartModal = document.getElementById('cart-modal');
            const isCartModalOpen = cartModal && cartModal.classList.contains('show');
            const cb = document.getElementById('checkout-floating-bar');
            const btnFinalizar = document.getElementById('btn-finalizar');
            const txtFinalizar = document.getElementById('txt-finalizar-btn');

            if (!cb || !btnFinalizar) return;

            const elNome = document.getElementById('nome-cliente');
            const nome = elNome ? elNome.value.trim() : '';
            const elPag = document.getElementById('pagamento');
            const pagamento = elPag ? elPag.value : '';
            let enderecoOk = false;

            if (tipoPedido === 'entrega') {
                const selectBairro = document.getElementById('bairro-select');
                const bairroOk = selectBairro && selectBairro.selectedIndex > 0;
                const elRua = document.getElementById('rua-input');
                const rua = elRua ? elRua.value.trim() : '';
                const elNum = document.getElementById('numero-input');
                const num = elNum ? elNum.value.trim() : '';
                enderecoOk = !!(bairroOk && rua && num);
            } else if (tipoPedido === 'retirada') { 
                enderecoOk = true; 
            }

            const tudoPreenchido = nome && tipoPedido && pagamento && enderecoOk && carrinho.length > 0 && isCartModalOpen;

            if (tudoPreenchido) {
                if (!isCheckoutReady || txtFinalizar.textContent !== "Finalizar") {
                    isCheckoutReady = true;
                    cb.classList.remove('hidden', 'translate-y-full'); cb.classList.add('translate-y-0');
                    btnFinalizar.classList.add('btn-checkout-ready');
                    txtFinalizar.textContent = "Finalizar";
                    if (typeof confetti === 'function') { confetti({ particleCount: 150, spread: 80, origin: { y: 0.85 }, colors: ['#28a745', '#38ef7d', '#d6249f', '#fbad50', '#ffffff'], zIndex: 10016 }); }
                }
            } else {
                isCheckoutReady = false;
                cb.classList.add('translate-y-full'); cb.classList.remove('translate-y-0');
                btnFinalizar.classList.remove('btn-checkout-ready');
            }
        }

        function atualizarBotoesRepetirPedido() {
            const temPedido = !!safeStorage.getItem('InstaLanches_UltimoPedido');
            const btnVazio = document.getElementById('btn-repetir-vazio');
            const btnAtivo = document.getElementById('btn-repetir-ativo');
            
            if(temPedido) {
                if(btnVazio) { btnVazio.classList.remove('hidden'); btnVazio.classList.add('flex'); }
                if(btnAtivo) { btnAtivo.classList.remove('hidden'); btnAtivo.classList.add('flex'); }
            } else {
                if(btnVazio) { btnVazio.classList.add('hidden'); btnVazio.classList.remove('flex'); }
                if(btnAtivo) { btnAtivo.classList.add('hidden'); btnAtivo.classList.remove('flex'); }
            }
        }

        async function processarCheckout(e) {
            e.preventDefault();
            if (carrinho.length === 0) return showToast('O seu carrinho está vazio', 'error');

            const btnFinalizar = document.getElementById('btn-finalizar');
            btnFinalizar.style.pointerEvents = 'none'; btnFinalizar.style.opacity = '0.7';

            const nome = document.getElementById('nome-cliente').value;
            const whatsapp = document.getElementById('whatsapp-cliente').value.trim();
            const tipoPedido = document.getElementById('tipo-pedido').value;
            const pagamento = document.getElementById('pagamento').value;
            let endereco = ''; let bairroNome = '';
            
            if (tipoPedido === 'entrega') {
                const selectBairro = document.getElementById('bairro-select');
                bairroNome = (selectBairro.options[selectBairro.selectedIndex] && selectBairro.options[selectBairro.selectedIndex].text) ? selectBairro.options[selectBairro.selectedIndex].text.split(' - ')[0] : '';
                const rua = document.getElementById('rua-input').value.trim();
                const num = document.getElementById('numero-input').value.trim();
                const ref = document.getElementById('referencia-input').value.trim();
                if(!bairroNome || !rua || !num || selectBairro.value === "") {
                    btnFinalizar.style.pointerEvents = 'auto'; btnFinalizar.style.opacity = '1';
                    return showToast('Preencha o seu endereço completo!', 'error');
                }
                endereco = `${rua}, ${num}. Ref: ${ref}`;
            } else { 
                endereco = 'Retirada na Loja'; 
                bairroNome = '-'; 
            }

            let taxaPagamento = pagamento === 'Cartão' ? (subtotalPreco + taxaPreco) * 0.05 : 0; 
            const totalFinal = Math.ceil(subtotalPreco + taxaPreco + taxaPagamento);
            const trocoPara = document.getElementById('troco').value;

            const pedidoCompleto = {
                nome_cliente: nome, 
                whatsapp: whatsapp, 
                tipo: tipoPedido, 
                endereco: endereco, 
                bairro: bairroNome, 
                pagamento: pagamento, 
                precisa_troco: !!trocoPara, 
                troco_para: trocoPara ? parseFloat(trocoPara) : null,
                subtotal: subtotalPreco, 
                taxa_entrega: taxaPreco, 
                taxa_pagamento: taxaPagamento, 
                total: totalFinal, 
                status: 'Pendente'
            };
            
            try {
                const { data: pData, error } = await supabaseClient.from('pedidos').insert([pedidoCompleto]).select('id').single();
                if (error) throw error;

                const pItens = carrinho.map(item => ({
                    pedido_id: pData.id,
                    nome_do_produto: item.nome + (item.opcaoEscolhida ? ` (${item.opcaoEscolhida})` : ''),
                    quantidade: item.quantidade,
                    preco: item.preco
                }));
                await supabaseClient.from('itens_do_pedido').insert(pItens);

                let meusPedidosLocal = JSON.parse(safeStorage.getItem('Insta_Ids_Pedidos_Locais') || '[]');
                meusPedidosLocal.push(pData.id);
                safeStorage.setItem('Insta_Ids_Pedidos_Locais', JSON.stringify(meusPedidosLocal));

                document.getElementById('notif-dot').classList.remove('hidden');
                safeStorage.setItem('InstaLanches_UltimoPedido', JSON.stringify(carrinho));
                atualizarBotoesRepetirPedido();
                
                let msgWhatsapp = `🎉*NOVO PEDIDO*🎉\n\n*Cliente:* ${nome}\n*WhatsApp:* ${whatsapp}\n*Tipo:* ${tipoPedido.toUpperCase()}\n`;
                if (tipoPedido === 'entrega') msgWhatsapp += `*Endereço:* ${endereco} - ${bairroNome}\n\n`; 
                msgWhatsapp += `*Itens:*\n`;
                pItens.forEach(i => { msgWhatsapp += `${i.quantidade}x ${i.nome_do_produto} - R$ ${(i.preco * i.quantidade).toFixed(2).replace('.', ',')}\n`; });
                msgWhatsapp += `\n*Subtotal:* R$ ${subtotalPreco.toFixed(2).replace('.', ',')}\n*Taxa Entrega:* R$ ${taxaPreco.toFixed(2).replace('.', ',')}`;
                if(taxaPagamento > 0) msgWhatsapp += `\n*Taxa Cartão:* R$ ${taxaPagamento.toFixed(2).replace('.', ',')}`;
                msgWhatsapp += `\n*TOTAL FINAL:* R$ ${totalFinal.toFixed(2).replace('.', ',')}\n\n*Pagamento:* ${pagamento}`;
                if (trocoPara) msgWhatsapp += `\n*Troco para:* R$ ${trocoPara}`;
                
                window.open(`https://wa.me/${TELEFONE_WHATSAPP}?text=${encodeURIComponent(msgWhatsapp)}`, '_blank'); 
                
                carrinho = []; atualizarCarrinho(); fecharModal('cart-modal');
                showToast('Pedido enviado com sucesso!');
                setTimeout(() => { abrirModal('modal-rastreio'); }, 500);
            } catch(err) {
                console.error("Erro ao salvar:", err); showToast('Erro Supabase: Verifique as colunas do banco', 'error');
            } finally {
                btnFinalizar.style.pointerEvents = 'auto'; btnFinalizar.style.opacity = '1';
            }
        }

        function repetirUltimoPedido() {
            const ultimo = safeStorage.getItem('InstaLanches_UltimoPedido');
            if (ultimo) { carrinho = JSON.parse(ultimo); atualizarCarrinho(); abrirModal('cart-modal'); showToast('Pedido recuperado!'); }
        }

        function mostrarRastreioVazio() {
            const v = document.getElementById('rastreio-vazio'); const a = document.getElementById('rastreio-ativo');
            if(v) { v.classList.remove('hidden'); v.classList.add('flex'); }
            if(a) { a.classList.add('hidden'); a.classList.remove('flex'); }
            document.getElementById('rastreio-status-texto').textContent = 'Nenhum pedido ativo';
        }

        function mostrarRastreioAtivo() {
            const v = document.getElementById('rastreio-vazio'); const a = document.getElementById('rastreio-ativo');
            if(v) { v.classList.add('hidden'); v.classList.remove('flex'); }
            if(a) { a.classList.remove('hidden'); a.classList.add('flex'); }
        }

        function abrirRastreio() { 
            abrirModal('modal-rastreio'); 
            carregarRastreio(); 
            atualizarBotoesRepetirPedido();
        }

        async function carregarRastreio() {
            const btnAtualizar = document.querySelector('#modal-rastreio .fa-sync-alt');
            if(btnAtualizar) btnAtualizar.classList.add('fa-spin');

            try {
                let meusPedidosIds = JSON.parse(safeStorage.getItem('Insta_Ids_Pedidos_Locais') || '[]');
                if (meusPedidosIds.length === 0) { mostrarRastreioVazio(); return; }

                let { data: pedidos, error } = await supabaseClient.from('pedidos').select('*, itens_do_pedido(*)').in('id', meusPedidosIds).order('id', { ascending: false });
                
                if (error && error.code === 'PGRST200') {
                    const resP = await supabaseClient.from('pedidos').select('*').in('id', meusPedidosIds).order('id', { ascending: false });
                    pedidos = resP.data;
                    if(pedidos && pedidos.length > 0) {
                        const ids = pedidos.map(p => p.id);
                        const resI = await supabaseClient.from('itens_do_pedido').select('*').in('pedido_id', ids);
                        if(resI.data) pedidos.forEach(p => p.itens_do_pedido = resI.data.filter(i => i.pedido_id === p.id));
                    }
                    error = resP.error;
                }

                if (error) throw error;

                if (pedidos && pedidos.length > 0) {
                    pedidosRastreioCliente = pedidos; abaRastreioAtual = 0; renderizarAbasRastreio();
                } else { mostrarRastreioVazio(); }
            } catch (err) {
                mostrarRastreioVazio();
            } finally {
                if(btnAtualizar) btnAtualizar.classList.remove('fa-spin');
            }
        }

        async function carregarRastreioSilencioso() {
            try {
                let meusPedidosIds = JSON.parse(safeStorage.getItem('Insta_Ids_Pedidos_Locais') || '[]');
                if (meusPedidosIds.length === 0) return;

                let { data: pedidos, error } = await supabaseClient.from('pedidos').select('*, itens_do_pedido(*)').in('id', meusPedidosIds).order('id', { ascending: false });
                
                if (error && error.code === 'PGRST200') {
                    const resP = await supabaseClient.from('pedidos').select('*').in('id', meusPedidosIds).order('id', { ascending: false });
                    pedidos = resP.data;
                    if(pedidos && pedidos.length > 0) {
                        const ids = pedidos.map(p => p.id);
                        const resI = await supabaseClient.from('itens_do_pedido').select('*').in('pedido_id', ids);
                        if(resI.data) pedidos.forEach(p => p.itens_do_pedido = resI.data.filter(i => i.pedido_id === p.id));
                    }
                    error = resP.error;
                }

                if (!error && pedidos && pedidos.length > 0) {
                    let mudou = false;
                    if(pedidos.length !== pedidosRastreioCliente.length) mudou = true;
                    else { for(let i=0; i<pedidos.length; i++) { if(pedidos[i].status !== pedidosRastreioCliente[i].status) mudou = true; } }
                    pedidosRastreioCliente = pedidos;
                    if (mudou) renderizarAbasRastreio();
                }
            } catch (err) {}
        }

        function renderizarAbasRastreio() {
            if (!pedidosRastreioCliente || pedidosRastreioCliente.length === 0) return mostrarRastreioVazio();
            mostrarRastreioAtivo();
            const tabsContainer = document.getElementById('rastreio-tabs');
            if (!tabsContainer) return;

            if (pedidosRastreioCliente.length <= 1) { tabsContainer.classList.add('hidden'); } 
            else {
                tabsContainer.classList.remove('hidden'); let html = '';
                pedidosRastreioCliente.forEach((p, index) => {
                    const isActive = index === abaRastreioAtual;
                    const baseClass = "py-1.5 px-3 rounded-xl font-bold text-[11px] whitespace-nowrap transition-colors border cursor-pointer select-none uppercase tracking-wider";
                    const activeClass = isActive ? "bg-insta-pink text-white border-insta-pink shadow-md" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50";
                    const horaFormatada = p.created_at ? new Date(p.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : 'Recente';
                    html += `<div onclick="mudarAbaRastreio(${index})" class="${baseClass} ${activeClass}"><i class="fas fa-receipt mr-1"></i> Pedido ${horaFormatada}</div>`;
                });
                tabsContainer.innerHTML = html;
            }
            renderizarCupomRastreio(pedidosRastreioCliente[abaRastreioAtual]);
        }

        function mudarAbaRastreio(index) { abaRastreioAtual = index; renderizarAbasRastreio(); }

        function renderizarCupomRastreio(pedido) {
            const passos = ['Pendente', 'Preparando', 'Saiu para entrega', 'Entregue'];
            let idxAtual = passos.indexOf(pedido.status); if (idxAtual === -1) idxAtual = 0;
            
            if(pedido.tipo !== 'entrega') {
                passos[2] = 'Pronto'; passos[3] = 'Finalizado';
                idxAtual = passos.indexOf(pedido.status); if (idxAtual === -1) idxAtual = 0;
            }

            let timelineHTML = '';
            passos.forEach((passo, i) => {
                const ativo = i <= idxAtual;
                const cor = ativo ? 'bg-success-green' : 'bg-gray-200';
                const textoCor = ativo ? 'text-gray-800' : 'text-gray-400';
                let icone = '';
                if(i===0) icone = 'fa-file-alt'; if(i===1) icone = 'fa-fire-burner';
                if(i===2) icone = (pedido.tipo === 'entrega' ? 'fa-motorcycle' : 'fa-bell-concierge');
                if(i===3) icone = (pedido.tipo === 'entrega' ? 'fa-house-user' : 'fa-check-double');

                timelineHTML += `
                <div class="relative flex items-center gap-4">
                    <div class="absolute -left-[25px] w-4 h-4 rounded-full ${cor} border-4 border-[#f3f4f6] flex items-center justify-center shadow-sm z-10 transition-colors duration-500"></div>
                    <div class="w-8 h-8 rounded-full ${ativo ? 'bg-green-50 text-success-green' : 'bg-gray-50 text-gray-300'} flex items-center justify-center shadow-sm transition-colors duration-500"><i class="fas ${icone} text-sm"></i></div>
                    <div class="${textoCor} font-bold text-sm uppercase tracking-wider transition-colors duration-500">${passo}</div>
                </div>`;
            });
            document.getElementById('rastreio-timeline').innerHTML = timelineHTML;
            document.getElementById('rastreio-status-texto').textContent = `Status Atual: ${pedido.status}`;
            
            const txtPrevisao = pedido.created_at ? new Date(new Date(pedido.created_at).getTime() + 60 * 60000).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--';
            document.getElementById('rastreio-previsao-hora').textContent = txtPrevisao;

            let strItens = '';
            const itensArray = pedido.itens_do_pedido || [];
            if(itensArray && Array.isArray(itensArray)) {
                itensArray.forEach(i => {
                    const nomeProduto = i.nome_do_produto || i.produto_nome;
                    strItens += `<div class="flex justify-between items-start text-[11px] font-bold text-gray-800 leading-tight pb-1.5"><span class="flex-1 pr-2">${i.quantidade}x ${nomeProduto}</span><span class="shrink-0 whitespace-nowrap">R$ ${(i.preco * i.quantidade).toFixed(2).replace('.', ',')}</span></div>`;
                });
            }
            
            document.getElementById('rastreio-resumo-itens').innerHTML = strItens || '<span class="text-xs text-gray-400">Itens não encontrados</span>';
            document.getElementById('rastreio-subtotal').textContent = `R$ ${(parseFloat(pedido.subtotal) || 0).toFixed(2).replace('.', ',')}`;
            document.getElementById('rastreio-taxa').textContent = `R$ ${(parseFloat(pedido.taxa_entrega) || parseFloat(pedido.taxa_pagamento) || 0).toFixed(2).replace('.', ',')}`;
            document.getElementById('rastreio-total').textContent = `R$ ${(parseFloat(pedido.total) || 0).toFixed(2).replace('.', ',')}`;
            document.getElementById('rastreio-pagamento').textContent = pedido.pagamento || 'Não informado';
        }

        function atualizarVisibilidadeCarrinhoGlob() {
            const barraCarrinho = document.getElementById('barra-flutuante-carrinho');
            const cartModal = document.getElementById('cart-modal');
            const isCartModalOpen = cartModal && cartModal.classList.contains('show');
            const checkoutBar = document.getElementById('checkout-floating-bar');

            if (barraCarrinho) {
                if (carrinho.length === 0 || window.isModalOpen || window.isFooterVisible) {
                    barraCarrinho.classList.add('translate-y-full'); barraCarrinho.classList.remove('translate-y-0');
                } else {
                    barraCarrinho.classList.remove('translate-y-full'); barraCarrinho.classList.add('translate-y-0');
                }
            }
            if (checkoutBar && !isCartModalOpen) { checkoutBar.classList.add('hidden', 'translate-y-full'); checkoutBar.classList.remove('translate-y-0'); }
        }

        function fecharTodosModais() { 
            document.querySelectorAll('.modal-wrapper.show').forEach(modal => modal.classList.remove('show')); 
            const cb = document.getElementById('checkout-floating-bar');
            if(cb){ cb.classList.add('hidden', 'translate-y-full'); cb.classList.remove('translate-y-0'); }
            isCheckoutReady = false; window.isModalOpen = false;
            if(loopRastreio) clearInterval(loopRastreio);
            atualizarVisibilidadeCarrinhoGlob();
        }

        function abrirModal(id) { 
            const modal = document.getElementById(id); if (!modal) return; 
            modal.classList.add('show'); 
            if(id === 'modal-admin-panel') {
                document.body.classList.add('admin-panel-open');
                setTimeout(function(){
                    const area = document.querySelector('#modal-admin-panel .admin-content-scroll');
                    if(area) area.scrollTop = 0;
                }, 30);
            }
            if(id === 'cart-modal') validarCheckout();
            if(id === 'modal-rastreio') { carregarRastreio(); if(loopRastreio) clearInterval(loopRastreio); loopRastreio = setInterval(carregarRastreioSilencioso, 5000); }
            window.isModalOpen = true; atualizarVisibilidadeCarrinhoGlob();
        }

        function fecharModal(id) { 
            const modal = document.getElementById(id); if (!modal) return; 
            modal.classList.remove('show'); 
            if(id === 'modal-admin-panel') {
                document.body.classList.remove('admin-panel-open');
            }
            if (!document.querySelector('.modal-wrapper.show')) window.isModalOpen = false;
            if(id === 'cart-modal'){
                const cb = document.getElementById('checkout-floating-bar');
                if(cb){ cb.classList.add('hidden', 'translate-y-full'); cb.classList.remove('translate-y-0'); }
                isCheckoutReady = false;
            }
            if(id === 'modal-rastreio' && loopRastreio) clearInterval(loopRastreio);
            atualizarVisibilidadeCarrinhoGlob();
        }

        function mostrarLoaderCardapio(){
            const c=document.querySelector('#container-cardapio'); if(!c) return;
            if(!document.getElementById('cardapio-loading') && !c.querySelector('section')){ 
                c.innerHTML=`<div id="cardapio-loading"><img src="https://res.cloudinary.com/de9bsqp2z/image/upload/v1773535880/omidas_tjylr6.gif"><span>Carregando cardápio...</span></div>`; 
            }
        }

        function esconderLoaderCardapio(){ 
            const l=document.getElementById('cardapio-loading'); 
            if(l && l.parentNode) l.parentNode.removeChild(l); 
        }

        let isClickScrolling = false; let scrollTimeout;
        
        // ROLAGEM E NAVEGAÇÃO 100% RESTAURADAS AO ORIGINAL QUE FUNCIONAVA
        function configurarNavegacao() {
            const navLinks = document.querySelectorAll('.nav-link');
            const navMenu = document.getElementById('menu-categorias');

            document.querySelectorAll('main section').forEach(sec => { sec.style.scrollMarginTop = '15px'; });

            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault(); isClickScrolling = true;
                    navLinks.forEach(l => l.classList.remove('active')); this.classList.add('active');
                    
                    const scrollPos = this.offsetLeft - (navMenu.clientWidth / 2) + (this.clientWidth / 2);
                    navMenu.scrollTo({ left: scrollPos, behavior: 'smooth' });

                    const targetEl = document.querySelector(this.getAttribute('href'));
                    if (targetEl) {
                        const headerOffset = 135; 
                        const elementPosition = targetEl.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.scrollY - headerOffset;

                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                    }
                    clearTimeout(scrollTimeout); scrollTimeout = setTimeout(() => { isClickScrolling = false; }, 800);
                });
            });

            // Fallback de segurança para observar a rolagem
            if ('IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    if (isClickScrolling) return;
                    let activeId = null; let maxRatio = 0;
                    entries.forEach(entry => { 
                        if (entry.isIntersecting && entry.intersectionRatio > maxRatio) { 
                            maxRatio = entry.intersectionRatio; 
                            activeId = entry.target.id; 
                        } 
                    });
                    if (activeId) {
                        navLinks.forEach(link => {
                            if (link.getAttribute('href').substring(1) === activeId) {
                                if (!link.classList.contains('active')) {
                                    link.classList.add('active');
                                    const scrollPos = link.offsetLeft - (navMenu.clientWidth / 2) + (link.clientWidth / 2);
                                    navMenu.scrollTo({ left: scrollPos, behavior: 'smooth' });
                                }
                            } else { link.classList.remove('active'); }
                        });
                    }
                }, { rootMargin: `-140px 0px -60% 0px`, threshold: [0, 0.1, 0.2, 0.5, 1.0] }); // Retirado o root para voltar ao normal
                
                document.querySelectorAll('main section').forEach(sec => observer.observe(sec));
            }
        }

        function initDraggableCart() {
            const dragHandle = document.getElementById('cart-draggable-btn'); if (!dragHandle) return;
            let isDragging = false; let startY; let dy = 0; let wasDragged = false; let maxUp = 0; let maxDown = 0;

            const dragStart = (e) => {
                isDragging = true; wasDragged = false;
                const telaLivre = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                maxUp = telaLivre * -0.025; maxDown = telaLivre * 0.05; 
                startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
                dragHandle.style.transition = 'none'; dragHandle.classList.add('cursor-grabbing'); dragHandle.classList.remove('cursor-grab');
            };

            const drag = (e) => {
                if (!isDragging) return;
                const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
                let rawDy = currentY - startY;
                if (Math.abs(rawDy) > 15) { wasDragged = true; if(e.cancelable) e.preventDefault(); }
                if (rawDy < maxUp) { dy = maxUp + (rawDy - maxUp) * 0.3; } else if (rawDy > maxDown) { dy = maxDown + (rawDy - maxDown) * 0.3; } else { dy = rawDy; }
                dragHandle.style.transform = `translateY(${dy}px)`;
            };

            const dragEnd = () => {
                if (!isDragging) return;
                isDragging = false; dragHandle.classList.remove('cursor-grabbing'); dragHandle.classList.add('cursor-grab');
                dragHandle.style.transition = 'transform 0.5s cubic-bezier(0.2, 1.3, 0.3, 1)'; dragHandle.style.transform = `translateY(0px)`; dy = 0; 
            };

            dragHandle.addEventListener('click', (e) => { if (wasDragged) { e.preventDefault(); e.stopPropagation(); return; } abrirModal('cart-modal'); });
            dragHandle.addEventListener('mousedown', dragStart); document.addEventListener('mousemove', drag, { passive: false }); document.addEventListener('mouseup', dragEnd);
            dragHandle.addEventListener('touchstart', dragStart, { passive: true }); document.addEventListener('touchmove', drag, { passive: false }); document.addEventListener('touchmove', drag, { passive: false }); document.addEventListener('touchend', dragEnd); document.addEventListener('touchcancel', dragEnd);
        }

        document.addEventListener("DOMContentLoaded", () => {
            document.querySelectorAll('.modal-wrapper.show').forEach(m => m.classList.remove('show'));
            statusLoja = calcularStatusLoja();
            aplicarStatusLojaInterface();
            const cacheCardapio = safeStorage.getItem('InstaLanches_CardapioCacheV4');
            if (cacheCardapio) { try { const dadosCached = JSON.parse(cacheCardapio); if (dadosCached && dadosCached.length > 0) montarInterface(dadosCached); } catch(e) {} } 
            else { mostrarLoaderCardapio(); }

            carregarConfiguracoesSupabase();
            carregarTaxasSupabase();
            carregarCardapioSupabase();
            atualizarBotoesRepetirPedido();

            setTimeout(async () => {
                try {
                    let meusPedidosIds = JSON.parse(safeStorage.getItem('Insta_Ids_Pedidos_Locais') || '[]');
                    if(meusPedidosIds.length > 0) {
                        const { data } = await supabaseClient.from('pedidos').select('status').in('id', meusPedidosIds);
                        if(data) {
                            const temAtivo = data.some(p => p.status !== 'Entregue' && p.status !== 'Finalizado');
                            if (temAtivo) document.getElementById('notif-dot').classList.remove('hidden');
                        }
                    }
                } catch(e) {}
            }, 2000);

            const formCheckout = document.getElementById('checkout-form');
            if (formCheckout) { formCheckout.addEventListener('input', validarCheckout); formCheckout.addEventListener('change', validarCheckout); }
            
            const target = document.querySelector('#container-cardapio');
            if(target) {
                const obs = new MutationObserver(() => { if(target.querySelectorAll('.group').length > 0){ esconderLoaderCardapio(); obs.disconnect(); } });
                obs.observe(target,{childList:true,subtree:true});
            }
            
            if (!document.body.dataset.globalEventsBound) {
                document.body.dataset.globalEventsBound = 'true';
                document.addEventListener('keydown', function(e) { if (e.key === 'Escape') fecharTodosModais(); });
            }

            setTimeout(initDraggableCart, 300);

            const footer = document.querySelector('footer');
            if(footer && 'IntersectionObserver' in window) {
                const observerF = new IntersectionObserver((entries)=>{ entries.forEach(entry=>{ window.isFooterVisible = entry.isIntersecting; atualizarVisibilidadeCarrinhoGlob(); }); },{threshold:0.1});
                observerF.observe(footer);
            }
        });
