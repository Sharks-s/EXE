
export function ClosingOverlay() {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                <p className="text-white text-sm font-semibold">Closing...</p>
            </div>
        </div>
    );
}