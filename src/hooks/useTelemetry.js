import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useTelemetry = () => {
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTelemetry = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('telemetry').select('*');
      if (error) throw error;
      setTelemetry(data || []);
    } catch (err) {
      console.error('Error fetching telemetry:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  // Simulated real-time fluctuation
  useEffect(() => {
    if (telemetry.length === 0) return;

    const intervalId = setInterval(() => {
      setTelemetry((prev) => 
        prev.map((item) => {
          // Fluctuate value slightly
          const fluctuation = (Math.random() - 0.5) * 2; // -1 to +1
          let newValue = item.value + fluctuation;
          
          // Keep battery voltage in tight range
          if (item.unit === 'V') {
             const vFluctuation = (Math.random() - 0.5) * 0.05;
             newValue = item.value + vFluctuation;
             // Bound check
             if (newValue < 3.0) newValue = 3.0;
             if (newValue > 3.7) newValue = 3.7;
          } else if (item.unit === '°C') {
             if (newValue < 35) newValue = 35;
             if (newValue > 100) newValue = 100;
          } else if (item.unit === '%') {
             if (newValue < 0) newValue = 0;
             if (newValue > 100) newValue = 100;
          }

          return { ...item, value: newValue };
        })
      );
    }, 4000); // 4 seconds

    return () => clearInterval(intervalId);
  }, [telemetry.length]); // Start interval once data is loaded

  return { telemetry, loading };
};
