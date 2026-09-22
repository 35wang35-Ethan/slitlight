// Public browser configuration only. Never put secret keys in this file.
window.slitConfig = Object.freeze({
  turnstileSiteKey: ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? '1x00000000000000000000AA'
    : window.location.hostname === 'slitlight-preview.35wang35.workers.dev'
      ? '0x4AAAAAAE_rZuKDTqZsq2S6'
      : '0x4AAAAAAEROEgjkcLRtS3x6'
});
