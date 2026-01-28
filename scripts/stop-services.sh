#!/bin/bash
# Stop AWS services to save money

echo "🛑 Stopping AWS services to save money..."

# Scale ECS service to 0
aws ecs update-service \
    --cluster learningapp-cluster \
    --service learningapp-service \
    --desired-count 0 \
    --region us-east-1

echo "✅ Services stopped!"
echo "💰 You're now saving money on compute costs!"
echo "📊 Current month estimated savings: Check AWS Cost Explorer"
echo ""
echo "To start services again, run: ./scripts/start-services.sh"
