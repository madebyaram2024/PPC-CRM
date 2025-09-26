# PPP CRM - Coolify Deployment Guide

## Prerequisites
- Coolify instance running on your VPS
- Docker installed on Coolify server
- Domain name pointed to your VPS

## Quick Deploy Steps

### 1. Environment Variables
Set these in your Coolify dashboard **before deployment**:

```env
NODE_ENV=production
DATABASE_URL=file:./prod.db
NEXTAUTH_URL=https://your-app-name.coolify-subdomain.com
NEXTAUTH_SECRET=your-super-secret-key-generate-one
SMTP_HOST=smtp.gmail.com                  # Optional
SMTP_PORT=587                            # Optional
SMTP_USER=your-email@gmail.com           # Optional
SMTP_PASS=your-app-password              # Optional
```

**Generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Update Domain
Edit `coolify.yaml` line 59:
```yaml
domains:
  - domain: your-actual-domain.com
```

### 3. Deploy
1. Connect your Git repository to Coolify
2. Use the included `coolify.yaml` configuration
3. Set environment variables in Coolify dashboard
4. Deploy!

## Database Setup
The app uses SQLite by default (no external database needed).
- Database file stored in persistent volume
- Migrations are applied automatically on first run

## File Uploads
- Upload directory mounted as persistent volume
- Files survive container restarts

## Health Check
- Health endpoint: `/api/health`
- Coolify monitors app health automatically

## Security Features
✅ Dependencies updated and vulnerabilities fixed
✅ Read-only filesystem (where possible)
✅ Non-root user execution
✅ Minimal capabilities

## Post-Deploy Checklist
- [ ] Verify app is accessible at your domain
- [ ] Test login functionality
- [ ] Check database connectivity
- [ ] Verify file upload works
- [ ] Monitor logs for any errors

## Troubleshooting

### Common Issues
1. **Build fails**: Check Docker logs in Coolify
2. **App won't start**: Verify environment variables
3. **Database errors**: Check file permissions for SQLite
4. **Auth issues**: Verify NEXTAUTH_URL matches your domain

### Logs
Monitor application logs in Coolify dashboard for detailed error messages.