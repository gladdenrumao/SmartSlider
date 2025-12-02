import React from 'react';
import { ServerIcon, CpuIcon, SmartSlideLogo, FileTextIcon } from './Icons';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Architecture & How it Works</h2>
            <p className="text-slate-500 text-sm">Comparison: Native Multimodal vs. Sandbox Execution</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-12">
          
          {/* Diagram Section */}
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
              Current Architecture (SmartSlide Reviewer)
            </h3>
            
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 overflow-x-auto">
              <div className="flex items-center justify-center min-w-[600px] gap-8">
                
                {/* Client Node */}
                <div className="flex flex-col items-center">
                  <div className="w-40 p-4 bg-white rounded-xl shadow-sm border border-slate-200 text-center relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">BROWSER</div>
                    <SmartSlideLogo />
                    <p className="font-bold text-slate-800 mt-2">React App</p>
                    <p className="text-xs text-slate-500">FileReader API</p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono text-slate-400">HTTPS / JSON</span>
                  <div className="h-[2px] w-full bg-slate-300 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-slate-300 rotate-45"></div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">PDF Base64</span>
                </div>

                {/* AI Node */}
                <div className="flex flex-col items-center">
                  <div className="w-40 p-4 bg-white rounded-xl shadow-sm border border-purple-200 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-50"></div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">GOOGLE CLOUD</div>
                    <div className="relative z-10 flex justify-center mb-2 text-purple-600">
                      <CpuIcon className="w-8 h-8" />
                    </div>
                    <p className="relative z-10 font-bold text-slate-800">Gemini 3 Pro</p>
                    <p className="relative z-10 text-xs text-slate-500">Native Multimodal</p>
                  </div>
                </div>

              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 italic text-center">
              The presentation is treated as a visual token. No Python script is generated or executed. The model "sees" the slides.
            </p>
          </section>

          {/* Comparison Section */}
          <section>
             <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">2</span>
              Comparison: Native Multimodal vs. MCP Sandbox
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              {/* This App */}
              <div className="border border-blue-100 bg-blue-50/30 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <SmartSlideLogo />
                  </div>
                  <h4 className="font-bold text-slate-900">This App (Gemini Native)</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-slate-700">
                    <div className="mt-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span></div>
                    <span><strong>Visual Context:</strong> The model sees layout, fonts, and diagrams. Excellent for presentations.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                     <div className="mt-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span></div>
                    <span><strong>No Code Execution:</strong> Faster, safer, and less complex. Pure inference.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                     <div className="mt-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 block"></span></div>
                    <span><strong>Architecture:</strong> Client-side only. No heavy backend or sandbox required.</span>
                  </li>
                </ul>
              </div>

              {/* MCP / Sandbox */}
              <div className="border border-slate-200 bg-white rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                    <ServerIcon className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-900">Claude Desktop + MCP</h4>
                </div>
                <ul className="space-y-3">
                  <li className="flex gap-3 text-sm text-slate-700">
                     <div className="mt-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 block"></span></div>
                    <span><strong>Text Extraction:</strong> Often writes Python (e.g., <code>pypdf</code>) to extract raw text. Loses visual layout.</span>
                  </li>
                  <li className="flex gap-3 text-sm text-slate-700">
                     <div className="mt-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 block"></span></div>
                    <span><strong>Code Execution:</strong> Requires a sandbox (Docker/VM) to run the generated code safely. Slower latency.</span>
                  </li>
                   <li className="flex gap-3 text-sm text-slate-700">
                     <div className="mt-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 block"></span></div>
                    <span><strong>Use Case:</strong> Better for precise data analysis (e.g., CSVs, Math) where code verification is needed.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-3xl">
          <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureModal;