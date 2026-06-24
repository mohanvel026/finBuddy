// client/src/hooks/useMarketData.js
import { useState, useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';
import api from '../services/api';

const useMarketData = (symbols = []) => {
  const [prices, setPrices] = useState({});
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    loadTrending();
    const socket = getSocket();
    if (socket) {
      socket.emit('market:subscribe', { symbols });
      socket.on('market:price-update', (priceData) => {
        const priceMap = {};
        priceData.forEach(p => { priceMap[p.symbol] = p; });
        setPrices(prev => ({ ...prev, ...priceMap }));
        setTrending(priceData);
      });
      socketRef.current = socket;
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off('market:price-update');
        socketRef.current.emit('market:unsubscribe');
      }
    };
  }, []);

  const loadTrending = async () => {
    try {
      const { data } = await api.get('/market/trending');
      setTrending(data.stocks || []);
      const map = {};
      (data.stocks || []).forEach(s => { map[s.symbol] = s; });
      setPrices(map);
    } catch (e) { }
    setLoading(false);
  };

  const getPrice = (symbol) => prices[symbol]?.price || null;
  const isUp = (symbol) => prices[symbol]?.isUp !== false;

  return { prices, trending, loading, getPrice, isUp };
};

export default useMarketData;