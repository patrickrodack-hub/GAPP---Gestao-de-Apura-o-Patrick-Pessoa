export default function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.status(200).json({
    status: 'ok',
    service: 'GAPP Apuração do Boi API',
    timestamp: new Date().toISOString(),
  });
}
