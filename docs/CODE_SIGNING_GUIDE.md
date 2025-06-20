# Code Signing Guide

This guide explains how to sign the JoyRide Name Display executable to avoid Windows security warnings and build user trust.

## Why Code Signing Matters

### Security Benefits
- **Eliminates "Unknown Publisher" warnings**
- **Prevents SmartScreen filtering**
- **Builds user trust and confidence**
- **Required for enterprise deployment**
- **Enables automatic updates**

### User Experience
- **No security prompts on first run**
- **Smooth installation process**
- **Professional appearance**
- **Reduced support requests**

## Certificate Options

### Commercial Certificates (Recommended)

**DigiCert Code Signing Certificate**
- **Cost**: $400-600/year
- **Trust Level**: Highest
- **Features**: EV certificate, hardware token
- **Best for**: Production applications

**Sectigo Code Signing Certificate**
- **Cost**: $200-400/year
- **Trust Level**: High
- **Features**: Standard certificate
- **Best for**: Most applications

**GlobalSign Code Signing Certificate**
- **Cost**: $300-500/year
- **Trust Level**: High
- **Features**: EV certificate available
- **Best for**: Enterprise applications

**Comodo Code Signing Certificate**
- **Cost**: $100-300/year
- **Trust Level**: Good
- **Features**: Standard certificate
- **Best for**: Budget-conscious projects

### Self-Signed Certificates (Development Only)

**For Testing Purposes**
- **Cost**: Free
- **Trust Level**: None (still shows warnings)
- **Use Case**: Internal testing only

## Obtaining a Certificate

### Step 1: Choose a Certificate Authority
1. **Research providers** (DigiCert, Sectigo, GlobalSign, Comodo)
2. **Compare pricing** and features
3. **Select certificate type** (Standard vs EV)
4. **Purchase certificate**

### Step 2: Complete Verification
1. **Submit business documentation**
2. **Complete identity verification**
3. **Receive certificate files**
4. **Install certificate on build machine**

### Step 3: Install Certificate
```bash
# Import PFX certificate
certutil -importpfx your-certificate.pfx

# Or use Windows Certificate Manager
# Right-click certificate → Install Certificate → Local Machine
```

## Configuration

### Environment Variables

Set these environment variables before building:

```bash
# For PFX certificate file
set CODE_SIGNING_CERT_PATH=C:\path\to\your-certificate.pfx
set CODE_SIGNING_CERT_PASSWORD=your-certificate-password

# Alternative: For certificate in Windows Certificate Store
set CODE_SIGNING_CERT_NAME=Your Certificate Name
```

### Forge Configuration

The `forge.config.js` is already configured for code signing:

```javascript
{
  name: '@electron-forge/maker-squirrel',
  config: {
    certificateFile: process.env.CODE_SIGNING_CERT_PATH,
    certificatePassword: process.env.CODE_SIGNING_CERT_PASSWORD,
  },
}
```

## Building with Code Signing

### Prerequisites
1. **Certificate installed** on build machine
2. **Environment variables set**
3. **Build machine has internet access** (for timestamping)

### Build Process

```bash
# Set environment variables
set CODE_SIGNING_CERT_PATH=C:\certs\joyride-cert.pfx
set CODE_SIGNING_CERT_PASSWORD=your-password

# Build with signing
npm run make
```

### Verification

After building, verify the signature:

```bash
# Check signature
signtool verify /pa "out\JoyRide Cars Name Display Setup 1.2.0.exe"

# View certificate details
signtool verify /v "out\JoyRide Cars Name Display Setup 1.2.0.exe"
```

## Troubleshooting

### Common Issues

**Certificate Not Found**
```
Error: Could not find certificate
```
**Solution**: Verify certificate path and password

**Invalid Certificate**
```
Error: Certificate is not valid for code signing
```
**Solution**: Ensure certificate is a code signing certificate

**Timestamping Failed**
```
Error: Could not timestamp signature
```
**Solution**: Check internet connection and timestamp server

**Password Incorrect**
```
Error: Invalid certificate password
```
**Solution**: Verify certificate password

### Debug Commands

```bash
# List installed certificates
certmgr.msc

# View certificate details
certutil -dump your-certificate.pfx

# Test signing manually
signtool sign /f your-certificate.pfx /p password /t http://timestamp.digicert.com file.exe
```

## Security Best Practices

### Certificate Management
1. **Store certificates securely** (encrypted storage)
2. **Use strong passwords** for certificate files
3. **Limit access** to certificate files
4. **Backup certificates** safely
5. **Monitor certificate expiration**

### Build Security
1. **Use dedicated build machine** for signing
2. **Secure build environment** (no shared access)
3. **Log all signing operations**
4. **Verify signatures** after building
5. **Use timestamping** for long-term validity

### Distribution Security
1. **Verify signatures** before distribution
2. **Use secure channels** for file transfer
3. **Monitor for tampering**
4. **Keep signing keys offline**
5. **Rotate certificates** regularly

## Cost Considerations

### Certificate Costs (Annual)
- **DigiCert**: $400-600
- **Sectigo**: $200-400
- **GlobalSign**: $300-500
- **Comodo**: $100-300

### Additional Costs
- **Hardware tokens** (EV certificates): $50-100
- **Certificate management tools**: $50-200
- **Support and maintenance**: $100-300

### ROI Benefits
- **Reduced support calls**: $500-2000/year
- **Improved user adoption**: 20-50% increase
- **Professional reputation**: Priceless
- **Enterprise compatibility**: Required for many deployments

## Alternative Solutions

### For Development/Testing
1. **Use self-signed certificates** (free but shows warnings)
2. **Test on development machines** only
3. **Document security warnings** for users
4. **Plan for production signing**

### For Small Organizations
1. **Start with Comodo** (lowest cost)
2. **Upgrade to EV certificate** later
3. **Share certificate costs** across projects
4. **Consider certificate sharing** within organization

## Implementation Timeline

### Week 1: Research and Purchase
- Research certificate providers
- Purchase certificate
- Complete verification process

### Week 2: Setup and Testing
- Install certificate on build machine
- Configure environment variables
- Test signing process
- Verify signatures

### Week 3: Production Deployment
- Sign production builds
- Distribute signed executables
- Monitor for issues
- Document procedures

## Next Steps

1. **Choose a certificate provider** based on your budget and needs
2. **Purchase and install certificate**
3. **Configure build environment**
4. **Test signing process**
5. **Deploy signed application**

The code signing configuration is already in place in your `forge.config.js`. Once you have a certificate, you can start signing your builds immediately. 