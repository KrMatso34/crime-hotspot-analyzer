import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          fontFamily: 'monospace'
        }}>
          <h2 style={{ color: '#d32f2f' }}>⚠️ Application Error</h2>
          <p style={{ color: '#666', marginTop: '10px' }}>
            {this.state.error?.toString()}
          </p>
          {this.state.errorInfo && (
            <details style={{
              marginTop: '20px',
              backgroundColor: '#fff',
              padding: '15px',
              borderRadius: '4px',
              maxWidth: '90vw',
              overflow: 'auto',
              maxHeight: '300px',
              borderLeft: '4px solid #d32f2f'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
              <pre style={{ 
                marginTop: '10px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontSize: '12px',
                color: '#666'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
