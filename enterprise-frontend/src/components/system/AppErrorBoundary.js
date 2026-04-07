import React from 'react';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: ''
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unknown runtime error'
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AppErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <div
            style={{
              maxWidth: 860,
              width: '100%',
              background: '#ffffff',
              borderRadius: 20,
              padding: 24,
              border: '1px solid #fecaca',
              boxShadow: '0 10px 30px rgba(15,23,42,0.08)'
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#b91c1c',
                marginBottom: 8
              }}
            >
              Runtime error
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 900,
                color: '#0f172a'
              }}
            >
              The frontend crashed during render
            </h1>

            <p
              style={{
                margin: '10px 0 0',
                color: '#64748b',
                fontSize: 14,
                lineHeight: 1.8
              }}
            >
              Error:
            </p>

            <pre
              style={{
                marginTop: 12,
                padding: 16,
                background: '#fef2f2',
                borderRadius: 14,
                border: '1px solid #fecaca',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#991b1b',
                fontSize: 13,
                lineHeight: 1.7
              }}
            >
              {this.state.errorMessage}
            </pre>

            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16,
                border: 'none',
                borderRadius: 12,
                background: '#2563eb',
                color: '#ffffff',
                padding: '11px 14px',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}