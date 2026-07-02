import React from "react";
import { ShieldAlert, RefreshCw, Home } from "lucide-react";

interface Props {
  children?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught runtime error in React tree:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 animate-pulse">
                <ShieldAlert className="h-7 w-7" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">Ha ocurrido una excepción inesperada</h2>
              <p className="text-slate-500 text-sm">
                La Consola Operativa de VetGuard ha detectado un fallo en tiempo de ejecución. 
                Los datos de tu sesión están protegidos.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-h-40 overflow-y-auto">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Detalle Técnico del Error</p>
                <code className="text-xs text-rose-600 font-mono break-all whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Re-iniciar Módulo</span>
              </button>
              
              <button
                type="button"
                onClick={() => { window.location.href = "/"; }}
                className="w-full sm:w-auto border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2.5 px-5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="h-4 w-4" />
                <span>Ir al Inicio</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
