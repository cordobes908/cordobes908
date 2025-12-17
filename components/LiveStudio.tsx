import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { getGeminiClient, createPCMBlob, decodeAudioData } from '../services/geminiService';
import { LiveServerMessage, Modality } from '@google/genai';
import Button from './Button';

const LiveStudio: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputStreamRef = useRef<MediaStream | null>(null);
  const inputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Audio playback queue
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const addLog = (msg: string) => setLogs(prev => [...prev.slice(-4), msg]);

  const stopSession = () => {
     // Cleanup audio context and streams
     if (inputStreamRef.current) {
         inputStreamRef.current.getTracks().forEach(track => track.stop());
         inputStreamRef.current = null;
     }
     if (inputProcessorRef.current) {
         inputProcessorRef.current.disconnect();
         inputProcessorRef.current = null;
     }
     if (audioContextRef.current) {
         audioContextRef.current.close();
         audioContextRef.current = null;
     }
     setIsConnected(false);
     addLog("Sesión finalizada.");
  };

  const startSession = async () => {
    try {
      addLog("Iniciando sesión en vivo...");
      const ai = getGeminiClient();
      
      // Init Audio Contexts
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      audioContextRef.current = audioCtx;
      
      // Input Stream (Mic) - we need 16kHz for input usually, but browser resampling handles it or we manually downsample
      // The ScriptProcessor approach allows manual blob creation.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isVideoOn });
      inputStreamRef.current = stream;

      if (videoRef.current && isVideoOn) {
        videoRef.current.srcObject = stream;
      }

      // Gemini Live Connection
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            addLog("Conectado a Gemini Live.");
            setIsConnected(true);
            
            // Setup Audio Input Processing
            const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
               if (isMuted) return;
               const inputData = e.inputBuffer.getChannelData(0);
               const pcmBlob = createPCMBlob(inputData);
               
               sessionPromise.then(session => {
                   session.sendRealtimeInput({ media: pcmBlob });
               });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            inputProcessorRef.current = scriptProcessor;
          },
          onmessage: async (msg: LiveServerMessage) => {
             // Handle Audio Output
             const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData) {
                 const ctx = audioContextRef.current;
                 if (!ctx) return;
                 
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                 
                 const buffer = await decodeAudioData(audioData, ctx);
                 const source = ctx.createBufferSource();
                 source.buffer = buffer;
                 source.connect(ctx.destination);
                 
                 source.addEventListener('ended', () => {
                     audioSourcesRef.current.delete(source);
                 });
                 
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += buffer.duration;
                 audioSourcesRef.current.add(source);
             }
             
             // Handle Interruption
             if (msg.serverContent?.interrupted) {
                 addLog("Interrupción detectada.");
                 audioSourcesRef.current.forEach(s => s.stop());
                 audioSourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
             }
          },
          onclose: () => {
              addLog("Conexión cerrada.");
              stopSession();
          },
          onerror: (e) => {
              console.error(e);
              addLog("Error en la conexión.");
              stopSession();
          }
        },
        config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: "Eres un co-anfitrión de podcast creativo y entusiasta. Ayuda al usuario a hacer una lluvia de ideas para su próximo episodio.",
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
            }
        }
      });
      
    } catch (err) {
      console.error(err);
      addLog("Error iniciando sesión: " + String(err));
      setIsConnected(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-black p-4 md:p-8">
       <div className="flex-1 relative rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 flex items-center justify-center">
          
          {/* Visualization / Video Area */}
          {isVideoOn ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          ) : (
              <div className="text-center space-y-6">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto transition-all duration-500 ${isConnected ? 'bg-indigo-500/20 animate-pulse' : 'bg-gray-800'}`}>
                      <Mic size={48} className={isConnected ? 'text-indigo-400' : 'text-gray-600'} />
                  </div>
                  <h3 className="text-2xl font-light text-gray-300">
                      {isConnected ? "Escuchando..." : "Estudio en Vivo Desconectado"}
                  </h3>
              </div>
          )}
          
          {/* Overlay Logs */}
          <div className="absolute top-4 left-4 right-4 pointer-events-none">
             {logs.map((log, i) => (
                 <div key={i} className="text-xs text-green-400 font-mono bg-black/50 inline-block px-2 py-1 rounded mb-1 mr-2 backdrop-blur-sm">
                     {log}
                 </div>
             ))}
          </div>
       </div>

       {/* Controls */}
       <div className="mt-6 flex justify-center items-center space-x-6">
           <button 
             onClick={() => setIsMuted(!isMuted)}
             className={`p-4 rounded-full ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-white'} hover:bg-gray-700 transition-colors`}
             disabled={!isConnected}
           >
               {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
           </button>
           
           {!isConnected ? (
                <Button onClick={startSession} className="px-8 py-4 text-lg rounded-full bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20">
                    Iniciar Sesión en Vivo
                </Button>
           ) : (
                <Button onClick={stopSession} variant="danger" className="px-8 py-4 text-lg rounded-full">
                    Terminar Sesión
                </Button>
           )}

           <button 
             onClick={() => setIsVideoOn(!isVideoOn)}
             className={`p-4 rounded-full ${!isVideoOn ? 'bg-gray-800 text-gray-400' : 'bg-gray-700 text-white'} hover:bg-gray-700 transition-colors`}
             // Video toggle is just UI state for this demo unless we implement video streaming frames logic
           >
               {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
           </button>
       </div>
    </div>
  );
};

export default LiveStudio;