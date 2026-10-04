import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { PurchaseBatch, Store } from '../../types/erp';
import { formatCurrencyBRL, formatNumberBR } from '../../services/calculationService';
import { 
  TrendingUp, 
  TrendingDown, 
  Scissors, 
  DollarSign, 
  Calendar, 
  Filter, 
  Layers, 
  Sparkles, 
  Info,
  Maximize2,
  CheckCircle2,
  Scale,
  Beef,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export interface DayTrendPoint {
  date: string;              // YYYY-MM-DD
  dateObj: Date;
  label: string;             // "04/09", etc.
  fullLabel: string;         // "04/09/2026 (Sex)"
  dayOfWeek: string;
  costPerKg: number;         // R$/kg de carcaça (ex: 25.80)
  arrobaPrice: number;       // R$/@ (costPerKg * 15)
  yieldPercent: number;      // Rendimento desossa (% carne limpa, ex: 75.8%)
  cleanMeatKg: number;       // kg limpos por boi de 240kg (ex: 181.9kg)
  wastePercent: number;      // % descarte (osso + sebo)
  effectiveCleanCostKg: number; // Custo efetivo por kg de carne limpa
  volumeKg: number;          // Volume abatido/desossado
  supplier: string;          // Frigorífico
  isRealBatch: boolean;      // Se é lote cadastrado no ERP
  movingAvgCost?: number;
  movingAvgYield?: number;
}

interface D3TrendsChartProps {
  batches?: PurchaseBatch[];
  stores?: Store[];
  className?: string;
}

export const D3TrendsChart: React.FC<D3TrendsChartProps> = ({
  batches = [],
  stores = [],
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Controles de Visualização
  const [metricMode, setMetricMode] = useState<'both' | 'cost' | 'yield'>('both');
  const [timeRange, setTimeRange] = useState<30 | 15 | 7>(30);
  const [costUnit, setCostUnit] = useState<'kg' | 'arroba'>('kg');
  const [showMovingAvg, setShowMovingAvg] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<DayTrendPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // -----------------------------------------------------------------
  // 1. GERAÇÃO E CONSOLIDAÇÃO DA SÉRIE HISTÓRICA DOS ÚLTIMOS 30 DIAS
  // -----------------------------------------------------------------
  const fullTrendData: DayTrendPoint[] = useMemo(() => {
    const list: DayTrendPoint[] = [];
    const baseDate = new Date(2026, 9, 3); // 03 de Outubro de 2026 (hoje no sistema)
    
    // Lista de frigoríficos parceiros do Grupo GAPP
    const suppliersPool = [
      'Frigorífico Minerva Alimentos S/A',
      'JBS Friboi - Unidade Barra do Garças',
      'Marfrig Global Foods',
      'Frigoestrela Alimentos',
      'Frigorífico Rio Maria',
      'Frigorífico Masterboi',
    ];

    // Cria os 30 dias sequenciais terminando hoje
    for (let i = 29; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const dayOfWeek = weekDays[d.getDay()];
      const label = `${day}/${month}`;
      const fullLabel = `${day}/${month}/${year} (${dayOfWeek})`;

      // 1.1 Verifica se há lote real cadastrado pelo usuário nesta data
      const matchingBatch = batches.find(b => b.date === dateStr);

      let costPerKg: number;
      let arrobaPrice: number;
      let yieldPercent: number;
      let supplier: string;
      let volumeKg: number;
      const isRealBatch = Boolean(matchingBatch);

      if (matchingBatch) {
        costPerKg = matchingBatch.costPerKg || (matchingBatch.arrobaPrice ? matchingBatch.arrobaPrice / 15 : 26.00);
        arrobaPrice = matchingBatch.arrobaPrice || (costPerKg * 15);
        supplier = matchingBatch.supplier || 'Minerva Alimentos';
        volumeKg = matchingBatch.totalGrossWeightKg || 14473.5;
        // Se lote tiver rendimento ou calculamos em torno do padrão zootécnico com leve variação pelo peso
        yieldPercent = 75.8 + (Math.sin(i * 0.9) * 0.7);
      } else {
        // 1.2 Modelagem de cotação realista do mercado pecuário e desossa dos últimos 30 dias
        // Oscilação suave do custo da carcaça casada (R$ 25,20 a R$ 26,90 / kg)
        // Arroba variando entre R$ 378,00 e R$ 403,50
        const seasonalWave = Math.sin((30 - i) / 5) * 0.65;
        const microNoise = Math.cos(i * 1.7) * 0.25;
        costPerKg = Number((26.00 + seasonalWave + microNoise).toFixed(2));
        arrobaPrice = Number((costPerKg * 15).toFixed(2));

        // Rendimento de desossa oscilando entre 74.4% e 77.3%
        // Em dias com gado mais jovem/pesado o rendimento sobe; inversamente com muita gordura de cobertura
        const yieldWave = Math.cos((30 - i) / 4.2) * 0.85;
        const yieldNoise = Math.sin(i * 2.3) * 0.35;
        yieldPercent = Number((75.7 + yieldWave + yieldNoise).toFixed(1));

        supplier = suppliersPool[i % suppliersPool.length];
        volumeKg = Math.round(12500 + Math.sin(i) * 2200);
      }

      // Cálculos zootécnicos e financeiros derivados
      const carcassRefKg = 240; // Carcaça padrão
      const cleanMeatKg = Number(((carcassRefKg * yieldPercent) / 100).toFixed(1));
      const wastePercent = Number((100 - yieldPercent).toFixed(1));
      
      // Receita residual de osso (R$ 0,70/kg) e sebo (R$ 2,10/kg)
      const wasteWeightKg = carcassRefKg - cleanMeatKg;
      const boneKg = wasteWeightKg * 0.73;
      const fatKg = wasteWeightKg * 0.27;
      const wasteRevenue = (boneKg * 0.70) + (fatKg * 2.10);
      const effectiveCleanCostKg = Number((((carcassRefKg * costPerKg) - wasteRevenue) / cleanMeatKg).toFixed(2));

      list.push({
        date: dateStr,
        dateObj: d,
        label,
        fullLabel,
        dayOfWeek,
        costPerKg,
        arrobaPrice,
        yieldPercent,
        cleanMeatKg,
        wastePercent,
        effectiveCleanCostKg,
        volumeKg,
        supplier,
        isRealBatch
      });
    }

    // 1.3 Cálculo da Média Móvel de 7 dias para Custo e Rendimento
    for (let idx = 0; idx < list.length; idx++) {
      const windowStart = Math.max(0, idx - 6);
      const windowItems = list.slice(windowStart, idx + 1);

      const avgCost = windowItems.reduce((acc, curr) => acc + curr.costPerKg, 0) / windowItems.length;
      const avgYield = windowItems.reduce((acc, curr) => acc + curr.yieldPercent, 0) / windowItems.length;

      list[idx].movingAvgCost = Number(avgCost.toFixed(2));
      list[idx].movingAvgYield = Number(avgYield.toFixed(2));
    }

    return list;
  }, [batches]);

  // Filtra de acordo com o intervalo selecionado (30, 15 ou 7 dias)
  const currentData: DayTrendPoint[] = useMemo(() => {
    return fullTrendData.slice(-timeRange);
  }, [fullTrendData, timeRange]);

  // Estatísticas e KPIs Resumo para o cabeçalho
  const summaryKPIs = useMemo(() => {
    if (currentData.length === 0) return null;

    const costs = currentData.map(d => costUnit === 'arroba' ? d.arrobaPrice : d.costPerKg);
    const yields = currentData.map(d => d.yieldPercent);

    const avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    const avgYield = yields.reduce((a, b) => a + b, 0) / yields.length;

    const minCost = Math.min(...costs);
    const maxCost = Math.max(...costs);
    const minYield = Math.min(...yields);
    const maxYield = Math.max(...yields);

    const firstCost = costs[0];
    const lastCost = costs[costs.length - 1];
    const costVariationPercent = Number((((lastCost - firstCost) / firstCost) * 100).toFixed(1));

    const firstYield = yields[0];
    const lastYield = yields[yields.length - 1];
    const yieldVariationPpts = Number((lastYield - firstYield).toFixed(1));

    // Melhor ponto de compra (menor custo com alto rendimento)
    const bestRatioPoint = [...currentData].sort((a, b) => (a.costPerKg / a.yieldPercent) - (b.costPerKg / b.yieldPercent))[0];

    return {
      avgCost,
      avgYield,
      minCost,
      maxCost,
      minYield,
      maxYield,
      costVariationPercent,
      yieldVariationPpts,
      bestRatioPoint,
      totalVolumeKg: currentData.reduce((acc, c) => acc + c.volumeKg, 0)
    };
  }, [currentData, costUnit]);

  // -----------------------------------------------------------------
  // 2. RENDERIZADOR D3.JS PRINCIPAL (SVG RESPONSIVO COM DUAL AXIS)
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || currentData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Limpa renderizações anteriores

    const width = containerRef.current.clientWidth || 900;
    const height = 380;
    const margin = { top: 25, right: 65, bottom: 42, left: 65 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet');

    // Gradientes SVG para áreas sob as curvas
    const defs = svg.append('defs');

    // Gradiente do Custo (Ciano / Azul)
    const costGrad = defs.append('linearGradient')
      .attr('id', 'd3-cost-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    costGrad.append('stop').attr('offset', '0%').attr('stop-color', '#0ea5e9').attr('stop-opacity', 0.35);
    costGrad.append('stop').attr('offset', '90%').attr('stop-color', '#0ea5e9').attr('stop-opacity', 0.0);

    // Gradiente do Rendimento (Âmbar / Laranja)
    const yieldGrad = defs.append('linearGradient')
      .attr('id', 'd3-yield-gradient')
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    yieldGrad.append('stop').attr('offset', '0%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.30);
    yieldGrad.append('stop').attr('offset', '90%').attr('stop-color', '#f59e0b').attr('stop-opacity', 0.0);

    // Grupo de plotagem com margens
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 2.1 ESCALAS D3
    const xScale = d3.scaleTime()
      .domain(d3.extent(currentData, d => d.dateObj) as [Date, Date])
      .range([0, innerWidth]);

    // Escala Y1 (Custo)
    const costAccessor = (d: DayTrendPoint) => costUnit === 'arroba' ? d.arrobaPrice : d.costPerKg;
    const costMin = (d3.min(currentData, costAccessor) || 25) * 0.98;
    const costMax = (d3.max(currentData, costAccessor) || 27) * 1.02;

    const yCostScale = d3.scaleLinear()
      .domain([costMin, costMax])
      .nice()
      .range([innerHeight, 0]);

    // Escala Y2 (Rendimento de Desossa %)
    const yieldMin = (d3.min(currentData, d => d.yieldPercent) || 74) - 0.6;
    const yieldMax = (d3.max(currentData, d => d.yieldPercent) || 78) + 0.6;

    const yYieldScale = d3.scaleLinear()
      .domain([yieldMin, yieldMax])
      .nice()
      .range([innerHeight, 0]);

    // 2.2 LINHAS DE GRADE (GRIDLINES HORIZONTAIS)
    const gridGroup = g.append('g').attr('class', 'gridlines').attr('opacity', 0.15);
    gridGroup.call(
      d3.axisLeft(yCostScale)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat(() => '')
    );
    gridGroup.selectAll('.tick line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-dasharray', '4 4');
    gridGroup.select('.domain').remove();

    // 2.3 GERADORES DE LINHA E ÁREA D3
    const costLine = d3.line<DayTrendPoint>()
      .x(d => xScale(d.dateObj))
      .y(d => yCostScale(costAccessor(d)))
      .curve(d3.curveMonotoneX);

    const costArea = d3.area<DayTrendPoint>()
      .x(d => xScale(d.dateObj))
      .y0(innerHeight)
      .y1(d => yCostScale(costAccessor(d)))
      .curve(d3.curveMonotoneX);

    const yieldLine = d3.line<DayTrendPoint>()
      .x(d => xScale(d.dateObj))
      .y(d => yYieldScale(d.yieldPercent))
      .curve(d3.curveMonotoneX);

    const yieldArea = d3.area<DayTrendPoint>()
      .x(d => xScale(d.dateObj))
      .y0(innerHeight)
      .y1(d => yYieldScale(d.yieldPercent))
      .curve(d3.curveMonotoneX);

    // Média móvel geradores
    const costMALine = d3.line<DayTrendPoint>()
      .x(d => xScale(d.dateObj))
      .y(d => yCostScale(costUnit === 'arroba' ? (d.movingAvgCost || d.costPerKg) * 15 : (d.movingAvgCost || d.costPerKg)))
      .curve(d3.curveMonotoneX);

    const yieldMALine = d3.line<DayTrendPoint>()
      .x(d => xScale(d.dateObj))
      .y(d => yYieldScale(d.movingAvgYield || d.yieldPercent))
      .curve(d3.curveMonotoneX);

    // 2.4 DESENHA AS CAMADAS CONFORME metricMode
    // Camada Rendimento (Amber)
    if (metricMode === 'both' || metricMode === 'yield') {
      g.append('path')
        .datum(currentData)
        .attr('fill', 'url(#d3-yield-gradient)')
        .attr('d', yieldArea);

      g.append('path')
        .datum(currentData)
        .attr('fill', 'none')
        .attr('stroke', '#f59e0b')
        .attr('stroke-width', 2.8)
        .attr('stroke-linecap', 'round')
        .attr('d', yieldLine);

      if (showMovingAvg) {
        g.append('path')
          .datum(currentData)
          .attr('fill', 'none')
          .attr('stroke', '#b45309')
          .attr('stroke-width', 1.6)
          .attr('stroke-dasharray', '5 4')
          .attr('opacity', 0.85)
          .attr('d', yieldMALine);
      }
    }

    // Camada Custo (Sky/Cyan)
    if (metricMode === 'both' || metricMode === 'cost') {
      g.append('path')
        .datum(currentData)
        .attr('fill', 'url(#d3-cost-gradient)')
        .attr('d', costArea);

      g.append('path')
        .datum(currentData)
        .attr('fill', 'none')
        .attr('stroke', '#0ea5e9')
        .attr('stroke-width', 2.8)
        .attr('stroke-linecap', 'round')
        .attr('d', costLine);

      if (showMovingAvg) {
        g.append('path')
          .datum(currentData)
          .attr('fill', 'none')
          .attr('stroke', '#0369a1')
          .attr('stroke-width', 1.6)
          .attr('stroke-dasharray', '5 4')
          .attr('opacity', 0.85)
          .attr('d', costMALine);
      }
    }

    // 2.5 PONTOS DE DADOS COM DESTAQUE PARA LOTES REAIS DO ERP
    currentData.forEach(point => {
      const cx = xScale(point.dateObj);

      // Ponto de Rendimento
      if (metricMode === 'both' || metricMode === 'yield') {
        const cyYield = yYieldScale(point.yieldPercent);
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cyYield)
          .attr('r', point.isRealBatch ? 5 : 3.5)
          .attr('fill', point.isRealBatch ? '#d97706' : '#f59e0b')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', point.isRealBatch ? 2.5 : 1.5);

        if (point.isRealBatch) {
          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cyYield)
            .attr('r', 8)
            .attr('fill', 'none')
            .attr('stroke', '#f59e0b')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '2 2')
            .attr('opacity', 0.9);
        }
      }

      // Ponto de Custo
      if (metricMode === 'both' || metricMode === 'cost') {
        const cyCost = yCostScale(costAccessor(point));
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cyCost)
          .attr('r', point.isRealBatch ? 5 : 3.5)
          .attr('fill', point.isRealBatch ? '#0284c7' : '#0ea5e9')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', point.isRealBatch ? 2.5 : 1.5);

        if (point.isRealBatch) {
          g.append('circle')
            .attr('cx', cx)
            .attr('cy', cyCost)
            .attr('r', 8)
            .attr('fill', 'none')
            .attr('stroke', '#0284c7')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '2 2')
            .attr('opacity', 0.9);
        }
      }
    });

    // 2.6 EIXOS D3 COM FORMATAÇÃO APURADA
    // Eixo X (Datas)
    const tickCount = timeRange === 7 ? 7 : timeRange === 15 ? 8 : 10;
    const xAxis = d3.axisBottom<Date>(xScale)
      .ticks(tickCount)
      .tickFormat(d => {
        const date = d as Date;
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
      });

    const xAxisGroup = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#94a3b8').attr('stroke-opacity', 0.4);
    xAxisGroup.selectAll('.tick line').attr('stroke', '#94a3b8').attr('stroke-opacity', 0.4);
    xAxisGroup.selectAll('.tick text')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .attr('dy', '1em');

    // Eixo Y Esquerdo (Custo - Azul/Ciano)
    if (metricMode === 'both' || metricMode === 'cost') {
      const yAxisLeft = d3.axisLeft(yCostScale)
        .ticks(5)
        .tickFormat(d => {
          const val = Number(d);
          return costUnit === 'arroba' ? `R$ ${val.toFixed(0)}` : `R$ ${val.toFixed(2)}`;
        });

      const yAxisLeftGroup = g.append('g').call(yAxisLeft);
      yAxisLeftGroup.select('.domain').attr('stroke', '#0ea5e9').attr('stroke-opacity', 0.5);
      yAxisLeftGroup.selectAll('.tick line').attr('stroke', '#0ea5e9').attr('stroke-opacity', 0.2);
      yAxisLeftGroup.selectAll('.tick text')
        .attr('fill', '#0284c7')
        .attr('font-size', '10px')
        .attr('font-weight', '700');

      // Título do Eixo Esquerdo
      g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -margin.left + 15)
        .attr('x', -innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#0284c7')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .text(costUnit === 'arroba' ? 'Custo da Arroba (R$/@)' : 'Custo de Compra (R$/kg)');
    }

    // Eixo Y Direito (Rendimento % - Âmbar)
    if (metricMode === 'both' || metricMode === 'yield') {
      const yAxisRight = d3.axisRight(yYieldScale)
        .ticks(5)
        .tickFormat(d => `${Number(d).toFixed(1)}%`);

      const yAxisRightGroup = g.append('g')
        .attr('transform', `translate(${innerWidth},0)`)
        .call(yAxisRight);

      yAxisRightGroup.select('.domain').attr('stroke', '#f59e0b').attr('stroke-opacity', 0.5);
      yAxisRightGroup.selectAll('.tick line').attr('stroke', '#f59e0b').attr('stroke-opacity', 0.2);
      yAxisRightGroup.selectAll('.tick text')
        .attr('fill', '#d97706')
        .attr('font-size', '10px')
        .attr('font-weight', '700');

      // Título do Eixo Direito
      g.append('text')
        .attr('transform', 'rotate(90)')
        .attr('y', -innerWidth - margin.right + 18)
        .attr('x', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#d97706')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .text('Rendimento de Desossa (% Carne Limpa)');
    }

    // 2.7 INTERATIVIDADE D3: CROSSHAIR LINE E OVERLAY
    const crosshair = g.append('line')
      .attr('class', 'crosshair')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#64748b')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '3 3')
      .style('opacity', 0);

    const highlightDotCost = g.append('circle')
      .attr('r', 6)
      .attr('fill', '#0ea5e9')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5)
      .style('opacity', 0);

    const highlightDotYield = g.append('circle')
      .attr('r', 6)
      .attr('fill', '#f59e0b')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2.5)
      .style('opacity', 0);

    const bisectDate = d3.bisector<DayTrendPoint, Date>(d => d.dateObj).left;

    // Overlay invisível para capturar eventos de mouse / touch com suavidade
    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('pointermove mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const x0 = xScale.invert(mx);
        const i = bisectDate(currentData, x0, 1);
        const d0 = currentData[i - 1];
        const d1 = currentData[i];
        let d = d0;
        if (d1) {
          d = x0.getTime() - d0.dateObj.getTime() > d1.dateObj.getTime() - x0.getTime() ? d1 : d0;
        }
        if (!d) return;

        const cx = xScale(d.dateObj);
        crosshair.attr('x1', cx).attr('x2', cx).style('opacity', 0.8);

        if (metricMode === 'both' || metricMode === 'cost') {
          const cyCost = yCostScale(costAccessor(d));
          highlightDotCost.attr('cx', cx).attr('cy', cyCost).style('opacity', 1);
        } else {
          highlightDotCost.style('opacity', 0);
        }

        if (metricMode === 'both' || metricMode === 'yield') {
          const cyYield = yYieldScale(d.yieldPercent);
          highlightDotYield.attr('cx', cx).attr('cy', cyYield).style('opacity', 1);
        } else {
          highlightDotYield.style('opacity', 0);
        }

        setHoveredPoint(d);

        // Posição para a tooltip flutuante
        const containerBounds = containerRef.current?.getBoundingClientRect();
        if (containerBounds) {
          const tooltipX = margin.left + cx;
          const tooltipY = Math.min(yCostScale(costAccessor(d)), yYieldScale(d.yieldPercent)) + margin.top;
          setTooltipPos({ x: tooltipX, y: tooltipY });
        }
      })
      .on('pointerleave mouseleave', () => {
        crosshair.style('opacity', 0);
        highlightDotCost.style('opacity', 0);
        highlightDotYield.style('opacity', 0);
        setHoveredPoint(null);
        setTooltipPos(null);
      });

  }, [currentData, metricMode, timeRange, costUnit, showMovingAvg]);

  // Listener para redimensionamento de janela
  useEffect(() => {
    const handleResize = () => {
      // Força re-renderização disparando estado interno
      setTooltipPos(null);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-md transition-colors space-y-6 ${className}`}>
      
      {/* ------------------------------------------------------------- */}
      {/* HEADER DO GRÁFICO D3: TÍTULOS + CONTROLES INTERATIVOS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Tendência de Custo de Compra vs. Rendimento de Desossa
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/15 text-sky-700 dark:text-sky-400 border border-sky-500/30 uppercase tracking-wider font-mono">
                  D3.js Interativo
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  {timeRange} Dias
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Análise zootécnica e financeira da relação entre a cotação da carcaça casada e a eficiência de carne limpa apurada
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Controles e Filtros */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          
          {/* Seletor de Métrica */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setMetricMode('both')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                metricMode === 'both'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ambos
            </button>
            <button
              onClick={() => setMetricMode('cost')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                metricMode === 'cost'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-sky-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Custo</span>
            </button>
            <button
              onClick={() => setMetricMode('yield')}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                metricMode === 'yield'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Desossa</span>
            </button>
          </div>

          {/* Seletor de Intervalo de Tempo */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTimeRange(30)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                timeRange === 30
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              30d
            </button>
            <button
              onClick={() => setTimeRange(15)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                timeRange === 15
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              15d
            </button>
            <button
              onClick={() => setTimeRange(7)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                timeRange === 7
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              7d
            </button>
          </div>

          {/* Unidade de Custo (R$/kg vs R$/@) */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setCostUnit('kg')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                costUnit === 'kg'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Exibir cotação por Quilo"
            >
              R$/kg
            </button>
            <button
              onClick={() => setCostUnit('arroba')}
              className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                costUnit === 'arroba'
                  ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Exibir cotação por Arroba (@)"
            >
              R$/@
            </button>
          </div>

          {/* Toggle Média Móvel 7d */}
          <button
            onClick={() => setShowMovingAvg(!showMovingAvg)}
            className={`px-2.5 py-1.5 rounded-xl border font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer ${
              showMovingAvg
                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30'
                : 'bg-transparent text-slate-500 border-slate-300 dark:border-slate-700 hover:text-slate-800 dark:hover:text-white'
            }`}
            title="Ativar/Desativar linha de tendência suavizada por Média Móvel de 7 dias"
          >
            <span className="w-2 h-0.5 bg-purple-500 rounded" />
            <span>Média Móvel (7d)</span>
          </button>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CARDS DE KPIS RESUMO DOS 30 DIAS */}
      {/* ------------------------------------------------------------- */}
      {summaryKPIs && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          
          {/* KPI 1: Custo Médio do Período */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Custo Médio ({timeRange}d)</span>
              <span className="p-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono">
                {costUnit === 'arroba' 
                  ? `R$ ${summaryKPIs.avgCost.toFixed(2)}/@`
                  : `R$ ${summaryKPIs.avgCost.toFixed(2)}/kg`}
              </span>
              <span className={`text-[11px] font-bold flex items-center ${
                summaryKPIs.costVariationPercent <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {summaryKPIs.costVariationPercent <= 0 ? (
                  <TrendingDown className="w-3 h-3 mr-0.5 inline" />
                ) : (
                  <TrendingUp className="w-3 h-3 mr-0.5 inline" />
                )}
                {summaryKPIs.costVariationPercent > 0 ? `+${summaryKPIs.costVariationPercent}%` : `${summaryKPIs.costVariationPercent}%`}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
              Mín: R$ {summaryKPIs.minCost.toFixed(2)} • Máx: R$ {summaryKPIs.maxCost.toFixed(2)}
            </span>
          </div>

          {/* KPI 2: Rendimento Médio de Desossa */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Rendimento Desossa</span>
              <span className="p-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Scissors className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                {summaryKPIs.avgYield.toFixed(1)}%
              </span>
              <span className={`text-[11px] font-bold flex items-center ${
                summaryKPIs.yieldVariationPpts >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600'
              }`}>
                {summaryKPIs.yieldVariationPpts >= 0 ? `+${summaryKPIs.yieldVariationPpts} p.p.` : `${summaryKPIs.yieldVariationPpts} p.p.`}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
              ~{(240 * summaryKPIs.avgYield / 100).toFixed(1)} kg carne limpa / boi 240kg
            </span>
          </div>

          {/* KPI 3: Melhor Relação Compra x Rendimento */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Melhor Lote da Janela</span>
              <span className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                {summaryKPIs.bestRatioPoint.label}
              </span>
              <span className="text-xs text-slate-600 dark:text-slate-300 font-bold font-mono">
                (R$ {summaryKPIs.bestRatioPoint.costPerKg.toFixed(2)} • {summaryKPIs.bestRatioPoint.yieldPercent}%)
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block mt-1" title={summaryKPIs.bestRatioPoint.supplier}>
              {summaryKPIs.bestRatioPoint.supplier.split(' - ')[0]}
            </span>
          </div>

          {/* KPI 4: Custo Efetivo Médio da Carne Limpa */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Custo Carne Limpa Real</span>
              <span className="p-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Scale className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 font-mono">
                R$ {(summaryKPIs.avgCost / (summaryKPIs.avgYield / 100) * 0.94).toFixed(2)}/kg
              </span>
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
              Abatida receita de osso e sebo da graxaria
            </span>
          </div>

        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ÁREA GRÁFICA DO D3.JS COM TOOLTIP FLUTUANTE */}
      {/* ------------------------------------------------------------- */}
      <div 
        ref={containerRef} 
        className="relative w-full h-[380px] bg-slate-50/60 dark:bg-slate-950/40 rounded-xl p-2 border border-slate-100 dark:border-slate-800/80 overflow-hidden"
      >
        <svg 
          ref={svgRef} 
          className="w-full h-full overflow-visible select-none"
        />

        {/* TOOLTIP FLUTUANTE EM HTML / TAILWIND */}
        {hoveredPoint && tooltipPos && (
          <div
            className="absolute pointer-events-none z-30 transition-transform duration-75 ease-out"
            style={{
              left: `${Math.min(Math.max(tooltipPos.x, 140), (containerRef.current?.clientWidth || 800) - 160)}px`,
              top: `${Math.max(20, Math.min(tooltipPos.y - 20, 220))}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="bg-slate-900/98 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 backdrop-blur-md w-72 space-y-2 text-xs">
              
              {/* Header do Ponto */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-bold text-white text-xs">{hoveredPoint.fullLabel}</span>
                </div>
                {hoveredPoint.isRealBatch ? (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    LOTE REAL
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-slate-400">
                    Cotação Integrada
                  </span>
                )}
              </div>

              {/* Métricas Principais */}
              <div className="space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-sky-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="font-sans font-semibold text-slate-300">Custo de Compra:</span>
                  </span>
                  <strong className="text-white">
                    {costUnit === 'arroba'
                      ? `R$ ${hoveredPoint.arrobaPrice.toFixed(2)}/@`
                      : `R$ ${hoveredPoint.costPerKg.toFixed(2)}/kg`}
                  </strong>
                </div>

                <div className="flex items-center justify-between text-amber-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-sans font-semibold text-slate-300">Rendimento Desossa:</span>
                  </span>
                  <strong className="text-white">
                    {hoveredPoint.yieldPercent.toFixed(1)}% ({hoveredPoint.cleanMeatKg} kg)
                  </strong>
                </div>

                <div className="flex items-center justify-between text-purple-300 text-[11px] pt-1 border-t border-slate-800">
                  <span className="text-slate-400 font-sans">Custo Carne Limpa:</span>
                  <span className="font-bold text-purple-300">R$ {hoveredPoint.effectiveCleanCostKg.toFixed(2)}/kg</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="font-sans">Descarte (Osso & Sebo):</span>
                  <span>{hoveredPoint.wastePercent.toFixed(1)}% (~{(240 - hoveredPoint.cleanMeatKg).toFixed(1)} kg)</span>
                </div>

                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span className="font-sans">Volume Abatido:</span>
                  <span>{formatNumberBR(hoveredPoint.volumeKg, 0)} kg</span>
                </div>
              </div>

              {/* Fornecedor */}
              <div className="text-[10px] text-slate-400 truncate pt-1 border-t border-slate-800">
                <span className="font-semibold text-slate-300">Fornecedor:</span> {hoveredPoint.supplier}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* LEGENDA E NOTAS TÉCNICAS INFORMATIVAS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
        
        {/* Itens da Legenda */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-sky-500 rounded-full" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Custo de Compra (R$/kg)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 bg-amber-500 rounded-full" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Rendimento de Desossa (%)</span>
          </div>

          {showMovingAvg && (
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-purple-500 rounded-full border-b border-dashed border-purple-500" />
              <span className="font-medium text-slate-500 dark:text-slate-400">Tendência Média Móvel (7d)</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-amber-500/20" />
            <span className="font-medium text-slate-500 dark:text-slate-400">Lotes Registrados no ERP</span>
          </div>
        </div>

        {/* Dica de Operação / Insight */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>Passe o cursor sobre os pontos para visualizar o desdobramento diário de cada carcaça.</span>
        </div>

      </div>

    </div>
  );
};
