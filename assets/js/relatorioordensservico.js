function floatParaPadraoBrasileiro(valor){
    var valortotal = valor;
    valortotal = number_format(valortotal,2,',','.');
    return valortotal;
}

function floatParaPadraoInternacional(valor){
    
    var valortotal = valor;
    valortotal = valortotal.replace(".", "").replace(".", "").replace(".", "").replace(".", "");
    valortotal = valortotal.replace(",", ".");
    valortotal = parseFloat(valortotal).toFixed(2);
    return valortotal;
}

function number_format( numero, decimal, decimal_separador, milhar_separador ){ 
        numero = (numero + '').replace(/[^0-9+\-Ee.]/g, '');
        var n = !isFinite(+numero) ? 0 : +numero,
            prec = !isFinite(+decimal) ? 0 : Math.abs(decimal),
            sep = (typeof milhar_separador === 'undefined') ? ',' : milhar_separador,
            dec = (typeof decimal_separador === 'undefined') ? '.' : decimal_separador,
            s = '',
            toFixedFix = function (n, prec) {
                var k = Math.pow(10, prec);
                return '' + Math.round(n * k) / k;
            };
 
        // Fix para IE: parseFloat(0.55).toFixed(0) = 0;
        s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
        }
        if ((s[1] || '').length < prec) {
            s[1] = s[1] || '';
            s[1] += new Array(prec - s[1].length + 1).join('0');
        }
        return s.join(dec);
}

$(function () {

       var $collapse = $('#collapseFluxocaixaResumo'),
        $cardBodyFiltros = $('#card-body-filtros'),
        taxa = $('#idTaxaSeguro').attr('data'),
        dataTable = window.dataTable,
        indexColumns = {
            acoes: 0,
            csubtotal: 10,
            cdesconto: 11,
            cvalor: 12,
            dataInicio: 8,
            dataFim: 9
        }
        
    dataTable.page.len(-1).draw();
    

    function resumo () {
        
        var rowData = dataTable.rows().data(),
        somasSubtotal = 0,
        somasDesconto = 0,
        somasValor = 0,
        subtotal = 0,
        desconto = 0,
        valor = 0,
        quantidadeOperacoes = 0;
        
        i = 0;
        rowData.each(function () {               
            subtotal = rowData[i][indexColumns.csubtotal];
            subtotal = subtotal.replace('R$  ', '');
            subtotal = floatParaPadraoInternacional(subtotal);
            somasSubtotal += subtotal;

            desconto = rowData[i][indexColumns.cdesconto];
            desconto = desconto.replace('R$  ', '');
            desconto = floatParaPadraoInternacional(desconto);
            somasDesconto += desconto;

            valor = rowData[i][indexColumns.cvalor];
            valor = valor.replace('R$  ', '');
            valor = floatParaPadraoInternacional(valor);
            somasValor += valor;

            quantidadeOperacoes++;
            i++;
        });    

        $('#subtotal').text(floatParaPadraoBrasileiro(somasSubtotal));
        $('#desconto').text(floatParaPadraoBrasileiro(somasDesconto));
        $('#valor').text(floatParaPadraoBrasileiro(somasValor));
        $('#quantidadeOperacoes').text(parseInt(quantidadeOperacoes));
        $('#estimativaTaxa').text(floatParaPadraoBrasileiro(somasValor * taxa));            

        dataTable.page.len(10).draw();
        $('#DataTables_Table_0_length').removeClass('d-none');
  
    };

    $('#DataTables_Table_0_length').addClass('d-none');
    $('#DataTables_Table_0_wrapper').addClass('d-none');
    $('#graficos').addClass('d-none');

    $('#collapseFluxocaixaResumo').on('show.bs.collapse', function () {
        $('#DataTables_Table_0_wrapper').removeClass('d-none');
        resumo();
      });

    $('#collapseFluxocaixaResumo').on('hide.bs.collapse', function () {
        $('#DataTables_Table_0_wrapper').addClass('d-none');
        dataTable.page.len(-1).draw();
    });

   
    $('#limpar-filtro').on('click', function () {
        $('#collapseFluxocaixaResumo').collapse('hide');
        $('#DataTables_Table_0_wrapper').addClass('d-none');
    });
    
    $('#card-body-filtros').on('change', function () {
        $('#collapseFluxocaixaResumo').collapse('hide');
        $('#DataTables_Table_0_wrapper').addClass('d-none');
    });

    $('#botaoRelatorio').on('click', function(){

        var selectFaixa = $('.input-filtro-faixa');
        var selectF = selectFaixa.siblings('input');
        var faixa = false;
       
        selectF.each(function(){
            if($(this).val()){
                faixa = true;
            }
        });

        var selectTexto = $('.input-filtro-texto');
        var selectT = selectTexto.siblings('input');
        var texto = false;

        selectT.each(function(){
            if($(this).val()){
                texto = true;
            }
        });
    
        if(!faixa && !texto) {
            alert("Aplique um filtro para emitir um relatório!");
            event.stopPropagation();
        }else{
            resumo();
            $('#DataTables_Table_0_wrapper').removeClass('d-none');
            $('#collapseMeta').removeClass('show').addClass('hide');
            $('#collapseGraficos2').removeClass('show').addClass('hide');
        }
    });

});