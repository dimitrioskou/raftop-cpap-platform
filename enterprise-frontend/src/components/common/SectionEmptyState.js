import React from 'react';

const styles = {
  wrap: {
    borderRadius: 18,
    border: '1px dashed #cbd5e1',
    background: '#f8fafc',
    padding: 24,
    textAlign: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: 900,
    color: '#0f172a',
    marginBottom: 8
  },
  text: {
    fontSize: 13,
    lineHeight: 1.7,
    color: '#64748b',
    maxWidth: 520,
    margin: '0 auto'
  }
};

export default function SectionEmptyState({
  title = 'No data available',
  text = 'There is no data to display in this section yet.'
}) {
  return (
    <div style={styles.wrap}>
      <div style={styles.title}>{title}</div>
      <div style={styles.text}>{text}</div>
    </div>
  );
}