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



/* =========================================================
   V4 - Cardápio com experiência de app, promoções e Admin ERP
   Mantém funções globais existentes e adiciona recursos profissionais.
   ========================================================= */

let promocoesOriginal = [];
let adminPedidosCache = [];
let adminProdutosCache = [];
let adminPromocoesCache = [];
let adminFinanceiroCache = [];

const APP_STORAGE_BUCKET = 'product-images';

function moneyBR(valor) {
    const n = Number(valor || 0);
    return 'R$ ' + n.toFixed(2).replace('.', ',');
}

function toNumberBR(valor) {
    if (valor === null || valor === undefined || valor === '') return null;
    if (typeof valor === 'number') return valor;
    const normalized = String(valor).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
}

function isProdutoAtivo(produto) {
    if (!produto) return false;
    if (produto.ativo === false || produto.indisponivel === true) return false;
    if (produto.controla_estoque === true && Number(produto.estoque_atual || 0) <= 0) return false;
    return true;
}

function estoqueProdutoDisponivel(produto) {
    if (!produto || produto.controla_estoque !== true) return Infinity;
    return Math.max(0, Number(produto.estoque_atual || 0));
}

function qtdNoCarrinhoPorProduto(produtoId) {
    return carrinho
        .filter(item => String(item.id) === String(produtoId))
        .reduce((total, item) => total + Number(item.quantidade || 0), 0);
}

function getImagemProduto(produto) {
    if (!produto) return '';
    return produto.imagem_url || produto.foto_url || produto.imagem || '';
}

function getPrecoProduto(produto) {
    const promo = Number(produto && produto.preco_promocional);
    const preco = Number(produto && produto.preco);
    if (Number.isFinite(promo) && promo > 0 && promo < preco) return promo;
    return preco || 0;
}

function produtoTemPrecoPromocional(produto) {
    const promo = Number(produto && produto.preco_promocional);
    const preco = Number(produto && produto.preco);
    return Number.isFinite(promo) && promo > 0 && promo < preco;
}

function escapeClienteHtml(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[ch]));
}

function normalizaIdCategoria(cat) {
    return `sec-${normalizarTexto(cat).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

function produtoPassaFiltro(produto, termo) {
    if (!termo) return true;
    const alvo = normalizarTexto(`${produto.nome || ''} ${produto.descricao || ''} ${produto.categoria || ''}`);
    return alvo.includes(normalizarTexto(termo));
}

function montarInterface(dados) {
    cardapioOriginal = Array.isArray(dados) ? dados : [];
    adminProdutosCache = cardapioOriginal.slice();

    const cardapioLoading = document.getElementById('cardapio-loading');
    if (cardapioLoading && cardapioLoading.parentNode) cardapioLoading.parentNode.removeChild(cardapioLoading);

    const navMenu = document.getElementById('menu-categorias');
    const mainContainer = document.getElementById('container-cardapio');
    if (!navMenu || !mainContainer) return;

    const termo = document.getElementById('busca-cardapio')?.value || '';
    const produtosFiltrados = cardapioOriginal.filter(p => produtoPassaFiltro(p, termo));

    navMenu.innerHTML = '';
    mainContainer.innerHTML = '';

    if ((promocoesOriginal || []).length > 0) {
        navMenu.innerHTML += `<a href="#promocoes-home" class="nav-link text-gray-500 px-2.5 pb-3 text-sm sm:text-sm uppercase tracking-wider font-semibold shrink-0">Promoções</a>`;
    }

    const categorias = [...new Set(produtosFiltrados.map(item => item.categoria || 'Diversos'))].sort((a, b) => {
        const aLower = normalizarTexto(a);
        const bLower = normalizarTexto(b);
        const palavrasBebida = ['bebida', 'cerveja', 'suco', 'refrigerante', 'agua'];
        const isABebida = palavrasBebida.some(p => aLower.indexOf(p) !== -1);
        const isBBebida = palavrasBebida.some(p => bLower.indexOf(p) !== -1);

        if (isABebida && !isBBebida) return 1;
        if (!isABebida && isBBebida) return -1;
        return String(a).localeCompare(String(b));
    });

    if (produtosFiltrados.length === 0) {
        mainContainer.innerHTML = `<div class="search-empty-state">
            <i class="fas fa-magnifying-glass"></i>
            <h3 class="text-xl font-black text-gray-800">Nenhum produto encontrado</h3>
            <p class="text-sm mt-2">Tente buscar por outro nome, categoria ou bebida.</p>
        </div>`;
        configurarNavegacao();
        return;
    }

    categorias.forEach((cat, index) => {
        const sectionId = normalizaIdCategoria(cat);
        navMenu.innerHTML += `<a href="#${sectionId}" class="nav-link text-gray-500 px-2.5 pb-3 text-sm sm:text-sm uppercase tracking-wider font-semibold shrink-0 ${index === 0 ? 'active' : ''}">${escapeClienteHtml(cat)}</a>`;

        const itensDaCategoria = produtosFiltrados.filter(item => item.categoria === cat);
        let secaoHTML = `<section id="${sectionId}" class="mb-12 sm:mb-14 pt-4 animate-fade-in"><h2 class="text-2xl sm:text-2xl font-display text-gray-800 mb-5 sm:mb-6 flex items-center drop-shadow-sm pl-1 uppercase tracking-wider"><span class="w-2.5 h-6 gradient-bg mr-3 rounded-full"></span>${escapeClienteHtml(cat)}</h2><div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">`;

        itensDaCategoria.forEach(item => {
            const imagem = getImagemProduto(item);
            const temFoto = !!imagem;
            const disponivel = isProdutoAtivo(item);
            const preco = getPrecoProduto(item);
            const precoOriginal = Number(item.preco || 0);
            const temPromo = produtoTemPrecoPromocional(item);
            const estoqueDisponivel = estoqueProdutoDisponivel(item);
            const estoqueBaixo = item.controla_estoque === true && estoqueDisponivel > 0 && estoqueDisponivel <= Number(item.estoque_minimo || 5);

            const badges = [
                item.destaque ? `<span class="product-mini-badge hot"><i class="fas fa-star"></i> Destaque</span>` : '',
                temPromo ? `<span class="product-mini-badge hot"><i class="fas fa-tag"></i> Oferta</span>` : '',
                estoqueBaixo ? `<span class="product-mini-badge stock"><i class="fas fa-box"></i> Últimas unidades</span>` : '',
                !disponivel ? `<span class="product-mini-badge off"><i class="fas fa-ban"></i> Indisponível</span>` : ''
            ].join('');

            const imgTag = temFoto
                ? `<img class="categoria-img" src="${adminEscapeAttr(imagem)}" alt="${adminEscapeAttr(item.nome || 'Produto')}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${adminEscapeAttr(getIconeParaCategoria(item.categoria))}';this.parentElement.classList.remove('has-photo');">`
                : `<img class="categoria-img" src="${adminEscapeAttr(getIconeParaCategoria(item.categoria))}" alt="categoria" loading="lazy" decoding="async">`;

            secaoHTML += `
                <div class="group product-card-v4 bg-white rounded-3xl p-4 sm:p-5 flex gap-4 sm:gap-5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 border border-gray-100/80 relative overflow-hidden transform hover:-translate-y-1 ${!disponivel ? 'opacity-70' : ''}">
                    <div class="product-image-shell ${temFoto ? 'has-photo' : ''}">
                         ${imgTag}
                    </div>
                    <div class="flex flex-col flex-1 py-1 pr-1 relative z-10 min-w-0">
                        <div class="product-badge-row">${badges}</div>
                        <h3 class="font-bold text-gray-800 text-lg sm:text-base leading-tight mb-1 group-hover:text-insta-purple transition-colors break-words">${escapeClienteHtml(item.nome || 'Produto')}</h3>
                        <p class="text-gray-500 text-sm sm:text-xs line-clamp-3 sm:line-clamp-3 leading-relaxed mb-3 break-words">${escapeClienteHtml(item.descricao || '')}</p>
                        <div class="mt-auto flex items-center justify-between gap-3">
                            <span class="product-price-stack shrink-0">
                                ${temPromo ? `<span class="old">${moneyBR(precoOriginal)}</span>` : ''}
                                <span class="new">${moneyBR(preco)}</span>
                            </span>
                            <button ${disponivel ? `onclick="tratarAdicaoItem('${adminEscapeAttr(String(item.id))}')"` : ''} data-add-item="${adminEscapeAttr(String(item.id))}" class="${disponivel ? 'bg-gray-900 text-white hover:bg-insta-pink shadow-md hover:shadow-lg' : 'product-add-disabled'} rounded-xl w-10 h-10 sm:w-10 sm:h-10 flex items-center justify-center font-bold transition-all active:scale-95 shrink-0" aria-label="${disponivel ? 'Adicionar ao pedido' : 'Produto indisponível'}">
                                <i class="fas ${disponivel ? 'fa-plus' : 'fa-lock'}"></i>
                            </button>
                        </div>
                    </div>
                </div>`;
        });
        mainContainer.innerHTML += secaoHTML + `</div></section>`;
    });

    configurarNavegacao();
    aplicarStatusLojaInterface();
}

function filtrarCardapioCliente() {
    const busca = document.getElementById('busca-cardapio');
    const limpar = document.getElementById('btn-limpar-busca');
    if (limpar) limpar.classList.toggle('hidden', !(busca && busca.value));
    montarInterface(cardapioOriginal);
}

function limparBuscaCardapio() {
    const busca = document.getElementById('busca-cardapio');
    if (busca) busca.value = '';
    filtrarCardapioCliente();
}

async function carregarPromocoesSupabase() {
    try {
        const { data, error } = await supabaseClient
            .from('promocoes')
            .select('*')
            .eq('ativo', true)
            .order('ordem', { ascending: true });

        if (error) throw error;

        const agora = new Date();
        promocoesOriginal = (data || []).filter(p => {
            const inicioOk = !p.inicia_em || new Date(p.inicia_em) <= agora;
            const fimOk = !p.termina_em || new Date(p.termina_em) >= agora;
            return inicioOk && fimOk;
        });

        renderizarPromocoesPublicas();
        if (cardapioOriginal.length) montarInterface(cardapioOriginal);
    } catch (e) {
        promocoesOriginal = [];
        renderizarPromocoesPublicas();
    }
}

function renderizarPromocoesPublicas() {
    const box = document.getElementById('promocoes-home');
    const container = document.getElementById('promocoes-publicas');
    if (!box || !container) return;

    if (!promocoesOriginal || promocoesOriginal.length === 0) {
        box.classList.add('hidden');
        container.innerHTML = '';
        return;
    }

    box.classList.remove('hidden');
    container.innerHTML = promocoesOriginal.map(p => {
        const produto = p.produto_id ? cardapioOriginal.find(prod => String(prod.id) === String(p.produto_id)) : null;
        const imagem = p.imagem_url || getImagemProduto(produto) || getIconeParaCategoria(produto?.categoria || 'promo');
        const titulo = p.titulo || produto?.nome || 'Promoção';
        const descricao = p.descricao || produto?.descricao || 'Oferta especial por tempo limitado.';
        const precoNormal = Number(p.preco_original || produto?.preco || 0);
        const precoPromo = Number(p.preco_promocional || p.preco || produto?.preco_promocional || produto?.preco || 0);
        const produtoId = p.produto_id || produto?.id || '';

        return `<article class="promo-card-public">
            <div class="promo-img"><img src="${adminEscapeAttr(imagem)}" alt="${adminEscapeAttr(titulo)}" loading="lazy" onerror="this.onerror=null;this.src='${adminEscapeAttr(getIconeParaCategoria(produto?.categoria || 'promo'))}'"></div>
            <div class="promo-info">
                <h3>${escapeClienteHtml(titulo)}</h3>
                <p>${escapeClienteHtml(descricao)}</p>
                <div class="promo-price-row">
                    <span>
                        ${precoNormal && precoNormal > precoPromo ? `<span class="promo-old-price">${moneyBR(precoNormal)}</span>` : ''}
                        <span class="promo-new-price">${moneyBR(precoPromo)}</span>
                    </span>
                    ${produtoId ? `<button type="button" class="promo-add-btn" onclick="tratarAdicaoItem('${adminEscapeAttr(String(produtoId))}')" aria-label="Adicionar promoção"><i class="fas fa-plus"></i></button>` : ''}
                </div>
            </div>
        </article>`;
    }).join('');
}

function tratarAdicaoItem(id) {
    const produto = cardapioOriginal.find(p => String(p.id) === String(id));
    if (!produto) return;
    if (!isProdutoAtivo(produto)) {
        return showToast('Produto indisponível no momento', 'error');
    }

    const disponivel = estoqueProdutoDisponivel(produto);
    if (disponivel !== Infinity && qtdNoCarrinhoPorProduto(produto.id) >= disponivel) {
        return showToast('Estoque máximo desse produto já está no carrinho', 'error');
    }

    const produtoCompra = { ...produto, preco: getPrecoProduto(produto) };
    if (normalizarTexto(produtoCompra.categoria).includes('hamburguer') || normalizarTexto(produtoCompra.categoria).includes('burguer')) {
        document.getElementById('opcoes-nome-produto').textContent = produtoCompra.nome;
        document.getElementById('opcoes-id-produto').value = produtoCompra.id;
        const radios = document.getElementsByName('tipo_pao');
        if(radios.length > 0) radios[0].checked = true;
        abrirModal('modal-opcoes');
    } else {
        adicionarAoCarrinho(produtoCompra, null);
    }
}

function confirmarOpcoesEAdicionar() {
    const id = document.getElementById('opcoes-id-produto').value;
    const produto = cardapioOriginal.find(p => String(p.id) === String(id));
    if (!produto) return;
    if (!isProdutoAtivo(produto)) return showToast('Produto indisponível no momento', 'error');

    const disponivel = estoqueProdutoDisponivel(produto);
    if (disponivel !== Infinity && qtdNoCarrinhoPorProduto(produto.id) >= disponivel) {
        return showToast('Estoque máximo desse produto já está no carrinho', 'error');
    }

    const radioSelecionado = document.querySelector('input[name="tipo_pao"]:checked');
    const opcao = radioSelecionado ? radioSelecionado.value : null;
    const adicional = radioSelecionado ? parseFloat(radioSelecionado.dataset.adicional || '0') : 0;
    const produtoCompra = { ...produto, preco: getPrecoProduto(produto) + adicional };
    adicionarAoCarrinho(produtoCompra, opcao);
    fecharModal('modal-opcoes');
}

async function baixarEstoquePedido(pItens) {
    try {
        const agrupado = {};
        carrinho.forEach(item => {
            if (!item.controla_estoque) return;
            const id = String(item.id);
            agrupado[id] = (agrupado[id] || 0) + Number(item.quantidade || 0);
        });

        const ops = Object.entries(agrupado).map(async ([id, qtd]) => {
            const produto = cardapioOriginal.find(p => String(p.id) === String(id));
            const atual = Number(produto?.estoque_atual || 0);
            const novo = Math.max(0, atual - qtd);
            await supabaseClient.from('produto').update({ estoque_atual: novo }).eq('id', id);
        });

        await Promise.all(ops);
    } catch (e) {
        console.warn('Estoque não atualizado automaticamente:', e);
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
        status: 'Pendente',
        origem: 'cardapio_online'
    };

    try {
        const { data: pData, error } = await supabaseClient.from('pedidos').insert([pedidoCompleto]).select('id').single();
        if (error) throw error;

        const pItens = carrinho.map(item => ({
            pedido_id: pData.id,
            produto_id: item.id ? String(item.id) : null,
            nome_do_produto: item.nome + (item.opcaoEscolhida ? ` (${item.opcaoEscolhida})` : ''),
            quantidade: item.quantidade,
            preco: item.preco
        }));

        const itensRes = await supabaseClient.from('itens_do_pedido').insert(pItens);
        if (itensRes.error) console.warn('Itens com campos extras falharam, tentando compatibilidade:', itensRes.error);

        if (itensRes.error) {
            const pItensCompat = pItens.map(({ produto_id, ...rest }) => rest);
            await supabaseClient.from('itens_do_pedido').insert(pItensCompat);
        }

        await baixarEstoquePedido(pItens);

        try {
            await supabaseClient.from('clientes').upsert([{
                nome: nome,
                whatsapp: whatsapp.replace(/\D/g, ''),
                ultimo_pedido_em: new Date().toISOString()
            }], { onConflict: 'whatsapp' });
        } catch(eCliente) {}

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

        carrinho = [];
        atualizarCarrinho();
        fecharModal('cart-modal');
        showToast('Pedido enviado com sucesso!');
        setTimeout(() => { abrirModal('modal-rastreio'); }, 500);
        carregarCardapioSupabase();
    } catch(err) {
        console.error("Erro ao salvar:", err);
        showToast('Erro Supabase: verifique o SQL atualizado', 'error');
    } finally {
        btnFinalizar.style.pointerEvents = 'auto';
        btnFinalizar.style.opacity = '1';
    }
}

/* Admin ERP */

function adminSetTitle(abaId) {
    const labels = {
        'admin-dashboard': 'Dashboard',
        'admin-pedidos': 'Pedidos',
        'admin-cardapio': 'Cardápio',
        'admin-promocoes': 'Promoções',
        'admin-estoque': 'Estoque',
        'admin-clientes': 'Clientes',
        'admin-financeiro': 'Financeiro',
        'admin-loja': 'Loja',
        'admin-taxas': 'Taxas de entrega'
    };
    const el = document.getElementById('admin-current-title');
    if (el) el.textContent = labels[abaId] || 'Gestão';
}

function verificarSenhaAdminMobile() {
    const senha = document.getElementById('senha-admin-mobile').value;
    if(senha === 'admin123') {
        fecharModal('modal-admin-auth');
        document.getElementById('senha-admin-mobile').value = '';
        abrirModal('modal-admin-panel');
        mudarAbaAdmin('admin-dashboard', document.querySelector('[data-admin-tab="admin-dashboard"]'));
        adminAtualizarEstadoLojaVisual();
        adminRefreshTudo();
    } else {
        showToast('Senha incorreta!', 'error');
    }
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

    adminSetTitle(abaId);

    if(abaId === 'admin-dashboard') adminCarregarDashboard();
    if(abaId === 'admin-pedidos') carregarPedidosMobile();
    if(abaId === 'admin-loja') {
        const radios = document.getElementsByName('admin_loja_status');
        for(let r of radios) { if(r.value === configLojaGlob.status) r.checked = true; }
        const banner = document.getElementById('admin-banner-loja');
        if(banner) banner.value = configLojaGlob.textoBanner || '';
        adminAtualizarEstadoLojaVisual();
    }
    if(abaId === 'admin-cardapio') carregarAdminCardapio();
    if(abaId === 'admin-promocoes') carregarAdminPromocoes();
    if(abaId === 'admin-estoque') carregarAdminEstoque();
    if(abaId === 'admin-clientes') carregarAdminClientes();
    if(abaId === 'admin-financeiro') carregarAdminFinanceiro();
    if(abaId === 'admin-taxas') carregarAdminTaxas();
}

async function adminRefreshTudo() {
    await Promise.allSettled([
        carregarPedidosMobile(),
        carregarAdminCardapioSilencioso(),
        carregarPromocoesSupabase()
    ]);
    const active = document.querySelector('.admin-tab-content.block')?.id || 'admin-dashboard';
    if (active === 'admin-dashboard') adminCarregarDashboard();
    if (active === 'admin-financeiro') carregarAdminFinanceiro();
    if (active === 'admin-clientes') carregarAdminClientes();
    showToast('Painel sincronizado');
}

async function carregarPedidosMobile() {
    const container = document.getElementById('mobile-admin-pedidos-lista');
    if(container) container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Buscando pedidos...</h5><p>Carregando a fila em tempo real.</p></div></div>';

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
        adminPedidosCache = pedidos || [];
        renderizarPedidosMobile(adminPedidosCache);
    } catch (err) {
        adminAtualizarKpis([]);
        if(container) container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar pedidos</h5><p>${adminEscapeHtml(err.message || 'Tente atualizar novamente.')}</p></div></div>`;
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

async function carregarAdminCardapioSilencioso() {
    const { data, error } = await supabaseClient.from('produto').select('*').order('categoria');
    if (error) throw error;
    adminProdutosCache = data || [];
    return adminProdutosCache;
}

async function carregarAdminCardapio() {
    const container = document.getElementById('admin-lista-cardapio');
    if(!container) return;
    container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Buscando produtos...</h5><p>Aguarde alguns segundos.</p></div></div>';

    try {
        const data = await carregarAdminCardapioSilencioso();
        preencherSelectProdutosPromocao(data);

        if(!data || data.length === 0) {
            container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-box-open"></i><h5>Nenhum produto cadastrado</h5><p>Use o formulário ao lado para cadastrar o primeiro produto.</p></div></div>';
            return;
        }

        const dadosOrdenados = data.sort((a,b) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nome || '').localeCompare(b.nome || ''));
        container.innerHTML = dadosOrdenados.map(p => renderProdutoAdminRow(p)).join('');
    } catch(e) {
        container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar cardápio</h5><p>${adminEscapeHtml(e.message || 'Verifique sua conexão.')}</p></div></div>`;
    }
}

function renderProdutoAdminRow(p) {
    const imagem = getImagemProduto(p) || getIconeParaCategoria(p.categoria || '');
    const ativo = isProdutoAtivo(p);
    const estoqueInfo = p.controla_estoque ? `Estoque: ${Number(p.estoque_atual || 0)} / mín. ${Number(p.estoque_minimo || 0)}` : 'Sem controle de estoque';
    return `<article class="admin-product-row">
        <div class="admin-product-thumb"><img src="${adminEscapeAttr(imagem)}" alt="${adminEscapeAttr(p.nome || 'Produto')}" onerror="this.onerror=null;this.src='${adminEscapeAttr(getIconeParaCategoria(p.categoria || ''))}'"></div>
        <div class="admin-product-info">
            <strong>${adminEscapeHtml(p.nome || 'Produto')}</strong>
            <small>${adminEscapeHtml(p.categoria || 'Diversos')} • ${estoqueInfo} • ${ativo ? 'Ativo' : 'Indisponível'}</small>
        </div>
        <span class="admin-price-chip">${moneyBR(getPrecoProduto(p))}</span>
        <div class="admin-product-actions">
            <button type="button" class="admin-icon-btn" onclick="editarProdutoAdmin('${adminEscapeAttr(String(p.id))}')" title="Editar"><i class="fas fa-pen"></i></button>
            <button type="button" class="admin-icon-btn" onclick="toggleProdutoAtivoAdmin('${adminEscapeAttr(String(p.id))}', ${p.ativo === false ? 'true' : 'false'})" title="${p.ativo === false ? 'Ativar' : 'Pausar'}"><i class="fas ${p.ativo === false ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
        </div>
    </article>`;
}

function preencherSelectProdutosPromocao(produtos) {
    const select = document.getElementById('admin-promocao-produto');
    if (!select) return;
    const atual = select.value;
    select.innerHTML = '<option value="">Sem produto específico</option>' + (produtos || []).map(p => `<option value="${adminEscapeAttr(String(p.id))}">${adminEscapeHtml(p.nome || 'Produto')}</option>`).join('');
    if (atual) select.value = atual;
}

function limparFormularioProdutoAdmin() {
    const ids = ['admin-produto-id','admin-produto-nome','admin-produto-categoria','admin-produto-preco','admin-produto-preco-promocional','admin-produto-descricao','admin-produto-imagem-url','admin-produto-estoque','admin-produto-estoque-minimo'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const img = document.getElementById('admin-produto-imagem'); if (img) img.value = '';
    const ativo = document.getElementById('admin-produto-ativo'); if (ativo) ativo.checked = true;
    const destaque = document.getElementById('admin-produto-destaque'); if (destaque) destaque.checked = false;
    const controla = document.getElementById('admin-produto-controla-estoque'); if (controla) controla.checked = false;
    const title = document.getElementById('admin-produto-form-title'); if (title) title.textContent = 'Cadastrar produto';
}

function editarProdutoAdmin(id) {
    const p = adminProdutosCache.find(prod => String(prod.id) === String(id));
    if (!p) return showToast('Produto não encontrado', 'error');
    document.getElementById('admin-produto-id').value = p.id || '';
    document.getElementById('admin-produto-nome').value = p.nome || '';
    document.getElementById('admin-produto-categoria').value = p.categoria || '';
    document.getElementById('admin-produto-preco').value = p.preco || '';
    document.getElementById('admin-produto-preco-promocional').value = p.preco_promocional || '';
    document.getElementById('admin-produto-descricao').value = p.descricao || '';
    document.getElementById('admin-produto-imagem-url').value = getImagemProduto(p) || '';
    document.getElementById('admin-produto-estoque').value = p.estoque_atual ?? '';
    document.getElementById('admin-produto-estoque-minimo').value = p.estoque_minimo ?? '';
    document.getElementById('admin-produto-ativo').checked = p.ativo !== false;
    document.getElementById('admin-produto-destaque').checked = p.destaque === true;
    document.getElementById('admin-produto-controla-estoque').checked = p.controla_estoque === true;
    const title = document.getElementById('admin-produto-form-title'); if (title) title.textContent = 'Editar produto';
    document.getElementById('admin-produto-nome')?.focus();
}

async function uploadImagemAdmin(file, prefix) {
    if (!file) return '';
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const safeName = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabaseClient.storage.from(APP_STORAGE_BUCKET).upload(safeName, file, { cacheControl: '3600', upsert: true });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(APP_STORAGE_BUCKET).getPublicUrl(safeName);
    return data?.publicUrl || '';
}

async function salvarProdutoAdmin(event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
        const id = document.getElementById('admin-produto-id').value;
        const file = document.getElementById('admin-produto-imagem').files[0];
        let imagemUrl = document.getElementById('admin-produto-imagem-url').value.trim();
        if (file) imagemUrl = await uploadImagemAdmin(file, 'produtos');

        const payload = {
            nome: document.getElementById('admin-produto-nome').value.trim(),
            categoria: document.getElementById('admin-produto-categoria').value.trim(),
            descricao: document.getElementById('admin-produto-descricao').value.trim(),
            preco: toNumberBR(document.getElementById('admin-produto-preco').value) || 0,
            preco_promocional: toNumberBR(document.getElementById('admin-produto-preco-promocional').value),
            imagem_url: imagemUrl || null,
            ativo: document.getElementById('admin-produto-ativo').checked,
            destaque: document.getElementById('admin-produto-destaque').checked,
            controla_estoque: document.getElementById('admin-produto-controla-estoque').checked,
            estoque_atual: toNumberBR(document.getElementById('admin-produto-estoque').value) ?? 0,
            estoque_minimo: toNumberBR(document.getElementById('admin-produto-estoque-minimo').value) ?? 5
        };

        if (!payload.nome || !payload.categoria) throw new Error('Preencha nome e categoria.');

        let res;
        if (id) res = await supabaseClient.from('produto').update(payload).eq('id', id);
        else res = await supabaseClient.from('produto').insert([payload]);

        if (res.error) throw res.error;

        showToast('Produto salvo com sucesso!');
        limparFormularioProdutoAdmin();
        await carregarAdminCardapio();
        await carregarCardapioSupabase();
    } catch (e) {
        showToast('Erro ao salvar produto: ' + (e.message || 'Verifique o SQL'), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

async function toggleProdutoAtivoAdmin(id, novoAtivo) {
    try {
        const { error } = await supabaseClient.from('produto').update({ ativo: !!novoAtivo }).eq('id', id);
        if (error) throw error;
        showToast(novoAtivo ? 'Produto ativado' : 'Produto pausado');
        await carregarAdminCardapio();
        await carregarCardapioSupabase();
    } catch(e) {
        showToast('Erro ao atualizar produto', 'error');
    }
}

/* Promoções admin */

async function carregarAdminPromocoes() {
    const container = document.getElementById('admin-lista-promocoes');
    if(!container) return;
    container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Buscando promoções...</h5><p>Aguarde alguns segundos.</p></div></div>';

    try {
        if (!adminProdutosCache.length) await carregarAdminCardapioSilencioso();
        preencherSelectProdutosPromocao(adminProdutosCache);
        const { data, error } = await supabaseClient.from('promocoes').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        adminPromocoesCache = data || [];

        if (!adminPromocoesCache.length) {
            container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-tags"></i><h5>Nenhuma promoção cadastrada</h5><p>Crie sua primeira oferta para aparecer no cardápio.</p></div></div>';
            return;
        }

        container.innerHTML = adminPromocoesCache.map(p => renderPromocaoAdminRow(p)).join('');
    } catch (e) {
        container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar promoções</h5><p>${adminEscapeHtml(e.message || 'Verifique o SQL atualizado.')}</p></div></div>`;
    }
}

function renderPromocaoAdminRow(p) {
    const produto = adminProdutosCache.find(prod => String(prod.id) === String(p.produto_id));
    const imagem = p.imagem_url || getImagemProduto(produto) || getIconeParaCategoria(produto?.categoria || '');
    return `<article class="admin-product-row">
        <div class="admin-product-thumb"><img src="${adminEscapeAttr(imagem)}" alt="${adminEscapeAttr(p.titulo || 'Promoção')}" onerror="this.onerror=null;this.src='${adminEscapeAttr(getIconeParaCategoria(produto?.categoria || 'promo'))}'"></div>
        <div class="admin-product-info">
            <strong>${adminEscapeHtml(p.titulo || 'Promoção')}</strong>
            <small>${adminEscapeHtml(produto?.nome || 'Oferta geral')} • ${p.ativo ? 'Ativa' : 'Pausada'}</small>
        </div>
        <span class="admin-price-chip">${moneyBR(p.preco_promocional || p.preco || 0)}</span>
        <div class="admin-product-actions">
            <button type="button" class="admin-icon-btn" onclick="editarPromocaoAdmin('${adminEscapeAttr(String(p.id))}')" title="Editar"><i class="fas fa-pen"></i></button>
            <button type="button" class="admin-icon-btn" onclick="togglePromocaoAtivaAdmin('${adminEscapeAttr(String(p.id))}', ${p.ativo === false ? 'true' : 'false'})" title="${p.ativo === false ? 'Ativar' : 'Pausar'}"><i class="fas ${p.ativo === false ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
        </div>
    </article>`;
}

function limparFormularioPromocaoAdmin() {
    const ids = ['admin-promocao-id','admin-promocao-titulo','admin-promocao-descricao','admin-promocao-preco-original','admin-promocao-preco','admin-promocao-imagem-url','admin-promocao-inicio','admin-promocao-fim'];
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const prod = document.getElementById('admin-promocao-produto'); if (prod) prod.value = '';
    const img = document.getElementById('admin-promocao-imagem'); if (img) img.value = '';
    const ativo = document.getElementById('admin-promocao-ativo'); if (ativo) ativo.checked = true;
    const destaque = document.getElementById('admin-promocao-destaque'); if (destaque) destaque.checked = true;
    const title = document.getElementById('admin-promocao-form-title'); if (title) title.textContent = 'Criar promoção';
}

function editarPromocaoAdmin(id) {
    const p = adminPromocoesCache.find(item => String(item.id) === String(id));
    if (!p) return showToast('Promoção não encontrada', 'error');
    document.getElementById('admin-promocao-id').value = p.id || '';
    document.getElementById('admin-promocao-titulo').value = p.titulo || '';
    document.getElementById('admin-promocao-descricao').value = p.descricao || '';
    document.getElementById('admin-promocao-produto').value = p.produto_id || '';
    document.getElementById('admin-promocao-preco-original').value = p.preco_original || '';
    document.getElementById('admin-promocao-preco').value = p.preco_promocional || p.preco || '';
    document.getElementById('admin-promocao-imagem-url').value = p.imagem_url || '';
    document.getElementById('admin-promocao-inicio').value = p.inicia_em ? String(p.inicia_em).slice(0,16) : '';
    document.getElementById('admin-promocao-fim').value = p.termina_em ? String(p.termina_em).slice(0,16) : '';
    document.getElementById('admin-promocao-ativo').checked = p.ativo !== false;
    document.getElementById('admin-promocao-destaque').checked = p.destaque !== false;
    const title = document.getElementById('admin-promocao-form-title'); if (title) title.textContent = 'Editar promoção';
}

async function salvarPromocaoAdmin(event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    try {
        const id = document.getElementById('admin-promocao-id').value;
        const file = document.getElementById('admin-promocao-imagem').files[0];
        let imagemUrl = document.getElementById('admin-promocao-imagem-url').value.trim();
        if (file) imagemUrl = await uploadImagemAdmin(file, 'promocoes');

        const produtoId = document.getElementById('admin-promocao-produto').value || null;
        const payload = {
            titulo: document.getElementById('admin-promocao-titulo').value.trim(),
            descricao: document.getElementById('admin-promocao-descricao').value.trim(),
            produto_id: produtoId,
            preco_original: toNumberBR(document.getElementById('admin-promocao-preco-original').value),
            preco_promocional: toNumberBR(document.getElementById('admin-promocao-preco').value) || 0,
            imagem_url: imagemUrl || null,
            inicia_em: document.getElementById('admin-promocao-inicio').value || null,
            termina_em: document.getElementById('admin-promocao-fim').value || null,
            ativo: document.getElementById('admin-promocao-ativo').checked,
            destaque: document.getElementById('admin-promocao-destaque').checked
        };

        if (!payload.titulo) throw new Error('Informe o título da promoção.');

        let res;
        if (id) res = await supabaseClient.from('promocoes').update(payload).eq('id', id);
        else res = await supabaseClient.from('promocoes').insert([payload]);

        if (res.error) throw res.error;

        showToast('Promoção salva com sucesso!');
        limparFormularioPromocaoAdmin();
        await carregarAdminPromocoes();
        await carregarPromocoesSupabase();
    } catch (e) {
        showToast('Erro ao salvar promoção: ' + (e.message || 'Verifique o SQL'), 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

async function togglePromocaoAtivaAdmin(id, novoAtivo) {
    try {
        const { error } = await supabaseClient.from('promocoes').update({ ativo: !!novoAtivo }).eq('id', id);
        if (error) throw error;
        showToast(novoAtivo ? 'Promoção ativada' : 'Promoção pausada');
        await carregarAdminPromocoes();
        await carregarPromocoesSupabase();
    } catch(e) {
        showToast('Erro ao atualizar promoção', 'error');
    }
}

/* Estoque, Clientes e Financeiro */

async function carregarAdminEstoque() {
    const container = document.getElementById('admin-lista-estoque');
    if (!container) return;
    container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Carregando estoque...</h5><p>Buscando produtos cadastrados.</p></div></div>';

    try {
        const produtos = await carregarAdminCardapioSilencioso();
        if (!produtos.length) {
            container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-box-open"></i><h5>Sem produtos</h5><p>Cadastre produtos antes de controlar estoque.</p></div></div>';
            return;
        }

        container.innerHTML = produtos.map(p => {
            const atual = Number(p.estoque_atual || 0);
            const minimo = Number(p.estoque_minimo || 5);
            const status = !p.controla_estoque ? { cls: 'ok', label: 'Sem controle' } : atual <= 0 ? { cls: 'out', label: 'Esgotado' } : atual <= minimo ? { cls: 'low', label: 'Baixo' } : { cls: 'ok', label: 'Ok' };

            return `<article class="erp-stock-row">
                <div>
                    <h5>${adminEscapeHtml(p.nome || 'Produto')}</h5>
                    <p>${adminEscapeHtml(p.categoria || 'Diversos')}</p>
                </div>
                <input type="number" min="0" step="1" class="admin-input" id="estoque-atual-${adminEscapeAttr(String(p.id))}" value="${adminEscapeAttr(String(atual))}" aria-label="Estoque atual">
                <input type="number" min="0" step="1" class="admin-input" id="estoque-min-${adminEscapeAttr(String(p.id))}" value="${adminEscapeAttr(String(minimo))}" aria-label="Estoque mínimo">
                <span class="erp-stock-status ${status.cls}">${status.label}</span>
                <button type="button" class="admin-save-btn" onclick="salvarEstoqueProdutoAdmin('${adminEscapeAttr(String(p.id))}')"><i class="fas fa-save"></i> Salvar</button>
            </article>`;
        }).join('');
    } catch(e) {
        container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro no estoque</h5><p>${adminEscapeHtml(e.message || 'Verifique o SQL.')}</p></div></div>`;
    }
}

async function salvarEstoqueProdutoAdmin(id) {
    try {
        const atual = toNumberBR(document.getElementById(`estoque-atual-${id}`).value) || 0;
        const minimo = toNumberBR(document.getElementById(`estoque-min-${id}`).value) || 0;
        const { error } = await supabaseClient.from('produto').update({
            estoque_atual: atual,
            estoque_minimo: minimo,
            controla_estoque: true,
            ativo: atual > 0
        }).eq('id', id);
        if (error) throw error;
        showToast('Estoque atualizado');
        await carregarAdminEstoque();
        await carregarCardapioSupabase();
    } catch(e) {
        showToast('Erro ao salvar estoque', 'error');
    }
}

async function carregarAdminClientes() {
    const container = document.getElementById('admin-lista-clientes');
    if (!container) return;
    container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Carregando clientes...</h5><p>Montando base própria.</p></div></div>';

    try {
        const { data, error } = await supabaseClient.from('pedidos').select('nome_cliente, whatsapp, total, created_at').order('created_at', { ascending: false }).limit(500);
        if (error) throw error;

        const map = {};
        (data || []).forEach(p => {
            const key = String(p.whatsapp || '').replace(/\D/g, '') || p.nome_cliente || 'sem-whatsapp';
            if (!map[key]) map[key] = { nome: p.nome_cliente || 'Cliente', whatsapp: key, pedidos: 0, total: 0, ultimo: p.created_at };
            map[key].pedidos += 1;
            map[key].total += Number(p.total || 0);
            if (new Date(p.created_at) > new Date(map[key].ultimo)) map[key].ultimo = p.created_at;
        });

        const clientes = Object.values(map).sort((a,b) => b.total - a.total);
        if (!clientes.length) {
            container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-users"></i><h5>Nenhum cliente ainda</h5><p>Clientes aparecerão automaticamente após os pedidos.</p></div></div>';
            return;
        }

        container.innerHTML = clientes.map(c => `<article class="erp-client-row">
            <div>
                <h5>${adminEscapeHtml(c.nome)}</h5>
                <p>${adminEscapeHtml(c.whatsapp || 'WhatsApp não informado')} • Último pedido: ${adminEscapeHtml(adminHora(c.ultimo))}</p>
            </div>
            <div class="erp-client-stats">
                <span>${c.pedidos} pedido(s)</span>
                <span>${moneyBR(c.total)}</span>
            </div>
            <a class="admin-soft-btn" href="https://wa.me/${adminEscapeAttr(c.whatsapp)}" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> Chamar</a>
        </article>`).join('');
    } catch(e) {
        container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar clientes</h5><p>${adminEscapeHtml(e.message || 'Tente novamente.')}</p></div></div>`;
    }
}

async function carregarAdminFinanceiro() {
    const container = document.getElementById('admin-financeiro-resumo');
    if (!container) return;
    container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Carregando financeiro...</h5><p>Calculando vendas diretas.</p></div></div>';

    try {
        const { data, error } = await supabaseClient.from('pedidos').select('*').order('created_at', { ascending: false }).limit(800);
        if (error) throw error;
        adminFinanceiroCache = data || [];
        container.innerHTML = renderFinanceiroCards(adminFinanceiroCache);
    } catch(e) {
        container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar financeiro</h5><p>${adminEscapeHtml(e.message || 'Tente novamente.')}</p></div></div>`;
    }
}

function renderFinanceiroCards(pedidos) {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const seteDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const validos = (pedidos || []).filter(p => !['Cancelado'].includes(p.status));
    const hojePedidos = validos.filter(p => new Date(p.created_at) >= inicioHoje);
    const semanaPedidos = validos.filter(p => new Date(p.created_at) >= seteDias);
    const faturamentoHoje = hojePedidos.reduce((s,p) => s + Number(p.total || 0), 0);
    const faturamentoSemana = semanaPedidos.reduce((s,p) => s + Number(p.total || 0), 0);
    const ticket = validos.length ? validos.reduce((s,p) => s + Number(p.total || 0), 0) / validos.length : 0;
    const economiaEstimada = validos.reduce((s,p) => s + Number(p.total || 0), 0) * 0.12;

    return `
        <article class="erp-insight-card"><h5>Vendas hoje</h5><strong>${moneyBR(faturamentoHoje)}</strong><small>${hojePedidos.length} pedido(s)</small></article>
        <article class="erp-insight-card"><h5>Últimos 7 dias</h5><strong>${moneyBR(faturamentoSemana)}</strong><small>${semanaPedidos.length} pedido(s)</small></article>
        <article class="erp-insight-card"><h5>Ticket médio</h5><strong>${moneyBR(ticket)}</strong><small>base dos pedidos recentes</small></article>
        <article class="erp-insight-card"><h5>Economia estimada</h5><strong>${moneyBR(economiaEstimada)}</strong><small>simulação sem comissão externa</small></article>
        <article class="erp-table-card full">
            <h5 class="font-black text-gray-800 mb-3">Últimas vendas</h5>
            <div class="space-y-2">
                ${(validos || []).slice(0,8).map(p => `<div class="flex justify-between gap-3 border-b border-gray-100 pb-2 text-sm">
                    <span><b>#${adminEscapeHtml(p.id)}</b> ${adminEscapeHtml(p.nome_cliente || 'Cliente')}</span>
                    <strong>${moneyBR(p.total || 0)}</strong>
                </div>`).join('') || '<p class="text-sm text-gray-500 font-semibold">Sem vendas recentes.</p>'}
            </div>
        </article>
    `;
}

async function adminCarregarDashboard() {
    const container = document.getElementById('admin-dashboard-resumo');
    if (!container) return;
    container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Carregando indicadores...</h5><p>Buscando vendas, clientes e estoque.</p></div></div>';

    try {
        const [pedidosRes, produtosRes, promocoesRes] = await Promise.allSettled([
            supabaseClient.from('pedidos').select('*').order('created_at', { ascending: false }).limit(500),
            supabaseClient.from('produto').select('*'),
            supabaseClient.from('promocoes').select('*')
        ]);

        const pedidos = pedidosRes.value?.data || [];
        const produtos = produtosRes.value?.data || [];
        const promocoes = promocoesRes.value?.data || [];
        const clientesUnicos = new Set(pedidos.map(p => String(p.whatsapp || '').replace(/\D/g,'')).filter(Boolean)).size;
        const estoqueBaixo = produtos.filter(p => p.controla_estoque && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 5)).length;
        const ativos = pedidos.filter(p => !['Entregue','Finalizado','Cancelado'].includes(p.status));
        const totalAtivo = ativos.reduce((s,p) => s + Number(p.total || 0), 0);
        adminAtualizarKpis(ativos);

        container.innerHTML = `
            <article class="erp-insight-card"><h5>Fila ativa</h5><strong>${ativos.length}</strong><small>${moneyBR(totalAtivo)} em aberto</small></article>
            <article class="erp-insight-card"><h5>Produtos</h5><strong>${produtos.length}</strong><small>${produtos.filter(p => p.ativo !== false).length} ativos</small></article>
            <article class="erp-insight-card"><h5>Clientes próprios</h5><strong>${clientesUnicos}</strong><small>compraram direto</small></article>
            <article class="erp-insight-card"><h5>Alertas estoque</h5><strong>${estoqueBaixo}</strong><small>itens baixos ou zerados</small></article>
            <article class="erp-chart-card">
                <h5 class="font-black text-gray-800 mb-3">Ações recomendadas</h5>
                <div class="space-y-3 text-sm font-semibold text-gray-600">
                    <p><i class="fas fa-bullhorn text-insta-pink mr-2"></i> Publique o link do cardápio no Instagram e no WhatsApp.</p>
                    <p><i class="fas fa-tags text-insta-pink mr-2"></i> Mantenha pelo menos uma promoção ativa por dia.</p>
                    <p><i class="fas fa-image text-insta-pink mr-2"></i> Produtos com foto aumentam a confiança e o desejo de compra.</p>
                </div>
            </article>
            <article class="erp-chart-card">
                <h5 class="font-black text-gray-800 mb-3">Promoções</h5>
                <div class="space-y-2">
                    ${promocoes.slice(0,5).map(p => `<div class="flex justify-between border-b border-gray-100 pb-2 text-sm"><span>${adminEscapeHtml(p.titulo || 'Promoção')}</span><b>${p.ativo ? 'Ativa' : 'Pausada'}</b></div>`).join('') || '<p class="text-sm text-gray-500 font-semibold">Nenhuma promoção cadastrada ainda.</p>'}
                </div>
            </article>
        `;
    } catch(e) {
        container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro no dashboard</h5><p>${adminEscapeHtml(e.message || 'Tente novamente.')}</p></div></div>`;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        carregarPromocoesSupabase();
        const busca = document.getElementById('busca-cardapio');
        if (busca && !busca.dataset.bound) {
            busca.dataset.bound = 'true';
            busca.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') limparBuscaCardapio();
            });
        }
    }, 500);
});


async function carregarCardapioSupabase() {
    mostrarLoaderCardapio();
    try {
        let res = await supabaseClient.from('produto').select('*').order('ordem', { ascending: true });
        if (res.error) {
            res = await supabaseClient.from('produto').select('*');
        }
        if (res.error) throw res.error;

        const data = res.data || [];
        if (data.length > 0) {
            safeStorage.setItem('InstaLanches_CardapioCacheV4', JSON.stringify(data));
            montarInterface(data);
        } else {
            esconderLoaderCardapio();
            document.getElementById('container-cardapio').innerHTML = '<p class="text-center text-gray-500 py-10 font-bold">Ainda não há produtos cadastrados no cardápio.</p>';
        }
    } catch (err) {
        esconderLoaderCardapio();
        document.getElementById('container-cardapio').innerHTML = `<div class="text-center p-8"><i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-3"></i><p class="text-red-500 font-bold">Erro ao carregar o cardápio!</p><p class="text-xs text-gray-500 mt-2">${escapeClienteHtml(err.message || 'Verifique a sua internet ou rode o SQL atualizado.')}</p></div>`;
    }
}


/* =========================================================
   V5 - Refinos do painel admin: navegação estável e upload com preview
   ========================================================= */

(function adminV5Enhancements(){
    const uploadState = {
        produto: { input: 'admin-produto-imagem', url: 'admin-produto-imagem-url', box: 'admin-produto-upload-box', preview: 'admin-produto-upload-preview', title: 'admin-produto-upload-title', help: 'admin-produto-upload-help', defaultTitle: 'Enviar foto do produto', defaultHelp: 'JPG, PNG ou WEBP. Toque para escolher.' },
        promocao: { input: 'admin-promocao-imagem', url: 'admin-promocao-imagem-url', box: 'admin-promocao-upload-box', preview: 'admin-promocao-upload-preview', title: 'admin-promocao-upload-title', help: 'admin-promocao-upload-help', defaultTitle: 'Enviar arte da promoção', defaultHelp: 'Imagem horizontal ou quadrada fica melhor.' }
    };

    function adminV5SetUpload(kind, imageUrl, fileName) {
        const cfg = uploadState[kind];
        if (!cfg) return;

        const box = document.getElementById(cfg.box);
        const preview = document.getElementById(cfg.preview);
        const title = document.getElementById(cfg.title);
        const help = document.getElementById(cfg.help);

        if (!box || !preview || !title || !help) return;

        if (imageUrl) {
            box.classList.add('has-file');
            preview.innerHTML = `<img src="${adminEscapeAttr(imageUrl)}" alt="Prévia da imagem" onerror="this.closest('.admin-upload-box')?.classList.remove('has-file'); this.parentElement.innerHTML='<i class=&quot;fas fa-image&quot;></i>';"/>`;
            title.textContent = fileName || 'Imagem selecionada';
            help.textContent = 'Toque para trocar a imagem.';
        } else {
            box.classList.remove('has-file');
            preview.innerHTML = '<i class="fas fa-cloud-arrow-up"></i>';
            title.textContent = cfg.defaultTitle;
            help.textContent = cfg.defaultHelp;
        }
    }

    function adminV5BindUpload(kind) {
        const cfg = uploadState[kind];
        if (!cfg) return;

        const input = document.getElementById(cfg.input);
        const urlInput = document.getElementById(cfg.url);

        if (input && !input.dataset.adminV5UploadBound) {
            input.dataset.adminV5UploadBound = 'true';
            input.addEventListener('change', function () {
                const file = input.files && input.files[0];
                if (!file) {
                    const urlValue = urlInput ? urlInput.value.trim() : '';
                    adminV5SetUpload(kind, urlValue || '', '');
                    return;
                }

                if (!/^image\//i.test(file.type)) {
                    input.value = '';
                    showToast('Escolha um arquivo de imagem.', 'error');
                    adminV5SetUpload(kind, '', '');
                    return;
                }

                const maxSizeMb = 6;
                if (file.size > maxSizeMb * 1024 * 1024) {
                    input.value = '';
                    showToast(`Imagem muito pesada. Use até ${maxSizeMb}MB.`, 'error');
                    adminV5SetUpload(kind, '', '');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function (event) {
                    adminV5SetUpload(kind, event.target.result, file.name);
                };
                reader.readAsDataURL(file);
            });
        }

        if (urlInput && !urlInput.dataset.adminV5UrlBound) {
            urlInput.dataset.adminV5UrlBound = 'true';
            urlInput.addEventListener('input', function () {
                const file = input && input.files && input.files[0];
                if (file) return;
                const value = urlInput.value.trim();
                adminV5SetUpload(kind, value, value ? 'Imagem por URL' : '');
            });
        }
    }

    function adminV5BindAllUploads() {
        adminV5BindUpload('produto');
        adminV5BindUpload('promocao');
    }

    function adminV5ScrollActiveTab() {
        const activeMobile = document.querySelector('#modal-admin-panel .erp-mobile-tabs .admin-tab-active');
        if (activeMobile && activeMobile.scrollIntoView) {
            activeMobile.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }

        const activeDesktop = document.querySelector('#modal-admin-panel .erp-nav .admin-tab-active');
        if (activeDesktop && activeDesktop.scrollIntoView) {
            activeDesktop.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
    }

    function adminV5ScrollContentTop() {
        const content = document.querySelector('#modal-admin-panel .erp-content');
        if (content) content.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function adminV5PreparePanel() {
        const panel = document.getElementById('modal-admin-panel');
        if (!panel) return;
        if (panel.classList.contains('show')) {
            document.body.classList.add('admin-panel-open');
        }
        adminV5BindAllUploads();
        adminV5ScrollActiveTab();
    }

    const originalMudarAbaAdmin = window.mudarAbaAdmin;
    if (typeof originalMudarAbaAdmin === 'function' && !originalMudarAbaAdmin.__adminV5Wrapped) {
        const wrapped = function(abaId, btnElement) {
            const result = originalMudarAbaAdmin.apply(this, arguments);
            setTimeout(function() {
                adminV5ScrollActiveTab();
                adminV5ScrollContentTop();
            }, 40);
            return result;
        };
        wrapped.__adminV5Wrapped = true;
        window.mudarAbaAdmin = wrapped;
    }

    const originalLimparProduto = window.limparFormularioProdutoAdmin;
    if (typeof originalLimparProduto === 'function' && !originalLimparProduto.__adminV5Wrapped) {
        const wrapped = function() {
            const result = originalLimparProduto.apply(this, arguments);
            adminV5SetUpload('produto', '', '');
            return result;
        };
        wrapped.__adminV5Wrapped = true;
        window.limparFormularioProdutoAdmin = wrapped;
    }

    const originalEditarProduto = window.editarProdutoAdmin;
    if (typeof originalEditarProduto === 'function' && !originalEditarProduto.__adminV5Wrapped) {
        const wrapped = function(id) {
            const result = originalEditarProduto.apply(this, arguments);
            const produto = ((typeof adminProdutosCache !== 'undefined' ? adminProdutosCache : window.adminProdutosCache) || []).find(function(p){ return String(p.id) === String(id); });
            const image = produto ? (getImagemProduto(produto) || '') : '';
            adminV5SetUpload('produto', image, image ? 'Foto atual do produto' : '');
            setTimeout(adminV5BindAllUploads, 20);
            return result;
        };
        wrapped.__adminV5Wrapped = true;
        window.editarProdutoAdmin = wrapped;
    }

    const originalLimparPromocao = window.limparFormularioPromocaoAdmin;
    if (typeof originalLimparPromocao === 'function' && !originalLimparPromocao.__adminV5Wrapped) {
        const wrapped = function() {
            const result = originalLimparPromocao.apply(this, arguments);
            adminV5SetUpload('promocao', '', '');
            return result;
        };
        wrapped.__adminV5Wrapped = true;
        window.limparFormularioPromocaoAdmin = wrapped;
    }

    const originalEditarPromocao = window.editarPromocaoAdmin;
    if (typeof originalEditarPromocao === 'function' && !originalEditarPromocao.__adminV5Wrapped) {
        const wrapped = function(id) {
            const result = originalEditarPromocao.apply(this, arguments);
            const promocao = ((typeof adminPromocoesCache !== 'undefined' ? adminPromocoesCache : window.adminPromocoesCache) || []).find(function(p){ return String(p.id) === String(id); });
            const image = promocao && promocao.imagem_url ? promocao.imagem_url : '';
            adminV5SetUpload('promocao', image, image ? 'Imagem atual da promoção' : '');
            setTimeout(adminV5BindAllUploads, 20);
            return result;
        };
        wrapped.__adminV5Wrapped = true;
        window.editarPromocaoAdmin = wrapped;
    }

    const originalAbrirAdminAuth = window.abrirAdminAuth;
    if (typeof originalAbrirAdminAuth === 'function' && !originalAbrirAdminAuth.__adminV5Wrapped) {
        const wrapped = function() {
            const result = originalAbrirAdminAuth.apply(this, arguments);
            setTimeout(adminV5PreparePanel, 120);
            return result;
        };
        wrapped.__adminV5Wrapped = true;
        window.abrirAdminAuth = wrapped;
    }

    const originalFecharModal = window.fecharModal;
    if (typeof originalFecharModal === 'function' && !originalFecharModal.__adminV5Wrapped) {
        const wrapped = function(id) {
            const result = originalFecharModal.apply(this, arguments);
            if (id === 'modal-admin-panel') {
                document.body.classList.remove('admin-panel-open');
            }
            return result;
        };
        wrapped.__adminV5Wrapped = true;
        window.fecharModal = wrapped;
    }

    document.addEventListener('DOMContentLoaded', function(){
        adminV5BindAllUploads();
        window.addEventListener('resize', adminV5PreparePanel);
    });

    window.adminV5SetUpload = adminV5SetUpload;
    window.adminV5PreparePanel = adminV5PreparePanel;
})();




/* =========================================================
   V6 - Admin ERP: formulários sob demanda, dashboard sem
   redundância e listas com leitura profissional.
   ========================================================= */
(function adminV6ErpRefinement(){
    function $(id) { return document.getElementById(id); }

    function setCrudOpen(layoutId, formId, open) {
        const layout = $(layoutId);
        const form = $(formId);
        if (layout) layout.classList.toggle('form-open', !!open);
        if (form) form.classList.toggle('hidden', !open);
    }

    function scrollAdminToForm(formId) {
        const form = $(formId);
        const content = document.querySelector('#modal-admin-panel .erp-content');
        if (!form || !content) return;
        const top = Math.max(0, form.offsetTop - 70);
        content.scrollTo({ top, behavior: 'smooth' });
    }

    function updateSidebarContext() {
        const el = $('admin-side-mode');
        const status = $('admin-sidebar-status');
        if (el) {
            if (window.statusLoja && statusLoja.aceitandoPedidos === false) el.textContent = 'Operação pausada';
            else el.textContent = 'Operação direta';
        }
        if (status) {
            const aberta = !window.statusLoja || statusLoja.aceitandoPedidos !== false;
            status.innerHTML = `<i class="fas fa-circle"></i> ${aberta ? 'Loja aberta' : 'Loja pausada'}`;
            status.style.color = aberta ? '#047857' : '#b42318';
            status.style.background = aberta ? '#ecfdf5' : '#fff1f0';
            status.style.borderColor = aberta ? '#d1fae5' : '#ffdad6';
        }
    }

    window.adminAbrirFormularioProdutoNovo = function() {
        if (typeof window.limparFormularioProdutoAdmin === 'function') {
            window.__adminV6OpeningProduto = true;
            window.limparFormularioProdutoAdmin();
            window.__adminV6OpeningProduto = false;
        }
        setCrudOpen('admin-cardapio-layout', 'admin-produto-form-card', true);
        setTimeout(function(){
            $('admin-produto-nome')?.focus();
            scrollAdminToForm('admin-produto-form-card');
            if (typeof window.adminV5SetUpload === 'function') window.adminV5SetUpload('produto', '', '');
        }, 50);
    };

    window.adminFecharFormularioProduto = function() {
        setCrudOpen('admin-cardapio-layout', 'admin-produto-form-card', false);
        if (typeof window.adminV5SetUpload === 'function') window.adminV5SetUpload('produto', '', '');
    };

    window.adminAbrirFormularioPromocaoNovo = function() {
        if (typeof window.limparFormularioPromocaoAdmin === 'function') {
            window.__adminV6OpeningPromocao = true;
            window.limparFormularioPromocaoAdmin();
            window.__adminV6OpeningPromocao = false;
        }
        setCrudOpen('admin-promocoes-layout', 'admin-promocao-form-card', true);
        setTimeout(function(){
            $('admin-promocao-titulo')?.focus();
            scrollAdminToForm('admin-promocao-form-card');
            if (typeof window.adminV5SetUpload === 'function') window.adminV5SetUpload('promocao', '', '');
        }, 50);
    };

    window.adminFecharFormularioPromocao = function() {
        setCrudOpen('admin-promocoes-layout', 'admin-promocao-form-card', false);
        if (typeof window.adminV5SetUpload === 'function') window.adminV5SetUpload('promocao', '', '');
    };

    window.adminAbrirFormularioTaxa = function() {
        const bairro = $('nova-taxa-bairro');
        const valor = $('nova-taxa-valor');
        if (bairro) bairro.value = '';
        if (valor) valor.value = '';
        const form = $('admin-taxa-form-card');
        if (form) form.classList.remove('hidden');
        setTimeout(function(){
            bairro?.focus();
            scrollAdminToForm('admin-taxa-form-card');
        }, 40);
    };

    window.adminFecharFormularioTaxa = function() {
        const form = $('admin-taxa-form-card');
        if (form) form.classList.add('hidden');
    };

    const baseLimparProduto = window.limparFormularioProdutoAdmin;
    if (typeof baseLimparProduto === 'function' && !baseLimparProduto.__adminV6Wrapped) {
        const wrapped = function() {
            const result = baseLimparProduto.apply(this, arguments);
            if (window.__adminSavingProduto) {
                window.adminFecharFormularioProduto();
            } else if (window.__adminV6OpeningProduto) {
                setCrudOpen('admin-cardapio-layout', 'admin-produto-form-card', true);
            }
            return result;
        };
        wrapped.__adminV6Wrapped = true;
        window.limparFormularioProdutoAdmin = wrapped;
    }

    const baseEditarProduto = window.editarProdutoAdmin;
    if (typeof baseEditarProduto === 'function' && !baseEditarProduto.__adminV6Wrapped) {
        const wrapped = function(id) {
            const result = baseEditarProduto.apply(this, arguments);
            setCrudOpen('admin-cardapio-layout', 'admin-produto-form-card', true);
            setTimeout(function(){
                scrollAdminToForm('admin-produto-form-card');
            }, 60);
            return result;
        };
        wrapped.__adminV6Wrapped = true;
        window.editarProdutoAdmin = wrapped;
    }

    const baseSalvarProduto = window.salvarProdutoAdmin;
    if (typeof baseSalvarProduto === 'function' && !baseSalvarProduto.__adminV6Wrapped) {
        const wrapped = async function(event) {
            window.__adminSavingProduto = true;
            try {
                const result = await baseSalvarProduto.apply(this, arguments);
                window.adminFecharFormularioProduto();
                return result;
            } finally {
                window.__adminSavingProduto = false;
            }
        };
        wrapped.__adminV6Wrapped = true;
        window.salvarProdutoAdmin = wrapped;
    }

    const baseLimparPromocao = window.limparFormularioPromocaoAdmin;
    if (typeof baseLimparPromocao === 'function' && !baseLimparPromocao.__adminV6Wrapped) {
        const wrapped = function() {
            const result = baseLimparPromocao.apply(this, arguments);
            if (window.__adminSavingPromocao) {
                window.adminFecharFormularioPromocao();
            } else if (window.__adminV6OpeningPromocao) {
                setCrudOpen('admin-promocoes-layout', 'admin-promocao-form-card', true);
            }
            return result;
        };
        wrapped.__adminV6Wrapped = true;
        window.limparFormularioPromocaoAdmin = wrapped;
    }

    const baseEditarPromocao = window.editarPromocaoAdmin;
    if (typeof baseEditarPromocao === 'function' && !baseEditarPromocao.__adminV6Wrapped) {
        const wrapped = function(id) {
            const result = baseEditarPromocao.apply(this, arguments);
            setCrudOpen('admin-promocoes-layout', 'admin-promocao-form-card', true);
            setTimeout(function(){
                scrollAdminToForm('admin-promocao-form-card');
            }, 60);
            return result;
        };
        wrapped.__adminV6Wrapped = true;
        window.editarPromocaoAdmin = wrapped;
    }

    const baseSalvarPromocao = window.salvarPromocaoAdmin;
    if (typeof baseSalvarPromocao === 'function' && !baseSalvarPromocao.__adminV6Wrapped) {
        const wrapped = async function(event) {
            window.__adminSavingPromocao = true;
            try {
                const result = await baseSalvarPromocao.apply(this, arguments);
                window.adminFecharFormularioPromocao();
                return result;
            } finally {
                window.__adminSavingPromocao = false;
            }
        };
        wrapped.__adminV6Wrapped = true;
        window.salvarPromocaoAdmin = wrapped;
    }

    const baseAdicionarTaxa = window.adicionarTaxaAdmin;
    if (typeof baseAdicionarTaxa === 'function' && !baseAdicionarTaxa.__adminV6Wrapped) {
        const wrapped = async function(btn) {
            const result = await baseAdicionarTaxa.apply(this, arguments);
            const bairro = $('nova-taxa-bairro');
            const valor = $('nova-taxa-valor');
            if (bairro && !bairro.value && valor && !valor.value) window.adminFecharFormularioTaxa();
            return result;
        };
        wrapped.__adminV6Wrapped = true;
        window.adicionarTaxaAdmin = wrapped;
    }

    // Linhas de dados com leitura de ERP: menos cartão, mais tabela.
    window.renderProdutoAdminRow = function(p) {
        const imagem = getImagemProduto(p) || getIconeParaCategoria(p.categoria || '');
        const ativo = isProdutoAtivo(p);
        const estoque = p.controla_estoque
            ? `${Number(p.estoque_atual || 0)} em estoque • mín. ${Number(p.estoque_minimo || 0)}`
            : 'Estoque não controlado';
        const foto = getImagemProduto(p) ? 'com foto' : 'sem foto';
        return `<article class="admin-product-row erp-data-row">
            <div class="admin-product-thumb"><img src="${adminEscapeAttr(imagem)}" alt="${adminEscapeAttr(p.nome || 'Produto')}" onerror="this.onerror=null;this.src='${adminEscapeAttr(getIconeParaCategoria(p.categoria || ''))}'"></div>
            <div class="admin-product-info">
                <strong>${adminEscapeHtml(p.nome || 'Produto')}</strong>
                <small>${adminEscapeHtml(p.categoria || 'Diversos')} • ${estoque} • ${foto} • ${ativo ? 'Ativo' : 'Indisponível'}</small>
            </div>
            <span class="admin-price-chip">${moneyBR(getPrecoProduto(p))}</span>
            <div class="admin-product-actions">
                <button type="button" class="admin-icon-btn" onclick="editarProdutoAdmin('${adminEscapeAttr(String(p.id))}')" title="Editar produto"><i class="fas fa-pen"></i></button>
                <button type="button" class="admin-icon-btn" onclick="toggleProdutoAtivoAdmin('${adminEscapeAttr(String(p.id))}', ${p.ativo === false ? 'true' : 'false'})" title="${p.ativo === false ? 'Ativar' : 'Pausar'}"><i class="fas ${p.ativo === false ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
            </div>
        </article>`;
    };

    window.renderPromocaoAdminRow = function(p) {
        const produto = adminProdutosCache.find(prod => String(prod.id) === String(p.produto_id));
        const imagem = p.imagem_url || getImagemProduto(produto) || getIconeParaCategoria(produto?.categoria || 'promo');
        const validade = p.termina_em ? `até ${String(p.termina_em).slice(0,10).split('-').reverse().join('/')}` : 'sem validade definida';
        return `<article class="admin-product-row erp-data-row">
            <div class="admin-product-thumb"><img src="${adminEscapeAttr(imagem)}" alt="${adminEscapeAttr(p.titulo || 'Promoção')}" onerror="this.onerror=null;this.src='${adminEscapeAttr(getIconeParaCategoria(produto?.categoria || 'promo'))}'"></div>
            <div class="admin-product-info">
                <strong>${adminEscapeHtml(p.titulo || 'Promoção')}</strong>
                <small>${adminEscapeHtml(produto?.nome || 'Oferta geral')} • ${validade} • ${p.ativo ? 'Ativa' : 'Pausada'}</small>
            </div>
            <span class="admin-price-chip">${moneyBR(p.preco_promocional || p.preco || 0)}</span>
            <div class="admin-product-actions">
                <button type="button" class="admin-icon-btn" onclick="editarPromocaoAdmin('${adminEscapeAttr(String(p.id))}')" title="Editar promoção"><i class="fas fa-pen"></i></button>
                <button type="button" class="admin-icon-btn" onclick="togglePromocaoAtivaAdmin('${adminEscapeAttr(String(p.id))}', ${p.ativo === false ? 'true' : 'false'})" title="${p.ativo === false ? 'Ativar' : 'Pausar'}"><i class="fas ${p.ativo === false ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
            </div>
        </article>`;
    };

    // Dashboard agora mostra indicadores diferentes dos KPIs fixos do topo.
    window.adminCarregarDashboard = async function() {
        const container = $('admin-dashboard-resumo');
        if (!container) return;
        container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Carregando indicadores...</h5><p>Consolidando vendas, catálogo e crescimento.</p></div></div>';

        try {
            const [pedidosRes, produtosRes, promocoesRes] = await Promise.allSettled([
                supabaseClient.from('pedidos').select('*').order('created_at', { ascending: false }).limit(500),
                supabaseClient.from('produto').select('*'),
                supabaseClient.from('promocoes').select('*')
            ]);

            const pedidos = pedidosRes.value?.data || [];
            const produtos = produtosRes.value?.data || [];
            const promocoes = promocoesRes.value?.data || [];
            const ativos = pedidos.filter(p => !['Entregue','Finalizado','Cancelado'].includes(p.status));
            const hoje = new Date().toISOString().slice(0, 10);
            const pedidosHoje = pedidos.filter(p => String(p.created_at || '').slice(0,10) === hoje);
            const faturamentoHoje = pedidosHoje.reduce((s,p) => s + Number(p.total || 0), 0);
            const ticketMedio = pedidosHoje.length ? faturamentoHoje / pedidosHoje.length : 0;
            const produtosAtivos = produtos.filter(p => p.ativo !== false);
            const semFoto = produtosAtivos.filter(p => !getImagemProduto(p)).length;
            const promoAtivas = promocoes.filter(p => p.ativo !== false).length;
            const clientesMap = {};
            pedidos.forEach(function(p){
                const key = String(p.whatsapp || '').replace(/\D/g,'');
                if (!key) return;
                clientesMap[key] = (clientesMap[key] || 0) + 1;
            });
            const recorrentes = Object.values(clientesMap).filter(v => v > 1).length;
            const estoqueCritico = produtos.filter(p => p.controla_estoque && Number(p.estoque_atual || 0) <= Number(p.estoque_minimo || 5)).length;

            if (typeof adminAtualizarKpis === 'function') adminAtualizarKpis(ativos);

            container.innerHTML = `
                <article class="erp-insight-card"><h5>Vendas hoje</h5><strong>${moneyBR(faturamentoHoje)}</strong><small>${pedidosHoje.length} pedidos no dia</small></article>
                <article class="erp-insight-card"><h5>Ticket médio</h5><strong>${moneyBR(ticketMedio)}</strong><small>média dos pedidos de hoje</small></article>
                <article class="erp-insight-card"><h5>Fotos pendentes</h5><strong>${semFoto}</strong><small>produtos ativos sem imagem</small></article>
                <article class="erp-insight-card"><h5>Promoções ativas</h5><strong>${promoAtivas}</strong><small>ofertas visíveis no cardápio</small></article>

                <article class="erp-chart-card">
                    <h5 class="font-black text-gray-800 mb-3">Prioridades operacionais</h5>
                    <div class="space-y-3 text-sm font-semibold text-gray-600">
                        <p><i class="fas fa-image text-gray-500 mr-2"></i> Complete imagens dos produtos sem foto para melhorar conversão.</p>
                        <p><i class="fas fa-boxes-stacked text-gray-500 mr-2"></i> Revise ${estoqueCritico} item(ns) com estoque baixo ou zerado.</p>
                        <p><i class="fas fa-users text-gray-500 mr-2"></i> ${recorrentes} cliente(s) já compraram mais de uma vez; use isso para campanhas.</p>
                    </div>
                </article>
                <article class="erp-chart-card">
                    <h5 class="font-black text-gray-800 mb-3">Promoções recentes</h5>
                    <div class="space-y-2">
                        ${promocoes.slice(0,5).map(p => `<div class="flex justify-between border-b border-gray-100 pb-2 text-sm gap-3"><span class="truncate">${adminEscapeHtml(p.titulo || 'Promoção')}</span><b>${p.ativo !== false ? 'Ativa' : 'Pausada'}</b></div>`).join('') || '<p class="text-sm text-gray-500 font-semibold">Nenhuma promoção cadastrada ainda.</p>'}
                    </div>
                </article>
            `;
        } catch(e) {
            container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro no dashboard</h5><p>${adminEscapeHtml(e.message || 'Tente novamente.')}</p></div></div>`;
        }
    };

    const baseMudarAba = window.mudarAbaAdmin;
    if (typeof baseMudarAba === 'function' && !baseMudarAba.__adminV6Wrapped) {
        const wrapped = function(abaId, btnElement) {
            const result = baseMudarAba.apply(this, arguments);
            updateSidebarContext();
            if (abaId !== 'admin-cardapio') window.adminFecharFormularioProduto?.();
            if (abaId !== 'admin-promocoes') window.adminFecharFormularioPromocao?.();
            if (abaId !== 'admin-taxas') window.adminFecharFormularioTaxa?.();
            return result;
        };
        wrapped.__adminV6Wrapped = true;
        window.mudarAbaAdmin = wrapped;
    }

    const basePrepare = window.adminV5PreparePanel;
    window.adminV6PreparePanel = function() {
        updateSidebarContext();
        setCrudOpen('admin-cardapio-layout', 'admin-produto-form-card', false);
        setCrudOpen('admin-promocoes-layout', 'admin-promocao-form-card', false);
        window.adminFecharFormularioTaxa?.();
        if (typeof basePrepare === 'function') basePrepare();
    };

    const baseAbrirAdminAuth = window.abrirAdminAuth;
    if (typeof baseAbrirAdminAuth === 'function' && !baseAbrirAdminAuth.__adminV6Wrapped) {
        const wrapped = function() {
            const result = baseAbrirAdminAuth.apply(this, arguments);
            setTimeout(window.adminV6PreparePanel, 120);
            return result;
        };
        wrapped.__adminV6Wrapped = true;
        window.abrirAdminAuth = wrapped;
    }

    document.addEventListener('DOMContentLoaded', function(){
        updateSidebarContext();
        setTimeout(updateSidebarContext, 600);
    });
})();


/* =========================================================
   V7 ENTERPRISE ERP - fluxo de navegação limpo e editores dedicados
   ========================================================= */
(function adminV7EnterpriseErp(){
    const $ = (id) => document.getElementById(id);
    const panel = () => $('modal-admin-panel');
    const content = () => document.querySelector('#modal-admin-panel .erp-content');

    function setPanelTabClass(tabId) {
        const p = panel();
        if (!p) return;
        Array.from(p.classList).forEach(cls => {
            if (cls.startsWith('admin-current-tab-')) p.classList.remove(cls);
        });
        p.classList.add('admin-current-tab-' + String(tabId || 'dashboard').replace(/^admin-/, ''));
        const workspaceTabs = new Set(['admin-cardapio','admin-promocoes','admin-taxas','admin-loja','admin-estoque','admin-clientes','admin-financeiro']);
        p.classList.toggle('admin-workspace-mode', workspaceTabs.has(tabId));
    }

    function closeAllEditors() {
        ['admin-produto-form-card', 'admin-promocao-form-card', 'admin-taxa-form-card'].forEach(id => {
            const el = $(id);
            if (el) el.classList.add('hidden');
        });
        const p = panel();
        if (p) {
            p.classList.remove('admin-editor-open','admin-editor-produto','admin-editor-promocao','admin-editor-taxa');
        }
    }

    function openEditor(kind, formId) {
        const p = panel();
        const form = $(formId);
        if (!p || !form) return;
        ['admin-produto-form-card', 'admin-promocao-form-card', 'admin-taxa-form-card'].forEach(id => {
            if (id !== formId) $(id)?.classList.add('hidden');
        });
        p.classList.add('admin-editor-open', 'admin-editor-' + kind);
        form.classList.add('admin-editor-panel');
        form.classList.remove('hidden');

        // A edição vira uma camada própria, então não forçamos scroll do conteúdo principal.
        setTimeout(() => {
            const first = form.querySelector('input:not([type="hidden"]):not([type="file"]), textarea, select');
            if (first && window.matchMedia('(min-width: 768px)').matches) first.focus({ preventScroll: true });
        }, 50);
    }

    function resetUpload(kind) {
        if (typeof window.adminV5SetUpload === 'function') window.adminV5SetUpload(kind, '', '');
    }

    function setUpload(kind, url) {
        if (typeof window.adminV5SetUpload === 'function') window.adminV5SetUpload(kind, url || '', url ? 'Imagem atual' : '');
    }

    function clearProdutoForm() {
        const fields = ['admin-produto-id','admin-produto-nome','admin-produto-descricao','admin-produto-categoria','admin-produto-preco','admin-produto-preco-promocional','admin-produto-imagem-url','admin-produto-estoque','admin-produto-estoque-minimo'];
        fields.forEach(id => { const el = $(id); if (el) el.value = ''; });
        const file = $('admin-produto-imagem'); if (file) file.value = '';
        const ativo = $('admin-produto-ativo'); if (ativo) ativo.checked = true;
        const destaque = $('admin-produto-destaque'); if (destaque) destaque.checked = false;
        const controla = $('admin-produto-controla-estoque'); if (controla) controla.checked = false;
        const title = $('admin-produto-form-title'); if (title) title.textContent = 'Cadastrar produto';
        resetUpload('produto');
    }

    function clearPromocaoForm() {
        const fields = ['admin-promocao-id','admin-promocao-titulo','admin-promocao-descricao','admin-promocao-preco-original','admin-promocao-preco','admin-promocao-imagem-url','admin-promocao-inicio','admin-promocao-fim'];
        fields.forEach(id => { const el = $(id); if (el) el.value = ''; });
        const file = $('admin-promocao-imagem'); if (file) file.value = '';
        const prod = $('admin-promocao-produto'); if (prod) prod.value = '';
        const ativo = $('admin-promocao-ativo'); if (ativo) ativo.checked = true;
        const destaque = $('admin-promocao-destaque'); if (destaque) destaque.checked = true;
        const title = $('admin-promocao-form-title'); if (title) title.textContent = 'Criar promoção';
        resetUpload('promocao');
    }

    function clearTaxaForm() {
        const id = $('nova-taxa-id'); if (id) id.value = '';
        const bairro = $('nova-taxa-bairro'); if (bairro) bairro.value = '';
        const valor = $('nova-taxa-valor'); if (valor) valor.value = '';
        const title = $('admin-taxa-form-title'); if (title) title.textContent = 'Adicionar bairro';
    }

    function setupEditorLabels() {
        const product = $('admin-produto-form-card');
        const promo = $('admin-promocao-form-card');
        const fee = $('admin-taxa-form-card');

        if (product && !product.dataset.v7Ready) {
            product.dataset.v7Ready = 'true';
            const cancel = product.querySelector('[onclick*="adminFecharFormularioProduto"]');
            if (cancel) cancel.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar';
        }
        if (promo && !promo.dataset.v7Ready) {
            promo.dataset.v7Ready = 'true';
            const cancel = promo.querySelector('[onclick*="adminFecharFormularioPromocao"]');
            if (cancel) cancel.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar';
        }
        if (fee && !fee.dataset.v7Ready) {
            fee.dataset.v7Ready = 'true';
            const cancel = fee.querySelector('[onclick*="adminFecharFormularioTaxa"]');
            if (cancel) cancel.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar';
        }
    }

    window.adminAbrirFormularioProdutoNovo = function() {
        setupEditorLabels();
        clearProdutoForm();
        openEditor('produto', 'admin-produto-form-card');
    };

    window.adminFecharFormularioProduto = function() {
        $('admin-produto-form-card')?.classList.add('hidden');
        panel()?.classList.remove('admin-editor-open','admin-editor-produto');
        resetUpload('produto');
    };

    window.adminAbrirFormularioPromocaoNovo = function() {
        setupEditorLabels();
        clearPromocaoForm();
        if (!adminProdutosCache.length && typeof carregarAdminCardapioSilencioso === 'function') {
            carregarAdminCardapioSilencioso().then(preencherSelectProdutosPromocao).catch(()=>{});
        } else {
            preencherSelectProdutosPromocao(adminProdutosCache);
        }
        openEditor('promocao', 'admin-promocao-form-card');
    };

    window.adminFecharFormularioPromocao = function() {
        $('admin-promocao-form-card')?.classList.add('hidden');
        panel()?.classList.remove('admin-editor-open','admin-editor-promocao');
        resetUpload('promocao');
    };

    window.adminAbrirFormularioTaxa = function() {
        setupEditorLabels();
        clearTaxaForm();
        openEditor('taxa', 'admin-taxa-form-card');
    };

    window.adminFecharFormularioTaxa = function() {
        $('admin-taxa-form-card')?.classList.add('hidden');
        panel()?.classList.remove('admin-editor-open','admin-editor-taxa');
    };

    window.editarProdutoAdmin = function(id) {
        setupEditorLabels();
        const p = (adminProdutosCache || []).find(item => String(item.id) === String(id));
        if (!p) return showToast('Produto não encontrado. Atualize o cardápio.', 'error');

        const set = (fieldId, value) => { const el = $(fieldId); if (el) el.value = value ?? ''; };
        set('admin-produto-id', p.id || '');
        set('admin-produto-nome', p.nome || '');
        set('admin-produto-descricao', p.descricao || '');
        set('admin-produto-categoria', p.categoria || '');
        set('admin-produto-preco', p.preco ?? '');
        set('admin-produto-preco-promocional', p.preco_promocional ?? '');
        set('admin-produto-imagem-url', getImagemProduto(p) || '');
        set('admin-produto-estoque', p.estoque_atual ?? '');
        set('admin-produto-estoque-minimo', p.estoque_minimo ?? '');
        const file = $('admin-produto-imagem'); if (file) file.value = '';
        const ativo = $('admin-produto-ativo'); if (ativo) ativo.checked = p.ativo !== false;
        const destaque = $('admin-produto-destaque'); if (destaque) destaque.checked = !!p.destaque;
        const controla = $('admin-produto-controla-estoque'); if (controla) controla.checked = !!p.controla_estoque;
        const title = $('admin-produto-form-title'); if (title) title.textContent = 'Editar produto';
        setUpload('produto', getImagemProduto(p) || '');
        openEditor('produto', 'admin-produto-form-card');
    };

    window.editarPromocaoAdmin = function(id) {
        setupEditorLabels();
        const p = (adminPromocoesCache || []).find(item => String(item.id) === String(id));
        if (!p) return showToast('Promoção não encontrada. Atualize a lista.', 'error');

        preencherSelectProdutosPromocao(adminProdutosCache || []);
        const set = (fieldId, value) => { const el = $(fieldId); if (el) el.value = value ?? ''; };
        set('admin-promocao-id', p.id || '');
        set('admin-promocao-titulo', p.titulo || '');
        set('admin-promocao-descricao', p.descricao || '');
        set('admin-promocao-produto', p.produto_id || '');
        set('admin-promocao-preco-original', p.preco_original ?? '');
        set('admin-promocao-preco', p.preco_promocional ?? p.preco ?? '');
        set('admin-promocao-imagem-url', p.imagem_url || '');
        set('admin-promocao-inicio', p.inicia_em ? String(p.inicia_em).slice(0,16) : '');
        set('admin-promocao-fim', p.termina_em ? String(p.termina_em).slice(0,16) : '');
        const file = $('admin-promocao-imagem'); if (file) file.value = '';
        const ativo = $('admin-promocao-ativo'); if (ativo) ativo.checked = p.ativo !== false;
        const destaque = $('admin-promocao-destaque'); if (destaque) destaque.checked = p.destaque !== false;
        const title = $('admin-promocao-form-title'); if (title) title.textContent = 'Editar promoção';
        setUpload('promocao', p.imagem_url || '');
        openEditor('promocao', 'admin-promocao-form-card');
    };

    window.editarTaxaAdmin = function(id) {
        setupEditorLabels();
        const t = (window.adminTaxasCache || []).find(item => String(item.id) === String(id));
        if (!t) return showToast('Taxa não encontrada. Atualize a lista.', 'error');
        const idEl = $('nova-taxa-id'); if (idEl) idEl.value = t.id || '';
        const bairro = $('nova-taxa-bairro'); if (bairro) bairro.value = t.bairro || '';
        const valor = $('nova-taxa-valor'); if (valor) valor.value = t.taxa ?? t.valor ?? '';
        const title = $('admin-taxa-form-title'); if (title) title.textContent = 'Editar taxa de entrega';
        openEditor('taxa', 'admin-taxa-form-card');
    };

    window.salvarTaxaAdmin = async function(btn) {
        const id = $('nova-taxa-id')?.value || '';
        const bairroInput = $('nova-taxa-bairro');
        const valorInput = $('nova-taxa-valor');
        const bairro = bairroInput ? bairroInput.value.trim() : '';
        const valor = valorInput ? toNumberBR(valorInput.value) : 0;

        if (!bairro || Number.isNaN(valor)) return showToast('Preencha bairro e valor da entrega.', 'error');

        const original = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }

        try {
            let res;
            if (id) {
                res = await supabaseClient.from('taxas_entrega').update({ bairro, taxa: valor, ativo: true }).eq('id', id);
            } else {
                res = await supabaseClient.from('taxas_entrega').insert([{ bairro, taxa: valor, ativo: true }]);
                if (res.error && String(res.error.message || '').toLowerCase().includes('duplicate')) {
                    res = await supabaseClient.from('taxas_entrega').update({ taxa: valor, ativo: true }).eq('bairro', bairro);
                }
            }
            if (res.error) throw res.error;
            showToast(id ? 'Taxa atualizada com sucesso!' : 'Taxa adicionada com sucesso!');
            clearTaxaForm();
            window.adminFecharFormularioTaxa();
            await carregarAdminTaxas();
            await carregarTaxasSupabase();
        } catch(e) {
            showToast('Erro ao salvar taxa: ' + (e.message || 'Falha Supabase'), 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = original || '<i class="fas fa-save"></i> Salvar taxa';
            }
        }
    };

    // Compatibilidade: se algum botão antigo chamar adicionarTaxaAdmin, usa o fluxo novo.
    window.adicionarTaxaAdmin = window.salvarTaxaAdmin;

    window.renderProdutoAdminRow = function(p) {
        const imagem = getImagemProduto(p) || getIconeParaCategoria(p.categoria || '');
        const ativo = isProdutoAtivo(p);
        const estoqueAtual = Number(p.estoque_atual || 0);
        const estoqueMin = Number(p.estoque_minimo || 5);
        const estoque = p.controla_estoque
            ? `${estoqueAtual} un. • mín. ${estoqueMin}`
            : 'sem controle';
        const foto = getImagemProduto(p) ? 'foto ok' : 'sem foto';
        const rowSearch = `${p.nome || ''} ${p.categoria || ''} ${ativo ? 'ativo' : 'pausado'} ${foto}`.toLowerCase();
        return `<article class="admin-product-row erp-data-row" data-search="${adminEscapeAttr(rowSearch)}" data-active="${ativo ? '1' : '0'}" data-photo="${getImagemProduto(p) ? '1' : '0'}" data-stock="${(p.controla_estoque && estoqueAtual <= estoqueMin) ? 'low' : 'ok'}">
            <div class="admin-product-thumb"><img src="${adminEscapeAttr(imagem)}" alt="${adminEscapeAttr(p.nome || 'Produto')}" onerror="this.onerror=null;this.src='${adminEscapeAttr(getIconeParaCategoria(p.categoria || ''))}'"></div>
            <div class="admin-product-info">
                <strong>${adminEscapeHtml(p.nome || 'Produto')}</strong>
                <small>${adminEscapeHtml(p.categoria || 'Diversos')} • ${estoque} • ${foto} • ${ativo ? 'ativo' : 'pausado'}</small>
            </div>
            <span class="admin-price-chip">${moneyBR(getPrecoProduto(p))}</span>
            <div class="admin-product-actions">
                <button type="button" class="admin-icon-btn" onclick="editarProdutoAdmin('${adminEscapeAttr(String(p.id))}')" title="Editar produto"><i class="fas fa-pen"></i></button>
                <button type="button" class="admin-icon-btn" onclick="toggleProdutoAtivoAdmin('${adminEscapeAttr(String(p.id))}', ${p.ativo === false ? 'true' : 'false'})" title="${p.ativo === false ? 'Ativar' : 'Pausar'}"><i class="fas ${p.ativo === false ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
            </div>
        </article>`;
    };

    window.renderPromocaoAdminRow = function(p) {
        const produto = (adminProdutosCache || []).find(prod => String(prod.id) === String(p.produto_id));
        const imagem = p.imagem_url || getImagemProduto(produto) || getIconeParaCategoria(produto?.categoria || 'promo');
        const validade = p.termina_em ? `até ${String(p.termina_em).slice(0,10).split('-').reverse().join('/')}` : 'sem validade';
        const rowSearch = `${p.titulo || ''} ${p.descricao || ''} ${produto?.nome || ''} ${p.ativo !== false ? 'ativa' : 'pausada'}`.toLowerCase();
        return `<article class="admin-product-row erp-data-row" data-search="${adminEscapeAttr(rowSearch)}" data-active="${p.ativo !== false ? '1' : '0'}">
            <div class="admin-product-thumb"><img src="${adminEscapeAttr(imagem)}" alt="${adminEscapeAttr(p.titulo || 'Promoção')}" onerror="this.onerror=null;this.src='${adminEscapeAttr(getIconeParaCategoria(produto?.categoria || 'promo'))}'"></div>
            <div class="admin-product-info">
                <strong>${adminEscapeHtml(p.titulo || 'Promoção')}</strong>
                <small>${adminEscapeHtml(produto?.nome || 'Oferta geral')} • ${validade} • ${p.ativo !== false ? 'ativa' : 'pausada'}</small>
            </div>
            <span class="admin-price-chip">${moneyBR(p.preco_promocional || p.preco || 0)}</span>
            <div class="admin-product-actions">
                <button type="button" class="admin-icon-btn" onclick="editarPromocaoAdmin('${adminEscapeAttr(String(p.id))}')" title="Editar promoção"><i class="fas fa-pen"></i></button>
                <button type="button" class="admin-icon-btn" onclick="togglePromocaoAtivaAdmin('${adminEscapeAttr(String(p.id))}', ${p.ativo === false ? 'true' : 'false'})" title="${p.ativo === false ? 'Ativar' : 'Pausar'}"><i class="fas ${p.ativo === false ? 'fa-eye' : 'fa-eye-slash'}"></i></button>
            </div>
        </article>`;
    };

    function applyProdutoFilters() {
        const q = ($('admin-produtos-search')?.value || '').trim().toLowerCase();
        const filter = $('admin-produtos-filter')?.value || 'todos';
        document.querySelectorAll('#admin-lista-cardapio .erp-data-row').forEach(row => {
            const matchesText = !q || (row.dataset.search || '').includes(q);
            let matchesFilter = true;
            if (filter === 'ativos') matchesFilter = row.dataset.active === '1';
            if (filter === 'pausados') matchesFilter = row.dataset.active === '0';
            if (filter === 'sem_foto') matchesFilter = row.dataset.photo === '0';
            if (filter === 'estoque') matchesFilter = row.dataset.stock === 'low';
            row.style.display = matchesText && matchesFilter ? '' : 'none';
        });
    }

    function applyPromocaoFilters() {
        const q = ($('admin-promocoes-search')?.value || '').trim().toLowerCase();
        const filter = $('admin-promocoes-filter')?.value || 'todas';
        document.querySelectorAll('#admin-lista-promocoes .erp-data-row').forEach(row => {
            const matchesText = !q || (row.dataset.search || '').includes(q);
            let matchesFilter = true;
            if (filter === 'ativas') matchesFilter = row.dataset.active === '1';
            if (filter === 'pausadas') matchesFilter = row.dataset.active === '0';
            row.style.display = matchesText && matchesFilter ? '' : 'none';
        });
    }

    function applyTaxaFilters() {
        const q = ($('admin-taxas-search')?.value || '').trim().toLowerCase();
        document.querySelectorAll('#admin-lista-taxas .admin-fee-row').forEach(row => {
            row.style.display = !q || (row.dataset.search || '').includes(q) ? '' : 'none';
        });
    }

    function bindTableFilters() {
        const bindings = [
            ['admin-produtos-search', applyProdutoFilters],
            ['admin-produtos-filter', applyProdutoFilters],
            ['admin-promocoes-search', applyPromocaoFilters],
            ['admin-promocoes-filter', applyPromocaoFilters],
            ['admin-taxas-search', applyTaxaFilters]
        ];
        bindings.forEach(([id, fn]) => {
            const el = $(id);
            if (el && !el.dataset.v7FilterBound) {
                el.dataset.v7FilterBound = 'true';
                el.addEventListener('input', fn);
                el.addEventListener('change', fn);
            }
        });
    }

    const baseCarregarAdminCardapioSilencioso = window.carregarAdminCardapioSilencioso || (typeof carregarAdminCardapioSilencioso === 'function' ? carregarAdminCardapioSilencioso : null);

    window.carregarAdminCardapio = async function() {
        const container = $('admin-lista-cardapio');
        if (!container) return;
        container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Buscando produtos...</h5><p>Sincronizando catálogo.</p></div></div>';
        try {
            const data = baseCarregarAdminCardapioSilencioso ? await baseCarregarAdminCardapioSilencioso() : [];
            preencherSelectProdutosPromocao(data);
            if (!data || !data.length) {
                container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-box-open"></i><h5>Nenhum produto cadastrado</h5><p>Clique em Novo produto para cadastrar o primeiro item.</p></div></div>';
                return;
            }
            const dadosOrdenados = data.slice().sort((a,b) => (a.categoria || '').localeCompare(b.categoria || '') || (a.nome || '').localeCompare(b.nome || ''));
            container.innerHTML = dadosOrdenados.map(p => window.renderProdutoAdminRow(p)).join('');
            bindTableFilters();
            applyProdutoFilters();
        } catch(e) {
            container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar cardápio</h5><p>${adminEscapeHtml(e.message || 'Verifique sua conexão.')}</p></div></div>`;
        }
    };

    window.carregarAdminPromocoes = async function() {
        const container = $('admin-lista-promocoes');
        if (!container) return;
        container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Buscando promoções...</h5><p>Sincronizando ofertas.</p></div></div>';
        try {
            if (!adminProdutosCache.length && baseCarregarAdminCardapioSilencioso) await baseCarregarAdminCardapioSilencioso();
            preencherSelectProdutosPromocao(adminProdutosCache);
            const { data, error } = await supabaseClient.from('promocoes').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            adminPromocoesCache = data || [];
            if (!adminPromocoesCache.length) {
                container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-tags"></i><h5>Nenhuma promoção</h5><p>Clique em Nova promoção para criar sua primeira oferta.</p></div></div>';
                return;
            }
            container.innerHTML = adminPromocoesCache.map(p => window.renderPromocaoAdminRow(p)).join('');
            bindTableFilters();
            applyPromocaoFilters();
        } catch(e) {
            container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar promoções</h5><p>${adminEscapeHtml(e.message || 'Verifique o SQL atualizado.')}</p></div></div>`;
        }
    };

    window.carregarAdminTaxas = async function() {
        const container = $('admin-lista-taxas');
        if (!container) return;
        container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-circle-notch fa-spin"></i><h5>Buscando taxas...</h5><p>Sincronizando regiões de entrega.</p></div></div>';
        try {
            const { data, error } = await supabaseClient.from('taxas_entrega').select('*').order('bairro');
            if (error) throw error;
            window.adminTaxasCache = data || [];
            if (!window.adminTaxasCache.length) {
                container.innerHTML = '<div class="admin-empty-state"><div><i class="fas fa-map-location-dot"></i><h5>Nenhuma taxa cadastrada</h5><p>Clique em Novo bairro para cadastrar uma região.</p></div></div>';
                return;
            }
            container.innerHTML = window.adminTaxasCache.map(t => {
                const valor = t.taxa !== undefined ? t.taxa : t.valor;
                const search = `${t.bairro || ''} ${valor || ''}`.toLowerCase();
                return `<article class="admin-fee-row" data-search="${adminEscapeAttr(search)}">
                    <div class="admin-fee-info">
                        <strong>${adminEscapeHtml(t.bairro || 'Bairro')}</strong>
                        <small>Região de entrega cadastrada</small>
                    </div>
                    <div class="admin-fee-actions">
                        <span class="admin-fee-chip">${adminMoney(valor)}</span>
                        <button type="button" onclick="editarTaxaAdmin('${adminEscapeAttr(String(t.id || ''))}')" class="admin-icon-btn" aria-label="Editar taxa"><i class="fas fa-pen"></i></button>
                        <button type="button" onclick="deletarTaxaAdmin('${adminEscapeAttr(String(t.id || ''))}')" class="admin-delete-btn" aria-label="Apagar taxa"><i class="fas fa-trash"></i></button>
                    </div>
                </article>`;
            }).join('');
            bindTableFilters();
            applyTaxaFilters();
        } catch(e) {
            container.innerHTML = `<div class="admin-empty-state"><div><i class="fas fa-triangle-exclamation" style="color:#fecaca"></i><h5>Erro ao carregar taxas</h5><p>${adminEscapeHtml(e.message || 'Verifique sua conexão.')}</p></div></div>`;
        }
    };

    const baseMudarAbaV7 = window.mudarAbaAdmin;
    window.mudarAbaAdmin = function(abaId, btnElement) {
        closeAllEditors();
        const result = baseMudarAbaV7 ? baseMudarAbaV7.apply(this, arguments) : undefined;
        setPanelTabClass(abaId);
        bindTableFilters();
        const c = content();
        if (c) c.scrollTo({ top: 0, behavior: 'instant' });
        setTimeout(() => {
            const activeMobile = document.querySelector('#modal-admin-panel .erp-mobile-tabs .admin-tab-active');
            if (activeMobile) activeMobile.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }, 60);
        return result;
    };

    const baseAbrirAdminAuthV7 = window.abrirAdminAuth;
    if (typeof baseAbrirAdminAuthV7 === 'function') {
        window.abrirAdminAuth = function() {
            const result = baseAbrirAdminAuthV7.apply(this, arguments);
            setTimeout(() => {
                setupEditorLabels();
                setPanelTabClass('admin-dashboard');
                closeAllEditors();
                bindTableFilters();
            }, 150);
            return result;
        };
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && panel()?.classList.contains('admin-editor-open')) {
            e.preventDefault();
            closeAllEditors();
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        setupEditorLabels();
        setPanelTabClass('admin-dashboard');
        bindTableFilters();

        // Corrige casos de cache antigo em que o botão de taxa ainda chama o fluxo anterior.
        const taxaBtn = document.querySelector('#admin-taxa-form-card .admin-save-btn');
        if (taxaBtn) taxaBtn.setAttribute('onclick', 'salvarTaxaAdmin(this)');

        // Evita que cliques dentro do editor fechem acidentalmente por propagação futura.
        document.querySelectorAll('#modal-admin-panel .admin-editor-panel').forEach(form => {
            if (!form.dataset.v7ClickBound) {
                form.dataset.v7ClickBound = 'true';
                form.addEventListener('click', ev => ev.stopPropagation());
            }
        });
    });
})();
