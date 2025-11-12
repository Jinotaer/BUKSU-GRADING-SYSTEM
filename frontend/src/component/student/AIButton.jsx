import React, { useState } from "react";
import { IconX, IconBrain, IconSparkles, IconMinimize } from "@tabler/icons-react";
import buksuLogo from "../../assets/logo1.png";
import AIHelper from "./AIHelper";

export default function AIButton() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  return (
    <>
      {/* Enhanced Floating Button */}
      <button
        aria-label="Open BukSU AI Assistant"
        onClick={() => setOpen((s) => !s)}
        className={`fixed z-[3000] right-6 bottom-6 w-16 h-16 rounded-full bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-700 hover:to-blue-800 text-white flex items-center justify-center shadow-2xl ring-2 ring-blue-400/30 hover:ring-blue-500/50 transition-all duration-300 transform hover:scale-105 active:scale-95`}
        title="BukSU AI Assistant - Get help with your academic questions"
      >
        {/* Animated gradient background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 animate-pulse opacity-20"></div>
        
        {/* Brain/AI Icon */}
        <div className="relative z-10 flex items-center justify-center">
          {/* BukSU logo (fallback: brain icon) */}
          {buksuLogo ? (
            <img src={buksuLogo} alt="BukSU logo" className="w-9 h-9 object-contain" />
          ) : (
            <IconBrain className="w-7 h-7" stroke={1.5} />
          )}

          {/* Sparkle effect */}
          <IconSparkles className="absolute -top-1 -right-1 w-4 h-4 animate-bounce opacity-80" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Notification indicator (optional - can be enabled based on new features) */}
        {/* <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        </div> */}
      </button>

      {/* Compact Chat Interface */}
      {open && (
        <div className={`fixed z-[2999] right-6 transition-all duration-300 ${
          minimized ? 'bottom-24 w-72 h-10' : 'bottom-24 w-80 h-[520px]'
        }`}>
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200/50 backdrop-blur-sm h-full">
            {/* Compact Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-700 to-blue-800 text-white">
              <div className="flex items-center gap-2">
                {/* AI Avatar */}
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                   <img src={buksuLogo} alt="BukSU logo" className="w-5 h-5 object-contain" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-white animate-pulse"></div>
                </div>
                
                <div className="leading-tight">
                  <div className="text-sm font-semibold">BukSU AI Assistant</div>
                  <div className="text-xs opacity-90">Academic Support</div>
                </div>
              </div>
              
              <div className="flex items-center gap-0.5">
                <button 
                  onClick={() => setMinimized(!minimized)}
                  className="p-1.5 rounded hover:bg-white/20 transition-colors"
                  title={minimized ? "Expand chat" : "Minimize chat"}
                >
                  <IconMinimize className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded hover:bg-white/20 transition-colors"
                  title="Close chat"
                >
                  <IconX className="w-3.5 h-3.5" stroke={2} />
                </button>
              </div>
            </div>

            {/* Chat Content - Only show when not minimized */}
            {!minimized && (
              <>
                {/* AI Helper Component */}
                <div className="flex-1 overflow-hidden min-h-0">
                  <AIHelper />
                </div>

                {/* Compact Footer */}
                <div className="px-3 py-2 bg-gray-50/80 border-t border-gray-100">
                  <div className="flex items-center justify-center text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Powered by Gemini AI</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Minimized State */}
            {minimized && (
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600 font-medium">AI Assistant ready</span>
                </div>
                <button
                  onClick={() => setMinimized(false)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Expand
                </button>
              </div>
            )}
          </div>

          {/* Subtle backdrop glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl blur-lg -z-10 transform scale-105"></div>
        </div>
      )}

      {/* Background overlay when chat is open (for mobile) */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[2998] md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}