#!/usr/bin/env python3
"""
Recall Uplift v1 - Domain Management System
Manages domain policies for stepwise retrieval (Prefer/Exclude/Whitelist)
"""

import json
import logging
from typing import Dict, List, Set, Any, Tuple
from datetime import datetime
from dataclasses import dataclass
from urllib.parse import urlparse

@dataclass
class DomainMetrics:
    """Domain performance metrics"""
    domain: str
    total_impressions: int = 0
    total_clicks: int = 0
    ctr: float = 0.0
    avg_anshin_score: float = 0.0
    violations_count: int = 0
    recipe_type_confidence: float = 0.0
    schema_structured: bool = False

@dataclass
class DomainPolicy:
    """Domain policy configuration"""
    domain: str
    policy_type: str  # "prefer", "exclude", "whitelist", "neutral"
    boost_factor: float = 1.0
    reason: str = ""
    last_updated: datetime = None

class DomainManager:
    """Manages domain policies and metrics for recall uplift"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Initialize domain policies
        self.domain_policies = self._get_initial_domain_policies()
        
        # Performance metrics cache
        self.domain_metrics = {}
        
    def _get_initial_domain_policies(self) -> Dict[str, DomainPolicy]:
        """Initialize domain policies with known good/bad domains"""
        
        policies = {}
        
        # PREFER LIST - Domains with rich schema.org/Recipe structured data
        prefer_domains = [
            ("cookpad.com", 1.5, "Rich JSON-LD recipe schema, high recipe confidence"),
            ("kurashiru.com", 1.3, "Structured recipe data, good mobile UX"),
            ("delish-kitchen.tv", 1.3, "Video + structured recipe data"),
            ("ajinomoto.co.jp", 1.4, "Corporate recipe site with detailed nutrition"),
            ("recipe.rakuten.co.jp", 1.2, "Recipe aggregator with schema markup"),
            ("orangepage.net", 1.3, "Magazine recipe site with structured data"),
            ("kyounoryouri.jp", 1.4, "NHK recipe site, high editorial quality"),
            ("lettuceclub.net", 1.2, "Magazine recipes with good markup"),
            ("bob-an.com", 1.2, "Recipe magazine with structured data"),
            ("chefgohan.com", 1.1, "Chef recipes with good structure")
        ]
        
        for domain, boost, reason in prefer_domains:
            policies[domain] = DomainPolicy(
                domain=domain,
                policy_type="prefer",
                boost_factor=boost,
                reason=reason,
                last_updated=datetime.utcnow()
            )
        
        # EXCLUDE LIST - E-commerce, store locations, delivery services
        exclude_domains = [
            ("amazon.co.jp", 0.1, "E-commerce product pages"),
            ("rakuten.co.jp", 0.1, "E-commerce marketplace"),
            ("yahoo.co.jp", 0.1, "E-commerce and mixed content"),
            ("kakaku.com", 0.1, "Price comparison site"),
            ("tabelog.com", 0.2, "Restaurant reviews, not recipes"),
            ("gurunavi.com", 0.1, "Restaurant directory"),
            ("hotpepper.jp", 0.1, "Restaurant booking service"),
            ("ubereats.com", 0.1, "Food delivery service"),
            ("demae-can.com", 0.1, "Food delivery service"),
            ("menulist.menu", 0.1, "Restaurant menu aggregator"),
            ("retty.me", 0.2, "Restaurant discovery platform"),
            ("yelp.co.jp", 0.1, "Restaurant reviews"),
            ("r.gnavi.co.jp", 0.1, "Restaurant navigation"),
            ("s.tabelog.com", 0.1, "Restaurant subdomain")
        ]
        
        for domain, boost, reason in exclude_domains:
            policies[domain] = DomainPolicy(
                domain=domain,
                policy_type="exclude",
                boost_factor=boost,
                reason=reason,
                last_updated=datetime.utcnow()
            )
        
        # WHITELIST - Emergency fallback domains for diversity
        whitelist_domains = [
            ("allrecipes.com", 1.1, "International recipe site fallback"),
            ("food.com", 1.1, "Community recipe site fallback"),
            ("taste.com.au", 1.0, "International recipe fallback"),
            ("bbc.co.uk", 1.0, "BBC Good Food fallback"),
            ("allabout.co.jp", 1.0, "General lifestyle site with recipes")
        ]
        
        for domain, boost, reason in whitelist_domains:
            policies[domain] = DomainPolicy(
                domain=domain,
                policy_type="whitelist",
                boost_factor=boost,
                reason=reason,
                last_updated=datetime.utcnow()
            )
        
        return policies
    
    def get_domain_policy(self, url: str) -> DomainPolicy:
        """Get domain policy for a given URL"""
        try:
            domain = urlparse(url).netloc.lower()
            
            # Remove www. prefix
            if domain.startswith('www.'):
                domain = domain[4:]
            
            # Check exact match first
            if domain in self.domain_policies:
                return self.domain_policies[domain]
            
            # Check for subdomain matches
            for policy_domain, policy in self.domain_policies.items():
                if domain.endswith('.' + policy_domain) or domain == policy_domain:
                    return policy
            
            # Default neutral policy
            return DomainPolicy(
                domain=domain,
                policy_type="neutral",
                boost_factor=1.0,
                reason="No specific policy",
                last_updated=datetime.utcnow()
            )
            
        except Exception as e:
            self.logger.warning(f"Error parsing domain from URL {url}: {e}")
            return DomainPolicy(
                domain="unknown",
                policy_type="neutral", 
                boost_factor=1.0,
                reason="Parse error",
                last_updated=datetime.utcnow()
            )
    
    def apply_domain_boost(self, base_score: float, url: str, retrieval_pass: str) -> Tuple[float, str]:
        """Apply domain boost based on policy and retrieval pass"""
        
        policy = self.get_domain_policy(url)
        
        if retrieval_pass == "pass_2_prefer" and policy.policy_type == "prefer":
            boosted_score = base_score * policy.boost_factor
            boost_reason = f"prefer_boost_{policy.boost_factor}"
            return boosted_score, boost_reason
            
        elif retrieval_pass == "pass_3_exclude" and policy.policy_type == "exclude":
            boosted_score = base_score * policy.boost_factor
            boost_reason = f"exclude_penalty_{policy.boost_factor}"
            return boosted_score, boost_reason
            
        elif retrieval_pass == "pass_4_whitelist" and policy.policy_type == "whitelist":
            boosted_score = base_score * policy.boost_factor
            boost_reason = f"whitelist_boost_{policy.boost_factor}"
            return boosted_score, boost_reason
        
        return base_score, "no_boost"
    
    def should_exclude_domain(self, url: str, retrieval_pass: str) -> bool:
        """Check if domain should be excluded in current retrieval pass"""
        
        policy = self.get_domain_policy(url)
        
        # Hard exclude in pass 3 for exclude-list domains with very low boost
        if retrieval_pass == "pass_3_exclude" and policy.policy_type == "exclude":
            return policy.boost_factor < 0.2
        
        return False
    
    def get_domain_diversity_key(self, url: str) -> str:
        """Get domain key for diversity filtering"""
        try:
            domain = urlparse(url).netloc.lower()
            if domain.startswith('www.'):
                domain = domain[4:]
            return domain
        except:
            return "unknown"
    
    def update_domain_metrics(self, url: str, metrics: Dict[str, Any]):
        """Update performance metrics for a domain"""
        domain_key = self.get_domain_diversity_key(url)
        
        if domain_key not in self.domain_metrics:
            self.domain_metrics[domain_key] = DomainMetrics(domain=domain_key)
        
        domain_metric = self.domain_metrics[domain_key]
        
        # Update metrics
        domain_metric.total_impressions += metrics.get('impressions', 1)
        domain_metric.total_clicks += metrics.get('clicks', 0)
        
        if domain_metric.total_impressions > 0:
            domain_metric.ctr = domain_metric.total_clicks / domain_metric.total_impressions
        
        # Update average AnshinScore
        if 'anshin_score' in metrics:
            current_avg = domain_metric.avg_anshin_score
            new_score = metrics['anshin_score']
            # Running average
            domain_metric.avg_anshin_score = (current_avg + new_score) / 2
        
        # Track violations
        if metrics.get('has_violation', False):
            domain_metric.violations_count += 1
        
        # Track recipe confidence
        if 'recipe_confidence' in metrics:
            domain_metric.recipe_type_confidence = metrics['recipe_confidence']
        
        # Track schema structure
        if 'has_schema' in metrics:
            domain_metric.schema_structured = metrics['has_schema']
    
    def get_all_domain_metrics(self) -> List[DomainMetrics]:
        """Get all domain metrics for admin dashboard"""
        return list(self.domain_metrics.values())
    
    def get_domain_policies_by_type(self) -> Dict[str, List[DomainPolicy]]:
        """Get domain policies grouped by type"""
        grouped = {
            "prefer": [],
            "exclude": [],
            "whitelist": [],
            "neutral": []
        }
        
        for policy in self.domain_policies.values():
            grouped[policy.policy_type].append(policy)
        
        return grouped
    
    def add_or_update_domain_policy(self, domain: str, policy_type: str, boost_factor: float, reason: str):
        """Add or update a domain policy"""
        self.domain_policies[domain] = DomainPolicy(
            domain=domain,
            policy_type=policy_type,
            boost_factor=boost_factor,
            reason=reason,
            last_updated=datetime.utcnow()
        )
        self.logger.info(f"Updated domain policy: {domain} -> {policy_type} (boost: {boost_factor})")
    
    def remove_domain_policy(self, domain: str):
        """Remove a domain policy"""
        if domain in self.domain_policies:
            del self.domain_policies[domain]
            self.logger.info(f"Removed domain policy: {domain}")

# Global domain manager instance
domain_manager = DomainManager()

if __name__ == "__main__":
    # Test domain manager
    dm = DomainManager()
    
    test_urls = [
        "https://cookpad.com/recipe/123",
        "https://www.amazon.co.jp/product/456",
        "https://kurashiru.com/recipes/789",
        "https://tabelog.com/restaurant/abc"
    ]
    
    print("=== Domain Policy Testing ===")
    for url in test_urls:
        policy = dm.get_domain_policy(url)
        print(f"URL: {url}")
        print(f"  Domain: {policy.domain}")
        print(f"  Policy: {policy.policy_type}")
        print(f"  Boost: {policy.boost_factor}")
        print(f"  Reason: {policy.reason}")
        print()
        
        # Test boost application
        base_score = 75
        for pass_name in ["pass_1_broad", "pass_2_prefer", "pass_3_exclude", "pass_4_whitelist"]:
            boosted_score, boost_reason = dm.apply_domain_boost(base_score, url, pass_name)
            if boosted_score != base_score:
                print(f"  {pass_name}: {base_score} -> {boosted_score} ({boost_reason})")
    
    print(f"\nTotal domain policies: {len(dm.domain_policies)}")
    policies_by_type = dm.get_domain_policies_by_type()
    for policy_type, policies in policies_by_type.items():
        print(f"  {policy_type}: {len(policies)} domains")