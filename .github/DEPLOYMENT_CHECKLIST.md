# AWS Deployment Checklist

## 🎯 Pre-Deployment Checklist

### AWS Infrastructure

- [ ] AWS Account created and configured
- [ ] AWS CLI installed and configured locally
- [ ] VPC and subnets configured
- [ ] Security groups created
- [ ] ECR repositories created (backend & frontend)
- [ ] RDS PostgreSQL instance created
- [ ] ECS cluster created
- [ ] Task definitions registered
- [ ] ECS service created
- [ ] Application Load Balancer configured
- [ ] Target groups created and configured
- [ ] SSL/TLS certificate obtained (ACM)
- [ ] Route 53 DNS configured (if using custom domain)
- [ ] CloudWatch log groups created
- [ ] IAM roles created (task execution & task role)

### Secrets Management

- [ ] AWS Secrets Manager configured
- [ ] Database credentials stored in Secrets Manager
- [ ] JWT secret key generated and stored
- [ ] Google OAuth credentials stored
- [ ] All sensitive environment variables secured

### GitHub Setup

- [ ] Repository pushed to GitHub
- [ ] GitHub Actions workflows committed
- [ ] GitHub Secrets configured:
  - [ ] AWS_ACCESS_KEY_ID
  - [ ] AWS_SECRET_ACCESS_KEY
  - [ ] NEXT_PUBLIC_API_URL
  - [ ] (Optional) Additional secrets

### Application Configuration

- [ ] `.env` file NOT committed to git
- [ ] `.gitignore` properly configured
- [ ] Docker images build successfully locally
- [ ] Database migrations prepared
- [ ] Seed data script ready (if needed)
- [ ] Health check endpoints implemented

### Security

- [ ] Security groups configured (principle of least privilege)
- [ ] RDS not publicly accessible
- [ ] IAM policies follow least privilege
- [ ] Secrets rotation policy configured
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting configured (if applicable)

## 🚀 Deployment Steps

### 1. Initial Setup

1. [ ] Clone repository locally
2. [ ] Run `aws configure` and verify credentials
3. [ ] Create all AWS resources (see AWS_DEPLOYMENT.md)
4. [ ] Test database connectivity

### 2. Configure GitHub Actions

1. [ ] Push code to GitHub
2. [ ] Add required secrets to repository
3. [ ] Verify workflow files are present
4. [ ] Test PR checks workflow on a test branch

### 3. First Deployment

1. [ ] Merge to `main` branch
2. [ ] Monitor GitHub Actions workflow
3. [ ] Verify images pushed to ECR
4. [ ] Check ECS task deployment
5. [ ] Verify service health in ECS console

### 4. Post-Deployment

1. [ ] Run database migrations
2. [ ] Seed initial data (if needed)
3. [ ] Test all API endpoints
4. [ ] Test frontend accessibility
5. [ ] Verify Google OAuth flow
6. [ ] Check CloudWatch logs
7. [ ] Test user registration/login
8. [ ] Verify course content loads

### 5. DNS & SSL

1. [ ] Point domain to ALB
2. [ ] Verify HTTPS certificate
3. [ ] Test with custom domain
4. [ ] Update CORS and OAuth redirect URLs

## ✅ Post-Deployment Verification

### Backend Health

- [ ] Backend health endpoint returns 200
- [ ] Database connection successful
- [ ] API endpoints responding correctly
- [ ] Authentication working
- [ ] Google OAuth flow working

### Frontend Health

- [ ] Frontend loads successfully
- [ ] Static assets loading
- [ ] API calls working
- [ ] Authentication flow working
- [ ] Course content displays

### Monitoring

- [ ] CloudWatch logs streaming
- [ ] ALB health checks passing
- [ ] ECS tasks running
- [ ] No error alerts
- [ ] Performance metrics normal

### Security Scan

- [ ] No secrets exposed in logs
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CORS configured correctly
- [ ] Rate limiting working (if configured)

## 🔄 Regular Maintenance

### Daily

- [ ] Check CloudWatch alarms
- [ ] Review error logs
- [ ] Monitor service health

### Weekly

- [ ] Review cost reports
- [ ] Check for security patches
- [ ] Review access logs
- [ ] Backup verification

### Monthly

- [ ] Rotate secrets
- [ ] Review and update dependencies
- [ ] Performance optimization review
- [ ] Cost optimization review
- [ ] Security audit

## 📊 Rollback Plan

If deployment fails:

1. [ ] Check GitHub Actions logs
2. [ ] Check CloudWatch logs
3. [ ] Identify the issue
4. [ ] Rollback to previous task definition if needed
5. [ ] Fix the issue
6. [ ] Redeploy

**Rollback Command:**

```bash
aws ecs update-service \
    --cluster learningapp-cluster \
    --service learningapp-service \
    --task-definition learningapp-task:PREVIOUS_REVISION
```

## 🆘 Emergency Contacts

- AWS Support: [AWS Support Link]
- DevOps Team: [Contact Info]
- Database Admin: [Contact Info]
- Security Team: [Contact Info]

## 📝 Notes

- Always test in a staging environment first
- Keep this checklist updated
- Document any issues encountered
- Share learnings with the team
