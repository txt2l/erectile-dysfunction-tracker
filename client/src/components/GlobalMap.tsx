import React, { useEffect, useState, useRef } from 'react';
import { socket } from '../lib/socket';
import { trpc } from '../lib/trpc';

interface MapLink {
  from: string;
  to: string;
  timestamp: number;
}

export const GlobalMap: React.FC = () => {
  const [links, setLinks] = useState<MapLink[]>([]);
  const { data: users } = trpc.team.list.useQuery();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const handleMapLink = (link: MapLink) => {
      setLinks(prev => [...prev, link].slice(-10)); // Keep last 10 links
    };

    socket.on('map:link', handleMapLink);
    return () => {
      socket.off('map:link', handleMapLink);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple isometric projection or world map rendering logic
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background (placeholder for isometric map)
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw users as dots with country flags
      users?.forEach(user => {
        if (user.location) {
          // Map location to canvas coordinates (simplified)
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = '#fff';
          ctx.fillText(user.name || 'User', x + 8, y + 4);
        }
      });

      // Draw real-time conversation lines
      links.forEach(link => {
        // Draw line between from and to users
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      });

      requestAnimationFrame(render);
    };

    render();
  }, [users, links]);

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={600} 
        className="w-full h-full object-contain"
      />
      <div className="absolute top-4 left-4 text-white font-bold text-xl">
        Global Member Map
      </div>
    </div>
  );
};
