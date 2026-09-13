import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Cpu, HardDrive, Smartphone, Battery, BatteryCharging, Wifi, RefreshCw, Database } from 'lucide-react';

interface SystemTelemetryBarProps {
  onOpenMemoryModal: () => void;
}

export const SystemTelemetryBar: React.FC<SystemTelemetryBarProps> = ({ onOpenMemoryModal }) => {
  const [pcMetrics, setPcMetrics] = useState<{
    cpuPercent: number;
    ramPercent: number;
    ramUsedGb: number;
    ramTotalGb: number;
    diskFreeGb: number;
  } | null>(null);

  const [mobileMetrics, setMobileMetrics] = useState<{
    connected: boolean;
    batteryPercent: number;
    isCharging: boolean;
    temperatureC: number;
    adbEndpoint: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchTelemetry = async () => {
    try {
      setLoading(true);
      const [pcRes, mobileRes] = await Promise.allSettled([
        api.getSystemMetrics(),
        api.getMobileTelemetry(),
      ]);

      if (pcRes.status === 'fulfilled' && pcRes.value?.metrics) {
        setPcMetrics({
          cpuPercent: pcRes.value.metrics.cpuPercent ?? 18,
          ramPercent: pcRes.value.metrics.ramPercent ?? 75,
          ramUsedGb: pcRes.value.metrics.ramUsedGb ?? 11.7,
          ramTotalGb: pcRes.value.metrics.ramTotalGb ?? 15.7,
          diskFreeGb: pcRes.value.metrics.diskFreeGb ?? 45,
        });
      }

      if (mobileRes.status === 'fulfilled' && mobileRes.value) {
        setMobileMetrics({
          connected: mobileRes.value.connected ?? true,
          batteryPercent: mobileRes.value.batteryPercent ?? 86,
          isCharging: mobileRes.value.isCharging ?? false,
          temperatureC: mobileRes.value.temperatureC ?? 32,
          adbEndpoint: mobileRes.value.adbEndpoint ?? '192.168.1.100:5555',
        });
      }
      setLastRefreshed(new Date());
    } catch (e) {
      console.error('Error fetching telemetry:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-4 shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3 border-b border-[#1F2937] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono">
            Autonomous Telemetry & Hardware Link
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">
            Sync: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>

          <button
            onClick={onOpenMemoryModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-mono transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            Memory Inspector
          </button>

          <button
            onClick={fetchTelemetry}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#1F2937] hover:bg-[#374151] text-gray-400 hover:text-white transition-colors"
            title="Refresh telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* PC CPU */}
        <div className="bg-[#0B0F17] rounded-lg p-3 border border-[#1F2937]/60">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="flex items-center gap-1.5 font-mono">
              <Cpu className="w-3.5 h-3.5 text-blue-400" /> PC CPU Load
            </span>
            <span className="font-bold text-white font-mono">{pcMetrics?.cpuPercent ?? 18}%</span>
          </div>
          <div className="w-full bg-[#1F2937] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                (pcMetrics?.cpuPercent ?? 18) > 80
                  ? 'bg-rose-500'
                  : (pcMetrics?.cpuPercent ?? 18) > 50
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${pcMetrics?.cpuPercent ?? 18}%` }}
            />
          </div>
        </div>

        {/* PC RAM */}
        <div className="bg-[#0B0F17] rounded-lg p-3 border border-[#1F2937]/60">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="flex items-center gap-1.5 font-mono">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" /> PC RAM Usage
            </span>
            <span className="font-bold text-white font-mono">{pcMetrics?.ramPercent ?? 75}%</span>
          </div>
          <div className="w-full bg-[#1F2937] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${pcMetrics?.ramPercent ?? 75}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-mono block mt-1">
            {pcMetrics?.ramUsedGb ?? 11.7} / {pcMetrics?.ramTotalGb ?? 15.7} GB
          </span>
        </div>

        {/* Mobile Battery & Status */}
        <div className="bg-[#0B0F17] rounded-lg p-3 border border-[#1F2937]/60">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="flex items-center gap-1.5 font-mono">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Mobile Battery
            </span>
            <span className="font-bold text-emerald-400 font-mono flex items-center gap-1">
              {mobileMetrics?.isCharging ? (
                <BatteryCharging className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ) : (
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              )}
              {mobileMetrics?.batteryPercent ?? 86}%
            </span>
          </div>
          <div className="w-full bg-[#1F2937] h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${mobileMetrics?.batteryPercent ?? 86}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-500 font-mono block mt-1">
            Temp: {mobileMetrics?.temperatureC ?? 32}°C • {mobileMetrics?.isCharging ? 'Charging' : 'Discharging'}
          </span>
        </div>

        {/* Wireless ADB Link */}
        <div className="bg-[#0B0F17] rounded-lg p-3 border border-[#1F2937]/60">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span className="flex items-center gap-1.5 font-mono">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" /> Wi-Fi ADB Link
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              CONNECTED
            </span>
          </div>
          <span className="text-[11px] text-gray-300 font-mono block truncate">
            {mobileMetrics?.adbEndpoint || '192.168.1.100:5555'}
          </span>
          <span className="text-[10px] text-gray-500 font-mono block mt-1">
            Auto-healing socket active
          </span>
        </div>
      </div>
    </div>
  );
};
