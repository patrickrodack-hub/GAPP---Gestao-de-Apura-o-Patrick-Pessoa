import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrapeCepeaRealTime } from './src/services/cepeaScraper';
import { marketQuotesCacheService } from './src/services/marketQuotesCacheService';
import { perishablesTvPromoScraperService } from './src/services/perishablesTvPromoScraper';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Inicia Polling de Segundo Plano Contínuo (Ciclo de 60s)
  marketQuotesCacheService.startBackgroundPolling(60000);

  // Endpoint de Saúde
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'GAPP Apuração do Boi API',
      timestamp: new Date().toISOString()
    });
  });

  // Endpoint de Cotações com Cache TTL e Polling de Segundo Plano (Hub, Cortes & Balcão, Varejo 12 Redes)
  app.get('/api/market/quotes', async (_req, res) => {
    try {
      const data = await marketQuotesCacheService.getQuotes();
      res.setHeader('Cache-Control', 'public, max-age=30');
      res.json(data);
    } catch (err: any) {
      console.error('[API /api/market/quotes] Erro:', err);
      res.status(500).json({
        error: 'Erro ao carregar cotações com cache TTL',
        message: err?.message || 'Falha de comunicação'
      });
    }
  });

  // Endpoint para Forçar Sincronização Imediata
  app.post('/api/market/sync', async (_req, res) => {
    try {
      const data = await marketQuotesCacheService.forceSync();
      res.json(data);
    } catch (err: any) {
      console.error('[API /api/market/sync] Erro ao sincronizar mercado:', err);
      res.status(500).json({
        error: 'Erro ao forçar sincronização de mercado',
        message: err?.message || 'Falha de comunicação'
      });
    }
  });

  // Endpoint de Scraping em Tempo Real do CEPEA/ESALQ (utiliza o cache em segundo plano)
  app.get('/api/cepea/scrape', async (_req, res) => {
    try {
      const cachedMarket = await marketQuotesCacheService.getQuotes();
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json(cachedMarket.cepea);
    } catch (err: any) {
      try {
        const directScrape = await scrapeCepeaRealTime();
        res.setHeader('Cache-Control', 'public, max-age=60');
        res.json(directScrape);
      } catch (fallbackErr: any) {
        console.error('[API /api/cepea/scrape] Erro durante scraping:', fallbackErr);
        res.status(500).json({
          error: 'Erro ao executar scraping das cotações CEPEA',
          message: fallbackErr?.message || 'Falha de comunicação'
        });
      }
    }
  });

  // =========================================================================
  // ENDPOINTS DE SCRAPING REAL & AUDITORIA DE OFERTAS TV / ENCARTES RJ
  // =========================================================================

  // Endpoint de Scraping Verificável em Tempo Real das Ofertas de TV, Encartes, Apps e Redes Sociais do RJ
  app.get('/api/perishables/tv-promos/scrape', async (req, res) => {
    try {
      const forceFresh = req.query.fresh === 'true';
      const data = await perishablesTvPromoScraperService.scrapeTvPromosRealTime(forceFresh);
      res.setHeader('Cache-Control', 'public, max-age=30');
      res.json(data);
    } catch (err: any) {
      console.error('[API /api/perishables/tv-promos/scrape] Erro:', err);
      res.status(500).json({
        error: 'Erro ao executar scraping de ofertas de TV e Encartes RJ',
        message: err?.message || 'Falha de comunicação'
      });
    }
  });

  // Endpoint de Auditoria de Integridade e Detecção de Discrepâncias de Preço
  app.post('/api/perishables/tv-promos/audit', async (req, res) => {
    try {
      const products = req.body?.products;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Array de produtos é obrigatório para auditoria' });
      }
      const report = perishablesTvPromoScraperService.auditProductParity(products);
      res.json(report);
    } catch (err: any) {
      console.error('[API /api/perishables/tv-promos/audit] Erro:', err);
      res.status(500).json({
        error: 'Erro ao executar auditoria de dados de perecíveis',
        message: err?.message || 'Falha de processamento'
      });
    }
  });

  // Endpoint de Harmonização Automática para Restaurar Paridade de 100%
  app.post('/api/perishables/tv-promos/harmonize', async (req, res) => {
    try {
      const products = req.body?.products;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Array de produtos é obrigatório para harmonização' });
      }
      const result = perishablesTvPromoScraperService.harmonizeProducts(products);
      res.json(result);
    } catch (err: any) {
      console.error('[API /api/perishables/tv-promos/harmonize] Erro:', err);
      res.status(500).json({
        error: 'Erro ao harmonizar preços de perecíveis',
        message: err?.message || 'Falha de processamento'
      });
    }
  });

  // Integração com Vite
  if (!isProduction) {
    process.env.DISABLE_HMR = 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GAPP Server] Servidor Full-Stack rodando na porta ${PORT} (dev: ${!isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('[GAPP Server] Falha catastrófica ao inicializar servidor:', err);
  process.exit(1);
});
