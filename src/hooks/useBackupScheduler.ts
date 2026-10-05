import { useEffect, useRef } from 'react';
import { CloudBackupService } from '../services/cloudBackupService';
import { CloudBackupItem } from '../types/erp';

export function useBackupScheduler(options?: {
  onBackupCompleted?: (backup: CloudBackupItem) => void;
  showToast?: (message: string) => void;
}) {
  const isRunningRef = useRef(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Sincroniza agendamento do Firestore ao iniciar
    CloudBackupService.syncScheduleFromCloud().catch(() => {});

    // Verifica agendamento imediatamente e a cada 60 segundos
    const checkSchedule = async () => {
      if (isRunningRef.current) return;

      const config = CloudBackupService.getScheduleConfig();
      if (!config.enabled) return;

      const now = Date.now();
      let isDue = false;

      // Se temos o próximo agendamento calculado e a hora já passou
      if (config.nextScheduledTimestamp && now >= config.nextScheduledTimestamp) {
        isDue = true;
      } else if (!config.nextScheduledTimestamp) {
        // Inicializa próximo agendamento
        const nextTime = CloudBackupService.calculateNextScheduledBackup(config);
        if (nextTime) {
          await CloudBackupService.saveScheduleConfig({
            ...config,
            nextScheduledTimestamp: nextTime
          });
        }
      }

      if (isDue) {
        try {
          isRunningRef.current = true;
          const backup = await CloudBackupService.createOnlineBackup({
            triggerType: 'AUTOMATICO_AGENDADO',
            title: `Backup Automático Programado (${config.periodicity})`,
            author: 'Agendador do Sistema GAPP'
          });

          if (config.autoNotify && optionsRef.current?.showToast) {
            optionsRef.current.showToast(`Backup Online Automático realizado com sucesso! (${backup.recordsCount} registros salvos no Firestore)`);
          }

          if (optionsRef.current?.onBackupCompleted) {
            optionsRef.current.onBackupCompleted(backup);
          }
        } catch (e) {
          console.warn('Falha na execução do backup automático agendado:', e);
        } finally {
          isRunningRef.current = false;
        }
      }
    };

    // Executa a primeira checagem após 5 segundos da montagem
    const initialTimer = setTimeout(checkSchedule, 5000);
    // Intervalo de verificação a cada 60 segundos
    const interval = setInterval(checkSchedule, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);
}
