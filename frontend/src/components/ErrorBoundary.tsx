import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, showDetails: false });
    this.props.onReset?.();
  };

  private handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `Error: ${error?.message || "Unknown error"}
Stack: ${error?.stack || "No stack trace"}
Component Stack: ${errorInfo?.componentStack || "No component stack"}`;

    navigator.clipboard.writeText(errorText).then(() => {
      // Could show a toast here
    });
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;
      const { fallbackMessage = "Произошла ошибка при загрузке данных" } = this.props;

      return (
        <div className="p-6 rounded-xl border border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-destructive mb-1">{fallbackMessage}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {error?.message || "Неизвестная ошибка"}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={this.handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Попробовать снова
                </Button>
                <Button variant="ghost" size="sm" onClick={this.handleCopyError}>
                  <Copy className="w-4 h-4 mr-2" />
                  Копировать ошибку
                </Button>
                <Button variant="ghost" size="sm" onClick={this.toggleDetails}>
                  {showDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Скрыть детали
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Показать детали
                    </>
                  )}
                </Button>
              </div>

              {showDetails && (
                <div className="mt-4 space-y-3">
                  {error?.stack && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Stack Trace:</p>
                      <pre className="text-xs bg-background/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto border border-border/50">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Component Stack:</p>
                      <pre className="text-xs bg-background/50 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto border border-border/50">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallbackMessage?: string
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallbackMessage={fallbackMessage}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}
