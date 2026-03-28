import VideoUpload from '../../components/features/videos/VideoUpload';

export default function UploadPage() {
  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">

      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-300/30 dark:bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-300/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Subtle dot grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Content */}
      <div className="relative max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10 animate-[fadeInDown_0.5s_ease_both]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Creator Studio
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload a Video</h1>
          <p className="text-sm text-gray-400 dark:text-slate-500 mt-1.5">Share your content with the world</p>
        </div>

        {/* Upload card */}
        <div className="relative bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/60 dark:shadow-black/40 border border-white dark:border-slate-700/50 p-8 animate-[fadeInUp_0.5s_ease_both]">
          {/* Card corner glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />
          <div className="relative">
            <VideoUpload />
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
