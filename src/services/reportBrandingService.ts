import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';

export interface PdfHeaderOptions {
  title: string;
  subtitle?: string;
  departmentTag?: string;
  emissionDateStr?: string;
  rightMetaLines?: string[];
  themeColor?: 'forest' | 'slate' | 'blue';
}

export interface PdfFooterOptions {
  documentCode?: string;
  extraRightText?: string;
}

export interface HtmlHeaderOptions {
  title: string;
  subtitle?: string;
  departmentTag?: string;
  emissionDateStr?: string;
  rightMetaHtml?: string;
  themeColor?: 'forest' | 'slate' | 'blue';
}

export interface HtmlFooterOptions {
  documentCode?: string;
  extraRightText?: string;
}

/**
 * Serviço Centralizado de Identidade Visual e Padronização de Relatórios
 * GAPP - PATRICK PESSOA • Gestão Integral de Compra Personalizado (v10.9)
 */
export class ReportBrandingService {
  private static cachedLogoBase64: string | null = null;

  /**
   * Obtém a logo oficial (/patrick-pessoa-brand.png) em formato Base64 Data URL
   */
  public static async getLogoBase64(): Promise<string | null> {
    if (this.cachedLogoBase64) {
      return this.cachedLogoBase64;
    }
    try {
      const response = await fetch('/patrick-pessoa-brand.png');
      if (!response.ok) return null;
      const blob = await response.blob();
      const base64 = await new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
      if (base64) {
        this.cachedLogoBase64 = base64;
      }
      return base64;
    } catch {
      return null;
    }
  }

  /**
   * Desenha o Cabeçalho Padrão Unificado GAPP - PATRICK PESSOA em documentos jsPDF (Retrato ou Paisagem)
   * Retorna a coordenada Y logo abaixo do cabeçalho para início do conteúdo.
   */
  public static async drawPdfHeader(doc: jsPDF, options: PdfHeaderOptions): Promise<number> {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const headerHeight = 25;
    const logoBase64 = await this.getLogoBase64();

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const defaultDateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} às ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const emissionStr = options.emissionDateStr || defaultDateStr;

    // Cor de fundo da faixa corporativa
    const bgColors: Record<'forest' | 'slate' | 'blue', [number, number, number]> = {
      forest: [17, 56, 41],   // #113829
      slate: [15, 23, 42],    // #0f172a
      blue: [0, 58, 112]      // #003a70
    };
    const fillRgb = bgColors[options.themeColor || 'forest'];

    // Fundo Principal
    doc.setFillColor(fillRgb[0], fillRgb[1], fillRgb[2]);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Faixa inferior de destaque (Verde-lima / Dourado executivo)
    doc.setFillColor(181, 229, 80); // #b5e550
    doc.rect(0, headerHeight - 1, pageWidth, 1, 'F');

    // Box branco arredondado para a Logo Oficial do Sistema
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, 2.5, 19, 19, 2.5, 2.5, 'F');

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin + 0.8, 3.3, 17.4, 17.4);
      } catch {
        // Fallback textual caso imagem falhe
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(17, 56, 41);
        doc.text('GAPP', margin + 9.5, 13, { align: 'center' });
      }
    }

    const textLeftX = margin + 22.5;

    // 1. Linha de Identidade do Sistema e Desenvolvedor
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(181, 229, 80); // #b5e550
    const tag = options.departmentTag
      ? `GAPP - PATRICK PESSOA • ${options.departmentTag.toUpperCase()}`
      : 'GAPP - PATRICK PESSOA • GESTÃO INTEGRAL DE COMPRA PERSONALIZADO';
    doc.text(tag, textLeftX, 7.5);

    // 2. Título Principal do Relatório
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(pageWidth > 240 ? 12.5 : 10.5);
    doc.setTextColor(255, 255, 255);
    doc.text(options.title.toUpperCase(), textLeftX, 14);

    // 3. Subtítulo Operacional
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(203, 213, 225); // Slate 300
    const sub = options.subtitle || 'Sistema ERP Apuração do Boi v10.9 • Desenvolvedor: Patrick Pessoa • Matriz 16 Filiais';
    doc.text(sub, textLeftX, 19.8);

    // 4. Quadro de Metadados à Direita
    const metaLines = options.rightMetaLines && options.rightMetaLines.length > 0
      ? options.rightMetaLines
      : [
          `Emissão: ${emissionStr}`,
          'Sistema: GAPP - PATRICK PESSOA v10.9',
          'Desenvolvedor: Patrick Pessoa'
        ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(241, 245, 249);
    metaLines.slice(0, 3).forEach((line, idx) => {
      doc.text(line, pageWidth - margin, 8 + idx * 5, { align: 'right' });
    });

    return headerHeight + 5;
  }

  /**
   * Desenha o Rodapé Padrão Unificado com Logo em todas as páginas de um documento jsPDF
   */
  public static async drawPdfFooterAllPages(doc: jsPDF, options: PdfFooterOptions = {}): Promise<void> {
    const pageCount = (doc as any).internal.getNumberOfPages();
    const logoBase64 = await this.getLogoBase64();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const footerTopY = pageHeight - 10;

      // Fundo sutil do rodapé
      doc.setFillColor(248, 250, 252);
      doc.rect(0, footerTopY, pageWidth, 10, 'F');

      // Linha divisória superior do rodapé
      doc.setDrawColor(17, 56, 41);
      doc.setLineWidth(0.35);
      doc.line(margin, footerTopY, pageWidth - margin, footerTopY);

      // Mini logo no rodapé
      let textStartX = margin;
      if (logoBase64) {
        try {
          doc.addImage(logoBase64, 'PNG', margin, footerTopY + 1.5, 6.5, 6.5);
          textStartX = margin + 8;
        } catch {}
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(17, 56, 41);
      doc.text(
        'GAPP - PATRICK PESSOA • Sistema ERP Apuração do Boi v10.9 • Gestão Integral de Compra Personalizado',
        textStartX,
        footerTopY + 4.3
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.setTextColor(100, 116, 139);
      const docCodeStr = options.documentCode ? ` • Autenticação: ${options.documentCode}` : '';
      doc.text(
        `Desenvolvedor & Direção: Patrick Pessoa • Documento Oficial Padronizado${docCodeStr}`,
        textStartX,
        footerTopY + 7.8
      );

      // Lado direito: Paginação e info adicional
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(15, 23, 42);
      const rightLabel = options.extraRightText
        ? `${options.extraRightText} • Página ${i} de ${pageCount}`
        : `Página ${i} de ${pageCount}`;
      doc.text(rightLabel, pageWidth - margin, footerTopY + 5.8, { align: 'right' });
    }
  }

  /**
   * Gera o HTML do Cabeçalho Padrão com Logo Oficial para o Motor de Impressão (PrintEngineService)
   */
  public static getHtmlHeader(options: HtmlHeaderOptions): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const defaultDateStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} às ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const emissionStr = options.emissionDateStr || defaultDateStr;

    const bgHex =
      options.themeColor === 'slate'
        ? '#0f172a'
        : options.themeColor === 'blue'
        ? '#003a70'
        : '#113829';

    const departmentTag = options.departmentTag
      ? `GAPP - PATRICK PESSOA • ${options.departmentTag.toUpperCase()}`
      : 'GAPP - PATRICK PESSOA • GESTÃO INTEGRAL DE COMPRA PERSONALIZADO';

    const subtitle =
      options.subtitle ||
      'Sistema ERP Apuração do Boi v10.9 • Desenvolvedor: Patrick Pessoa • Matriz Consolidada';

    const rightMeta =
      options.rightMetaHtml ||
      `
        <div><strong>Emissão Oficial:</strong> ${emissionStr}</div>
        <div><strong>Sistema:</strong> GAPP - PATRICK PESSOA (v10.9)</div>
        <div><strong>Desenvolvedor:</strong> Patrick Pessoa</div>
      `;

    return `
      <div style="background-color: ${bgHex}; color: #ffffff; padding: 10px 14px; border-radius: 8px; border-bottom: 3px solid #b5e550; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; background: #ffffff; border-radius: 8px; padding: 3px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
            <img src="/patrick-pessoa-brand.png" alt="GAPP - Patrick Pessoa" style="width: 100%; height: 100%; object-fit: contain;" onerror="this.src='/brand-logo.svg'" />
          </div>
          <div>
            <div style="font-size: 8pt; font-weight: 800; color: #b5e550; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px;">
              ${departmentTag}
            </div>
            <div style="font-size: 13pt; font-weight: 900; color: #ffffff; letter-spacing: -0.2px; line-height: 1.15;">
              ${options.title.toUpperCase()}
            </div>
            <div style="font-size: 7.5pt; color: #cbd5e1; margin-top: 2px;">
              ${subtitle}
            </div>
          </div>
        </div>
        <div style="text-align: right; font-size: 7.2pt; color: #f1f5f9; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); padding: 6px 10px; border-radius: 6px; line-height: 1.45; flex-shrink: 0;">
          ${rightMeta}
        </div>
      </div>
    `;
  }

  /**
   * Gera o HTML do Rodapé Padrão com Logo Oficial para o Motor de Impressão (PrintEngineService)
   */
  public static getHtmlFooter(options: HtmlFooterOptions = {}): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('pt-BR');
    const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const docCode = options.documentCode ? ` • Autenticação: <strong>${options.documentCode}</strong>` : '';
    const rightInfo = options.extraRightText || `Emitido em ${dateStr} às ${timeStr} • Documento Oficial Padronizado`;

    return `
      <div style="margin-top: 10px; padding: 6px 10px; background: #f8fafc; border-top: 2px solid #113829; border-radius: 0 0 6px 6px; display: flex; align-items: center; justify-content: space-between; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 7pt; color: #334155;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="/patrick-pessoa-brand.png" alt="Logo GAPP" style="width: 22px; height: 22px; object-fit: contain; background: #fff; border-radius: 4px; border: 1px solid #cbd5e1; padding: 1px;" onerror="this.src='/brand-logo.svg'" />
          <div>
            <div style="font-weight: 800; color: #113829;">
              GAPP - PATRICK PESSOA • Sistema ERP Apuração do Boi v10.9 • Gestão Integral de Compra Personalizado
            </div>
            <div style="font-size: 6.5pt; color: #64748b;">
              Desenvolvedor & Direção do Sistema: <strong>Patrick Pessoa</strong>${docCode}
            </div>
          </div>
        </div>
        <div style="text-align: right; font-weight: 700; color: #1e293b; font-size: 6.8pt;">
          ${rightInfo}
        </div>
      </div>
    `;
  }

  /**
   * Insere a Logo Oficial no canto superior esquerdo de uma planilha ExcelJS e adiciona linha de rodapé padronizada
   */
  public static async embedExcelLogoAndFooter(
    workbook: ExcelJS.Workbook,
    worksheet: ExcelJS.Worksheet,
    totalColumnsCount: number,
    documentTag = 'Relatório Oficial Autenticado'
  ): Promise<void> {
    workbook.creator = 'GAPP - PATRICK PESSOA';
    workbook.lastModifiedBy = 'Patrick Pessoa';

    const logoBase64 = await this.getLogoBase64();
    if (logoBase64) {
      try {
        const imageId = workbook.addImage({
          base64: logoBase64,
          extension: 'png',
        });
        worksheet.addImage(imageId, {
          tl: { col: 0.15, row: 0.12 },
          ext: { width: 46, height: 46 },
        });
      } catch {}
    }

    // Adiciona rodapé institucional ao final da planilha
    const blankRow = worksheet.addRow([]);
    blankRow.height = 8;

    const now = new Date();
    const footerText = `GAPP - PATRICK PESSOA • Sistema ERP Apuração do Boi v10.9 • Gestão Integral de Compra Personalizado • Desenvolvedor: Patrick Pessoa • ${documentTag} • Emitido em ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`;
    const footerRow = worksheet.addRow([footerText]);
    footerRow.height = 22;

    const startRowNum = footerRow.number;
    const endColLetter = this.columnIndexToLetter(Math.max(1, totalColumnsCount));
    try {
      worksheet.mergeCells(`A${startRowNum}:${endColLetter}${startRowNum}`);
    } catch {}

    const cell = worksheet.getCell(`A${startRowNum}`);
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF113829' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  private static columnIndexToLetter(colIndex: number): string {
    let temp = 0;
    let letter = '';
    let col = colIndex;
    while (col > 0) {
      temp = (col - 1) % 26;
      letter = String.fromCharCode(temp + 65) + letter;
      col = (col - temp - 1) / 26;
    }
    return letter || 'A';
  }
}
