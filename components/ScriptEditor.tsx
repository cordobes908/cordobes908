import React, { useState, useRef, useEffect } from 'react';
import { Plus, Play, Download, Trash2, UserPlus, Music, Save, AlertCircle, GripVertical } from 'lucide-react';
import { Character, ScriptLine, AVAILABLE_VOICES, AVAILABLE_ACCENTS } from '../types';
import Button from './Button';
import { generatePodcastAudio, decodeAudioData } from '../services/geminiService';

const ScriptEditor: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([
    { id: '1', name: 'Narrador', voiceName: 'Kore', color: 'bg-blue-500', accent: 'neutral', speed: 1.0 },
    { id: '2', name: 'Entrevistador', voiceName: 'Puck', color: 'bg-green-500', accent: 'mexican', speed: 1.1 }
  ]);
  
  const [lines, setLines] = useState<ScriptLine[]>([
    { id: '1', characterId: '1', text: 'Bienvenidos a un nuevo episodio de Futuro Digital.' },
    { id: '2', characterId: '2', text: 'Gracias por invitarme, es un placer estar aquí.' }
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const addLineAtEnd = () => {
    const newId = Date.now().toString();
    setLines([...lines, { id: newId, characterId: characters[0].id, text: '' }]);
  };

  const insertLineAfter = (index: number) => {
     const newId = Date.now().toString();
     const newLine = { id: newId, characterId: characters[0].id, text: '' };
     const newLines = [...lines];
     newLines.splice(index + 1, 0, newLine);
     setLines(newLines);
  };

  const removeLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const updateLine = (id: string, field: keyof ScriptLine, value: string) => {
    setLines(lines.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const addCharacter = () => {
    const newId = Date.now().toString();
    const newChar: Character = {
      id: newId,
      name: `Personaje ${characters.length + 1}`,
      voiceName: AVAILABLE_VOICES[characters.length % AVAILABLE_VOICES.length].name,
      color: 'bg-indigo-500',
      accent: 'neutral',
      speed: 1.0
    };
    setCharacters([...characters, newChar]);
  };

  const updateCharacter = (idx: number, field: keyof Character, value: any) => {
      const newChars = [...characters];
      (newChars[idx] as any)[field] = value;
      setCharacters(newChars);
  };

  const handleGenerateAudio = async () => {
    setIsGenerating(true);
    audioBufferRef.current = null;
    if (isPlaying && audioSourceRef.current) {
        audioSourceRef.current.stop();
        setIsPlaying(false);
    }
    
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
    if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
    }

    try {
      const base64Audio = await generatePodcastAudio(lines, characters);
      const buffer = await decodeAudioData(base64Audio, audioContextRef.current);
      audioBufferRef.current = buffer;
      setIsGenerating(false);
    } catch (error: any) {
      console.error(error);
      alert(`Hubo un error generando el audio: ${error.message}`);
      setIsGenerating(false);
    }
  };

  const playAudio = () => {
    if (!audioBufferRef.current || !audioContextRef.current) return;

    if (isPlaying) {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        setIsPlaying(false);
      }
    } else {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.start();
      audioSourceRef.current = source;
      setIsPlaying(true);
      source.onended = () => setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)]">
      {/* Sidebar - Character Management */}
      <div className="w-full lg:w-96 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Personajes</h2>
          <button onClick={addCharacter} className="p-1 hover:bg-gray-700 rounded-full text-indigo-400">
            <UserPlus size={20} />
          </button>
        </div>
        
        <div className="space-y-6">
          {characters.map((char, idx) => (
            <div key={char.id} className="bg-gray-750 p-4 rounded-xl border border-gray-700 shadow-sm">
              <div className="mb-3">
                  <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">Nombre</label>
                  <input 
                    value={char.name}
                    onChange={(e) => updateCharacter(idx, 'name', e.target.value)}
                    className="bg-gray-900 text-white font-medium rounded p-2 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-gray-600"
                  />
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                 <div>
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">Voz</label>
                    <select 
                        value={char.voiceName}
                        onChange={(e) => updateCharacter(idx, 'voiceName', e.target.value)}
                        className="w-full bg-gray-900 text-xs text-gray-300 rounded p-2 border border-gray-600 focus:border-indigo-500 outline-none"
                    >
                        {AVAILABLE_VOICES.map(v => (
                        <option key={v.name} value={v.name}>{v.label}</option>
                        ))}
                    </select>
                 </div>
                 <div>
                    <label className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1 block">Acento</label>
                    <select 
                        value={char.accent}
                        onChange={(e) => updateCharacter(idx, 'accent', e.target.value)}
                        className="w-full bg-gray-900 text-xs text-gray-300 rounded p-2 border border-gray-600 focus:border-indigo-500 outline-none"
                    >
                        {AVAILABLE_ACCENTS.map(a => (
                        <option key={a.id} value={a.id}>{a.label}</option>
                        ))}
                    </select>
                 </div>
              </div>

              <div>
                  <div className="flex justify-between items-center mb-1">
                     <label className="text-xs text-gray-500 uppercase font-bold tracking-wider">Velocidad</label>
                     <span className="text-xs text-indigo-400 font-mono">{char.speed.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="1.5" 
                    step="0.1"
                    value={char.speed}
                    onChange={(e) => updateCharacter(idx, 'speed', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>Lento</span>
                      <span>Rápido</span>
                  </div>
              </div>
            </div>
          ))}
        </div>
        
        {characters.length > 2 && (
             <div className="mt-6 p-3 bg-yellow-900/20 border border-yellow-800 rounded text-xs text-yellow-500 flex items-start">
                 <AlertCircle size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                 <span>Se usarán 2 voces alternadas.</span>
             </div>
        )}
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col bg-gray-900">
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-3xl mx-auto space-y-2">
            <div className="border-b border-gray-800 pb-4 mb-8">
               <input 
                 type="text" 
                 placeholder="Título del Episodio" 
                 className="text-3xl font-bold bg-transparent text-white placeholder-gray-600 focus:outline-none w-full"
                 defaultValue="Nuevo Episodio Sin Título"
               />
            </div>

            {lines.map((line, index) => (
              <div key={line.id} className="relative group/line transition-all">
                  <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-800/30">
                    {/* Handle */}
                    <div className="pt-3 text-gray-700 cursor-move opacity-0 group-hover/line:opacity-100">
                        <GripVertical size={16} />
                    </div>

                    <div className="w-28 flex-shrink-0 pt-1">
                    <select
                        value={line.characterId}
                        onChange={(e) => updateLine(line.id, 'characterId', e.target.value)}
                        className="w-full bg-gray-800 text-indigo-300 text-xs font-bold rounded px-2 py-1.5 border border-gray-700 outline-none cursor-pointer hover:border-indigo-500/50 transition-colors"
                    >
                        {characters.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    </div>
                    
                    <div className="flex-1 relative">
                    <textarea
                        value={line.text}
                        onChange={(e) => updateLine(line.id, 'text', e.target.value)}
                        placeholder="Escribe el diálogo aquí..."
                        className="w-full bg-transparent text-gray-100 p-1.5 text-lg leading-relaxed focus:outline-none focus:bg-gray-800/50 rounded resize-none overflow-hidden"
                        rows={Math.max(1, Math.ceil(line.text.length / 70))}
                    />
                    <button 
                        onClick={() => removeLine(line.id)}
                        className="absolute -right-8 top-1 text-gray-600 hover:text-red-500 opacity-0 group-hover/line:opacity-100 transition-opacity p-1"
                        title="Eliminar línea"
                    >
                        <Trash2 size={16} />
                    </button>
                    </div>
                  </div>

                  {/* Insert Button (Contextual) */}
                  <div className="h-4 -my-2 flex items-center justify-center opacity-0 group-hover/line:opacity-100 transition-opacity z-10 relative">
                       <button 
                         onClick={() => insertLineAfter(index)}
                         className="bg-indigo-600 text-white rounded-full p-0.5 shadow-lg transform scale-0 group-hover/line:scale-100 transition-transform hover:bg-indigo-500 hover:scale-125"
                         title="Insertar diálogo aquí"
                       >
                           <Plus size={14} />
                       </button>
                  </div>
              </div>
            ))}

            <button 
              onClick={addLineAtEnd}
              className="w-full py-6 mt-8 border-2 border-dashed border-gray-700 rounded-lg text-gray-500 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus size={20} />
              <span>Añadir línea al final</span>
            </button>
            <div className="h-20"></div> {/* Spacer */}
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center space-x-4">
               <div className="text-gray-400 text-sm">
                 {lines.length} bloques • Est. {Math.ceil(lines.length * 4)}s duración
               </div>
             </div>
             <div className="flex items-center space-x-3 w-full sm:w-auto">
               <Button variant="secondary" onClick={() => {}} className="flex-1 sm:flex-none">
                  <Save size={18} className="mr-2"/> Guardar
               </Button>
               <Button 
                  onClick={handleGenerateAudio} 
                  isLoading={isGenerating}
                  disabled={lines.length === 0}
                  className="flex-1 sm:flex-none"
               >
                 <Music size={18} className="mr-2"/> 
                 Generar
               </Button>
               {audioBufferRef.current && (
                 <Button variant="secondary" onClick={playAudio} className={`flex-1 sm:flex-none ${isPlaying ? 'bg-indigo-900 border-indigo-500' : ''}`}>
                    {isPlaying ? 'Detener' : <><Play size={18} className="mr-2" /> Escuchar</>}
                 </Button>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptEditor;