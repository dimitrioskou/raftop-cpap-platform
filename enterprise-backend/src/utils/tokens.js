function encodeSessionPayload(payload) {
  const json = JSON.stringify(payload);
  return Buffer.from(json, 'utf8').toString('base64');
}

function decodeSessionPayload(token) {
  try {
    const json = Buffer.from(token, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

module.exports = {
  encodeSessionPayload,
  decodeSessionPayload
};