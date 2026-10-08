import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export class ManualPdfService {
  /**
   * Converte a imagem do logo para base64
   */
  private static async getLogoBase64(): Promise<string | null> {
    try {
      const response = await fetch('/patrick-pessoa-brand.png');
      if (!response.ok) return null;
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  // =========================================================================
  // 1. MANUAL DO USUÁRIO DO SISTEMA ERP (GESTÃO / MATRIZ / 16 FILIAIS)
  // =========================================================================
  public static async generateAndDownloadERPManual(): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const logoBase64 = await this.getLogoBase64();

    const addHeader = (title: string, sectionNumber?: string) => {
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 20, 'F');

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', margin, 3, 14, 14);
        } catch {}
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(245, 158, 11); // Amber 500
      doc.text('GRUPO GAPP SISTEMAS • ERP GESTÃO APURAÇÃO DO BOI v10.7', margin + 18, 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(title, margin + 18, 15);

      if (sectionNumber) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(sectionNumber, pageWidth - margin, 12, { align: 'right' });
      }
    };

    const addFooter = (pageNum: number, totalPages: number) => {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('Manual do Usuário • Sistema ERP Gestão Apuração do Boi • Patrick Pessoa (Direção de Carnes)', margin, pageHeight - 6);
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    };

    // -----------------------------------------------------------------------
    // PÁGINA 1: CAPA & VISÃO GERAL EXECUTIVA
    // -----------------------------------------------------------------------
    doc.setFillColor(19, 30, 20); // Dark Green Theme #131e14
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Moldura decorativa
    doc.setDrawColor(16, 185, 129); // Emerald 500
    doc.setLineWidth(1);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
    doc.setLineWidth(0.3);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', pageWidth / 2 - 22, 28, 44, 44);
      } catch {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(245, 158, 11); // Amber 500
    doc.text('GRUPO GAPP SISTEMAS • PATRICK PESSOA', pageWidth / 2, 82, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text('MANUAL DO USUÁRIO', pageWidth / 2, 94, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(52, 211, 153); // Emerald 400
    doc.text('SISTEMA ERP GESTÃO APURAÇÃO DO BOI', pageWidth / 2, 103, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(203, 213, 225);
    doc.text('Guia Completo de Operação, Parâmetros, Fórmulas & Procedimentos', pageWidth / 2, 112, { align: 'center' });

    // Box de identificação da versão
    doc.setFillColor(30, 41, 59); // Slate 800
    doc.roundedRect(margin + 10, 122, contentWidth - 20, 46, 3, 3, 'F');
    doc.setDrawColor(51, 65, 85);
    doc.rect(margin + 10, 122, contentWidth - 20, 46);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(245, 158, 11);
    doc.text('INFORMAÇÕES OFICIAIS DE HOMOLOGAÇÃO:', margin + 15, 130);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(241, 245, 249);
    doc.text('• Versão do Sistema: v10.7 (Build Oficial 1.7.0107)', margin + 15, 137);
    doc.text('• Arquitetura: Solidcon Clássico ERP Engine + MDI Desktop Integrado', margin + 15, 143);
    doc.text('• Abrangência da Rede: Matriz Consolidada de 16 Filiais', margin + 15, 149);
    doc.text('• Banco de Dados & Nuvem: PostgreSQL / Firestore Cloud Backup', margin + 15, 155);
    doc.text('• Data de Validação da Matriz: Quinta-feira, 1 de Outubro de 2026', margin + 15, 161);

    // Sumário Executivo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(255, 255, 255);
    doc.text('ESTRUTURA GERAL DOS MÓDULOS COBERTOS:', margin + 10, 180);

    const modules = [
      ['1. Acesso, Perfis de Usuário & Segurança', 'Controle de acesso por módulo e níveis de operador'],
      ['2. Planilha Matriz de Compras da Direção', 'Distribuição de 16 lojas, fórmulas Boi e Sugestão'],
      ['3. Rendimento & Desossa Zootécnica', 'Custo limpo, cortes nobres, sebo/osso e markups'],
      ['4. Apuração de Resultados & DRE', 'Receita bruta, deduções, CMV, margens e lucro líquido'],
      ['5. Controle de Estoque & Câmaras Frias', 'Gestão de entradas, saídas e contagem de balcão'],
      ['6. Gestão de Compras, Lotes & Fornecedores', 'Cotação da @, peso vivo, balança e notas fiscais'],
      ['7. Controle de Descarte & Graxarias', 'Pesagem de sebo/osso, venda e amortização no custo'],
      ['8. Backup Nuvem, Restauração & Atalhos', 'Sincronização Firestore e teclas de atalho rápido']
    ];

    let my = 188;
    modules.forEach(([title, desc]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(52, 211, 153);
      doc.text(title, margin + 12, my);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(`— ${desc}`, margin + 82, my);
      my += 8.5;
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Documento Restrito e Confidencial • Uso Exclusivo da Direção e Gerências', pageWidth / 2, pageHeight - 16, { align: 'center' });

    // -----------------------------------------------------------------------
    // PÁGINA 2: MÓDULOS 1 & 2 (ACESSO & PLANILHA MATRIZ DA DIREÇÃO)
    // -----------------------------------------------------------------------
    doc.addPage();
    addHeader('MÓDULOS 1 & 2 • ACESSO & PLANILHA MATRIZ', 'PÁGINA 2');

    let y = 28;

    // Seção 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Autenticação, Níveis de Acesso & Segurança', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'O sistema ERP possui autenticação com separação rigorosa de perfis hierárquicos para garantir a integridade dos dados contábeis e financeiros:',
      margin, y, { maxWidth: contentWidth }
    );
    y += 9;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Perfil', 'Usuário Padrão', 'Privilégios no Sistema', 'Acesso aos Módulos']],
      body: [
        ['DESENVOLVEDOR', 'desenvolvedor', 'Acesso total irrestrito a todos os módulos, código, Firestore e resets', 'Todos (100%)'],
        ['DIREÇÃO', 'direcao', 'Edição da Matriz de Compra, Lotes, DRE, Parâmetros e Aprovações', 'Todos os módulos gerenciais'],
        ['GERENTE_LOJA', 'gerente_loja', 'Consulta da planilha, lançamento de estoque e câmaras da filial', 'Painel, Planilha, Estoque'],
        ['AUDITOR', 'auditoria', 'Acesso somente leitura para conferência contábil e exportações', 'Visualização e Relatórios']
      ],
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      theme: 'grid'
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Seção 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Operação da Planilha Matriz de Compra da Direção (16 Filiais)', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'A Planilha Matriz é o coração operacional do abastecimento. Nela, a Direção distribui a compra de quartos entre as 16 lojas com base nas vendas históricas e estoque em câmara fria:',
      margin, y, { maxWidth: contentWidth }
    );
    y += 9;

    // Caixa de Fórmulas Matemáticas Mestres
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 38);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9); // Amber 700
    doc.text('FÓRMULAS MESTRES CONSOLIDADAS (APURAÇÃO PATRICK PESSOA):', margin + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('• Boi Equivalente (Cabeça):', margin + 4, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.text('Boi = (Pedido Dianteiro + Pedido Traseiro + Pedido Coxão + Pedido Alcatrão) / 2', margin + 50, y + 13);

    doc.setFont('helvetica', 'bold');
    doc.text('• Sugestão de Compra:', margin + 4, y + 19);
    doc.setFont('helvetica', 'normal');
    doc.text('Sugestão = Venda Média Projetada - Estoque de Câmara Total', margin + 50, y + 19);

    doc.setFont('helvetica', 'bold');
    doc.text('• Peso Médio dos Quartos:', margin + 4, y + 25);
    doc.setFont('helvetica', 'normal');
    doc.text('Dianteiro: 60 kg  |  Traseiro: 60 kg  |  Coxão: 36 kg  |  Alcatrão: 24 kg  |  Costela: 20 kg', margin + 50, y + 25);

    doc.setFont('helvetica', 'bold');
    doc.text('• Preço da Arroba & Custo/kg:', margin + 4, y + 31);
    doc.setFont('helvetica', 'normal');
    doc.text('1 @ = 15 kg  |  Arroba Base R$ 390,00  ==>  Custo Quarto com Osso: R$ 26,00/kg', margin + 50, y + 31);

    y += 44;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('Navegação Natural por Teclado (Estilo Excel / Google Sheets):', margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('• Use as setas do teclado (Cima, Baixo, Esquerda, Direita) para se mover entre as células de pedidos das 16 lojas.', margin, y);
    y += 4;
    doc.text('• Pressione Enter ou Tab para avançar para a próxima loja ou coluna. Digite os números diretamente.', margin, y);
    y += 4;
    doc.text('• Os totais gerais, volumes de kg, quantidade de bois e valores em R$ são recalculados instantaneamente.', margin, y);

    addFooter(2, 4);

    // -----------------------------------------------------------------------
    // PÁGINA 3: MÓDULOS 3, 4 & 5 (RENDIMENTO, DRE & ESTOQUE)
    // -----------------------------------------------------------------------
    doc.addPage();
    addHeader('MÓDULOS 3, 4 & 5 • DESOSSA, DRE & ESTOQUE', 'PÁGINA 3');

    y = 28;

    // Seção 3
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Rendimento & Desossa do Boi (Custo Limpo Zootécnico)', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'O módulo de Desossa calcula com precisão matemática a transformação da carcaça inteira com osso (R$ 26,00/kg) nos 18 cortes de carne limpa de balcão e nos subprodutos industriais (sebo e osso):',
      margin, y, { maxWidth: contentWidth }
    );
    y += 8;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Grupo de Cortes', 'Principais Itens Cadastrados', 'Rendimento %', 'Equalização de Custo']],
      body: [
        ['Cortes Nobres (Grelha)', 'Picanha, Filé Mignon, Contra Filé, Alcatra', '12,5% da carcaça', 'Maior agregação de margem bruta (30% a 45%)'],
        ['Cortes de Dianteiro', 'Acém, Paleta, Peito, Músculo', '38,0% da carcaça', 'Preços acessíveis para alto giro de vendas diárias'],
        ['Cortes de Traseiro/Coxão', 'Chã de Dentro, Patinho, Lagarto, Coxão Duro', '27,5% da carcaça', 'Cortes versáteis com margem média de 20% a 28%'],
        ['Subprodutos (Descarte)', 'Sebo Industrial (R$ 2,10/kg) e Ossos (R$ 0,70/kg)', '22,0% da carcaça', 'Receita recuperada que reduz o custo da carne limpa']
      ],
      headStyles: { fillColor: [4, 120, 87], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      theme: 'grid'
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // Seção 4: DRE Gerencial
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('4. DRE Gerencial & Apuração de Margens de Lucro', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'Demonstrativo do Resultado do Exercício com consolidação contábil da compra de gado das 16 filiais:',
      margin, y, { maxWidth: contentWidth }
    );
    y += 7;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Linha do Demonstrativo (DRE)', 'Valor Consolidado (R$)', '% Faturamento', 'Impacto Operacional']],
      body: [
        ['(+) Receita Bruta com Venda de Carnes', 'R$ 526.836,73', '100,0%', 'Faturamento sobre mix projetado de 16 lojas'],
        ['(-) Impostos sobre Vendas & Deduções (7%)', '- R$ 36.878,57', '- 7,0%', 'Tributação de ICMS e PIS/COFINS'],
        ['(=) RECEITA OPERACIONAL LÍQUIDA', 'R$ 489.958,16', '93,0%', 'Base real de faturamento líquido realizável'],
        ['(-) Custo da Mercadoria Vendida (CMV)', '- R$ 376.311,95', '- 71,4%', 'Custo de aquisição do lote matriz de boi'],
        ['(=) LUCRO BRUTO OPERACIONAL', 'R$ 113.646,21', '21,6%', 'Margem bruta de desossa da rede'],
        ['(-) Custos Operacionais (Câmaras/Mão de Obra)', '- R$ 36.183,75', '- 6,9%', 'Energia elétrica, embalagens e açougueiros'],
        ['(+) Receita com Subprodutos (Graxarias)', '+ R$ 8.684,10', '+ 1,6%', 'Venda de sebo de cobertura e ossos'],
        ['(=) RESULTADO LÍQUIDO OPERACIONAL', 'R$ 86.146,56', '16,3%', 'Lucro líquido gerencial final da operação']
      ],
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      theme: 'striped'
    });

    addFooter(3, 4);

    // -----------------------------------------------------------------------
    // PÁGINA 4: MÓDULOS 6, 7 & 8 (COMPRAS, GRAXARIAS, BACKUP E ATALHOS)
    // -----------------------------------------------------------------------
    doc.addPage();
    addHeader('MÓDULOS 6, 7 & 8 • COMPRAS, GRAXARIAS & ATALHOS', 'PÁGINA 4');

    y = 28;

    // Seção 6 & 7: Compras, Pedidos e Descarte
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Gestão de Compras, Pedidos Timbrados, WhatsApp & Descarte', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(
      '• Pedidos & Planilha via WhatsApp: Emissão do documento timbrado oficial e envio direto por WhatsApp tanto da Planilha Matriz consolidada quanto dos Pedidos de Compra para os frigoríficos/fornecedores com PDF anexo.',
      margin, y, { maxWidth: contentWidth }
    );
    y += 8;
    doc.text(
      '• Descarte & Subprodutos: Tabela completa de coletas de sebo e osso por filial com botões de "Visualizar" (comprovante zootécnico), "Editar" (ajuste de pesos/cotações com recálculo automático) e "Excluir" (com confirmação segura e estorno no banco).',
      margin, y, { maxWidth: contentWidth }
    );
    y += 12;

    // Seção 8: Atalhos de Teclado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('6. Guia Oficial de Teclas de Atalho do Sistema ERP', margin, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Tecla de Atalho', 'Ação / Módulo Aberto', 'Descrição Operacional']],
      body: [
        ['F1', 'Tabela de Atalhos', 'Abre a janela de ajuda com todos os comandos rápidos'],
        ['F2 ou Alt+2', 'Planilha Matriz da Direção', 'Abre a planilha oficial de compra das 16 lojas'],
        ['F3 ou Alt+1', 'Painel Geral (Dashboard)', 'Exibe gráficos de faturamento, margens e estoque'],
        ['F4 ou Alt+3', 'Desossa & Rendimento', 'Abre a calculadora de custo limpo e cortes bovinos'],
        ['Alt + 4', 'DRE & Margens', 'Demonstrativo de Resultado do Exercício'],
        ['Alt + 5', 'Estoque & Câmaras Frias', 'Lançamentos de balcão e estoque das 16 filiais'],
        ['Alt + 6', 'Compras & Lotes de Gado', 'Módulo de lançamento de NF e frigoríficos'],
        ['Alt + 7', 'Descarte (Sebo & Osso)', 'Tabela de coletas de graxaria e amortização'],
        ['Alt + 8', 'Módulo 1: Cadastros', 'Parâmetros de produtos, preços e 16 filiais'],
        ['Alt + 9', 'Backup Online Nuvem', 'Painel de sincronização e agendamento Firestore'],
        ['Alt + X', 'Exportar para Excel (.xlsx)', 'Baixa planilha completa com fórmulas estruturadas'],
        ['Alt + P', 'Imprimir Relatório Oficial', 'Emite relatório PDF/Impressão em alta fidelidade'],
        ['Alt + C', 'Calculadora Rápida', 'Simulador popup de desossa e rendimento'],
        ['Alt + T', 'Alternar Tema Visual', 'Alterna entre Solidcon Clássico, Claro e Escuro'],
        ['Alt + F4', 'Sair do Sistema', 'Encerra a sessão com segurança']
      ],
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      theme: 'grid'
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // Caixa de suporte e contato
    doc.setFillColor(236, 253, 245); // Emerald 50
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(margin, y, contentWidth, 22);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(6, 95, 70); // Emerald 800
    doc.text('CENTRAL DE SUPORTE TÉCNICO & AUDITORIA CORPORATIVA:', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    doc.text('• Responsável Técnico: Patrick Pessoa (Diretoria de Carnes & Desenvolvimento)', margin + 4, y + 11);
    doc.text('• Portal Web Oficial: www.gipp-site.vercel.app  |  Suporte: Grupo GAPP Sistemas', margin + 4, y + 16);

    addFooter(4, 4);

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Manual_Usuario_Sistema_ERP_GAPP_${dateStr}.pdf`);
  }

  // =========================================================================
  // 2. MANUAL DO USUÁRIO DO PORTAL DAS LOJAS / FILIAIS (CELULAR & DESKTOP)
  // DE SIMPLES ENTENDIMENTO E MANUSEIO PRÁTICO PARA O OPERADOR DE LOJA
  // =========================================================================
  public static async generateAndDownloadPortalManual(): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    const logoBase64 = await this.getLogoBase64();

    const addPortalHeader = (title: string, stepBadge?: string) => {
      doc.setFillColor(6, 95, 70); // Emerald 800
      doc.rect(0, 0, pageWidth, 20, 'F');

      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', margin, 3, 14, 14);
        } catch {}
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(253, 224, 71); // Yellow 300
      doc.text('GRUPO GAPP SISTEMAS • PORTAL DE ESTOQUE DAS 16 FILIAIS', margin + 18, 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(title, margin + 18, 15);

      if (stepBadge) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text(stepBadge, pageWidth - margin, 12, { align: 'right' });
      }
    };

    const addPortalFooter = (pageNum: number, totalPages: number) => {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Manual Prático do Portal das Filiais • Guia Rápido do Operador e Encarregado de Açougue', margin, pageHeight - 6);
      doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
    };

    // -----------------------------------------------------------------------
    // PÁGINA 1: CAPA ILUSTRADA & GUIA PASSO A PASSO RÁPIDO
    // -----------------------------------------------------------------------
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 0, pageWidth, 55, 'F');

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin + 2, 10, 35, 35);
      } catch {}
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(254, 240, 138); // Yellow 200
    doc.text('GUIA PRÁTICO & ILUSTRADO DO OPERADOR DE LOJA', margin + 42, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text('MANUAL DO USUÁRIO DO PORTAL', margin + 42, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(236, 253, 245);
    doc.text('Como Acessar, Contar o Estoque das Câmaras e Enviar os Pedidos pelo Celular', margin + 42, 38);
    doc.text('Aplicável aos Gerentes de Loja, Encarregados de Açougue e Conferentes das 16 Filiais', margin + 42, 44);

    let y = 64;

    // Destaque de simplicidade
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, y, contentWidth, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(6, 95, 70);
    doc.text('OBJETIVO DESTE MANUAL:', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'Este manual foi desenvolvido de forma simples e direta para que qualquer colaborador da loja possa lançar a contagem diária de carnes em menos de 2 minutos, diretamente do celular ou computador do açougue.',
      margin + 4, y + 11, { maxWidth: contentWidth - 8 }
    );

    y += 26;

    // PASSO 1: COMO ACESSAR E INSTALAR NO CELULAR
    doc.setFillColor(239, 246, 255); // Blue 50
    doc.roundedRect(margin, y, contentWidth, 44, 2, 2, 'F');
    doc.setDrawColor(191, 219, 254);
    doc.rect(margin, y, contentWidth, 44);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 64, 175); // Blue 800
    doc.text('PASSO 1: Como Acessar e Criar o Ícone no Celular (Instalação PWA)', margin + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Abra o link do portal no navegador do celular (Chrome, Safari ou Edge).', margin + 4, y + 14);
    doc.text('2. O portal entrará automaticamente em Modo Tela Cheia para facilitar o manuseio com luvas/toque.', margin + 4, y + 20);
    doc.text('3. Toque no botão dourado "Instalar App" ou no menu do navegador "Adicionar à Tela Inicial".', margin + 4, y + 26);
    doc.text('4. Pronto! O ícone "Gestão Apuração do Boi" ficará disponível na tela do celular como um aplicativo real.', margin + 4, y + 32);
    doc.text('5. Você pode usar no tema Claro (fundo branco) ou Escuro (fundo escuro para poupar bateria).', margin + 4, y + 38);

    y += 50;

    // PASSO 2: IDENTIFICAÇÃO DA LOJA E DO OPERADOR
    doc.setFillColor(254, 242, 242); // Rose 50
    doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'F');
    doc.setDrawColor(254, 202, 202);
    doc.rect(margin, y, contentWidth, 42);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(153, 27, 27); // Rose 800
    doc.text('PASSO 2: Seleção Obrigatória da Filial & Nome do Responsável', margin + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Na tela inicial, toque na caixa vermelha "Selecione a sua Loja Obrigatório" e escolha sua filial.', margin + 4, y + 14);
    doc.text('2. Você também pode tocar nos botões rápidos de atalho com o nome das 16 lojas.', margin + 4, y + 20);
    doc.text('3. Digite o seu Nome Completo ou Cargo (ex: "Roberto - Encarregado de Açougue").', margin + 4, y + 26);
    doc.text('4. Toque no botão verde "Acessar Painel da Minha Loja".', margin + 4, y + 32);
    doc.text('5. Atenção: O sistema registra o seu nome e horário para segurança da contagem.', margin + 4, y + 38);

    y += 48;

    // PASSO 3: PERGUNTA DO BOI
    doc.setFillColor(255, 251, 235); // Amber 50
    doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'F');
    doc.setDrawColor(253, 230, 138);
    doc.rect(margin, y, contentWidth, 34);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(146, 64, 14); // Amber 800
    doc.text('PASSO 3: Pergunta Obrigatória — "Sua Loja Recebeu BOI Hoje?"', margin + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('• Se o caminhão frigorífico descarregou carcaças/quartos hoje na sua loja: Toque em "SIM (Recebeu Boi)".', margin + 4, y + 14);
    doc.text('• Se a sua loja NÃO recebeu carne do frigorífico hoje: Toque em "NÃO (Sem Recebimento)".', margin + 4, y + 20);
    doc.text('• Esta informação é repassada em tempo real para a Planilha da Direção e para o Controle de Compras.', margin + 4, y + 26);

    addPortalFooter(1, 2);

    // -----------------------------------------------------------------------
    // PÁGINA 2: CONTAGEM DAS CÂMARAS, DESOSSA, SALVAMENTO & DÚVIDAS
    // -----------------------------------------------------------------------
    doc.addPage();
    addPortalHeader('CONTAGEM DE CÂMARA, DESOSSA & SALVAMENTO', 'PÁGINA 2');

    y = 26;

    // PASSO 4: LANÇAMENTO DE PEÇAS NA CÂMARA
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(6, 95, 70);
    doc.text('PASSO 4: Contagem Rápida das Peças em Câmara Frigorífica', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'Na primeira aba ("Estoque em Câmara Fria"), lance a quantidade de peças inteiras penduradas nos ganchos da câmara:',
      margin, y, { maxWidth: contentWidth }
    );
    y += 7;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Quarto / Peça', 'Como Contar', 'Botões de Apoio no Celular', 'Exemplo Típico']],
      body: [
        ['Dianteiro com Osso', 'Conte os quartos dianteiros nos ganchos', 'Toque no (+) ou (-) ou digite o número', '10 peças'],
        ['Traseiro com Osso', 'Conte os quartos traseiros inteiros', 'Toque no (+) ou (-) ou digite o número', '12 peças'],
        ['Costela Gaúcha', 'Conte as costelas inteiras penduradas', 'Toque no (+) ou (-) ou digite o número', '4 peças']
      ],
      headStyles: { fillColor: [6, 95, 70], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
      theme: 'grid'
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // PASSO 5: DESOSSA DE BALCÃO
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(6, 95, 70);
    doc.text('PASSO 5: Lançamento de Cortes Desossados & Suíno (Balcão)', margin, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(
      'Navegue pelas abas "Cortes Desossados" e "Carne Suína" para conferir os cortes de balcão:',
      margin, y, { maxWidth: contentWidth }
    );
    y += 6;

    doc.text('• Cortes Nobres: Picanha, Filé Mignon, Contra Filé, Alcatra e Fraldinha.', margin + 4, y);
    y += 4.5;
    doc.text('• Desossa de Dianteiro: Acém, Paleta, Peito e Músculo.', margin + 4, y);
    y += 4.5;
    doc.text('• Desossa de Coxão / Traseiro: Chã de Dentro, Patinho, Lagarto e Coxão Duro.', margin + 4, y);
    y += 4.5;
    doc.text('• Suínos: Pernil com osso / peças para abastecimento do açougue.', margin + 4, y);
    y += 8;

    // PASSO 6: SALVAMENTO E COMPROVANTE
    doc.setFillColor(236, 253, 245); // Emerald 50
    doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(margin, y, contentWidth, 34);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(6, 95, 70);
    doc.text('PASSO 6: Salvar a Contagem & Conferir no Histórico', margin + 4, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text('1. Após revisar as abas, toque no botão verde grande no rodapé: "Salvar Contagem de Estoque".', margin + 4, y + 13);
    doc.text('2. Aparecerá a caixa de confirmação: "Pedido salvo e enviado com sucesso" com o botão Fechar e o resumo dos dados.', margin + 4, y + 19);
    doc.text('3. Toque no botão "Histórico" (ícone de relógio) para ver os lançamentos de dias anteriores.', margin + 4, y + 25);

    y += 40;

    // DÚVIDAS FREQUENTES & DICAS DE OURO
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('DÚVIDAS FREQUENTES & DICAS DE OURO PARA O OPERADOR:', margin, y);
    y += 5;

    const faqs = [
      ['E se a internet da loja oscilar?', 'Não se preocupe! O sistema guarda a contagem na memória do celular e sincroniza com a Matriz assim que a internet reconectar.'],
      ['Posso corrigir uma contagem errada?', 'Sim! Basta abrir o portal novamente, ajustar as peças e clicar em "Salvar Contagem" novamente para atualizar.'],
      ['Como colocar o celular em tela cheia?', 'Toque no ícone de tela cheia no topo direito para esconder as barras do navegador e usar a tela toda.'],
      ['O que fazer se o portal estiver bloqueado?', 'A Direção define horários limites para fechamento da planilha. Se o portal estiver bloqueado, contate a Direção de Carnes.']
    ];

    faqs.forEach(([q, a]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text(`• ${q}`, margin + 2, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(a, margin + 5, y, { maxWidth: contentWidth - 8 });
      y += 6;
    });

    addPortalFooter(2, 2);

    const dateStr = new Date().toISOString().split('T')[0];
    doc.save(`Manual_Usuario_Portal_Lojas_GAPP_${dateStr}.pdf`);
  }
}
