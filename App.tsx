
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { analyzePresentation } from './services/geminiService';
import { convertPptxToPdf } from './utils/pptxHelper';
import { AnalysisResult, AppState } from './types';
import ReviewCard from './components/ReviewCard';
import { AlertCircleIcon, SparklesIcon, ThumbsUpIcon, UploadIcon, FileTextIcon, SmartSlideLogo } from './components/Icons';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [loadingText, setLoadingText] = useState<string>('Reviewing your presentation...');
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const progressInterval = useRef<number | null>(null);
  const progressTimeout = useRef<number | null>(null);

  // Helper to simulate progress animation
  const startSimulatedProgress = (start: number, end: number, duration: number) => {
    if (progressInterval.current) window.clearInterval(progressInterval.current);
    
    const stepTime = 50;
    const steps = duration / stepTime;
    const increment = (end - start) / steps;
    
    let current = start;
    progressInterval.current = window.setInterval(() => {
      current += increment;
      if (current >= end) {
        current = end;
        if (progressInterval.current) window.clearInterval(progressInterval.current);
      }
      setProgress(Math.round(current));
    }, stepTime);
  };

  const stopProgress = () => {
    if (progressInterval.current) {
      window.clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    if (progressTimeout.current) {
      window.clearTimeout(progressTimeout.current);
      progressTimeout.current = null;
    }
  };

  const runAnalysisAnimation = (startFrom: number) => {
    // Phase 1: Go to 80% over 30 seconds (Faster start)
    startSimulatedProgress(startFrom, 80, 30000);

    // Phase 2: If still running after 30s, crawl from 80% to 95% over 30 seconds (Slow crawl)
    progressTimeout.current = window.setTimeout(() => {
      startSimulatedProgress(80, 95, 30000);
    }, 30000);
  };

  useEffect(() => {
    return () => stopProgress();
  }, []);

  const processFile = async (file: File) => {
    // Allowed types: PDF and PPTX
    const pdfType = 'application/pdf';
    const pptxTypes = [
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    // Check by mime type or extension
    const isPdf = file.type === pdfType || file.name.toLowerCase().endsWith('.pdf');
    const isPptx = pptxTypes.includes(file.type) || file.name.toLowerCase().endsWith('.pptx');

    if (!isPdf && !isPptx) {
      setErrorMsg('Please upload a PDF or PPTX file.');
      return;
    }

    // Size limit: 100MB
    const maxSizeInBytes = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSizeInBytes) {
      setErrorMsg('File size exceeds the 100MB limit.');
      return;
    }

    setFileName(file.name);
    setAppState(AppState.ANALYZING);
    setErrorMsg('');
    setProgress(0);
    stopProgress(); // Clear any existing timers

    try {
      let base64String = '';
      let finalMimeType = file.type;

      if (isPptx) {
        // Handle PPTX: Convert to PDF first
        setLoadingText('Converting PPTX to PDF format...');
        // Fast start for conversion (0 to 20% in 3 seconds)
        startSimulatedProgress(0, 20, 3000);
        
        try {
          base64String = await convertPptxToPdf(file);
          finalMimeType = 'application/pdf'; 
          
          stopProgress(); // Stop conversion animation
          setProgress(20);
          
          setLoadingText('Reviewing your presentation...');
          
          // Start Analysis Animation (Phase 1 & 2) starting from 20%
          runAnalysisAnimation(20);

        } catch (convError) {
          stopProgress();
          console.error(convError);
          setAppState(AppState.ERROR);
          setErrorMsg(convError instanceof Error ? convError.message : 'Failed to process PPTX file. Try exporting it to PDF manually.');
          return;
        }
      } else {
        // Handle PDF: Read directly
        finalMimeType = 'application/pdf';
        setLoadingText('Reviewing your presentation...');
        
        // Start Analysis Animation (Phase 1 & 2) starting from 0%
        runAnalysisAnimation(0);

        base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // Pass to Gemini
      try {
        const result = await analyzePresentation(base64String, finalMimeType, courseName);
        
        stopProgress();
        // End fast: Jump to 100% immediately when done
        setProgress(100);
        
        // Small delay to show 100%
        setTimeout(() => {
          setAnalysisResult(result);
          setAppState(AppState.SUCCESS);
        }, 500);

      } catch (err: any) {
        stopProgress();
        console.error(err);
        setAppState(AppState.ERROR);
        
        if (err.message && err.message.includes('400')) {
           setErrorMsg('The file format is not supported by the AI. Please ensure it is a valid PDF.');
        } else {
           setErrorMsg('Failed to analyze the presentation. Please try again.');
        }
      }

    } catch (err) {
      stopProgress();
      console.error(err);
      setAppState(AppState.ERROR);
      setErrorMsg('An unexpected error occurred.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [courseName]); // Add dependency on courseName to ensure latest state is used

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setAnalysisResult(null);
    setFileName('');
    setCourseName('');
    setErrorMsg('');
    setProgress(0);
    stopProgress();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={handleReset}>
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-2 shadow-sm group-hover:shadow-md transition-all duration-300">
              <SmartSlideLogo />
              <style>{`.bg-gradient-to-br svg { color: white; width: 24px; height: 24px; }`}</style>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">SmartSlider</h1>
              <span className="text-xs font-medium text-slate-500 mt-1">AI-Powered Technical Presentation Analysis</span>
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            
             {/* Model Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-100 rounded-full">
               <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse"></div>
               <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
                 Gemini 3 Pro
               </span>
            </div>

            {appState === AppState.SUCCESS && (
              <button 
                onClick={handleReset}
                className="text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                Analyze New File
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* IDLE STATE: Landing & Upload */}
        {appState === AppState.IDLE && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
            <div className="text-center max-w-2xl space-y-4">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Elevate your Technical Presentations with AI
              </h2>
              <p className="text-lg text-slate-600">
                Upload your course presentation. We analyze accuracy, suggest actionable enhancements, and highlight your pedagogical strengths.
              </p>
            </div>

            <div className="w-full max-w-lg space-y-6">
              
              {/* Course Name Input - Updated Styling */}
              <div className="w-full">
                <label htmlFor="courseName" className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Subject / Course Name (Optional)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="courseName"
                    value={courseName}
                    onChange={(e) => {
                      setCourseName(e.target.value);
                      if (errorMsg.includes('Course Name')) setErrorMsg('');
                    }}
                    placeholder="e.g. Data Structures, DevOps, Calculus..."
                    className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm hover:border-blue-300"
                  />
                </div>
              </div>

              {/* Upload Box */}
              <div 
                onClick={triggerFileInput}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50 scale-105 shadow-xl' 
                    : 'bg-white border-slate-300 hover:border-blue-500 hover:bg-blue-50/50'
                  }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".pdf,.pptx" 
                  className="hidden" 
                />
                
                <div className="flex flex-col items-center justify-center pt-5 pb-6 space-y-4 pointer-events-none">
                  <div className={`p-4 rounded-full transition-transform duration-300 ${isDragging ? 'bg-blue-200 text-blue-700 scale-110' : 'bg-blue-100 text-blue-600 group-hover:scale-110'}`}>
                    <UploadIcon />
                  </div>
                  <div className="text-center">
                    <p className="mb-1 text-lg font-semibold text-slate-700">
                      {isDragging ? 'Drop your file here' : 'Click or drag to upload slides'}
                    </p>
                    <p className="text-sm text-slate-500">PDF or PPTX (max 100MB)</p>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-center text-sm flex items-center justify-center gap-2">
                   <AlertCircleIcon />
                   {errorMsg}
                </div>
              )}
            </div>
            
            {/* Feature Teasers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-20 px-4">
               {/* Feature 1 */}
               <div className="flex flex-col items-center text-center group">
                 <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-red-100 group-hover:scale-105 transition-transform duration-300">
                   <AlertCircleIcon />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Find Errors</h3>
                 <p className="text-slate-600 text-sm leading-relaxed max-w-[200px]">
                   Spot factual mistakes and logical flaws instantly.
                 </p>
               </div>
               
               {/* Feature 2 */}
               <div className="flex flex-col items-center text-center group">
                 <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-amber-100 group-hover:scale-105 transition-transform duration-300">
                   <SparklesIcon />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Enhance Quality</h3>
                 <p className="text-slate-600 text-sm leading-relaxed max-w-[200px]">
                   Get actionable suggestions to improve clarity.
                 </p>
               </div>
               
               {/* Feature 3 */}
               <div className="flex flex-col items-center text-center group">
                 <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-emerald-100 group-hover:scale-105 transition-transform duration-300">
                   <ThumbsUpIcon />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Know Your Strengths</h3>
                 <p className="text-slate-600 text-sm leading-relaxed max-w-[200px]">
                   See what you are doing right to keep doing it.
                 </p>
               </div>
            </div>
          </div>
        )}

        {/* ANALYZING STATE: Loading */}
        {appState === AppState.ANALYZING && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
             <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-white p-6 rounded-full shadow-xl border border-blue-50">
                   <FileTextIcon />
                </div>
             </div>
             <div className="text-center space-y-2 max-w-md w-full">
               <h3 className="text-2xl font-bold text-slate-900">{loadingText}</h3>
               <p className="text-slate-500 truncate px-4">{fileName}</p>
               
               {/* Percentage Bar */}
               <div className="w-full mt-8 px-8">
                 <div className="flex justify-between text-sm font-semibold text-slate-600 mb-2">
                   <span>Analyzing...</span>
                   <span>{progress}%</span>
                 </div>
                 <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                   <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300 ease-out relative"
                    style={{ width: `${progress}%` }}
                   >
                     <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_infinite]"></div>
                   </div>
                 </div>
               </div>

               <p className="text-xs text-slate-400 pt-4">Powered by Gemini 3 Pro</p>
             </div>
          </div>
        )}

        {/* SUCCESS STATE: Results */}
        {appState === AppState.SUCCESS && analysisResult && (
          <div className="space-y-8 animate-slide-up">
            <div className="text-center mb-12">
               <h2 className="text-3xl font-bold text-slate-900">Analysis Results</h2>
               <p className="text-slate-500 mt-2">
                 Findings for <strong>{fileName}</strong> in <strong>{courseName.trim() ? courseName : 'General Technical Topic'}</strong>
               </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              
              {/* Card 1: Technical Correctness */}
              <ReviewCard 
                title="Find Errors" 
                description="Factual mistakes and logical flaws."
                icon={<AlertCircleIcon />}
                colorTheme="red"
                items={analysisResult.technicalCorrectness.map(item => ({
                  title: item.issue,
                  description: item.explanation,
                  badge: item.slideNumber
                }))}
              />

              {/* Card 2: Improvements */}
              <ReviewCard 
                title="Enhance Quality" 
                description="Actionable suggestions for clarity."
                icon={<SparklesIcon />}
                colorTheme="yellow"
                items={analysisResult.areasForImprovement.map(item => ({
                  title: item.suggestion,
                  description: item.details
                }))}
              />

              {/* Card 3: Strengths */}
              <ReviewCard 
                title="Know Your Strengths" 
                description="What you are doing right."
                icon={<ThumbsUpIcon />}
                colorTheme="green"
                items={analysisResult.strengths.map(item => ({
                  title: item.point,
                  description: item.details
                }))}
              />

            </div>
          </div>
        )}
        
        {/* ERROR STATE */}
         {appState === AppState.ERROR && (
           <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
             <div className="bg-red-50 p-6 rounded-full text-red-500">
                <AlertCircleIcon />
             </div>
             <div className="text-center">
               <h3 className="text-xl font-bold text-slate-900">Something went wrong</h3>
               <p className="text-slate-600 mt-2">{errorMsg}</p>
             </div>
             <button 
                onClick={handleReset}
                className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
             >
                Try Again
             </button>
           </div>
         )}
      </main>
    </div>
  );
};

export default App;
