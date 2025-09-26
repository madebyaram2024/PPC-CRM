# Pacific Paper Cups - Deployment Guide

This guide will help you deploy the Pacific Paper Cups Business Management System using GitHub and Coolify.

## 🚀 Deployment Workflow

### 1. **Local Development → GitHub**
   - Push your code to GitHub repository
   - GitHub Actions will build and test the application

### 2. **GitHub → Coolify**
   - Coolify connects to your GitHub repository
   - Automatically builds and deploys the application

### 3. **Coolify → Production Server**
   - Coolify manages the deployment on your server
   - Handles containerization, scaling, and monitoring

## 📋 Prerequisites

### System Requirements
- Node.js 18+
- Docker and Docker Compose
- Git
- A server with Coolify installed
- Domain name (optional, but recommended)

### Coolify Setup
1. Install Coolify on your server:
   ```bash
   bash <(curl -fsSL https://cdn.coollabs.io/coolify/install.sh)
   ```

2. Access Coolify web interface at `http://your-server-ip`

## 🛠️ Deployment Steps

### Step 1: Prepare Your Codebase

1. **Update Environment Variables**
   ```bash
   cp .env.example .env.production
   ```
   Edit `.env.production` with your production values.

2. **Build and Test Locally**
   ```bash
   npm install
   npm run build
   npm run lint
   ```

### Step 2: Push to GitHub

1. **Initialize Git Repository** (if not already done)
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Pacific Paper Cups Business Management System"
   ```

2. **Connect to GitHub**
   ```bash
   git remote add origin https://github.com/your-username/pacific-paper-cups.git
   git push -u origin main
   ```

### Step 3: Configure Coolify

1. **Create New Application**
   - Open Coolify web interface
   - Click "New Application"
   - Select "GitHub" as source
   - Choose your repository
   - Select "main" branch

2. **Configure Build Settings**
   - **Build Pack**: Dockerfile
   - **Dockerfile Path**: `./Dockerfile`
   - **Build Context**: `.`

3. **Set Environment Variables**
   ```bash
   NODE_ENV=production
   DATABASE_URL=file:./prod.db
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=your-super-secret-key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Configure Volumes**
   - **Uploads**: `/app/uploads`
   - **Database**: `/app/prod.db`

5. **Set Up Domain**
   - Add your domain (e.g., `app.your-domain.com`)
   - Enable automatic SSL (Let's Encrypt)

### Step 4: Deploy

1. **Start Deployment**
   - Click "Deploy" in Coolify
   - Wait for the build and deployment to complete

2. **Post-Deployment Setup**
   - Access your application at the configured domain
   - Run the database seed script to create the admin user
   - Test all functionality

## 🔧 Post-Deployment Configuration

### Database Setup

After deployment, you'll need to set up the database:

1. **Access Application Container**
   ```bash
   # In Coolify, access the container terminal
   # or use docker exec
   docker exec -it <container-name> sh
   ```

2. **Run Database Seed**
   ```bash
   npm run db:seed
   ```

3. **Create Admin User**
   The seed script will create an admin user with:
   - Email: `admin@pacificcups.com` or `admin@pacificpapercups.com`
   - Password: `admin123` (change immediately)

### Security Configuration

1. **Change Default Password**
   - Log in as admin
   - Go to User Management
   - Change the admin password

2. **Set Up SSL**
   - Coolify automatically handles SSL with Let's Encrypt
   - Ensure your domain is properly configured

3. **Configure Backups**
   - Set up database backups
   - Configure file upload backups

## 📊 Monitoring and Maintenance

### Application Monitoring

Coolify provides built-in monitoring:
- **Health Checks**: `/api/health` endpoint
- **Resource Usage**: CPU, Memory, Disk
- **Logs**: Application and system logs

### Backup Strategy

1. **Database Backups**
   ```bash
   # Create backup
   sqlite3 prod.db ".backup backup-$(date +%Y%m%d).db"
   ```

2. **File Backups**
   ```bash
   # Backup uploads
   tar -czf uploads-$(date +%Y%m%d).tar.gz uploads/
   ```

### Updates and Maintenance

1. **Update Application**
   - Push changes to GitHub
   - Coolify will automatically redeploy

2. **Database Migrations**
   ```bash
   # In container
   npx prisma db push
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Dockerfile syntax
   - Verify all dependencies are in package.json
   - Check build logs in Coolify

2. **Database Connection Issues**
   - Verify DATABASE_URL
   - Check database file permissions
   - Ensure proper volume mounting

3. **Environment Variables**
   - Double-check all environment variables
   - Ensure NEXTAUTH_URL matches your domain

### Debug Commands

```bash
# Check application logs
docker logs <container-name>

# Access container shell
docker exec -it <container-name> sh

# Check database
sqlite3 prod.db ".tables"

# Test health endpoint
curl https://your-domain.com/api/health
```

## 🔒 Security Best Practices

### Application Security
- Use strong passwords for admin accounts
- Enable HTTPS (handled by Coolify)
- Regularly update dependencies
- Implement rate limiting

### Server Security
- Use firewall rules
- Regular system updates
- Monitor access logs
- Implement intrusion detection

### Data Security
- Encrypt sensitive data
- Regular backups
- Access control
- Audit logging

## 📈 Scaling

### Horizontal Scaling
- Coolify supports multiple replicas
- Load balancing with reverse proxy
- Database scaling (consider PostgreSQL for high traffic)

### Vertical Scaling
- Increase resource limits in Coolify
- Optimize database queries
- Use caching strategies

## 🎯 Production Checklist

- [ ] Set up domain and SSL
- [ ] Configure environment variables
- [ ] Create admin user
- [ ] Test all features
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Implement security measures
- [ ] Test deployment rollback
- [ ] Document maintenance procedures

## 📞 Support

For deployment issues:
1. Check Coolify documentation
2. Review application logs
3. Test with local Docker setup
4. Contact support if needed

---

**Note**: This deployment guide assumes you have Coolify installed on your server. If you haven't installed Coolify yet, please refer to the [Coolify documentation](https://coolify.io/docs).