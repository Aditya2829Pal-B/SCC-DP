# AWS EKS Enterprise Architecture for SCC&DP
# Provides Multi-AZ High Availability, Auto-Scaling, and Disaster Recovery

provider "aws" {
  region = var.aws_region
}

# ── VPC & Networking ──
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.1"

  name = "sccdp-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = false
  enable_dns_hostnames = true
}

# ── EKS Cluster (Compute) ──
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "sccdp-production-cluster"
  cluster_version = "1.28"

  vpc_id                         = module.vpc.vpc_id
  subnet_ids                     = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 3
      max_size     = 10

      instance_types = ["t3.xlarge"]
      capacity_type  = "ON_DEMAND"
    }
    # GPU node group for ML/BERT Inference
    ml_inference = {
      desired_size = 2
      min_size     = 1
      max_size     = 5

      instance_types = ["g4dn.xlarge"]
      capacity_type  = "ON_DEMAND"
    }
  }
}

# ── Elasticache Redis ──
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "sccdp-redis-cluster"
  engine               = "redis"
  node_type            = "cache.t3.medium"
  num_cache_nodes      = 2
  parameter_group_name = "default.redis7"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis_sg.id]
  subnet_group_name    = aws_elasticache_subnet_group.redis_subnet.name
}

resource "aws_elasticache_subnet_group" "redis_subnet" {
  name       = "sccdp-redis-subnet"
  subnet_ids = module.vpc.private_subnets
}

# ── S3 Bucket for Media (Images/Documents) ──
resource "aws_s3_bucket" "media_bucket" {
  bucket = "sccdp-production-media-${var.environment}"
}

resource "aws_s3_bucket_versioning" "media_versioning" {
  bucket = aws_s3_bucket.media_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# ── CloudFront Distribution (Frontend & Media CDN) ──
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.media_bucket.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.media_bucket.id}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${aws_s3_bucket.media_bucket.id}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Note: MongoDB Atlas is managed via the MongoDB Atlas Terraform Provider separately
