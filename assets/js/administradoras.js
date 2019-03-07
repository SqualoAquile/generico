$(function () {

    let $taxa_debito = $('[name=txdebito]'),
        $taxa_credito = $('[name=txcredcom]'),
        $bandeira = $('[name=band]'),
        $dias_debito = $('[name=diasdebito]'),
        $dias_credito = $('[name=diascredcom]'),
        $dias_antecipacao = $('[name=diasantecip]'),
        $formBandeiras = $('#form-bandeiras'),
        $mainForm = $('#main-form'),
        $nroparc = $('[name="nroparc"]');
        indexTrTable = 0;

    $('#form-bandeiras')
        .submit(function (event) {
            
            event.preventDefault();
            
            if (this.checkValidity()) {
                Save();
            }
        });
    
    $('#form-bandeiras .form-control')
        .on('change', function () {
        
            let $this = $(this),
                $form = $this.parents('form'),
                $submit = $form.find('[type="submit"]');

            if ($form[0].checkValidity()) {
                $submit.removeAttr('disabled');
            } else {
                $submit.attr('disabled', 'disabled');
            }
        });

    $('label[for="form-send"]')
        .click(function (event) {
            if (!$('#table-inclusoes tbody tr').length) {
                alert('É necessário ter ao menos uma bandeira!');
                event.stopPropagation();
                event.preventDefault();
                event.stopImmediatePropagation();
            }
        });

    $(document)
        .ready(function () {

            if (!infoAdm) return;

            bandeirasAceitas.forEach(function (bandeiraAceita) {
                
                let idBandeira = bandeiraAceita.nome,
                    $bandeira = listaBandeiras.filter(function (listaBandeira) {
                        return listaBandeira.id == idBandeira;
                    }),
                    bandeiraAceitainformacoes = bandeiraAceita.informacoes,
                    bandeira = $bandeira[0].nome,
                    informacoes = bandeiraAceitainformacoes.split('-'),
                    txRcbDeb = informacoes[0],
                    diasRcbDeb = informacoes[1],
                    txRcbCred = informacoes[2],
                    diasRcbCred = informacoes[3],
                    diasAntecip = informacoes[4],
                    parcelas = informacoes[5],
                    txantecipacao = bandeiraAceita.txantecipacao,
                    txAntecipacao = txantecipacao.split('-'),
                    txcredito = bandeiraAceita.txcredito,
                    txCredito = txcredito.split('-'),
                    antecipacoes = [],
                    creditos = [];

                if (txRcbDeb) txRcbDeb = txRcbDeb.replace('.', ',');
                if (txRcbCred) txRcbCred = txRcbCred.replace('.', ',');

                txAntecipacao.forEach(function(antecipacao, index) {
                    antecipacao = antecipacao.replace('.', ',');
                    antecipacoes.push({
                        index: index + 1,
                        value: antecipacao
                    });
                });

                txCredito.forEach(function(credito, index) {
                    credito = credito.replace('.', ',');
                    creditos.push({
                        index: index + 1,
                        value: credito
                    });
                });

                Popula(
                    false,
                    idBandeira,
                    bandeira,
                    txRcbDeb,
                    diasRcbDeb,
                    txRcbCred,
                    diasRcbCred,
                    diasAntecip,
                    parcelas,
                    antecipacoes,
                    creditos,
                    bandeiraAceita.id
                );
            });
        })
        .on('click', '.editar-inclusao', function () {
            Edit(this);
        })
        .on('click', '.excluir-inclusao', function () {
            Delete(this);
        });

    $nroparc
        .change(function () {
            
            $taxas = $('#tabela-taxas'),
                value = $(this).val();

            if (value) {

                var $taxasTr = $taxas.find('tbody tr');

                $taxasTr.hide();
                
                $taxasTr.not(':lt(' + value + ')').find('input')
                    .val('0%')
                    .removeClass('is-valid is-invalid active');
                
                $taxas
                    .find('tbody tr:lt(' + value + ')')
                    .show()
                    .find('.taxas')
                    .addClass('active');

                $taxas.find('.taxas.active').each(function () {
                    if ($(this).val() == '0%') {
                        $(this).val('');
                    }
                });

                $taxas.show();

            } else {
                $taxas.hide();
            }
        })
        .change();

    $('#iband')
        .change(function () {

            var $this = $(this);

            $this
                .removeClass('is-invalid')
                .addClass('is-valid');

            $this[0].setCustomValidity('');

            $this.siblings('.invalid-feedback').remove();
                        
            if (BandeiraSendoUsada($this.val())) {

                $this
                    .removeClass('is-valid')
                    .addClass('is-invalid');

                $this[0].setCustomValidity('invalid');

                $this.after('<div class="invalid-feedback">Essa bandeira já está sendo usada.</div>');
            }
        });

    function Save() {

        var antecipacoes = [],
            creditos = [];
        
        $('.taxas-antecipacao').each(function(index, el) {

            let valueTransform = $(el).val().replace('%', '');

            antecipacoes.push({
                index: index + 1,
                value: valueTransform
            });
        });
        
        $('.taxas-credito').each(function(index, el) {

            let valueTransform = $(el).val().replace('%', '');

            creditos.push({
                index: index + 1,
                value: valueTransform
            });
        });

        let id_bandeira = $bandeira.val(),
            bandeira = $('[name=band] option:selected').text(),
            parcelas = $('[name="nroparc"] option:selected').text(),
            taxa_debito_clean = $taxa_debito.val().replace('%', ''),
            taxa_credito_clean = $taxa_credito.val().replace('%', '');

        $('.conteudos-escondidos').removeClass('sendo-editado');

        Popula(
            true,
            id_bandeira,
            bandeira,
            taxa_debito_clean,
            $dias_debito.val(),
            taxa_credito_clean,
            $dias_credito.val(),
            $dias_antecipacao.val(),
            parcelas,
            antecipacoes,
            creditos
        );
    };

    function Popula(adicionando, paramIdBandeira, bandeira, taxa_debito, dias_debito, taxa_credito, dias_credito, dias_antecipacao, parcelas, antecipacoes, creditos, bandeiraAceitaId) {

        let taxa_debitoRpl = taxa_credito ? taxa_credito.replace(',', '.') : '',
            taxa_creditoRpl = taxa_credito ? taxa_credito.replace(',', '.') : '',
            infos = taxa_debitoRpl + '-' + dias_debito + '-' + taxa_creditoRpl + '-' + dias_credito + '-' + dias_antecipacao + '-' + parcelas,
            txantecipacao = [],
            antecipacoesHtml = '',
            txcredito = [],
            creditosHtml = '';

        antecipacoes.forEach(function (antecipacao) {
            
            txantecipacao.push(antecipacao.value.replace(',', '.'));

            if (antecipacao.value != '0') {
                antecipacoesHtml += `
                    <div class="d-flex">
                        <div>` + antecipacao.index + `x</div>
                        <span class="px-2">-</span>
                        <div>` + antecipacao.value + `%</div>
                    </div>
                `;
            }
        });

        creditos.forEach(function (credito) {

            txcredito.push(credito.value.replace(',', '.'));

            if (credito.value != '0') {
                creditosHtml += `
                    <div class="d-flex">
                        <div>` + credito.index + `x</div>
                        <span class="px-2">-</span>
                        <div>` + credito.value + `%</div>
                    </div>
                `;
            }
        });

        var indexEditando = $formBandeiras.attr('data-editando'),
            tds = `
                <td>
                    <div class="id_bandeira">
                        <input type="hidden" value="` + paramIdBandeira + `">
                        ` + bandeira + `
                    </div>
                </td>
                <td>` + parcelas + `</td>
                <td>
                    <div class="d-flex flex-column">` + antecipacoesHtml + `</div>
                </td>
                <td>
                    <div class="d-flex flex-column">` + creditosHtml + `</div>
                </td>
                <td>` + taxa_debito + `%</td>
                <td>` + dias_debito + `</td>
                <td>` + taxa_credito + `%</td>
                <td>` + dias_credito + `</td>
                <td>` + dias_antecipacao + `</td>
                <td>
                    <button class="editar-inclusao btn btn-primary btn-sm">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="excluir-inclusao btn btn-secondary btn-sm">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;

        txantecipacaojoin = txantecipacao.join('-');
        txcreditojoin = txcredito.join('-');

        SetInput(adicionando, paramIdBandeira, bandeira, infos, txantecipacaojoin, txcreditojoin, bandeiraAceitaId);

        $('#form-bandeiras').trigger('reset').find('.form-control').removeClass('is-valid is-invalid');
        $('[name="nroparc"]').change();

        if (!indexEditando) {
            $('#table-inclusoes tbody')
                .prepend('<tr data-index="' + indexTrTable + '">' + tds + '</tr>');

            indexTrTable++;
        } else {
            $('#table-inclusoes tbody tr[data-index=' + indexEditando + ']').html(tds)
        }
    };

    function SetInput(adicionando, paramIdBandeira, bandeira, infos, txantecipacao, txcredito, bandeiraAceitaId) {

        let indexEditando = $formBandeiras.attr('data-editando'),
            arrInfos = infos.split('-'),
            arrTxAntecipacao = txantecipacao.split('-'),
            arrTxCredito = txcredito.split('-'),
            taxaDebitoAlteracoes = arrInfos[0].replace('.', ',') + '%',
            taxaCreditoAlteracoes = arrInfos[2].replace('.', ',') + '%',
            alt_dias_debito = arrInfos[1],
            alt_dias_credito = arrInfos[3],
            alt_dias_antecipacao = arrInfos[4],
            alt_numero_parcelas = arrInfos[5];

        if (paramIdBandeira) {

            if (!indexEditando) {

                let htmlTaxaParcelas = '';
                for (let index = 1; index <= 12; index++) {
                    
                    let $inputTxAntecipacao = $('#itxantecip_' + index),
                        $inputTxCredito = $('#itxcredsemjuros_' + index),
                        currentAntecipacao = arrTxAntecipacao[index - 1],
                        currentCredito = arrTxCredito[index - 1],
                        dataAnteriorTxAtencipacao = !adicionando && !indexEditando ? currentAntecipacao + '%' : '',
                        dataAnteriorTxCredito = !adicionando && !indexEditando ? currentCredito + '%' : '',
                        textLabelAntecipacao = $inputTxAntecipacao.siblings('label').find('span').text(),
                        textLabelCredito = $inputTxCredito.siblings('label').find('span').text();

                    if (currentAntecipacao == '0') dataAnteriorTxAtencipacao = '0%';
                    if (currentCredito == '0') dataAnteriorTxCredito = '0%';
                        
                    htmlTaxaParcelas += `
                        <div class="envolta-inputs-alteracoes">
                            <div>
                                <label><span>` + bandeira + ` - ` + textLabelAntecipacao + `</span></label>
                                <input id="alt_itxantecip_` + index + `" type="text" data-anterior="` + dataAnteriorTxAtencipacao + `" class="alteracao-parcelas-antecipacao" value="` + arrTxAntecipacao[index - 1] + `%" readonly>
                            </div>
                            <div>
                                <label><span>` + bandeira + ` - ` + textLabelCredito + `</span></label>
                                <input id="alt_itxcredsemjuros_` + index + `" type="text" data-anterior="` + dataAnteriorTxCredito + `" class="alteracao-parcelas-antecipacao" value="` + arrTxCredito[index - 1] + `%" readonly>
                            </div>
                        </div>
                    `;
                }

                // Se estiver criando uma nova bandeira, nao coloca nenhum conteudo no data-anterior
                let dataAnteriorBandeira = !adicionando && !indexEditando ? bandeira : '',
                    dataAnteriorTaxaDebitoAlteracoes = !adicionando && !indexEditando ? taxaDebitoAlteracoes : '',
                    dataAnteriorTaxaCreditoAlteracoes = !adicionando && !indexEditando ? taxaCreditoAlteracoes : '',
                    dataAnteriorAlt_dias_credito = !adicionando && !indexEditando ? alt_dias_credito : '',
                    dataAnteriorAlt_dias_antecipacao = !adicionando && !indexEditando ? alt_dias_antecipacao : '',
                    dataAnteriorAlt_numero_parcelas = !adicionando && !indexEditando ? alt_numero_parcelas : '',
                    dataAnteriorAlt_dias_debito = !adicionando && !indexEditando ? alt_dias_debito : '',
                    textoAlteracao = !dataAnteriorBandeira.length ? 'Criou A ' : '';

                $mainForm
                    .append(`
                        <div class="conteudos-escondidos d-none" data-tr-index="` + indexTrTable + `">
                            <div class="envolta-inputs-alteracoes">
                                <label class="labelBandeira" for="bandeira` + paramIdBandeira + `"><span>` + textoAlteracao + `Bandeira</span></label>
                                <input type="text" data-anterior="` + dataAnteriorBandeira + `" data-bandeira="` + paramIdBandeira + `" class="bandeira" id="bandeira` + paramIdBandeira + `" name="bandeira[` + paramIdBandeira + `]" value="` + bandeira + `" required readonly />
                            </div>
                            <div class="envolta-inputs-alteracoes">
                                <label><span>` + bandeira + ` - ` + $taxa_debito.siblings('label').find('span').text() + `</span></label>
                                <input type="text" data-anterior="` + dataAnteriorTaxaDebitoAlteracoes + `" class="alteracao-taxa-debito" value="` + taxaDebitoAlteracoes + `" readonly>
                            </div>
                            <div class="envolta-inputs-alteracoes">
                                <label><span>` + bandeira + ` - ` + $dias_debito.siblings('label').find('span').text() + `</span></label>
                                <input type="text" data-anterior="` + dataAnteriorAlt_dias_debito + `" class="alteracao-dias-debito" value="` + alt_dias_debito + `" readonly>
                            </div>
                            <div class="envolta-inputs-alteracoes">
                                <label><span>` + bandeira + ` - ` + $taxa_credito.siblings('label').find('span').text() + `</span></label>
                                <input type="text" data-anterior="` + dataAnteriorTaxaCreditoAlteracoes + `" class="alteracao-taxa-credito" value="` + taxaCreditoAlteracoes + `" readonly>
                            </div>
                            <div class="envolta-inputs-alteracoes">
                                <label><span>` + bandeira + ` - ` + $dias_credito.siblings('label').find('span').text() + `</span></label>
                                <input type="text" data-anterior="` + dataAnteriorAlt_dias_credito + `" class="alteracao-dias-credito" value="` + alt_dias_credito + `" readonly>
                            </div>
                            <div class="envolta-inputs-alteracoes">
                                <label><span>` + bandeira + ` - ` + $dias_antecipacao.siblings('label').find('span').text() + `</span></label>
                                <input type="text" data-anterior="` + dataAnteriorAlt_dias_antecipacao + `" class="alteracao-dias-antecipacao" value="` + alt_dias_antecipacao + `" readonly>
                            </div>
                            <div class="envolta-inputs-alteracoes">
                                <label><span>` + bandeira + ` - ` + $nroparc.siblings('label').find('span').text() + `</span></label>
                                <input type="text" data-anterior="` + dataAnteriorAlt_numero_parcelas + `" class="alteracao-parcelas" value="` + alt_numero_parcelas + `" readonly>
                            </div>
                            ` + htmlTaxaParcelas + `
                            <input type="search" data-bandeira="` + paramIdBandeira + `" class="bandeiraaceita_id" id="bandeiraaceita_id` + paramIdBandeira + `" name="bandeiraaceita_id` + paramIdBandeira + `" value="` + bandeiraAceitaId + `" required readonly />
                            <input type="search" data-bandeira="` + paramIdBandeira + `" class="flag" name="flag` + paramIdBandeira + `" value="` + paramIdBandeira + `" required readonly />
                            <input type="search" data-bandeira="` + paramIdBandeira + `" class="infos" name="infos[` + paramIdBandeira + `]" value="` + infos + `" required readonly />
                            <input type="search" data-bandeira="` + paramIdBandeira + `" class="txant" name="txant[` + paramIdBandeira + `]" value="` + txantecipacao + `" required readonly />
                            <input type="search" data-bandeira="` + paramIdBandeira + `" class="txcre" name="txcre[` + paramIdBandeira + `]" value="` + txcredito + `" required readonly />
                        </div>
                    `);
            } else {
                
                var $divHiddensEditando = $mainForm.find('[data-tr-index="' + indexEditando + '"]')

                $divHiddensEditando
                    .find('.bandeiraaceita_id')
                    .attr('name', 'bandeiraaceita_id' + paramIdBandeira)
                    .attr('data-bandeira', paramIdBandeira);

                $divHiddensEditando
                    .find('.flag')
                    .attr('name', 'flag' + paramIdBandeira)
                    .attr('data-bandeira', paramIdBandeira)
                    .val(paramIdBandeira);

                $divHiddensEditando
                    .find('.bandeira')
                    .attr('name', 'bandeira[' + paramIdBandeira + ']')
                    .attr('data-bandeira', paramIdBandeira)
                    .val(bandeira);
                    
                $divHiddensEditando
                    .find('.infos')
                    .attr('name', 'infos[' + paramIdBandeira + ']')
                    .attr('data-bandeira', paramIdBandeira)
                    .val(infos);

                $divHiddensEditando.find('label:not(.labelBandeira) span').each(function (i, el) {
                    let $elementSpan = $(el),
                        txtElSpan = $elementSpan.text(),
                        arrTxtElSpan = txtElSpan.split(' -');

                    $elementSpan.text($elementSpan.text().replace(arrTxtElSpan[0], bandeira));
                });

                // Taxa de Recebimento no Crédito
                $divHiddensEditando
                    .find('.alteracao-taxa-credito')
                    .val(taxaCreditoAlteracoes);

                // Taxa de Recebimento Débito
                $divHiddensEditando
                    .find('.alteracao-taxa-debito')
                    .val(taxaDebitoAlteracoes);

                // Dias de Recebimento no Débito
                $divHiddensEditando
                    .find('.alteracao-dias-debito')
                    .val(alt_dias_debito);

                // Dias de Recebimento no Crédito
                $divHiddensEditando
                    .find('.alteracao-dias-credito')
                    .val(alt_dias_credito);

                // Dias Recebimento Antecipação
                $divHiddensEditando
                    .find('.alteracao-dias-antecipacao')
                    .val(alt_dias_antecipacao);

                // Número Máximo Parcelas
                $divHiddensEditando
                    .find('.alteracao-parcelas')
                    .val(alt_numero_parcelas);

                for (let index = 1; index <= 12; index++) {
                    
                    let $inputTxAntecipacao = $('#itxantecip_' + index),
                        $inputTxCredito = $('#itxcredsemjuros_' + index);
                    
                    $('#alt_itxantecip_' + index).val($inputTxAntecipacao.val());
                    $('#alt_itxcredsemjuros_' + index).val($inputTxCredito.val());
                }

                $divHiddensEditando
                    .find('.txant')
                    .attr('name', 'txant[' + paramIdBandeira + ']')
                    .attr('data-bandeira', paramIdBandeira)
                    .val(txantecipacao);

                $divHiddensEditando
                    .find('.txcre')
                    .attr('name', 'txcre[' + paramIdBandeira + ']')
                    .attr('data-bandeira', paramIdBandeira)
                    .val(txcredito);

                $formBandeiras.removeAttr('data-editando');
            }
        }
    };

    function Edit(_this) {

        let par = $(_this).closest('tr'),
            id_bandeira = par.find('.id_bandeira input').val(),
            index_editando = $(par).attr('data-index'),
            $divHiddensEditando = $('.conteudos-escondidos[data-tr-index="' + index_editando + '"]');

        par.find('.btn').addClass('disabled').attr('disabled', 'disabled');

        $divHiddensEditando.addClass('sendo-editado');

        $bandeira.val(id_bandeira).focus();

        $('#form-bandeiras').attr('data-editando', par.attr('data-index'));

        var infos = $divHiddensEditando.find('.infos').val().split('-'),
            taxas_antecipacao = $divHiddensEditando.find('.txant').val().split('-'),
            taxas_credito = $divHiddensEditando.find('.txcre').val().split('-'),
            taxa_debito = infos[0],
            dias_debito = infos[1],
            taxa_credito = infos[2],
            dias_credito = infos[3],
            dias_antecipacao = infos[4],
            parcelas = infos[5];

        $taxa_debito.val(taxa_debito.replace('.', ',') + '%');
        $dias_debito.val(dias_debito);
        $taxa_credito.val(taxa_credito.replace('.', ',') + '%');
        $dias_credito.val(dias_credito);
        $dias_antecipacao.val(dias_antecipacao);
        
        $nroparc.val(parcelas).change();

        taxas_antecipacao.forEach(function (taxa, index) {
            $('#itxantecip_' + (index + 1)).val(taxa.replace('.', ',') + '%');
        });

        taxas_credito.forEach(function (taxa, index) {
            $('#itxcredsemjuros_' + (index + 1)).val(taxa.replace('.', ',') + '%');
        });

    };

    function Delete(_this) {

        let $par = $(_this).closest('tr'),
            id_bandeira = $par.find('.id_bandeira input').val(),
            $envolta = $('.conteudos-escondidos').find('label.labelBandeira[for="bandeira' + id_bandeira + '"]').parents('.envolta-inputs-alteracoes'),
            $bandeira = $envolta.find('input.bandeira'),
            $conteudoEscondido = $envolta.parent('.conteudos-escondidos');

        $envolta.siblings('.envolta-inputs-alteracoes').remove();
        $par.remove();

        $conteudoEscondido.addClass('excluido');

        $bandeira.siblings('label.labelBandeira').find('span').text('BANDEIRA ' + $bandeira.val());
        $bandeira.val('EXCLUIDA');

        $conteudoEscondido.find('input.bandeira').attr('name', 'bandeira[excluida]');
        $conteudoEscondido.find('input.bandeiraaceita_id').attr('name', 'bandeiraaceita_idexcluida');
        $conteudoEscondido.find('input.flag').attr('name', 'flagexcluida');
    };

    function BandeiraSendoUsada(idCompare) {
        let exist = false;
        $('.conteudos-escondidos:not(.sendo-editado):not(.excluido)').each(function () {
            if ($(this).find('.flag').val() == idCompare) {
                exist = true;
            }
        });
        return exist;
    };
    
    $('#historico').on('shown.bs.collapse', function () {
        
        let $div = $(this).find('.cada-alteracao .card.card-body .card-text > div'),
            $span = $div.find('span'),
            $delVazio = $span.siblings('del:contains(∅)');

        $div.each(function () {
            let content = $(this).text();
            if (content.indexOf('EXCLUIDA') != -1) {
                $(this).find('strong, del').hide();
            }
        });

        $delVazio.hide();
        $delVazio.siblings('strong').hide();
        
        $delVazio.parent().addClass('text-uppercase');
    });
});