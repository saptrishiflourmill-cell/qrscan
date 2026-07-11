const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const os = require('os');

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) return net.address;
    }
  }
  return 'localhost';
}

function generateCert() {
  const pki = forge.pki;
  const keys = pki.rsa.generateKeyPair(2048);
  const cert = pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = Date.now().toString();
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

  const attrs = [{ name: 'commonName', value: getLocalIp() }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  cert.setExtensions([
    { name: 'basicConstraints', cA: true },
    { name: 'keyUsage', keyCertSign: true, digitalSignature: true, keyEncipherment: true },
    {
      name: 'subjectAltName',
      altNames: [
        { type: 2, value: 'localhost' },
        { type: 2, value: getLocalIp() }
      ]
    }
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  const certDir = path.join(__dirname);

  fs.writeFileSync(path.join(certDir, 'server.crt'), pki.certificateToPem(cert));
  fs.writeFileSync(path.join(certDir, 'server.key'), pki.privateKeyToPem(keys.privateKey));

  console.log('Self-signed certificate generated for ' + getLocalIp());
}

if (!fs.existsSync(path.join(__dirname, 'server.crt')) || !fs.existsSync(path.join(__dirname, 'server.key'))) {
  generateCert();
} else {
  console.log('Certificate already exists');
}
