import React from 'react';
import { Play, Calendar, Clock, MoreVertical } from 'lucide-react';
import { Episode } from '../types';

const MOCK_EPISODES: Episode[] = [
  {
    id: '1',
    title: 'La Revolución de la IA Generativa',
    description: 'Un análisis profundo sobre cómo los modelos LLM están cambiando el mundo creativo.',
    coverImage: 'https://picsum.photos/400/400',
    duration: '24:15',
    createdAt: 'Hace 2 días',
    status: 'published'
  },
  {
    id: '2',
    title: 'Historia del Internet: Web 1.0',
    description: 'Volvemos a los años 90 para entender los orígenes de la red de redes.',
    coverImage: 'https://picsum.photos/401/401',
    duration: '18:30',
    createdAt: 'Hace 5 días',
    status: 'draft'
  }
];

const Dashboard: React.FC = () => {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Hola, Creador</h1>
          <p className="text-gray-400">Aquí tienes un resumen de tus últimos episodios.</p>
        </div>
        <button className="bg-white text-gray-900 px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
          Nuevo Podcast
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_EPISODES.map(episode => (
          <div key={episode.id} className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all group">
            <div className="relative aspect-video overflow-hidden">
               <img src={episode.coverImage} alt={episode.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-110 transition-transform">
                     <Play fill="currentColor" size={20} className="ml-1" />
                  </button>
               </div>
               <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-mono">
                 {episode.duration}
               </span>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="text-lg font-bold text-white line-clamp-1">{episode.title}</h3>
                 <button className="text-gray-500 hover:text-white"><MoreVertical size={16}/></button>
              </div>
              <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                {episode.description}
              </p>
              <div className="flex items-center text-xs text-gray-500 space-x-4">
                 <div className="flex items-center">
                    <Calendar size={12} className="mr-1" /> {episode.createdAt}
                 </div>
                 <div className={`px-2 py-0.5 rounded-full border ${episode.status === 'published' ? 'border-green-800 text-green-400 bg-green-900/20' : 'border-yellow-800 text-yellow-400 bg-yellow-900/20'}`}>
                    {episode.status === 'published' ? 'Publicado' : 'Borrador'}
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;