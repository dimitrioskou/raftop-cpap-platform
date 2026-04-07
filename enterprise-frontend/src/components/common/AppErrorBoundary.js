import React from 'react';

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#f8fafc',
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 760,
    borderRadius: 24,
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
    padding: 28
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#64748b',
    marginBottom: 8
  },
  title: {
    fontSize: 30,
    fontWeight: 900,
    color: '#0f172a',
    lineHeight: 1.05,
    marginBottom: 10
  },
  text: {
    fontSize: 14,
    lineHeight: 1.75,
    color: '#475569'
  },
  box: {
    marginTop: 20,
    borderRadius: 18,
    background: '#fff7ed',
    border: '1px solid #fdba74',
    padding: 16
  },
  boxTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#9a3412',
    marginBottom: 6
  },
  boxText: {
    fontSize: 13,
    lineHeight: 1.7,
    color: '#7c2d12',
    wordBreak: 'break-word'
  },
  actions: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: 22
  },
  primaryButton: {
    border: 'none',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 800,
    background: '#2563eb',
    color: '#ffffff',
    cursor: 'pointer'
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 800,
    background: '#ffffff',
    color: '#0f172a',
    cursor: 'pointer'
  }
};

class AppErrorBoundary extends React.Component {
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
      errorMessage: error?.message || 'Unknown application error.'
    };
  }

  componentDidCatch(error, info) {
    if (typeof console !== 'undefined') {
      console.error('RAFTOP AppErrorBoundary caught an error:', error, info);
    }
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/tenant/dashboard');
    }
  };

  render() {
    const { hasError, errorMessage } = this.state;

    if (!hasError) {
      return this.props.children;
    }

    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.eyebrow}>RAFTOP Enterprise</div>
          <div style={styles.title}>Something went wrong</div>
          <div style={styles.text}>
            The application hit an unexpected runtime error. The safest next step is to reload
            the page or return to the tenant dashboard.
          </div>

          <div style={styles.box}>
            <div style={styles.boxTitle}>Error details</div>
            <div style={styles.boxText}>{errorMessage}</div>
          </div>

          <div style={styles.actions}>
            <button type="button" style={styles.primaryButton} onClick={this.handleReload}>
              Reload App
            </button>

            <button type="button" style={styles.secondaryButton} onClick={this.handleGoHome}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;