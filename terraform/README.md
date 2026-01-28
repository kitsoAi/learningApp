# Terraform Quick Start Guide

## Prerequisites

1. Install Terraform: https://www.terraform.io/downloads
2. Install AWS CLI: https://aws.amazon.com/cli/
3. Configure AWS credentials: `aws configure`

## Initial Setup

### 1. Create S3 bucket for Terraform state (one-time)

```bash
aws s3 mb s3://learningapp-terraform-state --region us-east-1
aws s3api put-bucket-versioning \
    --bucket learningapp-terraform-state \
    --versioning-configuration Status=Enabled
```

### 2. Create terraform.tfvars file

Create `terraform/terraform.tfvars`:

```hcl
aws_region      = "us-east-1"
environment     = "prod"
app_name        = "learningapp"
db_password     = "YourSecurePassword123!"  # Change this!
domain_name     = "your-domain.com"         # Optional
certificate_arn = "arn:aws:acm:..."         # Optional, for HTTPS
```

**Important**: Never commit `terraform.tfvars` to git!

### 3. Initialize Terraform

```bash
cd terraform
terraform init
```

### 4. Plan the deployment

```bash
terraform plan
```

Review the planned changes carefully.

### 5. Apply the configuration

```bash
terraform apply
```

Type `yes` when prompted.

## Deployment will create:

- ✅ VPC with public and private subnets
- ✅ NAT Gateway and Internet Gateway
- ✅ ECR repositories (backend & frontend)
- ✅ RDS PostgreSQL database
- ✅ ECS Cluster, Task Definition, and Service
- ✅ Application Load Balancer
- ✅ Security Groups
- ✅ IAM roles and policies
- ✅ CloudWatch log groups
- ✅ Secrets Manager secrets

## After deployment:

1. Note the ALB DNS name from outputs
2. Update your GitHub secrets with the ECR repository URLs
3. Push your code to trigger the CI/CD pipeline
4. Point your domain to the ALB (if using custom domain)

##Common Commands

```bash
# View current state
terraform show

# View outputs
terraform output

# Update infrastructure
terraform apply

# Destroy everything (BE CAREFUL!)
terraform destroy

# Format code
terraform fmt -recursive

# Validate configuration
terraform validate
```

## Costs Estimate

Approximate monthly costs for minimal setup:

- ECS Fargate (1 task, always on): ~$30
- RDS db.t3.micro: ~$15
- Application Load Balancer: ~$20
- Data transfer & misc: ~$10

**Total: ~$75/month**

For dev/staging, you can:

- Use smaller RDS instance
- Reduce desired task count to 0 when not in use
- Use Fargate Spot for additional savings

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning**: This will delete:

- All data in the database (unless final snapshot is enabled)
- All Docker images in ECR
- All logs in CloudWatch

Make sure you have backups before running destroy!
