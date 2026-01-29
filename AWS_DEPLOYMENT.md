# AWS Deployment Guide

This guide explains how to deploy the Learning App to AWS using the CI/CD pipeline.

## 📋 Prerequisites

Before deploying, you need:

1. **AWS Account** with appropriate permissions
2. **GitHub Repository** with the code
3. **AWS CLI** installed locally (for initial setup)
4. **Terraform** (optional, for infrastructure as code)

## 🏗️ AWS Infrastructure Setup

### 1. Create ECR Repositories

```bash
# Login to AWS
aws configure

# Create ECR repositories for your Docker images
aws ecr create-repository \
    --repository-name learningapp-backend \
    --region us-east-1

aws ecr create-repository \
    --repository-name learningapp-frontend \
    --region us-east-1
```

### 2. Create RDS Database

```bash
# Create a PostgreSQL RDS instance
aws rds create-db-instance \
    --db-instance-identifier learningapp-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --engine-version 15.5 \
    --master-username postgres \
    --master-user-password ikms26_1 \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-0b499ec071f15adf9 \
    --db-subnet-group-name your-subnet-group \
    --backup-retention-period 7 \
    --publicly-accessible false
```

### 3. Create ECS Cluster

```bash
# Create an ECS cluster
aws ecs create-cluster \
    --cluster-name learningapp-cluster \
    --region us-east-1
```

### 4. Create Task Definition

Create a file `task-definition.json`:

```json
{
  "family": "learningapp-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ECR_REGISTRY/learningapp-backend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "ALGORITHM",
          "value": "HS256"
        },
        {
          "name": "ACCESS_TOKEN_EXPIRE_MINUTES",
          "value": "30"
        },
        {
          "name": "REFRESH_TOKEN_EXPIRE_DAYS",
          "value": "7"
        },
        {
          "name": "FRONTEND_URL",
          "value": "https://your-domain.com"
        },
        {
          "name": "ALLOWED_ORIGINS",
          "value": "[\"https://your-domain.com\"]"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:learningapp/database_url"
        },
        {
          "name": "SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:learningapp/secret_key"
        },
        {
          "name": "GOOGLE_CLIENT_ID",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:learningapp/google_client_id"
        },
        {
          "name": "GOOGLE_CLIENT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:learningapp/google_client_secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/learningapp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "backend"
        }
      }
    },
    {
      "name": "frontend",
      "image": "YOUR_ECR_REGISTRY/learningapp-frontend:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NEXT_PUBLIC_API_URL",
          "value": "https://api.your-domain.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/learningapp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "frontend"
        }
      }
    }
  ]
}
```

Register the task definition:

```bash
aws ecs register-task-definition \
    --cli-input-json file://task-definition.json
```

### 5. Create ECS Service

```bash
aws ecs create-service \
    --cluster learningapp-cluster \
    --service-name learningapp-service \
    --task-definition learningapp-task \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:xxx:targetgroup/xxx,containerName=frontend,containerPort=3000" \
    --region us-east-1
```

### 6. Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
    --name learningapp-alb \
    --subnets subnet-xxx subnet-yyy \
    --security-groups sg-xxx \
    --scheme internet-facing \
    --type application

# Create Target Groups
aws elbv2 create-target-group \
    --name learningapp-frontend-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id vpc-xxx \
    --target-type ip \
    --health-check-path /

aws elbv2 create-target-group \
    --name learningapp-backend-tg \
    --protocol HTTP \
    --port 8000 \
    --vpc-id vpc-xxx \
    --target-type ip \
    --health-check-path /health

# Create Listeners with path-based routing
aws elbv2 create-listener \
    --load-balancer-arn
    
    arn:aws:elasticloadbalancing:us-east-1:637436418876:loadbalancer/app/learningapp-alb/1e27e1efc818120b \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:637436418876:targetgroup/learningapp-frontend-tg/3197adb882b2e249

# Create Path-based Routing Rule for Backend
aws elbv2 create-rule \
    --listener-arn <LISTENER_ARN> \
    --priority 1 \
    --conditions "Field=path-pattern,Values='/api/*','/docs','/openapi.json','/redoc','/uploads/*'" \
    --actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:637436418876:targetgroup/learningapp-backend-tg/bd83cc2bd41a83ac
```

## 🔐 GitHub Secrets Setup

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

### Required Secrets:

1. **AWS_ACCESS_KEY_ID**: Your AWS access key
2. **AWS_SECRET_ACCESS_KEY**: Your AWS secret key
3. **NEXT_PUBLIC_API_URL**: `http://learningapp-alb-1516781955.us-east-1.elb.amazonaws.com/api/v1`

### Application URL:

Your application will be live at: [http://learningapp-alb-1516781955.us-east-1.elb.amazonaws.com](http://learningapp-alb-1516781955.us-east-1.elb.amazonaws.com)

## 🚦 Deploying

### Automatic Deployment

Push to the `main` branch to trigger automatic deployment:

```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

### Manual Deployment

Trigger the workflow manually from GitHub Actions UI:

1. Go to your repository on GitHub
2. Click on "Actions" tab
3. Select "Deploy to AWS" workflow
4. Click "Run workflow"
5. Select branch and click "Run workflow"

## 🔍 Monitoring

### View Logs

```bash
# View ECS service logs
aws logs tail /ecs/learningapp --follow

# View specific container logs
aws logs tail /ecs/learningapp/backend --follow
aws logs tail /ecs/learningapp/frontend --follow
```

### Check Service Status

```bash
# Check ECS service status
aws ecs describe-services \
    --cluster learningapp-cluster \
    --services learningapp-service

# Check running tasks
aws ecs list-tasks \
    --cluster learningapp-cluster \
    --service-name learningapp-service
```

## 🛠️ Troubleshooting

### Common Issues

1. **Task fails to start**
   - Check CloudWatch logs for error messages
   - Verify secrets are properly configured
   - Check security group rules

2. **Health check failures**
   - Verify the health check path is correct
   - Check if the container is listening on the correct port
   - Review security group inbound rules

3. **Database connection issues**
   - Verify RDS security group allows ECS tasks
   - Check DATABASE_URL format
   - Ensure RDS is in the same VPC

### Rollback

If deployment fails, rollback to previous version:

```bash
# List task definition revisions
aws ecs list-task-definitions --family-prefix learningapp-task

# Update service to use previous revision
aws ecs update-service \
    --cluster learningapp-cluster \
    --service learningapp-service \
    --task-definition learningapp-task:PREVIOUS_REVISION
```

## 💰 Cost Optimization

- Use **Fargate Spot** for non-production environments
- Enable **Auto Scaling** based on CPU/Memory metrics
- Use **RDS Reserved Instances** for production database
- Consider **CloudFront** for static asset caching
- Enable **S3 lifecycle policies** for log retention

## 🔒 Security Best Practices

1. ✅ Use **AWS Secrets Manager** for sensitive data
2. ✅ Enable **VPC Flow Logs** for network monitoring
3. ✅ Use **WAF** on ALB for protection
4. ✅ Enable **CloudTrail** for audit logging
5. ✅ Implement **IAM least privilege** roles
6. ✅ Use **HTTPS** with ACM certificates
7. ✅ Enable **RDS encryption** at rest
8. ✅ Configure **Security Groups** properly

## 📈 Scaling

### Horizontal Scaling

```bash
# Update desired task count
aws ecs update-service \
    --cluster learningapp-cluster \
    --service learningapp-service \
    --desired-count 3
```

### Auto Scaling

Create auto-scaling policies based on metrics like CPU/Memory usage, request count, or custom CloudWatch metrics.

## 🔄 Database Migrations

Run migrations as a one-off task:

```bash
# Create a migration task
aws ecs run-task \
    --cluster learningapp-cluster \
    --task-definition learningapp-migration-task \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx]}"
```

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [GitHub Actions for AWS](https://github.com/aws-actions)
- [Terraform AWS Modules](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
