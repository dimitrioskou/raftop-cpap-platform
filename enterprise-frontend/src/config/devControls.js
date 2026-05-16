export function isDangerousDevControlsEnabled() {
  try {
    const envValue = String(
      process.env.REACT_APP_SHOW_DANGEROUS_DEV_CONTROLS || ''
    ).toLowerCase();

    const localValue = String(
      localStorage.getItem('raftop_show_dangerous_dev_controls') || ''
    ).toLowerCase();

    return envValue === 'true' || localValue === 'true';
  } catch (error) {
    return String(
      process.env.REACT_APP_SHOW_DANGEROUS_DEV_CONTROLS || ''
    ).toLowerCase() === 'true';
  }
}

export function getDevControlsModeLabel() {
  return isDangerousDevControlsEnabled()
    ? 'DANGEROUS DEV CONTROLS: ON'
    : 'DANGEROUS DEV CONTROLS: OFF';
}